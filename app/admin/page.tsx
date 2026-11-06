import SiteLink from "@/components/site-link";
import type {Metadata} from "next";
import {desc} from "drizzle-orm";
import {PageIntro} from "@/components/studio-shell";
import AdminDesk from "@/components/admin-desk";
import {getAdmin} from "@/lib/admin";
import {getDb} from "@/db";
import {inquiries} from "@/db/schema";
import {getChatGPTUser,chatGPTSignInPath,chatGPTSignOutPath} from "@/app/chatgpt-auth";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Studio desk",robots:{index:false,follow:false}};
export default async function Admin(){const admin=await getAdmin();if(!admin){const user=await getChatGPTUser();return <main id="main" className="page-wrap"><PageIntro index="PRIVATE" title="The studio desk."><p>{user?"This account is not authorised to view project inquiries. Sign in with the studio’s administrator account.":"Sign in with the studio’s administrator account to review project briefs."}</p></PageIntro><SiteLink className="button button-light" href={user?chatGPTSignOutPath("/admin"):chatGPTSignInPath("/admin")} target="_top">{user?"Sign out to switch accounts":"Sign in with ChatGPT ↗"}</SiteLink></main>;}
const rows=await getDb().select({id:inquiries.id,name:inquiries.name,email:inquiries.email,country:inquiries.country,service:inquiries.service,level:inquiries.level,deadline:inquiries.deadline,wordCount:inquiries.wordCount,brief:inquiries.brief,status:inquiries.status,fileName:inquiries.fileName,fileSize:inquiries.fileSize,createdAt:inquiries.createdAt}).from(inquiries).orderBy(desc(inquiries.createdAt)).limit(200);
return <main id="main" className="page-wrap"><PageIntro index="PRIVATE" title="The studio desk."><p>Project inquiries, from first question to agreed next step. Signed in as {admin.email}.</p></PageIntro><AdminDesk initial={rows}/></main>;}
