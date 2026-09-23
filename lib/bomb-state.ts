import { hasNeighbour, type Rider } from './game-engine';

/** Bomb timer display state, matching settlement: an adjacent Officer pauses the countdown. */
export function fuseState(cabin: Array<Rider | null>, slot: number, floor: number): 'locked' | 'late' | 'live' | null {
  const rider = cabin[slot];
  if (!rider || rider.fuse === undefined) return null;
  if (hasNeighbour(cabin, slot, ['cop'])) return 'locked';
  return rider.fuse < Math.max(0, rider.destination - floor) ? 'late' : 'live';
}
