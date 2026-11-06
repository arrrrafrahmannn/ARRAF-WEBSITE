import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(), out=path.join(root,'.sites-runtime/qa');
const names=['lib/content.ts','lib/inquiry-validation.ts','lib/inquiry-cors.ts','lib/admin.ts','db/index.ts','db/schema.ts','app/api/inquiries/route.ts','app/api/admin/inquiries/[id]/route.ts','app/api/admin/files/[id]/route.ts'];
const target=n=>path.join(out,n.replace(/\.ts$/,'.mjs'));
for(const name of names){let code=fs.readFileSync(name,'utf8');code=code.replaceAll('"cloudflare:workers"',JSON.stringify(path.join(out,'environment.mjs'))).replaceAll('"@/app/chatgpt-auth"',JSON.stringify(path.join(out,'identity.mjs')));code=code.replace(/(["'])@\/([^"']+)\1/g,(_,q,n)=>JSON.stringify(target(n==='db'?'db/index.ts':n+'.ts')));code=code.replace(/(["'])\.\/([^"']+)\1/g,(_,q,n)=>JSON.stringify(target(path.join(path.dirname(name),n+'.ts'))));fs.mkdirSync(path.dirname(target(name)),{recursive:true});fs.writeFileSync(target(name),ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);}
fs.writeFileSync(path.join(out,'identity.mjs'),`import { env } from './environment.mjs'; export async function getChatGPTUser(){return env.testIdentity;}`);
fs.writeFileSync(path.join(out,'environment.mjs'),`
import {DatabaseSync} from 'node:sqlite';
const sqlite=new DatabaseSync(':memory:');sqlite.exec(${JSON.stringify(fs.readFileSync('drizzle/0000_talented_sumo.sql','utf8'))});
function prepare(sql){let args=[];const run=()=>sqlite.prepare(sql);return {bind(...v){args=v;return this},async all(){return {success:true,results:run().all(...args),meta:{}}},async first(){return run().get(...args)??null},async raw(){return run().all(...args).map(Object.values)},async run(){const result=run().run(...args);return {success:true,results:[],meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid)}}}};}
export const files=new Map();
export const env={DB:{prepare,async batch(statements){return Promise.all(statements.map(s=>s.all()))}},BUCKET:{async put(key,value){files.set(key,value)},async get(key){return files.has(key)?{body:files.get(key)}:null},async delete(key){files.delete(key)}},ADMIN_EMAILS:'owner@example.com',testIdentity:null};
`);
const {env,files}=await import(path.join(out,'environment.mjs'));
const {POST,OPTIONS}=await import(path.join(out,'app/api/inquiries/route.mjs'));
const {PATCH,DELETE}=await import(path.join(out,'app/api/admin/inquiries/[id]/route.mjs'));
const {GET}=await import(path.join(out,'app/api/admin/files/[id]/route.mjs'));
const origin='https://arrafed.test';
const valid={name:'Build verification',email:'test@example.com',country:'Bangladesh',service:'statistics',level:'Postgraduate / MBA',deadline:'2099-01-01',wordCount:'2000',brief:'This is an isolated integration test for analytical consultation, stored only in an in-memory test database.',consent:'yes'};
function post(overrides={},file){const data=new FormData();Object.entries({...valid,...overrides}).forEach(([k,v])=>data.set(k,v));if(file)data.set('file',file);return new Request(origin+'/api/inquiries',{method:'POST',headers:{origin},body:data});}
const noOrigin=await POST(new Request(origin+'/api/inquiries',{method:'POST'}));assert.equal(noOrigin.status,403);
assert.equal((await POST(post({email:'invalid'}))).status,400);
assert.equal((await POST(post({},new File(['not a pdf'],'bad.pdf')))).status,400);
assert.equal((await POST(post({},new File(['hello'],'bad.exe')))).status,400);
let result=await POST(post({},new File(['%PDF-1.4\nTest supporting material'],'support.pdf',{type:'application/pdf'})));assert.equal(result.status,201);const {reference}=await result.json();assert.match(reference,/^AR-[A-F0-9]{12}$/);assert.equal(files.size,1);
const ctx={params:Promise.resolve({id:reference})};
assert.equal((await GET(new Request(origin+'/api/admin/files/'+reference),ctx)).status,403);
const patch=(status,originValue=origin)=>new Request(origin+'/api/admin/inquiries/'+reference,{method:'PATCH',headers:{origin:originValue,'Content-Type':'application/json'},body:JSON.stringify({status})});
assert.equal((await PATCH(patch('contacted'),ctx)).status,403);
env.testIdentity={userId:'outsider',email:'outsider@example.com'};assert.equal((await PATCH(patch('contacted'),ctx)).status,403);
env.testIdentity={userId:'owner',email:'owner@example.com'};assert.equal((await PATCH(patch('contacted','https://other.test'),ctx)).status,403);
assert.equal((await PATCH(patch('invalid'),ctx)).status,400);
assert.equal((await PATCH(patch('contacted'),ctx)).status,200);
const {getDb}=await import(path.join(out,'db/index.mjs'));const {inquiries}=await import(path.join(out,'db/schema.mjs'));let rows=await getDb().select().from(inquiries);assert.equal(rows[0].status,'contacted');assert.equal(rows[0].wordCount,2000);
const download=await GET(new Request(origin+'/api/admin/files/'+reference),ctx);assert.equal(download.status,200);assert.equal(download.headers.get('Cache-Control'),'private, no-store');assert.match(download.headers.get('Content-Disposition'),/attachment/);assert.match(await download.text(),/%PDF-1.4/);
for(let i=0;i<3;i++)assert.equal((await POST(post())).status,201);
assert.equal((await POST(post())).status,429);
assert.equal((await DELETE(new Request(origin+'/api/admin/inquiries/'+reference,{method:'DELETE',headers:{origin}}),ctx)).status,200);assert.equal(files.size,0);rows=await getDb().select().from(inquiries);assert.equal(rows.length,3);
assert.equal((await GET(new Request(origin+'/api/admin/files/'+reference),ctx)).status,404);
console.log('Integration checks passed: validated inquiry, file signatures, SQLite persistence, reference generation, rate limit, unauthorised access, admin allowlist, origin protection, status update, protected file download and deletion. No production records were created.');

const pages='https://nurajannatmitu.github.io';
const pageRequest=post({email:'pages-test@example.com'});pageRequest.headers.set('origin',pages);
const pageResult=await POST(pageRequest);assert.equal(pageResult.status,201);assert.equal(pageResult.headers.get('Access-Control-Allow-Origin'),pages);assert.equal(pageResult.headers.has('Access-Control-Allow-Credentials'),false);
const invalidPageRequest=post({email:'invalid'});invalidPageRequest.headers.set('origin',pages);const pageError=await POST(invalidPageRequest);assert.equal(pageError.status,400);assert.equal(pageError.headers.get('Access-Control-Allow-Origin'),pages);
for(const value of [pages,origin,'https://untrusted.example','https://nurajannatmitu.github.io.evil.test','null']){
 const preflight=await OPTIONS(new Request(origin+'/api/inquiries',{method:'OPTIONS',headers:{origin:value}}));assert.equal(preflight.status,value===pages||value===origin?204:403);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),value===pages?pages:null);
}
const forged=post();forged.headers.set('origin','https://untrusted.example');assert.equal((await POST(forged)).status,403);
assert.equal((await PATCH(patch('contacted',pages),ctx)).status,403);
console.log('Pages CORS checks passed: inquiry persistence, readable validation errors, exact origin, preflight, no credentials and unchanged admin protection.');
