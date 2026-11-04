import type { Metadata } from "next";
import { PageIntro } from "@/components/studio-shell";
import Faq from "@/components/faq";
export const metadata:Metadata={title:"Questions & answers"};
export default function Questions(){return <main id="main" className="page-wrap"><PageIntro index="Q/A" title="Before we begin."><p>A few practical answers about working with ARRAFED. For anything specific to your research, send us a brief.</p></PageIntro><Faq/></main>;}
