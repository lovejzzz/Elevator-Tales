import { PASSENGERS, type PassengerKind, type UpgradeKey } from '../lib/game-data';
import { hasNeighbour, initialRun, installUpgrade, makeOffers, neighbourCount, neighbours, resolveFloor, totalWeight, upgradeChoices, type Rider, type RunState } from '../lib/game-engine';

type Policy = 'conservative' | 'calculated' | 'reckless' | 'thief' | 'drunk' | 'celebrity' | 'bomb';
type Aggregate = {
  runs: number; wins: number; floors: number; coins: number; winnerCoins: number; winnerEnergy: number;
  maxStress: number; riskBoardings: number; deaths: Record<string, number>; boarded: Record<PassengerKind, number>;
};

const RISK_KINDS = new Set<PassengerKind>(['thief', 'drunk', 'celebrity', 'bomb']);
const CARETAKERS: PassengerKind[] = ['lover', 'musician', 'nurse'];
const CONTROLLERS: PassengerKind[] = ['cop', 'lawyer'];
const mulberry32 = (seed: number) => () => { let value = seed += 0x6d2b79f5; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; };
const canPair = (cabin: Array<Rider | null>, partners: PassengerKind[]) => cabin.some((rider) => rider && partners.includes(rider.kind)) && cabin.some((rider, slot) => !rider && neighbours(slot).some((nearby) => cabin[nearby] && partners.includes(cabin[nearby]!.kind)));

function placementScore(cabin: Array<Rider | null>, rider: Rider, slot: number): number {
  const placed = cabin.map((current, index) => index === slot ? rider : current);
  const weight = totalWeight(placed); const adjacent = neighbourCount(placed, slot);
  switch (rider.kind) {
    case 'lover': return hasNeighbour(placed, slot, ['lover']) ? 18 : 0;
    case 'thief': return hasNeighbour(placed, slot, CONTROLLERS) ? 22 : -8;
    case 'cop': return hasNeighbour(placed, slot, ['thief', 'bomb']) ? 20 : 2;
    case 'lawyer': return hasNeighbour(placed, slot, ['thief']) ? 18 : 2;
    case 'drunk': return hasNeighbour(placed, slot, ['musician', 'nurse']) ? 22 : -9;
    case 'nurse': return hasNeighbour(placed, slot, ['drunk', 'child']) ? 20 : 4;
    case 'child': return hasNeighbour(placed, slot, CARETAKERS) ? 18 : -8;
    case 'ghost': return hasNeighbour(placed, slot, ['exorcist']) ? 24 : -7;
    case 'exorcist': return hasNeighbour(placed, slot, ['ghost']) ? 22 : 3;
    case 'coach': return adjacent * 5;
    case 'celebrity': return adjacent === 1 ? 18 : adjacent > 1 ? -15 : 0;
    case 'inspector': return weight <= 8 ? 12 : -10;
    case 'bomb': return hasNeighbour(placed, slot, ['cop']) ? 24 : -6;
    default: return adjacent;
  }
}

function offerScore(state: RunState, rider: Rider, policy: Policy): number {
  const spec = PASSENGERS[rider.kind]; const trip = rider.destination - state.floor;
  const base = spec.energy * 18 + spec.fare * .45 - trip * 2.4 - spec.weight * 2;
  if (policy === 'reckless') return base + (RISK_KINDS.has(rider.kind) ? 30 : 0);
  const selectiveRisk = RISK_KINDS.has(policy as PassengerKind) ? policy as PassengerKind : null;
  if ((policy === 'conservative' || selectiveRisk) && (['child', 'ghost'].includes(rider.kind) || (RISK_KINDS.has(rider.kind) && rider.kind !== selectiveRisk))) return Number.NEGATIVE_INFINITY;
  if (policy === 'calculated' || rider.kind === selectiveRisk) {
    if (rider.kind === 'bomb') {
      const controlled = canPair(state.cabin, ['cop']);
      if ((rider.fuse ?? 0) < trip && !controlled) return Number.NEGATIVE_INFINITY;
    }
    if (rider.kind === 'thief' && state.stress > 6 && !canPair(state.cabin, CONTROLLERS)) return Number.NEGATIVE_INFINITY;
    if (rider.kind === 'drunk' && state.stress > 6 && !canPair(state.cabin, ['musician', 'nurse'])) return Number.NEGATIVE_INFINITY;
    if (rider.kind === 'child' && !canPair(state.cabin, CARETAKERS)) return Number.NEGATIVE_INFINITY;
    if (rider.kind === 'ghost' && state.energy < 12 && !canPair(state.cabin, ['exorcist'])) return Number.NEGATIVE_INFINITY;
    return base + (RISK_KINDS.has(rider.kind) ? 16 : 0);
  }
  return base;
}

