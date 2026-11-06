import Home from "@/app/page";
import About from "@/app/about/page";
import Contact from "@/app/contact/page";
import Process from "@/app/process/page";
import Services from "@/app/services/page";
import Pricing from "@/app/pricing/page";
import Privacy from "@/app/privacy/page";
import Terms from "@/app/terms/page";
import Questions from "@/app/faq/page";
import NotFound from "@/app/not-found";
import ServiceDetail from "@/components/service-detail";
import LiquidSteel from "@/components/liquid-steel";
import {Header,Footer} from "@/components/studio-shell";
import {services} from "@/lib/content";
import {RouteContext} from "./navigation";

const documents:Record<string,{page:React.ComponentType;title:string}>={
  "/":{page:Home,title:"Research, with intention."},
  "/about":{page:About,title:"The studio"},
  "/contact":{page:Contact,title:"Discuss your project"},
  "/process":{page:Process,title:"Our process"},
  "/services":{page:Services,title:"Expertise"},
  "/pricing":{page:Pricing,title:"Pricing"},
  "/privacy":{page:Privacy,title:"Privacy"},
  "/terms":{page:Terms,title:"Terms & academic integrity"},
  "/faq":{page:Questions,title:"Questions & answers"},
};
export const routes=[...Object.keys(documents),...services.map(s=>`/services/${s.id}`)];
export function titleFor(route:string){return documents[route]?.title??services.find(s=>`/services/${s.id}`===route)?.title??"Page not found";}
export function Studio({route}:{route:string}){
  const Page=documents[route]?.page;
  const service=services.find(s=>`/services/${s.id}`===route);
  return <RouteContext.Provider value={route}><a className="skip-link" href="#main">Skip to content</a><LiquidSteel/><Header/>{Page?<Page/>:service?<ServiceDetail s={service}/>:<NotFound/>}<Footer/></RouteContext.Provider>;
}
