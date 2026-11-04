"use client";
import { useState } from "react";
import { services } from "@/lib/content";
import { Arrow } from "./studio-shell";
export default function Expertise() {
  const [active,setActive]=useState(0);const service=services[active];
  return <div className="expertise-layout"><div className="expertise-list" role="tablist" aria-label="Explore our expertise" aria-orientation="vertical">{services.map((s,i)=><button type="button" key={s.id} id={`tab-${s.id}`} role="tab" aria-selected={active===i} aria-controls={`panel-${s.id}`} tabIndex={active===i?0:-1} onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const next=(i+(e.key==='ArrowDown'?1:4))%5;setActive(next);document.getElementById(`tab-${services[next].id}`)?.focus();}}} className={active===i?"expertise-row active":"expertise-row"} onClick={()=>setActive(i)}><span className="mono">{s.number}</span><span>{s.short}</span><Arrow diagonal /></button>)}</div><div className="expertise-detail" role="tabpanel" id={`panel-${service.id}`} aria-labelledby={`tab-${service.id}`} key={service.id}><span className="eyebrow">{service.number} / THE DISCIPLINE</span><h3>{service.line}</h3><p>{service.description}</p><p className="mono expertise-tools">{service.tools}</p><a className="text-link" href={`/services/${service.id}`}>Explore {service.short.toLowerCase()} <Arrow /></a></div></div>;
}
