import { SYMBOL_RULES, redCount } from './symbols';
import { symbolCoins, boxOf, COURIER_ARRIVAL_CHARGE, PARCEL_RULES, parcelBeside, parcelLinks, boxCoins, boxPower, seatRider, unseatRider, parcelLayoutOk, isBigParcel, cooperationBonus, cooperationRelief, eventPressureMultiplier, riderAgitation, type Rider, type RunState } from './game-engine';
import { passengerBrief } from './passenger-presentation';
import { ADJACENT, PASSENGERS, isAnyLegend, type PassengerKind } from './game-data';
import { riderProfile } from './rider-profile';
import { chargeUnitPrice } from './power-box';
import { isCarrierKind } from './dark-rules';

/** Coins one point of agitation per floor is worth in the net estimate (tuned in scripts/balance-sim). */
export const NET_AGITATION_COINS = 3;
const AGITATING = new Set(['thief', 'drunk', 'child']);

/** Card "net" estimate: fare minus the trip's power at the shop charge price, minus the trip's own agitation.
 * It ignores neighbour bonuses on purpose, so a positive number is worth carrying even alone. Null for legends. */
/** True when the net estimate includes the rider's own agitation (so the card can say so instead of plain coins). */
export function netIncludesAgitation(rider: Rider, state: RunState) {
  return !isAnyLegend(rider.kind) && ((riderProfile(rider, state.cabin).agitation ?? 0) > 0 || AGITATING.has(rider.kind) || Boolean(rider.volatile));
}
export function netValue(rider: Rider, state: RunState): number | null {
  if (isAnyLegend(rider.kind)) return null;
  const trip = Math.max(1, rider.destination - state.floor);
  const profile = riderProfile(rider, state.cabin);
  const price = chargeUnitPrice(boxOf(state), state.floor);
  const fare = rider.kind === 'mystery' ? 12 : rider.kind === 'ghost' ? profile.fare : PASSENGERS[rider.kind].fare;
  const agitation = (profile.agitation ?? 0) + (AGITATING.has(rider.kind) ? 1 : 0) + (rider.volatile ? 1 : 0);
  const refund = rider.kind === 'courier' ? COURIER_ARRIVAL_CHARGE * price : 0;
  // v9.16: a Courier with a parcel is valued as the pair (the parcel's power included); a parcel alone as unclaimed.
  if (rider.kind === 'parcel') return Math.round(boxValue(rider, price) - trip * profile.energy * price * (rider.big ? 2 : 1));
  const parcelPower = rider.parcelId ? trip * PASSENGERS.parcel.energy * price * (rider.parcelBig ? 2 : 1) : 0;
  const bigFare = rider.parcelId ? boxCoins({ big: rider.parcelBig, tier: rider.tier }) - PARCEL_RULES.values.small.common : 0;
  return Math.round(fare + bigFare - trip * profile.energy * price - parcelPower + refund - trip * agitation * NET_AGITATION_COINS);
}

/** Expected arrival fares of everyone in a cabin (hidden fares count as the Mystery's average). */
function cabinFares(state: RunState, cabin: Array<Rider | null>) {
  const bonus = cooperationBonus(state), relief = cooperationRelief(state), mult = eventPressureMultiplier(state);
  return cabin.reduce((sum, r) => {
    if (!r || isAnyLegend(r.kind) || r.kind === 'parcel') return sum;
    const fare = passengerBrief(r, state.floor, cabin, bonus, relief, mult, state.stress).expectedFare;
    return sum + (fare ?? (r.kind === 'mystery' ? 12 : PASSENGERS[r.kind].fare));
  }, 0);
}

/** Total rider agitation per floor in a cabin, after Nurse calming (the engine's own per-seat numbers). */
function cabinAgitation(state: RunState, cabin: Array<Rider | null>) {
  const s = { ...state, cabin };
  return cabin.reduce((sum, r, slot) => sum + (r ? riderAgitation(s, slot).low : 0), 0);
}

/** v9.16 Courier battery refunds (only with his parcel beside him) and the expected contents of unclaimed parcels,
 * in coins at the shop charge price. */
function cabinExtras(state: RunState, cabin: Array<Rider | null>, price: number) {
  const links = parcelLinks(cabin);
  return cabin.reduce((sum, r, slot) => {
    if (r?.kind === 'courier' && r.parcelId && parcelBeside(cabin, slot, links)) return sum + COURIER_ARRIVAL_CHARGE * price;
    if (r?.kind === 'parcel' && r.big !== 'bottom' && !links.carrier.has(slot) && !cabin.some(o => Boolean(r.ownerId) && o?.id === r.ownerId)) return sum + boxValue(r, price);
    return sum;
  }, 0);
}
/** v10: one floor of a cabin's symbol links in coins: coins paid, power saved at the charge price, and the agitation of
 * red links (and Street links) less the calm of Order and Hearth links at NET_AGITATION_COINS a point. */
function symbolWorth(state: RunState, cabin: Array<Rider | null>, price: number) {
  const l = symbolCoins({ ...state, cabin });
  return l.coins + (l.power + l.freePower) * price - (redCount(cabin) * SYMBOL_RULES.redAgitation + l.agitationLines.reduce((n, x) => n + x.amount, 0)) * NET_AGITATION_COINS;
}
/** Expected contents of an unclaimed box in coins: half coins, half power at the shop price. */
const boxValue = (r: Rider, price: number) => (boxCoins(r) + boxPower(r) * price) / 2;

