import {z} from "zod";
import {eq} from "drizzle-orm";
import {getDb} from "@/db";
import {inquiries} from "@/db/schema";
import {getAdmin} from "@/lib/admin";
import {statuses,validOrigin} from "@/lib/inquiry-validation";
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  if(!await getAdmin())return Response.json({error:"Access denied."},{status:403});
  if(!validOrigin(request))return Response.json({error:"Invalid origin."},{status:403});
  try{const {id}=await params;const parsed=z.object({status:z.enum(statuses)}).safeParse(await request.json());if(!parsed.success)return Response.json({error:"Choose a valid status."},{status:400});const updated=await getDb().update(inquiries).set({status:parsed.data.status}).where(eq(inquiries.id,id)).returning({id:inquiries.id});if(!updated.length)return Response.json({error:"Inquiry not found."},{status:404});return Response.json({ok:true});}catch{return Response.json({error:"The status could not be saved."},{status:503});}
}
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){
  if(!await getAdmin())return Response.json({error:"Access denied."},{status:403});
  if(!validOrigin(request))return Response.json({error:"Invalid origin."},{status:403});
  const {env}=await import("cloudflare:workers");
  try{const {id}=await params;const db=getDb();const [record]=await db.select({key:inquiries.fileKey}).from(inquiries).where(eq(inquiries.id,id));if(!record)return Response.json({error:"Inquiry not found."},{status:404});if(record.key&&env.BUCKET)await env.BUCKET.delete(record.key);await db.delete(inquiries).where(eq(inquiries.id,id));return Response.json({ok:true});}catch{return Response.json({error:"The inquiry could not be deleted. Please try again."},{status:503});}
}
