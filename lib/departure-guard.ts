import { unseatRider, calmPrice, boxOf, calmAllowance, dismissRider, emergencyAllowance, nextShopFloor, applyCalmCharge, applyItem, arrivalFare, consumeReserveCell, cooperationBonus, itemUsable, outburstSlots, riderAgitation, type Rider, type RunState } from './game-engine';
import { ITEMS, type ItemKey } from './dark-rules';
import { isLegend } from './game-data';
import { energyForecast, sectorForecast, shopAgitationRoom, stressForecast } from './game-forecast';
import { motorCost } from './balance-v832';
import { boxedMotorCost, emergencyUnitPrice } from './power-box';

/** Riders assumed per floor when the shop estimates the next sector's power need. */
export const SECTOR_NEED_RIDERS = 4;

export type DepartureRisk = {
  /** Worst-case power after the next ascent is at or below zero. */
  fatal: boolean;
  /** Power needed right now to survive the next ascent in the worst case. */
  need: number;
  /** In-transit units the player can actually buy now (sector cap, capacity and coins). */
  affordable: number;
  unitPrice: number;
  /** Floor where power runs out at the current cabin's pace, if before the next shop. */
  failFloor: number | null;
};

/** Pure check behind the ascend guard: a floor that can end the run needs a second press. */
/** Power the cabin must still have after the next ascent: arriving at a shop floor (10F, 20F, …) with 0 is safe,
 * matching settlement; anywhere else it must stay above 0. */
export const minimumAfterAscent = (state: RunState) => ((state.floor + 1) % 10 === 0 ? 0 : 1);
export function departureRisk(state: RunState): DepartureRisk {
  // v9.20.1: abyss power drains are a priced gamble (see abyssLossChance), not part of the certain worst case.
  const e = energyForecast(state), worst = state.energy + (e.certainLowDelta ?? e.lowDelta);
  const need = Math.max(0, minimumAfterAscent(state) - worst);
  return { fatal: state.status === 'playing' && need > 0, need, affordable: emergencyAllowance(state), unitPrice: emergencyUnitPrice(boxOf(state)), failFloor: sectorForecast(state).failFloor };
}

/** Shop estimate for the coming sector: motor power plus a typical cabin. Riders who return power are not counted. */
export function sectorNeed(state: RunState): { from: number; to: number; motor: number; riders: number; total: number } {
  const from = state.floor + 1, to = nextShopFloor(state.floor);
  let motor = 0;
  for (let f = from; f <= to; f++) motor += boxedMotorCost(motorCost(f), boxOf(state), f);
  const riders = (to - from + 1) * SECTOR_NEED_RIDERS;
  return { from, to, motor, riders, total: motor + riders };
}

/** One step of a rescue plan that is not coins: an item from the bag (with its target rider, if any). */
export type ItemUse = { key: ItemKey; targetId?: string; targetKind?: Rider['kind'] };
type Removal = { id: string; kind: Rider['kind']; paid: number; fare: number };
/** What a rescue does before paying for charging or calming. `cost` is coins (negative when a Wire Cutter's bomber pays),
 * `forfeit` the fares the removed riders would have paid. */
type Setup = { remove: Removal[]; manual: boolean; items: ItemUse[]; reserve: boolean; state: RunState; cost: number; forfeit: number };

/** v10.2.12 (playtest: a run about to end was told to spend coins while the bag held Incense and a Spare Cell): items the
 * player already owns are part of every rescue. Items cost no coins, so they win over paying; on a tie fewer riders are
 * removed and fewer items spent, and the free manual relief is kept for later. */
const AGITATION_ITEMS: ItemKey[] = ['aroma', 'sandalwood', 'sedative', 'strongsedative', 'flare', 'longflare', 'dismiss', 'holywater', 'cuffs', 'candy', 'cutter'];
const POWER_ITEMS: ItemKey[] = ['cell', 'dismiss', 'cutter'];
function itemUses(state: RunState, keys: ItemKey[]): ItemUse[] {
  const out: ItemUse[] = [];
  for (const key of new Set((state.items ?? []).filter(k => keys.includes(k)))) {
    if (ITEMS[key].target === 'none') { if (itemUsable(state, key)) out.push({ key }); continue; }
    // A sedative only helps on a rider who adds agitation of his own or may lash out.
    const bursting = new Set(outburstSlots(state));
    const worth = (r: Rider, slot: number) => !(key === 'sedative' || key === 'strongsedative') || riderAgitation(state, slot).low > 0 || bursting.has(slot);
    state.cabin.forEach((r, slot) => { if (r && !isLegend(r.kind) && itemUsable(state, key, r) && worth(r, slot)) out.push({ key, targetId: r.id, targetKind: r.kind }); });
  }
  return out;
}
/** Up to two items at once (a bag holds four), never more copies of one item than the bag has. */
function itemCombos(state: RunState, uses: ItemUse[]): ItemUse[][] {
  const combos: ItemUse[][] = [[]];
  uses.forEach((a, i) => { combos.push([a]); for (const b of uses.slice(i + 1)) if (a.key !== b.key || (state.items ?? []).filter(k => k === a.key).length > 1) combos.push([a, b]); });
  return combos;
}
/** Every way to prepare the floor: manual relief, the reserve cell, items, then withdrawing new riders (free) or dismissing
 * earlier ones (paid; at most three removals). Legends and the bottom half of a big box are never suggested. */
