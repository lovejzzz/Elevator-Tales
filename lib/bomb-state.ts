import { hasNeighbour, parcelLinks, type Rider } from './game-engine';

/** Bomb timer display state, matching settlement: an adjacent Officer pauses the countdown. */
export function fuseState(cabin: Array<Rider | null>, slot: number, floor: number): 'locked' | 'carried' | 'late' | 'live' | null {
  const rider = cabin[slot];
  if (!rider || rider.fuse === undefined) return null;
  if (hasNeighbour(cabin, slot, ['cop'])) return 'locked';
  // v9.17: an empty-handed Courier holding the bomb who gets off first, before it runs out, carries it away.
  const holder = [...parcelLinks(cabin).bombs].find(([, b]) => b === slot)?.[0];
  if (holder !== undefined && cabin[holder]!.destination < rider.destination && cabin[holder]!.destination - floor <= rider.fuse) return 'carried';
  return rider.fuse < Math.max(0, rider.destination - floor) ? 'late' : 'live';
}
