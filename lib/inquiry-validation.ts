import {z} from "zod";
import {services} from "./content";
export const inquirySchema=z.object({
  name:z.string().trim().min(2,"Please enter your full name.").max(100),
  email:z.string().trim().email("Please enter a valid email address.").max(254),
  country:z.string().trim().min(2,"Please enter your country.").max(100),
  service:z.string().refine(v=>[...services.map(s=>s.id),"other"].includes(v),"Please choose a service."),
  level:z.enum(["Undergraduate / BBA","Postgraduate / MBA","Doctoral / PhD","Academic / professional","Other"]),
  deadline:z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a valid deadline.").refine(v=>!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v,"Please choose a valid date.").refine(v=>v>=new Date(Date.now()+6*60*60*1000).toISOString().slice(0,10),"Please choose today or a future date."),
  wordCount:z.preprocess(v=>v===""||v===null?null:Number(v),z.number().int().min(1).max(1000000).nullable()),
  brief:z.string().trim().min(30,"Please add at least 30 characters about your project.").max(15000),
  consent:z.literal("yes",{errorMap:()=>({message:"Please accept the privacy policy and terms."})}),
});
export function validOrigin(request:Request){const origin=request.headers.get("origin");return !!origin&&origin===new URL(request.url).origin;}
export const statuses=["new","reviewing","contacted","closed"] as const;