function setups(state: RunState, opts: { manual: boolean; reserve: boolean; items: ItemKey[]; impact: (s: RunState) => number }): Setup[] {
  const out: Setup[] = [];
  const fareOf = (r: Rider) => r.kind === 'parcel' ? 0 : arrivalFare(r, state.cabin, state.cabin.indexOf(r), cooperationBonus(state), state.stress);
  const manuals = opts.manual && state.calmCharge && state.upgrades.calm && state.stress > 0 ? [false, true] : [false];
  const reserves = opts.reserve && state.reserveCell && state.energy < state.energyCap ? [false, true] : [false];
  // Keep the search small with a full bag: only the six item uses that help most on their own are combined, and fewer
  // removals are tried alongside many combinations.
  const uses = itemUses(state, opts.items).map(u => ({ u, v: opts.impact(applyItem(state, u.key, u.targetId)) })).sort((a, b) => a.v - b.v).slice(0, 6).map(x => x.u);
  const combos = itemCombos(state, uses);
  const maxRemovals = combos.length > 15 ? 1 : combos.length > 6 ? 2 : 3;
  for (const manual of manuals) for (const reserve of reserves) for (const combo of combos) {
    let base = manual ? applyCalmCharge(state) : state;
    if (reserve) base = consumeReserveCell(base);
    let valid = true;
    for (const u of combo) { const next = applyItem(base, u.key, u.targetId); if (next === base) { valid = false; break; } base = next; }
    if (!valid) continue;
    // Riders an item took off (Exit Pass) lose their fare; a Wire Cutter's bomber pays, so he forfeits nothing.
    const itemForfeit = combo.filter(u => u.key === 'dismiss').reduce((n, u) => n + fareOf(state.cabin.find(r => r?.id === u.targetId)!), 0);
    const candidates = base.cabin.filter((r): r is Rider => Boolean(r) && !isLegend(r!.kind) && r!.big !== 'bottom');
    for (let mask = 0; mask < 1 << candidates.length; mask++) {
      if (mask.toString(2).split('1').length - 1 > maxRemovals) continue;
      let s = base, ok = true;
      const remove: Removal[] = [];
      candidates.forEach((r, i) => {
        if (!ok || !(mask & (1 << i))) return;
        if (r.boardedAt >= state.floor) { s = { ...s, cabin: unseatRider(s.cabin, r.id) }; remove.push({ id: r.id, kind: r.kind, paid: 0, fare: fareOf(r) }); return; }
        const next = dismissRider(s, r.id); if (next === s) { ok = false; return; }
        remove.push({ id: r.id, kind: r.kind, paid: s.coins - next.coins, fare: fareOf(r) }); s = next;
      });
      if (!ok || !s.cabin.some(Boolean)) continue;
      out.push({ remove, manual, items: combo, reserve, state: s, cost: state.coins - s.coins, forfeit: itemForfeit + remove.reduce((n, r) => n + r.fare, 0) });
    }
  }
  return out;
}
const rank = (p: { cost: number; forfeit: number; remove: unknown[]; items: unknown[]; manual: boolean; reserve?: boolean }) => [p.cost + p.forfeit, p.remove.length, p.items.length + Number(p.reserve ?? false), Number(p.manual)];
const before = (a: number[], b: number[]) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i]; return false; };

export type RescuePlan = { remove: Removal[]; items: ItemUse[]; reserve: boolean; manual: boolean; charge: number; cost: number; forfeit: number };
/** Cheapest way to survive a fatal floor: the reserve cell and items first, withdraw new riders (free) or dismiss earlier
 * ones (paid), then charge in transit. Returns null when no combination survives, so the UI can say so. */