function board(state: RunState, offers: Rider[], policy: Policy, aggregate: Aggregate) {
  const ordered = policy === 'reckless' ? [...offers] : [...offers].sort((a, b) => offerScore(state, b, policy) - offerScore(state, a, policy));
  for (const rider of ordered) {
    if (!Number.isFinite(offerScore(state, rider, policy))) continue;
    if (totalWeight(state.cabin) + PASSENGERS[rider.kind].weight > state.weightCap) continue;
    const empty = state.cabin.map((current, slot) => current ? -1 : slot).filter((slot) => slot >= 0);
    if (!empty.length) break;
    const target = empty.sort((a, b) => placementScore(state.cabin, rider, b) - placementScore(state.cabin, rider, a))[0];
    state.cabin[target] = rider; aggregate.boarded[rider.kind] += 1;
    if (RISK_KINDS.has(rider.kind)) aggregate.riskBoardings += 1;
  }
}

function chooseUpgrade(state: RunState, choices: UpgradeKey[], policy: Policy): UpgradeKey {
  const priorities: UpgradeKey[] = policy === 'reckless'
    ? ['concierge', 'express', 'reinforced', 'calm', 'solar', 'battery']
    : state.energy <= 10 ? ['battery', 'solar', 'express', 'calm', 'concierge', 'reinforced']
      : state.stress >= 9 ? ['calm', 'solar', 'battery', 'express', 'concierge', 'reinforced']
        : ['solar', 'battery', 'express', 'concierge', 'calm', 'reinforced'];
  return priorities.find((key) => choices.includes(key)) ?? choices[0];
}

function deathReason(message: string) {
  if (message.includes('能源')) return 'energy';
  if (message.includes('压力')) return 'stress';
  if (message.includes('引信')) return 'bomb';
  return 'other';
}

function simulateRun(seed: number, policy: Policy, aggregate: Aggregate) {
  const rng = mulberry32(seed); let state = initialRun(); let offers = makeOffers(1, state.upgrades, false, rng); let maxStress = 0;
  while (state.status === 'playing' || state.status === 'upgrade') {
    if (state.status === 'upgrade') {
      state = installUpgrade(state, chooseUpgrade(state, upgradeChoices(rng), policy));
      if (state.status === 'playing') offers = makeOffers(state.floor, state.upgrades, false, rng);
      continue;
    }
    board(state, offers, policy, aggregate);
    state = resolveFloor(state, rng); maxStress = Math.max(maxStress, state.stress);
    if (state.status === 'playing') offers = makeOffers(state.floor, state.upgrades, false, rng);
  }
  aggregate.floors += state.floor; aggregate.coins += state.coins; aggregate.maxStress += maxStress;
  if (state.status === 'won') { aggregate.wins += 1; aggregate.winnerCoins += state.coins; aggregate.winnerEnergy += state.energy; }
  else aggregate.deaths[deathReason(state.message)] += 1;
}

function emptyAggregate(runs: number): Aggregate {
  return { runs, wins: 0, floors: 0, coins: 0, winnerCoins: 0, winnerEnergy: 0, maxStress: 0, riskBoardings: 0, deaths: { energy: 0, stress: 0, bomb: 0, other: 0 }, boarded: Object.fromEntries(Object.keys(PASSENGERS).map((kind) => [kind, 0])) as Record<PassengerKind, number> };
}

function rounded(value: number) { return Math.round(value * 10) / 10; }
const runs = Math.max(1, Number(process.argv[2] || 10000));
const policies: Policy[] = ['conservative', 'thief', 'drunk', 'celebrity', 'bomb', 'calculated', 'reckless'];
const report = policies.map((policy, policyIndex) => {
  const aggregate = emptyAggregate(runs);
  for (let run = 0; run < runs; run += 1) simulateRun(21001 + policyIndex * 1000003 + run * 97, policy, aggregate);
  const riskMix = Object.fromEntries([...RISK_KINDS].map((kind) => [kind, rounded(aggregate.boarded[kind] / runs)]));
  return {
    policy, runs, winRate: rounded(aggregate.wins / runs * 100), averageFloor: rounded(aggregate.floors / runs), averageCoins: rounded(aggregate.coins / runs),
    winnerCoins: aggregate.wins ? rounded(aggregate.winnerCoins / aggregate.wins) : 0, winnerEnergy: aggregate.wins ? rounded(aggregate.winnerEnergy / aggregate.wins) : 0,
    averagePeakStress: rounded(aggregate.maxStress / runs), riskBoardingsPerRun: rounded(aggregate.riskBoardings / runs), deaths: aggregate.deaths, riskMix,
  };
});

console.log(JSON.stringify(report, null, 2));
