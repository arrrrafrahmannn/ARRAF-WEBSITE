import {env} from "cloudflare:workers";
import {eq} from "drizzle-orm";
import {getDb} from "@/db";
import {inquiries} from "@/db/schema";
import {getAdmin} from "@/lib/admin";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  if(!await getAdmin())return new Response("Access denied",{status:403});
  const {id}=await params;const [record]=await getDb().select({key:inquiries.fileKey,name:inquiries.fileName,type:inquiries.fileType}).from(inquiries).where(eq(inquiries.id,id));
  if(!record?.key||!env.BUCKET)return new Response("File not found",{status:404});const file=await env.BUCKET.get(record.key);if(!file)return new Response("File not found",{status:404});
  return new Response(file.body,{headers:{"Content-Type":record.type??"application/octet-stream","Content-Disposition":`attachment; filename*=UTF-8''${encodeURIComponent(record.name??"document")}`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}
