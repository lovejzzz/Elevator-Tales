import { unseatRider, calmPrice, boxOf, calmAllowance, dismissRider, emergencyAllowance, nextShopFloor, applyCalmCharge, arrivalFare, cooperationBonus, type Rider, type RunState } from './game-engine';
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

export type RescuePlan = { remove: Array<{ id: string; kind: Rider['kind']; paid: number }>; charge: number; cost: number };

/** Cheapest way to survive a fatal floor: withdraw new riders (free) or dismiss earlier ones (paid), then charge
 * in transit. Legends are never suggested. Returns null when no combination survives, so the UI can say so. */
export function rescuePlan(state: RunState): RescuePlan | null {
  const risk = departureRisk(state);
  if (!risk.fatal) return null;
  const candidates = state.cabin.filter((r): r is Rider => Boolean(r) && !isLegend(r!.kind) && r!.big !== 'bottom');
  let best: RescuePlan | null = null;
  for (let mask = 0; mask < 1 << candidates.length; mask++) {
    let s = state, paid = 0, ok = true;
    const remove: RescuePlan['remove'] = [];
    candidates.forEach((r, i) => {
      if (!ok || !(mask & (1 << i))) return;
      if (r.boardedAt >= state.floor) { s = { ...s, cabin: unseatRider(s.cabin, r.id) }; remove.push({ id: r.id, kind: r.kind, paid: 0 }); return; }
      const next = dismissRider(s, r.id); if (next === s) { ok = false; return; }
      remove.push({ id: r.id, kind: r.kind, paid: s.coins - next.coins }); paid += s.coins - next.coins; s = next;
    });
    if (!ok || !s.cabin.some(Boolean)) continue;
    const f = energyForecast(s), need = Math.max(0, minimumAfterAscent(s) - (s.energy + (f.certainLowDelta ?? f.lowDelta)));
    if (need > emergencyAllowance(s)) continue;
    const plan = { remove, charge: need, cost: paid + need * risk.unitPrice };
    if (!best || plan.remove.length < best.remove.length || (plan.remove.length === best.remove.length && plan.cost < best.cost)) best = plan;
  }
  return best;
}

export type CalmPlan = { remove: Array<{ id: string; kind: Rider['kind']; paid: number; fare: number }>; manual: boolean; calm: number; cost: number; forfeit: number };

/** Agitation counterpart of rescuePlan: use the free manual relief, withdraw new riders (free) or dismiss earlier ones
 * (paid), then calm in transit, so the worst case after the next floor stays below the cap. Null when nothing survives.
 * v10.2.9 (76F playtest: at 66F the alert offered only “calm −4 · 72 coins” while the free manual relief was unused and
 * dismissing the Taskmaster cost 10): plans are ranked by coins paid plus the fares the removed riders would have paid. */
export function calmRescuePlan(state: RunState): CalmPlan | null {
  // v9.20.1: abyss outbursts are a gamble the ascend button prices separately; the rescue covers what is certain.
  const worst = (s: RunState) => { const f = stressForecast(s); return s.stress + (f.certainHighDelta ?? f.highDelta); };
  // v9.20.3: before a shop, the shop's own relief and repair count (shopAgitationRoom).
  const limit = (s: RunState) => s.stressCap + shopAgitationRoom(s);
  if (state.status !== 'playing' || worst(state) < limit(state)) return null;
  const candidates = state.cabin.filter((r): r is Rider => Boolean(r) && !isLegend(r!.kind) && r!.big !== 'bottom');
  const fareOf = (r: Rider) => r.kind === 'parcel' ? 0 : arrivalFare(r, state.cabin, state.cabin.indexOf(r), cooperationBonus(state), state.stress);
  const manualOptions = state.calmCharge && state.upgrades.calm && state.stress > 0 ? [false, true] : [false];
  const score = (p: CalmPlan) => p.cost + p.forfeit;
  let best: CalmPlan | null = null;
  for (const manual of manualOptions) for (let mask = 0; mask < 1 << candidates.length; mask++) {
    let s = manual ? applyCalmCharge(state) : state, paid = 0, ok = true;
    const remove: CalmPlan['remove'] = [];
    candidates.forEach((r, i) => {
      if (!ok || !(mask & (1 << i))) return;
      if (r.boardedAt >= state.floor) { s = { ...s, cabin: unseatRider(s.cabin, r.id) }; remove.push({ id: r.id, kind: r.kind, paid: 0, fare: fareOf(r) }); return; }
      const next = dismissRider(s, r.id); if (next === s) { ok = false; return; }
      remove.push({ id: r.id, kind: r.kind, paid: s.coins - next.coins, fare: fareOf(r) }); paid += s.coins - next.coins; s = next;
    });
    if (!ok || !s.cabin.some(Boolean)) continue;
    // Calm bought now spends coins the shop's repair would have used, so the room shrinks as it is bought.
    let need = 0;
    while (need <= calmAllowance(s) && worst(s) - need >= limit({ ...s, coins: s.coins - need * calmPrice(state.floor) })) need++;
    if (need > calmAllowance(s)) continue;
    const plan: CalmPlan = { remove, manual, calm: need, cost: paid + need * calmPrice(state.floor), forfeit: remove.reduce((n, r) => n + r.fare, 0) };
    // Cheapest first; on a tie keep more riders, then keep the manual relief for later.
    if (!best || score(plan) < score(best) || (score(plan) === score(best) && (plan.remove.length < best.remove.length || (plan.remove.length === best.remove.length && Number(plan.manual) < Number(best.manual))))) best = plan;
  }
  return best;
}
