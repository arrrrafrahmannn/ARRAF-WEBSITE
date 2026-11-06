/** Reproducible seed buffer: particle motion stays on the GPU. */
export const PARTICLE_COUNT = 10000;
export const DESKTOP_PARTICLES = PARTICLE_COUNT;
export const MOBILE_PARTICLES = PARTICLE_COUNT;
export const CHROME_FORMS = 12;
export const METAL_RIBBONS = 3;
export function particleSeeds(count = DESKTOP_PARTICLES, seed = 42931) {
  let state = seed >>> 0;
  const next = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
  const values = new Float32Array(Math.max(0, Math.floor(count)) * 4);
  for (let i = 0; i < values.length; i++) values[i] = next();
  return values;
}
/** Keep the requested density; adaptation changes resolution, never the draw count. */
export function particleCount() {
  return PARTICLE_COUNT;
}
