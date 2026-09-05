import { ADJACENT } from './game-data';
import { ECONOMY_RULES } from './balance-v832';
import type { Rider, RunState } from './game-engine';

export const TIP_CHANCE = .5;
export const RELAY_CHANCE = .5;
export const RELAY_ENERGY = 4;
export const CROWD_MINIMUM = 4;
export const CROWD_COINS = 3;
export const METER_START = 5;

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
  let tips = 0;
  for (let i = 0; i < opportunities.eligibleTips; i++) if (rng() < TIP_CHANCE) tips += ECONOMY_RULES.tipReward;
  const energy = opportunities.relay && rng() < RELAY_CHANCE ? RELAY_ENERGY : 0;
  return { tips, energy };
}
