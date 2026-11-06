import {build} from "vite";
import react from "@vitejs/plugin-react";
import {readFile,writeFile,mkdir,rm} from "node:fs/promises";
import {resolve,dirname} from "node:path";
import {pathToFileURL} from "node:url";

const root=process.cwd();
const out=resolve(root,"pages-dist");
const ssr=resolve(root,".sites-runtime/pages-render");
const base="/ARRAF-WEBSITE/";
const common={
  configFile:false,root,base,plugins:[react()],
  define:{__PAGES_BUILD__:"true"},
  resolve:{alias:{"@":root,"next/navigation":resolve(root,"pages-site/navigation.tsx")}},
};
await build({...common,build:{outDir:out,emptyOutDir:true,rollupOptions:{input:resolve(root,"pages-site/index.html")}}});
await build({...common,publicDir:false,build:{ssr:resolve(root,"pages-site/render.tsx"),outDir:ssr,emptyOutDir:true,rollupOptions:{output:{entryFileNames:"render.mjs"}}}});
const {render,routes,titleFor}=await import(pathToFileURL(resolve(ssr,"render.mjs")).href);
const template=await readFile(resolve(out,"pages-site/index.html"),"utf8");
const escape=s=>s.replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;");
async function document(route,path,canonicalRoute=route){
  const canonical=`https://nurajannatmitu.github.io${base}${canonicalRoute==="/"?"":canonicalRoute.slice(1)+"/"}`;
  const html=template.replace(/<title>.*?<\/title>/,`<title>${escape(titleFor(route))} — ARRAFED</title>`)
    .replace('data-route="/"',`data-route="${escape(route)}"`)
    .replace("<!--studio-->",render(route))
    .replace("<!--canonical-->",`<link rel="canonical" href="${canonical}">`);
  await mkdir(dirname(path),{recursive:true});await writeFile(path,html);
}
for(const route of routes){
  await document(route,resolve(out,route.slice(1),"index.html"));
  if(route!=="/")await document(route,resolve(out,route.slice(1)+".html"));
}
await document("/pricing",resolve(out,"packages.html"));
await document("/404",resolve(out,"404.html"));
await writeFile(resolve(out,".nojekyll"),"");
await writeFile(resolve(out,"robots.txt"),`User-agent: *\nAllow: /\nSitemap: https://nurajannatmitu.github.io${base}sitemap.xml\n`);
await writeFile(resolve(out,"sitemap.xml"),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(r=>`<url><loc>https://nurajannatmitu.github.io${base}${r==="/"?"":r.slice(1)+"/"}</loc></url>`).join("")}</urlset>`);
await rm(resolve(out,"pages-site"),{recursive:true,force:true});
console.log(`Prerendered ${routes.length} routes to ${out}; no redirects.`);
