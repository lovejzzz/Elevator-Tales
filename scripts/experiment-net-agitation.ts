import assert from 'node:assert/strict';
import { ADJACENT, PASSENGERS, PASSENGER_ORDER, UNLOCK_TIERS, type PassengerKind } from '../lib/game-data';
import { BONDS, type Bond } from '../lib/rider-profile';

type Rider = {
  id: number;
  kind: PassengerKind;
  destination: number;
  heatTrait: number;
  volatileHeat: number;
  energyTrait: number;
  bond: Bond;
};
type State = {
  floor: number;
  agitation: number;
  energy: number;
  coins: number;
  cabin: Array<Rider | null>;
};
type Variant = {
  id: string;
  agitationCap: number;
  deliveryRelief: 'per-rider' | 'once' | 'none';
  riskRamp: number;
  riskQuotaStep: number;
  volatileStart: number;
  volatileSpan: number;
  volatileQuotaStep: number;
  volatileKinds: 'risk' | 'all';
  volatileFareBonus: number;
  calmMode: 'negative' | 'control-only' | 'cancel-one';
};
type Policy = {
  id: string;
  cap: number;
  heatWeight: number;
  energyWeight: number;
  favorites: PassengerKind[];
  favoriteBias: number;
  safeOnly?: boolean;
  random?: boolean;
};

const mode = process.argv[2] ?? 'screen';
const runs = Number(process.argv[3] ?? (mode === 'holdout' ? 10_000 : 1_000));
assert.ok(['screen', 'holdout'].includes(mode));
assert.ok(Number.isSafeInteger(runs) && runs > 0);

const HORIZON = 200;
const ENERGY_CAP = 72;
const seedBase = mode === 'holdout' ? 8_110_031 : 8_110_003;
const variants: Variant[] = [
  { id: 'v5-bonus0', agitationCap: 6, deliveryRelief: 'once', riskRamp: 20, riskQuotaStep: 20, volatileStart: 15, volatileSpan: 35, volatileQuotaStep: 20, volatileKinds: 'all', volatileFareBonus: 0, calmMode: 'cancel-one' },
  { id: 'v5-bonus4', agitationCap: 6, deliveryRelief: 'once', riskRamp: 20, riskQuotaStep: 20, volatileStart: 15, volatileSpan: 35, volatileQuotaStep: 20, volatileKinds: 'all', volatileFareBonus: 4, calmMode: 'cancel-one' },
  { id: 'v5-bonus8', agitationCap: 6, deliveryRelief: 'once', riskRamp: 20, riskQuotaStep: 20, volatileStart: 15, volatileSpan: 35, volatileQuotaStep: 20, volatileKinds: 'all', volatileFareBonus: 8, calmMode: 'cancel-one' },
  { id: 'v5-bonus12', agitationCap: 6, deliveryRelief: 'once', riskRamp: 20, riskQuotaStep: 20, volatileStart: 15, volatileSpan: 35, volatileQuotaStep: 20, volatileKinds: 'all', volatileFareBonus: 12, calmMode: 'cancel-one' },
  { id: 'v5-hard-bonus8', agitationCap: 6, deliveryRelief: 'once', riskRamp: 20, riskQuotaStep: 15, volatileStart: 10, volatileSpan: 30, volatileQuotaStep: 15, volatileKinds: 'all', volatileFareBonus: 8, calmMode: 'cancel-one' },
  { id: 'v5-bonus8-no-calm', agitationCap: 6, deliveryRelief: 'once', riskRamp: 20, riskQuotaStep: 20, volatileStart: 15, volatileSpan: 35, volatileQuotaStep: 20, volatileKinds: 'all', volatileFareBonus: 8, calmMode: 'control-only' },
];
const policy = (id: string, options: Partial<Policy> = {}): Policy => ({
  id, cap: 4, heatWeight: 7, energyWeight: 1.4, favorites: [], favoriteBias: 0, ...options,
});
const policies: Policy[] = [
  policy('balanced-3', { cap: 3 }),
  policy('balanced-4'),
  policy('balanced-6', { cap: 6 }),
  policy('cautious', { cap: 4, heatWeight: 15 }),
  policy('greedy', { cap: 6, heatWeight: 2, energyWeight: .8 }),
  policy('short-hop', { cap: 4, favorites: ['courier', 'commuter', 'child'], favoriteBias: 3 }),
  policy('calmer-stack', { cap: 4, favorites: ['musician', 'nurse'], favoriteBias: 6 }),
  policy('control-links', { cap: 4, favorites: ['thief', 'cop', 'lawyer', 'drunk', 'musician', 'nurse'], favoriteBias: 2 }),
  policy('safe-only', { cap: 4, safeOnly: true, heatWeight: 20 }),
  policy('random', { cap: 4, random: true }),
];

