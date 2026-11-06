import SiteLink from "@/components/site-link";
import { services } from "@/lib/content";
import { Arrow } from "./studio-shell";
export default function Expertise(){return <div className="discipline-index">{services.map(s=><details className="discipline" key={s.id}><summary><span className="discipline-number mono">{s.number}</span><span className="discipline-name">{s.short}</span><span className="discipline-line">{s.line}</span><span className="discipline-toggle" aria-hidden="true">+</span></summary><div className="discipline-expanded"><p>{s.description}</p><div><span className="mono">{s.tools}</span><SiteLink className="text-link" href={`/services/${s.id}`}>Explore the discipline <Arrow diagonal/></SiteLink></div></div></details>)}</div>;}
