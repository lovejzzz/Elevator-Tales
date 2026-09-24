import { BOMB_RULES, bombTick, hasNeighbour, parcelLinks, type Rider } from './game-engine';

/** Bomb timer display state, matching settlement: an adjacent Officer pauses the countdown. */
export function fuseState(cabin: Array<Rider | null>, slot: number, floor: number, stress = 0): 'locked' | 'carried' | 'late' | 'live' | null {
  const rider = cabin[slot];
  if (!rider || rider.kind !== 'bomb' || (rider.fuse === undefined && rider.bombMs === undefined)) return null;
  if (hasNeighbour(cabin, slot, ['cop'])) return 'locked';
  // v9.17: an empty-handed Courier holding the bomb who gets off first, before it runs out, carries it away.
  const holder = [...parcelLinks(cabin).bombs].find(([, b]) => b === slot)?.[0];
  if (BOMB_RULES.realtime && rider.bombMs !== undefined) {
    // Real time: "too late" once fewer than 3 seconds a stop remain; a Courier leaving first still carries it off.
    const stops = (r: Rider) => Math.max(0, r.destination - floor);
    if (holder !== undefined && cabin[holder]!.destination < rider.destination && rider.bombMs >= stops(cabin[holder]!) * 3000) return 'carried';
    return rider.bombMs < stops(rider) * 3000 ? 'late' : 'live';
  }
  if (holder !== undefined && cabin[holder]!.destination < rider.destination && cabin[holder]!.destination - floor <= (rider.fuse ?? 0)) return 'carried';
  // At high agitation an unlocked timer drops faster (BOMB_RULES.highTick per floor).
  return (rider.fuse ?? 0) < Math.max(0, rider.destination - floor) * bombTick(stress) ? 'late' : 'live';
}