const seeded = (initial: number) => {
  let seed = initial >>> 0;
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
};
const rngFor = (variant: number, policyIndex: number, game: number, floor: number, phase: number) =>
  seeded(seedBase + variant * 10_000_019 + policyIndex * 1_000_003 + game * 1009 + floor * 37 + phase * 7_919);
const integer = (rng: () => number, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
const round = (value: number) => Math.round(value * 100) / 100;
const nearby = (slot: number) => ADJACENT.flatMap(([a, b]) => a === slot ? [b] : b === slot ? [a] : []);
const occupants = (state: State) => state.cabin.filter((r): r is Rider => Boolean(r));
const availableKinds = (floor: number) => UNLOCK_TIERS.filter(tier => tier.floor <= floor).flatMap(tier => tier.kinds);
const hasNeighbor = (state: State, slot: number, kinds: PassengerKind[]) =>
  nearby(slot).some(index => state.cabin[index] && kinds.includes(state.cabin[index]!.kind));
const neighborCount = (state: State, slot: number) => nearby(slot).filter(index => state.cabin[index]).length;
const supportCount = (state: State, slot: number) => {
  const rider = state.cabin[slot];
  if (!rider) return 0;
  return nearby(slot).filter(index => state.cabin[index] && rider.bond.likes.includes(state.cabin[index]!.kind)).length;
};
const conflictActive = (state: State, slot: number) => {
  const rider = state.cabin[slot];
  if (!rider || supportCount(state, slot) > 0) return false;
  return nearby(slot).some(index => state.cabin[index] && rider.bond.avoids.includes(state.cabin[index]!.kind));
};

function rawAbilityHeat(state: State, slot: number, variant: Variant, seen = new Set<number>()): number {
  const rider = state.cabin[slot];
  if (!rider || seen.has(rider.id)) return 0;
  let heat = 0;
  switch (rider.kind) {
    case 'musician': heat = variant.calmMode === 'negative' && occupants(state).length >= 4 ? -1 : 0; break;
    case 'nurse': heat = variant.calmMode === 'negative' ? -1 : 0; break;
    case 'thief': heat = hasNeighbor(state, slot, ['cop', 'lawyer']) ? 0 : 1; break;
    case 'drunk': heat = hasNeighbor(state, slot, ['musician', 'nurse']) ? 0 : 1; break;
    case 'child': heat = hasNeighbor(state, slot, ['lover', 'musician', 'nurse']) ? 0 : 1; break;
    case 'celebrity': heat = neighborCount(state, slot) >= 2 ? 1 : 0; break;
    case 'inspector': heat = energyCost(state) > 4 ? 1 : 0; break;
    case 'mystery':
    case 'shifter': heat = rider.heatTrait; break;
    case 'mimic': {
      const source = nearby(slot).map(index => state.cabin[index]).find(Boolean);
      if (!source) return 0;
      const sourceSlot = state.cabin.findIndex(candidate => candidate?.id === source.id);
      return rawAbilityHeat(state, sourceSlot, variant, new Set([...seen, rider.id]));
    }
    default: heat = 0;
  }
  return heat + rider.volatileHeat;
}

function heatBySlot(state: State, variant: Variant): number[] {
  const heat = state.cabin.map((rider, slot) => rider
    ? rawAbilityHeat(state, slot, variant) + (conflictActive(state, slot) ? 1 : 0)
    : 0);
  if (variant.calmMode !== 'cancel-one') return heat;

  // A calmer never creates negative heat. Each Nurse or Musician cancels one
  // visible point from one adjacent rider; multiple calmers may stack.
  state.cabin.forEach((rider, calmerSlot) => {
    if (!rider || !['nurse', 'musician'].includes(rider.kind)) return;
    const target = nearby(calmerSlot)
      .filter(slot => heat[slot] > 0)
      .sort((a, b) => heat[b] - heat[a] || a - b)[0];
    if (target !== undefined) heat[target]--;
  });
  return heat;
}
function netHeat(state: State, slot: number, variant: Variant): number {
  return heatBySlot(state, variant)[slot] ?? 0;
}
function heatDelta(state: State, variant: Variant) {
  return heatBySlot(state, variant).reduce((sum, value) => sum + value, 0);
}
function energyCost(state: State) {
  const riderEnergy = occupants(state).reduce((sum, rider) => sum + rider.energyTrait, 0);
  const mechanicSavings = occupants(state).filter(rider => rider.kind === 'mechanic').length * 2;
  return 1 + Math.max(0, riderEnergy - mechanicSavings);
}
function controlledThief(state: State, slot: number) {
  return state.cabin[slot]?.kind === 'thief' && hasNeighbor(state, slot, ['cop', 'lawyer']);
}
function perFloorIncome(state: State) {
  let income = 0;
  state.cabin.forEach((rider, slot) => {
    if (!rider) return;
    if (rider.kind === 'thief') income += controlledThief(state, slot) ? 1 : 3;
    if (rider.kind === 'lover') income += nearby(slot).filter(index => state.cabin[index]?.kind === 'lover').length;
    if (rider.kind === 'drunk' && hasNeighbor(state, slot, ['musician', 'nurse'])) income += 1;
    if (rider.kind === 'celebrity' && neighborCount(state, slot) === 1) income += 3;
    if (rider.kind === 'inspector' && energyCost(state) <= 4) income += 1;
  });
  return income;
}
function publicFare(rider: Rider, variant: Variant) {
  return (rider.kind === 'mystery' ? 24 : PASSENGERS[rider.kind].fare) + rider.volatileHeat * variant.volatileFareBonus;
}
function arrivalFare(state: State, slot: number, variant: Variant) {
  const rider = state.cabin[slot]!;
  let fare = publicFare(rider, variant);
  if (rider.kind === 'thief' && controlledThief(state, slot)) fare += 5;
  if (rider.kind === 'ghost' && hasNeighbor(state, slot, ['exorcist'])) fare += 6;
  if (rider.kind === 'lover') fare *= 1 + nearby(slot).filter(index => state.cabin[index]?.kind === 'lover').length;
  if (rider.kind === 'coach') fare += neighborCount(state, slot) * 3;
  else fare *= 1 + .5 * nearby(slot).filter(index => state.cabin[index]?.kind === 'coach').length;
  fare += supportCount(state, slot) * 3;
  return Math.ceil(fare);
}

function makeRider(kind: PassengerKind, floor: number, id: number, variant: Variant, rng: () => number, forceVolatile = false): Rider {
  const kinds = availableKinds(floor).filter(candidate => !['mystery', 'shifter', 'mimic', kind].includes(candidate));
  const randomBond = () => {
    const liked = kinds[integer(rng, 0, Math.max(0, kinds.length - 1))] ?? 'commuter';
    const avoidedPool = kinds.filter(candidate => candidate !== liked);
    return { likes: [liked], avoids: [avoidedPool[integer(rng, 0, Math.max(0, avoidedPool.length - 1))] ?? 'drunk'] };
  };
  const volatileChance = !Number.isFinite(variant.volatileStart) || floor < variant.volatileStart
    ? 0
    : Math.min(.75, (floor - variant.volatileStart + 1) / variant.volatileSpan);
  return {
    id, kind,
    destination: floor + integer(rng, PASSENGERS[kind].trip[0], PASSENGERS[kind].trip[1]),
    heatTrait: ['mystery', 'shifter'].includes(kind) ? integer(rng, 0, 1) : 0,
    volatileHeat: forceVolatile || (variant.volatileKinds === 'all' || isIntrinsicRisk(kind)) && rng() < volatileChance ? 1 : 0,
    energyTrait: ['mystery', 'shifter'].includes(kind) ? integer(rng, 1, 2) : PASSENGERS[kind].energy,
    bond: ['mystery', 'shifter'].includes(kind) ? randomBond() : BONDS[kind],
  };
}
function isIntrinsicRisk(kind: PassengerKind) {
  return ['thief', 'drunk', 'child', 'celebrity', 'inspector', 'mystery', 'shifter'].includes(kind);
}
function makeOffers(floor: number, variant: Variant, rng: () => number, idBase: number) {
  const kinds = availableKinds(floor);
  const riskQuota = Number.isFinite(variant.riskQuotaStep) ? Math.min(3, Math.floor(floor / variant.riskQuotaStep)) : 0;
  const volatileQuota = Number.isFinite(variant.volatileQuotaStep) ? Math.min(3, Math.floor(floor / variant.volatileQuotaStep)) : 0;
  return [0, 1, 2].map(index => {
    const pool = index < riskQuota ? kinds.filter(isIntrinsicRisk) : kinds;
    const weighted = pool.map(kind => ({
      kind,
      weight: PASSENGERS[kind].rarity * (isIntrinsicRisk(kind) ? 1 + floor / variant.riskRamp : 1),
    }));
    const total = weighted.reduce((sum, item) => sum + item.weight, 0);
    let roll = rng() * total;
    const item = weighted.find(candidate => (roll -= candidate.weight) <= 0) ?? weighted.at(-1)!;
    return makeRider(item.kind, floor, idBase + index, variant, rng, index < volatileQuota);
  });
}

function cloneWith(state: State, rider: Rider, slot: number): State {
  const cabin = [...state.cabin];
  cabin[slot] = rider;
  return { ...state, cabin };
}
function expectedRiderValue(state: State, slot: number, policy: Policy, variant: Variant) {
  const rider = state.cabin[slot]!;
  const trip = Math.max(1, rider.destination - state.floor);
  const favorite = policy.favorites.includes(rider.kind) ? policy.favoriteBias : 0;
  return publicFare(rider, variant) / trip + supportCount(state, slot) * 1.2 + favorite - rider.energyTrait * policy.energyWeight - netHeat(state, slot, variant) * policy.heatWeight;
}
function deliveryRelief(variant: Variant, arrivals: number) {
  if (variant.deliveryRelief === 'none' || arrivals === 0) return 0;
  return variant.deliveryRelief === 'once' ? 1 : arrivals;
}
function stateValue(state: State, policy: Policy, variant: Variant) {
  let value = 0;
  state.cabin.forEach((rider, slot) => { if (rider) value += expectedRiderValue(state, slot, policy, variant); });
  const arriving = state.cabin.filter(rider => rider && rider.destination <= state.floor + 1).length;
  const next = Math.max(0, state.agitation + heatDelta(state, variant) - deliveryRelief(variant, arriving));
  if (next >= variant.agitationCap) value -= 1_000;
  if (energyCost(state) >= state.energy) value -= 1_000;
  return value;
}
function board(state: State, offers: Rider[], policy: Policy, variant: Variant, rng: () => number) {
  let current = state;
  const waiting = [...offers];
  while (occupants(current).length < policy.cap && waiting.length) {
    if (policy.random) {
      if (rng() < .28 && occupants(current).length > 0) break;
      const offerIndex = integer(rng, 0, waiting.length - 1);
      const empty = current.cabin.flatMap((rider, slot) => rider ? [] : [slot]);
      current = cloneWith(current, waiting.splice(offerIndex, 1)[0], empty[integer(rng, 0, empty.length - 1)]);
      continue;
    }
    const before = stateValue(current, policy, variant);
    let best = before + .05;
    let chosen = -1;
    let next = current;
    for (let offerIndex = 0; offerIndex < waiting.length; offerIndex++) {
      for (let slot = 0; slot < current.cabin.length; slot++) {
        if (current.cabin[slot]) continue;
        const trial = cloneWith(current, waiting[offerIndex], slot);
        if (policy.safeOnly && heatDelta(trial, variant) > Math.max(0, heatDelta(current, variant))) continue;
        const score = stateValue(trial, policy, variant);
        if (score > best) { best = score; chosen = offerIndex; next = trial; }
      }
    }
    if (chosen < 0) break;
    waiting.splice(chosen, 1);
    current = next;
  }
  // In the simplified model the elevator cannot advance empty. Without this
  // explicit rule, banked fare can buy enough empty travel to bypass every
  // passenger decision once floor pressure has been removed.
  if (!occupants(current).length && !policy.random) {
    let best = -Infinity;
    for (let offerIndex = 0; offerIndex < waiting.length; offerIndex++) for (let slot = 0; slot < 6; slot++) {
      const trial = cloneWith(current, waiting[offerIndex], slot);
      const score = stateValue(trial, policy, variant);
      if (score > best) { best = score; current = trial; }
    }
  }
  return current;
}
function dismissToSurvive(state: State, policy: Policy, variant: Variant) {
  let current = state;
  for (;;) {
    const arriving = current.cabin.filter(rider => rider && rider.destination <= current.floor + 1).length;
    const predicted = Math.max(0, current.agitation + heatDelta(current, variant) - deliveryRelief(variant, arriving));
    if (predicted < variant.agitationCap && energyCost(current) < current.energy) return current;
    let best: { state: State; cost: number; score: number } | null = null;
    for (const [slot, rider] of current.cabin.entries()) {
      if (!rider) continue;
      const cost = 4 + Math.max(0, rider.destination - current.floor) * 2;
      if (cost > current.coins) continue;
      const cabin = [...current.cabin]; cabin[slot] = null;
      const trial = { ...current, cabin, coins: current.coins - cost };
      const score = stateValue(trial, policy, variant);
      if (!best || score > best.score) best = { state: trial, cost, score };
    }
    if (!best) return current;
    current = best.state;
  }
}

function resolve(state: State, variant: Variant) {
  const nextFloor = state.floor + 1;
  const agitationGain = heatDelta(state, variant);
  const cost = energyCost(state);
  const income = perFloorIncome(state);
  const arrivals = state.cabin.flatMap((rider, slot) => rider && rider.destination <= nextFloor ? [{ rider, slot }] : []);
  const arrivalIncome = arrivals.reduce((sum, { slot }) => sum + arrivalFare(state, slot, variant), 0);
  const cabin = [...state.cabin]; arrivals.forEach(({ slot }) => { cabin[slot] = null; });
  const agitation = Math.max(0, state.agitation + agitationGain - deliveryRelief(variant, arrivals.length));
  let energy = state.energy - cost;
  let coins = state.coins + income + arrivalIncome;
  if (nextFloor % 10 === 0 && energy > 0 && agitation < variant.agitationCap) {
    const charge = Math.min(ENERGY_CAP - energy, coins);
    energy += charge; coins -= charge;
  }
  return { next: { floor: nextFloor, agitation, energy, coins, cabin }, arrivals: arrivals.map(item => item.rider), agitationGain, cost };
}

type Summary = {
  variant: string; policy: string; runs: number; mean: number; median: number; p10: number; p90: number; max: number;
  reach20: number; reach50: number; reach100: number; censored: number; agitationDeaths: number; energyDeaths: number;
  meanOccupancy: number; meanAgitation: number; dangerStepPct: number; negativeDeltaPct: number; zeroLockPct: number;
  deliveriesPerRun: number; dismissalsPerRun: number; roleBoardings: Record<PassengerKind, number>;
};
const summaries: Summary[] = [];
let totalTransitions = 0;
for (let variantIndex = 0; variantIndex < variants.length; variantIndex++) {
  const variant = variants[variantIndex];
  for (let policyIndex = 0; policyIndex < policies.length; policyIndex++) {
    const config = policies[policyIndex];
    const floors: number[] = [];
    const roleBoardings = Object.fromEntries(PASSENGER_ORDER.map(kind => [kind, 0])) as Record<PassengerKind, number>;
    let agitationDeaths = 0, energyDeaths = 0, censored = 0, occupancy = 0, agitationSum = 0;
    let steps = 0, dangerSteps = 0, negativeDeltas = 0, zeroLocks = 0, deliveries = 0, dismissals = 0;
    for (let game = 0; game < runs; game++) {
      let state: State = { floor: 1, agitation: 0, energy: ENERGY_CAP, coins: 0, cabin: Array(6).fill(null) };
      let nextId = game * 100_000;
      while (state.floor < HORIZON && state.energy > 0 && state.agitation < variant.agitationCap) {
        // Shifter randomness is revealed while the doors are open, before any decision.
        state = { ...state, cabin: state.cabin.map((rider, slot) => rider?.kind === 'shifter'
          ? { ...rider, heatTrait: integer(rngFor(variantIndex, policyIndex, game, state.floor, 70 + slot), 0, 1) }
          : rider) };
        const offerRng = rngFor(variantIndex, policyIndex, game, state.floor, 1);
        const offers = makeOffers(state.floor, variant, offerRng, nextId); nextId += 3;
        const beforeIds = new Set(occupants(state).map(rider => rider.id));
        let arranged = board(state, offers, config, variant, rngFor(variantIndex, policyIndex, game, state.floor, 2));
        occupants(arranged).filter(rider => !beforeIds.has(rider.id)).forEach(rider => roleBoardings[rider.kind]++);
        const beforeDismiss = occupants(arranged).length;
        arranged = dismissToSurvive(arranged, config, variant);
        dismissals += beforeDismiss - occupants(arranged).length;
        const delta = heatDelta(arranged, variant);
        if (delta < 0) negativeDeltas++;
        if (arranged.agitation === 0 && delta <= 0 && occupants(arranged).length >= 3) zeroLocks++;
        const arriving = arranged.cabin.filter(rider => rider && rider.destination <= arranged.floor + 1).length;
        if (arranged.agitation + delta - deliveryRelief(variant, arriving) >= variant.agitationCap - 1) dangerSteps++;
        occupancy += occupants(arranged).length; agitationSum += arranged.agitation; steps++; totalTransitions++;
        const outcome = resolve(arranged, variant); deliveries += outcome.arrivals.length; state = outcome.next;
      }
      floors.push(state.floor);
      if (state.floor >= HORIZON) censored++;
      else if (state.energy <= 0) energyDeaths++;
      else agitationDeaths++;
    }
    const sorted = [...floors].sort((a, b) => a - b);
    const pct = (predicate: (floor: number) => boolean) => round(floors.filter(predicate).length / runs * 100);
    summaries.push({
      variant: variant.id, policy: config.id, runs,
      mean: round(floors.reduce((sum, floor) => sum + floor, 0) / runs), median: sorted[Math.floor(runs * .5)],
      p10: sorted[Math.floor(runs * .1)], p90: sorted[Math.floor(runs * .9)], max: sorted.at(-1)!,
      reach20: pct(floor => floor >= 20), reach50: pct(floor => floor >= 50), reach100: pct(floor => floor >= 100),
      censored, agitationDeaths, energyDeaths,
      meanOccupancy: round(occupancy / steps), meanAgitation: round(agitationSum / steps),
      dangerStepPct: round(dangerSteps / steps * 100), negativeDeltaPct: round(negativeDeltas / steps * 100), zeroLockPct: round(zeroLocks / steps * 100),
      deliveriesPerRun: round(deliveries / runs), dismissalsPerRun: round(dismissals / runs), roleBoardings,
    });
  }
}

const byVariant = variants.map(variant => {
  const rows = summaries.filter(summary => summary.variant === variant.id).sort((a, b) => b.mean - a.mean);
  const leader = rows[0];
  return {
    variant: variant.id,
    leader: leader.policy,
    leaderMean: leader.mean,
    spreadPct: round((leader.mean - rows.at(-1)!.mean) / leader.mean * 100),
    calmerAdvantagePct: round((rows.find(row => row.policy === 'calmer-stack')!.mean / rows.find(row => row.policy === 'balanced-4')!.mean - 1) * 100),
    shortHopAdvantagePct: round((rows.find(row => row.policy === 'short-hop')!.mean / rows.find(row => row.policy === 'balanced-4')!.mean - 1) * 100),
    maxZeroLockPct: Math.max(...rows.map(row => row.zeroLockPct)),
    censored: rows.reduce((sum, row) => sum + row.censored, 0),
  };
});

console.log(JSON.stringify({
  experiment: 'net-agitation-v2', mode, seedBase, runsPerCell: runs,
  totalGames: runs * variants.length * policies.length, totalTransitions, horizon: HORIZON,
  rules: {
    agitationCap: 'variant 6 or 7',
    nextAgitation: 'sum of every visible rider net value; no floor pressure, crowding, high-agitation multiplier, even-floor gate, or empty-car fatigue',
    delivery: 'variant: each arrival, at most one point per floor, or no relief; applied before the loss check',
    conflicts: 'an active red conflict adds +1 to that rider; any green support suppresses its red conflict',
    economy: '72 power, motor + riders − Mechanic savings, 1 coin buys 1 power every 10 floors; no upgrades in this isolation test',
    difficulty: 'v3 forces increasing risky and Volatile (+1 visible heat) offer quotas; Volatile is printed on the card and may affect any role; no hidden agitation tax',
  },
  byVariant, summaries,
  limitations: [
    'Heuristic bots approximate informed play; results are not human win rates or proof of optimality.',
    'This first isolation model retains representative income, energy, links, and dismissal but omits upgrades, fuse failure, impatience, Ghost delay, and Lover summoning.',
    'A horizon result is censored, not a game ending.',
  ],
}, null, 2));
