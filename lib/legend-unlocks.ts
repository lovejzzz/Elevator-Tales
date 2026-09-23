import { LEGEND_KINDS, passengerCategory, type LegendKind, type PassengerKind } from './game-data';
import { LEGEND_STARTERS, type KeepsakeKey, KEEPSAKE_KEYS } from './legends';

export const LEGEND_UNLOCKS_KEY = 'elevator-tales-legends-v1';
export const KEEPSAKES_SEEN_KEY = 'elevator-tales-keepsakes-v1';

export type RunStats = { floor: number; delivered: Partial<Record<PassengerKind, number>>; keepsakes: KeepsakeKey[] };

/** Unlock rules; shown in the archive so players know what each legend asks for. */
export const LEGEND_UNLOCK_HINTS: Record<LegendKind, [string, string]> = {
  operator: ['完成第一局', 'Finish your first shift'], matchmaker: ['完成第一局', 'Finish your first shift'],
  matron: ['完成第一局', 'Finish your first shift'], tycoon: ['完成第一局', 'Finish your first shift'],
  don: ['一局送达 15 位坏人', 'Deliver 15 criminals in one shift'], nightingale: ['到达第 40 层', 'Reach floor 40'],
  medium: ['一局送达 10 位幽灵', 'Deliver 10 Ghosts in one shift'], stranger: ['收集其他 7 件信物', 'Collect the other 7 keepsakes'],
};

export function nextUnlocks(unlocked: LegendKind[], stats: RunStats, keepsakesSeen: KeepsakeKey[]): LegendKind[] {
  const next = new Set<LegendKind>([...unlocked, ...LEGEND_STARTERS]);
  const bad = Object.entries(stats.delivered).filter(([k]) => passengerCategory(k as PassengerKind) === 'bad').reduce((n, [, v]) => n + (v ?? 0), 0);
  if (bad >= 15) next.add('don');
  if (stats.floor >= 40) next.add('nightingale');
  if ((stats.delivered.ghost ?? 0) >= 10) next.add('medium');
  if (KEEPSAKE_KEYS.every(k => keepsakesSeen.includes(k))) next.add('stranger');
  return LEGEND_KINDS.filter(k => next.has(k));
}

const readList = <T extends string>(key: string, allowed: readonly T[]): T[] => {
  try { const v = JSON.parse(localStorage.getItem(key) ?? '[]'); return Array.isArray(v) ? v.filter((x): x is T => allowed.includes(x)) : []; } catch { return []; }
};
export const loadUnlockedLegends = (hasPlayed: boolean): LegendKind[] => {
  const stored = readList<LegendKind>(LEGEND_UNLOCKS_KEY, LEGEND_KINDS);
  return stored.length ? stored : hasPlayed ? [...LEGEND_STARTERS] : [];
};
export const loadKeepsakesSeen = (): KeepsakeKey[] => readList<KeepsakeKey>(KEEPSAKES_SEEN_KEY, KEEPSAKE_KEYS);
export const saveList = (key: string, list: string[]) => { try { localStorage.setItem(key, JSON.stringify(list)); } catch { /* storage unavailable */ } };

export const LEGEND_BAG_KEY = 'elevator-tales-legend-bag-v1';
/** Shuffle bag: every unlocked legend appears once, in random order, before any repeats, and never twice in a row.
 * Returns a one-legend pool for startRun (empty when nothing is unlocked). */
export function drawLegend(unlocked: LegendKind[], rng: () => number = Math.random): LegendKind[] {
  if (!unlocked.length) return [];
  let bag: LegendKind[] = [], last: LegendKind | null = null;
  try { const saved = JSON.parse(localStorage.getItem(LEGEND_BAG_KEY) ?? '{}'); bag = (saved.bag ?? []).filter((k: LegendKind) => unlocked.includes(k)); last = saved.last ?? null; } catch { /* storage unavailable */ }
  if (!bag.length) {
    bag = [...unlocked];
    for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
    if (bag.length > 1 && bag[0] === last) bag.push(bag.shift()!);
  }
  const next = bag.shift()!;
  try { localStorage.setItem(LEGEND_BAG_KEY, JSON.stringify({ bag, last: next })); } catch { /* storage unavailable */ }
  return [next];
}
