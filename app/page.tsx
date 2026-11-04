import LiquidSteel from "@/components/liquid-steel";
import Expertise from "@/components/expertise";
import Faq from "@/components/faq";
import { Arrow } from "@/components/studio-shell";

export default function Home() {
  return <main id="main">
    <section className="hero">
      <div className="hero-meta mono"><span>ACADEMIC RESEARCH & EMPIRICAL DATA STUDIO</span><span>DHAKA, BD — WORKING WORLDWIDE</span></div>
      <div className="hero-composition"><div className="hero-type"><h1>RESEARCH.<br/><span>WITH INTENTION.</span></h1><div className="hero-introduction"><span className="intro-rule"/><p>Clearer questions.<br/>Stronger evidence.<br/>Work that holds together.</p></div><a className="button button-light hero-button" href="/contact">Discuss your project <Arrow diagonal/></a></div><LiquidSteel/></div>
      <div className="hero-bottom"><span className="mono">INDEPENDENT THINKING. RIGOROUS METHODS.</span><a href="#expertise" className="explore-link">Explore the studio <span>↓</span></a><span className="mono hero-edition">EST. IN DHAKA / OPEN TO THE WORLD</span></div>
    </section>
    <section className="manifesto section-pad"><div className="section-label"><span className="eyebrow">01 / A CLEARER WAY FORWARD</span><span className="crosshair" aria-hidden="true">+</span></div><div className="manifesto-content"><h2>There’s a shape<br/>to every <span>complexity.</span></h2><div className="manifesto-copy"><p>We help you find it.</p><p>From a first research question to a final analytical result, ARRAFED brings structure, evidence and care to demanding university work.</p><a className="text-link" href="/about">Inside the studio <Arrow diagonal/></a></div></div></section>
    <section className="section-pad expertise-section" id="expertise"><div className="section-heading"><div><p className="eyebrow">02 / OUR EXPERTISE</p><h2>Depth, across<br/>disciplines.</h2></div><p>Research guidance, empirical analysis<br/>and editorial precision.<br/>Find the support your project needs.</p></div><Expertise/></section>
    <section className="method-section section-pad"><div className="method-visual" aria-hidden="true"><div className="method-lines">{Array.from({length:13},(_,i)=><span key={i} style={{"--i":i} as React.CSSProperties}/>)}</div><span className="mono">QUESTION → METHOD → EVIDENCE</span></div><div className="method-copy"><p className="eyebrow">03 / THE WAY WE WORK</p><h2>Thoughtful at<br/>every stage.</h2><p>A useful collaboration starts with a clear brief. We agree the scope, work through the details and help you understand the result.</p><ol><li><span className="mono">01</span>Scope the question.</li><li><span className="mono">02</span>Work with the evidence.</li><li><span className="mono">03</span>Refine the result.</li></ol><a className="text-link" href="/process">Follow the full process <Arrow diagonal/></a></div></section>
    <section className="question-section section-pad"><div className="section-heading"><div><p className="eyebrow">04 / BEFORE WE BEGIN</p><h2>A little clarity.</h2></div><a className="text-link" href="/faq">All questions <Arrow diagonal/></a></div><Faq limit={4}/></section>
    <section className="closing-statement section-pad"><p className="eyebrow">YOUR QUESTION. OUR NEXT CONVERSATION.</p><h2>Let’s work through<br/>the complexity.</h2><a className="button button-light" href="/contact">Bring us your brief <Arrow diagonal/></a><p className="small muted">Research consultation, analysis and editing.<br/>Supporting your work, your understanding and your academic integrity.</p></section>
  </main>;
}
