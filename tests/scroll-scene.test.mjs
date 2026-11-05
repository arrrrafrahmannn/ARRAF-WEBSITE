import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../lib/scroll-scene.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { sampleScene, sceneKeyframes, follow, sectionMotion, renderSize } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);

test('scroll endpoints are deterministic and do not extrapolate', () => {
  assert.deepEqual(sampleScene(-1), sampleScene(0));
  assert.deepEqual(sampleScene(2), sampleScene(1));
  assert.deepEqual(sampleScene(NaN), sampleScene(0));
  assert.equal(sampleScene(0).x, sceneKeyframes[0].x);
  assert.equal(sampleScene(1).melt, sceneKeyframes.at(-1).melt);
});
test('all chapters have distinct poses and constrained material values', () => {
  const values = sceneKeyframes.map(k => sampleScene(k.at));
  assert.equal(new Set(values.map(v => JSON.stringify(v))).size, values.length);
  for (let i = 0; i <= 1000; i++) {
    const s = sampleScene(i / 1000);
    assert.ok(Object.values(s).every(Number.isFinite));
    assert.ok(s.melt >= 0 && s.melt <= 1 && s.warmth >= 0 && s.warmth <= 1);
    assert.ok(s.scale >= 1 && s.scale <= 2.5);
  }
});
test('poses are continuous across every section boundary', () => {
  for (const k of sceneKeyframes.slice(1, -1)) {
    const before = sampleScene(k.at - .00001), after = sampleScene(k.at + .00001);
    for (const key of Object.keys(before)) assert.ok(Math.abs(before[key] - after[key]) < .00001, key);
  }
});
test('scroll is reversible with no once-only state', () => {
  const forward = Array.from({ length: 101 }, (_, i) => sampleScene(i / 100));
  const reverse = Array.from({ length: 101 }, (_, i) => sampleScene((100 - i) / 100)).reverse();
  assert.deepEqual(forward, reverse);
});
test('easing is stable at 30, 60 and 120 Hz and never overshoots', () => {
  const endpoints = [30, 60, 120].map(hz => {
    let position = 0;
    for (let i = 0; i < hz; i++) { position = follow(position, 1, 1 / hz); assert.ok(position >= 0 && position <= 1); }
    return position;
  });
  assert.ok(Math.max(...endpoints) - Math.min(...endpoints) < .000001);
  assert.equal(follow(0, 1, 0), 0);
  assert.ok(follow(0, 1, 10) < 1);
});
test('mobile retains the same material progression with a gentler camera', () => {
  for (let p = 0; p <= 1; p += .05) {
    const desktop = sampleScene(p), mobile = sampleScene(p, true);
    assert.equal(mobile.melt, desktop.melt);
    assert.equal(mobile.warmth, desktop.warmth);
    assert.ok(Math.abs(mobile.x) <= Math.abs(desktop.x));
    assert.ok(mobile.scale < desktop.scale);
  }
});
test('local section details track scroll continuously in both directions', () => {
  const before = sectionMotion(0, 900, 800, 900);
  const center = sectionMotion(850, 900, 800, 900);
  const after = sectionMotion(1700, 900, 800, 900);
  assert.equal(before.progress, 0); assert.equal(center.progress, .5); assert.equal(after.progress, 1);
  assert.equal(before.shift, -after.shift); assert.ok(Math.abs(center.shift) < .000001);
  assert.ok(sectionMotion(101, 900, 800, 900).progress > sectionMotion(100, 900, 800, 900).progress);
});
test('adaptive resolution preserves aspect and bounds allocation on large displays', () => {
  for (const [w,h,dpr] of [[390,844,3],[1440,900,2],[5120,2880,3],[1,1,1]]) {
    const a = renderSize(w,h,dpr), b = renderSize(w,h,dpr,.45);
    assert.ok(a.width > 0 && a.height > 0 && a.width*a.height < 562000);
    assert.ok(b.width*b.height <= a.width*a.height);
    assert.ok(Math.abs(a.width/a.height-w/h) < .02);
  }
});
test('one global canvas covers every route and motion preferences are explicit', async () => {
  const [layout,home,renderer,css] = await Promise.all(['../app/layout.tsx','../app/page.tsx','../components/liquid-steel.tsx','../app/liquid-glass.css'].map(p=>readFile(new URL(p,import.meta.url),'utf8')));
  assert.equal((layout.match(/<LiquidSteel\s*\/>/g)||[]).length,1);
  assert.ok(!home.includes('<LiquidSteel'));
  assert.match(renderer,/prefers-reduced-motion: reduce/);
  assert.match(renderer,/visibilitychange/);
  assert.match(renderer,/passive: true/);
  assert.match(renderer,/disabled=\{prefersReduced\}/);
  assert.match(css,/\.liquid-field\{position:fixed;inset:0;width:100%;height:100%/);
  assert.match(css,/prefers-reduced-transparency:reduce/);
});
