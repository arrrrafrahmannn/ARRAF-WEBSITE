"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { clamp, follow, renderSize, sampleScene, sectionMotion } from "@/lib/scroll-scene";

import { materialVertex as vertex, materialFragment as fragment, particleVertex, particleFragment } from "@/lib/material-shaders";
import { particleSeeds, particleCount } from "@/lib/particle-field";

type Stage = { element: HTMLElement; top: number; height: number; index: number; active: boolean };

export default function LiquidSteel() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [enabled, setEnabled] = useState(true);
  const [solid, setSolid] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [failed, setFailed] = useState(false);
  const running = useRef(true);
  const path = usePathname();

  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const transparency = matchMedia("(prefers-reduced-transparency: reduce)");
    const contrast = matchMedia("(prefers-contrast: more)");
    const syncMotion = () => { setPrefersReduced(motion.matches); setEnabled(!motion.matches); };
    const syncContrast = () => setSolid(transparency.matches || contrast.matches);
    syncMotion(); syncContrast();
    try { if (sessionStorage.getItem("arrafed-motion") === "paused") setEnabled(false); if (sessionStorage.getItem("arrafed-glass") === "solid") setSolid(true); } catch { /* Preferences are optional. */ }
    motion.addEventListener("change", syncMotion); transparency.addEventListener("change", syncContrast); contrast.addEventListener("change", syncContrast);
    return () => { motion.removeEventListener("change", syncMotion); transparency.removeEventListener("change", syncContrast); contrast.removeEventListener("change", syncContrast); };
  }, []);

  useEffect(() => { running.current = enabled; document.documentElement.dataset.motion = enabled ? "live" : "still"; }, [enabled]);
  useEffect(() => { document.documentElement.dataset.glass = solid ? "solid" : "clear"; }, [solid]);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const root = document.documentElement;
    let frame = 0, disposed = false, scroll = window.scrollY, easedScroll = scroll, viewport = innerHeight, scrollRange = 1;
    let stages: Stage[] = [], measurePending = true, resizePending = true, last = 0, elapsed = 4, progress = 0;
    let x = 0, y = 0, targetX = 0, targetY = 0, quality = 1, slowFrames = 0, goodFrames = 0, sinceResize = 0, dirty = true, visualProgress = 0;
    const mobile = () => innerWidth < 760;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let gl: WebGLRenderingContext | null = null, program: WebGLProgram | null = null, buffer: WebGLBuffer | null = null;
    let vertexShader: WebGLShader | null = null, fragmentShader: WebGLShader | null = null;
    let uniforms: Record<string, WebGLUniformLocation | null> = {};
    let particleProgram: WebGLProgram | null = null, particleBuffer: WebGLBuffer | null = null;
    let particleVS: WebGLShader | null = null, particleFS: WebGLShader | null = null;
    let particleUniforms: Record<string, WebGLUniformLocation | null> = {};
    let positionAttribute = 0, seedAttribute = 0;
    function releaseParticles() { if (!gl) return; gl.deleteBuffer(particleBuffer); gl.deleteProgram(particleProgram); gl.deleteShader(particleVS); gl.deleteShader(particleFS); }

    function measure() {
      stages = Array.from(document.querySelectorAll<HTMLElement>("main > section, main > .page-intro, main > .service-catalogue, main > .service-body, main > .process-list, main > .pricing-table, main > .contact-layout, main > .about-statement, main > .studio-principles, main > .global-section, main > .faq-list, main > .legal-content, main > .admin-desk, .site-footer")).map((element, index) => {
        const rect = element.getBoundingClientRect();
        element.classList.add("scroll-stage"); element.dataset.stage = String(index % 6);
        return { element, top: rect.top + window.scrollY, height: rect.height, index, active: false };
      });
      viewport = innerHeight;
      scrollRange = Math.max(1, document.body.scrollHeight - viewport);
      measurePending = false; dirty = true;
    }
    function resize() {
      if (!gl) return;
      const rect = el!.getBoundingClientRect();
      const size = renderSize(rect.width, rect.height, devicePixelRatio || 1, quality);
      if (el!.width !== size.width || el!.height !== size.height) { el!.width = size.width; el!.height = size.height; gl.viewport(0, 0, size.width, size.height); }
      gl.uniform2f(uniforms.resolution, size.width, size.height);
      resizePending = false; sinceResize = 0; dirty = true;
    }
    function onScroll() { scroll = window.scrollY; dirty = true; }
    function onResize() { measurePending = true; resizePending = true; }
    function onPointer(e: PointerEvent) { if (e.pointerType === "touch") return; targetX = e.clientX / innerWidth - .5; targetY = .5 - e.clientY / innerHeight; }
    function onVisibility() { cancelAnimationFrame(frame); last = 0; if (!document.hidden && !disposed) { dirty = true; frame = requestAnimationFrame(draw); } }
    function fail() { setFailed(true); releaseParticles(); if (gl) { gl.deleteBuffer(buffer); gl.deleteProgram(program); gl.deleteShader(vertexShader); gl.deleteShader(fragmentShader); } gl = null; }
    function lose(e: Event) { e.preventDefault(); fail(); }
    try {
      gl = el.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: "high-performance" });
      if (!gl) throw Error("WebGL unavailable");
      const compile = (type: number, source: string) => { const shader = gl!.createShader(type); if (!shader) throw Error("Shader unavailable"); gl!.shaderSource(shader, source); gl!.compileShader(shader); if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) { gl!.deleteShader(shader); throw Error("Shader compilation failed"); } return shader; };
      vertexShader = compile(gl.VERTEX_SHADER, vertex); fragmentShader = compile(gl.FRAGMENT_SHADER, fragment);
      program = gl.createProgram(); if (!program) throw Error("Program unavailable");
      gl.attachShader(program, vertexShader); gl.attachShader(program, fragmentShader); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error("Shader link failed");
      gl.useProgram(program); buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      positionAttribute = gl.getAttribLocation(program, "position"); gl.enableVertexAttribArray(positionAttribute); gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);
      uniforms = Object.fromEntries(["resolution", "framing", "optics", "pointer", "time"].map(name => [name, gl!.getUniformLocation(program!, name)]));
      particleVS = compile(gl.VERTEX_SHADER, particleVertex); particleFS = compile(gl.FRAGMENT_SHADER, particleFragment);
      particleProgram = gl.createProgram(); if (!particleProgram) throw Error("Particle program unavailable");
      gl.attachShader(particleProgram, particleVS); gl.attachShader(particleProgram, particleFS); gl.linkProgram(particleProgram);
      if (!gl.getProgramParameter(particleProgram, gl.LINK_STATUS)) throw Error("Particle link failed");
      particleBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer); gl.bufferData(gl.ARRAY_BUFFER, particleSeeds(), gl.STATIC_DRAW);
      seedAttribute = gl.getAttribLocation(particleProgram, "seed");
      particleUniforms = Object.fromEntries(["resolution", "pointer", "time", "progress"].map(name => [name, gl!.getUniformLocation(particleProgram!, name)]));
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      setFailed(false);
    } catch { fail(); }

    function draw(now: number) {
      if (disposed || document.hidden) return;
      const ms = last ? now - last : 16.67, dt = Math.min(ms / 1000, .06); last = now;
      if (measurePending) measure();
      if (resizePending) resize();
      const animate = running.current && !media.matches;
      easedScroll = animate ? follow(easedScroll, scroll, dt) : scroll;
      const target = clamp(easedScroll / scrollRange);
      const changed = Math.abs(progress - target) > .00001;
      progress = target;
      if (animate) { elapsed += dt; x = follow(x, targetX, dt); y = follow(y, targetY, dt); }
      if (animate || dirty || changed) {
        if (animate) visualProgress = progress;
        const scene = sampleScene(visualProgress, mobile());
        root.style.setProperty("--journey", progress.toFixed(5));
        root.style.setProperty("--scroll-shift", `${animate ? -Math.min(easedScroll, 200) * .025 : 0}px`);
        root.style.setProperty("--light-x", `${(50 + (animate ? x : 0) * 70).toFixed(2)}%`);
        root.style.setProperty("--light-y", `${(30 - (animate ? y : 0) * 40).toFixed(2)}%`);
        root.style.setProperty("--warmth", scene.warmth.toFixed(4));
        root.style.setProperty("--nav-inset", `${animate ? Math.min(easedScroll / 180, 1) * 5 : 0}px`);
        for (const stage of stages) {
          const visible = stage.top < scroll + viewport * 1.25 && stage.top + stage.height > scroll - viewport * .25;
          if (visible || stage.active) {
            const local = sectionMotion(easedScroll, stage.top, stage.height, viewport);
            stage.element.style.setProperty("--stage-shift", `${animate ? local.shift : 0}px`);
            stage.element.style.setProperty("--stage-turn", `${animate ? local.turn * (stage.index % 2 ? -1 : 1) : 0}deg`);
            stage.element.style.setProperty("--stage-light", String(animate ? local.light : 1));
            stage.element.style.setProperty("--stage-sweep", `${animate ? 20 + local.progress * 65 : 50}%`);
          }
          stage.active = visible;
        }
        if (gl) {
          gl.useProgram(program); gl.disable(gl.BLEND);
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.enableVertexAttribArray(positionAttribute); gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);
          gl.uniform4f(uniforms.framing, scene.x, scene.y, scene.scale, scene.melt);
          gl.uniform4f(uniforms.optics, scene.rotation, scene.warmth, scene.depth, 0);
          gl.uniform2f(uniforms.pointer, animate ? x : 0, animate ? y : 0); gl.uniform1f(uniforms.time, elapsed);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
          if (particleProgram) {
            gl.useProgram(particleProgram); gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
            if (seedAttribute !== positionAttribute) gl.disableVertexAttribArray(positionAttribute);
            gl.enableVertexAttribArray(seedAttribute); gl.vertexAttribPointer(seedAttribute, 4, gl.FLOAT, false, 0, 0);
            gl.uniform2f(particleUniforms.resolution, el!.width, el!.height);
            gl.uniform2f(particleUniforms.pointer, animate ? x : 0, animate ? y : 0);
            gl.uniform1f(particleUniforms.time, elapsed); gl.uniform1f(particleUniforms.progress, visualProgress);
            gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.drawArrays(gl.POINTS, 0, particleCount(mobile(), quality));
            gl.disable(gl.BLEND); if (seedAttribute !== positionAttribute) gl.disableVertexAttribArray(seedAttribute);
            gl.useProgram(program);
          }
        }
        dirty = false;
      }
      // Adapt render resolution rather than throttle scrolling or render at a fixed low frame rate.
      sinceResize += dt;
      if (animate && gl && sinceResize > 2) {
        if (ms > 23 && ms < 150) { slowFrames++; goodFrames = 0; } else if (ms < 18) { goodFrames++; slowFrames = Math.max(0, slowFrames - 1); }
        if (slowFrames > 24 && quality > .45) { quality = Math.max(.42, quality * .8); resizePending = true; slowFrames = 0; }
        if (goodFrames > 240 && quality < 1) { quality = Math.min(1, quality + .08); resizePending = true; goodFrames = 0; }
      }
      frame = requestAnimationFrame(draw);
    }
    const observer = new ResizeObserver(onResize); observer.observe(document.body); observer.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true }); window.visualViewport?.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility); el.addEventListener("webglcontextlost", lose);
    void document.fonts.ready.then(() => { if (!disposed) measurePending = true; });
    frame = requestAnimationFrame(draw);
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onResize); window.removeEventListener("pointermove", onPointer);
      window.visualViewport?.removeEventListener("resize", onResize); document.removeEventListener("visibilitychange", onVisibility); el.removeEventListener("webglcontextlost", lose);
      releaseParticles();
      if (gl) { gl.deleteBuffer(buffer); gl.deleteProgram(program); gl.deleteShader(vertexShader); gl.deleteShader(fragmentShader); }
      for (const stage of stages) { stage.element.classList.remove("scroll-stage"); delete stage.element.dataset.stage; }
    };
  }, [path]);

  function toggleMotion() { const next = !enabled; setEnabled(next); try { sessionStorage.setItem("arrafed-motion", next ? "live" : "paused"); } catch {} }
  function toggleGlass() { const next = !solid; setSolid(next); try { sessionStorage.setItem("arrafed-glass", next ? "solid" : "clear"); } catch {} }
  return <>
    <div className={`liquid-field${failed ? " is-fallback" : ""}`} aria-hidden="true"><div className="liquid-field-fallback"><svg className="field-fallback-svg" viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="fallback-metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#101712"/><stop offset=".25" stopColor="#c6d2ba"/><stop offset=".32" stopColor="#e8eedf"/><stop offset=".4" stopColor="#19251b"/><stop offset=".7" stopColor="#6e7b66"/><stop offset="1" stopColor="#08100a"/></linearGradient></defs><path className="fallback-ribbon" d="M-100 600C320 60 740 1000 1530 180M-100 160C500 800 800 80 1550 600M-80 780C430 400 980 420 1500 30"/>{Array.from({length:3},(_,i)=><ellipse key={`track-${i}`} className="fallback-track" cx="760" cy="450" rx={540-i*80} ry={170+i*25} transform={`rotate(${i*47-30} 760 450)`}/>)}{Array.from({length:12},(_,i)=><ellipse key={`form-${i}`} className="fallback-form" cx={700+Math.cos(i*2.4)*520} cy={450+Math.sin(i*2.4)*320} rx={i===0?95:20+(i*17)%40} ry={i===0?120:22+(i*23)%45}/>)}{Array.from({length:90},(_,i)=><circle key={`dust-${i}`} className="fallback-dust" cx={(i*173)%1400} cy={(i*97)%900} r={i%7===0?1.8:.8}/>)}</svg></div><canvas ref={canvas} className="liquid-field-canvas"/><div className="liquid-field-scrim"/></div>
    <div className="material-controls" role="group" aria-label="Appearance preferences"><span className="material-control-label" aria-hidden="true">THE FIELD</span><button onClick={toggleMotion} disabled={prefersReduced} aria-pressed={!enabled}>{prefersReduced ? "Reduced motion" : enabled ? "Pause motion" : "Motion paused"}<span aria-hidden="true">{enabled ? "Ⅱ" : "▷"}</span></button><button onClick={toggleGlass} aria-pressed={solid}>{solid ? "Solid glass" : "More contrast"}<span aria-hidden="true">◐</span></button></div>
  </>;
}
