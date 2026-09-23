import { boxOf, type Rider, type RunState } from './game-engine';
import { PASSENGERS, isLegend } from './game-data';
import { riderProfile } from './rider-profile';
import { chargeUnitPrice } from './power-box';

/** Coins one point of agitation per floor is worth in the net estimate (tuned in scripts/balance-sim). */
export const NET_AGITATION_COINS = 3;
const AGITATING = new Set(['thief', 'drunk', 'child']);

/** Card "net" estimate: fare minus the trip's power at the shop charge price, minus the trip's own agitation.
 * It ignores neighbour bonuses on purpose, so a positive number is worth carrying even alone. Null for legends. */
export function netValue(rider: Rider, state: RunState): number | null {
  if (isLegend(rider.kind)) return null;
  const trip = Math.max(1, rider.destination - state.floor);
  const profile = riderProfile(rider, state.cabin);
  const price = chargeUnitPrice(boxOf(state));
  const fare = rider.kind === 'mystery' ? 16 : PASSENGERS[rider.kind].fare;
  const agitation = (profile.agitation ?? 0) + (AGITATING.has(rider.kind) ? 1 : 0) + (rider.volatile ? 1 : 0);
  const refund = rider.kind === 'courier' ? 2 * price : 0;
  return Math.round(fare - trip * profile.energy * price + refund - trip * agitation * NET_AGITATION_COINS);
}
