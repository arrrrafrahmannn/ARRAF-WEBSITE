import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../lib/particle-field.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {particleSeeds,particleCount,DESKTOP_PARTICLES,MOBILE_PARTICLES,PARTICLE_COUNT,CHROME_FORMS,METAL_RIBBONS}=await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
test('seed buffer is deterministic and fills a bounded GPU allocation',()=>{
 const a=particleSeeds(),b=particleSeeds();assert.deepEqual(a,b);assert.equal(a.length,DESKTOP_PARTICLES*4);assert.equal(PARTICLE_COUNT,10000);assert.equal(a.byteLength,160000);
 assert.ok(a.every(v=>Number.isFinite(v)&&v>=0&&v<=1));assert.notDeepEqual(a,particleSeeds(DESKTOP_PARTICLES,72));
});
test('particles occupy the full field instead of one central cluster',()=>{
 const seeds=particleSeeds(),cells=new Set();let flakes=0;
 for(let i=0;i<seeds.length;i+=4){cells.add(`${Math.min(3,Math.floor(seeds[i]*4))}:${Math.min(3,Math.floor(seeds[i+1]*4))}`);if(seeds[i+3]>=.994)flakes++;}
 assert.equal(cells.size,16);assert.ok(flakes>30&&flakes<100);
});
test('every viewport retains the complete ten-thousand-point draw within the seed buffer',()=>{
 assert.equal(DESKTOP_PARTICLES,10000);assert.equal(MOBILE_PARTICLES,10000);
 assert.equal(particleCount(),10000);
 assert.equal(particleSeeds().length/4,particleCount());
 assert.equal(CHROME_FORMS,12);assert.equal(METAL_RIBBONS,3);
});
