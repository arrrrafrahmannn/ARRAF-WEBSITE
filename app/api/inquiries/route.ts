import {env} from "cloudflare:workers";
import {and,eq,gte,count} from "drizzle-orm";
import {getDb} from "@/db";
import {inquiries} from "@/db/schema";
import {inquirySchema} from "@/lib/inquiry-validation";
import {validInquiryOrigin,inquiryCors} from "@/lib/inquiry-cors";
const MAX_FILE=10*1024*1024;
async function submitInquiry(request:Request){
  if(!validInquiryOrigin(request))return Response.json({error:"Please submit your brief from this website."},{status:403});
  if(request.body){const reader=request.body.getReader();let size=0;const chunks:Uint8Array[]=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_FILE+100000){await reader.cancel();return Response.json({error:"The upload is too large. Please choose a file under 10 MB."},{status:413});}chunks.push(value);}const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}request=new Request(request.url,{method:request.method,headers:request.headers,body});}

  if(Number(request.headers.get("content-length")??0)>MAX_FILE+100000)return Response.json({error:"The upload is too large. Please choose a file under 10 MB."},{status:413});
  let fileKey:string|null=null;
  try{
    const data=await request.formData();if(data.get("website"))return Response.json({error:"Unable to accept this submission."},{status:400});
    const validated=inquirySchema.safeParse(Object.fromEntries(data.entries()));if(!validated.success)return Response.json({error:validated.error.issues[0].message},{status:400});
    const {consent,...values}=validated.data;void consent;
    const now=Date.now();const ip=request.headers.get("cf-connecting-ip");
    const source=ip??values.email.toLowerCase();const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(new URL(request.url).origin+":"+source));const rateKey=Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");
    const db=getDb();const [recent]=await db.select({value:count()}).from(inquiries).where(and(eq(inquiries.rateKey,rateKey),gte(inquiries.createdAt,now-3600000)));
    if(recent.value>=4)return Response.json({error:"You have sent several inquiries recently. Please wait an hour or contact us on WhatsApp."},{status:429,headers:{"Retry-After":"3600"}});
    const id="AR-"+crypto.randomUUID().replace(/-/g,"").slice(0,12).toUpperCase();
    const entry=data.get("file");const file=entry instanceof File&&entry.size>0?entry:null;
    let fileName:string|null=null,fileType:string|null=null,fileSize:number|null=null;
    if(file){
      if(file.size>MAX_FILE)return Response.json({error:"Please choose a file under 10 MB."},{status:413});
      const ext=file.name.split(".").pop()?.toLowerCase();if(!ext||!["pdf","docx","xlsx","csv","txt"].includes(ext))return Response.json({error:"Please use PDF, DOCX, XLSX, CSV or TXT."},{status:400});
      const bytes=new Uint8Array(await file.arrayBuffer());const head=String.fromCharCode(...bytes.slice(0,5));
      if(ext==="pdf"&&head!=="%PDF-"||(ext==="docx"||ext==="xlsx")&&(bytes[0]!==0x50||bytes[1]!==0x4b))return Response.json({error:"The file contents do not match its extension."},{status:400});
      if((ext==="csv"||ext==="txt")&&bytes.slice(0,4096).includes(0))return Response.json({error:"Please choose a valid text document."},{status:400});
      if(!env.BUCKET)throw new Error("Upload binding unavailable");
      fileName=file.name.replace(/[\x00-\x1f\x7f/\\]/g,"_").slice(0,180);fileType=ext==="pdf"?"application/pdf":ext==="txt"?"text/plain":ext==="csv"?"text/csv":"application/octet-stream";fileSize=file.size;fileKey=`inquiries/${id}/${crypto.randomUUID()}.${ext}`;
      await env.BUCKET.put(fileKey,bytes,{httpMetadata:{contentType:fileType}});
    }
    await db.insert(inquiries).values({...values,email:values.email.toLowerCase(),id,status:"new",fileKey,fileName,fileType,fileSize,rateKey,createdAt:now});
    return Response.json({reference:id},{status:201,headers:{"Cache-Control":"no-store"}});
  }catch(err){if(fileKey&&env.BUCKET)await env.BUCKET.delete(fileKey).catch(()=>{});console.error("Inquiry submission failed",err instanceof Error?err.message:"Unknown error");return Response.json({error:"Your brief could not be saved. Please try again or contact the studio directly."},{status:503});}
}

export async function POST(request:Request){return inquiryCors(request,await submitInquiry(request));}
export async function OPTIONS(request:Request){return inquiryCors(request,new Response(null,{status:validInquiryOrigin(request)?204:403}));}
