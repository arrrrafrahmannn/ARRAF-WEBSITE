import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {services} from "@/lib/content";
import ServiceDetail from "@/components/service-detail";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;return {title:services.find(s=>s.id===slug)?.title??"Service"};}
export default async function Service({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const s=services.find(x=>x.id===slug);if(!s)notFound();return <ServiceDetail s={s}/>;}