export function rescuePlan(state: RunState): RescuePlan | null {
  const risk = departureRisk(state);
  if (!risk.fatal) return null;
  let best: RescuePlan | null = null;
  for (const set of setups(state, { manual: false, reserve: true, items: POWER_ITEMS, impact: s => -(s.energy + (energyForecast(s).certainLowDelta ?? energyForecast(s).lowDelta)) })) {
    const s = set.state, f = energyForecast(s), need = Math.max(0, minimumAfterAscent(s) - (s.energy + (f.certainLowDelta ?? f.lowDelta)));
    if (need > emergencyAllowance(s)) continue;
    const plan: RescuePlan = { remove: set.remove, items: set.items, reserve: set.reserve, manual: false, charge: need, cost: set.cost + need * risk.unitPrice, forfeit: set.forfeit };
    if (!best || before(rank(plan), rank(best))) best = plan;
  }
  return best;
}

export type CalmPlan = { remove: Removal[]; manual: boolean; items: ItemUse[]; calm: number; cost: number; forfeit: number };
/** Agitation counterpart of rescuePlan: the free manual relief and items, withdrawals and dismissals, then calming in
 * transit, so the worst case after the next floor stays below the cap. Null when nothing survives.
 * v10.2.9 (76F playtest: 72 coins of calming while the free relief sat unused) ranks by coins plus lost fares. */
export function calmRescuePlan(state: RunState): CalmPlan | null {
  // v9.20.1: abyss outbursts are a gamble the ascend button prices separately; the rescue covers what is certain.
  const worst = (s: RunState) => { const f = stressForecast(s); return s.stress + (f.certainHighDelta ?? f.highDelta); };
  // v9.20.3: before a shop, the shop's own relief and repair count (shopAgitationRoom).
  const limit = (s: RunState) => s.stressCap + shopAgitationRoom(s);
  if (state.status !== 'playing' || worst(state) < limit(state)) return null;
  let best: CalmPlan | null = null;
  for (const set of setups(state, { manual: true, reserve: false, items: AGITATION_ITEMS, impact: worst })) {
    const s = set.state;
    // Calm bought now spends coins the shop's repair would have used, so the room shrinks as it is bought.
    let need = 0;
    while (need <= calmAllowance(s) && worst(s) - need >= limit({ ...s, coins: s.coins - need * calmPrice(state.floor) })) need++;
    if (need > calmAllowance(s)) continue;
    const plan: CalmPlan = { remove: set.remove, manual: set.manual, items: set.items, calm: need, cost: set.cost + need * calmPrice(state.floor), forfeit: set.forfeit };
    if (!best || before(rank(plan), rank(best))) best = plan;
  }
  return best;
}

export type GamblePlan = CalmPlan & { chance: number };
/** v10.2.11 (96F playtest: at 95F, 64% to boil over; calming to safe cost 96 coins it did not have, so the alert offered
 * nothing, while one 24-coin calm made it 16%). The cheapest plan that brings the boil-over chance under `target`; when
 * nothing does, the plan with the lowest chance. Null when nothing lowers it at all. */
export function gambleRescuePlan(state: RunState, target: number): GamblePlan | null {
  if (state.status !== 'playing') return null;
  const chanceOf = (s: RunState) => stressForecast(s).lossChance ?? 0;
  const start = chanceOf(state);
  if (start < target) return null;
  const better = (p: GamblePlan, b: GamblePlan | null) => {
    if (!b) return true;
    const pOk = p.chance < target, bOk = b.chance < target;
    if (pOk !== bOk) return pOk;
    if (!pOk && p.chance !== b.chance) return p.chance < b.chance;
    const [ps, ...pr] = rank(p), [bs, ...br] = rank(b);
    return before([ps, p.chance, ...pr], [bs, b.chance, ...br]);
  };
  let best: GamblePlan | null = null;
  for (const set of setups(state, { manual: true, reserve: false, items: AGITATION_ITEMS, impact: chanceOf })) {
    // More calming only costs more once the chance is under the target, so stop there.
    for (let calm = 0; calm <= calmAllowance(set.state); calm++) {
      if (!set.manual && !set.remove.length && !set.items.length && !calm) continue;
      const chance = chanceOf({ ...set.state, stress: set.state.stress - calm });
      const plan: GamblePlan = { remove: set.remove, manual: set.manual, items: set.items, calm, cost: set.cost + calm * calmPrice(state.floor), forfeit: set.forfeit, chance };
      if (chance < start && better(plan, best)) best = plan;
      if (chance < target) break;
    }
  }
  return best;
}
