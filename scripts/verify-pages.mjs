import {readFile,readdir,stat} from "node:fs/promises";
import {resolve,join} from "node:path";
import assert from "node:assert/strict";

const output=resolve("pages-dist"),base="/ARRAF-WEBSITE/";
async function files(dir){const entries=await readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]))).flat();}
let documents=0,links=0;
for(const file of await files(output)){
  if(!file.endsWith(".html"))continue;
  const html=await readFile(file,"utf8");documents++;
  assert.ok(html.includes('id="main"'),`${file}: prerendered content missing`);
  assert.ok(html.includes('class="liquid-field"'),`${file}: shared background missing`);
  assert.ok(!/http-equiv=["']refresh/i.test(html),`${file}: redirect remains`);
  assert.ok(html.includes(`rel="canonical" href="https://nurajannatmitu.github.io${base}`));
  for(const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(!url.startsWith("/"))continue;
    assert.ok(url.startsWith(base),`${file}: incorrect root path ${url}`);
    const local=resolve(output,url.slice(base.length).split(/[?#]/)[0]);
    const info=await stat(local).catch(()=>null);
    assert.ok(info,`${file}: missing target ${url}`);
    if(info.isDirectory())await stat(join(local,"index.html"));
    links++;
  }
}
assert.ok(documents>=29,"Public routes and legacy aliases must be emitted");
const css=(await files(join(output,"assets"))).find(f=>f.endsWith(".css"));
assert.ok((await readFile(css,"utf8")).includes(`url(${base}fonts/gothic-display.woff)`));
console.log(`Verified ${documents} prerendered documents, ${links} local links/assets, local font and zero redirects.`);
