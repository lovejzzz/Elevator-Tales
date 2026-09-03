import { energySavings, initialRun, makeOffers, resolveFloor, type Rider, type RunState } from '../lib/game-engine';
import { planPlacement } from '../lib/game-interaction';
import { riderProfile } from '../lib/rider-profile';

type Policy = { id: string; cap: number; energyWeight: number; mechanicFirst?: boolean };
type Variant = { id: string; initialEnergy: number; mechanic: 'current' | 'every-floor' | 'three-floor-repair' };

const runs = Math.max(1, Number(process.argv[2] ?? 20000));
const policies: Policy[] = [
  { id: 'careful-3', cap: 3, energyWeight: 3 },
  { id: 'balanced-4', cap: 4, energyWeight: 1.5 },
  { id: 'eager-5', cap: 5, energyWeight: .5 },
  { id: 'full-6', cap: 6, energyWeight: 0 },
  { id: 'mechanic-first-4', cap: 4, energyWeight: 1.5, mechanicFirst: true },
];
const allVariants: Variant[] = [
  { id: 'e60-current', initialEnergy: 60, mechanic: 'current' },
  { id: 'e64-current', initialEnergy: 64, mechanic: 'current' },
  { id: 'e66-current', initialEnergy: 66, mechanic: 'current' },
  { id: 'e68-current', initialEnergy: 68, mechanic: 'current' },
  { id: 'e70-current', initialEnergy: 70, mechanic: 'current' },
  { id: 'e72-current', initialEnergy: 72, mechanic: 'current' },
  { id: 'e60-mechanic-every-floor', initialEnergy: 60, mechanic: 'every-floor' },
  { id: 'e66-mechanic-every-floor', initialEnergy: 66, mechanic: 'every-floor' },
  { id: 'e72-mechanic-every-floor', initialEnergy: 72, mechanic: 'every-floor' },
  { id: 'e60-mechanic-repair-3', initialEnergy: 60, mechanic: 'three-floor-repair' },
  { id: 'e66-mechanic-repair-3', initialEnergy: 66, mechanic: 'three-floor-repair' },
];
const selectedVariants = new Set((process.env.ET_VARIANTS ?? '').split(',').filter(Boolean));
const variants = selectedVariants.size ? allVariants.filter(variant => selectedVariants.has(variant.id)) : allVariants;

function seeded(seed: number) {
  return () => {
    let t = seed += 0x6d2b79f5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function offerValue(state: RunState, rider: Rider, policy: Policy) {
  const profile = riderProfile(rider, [...state.cabin, rider]);
  const trip = Math.max(1, rider.destination - state.floor);
  const mechanic = rider.kind === 'mechanic' ? (policy.mechanicFirst ? 50 : 1.5) : 0;
  return (profile.hidden ? 20 : profile.fare) / trip - profile.energy * policy.energyWeight + mechanic;
}

function board(state: RunState, offers: Rider[], policy: Policy) {
  let current = state;
  const waiting = offers.filter(offer => !state.cabin.some(rider => rider?.id === offer.id));
  while (current.cabin.filter(Boolean).length < policy.cap && waiting.length) {
    let bestValue = -Infinity, bestIndex = -1, bestState = current;
    for (let index = 0; index < waiting.length; index += 1) {
      const offer = waiting[index];
      for (let slot = 0; slot < current.cabin.length; slot += 1) {
        if (current.cabin[slot]) continue;
        const plan = planPlacement(current, offer, slot);
        if (!plan.ok) continue;
        const value = offerValue(current, offer, policy);
        if (value > bestValue) { bestValue = value; bestIndex = index; bestState = plan.next; }
      }
    }
    if (bestIndex < 0) break;
    current = bestState;
    waiting.splice(bestIndex, 1);
  }
  return current;
}

function mechanicAssist(state: RunState, variant: Variant) {
  const hasMechanic = state.cabin.some(rider => rider?.kind === 'mechanic');
  if (!hasMechanic || variant.mechanic === 'current') return state;
  const next = state.floor + 1;
  const refund = variant.mechanic === 'every-floor'
    ? (energySavings(state) > 0 ? 0 : 1)
    : (next % 3 === 0 ? 2 : 0);
  return refund ? { ...state, energy: Math.min(state.energyCap, state.energy + refund) } : state;
}

const seedBase = Number(process.env.ET_SEED ?? 734221);
const results = variants.flatMap((variant, variantIndex) => policies.map((policy, policyIndex) => {
  let reached = 0, energyDeaths = 0, agitationDeaths = 0, mechanicOffered = 0, mechanicBoarded = 0;
  const arrivalEnergy: number[] = [], deathFloors: number[] = [];
  for (let n = 0; n < runs; n += 1) {
    const rng = seeded(seedBase + n * 97 + variantIndex * 1000003 + policyIndex * 701);
    let state = { ...initialRun(), energy: variant.initialEnergy };
    let offers = makeOffers(1, state.upgrades, n % 2 === 0, rng);
    while (state.status === 'playing' && state.floor < 10) {
      if (offers.some(rider => rider.kind === 'mechanic')) mechanicOffered += 1;
      const beforeIds = new Set(state.cabin.flatMap(rider => rider ? [rider.id] : []));
      state = board(state, offers, policy);
      state.cabin.forEach(rider => { if (rider?.kind === 'mechanic' && !beforeIds.has(rider.id)) mechanicBoarded += 1; });
      state = resolveFloor(mechanicAssist(state, variant), rng);
      if (state.status === 'playing') offers = makeOffers(state.floor, state.upgrades, false, rng, state.cabin);
    }
    if (state.floor >= 10) { reached += 1; arrivalEnergy.push(state.energy); }
    else {
      deathFloors.push(state.floor);
      if (state.energy <= 0) energyDeaths += 1; else agitationDeaths += 1;
    }
  }
  arrivalEnergy.sort((a,b)=>a-b); deathFloors.sort((a,b)=>a-b);
  const percentile = (values: number[], p: number) => values.length ? values[Math.min(values.length - 1, Math.floor(values.length * p))] : null;
  const pct = (value: number) => Math.round(value / runs * 10000) / 100;
  return {
    variant: variant.id, policy: policy.id, runs,
    reachFirstShopPct: pct(reached), energyDeathPct: pct(energyDeaths), agitationDeathPct: pct(agitationDeaths),
    survivorEnergy: { p10: percentile(arrivalEnergy,.1), median: percentile(arrivalEnergy,.5), p90: percentile(arrivalEnergy,.9) },
    deathFloorMedian: percentile(deathFloors,.5), mechanicOfferEventsPerRun: Math.round(mechanicOffered / runs * 100) / 100,
    mechanicBoardingsPerRun: Math.round(mechanicBoarded / runs * 100) / 100,
  };
}));

console.log(JSON.stringify({ seedBase, runsPerCell: runs, totalRuns: results.length * runs, results }, null, 2));
