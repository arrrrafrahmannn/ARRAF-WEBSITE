/** Pure, reversible scroll choreography. There are no timers or one-shot reveals. */
export type Scene = {
  x: number;
  y: number;
  scale: number;
  melt: number;
  rotation: number;
  warmth: number;
  depth: number;
};
export const sceneKeyframes: readonly (Scene & { at: number })[] = [
  { at: 0, x: .78, y: -.03, scale: 1.32, melt: .12, rotation: -.18, warmth: .05, depth: .12 },
  { at: .18, x: -.85, y: -.22, scale: 1.86, melt: .38, rotation: .46, warmth: .54, depth: .29 },
  { at: .39, x: .88, y: .08, scale: 1.5, melt: .72, rotation: -.32, warmth: .1, depth: .5 },
  { at: .59, x: -.56, y: -.13, scale: 2.12, melt: .93, rotation: .72, warmth: .78, depth: .7 },
  { at: .8, x: .64, y: .22, scale: 1.6, melt: .26, rotation: -.48, warmth: .38, depth: .9 },
  { at: 1, x: .05, y: -.08, scale: 2.46, melt: .6, rotation: .12, warmth: .1, depth: 1 },
];
export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export const smootherstep = (value: number) => { const t = clamp(value); return t * t * t * (t * (t * 6 - 15) + 10); };
export const follow = (current: number, target: number, seconds: number) => current + (target - current) * (1 - Math.exp(-12 * clamp(seconds, 0, .1)));
export function sampleScene(progress: number, mobile = false): Scene {
  const p = clamp(progress);
  let i = 0;
  while (i < sceneKeyframes.length - 2 && p > sceneKeyframes[i + 1].at) i++;
  const a = sceneKeyframes[i], b = sceneKeyframes[i + 1];
  const t = smootherstep((p - a.at) / (b.at - a.at));
  const mix = (key: keyof Scene) => a[key] + (b[key] - a[key]) * t;
  return { x: mix('x') * (mobile ? .42 : 1), y: mix('y'), scale: mix('scale') * (mobile ? .85 : 1), melt: mix('melt'), rotation: mix('rotation'), warmth: mix('warmth'), depth: mix('depth') };
}
export function sectionMotion(scroll: number, top: number, height: number, viewport: number) {
  const progress = clamp((scroll + viewport - top) / Math.max(1, viewport + height));
  const signed = (progress - .5) * 2;
  return { progress, shift: signed * -28, turn: signed * 1.6, light: 1 - Math.abs(signed) * .3 };
}
export function renderSize(width: number, height: number, dpr: number, quality = 1) {
  const w = Math.max(1, width), h = Math.max(1, height);
  const budget = (width < 760 ? 280000 : 560000) * clamp(quality, .42, 1);
  const density = Math.min(Math.max(.1, dpr), 1.4, Math.sqrt(budget / (w * h)));
  return { width: Math.max(1, Math.round(w * density)), height: Math.max(1, Math.round(h * density)) };
}
