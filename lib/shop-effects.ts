import { ADJACENT, passengerCategory, type UpgradeKey } from './game-data';
import { ECONOMY_RULES } from './balance-v832';
import type { Rider, RunState } from './game-engine';

/** v9.19 ability level 2: once all six slots are full, a shop can raise an installed ability to level 2, +50% on its
 * number (rounded up). Abilities without a single number to raise stay at level 1. */
export const ABILITY_LEVEL2 = { boost: 1.5, price: 60, step: 30, keys: ['battery', 'concierge', 'reinforced', 'tipjar', 'crowd', 'meter', 'insulation', 'single', 'buffer', 'soundproof', 'punchcard', 'dispatch', 'finale'] as UpgradeKey[] };
/** Level-2 effect lines for the shop, [zh, en]. */
export const LEVEL2_TEXT: Partial<Record<UpgradeKey, [string, string]>> = {
  battery: ['每条默契 +3 金币（原 +2）', 'Each bond +3 coins (was +2)'], concierge: ['新乘客小费 +2（原 +1）', 'New riders tip +2 (was +1)'],
  reinforced: ['每十层最多 8 次（原 5 次）', 'Up to 8 times per ten floors (was 5)'], tipjar: ['额外小费 6 金币（原 4）', 'Extra tip 6 coins (was 4)'],
  crowd: ['混乘奖励 9 金币（原 6）', 'Mixed-ticket bonus 9 coins (was 6)'], meter: ['长途奖励 6 金币（原 4）', 'Long-ride bonus 6 coins (was 4)'],
  insulation: ['冲突小费每层最多 5（原 3）', 'Conflict tips up to 5 per floor (was 3)'], single: ['单站奖励 3 金币（原 2）', 'Single-arrival bonus 3 coins (was 2)'],
  buffer: ['每十层最多省 6 电（原 4）', 'Saves up to 6 power per ten floors (was 4)'], soundproof: ['每层抵消最多 2 点红线躁动（原 1）', 'Cancels up to 2 red-link agitation per floor (was 1)'],
  punchcard: ['第五位乘客额外得基价 150%（原 100%）', 'Fifth rider pays 150% of base fare again (was 100%)'], dispatch: ['每十层三次（原两次）', 'Three uses per ten floors (was two)'],
  finale: ['谢幕奖励 12 金币（原 8）', 'Curtain-call bonus 12 coins (was 8)'],
};
export const boosted = (state: Pick<RunState, 'upgrades'>, key: UpgradeKey, value: number) => (state.upgrades[key] ?? 0) >= 2 ? Math.ceil(value * ABILITY_LEVEL2.boost) : value;
export const TIP_CHANCE = .35;
export const RELAY_CHANCE = .5;
export const RELAY_ENERGY = 3;
export const CROWD_MINIMUM = 4;
export const CROWD_COINS = 6;
export const METER_START = 5;
export const METER_COINS = 4;
export const SHOP_TUNING={bufferBoost:0,finaleRemaining:1,bufferGap:0,bufferGapEnergy:4,bufferFlywheel:2,bufferFlywheelSectorCap:4,relayReliable:false,expressMinimum:5,insulationBroad:true,soundproofRisk:true};
export function flywheelAllowance(state:RunState) {
 const cap=boosted(state,'buffer',SHOP_TUNING.bufferFlywheelSectorCap);
 return cap>0?Math.max(0,cap-(state.flywheelSector===Math.floor(state.floor/10)?state.flywheelSpent??0:0)):Infinity;
}
export function consumeFlywheel(state:RunState,saved:number):RunState {
 if(!state.upgrades.buffer||!SHOP_TUNING.bufferFlywheel||!SHOP_TUNING.bufferFlywheelSectorCap)return state;
 const sector=Math.floor(state.floor/10),spent=state.flywheelSector===sector?state.flywheelSpent??0:0;
 return {...state,flywheelSector:sector,flywheelSpent:spent+Math.max(0,Math.min(saved,flywheelAllowance(state)))};
}
export const relayEnergyBounds=():[number,number]=>SHOP_TUNING.relayReliable?[1,3]:[0,RELAY_ENERGY];
export const relayExpectedEnergy=()=>{const [low,high]=relayEnergyBounds();return low+(high-low)*RELAY_CHANCE;};
export function flywheelSaving(state:RunState,arrivals:number,motorHeadroom:number) {
 return state.upgrades.buffer&&SHOP_TUNING.bufferFlywheel&&state.cabin.filter(Boolean).length>=2&&arrivals===0
  ? Math.max(0,Math.min(SHOP_TUNING.bufferFlywheel,motorHeadroom,flywheelAllowance(state))):0;
}
export function deliveryGapCharge(state:RunState,arrivals:number) {
 const gap=SHOP_TUNING.bufferGap;
 if(!gap||!state.upgrades.buffer||SHOP_TUNING.bufferFlywheel)return {progress:0,energy:0};
 const previous=Math.min(gap,state.bufferGapTurns??0);
 return arrivals>0?{progress:0,energy:previous>=gap?SHOP_TUNING.bufferGapEnergy:0}:{progress:Math.min(gap,previous+1),energy:0};
}
export const naturalChargeBoost=(state:RunState,naturalCharge:number)=>state.upgrades.buffer&&naturalCharge>0&&!SHOP_TUNING.bufferFlywheel?SHOP_TUNING.bufferBoost:0;
export const FINALE_COINS = 8;
export const finaleIncome=(state:RunState,arrivals:number,remaining:number)=>state.upgrades.finale&&arrivals>=2&&remaining<=SHOP_TUNING.finaleRemaining?boosted(state,'finale',FINALE_COINS):0;
/** Process-local experimental switches; production uses these defaults. */
export const SHOP_RULES = { expanded: true, grouped: true, mixed: true, optionalCalm: true };
export function mixedTicketEligible(cabin: Array<Rider|null>) {
  return SHOP_RULES.mixed ? new Set(cabin.flatMap(r=>r&&r.kind!=='parcel'?[passengerCategory(r.kind)]:[])).size === 3 : cabin.filter(Boolean).length >= CROWD_MINIMUM;
}
export function deliveryUpgradeIncome(state:RunState,cabin:Array<Rider|null>,slots:number[]) {
  return {
    crowd: state.upgrades.crowd && slots.length && mixedTicketEligible(cabin) ? boosted(state,'crowd',CROWD_COINS) : 0,
    single: state.upgrades.single && slots.length === 1 ? boosted(state,'single',2) : 0,
    meter: state.upgrades.meter ? slots.filter(i=>state.floor+1-cabin[i]!.boardedAt>=METER_START).length*boosted(state,'meter',METER_COINS) : 0,
  };
}

/** Pure opportunity count: neither previews nor rearrangements roll dice.
 * The caller supplies actual arrivals after all Ghost delays, with the
 * pre-exit cabin so simultaneous arrivals still count as neighbors. */
export function shopOpportunities(state: RunState, cabin: Array<Rider | null>, arrivalSlots: number[]) {
  const eligibleTips = state.upgrades.tipjar ? arrivalSlots.filter(slot => {
    const adjacent = ADJACENT.flatMap(([a,b]) => a === slot ? [b] : b === slot ? [a] : []);
    return adjacent.filter(i => cabin[i] && cabin[i]!.kind !== 'parcel').length >= 2;
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
  const [low,high]=relayEnergyBounds();
  const energy = opportunities.relay ? (rng() < RELAY_CHANCE ? high : low) : 0;
  return { tips, energy, winningTipIndices };
}
