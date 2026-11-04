"use client";
import { useEffect, useRef, useState } from "react";
const vertex = `attribute vec2 position; varying vec2 uv; void main(){ uv=position; gl_Position=vec4(position,0.,1.); }`;
const fragment = `precision highp float;
varying vec2 uv; uniform vec2 resolution; uniform float time; uniform vec2 pointer;
float smoothUnion(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float shape(vec3 p){float t=time*.32;float wave=sin(p.x*3.7+t)*sin(p.y*4.0-t*.7)*sin(p.z*3.3+t*.6);vec3 center=vec3(.08*sin(t),.25+.13*sin(t*.8),0.);float s=length((p-center)*vec3(1.,.99,1.))-(.93+.07*wave);float l=length(p-vec3(.35*sin(t*.8),-.55,.05))-.5;float pool=(length((p-vec3(.1,-.96,.06))*vec3(.75,5.5,.9))-.84)/2.6;return smoothUnion(smoothUnion(s,l,.45),pool,.23);}
vec3 normalAt(vec3 p){vec2 e=vec2(.002,0.);return normalize(vec3(shape(p+e.xyy)-shape(p-e.xyy),shape(p+e.yxy)-shape(p-e.yxy),shape(p+e.yyx)-shape(p-e.yyx)));}
float boxLight(vec3 d,vec3 c,vec2 size){vec3 forward=normalize(c);vec3 right=normalize(cross(vec3(0.,1.,0.),forward));vec3 up=cross(forward,right);float z=dot(d,forward);vec2 q=vec2(dot(d,right),dot(d,up))/max(z,.01);return smoothstep(.05,0.,max(abs(q.x)-size.x,abs(q.y)-size.y))*step(0.,z);}
vec3 studio(vec3 d){vec3 col=vec3(.018+.04*max(d.y,0.));col+=vec3(.92,.94,.98)*boxLight(d,vec3(-2.,2.,2.),vec2(.14,1.05));col+=vec3(.72,.76,.8)*boxLight(d,vec3(2.,.3,1.),vec2(.085,1.4));col+=vec3(.5,.54,.6)*boxLight(d,vec3(0.,3.,-1.),vec2(.8,.12));col+=vec3(.35)*pow(max(0.,dot(d,normalize(vec3(-1.,.7,-2.)))),18.);col+=vec3(.12)*pow(max(0.,1.-abs(d.y+.25)*3.),12.);return col;}
void main(){vec2 p=uv;p.x*=resolution.x/resolution.y;vec3 ro=vec3(.12+pointer.x*.16,.28+pointer.y*.12,4.1);vec3 rd=normalize(vec3(p*1.55,-3.1));float travel=0.;float hit=0.;for(int i=0;i<76;i++){float dist=shape(ro+rd*travel);if(dist<.0015){hit=1.;break;}travel+=dist*.7;if(travel>8.)break;}vec3 col=vec3(.018);if(hit>.5){vec3 pos=ro+rd*travel;vec3 n=normalAt(pos);vec3 ref=reflect(rd,n);float fres=pow(1.-max(0.,dot(-rd,n)),3.);col=studio(ref)*(.83+.17*fres);col+=vec3(.14)*fres;float rim=pow(1.-max(0.,dot(-rd,n)),5.);col+=vec3(.26,.28,.3)*rim;col*=.65+.35*smoothstep(-1.1,.4,pos.y);col=pow(col,vec3(.82));}gl_FragColor=vec4(col,hit);}`;

export default function LiquidSteel() {
  const canvas=useRef<HTMLCanvasElement>(null); const [enabled,setEnabled]=useState(true); const [failed,setFailed]=useState(false); const enabledRef=useRef(true);
  useEffect(()=>{enabledRef.current=enabled;},[enabled]);
  useEffect(()=>{
    const el=canvas.current;if(!el)return;const gl=el.getContext("webgl",{alpha:true,antialias:false,powerPreference:"low-power"});if(!gl){setFailed(true);return;}
    const compile=(type:number,src:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw new Error("Shader unavailable");}return s;};
    let program:WebGLProgram;let vs:WebGLShader;let fs:WebGLShader;
    try{vs=compile(gl.VERTEX_SHADER,vertex);fs=compile(gl.FRAGMENT_SHADER,fragment);program=gl.createProgram()!;gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error();}catch{setFailed(true);return;}
    gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(program,"position");gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
    const res=gl.getUniformLocation(program,"resolution"),t=gl.getUniformLocation(program,"time"),ptr=gl.getUniformLocation(program,"pointer");let visible=true,frame=0,last=0,elapsed=6,x=0,y=0;const reduced=matchMedia("(prefers-reduced-motion: reduce)");
    const resize=()=>{const rect=el.getBoundingClientRect();const dpr=Math.min(devicePixelRatio,innerWidth<700?1:1.3);el.width=Math.round(rect.width*dpr);el.height=Math.round(rect.height*dpr);gl.viewport(0,0,el.width,el.height);gl.uniform2f(res,el.width,el.height);};
    const move=(e:PointerEvent)=>{const r=el.getBoundingClientRect();x=(e.clientX-r.left)/r.width-.5;y=-((e.clientY-r.top)/r.height-.5);};
    const draw=(now:number)=>{frame=requestAnimationFrame(draw);if(now-last<40)return;const dt=Math.min((now-last)/1000,.06);last=now;if(!visible||document.hidden)return;if(enabledRef.current&&!reduced.matches)elapsed+=dt;gl.uniform1f(t,elapsed);gl.uniform2f(ptr,x,y);gl.drawArrays(gl.TRIANGLES,0,6);};
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;});observer.observe(el);const robs=new ResizeObserver(resize);robs.observe(el);resize();el.addEventListener("pointermove",move);frame=requestAnimationFrame(draw);const lost=(e:Event)=>{e.preventDefault();setFailed(true);};el.addEventListener("webglcontextlost",lost);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();robs.disconnect();el.removeEventListener("pointermove",move);el.removeEventListener("webglcontextlost",lost);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);};
  },[]);
  return <div className="steel-scene"><div className="scene-orbit orbit-one"/><div className="scene-orbit orbit-two"/><div className="steel-ground"/>{failed?<div className="steel-fallback" aria-hidden="true"/>:<canvas ref={canvas} className="steel-canvas" aria-label="A slowly melting reflective steel sphere" role="img"/>}<div className="material-caption"><span>FIG. 01 — FORM IN FLUX</span><button onClick={()=>setEnabled(!enabled)} aria-pressed={!enabled}>{enabled?"Pause motion Ⅱ":"Resume motion ▷"}</button></div></div>;
}