/** v9.14.2 cabin-aware value: what boarding this rider changes in THIS cabin, in coins — everyone's arrival fares
 * (their own plus pairing / neighbour bonuses), minus their trip power, minus the change in the cabin's agitation
 * over their trip at NET_AGITATION_COINS per point (so a Nurse calming a Child counts in her favour). Best empty seat
 * for a rider not yet aboard; their current seat once aboard. Null for legends or a full cabin. */
export function boardNet(rider: Rider, state: RunState): { value: number; seated: boolean } | null {
  if (isAnyLegend(rider.kind)) return null;
  const trip = Math.max(1, rider.destination - state.floor), price = chargeUnitPrice(boxOf(state), state.floor);
  const power = trip * riderProfile(rider, state.cabin).energy * price * (isBigParcel(rider) ? 2 : 1);
  const value = (withRider: Array<Rider | null>, without: Array<Rider | null>) =>
    cabinFares(state, withRider) - cabinFares(state, without) + cabinExtras(state, withRider, price) - cabinExtras(state, without, price) - power - trip * (cabinAgitation(state, withRider) - cabinAgitation(state, without)) * NET_AGITATION_COINS
    // v10: symbol links pay and cost every floor the rider rides.
    + trip * (symbolWorth(state, withRider, price) - symbolWorth(state, without, price));
  const at = state.cabin.findIndex(r => r?.id === rider.id);
  if (at >= 0) return { value: Math.round(value(state.cabin, unseatRider(state.cabin, rider.id))), seated: true };
  let best: number | null = null;
  state.cabin.forEach((r, slot) => {
    const seated = r ? null : seatRider(state.cabin, { ...rider, boardedAt: state.floor }, slot);
    if (!seated) return;
    const v = value(seated, state.cabin);
    if (best === null || v > best) best = v;
  });
  return best === null ? null : { value: Math.round(best), seated: false };
}

/** v9.14.3 partner potential: the rider's value once their best partner (a kind they like) sits beside them.
 * Lets a combination rider show "red now, green when paired" instead of just red. Null when no partner type
 * would add at least 3 coins over the current value, or when the rider is already beside such a partner. */
export function pairedNet(rider: Rider, state: RunState): { value: number; partner: PassengerKind } | null {
  if (isAnyLegend(rider.kind)) return null;
  const now = boardNet(rider, state); if (!now) return null;
  const at = state.cabin.findIndex(r => r?.id === rider.id);
  const trip = Math.max(1, rider.destination - state.floor);
  // v9.20.3: the Smuggler and his black box too (English playtest 8: his card said −9 alone, +11 with the box, and gave no hint).
  if (isCarrierKind(rider.kind) && rider.parcelId) return courierWithParcel(rider, state, now.value, at);
  const likes = riderProfile(rider, state.cabin).bond.likes.filter(k => !isAnyLegend(k)).slice(0, 3);
  if (!likes.length) return null;
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

/** v9.16: a Courier's pairing is his own parcel. Value of the pair (Courier plus parcel beside him, the parcel's
 * power included) when the parcel is not aboard yet; null once it is. */
function courierWithParcel(rider: Rider, state: RunState, now: number, at: number): { value: number; partner: PassengerKind } | null {
  if (state.cabin.some(r => r?.id === rider.parcelId)) return null;
  const parcel: Rider = { id: rider.parcelId!, kind: 'parcel', ownerId: rider.id, destination: rider.destination, patience: 0, boardedAt: state.floor, fareBonus: 0, stash: 0, volatile: false, ...(rider.parcelBig ? { big: 'top' as const, boxId: rider.parcelId } : {}), ...(rider.tier ? { tier: rider.tier } : {}), ...(rider.kind === 'smuggler' ? { contraband: true } : {}) };
  const price = chargeUnitPrice(boxOf(state), state.floor), trip = Math.max(1, rider.destination - state.floor);
  const power = trip * (riderProfile(rider, state.cabin).energy + PASSENGERS.parcel.energy * (rider.parcelBig ? 2 : 1)) * price;
  // Both aboard versus neither aboard (not versus an unclaimed parcel), with both trips' power.
  const without = unseatRider(state.cabin, rider.id);
  let best: number | null = null;
  for (const [a, b] of ADJACENT) for (const [mine, theirs] of [[a, b], [b, a]] as const) {
    if ((at >= 0 ? mine !== at : Boolean(state.cabin[mine])) || state.cabin[theirs]) continue;
    const seated = { ...rider, boardedAt: at >= 0 ? rider.boardedAt : state.floor };
    const withCourier = at >= 0 ? state.cabin : state.cabin.map((r, i) => (i === mine ? seated : r));
    const withBoth = seatRider(withCourier, parcel, theirs);
    if (!withBoth || !parcelLayoutOk(withBoth)) continue;
    const value = cabinFares(state, withBoth) - cabinFares(state, without) + cabinExtras(state, withBoth, price) - cabinExtras(state, without, price) - power
      - trip * (cabinAgitation(state, withBoth) - cabinAgitation(state, without)) * NET_AGITATION_COINS;
    if (best === null || value > best) best = value;
  }
  return best !== null && best >= now + 3 ? { value: Math.round(best), partner: 'parcel' } : null;
}
