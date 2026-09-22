/** Deterministic random streams for the daily shift. Each (seed, channel, floor)
 * gets its own stream, so different choices never shift later draws. */
export const rngFor = (seed: number) => () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const hashText = (text: string) => { let h = 2166136261; for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
export const stream = (seed: number, channel: string, floor: number) => rngFor(hashText(`${seed}/${channel}/${floor}`));
/** Local calendar day, e.g. 2026-09-22. */
export const dailyKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const dailySeed = (key: string) => hashText(`elevator-tales-daily/${key}`);
