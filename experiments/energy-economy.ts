// Offline experiment only. Nothing in app/ or components/ imports this module.
import {
  agitationThreshold,
  difficultyTier,
  hasNeighbour,
  initialRun,
  installUpgrade,
  resolveFloor,
  totalWeight,
  travelEnergyCost,
  upgradeChoices,
  upgradePrice,
  type RunState,
  type UpgradeCrisis,
} from '../experiments/v5/game-engine';

export type Economy = {
  id: string;
  live?: boolean;
  start: number;
  capacity?: number;
  noNegativeCheckpoint?: boolean;
  risingDraw: boolean;
  unitPrice: number;
  risingPrice?: boolean;
};
export const ECONOMIES: Economy[] = [
  { id: 'live', live: true, start: 15, risingDraw: true, unitPrice: 0 },
  { id: 'delete-only', start: 15, risingDraw: true, unitPrice: 2 },
  { id: 'literal', start: 24, risingDraw: true, unitPrice: 2 },
  { id: 'flat-cheap', start: 24, risingDraw: false, unitPrice: 1 },
  { id: 'flat', start: 24, risingDraw: false, unitPrice: 2 },
  { id: 'flat-expensive', start: 24, risingDraw: false, unitPrice: 3 },
  {
    id: 'flat-tariff',
    start: 24,
    risingDraw: false,
    unitPrice: 2,
    risingPrice: true,
  },
];
export const seeded = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
// Independent floor/event/offer/shop streams keep earlier deaths or different draws
// from shifting every subsequent offer. Policies do not see these streams.
export const stream = (seed: number, floor: number, channel: number) =>
  seeded(
    (seed ^ Math.imul(floor, 0x45d9f3b) ^ Math.imul(channel, 0x27d4eb2d)) >>> 0,
  );
export const initialEconomy = (economy: Economy): RunState => {
  const state = initialRun();
  const energyCap = economy.capacity ?? state.energyCap;
  if (
    !Number.isSafeInteger(energyCap) ||
    energyCap < 1 ||
    !Number.isSafeInteger(economy.start) ||
    economy.start < 1 ||
    economy.start > energyCap
  )
    throw new RangeError(
      'Starting electricity must be positive and within capacity',
    );
  return { ...state, energy: economy.start, energyCap };
};
export const draw = (floor: number, economy: Economy) =>
  economy.risingDraw ? travelEnergyCost(floor) : 2;
export const tariff = (state: RunState, economy: Economy) =>
  economy.unitPrice +
  (economy.risingPrice ? difficultyTier(state.floor + 1) : 0);
export const legBudget = (state: RunState, economy: Economy) =>
  Array.from({ length: 10 }, (_, i) =>
    draw(state.floor + i + 1, economy),
  ).reduce((sum, cost) => sum + cost, 0);

export function savings(state: RunState, economy: Economy): number {
  const next = state.floor + 1;
  let saved = state.upgrades.solar && next % 4 === 0 ? state.upgrades.solar : 0;
  state.cabin.forEach((rider, slot) => {
    if (rider?.kind === 'mechanic' && next % 3 === 0) saved += 1;
    if (
      rider?.kind === 'ghost' &&
      hasNeighbour(state.cabin, slot, ['exorcist'])
    )
      saved += 1;
    if (
      rider?.kind === 'inspector' &&
      next % 2 === 0 &&
      totalWeight(state.cabin) <= 8
    )
      saved += 1;
  });
  return Math.min(draw(next, economy) - 1, saved); // Never generate electricity; minimum draw 1.
}

export function resolveEconomy(
  state: RunState,
  economy: Economy,
  seed: number,
): RunState {
  if (state.status !== 'playing') return state;
  const nextFloor = state.floor + 1;
  // Delegate all non-electricity behavior to the real engine. Temporarily abundant
  // power prevents old arrival rewards/caps from deciding the experimental outcome.
  const raw = resolveFloor(
    economy.live
      ? state
      : { ...state, energy: 1_000_000, energyCap: 1_000_000 },
    stream(seed, nextFloor, 2),
  );
  let next = raw;
  if (!economy.live) {
    const cost = draw(nextFloor, economy) - savings(state, economy);
    const energy = state.energy - cost;
    const fuseFailure = raw.status === 'lost' && raw.message.includes('引信');
    const status =
      fuseFailure || (economy.noNegativeCheckpoint && energy < 0)
        ? 'lost'
        : nextFloor % 10 === 0
          ? 'upgrade'
          : energy <= 0 || raw.stress >= raw.stressCap
            ? 'lost'
            : 'playing';
    next = {
      ...raw,
      energy,
      energyCap: state.energyCap,
      status,
      message: fuseFailure
        ? raw.message
        : status === 'lost'
          ? energy <= 0
            ? '电量耗尽'
            : '躁动失控'
          : '实验结算',
      lastEnergy: {
        delta: -cost,
        sources: [{ label: '行驶耗电（已扣节能）', amount: -cost }],
      },
    };
  }
  if (next.status === 'upgrade') {
    const stressCrisis = next.stress >= next.stressCap;
    const energyCrisis = Boolean(economy.live && next.energy <= 0);
    const crisis: UpgradeCrisis =
      stressCrisis && energyCrisis
        ? 'both'
        : stressCrisis
          ? 'stress'
          : energyCrisis
            ? 'energy'
            : null;
    next = {
      ...next,
      shop: upgradeChoices(
        next.upgrades,
        stream(seed, nextFloor, 3),
        crisis,
      ).map((key) => ({
        key,
        price: upgradePrice(key, nextFloor, next.upgrades[key]),
        purchased: false,
      })),
    };
  }
  return next;
}

export function charge(
  state: RunState,
  units: number,
  economy: Economy,
): RunState {
  if (
    economy.live ||
    state.status !== 'upgrade' ||
    !Number.isSafeInteger(units) ||
    units <= 0 ||
    units > state.energyCap - state.energy
  )
    return state;
  const cost = units * tariff(state, economy);
  if (state.coins < cost) return state;
  return { ...state, energy: state.energy + units, coins: state.coins - cost };
}
export function chargeToReserve(state: RunState, economy: Economy): RunState {
  if (economy.live) return state;
  const target = Math.min(state.energyCap, legBudget(state, economy) + 2);
  const units = Math.max(
    0,
    Math.min(
      target - state.energy,
      Math.floor(state.coins / tariff(state, economy)),
    ),
  );
  return charge(state, units, economy);
}
export function reserveBill(state: RunState, economy: Economy) {
  return economy.live
    ? 0
    : Math.max(
        0,
        Math.min(state.energyCap, legBudget(state, economy) + 2) - state.energy,
      ) * tariff(state, economy);
}
export function safePurchase(
  state: RunState,
  key: Parameters<typeof installUpgrade>[1],
  economy: Economy,
) {
  const next = installUpgrade(state, key);
  return next !== state && next.coins >= reserveBill(next, economy);
}
export const highAgitation = (state: RunState) =>
  state.stress >= agitationThreshold(state.stressCap);
