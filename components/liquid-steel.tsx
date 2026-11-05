"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { clamp, follow, renderSize, sampleScene, sectionMotion } from "@/lib/scroll-scene";

const vertex = `attribute vec2 position; varying vec2 uv; void main(){uv=position;gl_Position=vec4(position,0.,1.);}`;
const fragment = `precision highp float;
varying vec2 uv;
uniform vec2 resolution;
uniform vec4 framing;
uniform vec4 optics;
uniform vec2 pointer;
uniform float time;
mat2 rotate(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float blend(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float shape(vec3 p){
  p.xz=rotate(optics.x)*p.xz;
  float melt=framing.w;
  float breathing=sin(time*.35)*.025;
  vec3 q=p-vec3(.06*sin(time*.21),.23-melt*.25,0.);
  q.xz=rotate(q.y*.11*sin(time*.15))*q.xz;
  float wave=sin(q.x*3.8+time*.3)*sin(q.y*3.3-time*.19)*sin(q.z*3.4+time*.22);
  float ball=length(q*vec3(1.-melt*.13,1.+melt*.28,1.))-(.96+breathing+.055*wave);
  float neck=length(p-vec3(.12*sin(time*.23),-.48,0.))-(.42+melt*.12);
  float pool=(length((p-vec3(0.,-.96,0.))*vec3(.76-melt*.13,6.4,.9-melt*.12))-(.9+melt*.12))/3.2;
  return blend(blend(ball,neck,.4),pool,.23+melt*.06);
}
vec3 normalAt(vec3 p){vec2 e=vec2(.0016,-.0016);return normalize(e.xyy*shape(p+e.xyy)+e.yyx*shape(p+e.yyx)+e.yxy*shape(p+e.yxy)+e.xxx*shape(p+e.xxx));}
float softbox(vec3 d,vec3 c,vec2 size){
  vec3 f=normalize(c),r=normalize(cross(vec3(0.,1.,0.),f)),u=cross(f,r);
  float z=dot(d,f);vec2 q=vec2(dot(d,r),dot(d,u))/max(z,.01);
  return (1.-smoothstep(0.,.055,max(abs(q.x)-size.x,abs(q.y)-size.y)))*step(0.,z);
}
vec3 studio(vec3 d){
  float warmth=optics.y;
  vec3 silver=mix(vec3(.89,.91,.94),vec3(.95,.85,.69),warmth*.55);
  vec3 col=vec3(.019)+vec3(.025)*max(d.y,0.);
  col+=silver*softbox(d,vec3(-2.,2.,2.),vec2(.16,1.02));
  col+=vec3(.65,.68,.7)*softbox(d,vec3(2.,.3,1.),vec2(.075,1.4));
  col+=silver*.56*softbox(d,vec3(.1,3.,-1.),vec2(.82,.12));
  col+=silver*.21*pow(max(0.,dot(d,normalize(vec3(-1.,.7,-2.)))),16.);
  col+=vec3(.08)*pow(max(0.,1.-abs(d.y+.24)*3.),10.);
  return col;
}
void main(){
  vec2 screen=uv;screen.x*=resolution.x/resolution.y;
  vec2 p=(screen-framing.xy-pointer*vec2(.025,.018))/framing.z;
  vec3 ro=vec3(0.,.27,4.2),rd=normalize(vec3(p*1.45,-3.1));
  ro.xz=rotate(optics.x*.3)*ro.xz;rd.xz=rotate(optics.x*.3)*rd.xz;
  vec3 off=ro-vec3(0.,-.08,0.);float b=dot(off,rd),c=dot(off,off)-3.24,disc=b*b-c;
  float hit=0.,travel=max(0.,-b-sqrt(max(disc,0.)));
  if(disc>0.){for(int i=0;i<54;i++){float dist=shape(ro+rd*travel);if(dist<.0025){hit=1.;break;}travel+=max(.001,dist*.8);if(travel>7.)break;}}
  float ripple=sin(screen.x*1.7+screen.y*2.1+optics.z*5.)*.2;
  vec3 backdropN=normalize(vec3(screen.x*.13+sin(screen.y*2.+optics.z*3.)*.18, .6+screen.y*.3, 1.));
  vec3 sheen=studio(reflect(normalize(vec3(screen,-2.)),backdropN));
  float warm=optics.y;
  vec3 col=mix(vec3(.017,.018,.019),vec3(.032,.028,.023),warm)*(.9+ripple);
  col+=sheen*.036;
  float rim=1.-smoothstep(.05,1.8,length(vec2(screen.x-framing.x*.55,screen.y+.25)));
  col+=mix(vec3(.026,.027,.028),vec3(.04,.033,.022),warm)*rim;
  if(hit>.5){vec3 pos=ro+rd*travel,n=normalAt(pos);float fres=pow(1.-max(0.,dot(-rd,n)),3.);vec3 metal=studio(reflect(rd,n))*(.83+.17*fres)+vec3(.11)*fres;metal*=.72+.28*smoothstep(-1.12,.35,pos.y);metal=pow(metal,vec3(.9));col=mix(col,metal,.82);}
  float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;
  col+=grain/510.;gl_FragColor=vec4(col,1.);
}`;

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
    function fail() { setFailed(true); if (gl) { gl.deleteBuffer(buffer); gl.deleteProgram(program); gl.deleteShader(vertexShader); gl.deleteShader(fragmentShader); } gl = null; }
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
      const position = gl.getAttribLocation(program, "position"); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      uniforms = Object.fromEntries(["resolution", "framing", "optics", "pointer", "time"].map(name => [name, gl!.getUniformLocation(program!, name)]));
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
          gl.uniform4f(uniforms.framing, scene.x, scene.y, scene.scale, scene.melt);
          gl.uniform4f(uniforms.optics, scene.rotation, scene.warmth, scene.depth, 0);
          gl.uniform2f(uniforms.pointer, animate ? x : 0, animate ? y : 0); gl.uniform1f(uniforms.time, elapsed);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
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
      if (gl) { gl.deleteBuffer(buffer); gl.deleteProgram(program); gl.deleteShader(vertexShader); gl.deleteShader(fragmentShader); }
      for (const stage of stages) { stage.element.classList.remove("scroll-stage"); delete stage.element.dataset.stage; }
    };
  }, [path]);

  function toggleMotion() { const next = !enabled; setEnabled(next); try { sessionStorage.setItem("arrafed-motion", next ? "live" : "paused"); } catch {} }
  function toggleGlass() { const next = !solid; setSolid(next); try { sessionStorage.setItem("arrafed-glass", next ? "solid" : "clear"); } catch {} }
  return <>
    <div className={`liquid-field${failed ? " is-fallback" : ""}`} aria-hidden="true"><div className="liquid-field-fallback"/><canvas ref={canvas} className="liquid-field-canvas"/><div className="liquid-field-scrim"/></div>
    <div className="material-controls" role="group" aria-label="Appearance preferences"><span className="material-control-label" aria-hidden="true">STEEL / GLASS</span><button onClick={toggleMotion} disabled={prefersReduced} aria-pressed={!enabled}>{prefersReduced ? "Reduced motion" : enabled ? "Pause motion" : "Motion paused"}<span aria-hidden="true">{enabled ? "Ⅱ" : "▷"}</span></button><button onClick={toggleGlass} aria-pressed={solid}>{solid ? "Solid glass" : "More contrast"}<span aria-hidden="true">◐</span></button></div>
  </>;
}
