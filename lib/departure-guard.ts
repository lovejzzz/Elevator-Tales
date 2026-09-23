import { calmPrice, boxOf, calmAllowance, dismissRider, emergencyAllowance, nextShopFloor, type Rider, type RunState } from './game-engine';
import { isLegend } from './game-data';
import { energyForecast, sectorForecast, stressForecast } from './game-forecast';
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
export function departureRisk(state: RunState): DepartureRisk {
  const worst = state.energy + energyForecast(state).lowDelta;
  const need = Math.max(0, 1 - worst);
  return { fatal: state.status === 'playing' && worst <= 0, need, affordable: emergencyAllowance(state), unitPrice: emergencyUnitPrice(boxOf(state)), failFloor: sectorForecast(state).failFloor };
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
  const candidates = state.cabin.filter((r): r is Rider => Boolean(r) && !isLegend(r!.kind));
  let best: RescuePlan | null = null;
  for (let mask = 0; mask < 1 << candidates.length; mask++) {
    let s = state, paid = 0, ok = true;
    const remove: RescuePlan['remove'] = [];
    candidates.forEach((r, i) => {
      if (!ok || !(mask & (1 << i))) return;
      if (r.boardedAt >= state.floor) { s = { ...s, cabin: s.cabin.map(x => (x?.id === r.id ? null : x)) }; remove.push({ id: r.id, kind: r.kind, paid: 0 }); return; }
      const next = dismissRider(s, r.id); if (next === s) { ok = false; return; }
      remove.push({ id: r.id, kind: r.kind, paid: s.coins - next.coins }); paid += s.coins - next.coins; s = next;
    });
    if (!ok || !s.cabin.some(Boolean)) continue;
    const need = Math.max(0, 1 - (s.energy + energyForecast(s).lowDelta));
    if (need > emergencyAllowance(s)) continue;
    const plan = { remove, charge: need, cost: paid + need * risk.unitPrice };
    if (!best || plan.remove.length < best.remove.length || (plan.remove.length === best.remove.length && plan.cost < best.cost)) best = plan;
  }
  return best;
}

export type CalmPlan = { remove: Array<{ id: string; kind: Rider['kind']; paid: number }>; calm: number; cost: number };

/** Agitation counterpart of rescuePlan: withdraw new riders (free) or dismiss earlier ones (paid), then calm in transit,
 * so the worst case after the next floor stays below the cap. Null when nothing survives. */
export function calmRescuePlan(state: RunState): CalmPlan | null {
  const worst = (s: RunState) => s.stress + stressForecast(s).highDelta;
  if (state.status !== 'playing' || worst(state) < state.stressCap) return null;
  const candidates = state.cabin.filter((r): r is Rider => Boolean(r) && !isLegend(r!.kind));
  let best: CalmPlan | null = null;
  for (let mask = 0; mask < 1 << candidates.length; mask++) {
    let s = state, paid = 0, ok = true;
    const remove: CalmPlan['remove'] = [];
    candidates.forEach((r, i) => {
      if (!ok || !(mask & (1 << i))) return;
      if (r.boardedAt >= state.floor) { s = { ...s, cabin: s.cabin.map(x => (x?.id === r.id ? null : x)) }; remove.push({ id: r.id, kind: r.kind, paid: 0 }); return; }
      const next = dismissRider(s, r.id); if (next === s) { ok = false; return; }
      remove.push({ id: r.id, kind: r.kind, paid: s.coins - next.coins }); paid += s.coins - next.coins; s = next;
    });
    if (!ok || !s.cabin.some(Boolean)) continue;
    const need = Math.max(0, worst(s) - s.stressCap + 1);
    if (need > calmAllowance(s)) continue;
    const plan = { remove, calm: need, cost: paid + need * calmPrice(state.floor) };
    if (!best || plan.remove.length < best.remove.length || (plan.remove.length === best.remove.length && plan.cost < best.cost)) best = plan;
  }
  return best;
}
