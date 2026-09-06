import { ADJACENT, passengerCategory } from './game-data';
import { ECONOMY_RULES } from './balance-v832';
import type { Rider, RunState } from './game-engine';

export const TIP_CHANCE = .5;
export const RELAY_CHANCE = .5;
export const RELAY_ENERGY = 4;
export const CROWD_MINIMUM = 4;
export const CROWD_COINS = 3;
export const METER_START = 5;
export const SHOP_TUNING={bufferBoost:0,finaleRemaining:1,bufferGap:0,bufferGapEnergy:4};
export function deliveryGapCharge(state:RunState,arrivals:number) {
 const gap=SHOP_TUNING.bufferGap;
 if(!gap||!state.upgrades.buffer)return {progress:0,energy:0};
 const previous=Math.min(gap,state.bufferGapTurns??0);
 return arrivals>0?{progress:0,energy:previous>=gap?SHOP_TUNING.bufferGapEnergy:0}:{progress:Math.min(gap,previous+1),energy:0};
}
export const naturalChargeBoost=(state:RunState,naturalCharge:number)=>state.upgrades.buffer&&naturalCharge>0?SHOP_TUNING.bufferBoost:0;
export const finaleIncome=(state:RunState,arrivals:number,remaining:number)=>state.upgrades.finale&&arrivals>=2&&remaining<=SHOP_TUNING.finaleRemaining?6:0;
/** Process-local experimental switches; production uses these defaults. */
export const SHOP_RULES = { expanded: true, grouped: true, mixed: true, optionalCalm: true };
export function mixedTicketEligible(cabin: Array<Rider|null>) {
  return SHOP_RULES.mixed ? new Set(cabin.flatMap(r=>r?[passengerCategory(r.kind)]:[])).size === 3 : cabin.filter(Boolean).length >= CROWD_MINIMUM;
}
export function deliveryUpgradeIncome(state:RunState,cabin:Array<Rider|null>,slots:number[]) {
  return {
    crowd: state.upgrades.crowd && slots.length && mixedTicketEligible(cabin) ? CROWD_COINS : 0,
    single: state.upgrades.single && slots.length === 1 ? 2 : 0,
    meter: state.upgrades.meter ? slots.filter(i=>state.floor+1-cabin[i]!.boardedAt>=METER_START).length*4 : 0,
  };
}

/** Pure opportunity count: neither previews nor rearrangements roll dice.
 * The caller supplies actual arrivals after all Ghost delays, with the
 * pre-exit cabin so simultaneous arrivals still count as neighbors. */
export function shopOpportunities(state: RunState, cabin: Array<Rider | null>, arrivalSlots: number[]) {
  const eligibleTips = state.upgrades.tipjar ? arrivalSlots.filter(slot => {
    const adjacent = ADJACENT.flatMap(([a,b]) => a === slot ? [b] : b === slot ? [a] : []);
    return adjacent.filter(i => cabin[i]).length >= 2;
  }).length : 0;
  return { eligibleTips, relay: Boolean(state.upgrades.relay && arrivalSlots.length >= 2) };
}

export function shopFloorIncome(_state: RunState) {
  // v8.31: delivery-only bonuses are resolved from actual arrival slots.
  // Kept as a compatibility API; waiting itself never creates this income.
  return { crowd: 0, meter: 0 };
}

export function rollShopRewards(opportunities: ReturnType<typeof shopOpportunities>, rng: () => number) {
  let tips = 0; const winningTipIndices:number[]=[];
  for (let i = 0; i < opportunities.eligibleTips; i++) if (rng() < TIP_CHANCE) { tips += ECONOMY_RULES.tipReward; winningTipIndices.push(i); }
  const energy = opportunities.relay && rng() < RELAY_CHANCE ? RELAY_ENERGY : 0;
  return { tips, energy, winningTipIndices };
}
