import { boxOf, cooperationBonus, cooperationRelief, eventPressureMultiplier, riderAgitation, type Rider, type RunState } from './game-engine';
import { passengerBrief } from './passenger-presentation';
import { ADJACENT, PASSENGERS, isLegend, type PassengerKind } from './game-data';
import { riderProfile } from './rider-profile';
import { chargeUnitPrice } from './power-box';

/** Coins one point of agitation per floor is worth in the net estimate (tuned in scripts/balance-sim). */
export const NET_AGITATION_COINS = 3;
const AGITATING = new Set(['thief', 'drunk', 'child']);

/** Card "net" estimate: fare minus the trip's power at the shop charge price, minus the trip's own agitation.
 * It ignores neighbour bonuses on purpose, so a positive number is worth carrying even alone. Null for legends. */
/** True when the net estimate includes the rider's own agitation (so the card can say so instead of plain coins). */
export function netIncludesAgitation(rider: Rider, state: RunState) {
  return !isLegend(rider.kind) && ((riderProfile(rider, state.cabin).agitation ?? 0) > 0 || AGITATING.has(rider.kind) || Boolean(rider.volatile));
}
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

/** Expected arrival fares of everyone in a cabin (hidden fares count as the Mystery's average). */
function cabinFares(state: RunState, cabin: Array<Rider | null>) {
  const bonus = cooperationBonus(state), relief = cooperationRelief(state), mult = eventPressureMultiplier(state);
  return cabin.reduce((sum, r) => {
    if (!r || isLegend(r.kind)) return sum;
    const fare = passengerBrief(r, state.floor, cabin, bonus, relief, mult, state.stress).expectedFare;
    return sum + (fare ?? (r.kind === 'mystery' ? 16 : PASSENGERS[r.kind].fare));
  }, 0);
}

/** Total rider agitation per floor in a cabin, after Nurse calming (the engine's own per-seat numbers). */
function cabinAgitation(state: RunState, cabin: Array<Rider | null>) {
  const s = { ...state, cabin };
  return cabin.reduce((sum, r, slot) => sum + (r ? riderAgitation(s, slot).low : 0), 0);
}

/** v9.14.2 cabin-aware value: what boarding this rider changes in THIS cabin, in coins — everyone's arrival fares
 * (their own plus pairing / neighbour bonuses), minus their trip power, minus the change in the cabin's agitation
 * over their trip at NET_AGITATION_COINS per point (so a Nurse calming a Child counts in her favour). Best empty seat
 * for a rider not yet aboard; their current seat once aboard. Null for legends or a full cabin. */
export function boardNet(rider: Rider, state: RunState): { value: number; seated: boolean } | null {
  if (isLegend(rider.kind)) return null;
  const trip = Math.max(1, rider.destination - state.floor), price = chargeUnitPrice(boxOf(state));
  const power = trip * riderProfile(rider, state.cabin).energy * price - (rider.kind === 'courier' ? 2 * price : 0);
  const value = (withRider: Array<Rider | null>, without: Array<Rider | null>) =>
    cabinFares(state, withRider) - cabinFares(state, without) - power - trip * (cabinAgitation(state, withRider) - cabinAgitation(state, without)) * NET_AGITATION_COINS;
  const at = state.cabin.findIndex(r => r?.id === rider.id);
  if (at >= 0) return { value: Math.round(value(state.cabin, state.cabin.map((r, i) => (i === at ? null : r)))), seated: true };
  let best: number | null = null;
  state.cabin.forEach((r, slot) => {
    if (r) return;
    const v = value(state.cabin.map((x, i) => (i === slot ? { ...rider, boardedAt: state.floor } : x)), state.cabin);
    if (best === null || v > best) best = v;
  });
  return best === null ? null : { value: Math.round(best), seated: false };
}

/** v9.14.3 partner potential: the rider's value once their best partner (a kind they like) sits beside them.
 * Lets a combination rider show "red now, green when paired" instead of just red. Null when no partner type
 * would add at least 3 coins over the current value, or when the rider is already beside such a partner. */
export function pairedNet(rider: Rider, state: RunState): { value: number; partner: PassengerKind } | null {
  if (isLegend(rider.kind)) return null;
  const now = boardNet(rider, state); if (!now) return null;
  const likes = riderProfile(rider, state.cabin).bond.likes.filter(k => !isLegend(k)).slice(0, 3);
  if (!likes.length) return null;
  const at = state.cabin.findIndex(r => r?.id === rider.id);
  const trip = Math.max(1, rider.destination - state.floor);
  let best: { value: number; partner: PassengerKind } | null = null;
  for (const kind of likes) {
    const partner: Rider = { id: `hypothetical-${kind}`, kind, destination: state.floor + trip, patience: 0, boardedAt: state.floor, fareBonus: 0, stash: 0, volatile: false };
    // A partner of this kind is already aboard (not yet seated rider) or already beside them: the current value covers it.
    if (at < 0 && state.cabin.some(r => r?.kind === kind)) continue;
    if (at >= 0 && ADJACENT.some(([a, b]) => (a === at && state.cabin[b]?.kind === kind) || (b === at && state.cabin[a]?.kind === kind))) return null;
    for (const [a, b] of ADJACENT) for (const [mine, theirs] of [[a, b], [b, a]] as const) {
      const mineOk = at >= 0 ? mine === at : !state.cabin[mine];
      if (!mineOk || state.cabin[theirs]) continue;
      // Partner in the neighbouring seat, rider in theirs: the rider's value with the partner present.
      const seated = { ...rider, boardedAt: at >= 0 ? rider.boardedAt : state.floor };
      const cabin = state.cabin.map((r, i) => (i === theirs ? partner : i === mine ? seated : r));
      const value = boardNet(seated, { ...state, cabin })?.value;
      if (value !== undefined && value !== null && (!best || value > best.value)) best = { value, partner: kind };
    }
  }
  return best && best.value >= now.value + 3 ? best : null;
}
