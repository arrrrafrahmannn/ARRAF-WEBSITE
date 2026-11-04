import {env} from "cloudflare:workers";
import {getChatGPTUser} from "@/app/chatgpt-auth";
export async function getAdmin(){const user=await getChatGPTUser();if(!user)return null;const emails=(env.ADMIN_EMAILS??"").split(",").map(e=>e.trim().toLowerCase()).filter(Boolean);return emails.includes(user.email.toLowerCase())?user:null;}
