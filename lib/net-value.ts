import { boxOf, cooperationBonus, cooperationRelief, eventPressureMultiplier, riderAgitation, type Rider, type RunState } from './game-engine';
import { passengerBrief } from './passenger-presentation';
import { PASSENGERS, isLegend } from './game-data';
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
