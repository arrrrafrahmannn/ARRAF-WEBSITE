import { faqs } from "@/lib/content";
export default function Faq({ limit }: { limit?: number }) { return <div className="faq-list">{faqs.slice(0,limit).map(([question,answer],i)=><details key={question}><summary><span className="mono">{String(i+1).padStart(2,"0")}</span><span>{question}</span><span className="faq-toggle" aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>; }
