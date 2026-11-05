/** Reproducible seed buffer: particle motion stays on the GPU. */
export const DESKTOP_PARTICLES = 1400;
export const MOBILE_PARTICLES = 640;
export const CHROME_FORMS = 12;
export const METAL_RIBBONS = 3;
export function particleSeeds(count = DESKTOP_PARTICLES, seed = 42931) {
  let state = seed >>> 0;
  const next = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
  const values = new Float32Array(Math.max(0, Math.floor(count)) * 4);
  for (let i = 0; i < values.length; i++) values[i] = next();
  return values;
}
export function particleCount(mobile: boolean, quality: number) {
  return Math.round((mobile ? MOBILE_PARTICLES : DESKTOP_PARTICLES) * (.65 + .35 * Math.max(.42, Math.min(1, quality))));
}
