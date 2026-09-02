import { PASSENGERS, SCORE_RANKS, type PassengerKind, type UpgradeKey } from '../lib/game-data';
import { hasNeighbour, initialRun, installUpgrade, makeOffers, neighbourCount, neighbours, resolveFloor, totalWeight, upgradeChoices, type Rider, type RunState } from '../lib/game-engine';

type Policy = 'conservative' | 'calculated' | 'sprint' | 'reckless' | 'thief' | 'drunk' | 'celebrity' | 'bomb';
type UpgradePlan = { label: string; prefer?: UpgradeKey; ban?: UpgradeKey };
type OpeningPlan = { label: string; tutorial: boolean; boarding: 'all' | 'first' | 'conservative' | 'none' };
type EndgamePlan = { label: string; before: Policy; after: Policy };
type Aggregate = {
  runs: number; wins: number; floors: number; coins: number; winnerCoins: number; winnerEnergy: number;
  maxStress: number; riskBoardings: number; weightRejects: number; deaths: Record<string, number>;
  boarded: Record<PassengerKind, number>; upgrades: Record<UpgradeKey, number>;
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
  if (policy === 'sprint') return base + spec.fare * .9 + (RISK_KINDS.has(rider.kind) ? 42 : 0);
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
    if (totalWeight(state.cabin) + PASSENGERS[rider.kind].weight > state.weightCap) { aggregate.weightRejects += 1; continue; }
    const empty = state.cabin.map((current, slot) => current ? -1 : slot).filter((slot) => slot >= 0);
    if (!empty.length) break;
    const target = empty.sort((a, b) => placementScore(state.cabin, rider, b) - placementScore(state.cabin, rider, a))[0];
    state.cabin[target] = rider; aggregate.boarded[rider.kind] += 1;
    if (RISK_KINDS.has(rider.kind)) aggregate.riskBoardings += 1;
  }
}

function chooseUpgrade(state: RunState, choices: UpgradeKey[], policy: Policy, plan?: UpgradePlan): UpgradeKey {
  const priorities: UpgradeKey[] = policy === 'reckless' || policy === 'sprint'
    ? ['concierge', 'express', 'reinforced', 'calm', 'solar', 'battery']
    : state.energy <= 10 ? ['battery', 'solar', 'reinforced', 'express', 'calm', 'concierge']
      : state.stress >= 9 ? ['calm', 'solar', 'battery', 'reinforced', 'express', 'concierge']
        : ['solar', 'battery', 'express', 'reinforced', 'concierge', 'calm'];
  if (plan?.prefer && choices.includes(plan.prefer)) return plan.prefer;
  return priorities.find((key) => choices.includes(key) && key !== plan?.ban) ?? choices.find((key) => key !== plan?.ban) ?? choices[0];
}

function deathReason(message: string) {
  if (message.includes('能源')) return 'energy';
  if (message.includes('压力')) return 'stress';
  if (message.includes('引信')) return 'bomb';
  return 'other';
}

function simulateRun(seed: number, policy: Policy, aggregate: Aggregate, plan?: UpgradePlan) {
  const rng = mulberry32(seed); let state = initialRun(); let offers = makeOffers(1, state.upgrades, false, rng); let maxStress = 0;
  while (state.status === 'playing' || state.status === 'upgrade') {
    if (state.status === 'upgrade') {
      const selected = chooseUpgrade(state, upgradeChoices(state.upgrades, rng), policy, plan); aggregate.upgrades[selected] += 1;
      state = installUpgrade(state, selected);
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
  return state;
}

function boardOpening(state: RunState, offers: Rider[], plan: OpeningPlan, aggregate: Aggregate) {
  if (plan.boarding === 'none') return;
  if (plan.boarding === 'conservative') { board(state, offers, 'conservative', aggregate); return; }
  const candidates = plan.boarding === 'first' ? offers.slice(0, 1) : offers;
  for (const rider of candidates) {
    if (totalWeight(state.cabin) + PASSENGERS[rider.kind].weight > state.weightCap) { aggregate.weightRejects += 1; continue; }
    const target = state.cabin.findIndex((current) => !current);
    if (target < 0) break;
    state.cabin[target] = rider; aggregate.boarded[rider.kind] += 1;
    if (RISK_KINDS.has(rider.kind)) aggregate.riskBoardings += 1;
  }
}

function simulateOpening(seed: number, plan: OpeningPlan) {
  const rng = mulberry32(seed); const aggregate = emptyAggregate(1); let state = initialRun();
  let offers = makeOffers(1, state.upgrades, plan.tutorial, rng); let peakStress = 0;
  while (state.status === 'playing' && state.floor < 10) {
    boardOpening(state, offers, plan, aggregate); state = resolveFloor(state, rng); peakStress = Math.max(peakStress, state.stress);
    if (state.status === 'playing') offers = makeOffers(state.floor, state.upgrades, false, rng);
  }
  return { state, peakStress, risks: aggregate.riskBoardings, weightRejects: aggregate.weightRejects };
}

function simulateEndgame(seed: number, plan: EndgamePlan) {
  const rng = mulberry32(seed); const aggregate = emptyAggregate(1); let state = initialRun(); let offers = makeOffers(1, state.upgrades, false, rng);
  let scoreAt50 = -1; let energyAt50 = 0; let stressAt50 = 0; let risksAt50 = 0;
  while (state.status === 'playing' || state.status === 'upgrade') {
    const policy = state.floor >= 50 ? plan.after : plan.before;
    if (state.status === 'upgrade') {
      if (state.floor === 50 && scoreAt50 < 0) { scoreAt50 = state.coins; energyAt50 = state.energy; stressAt50 = state.stress; risksAt50 = aggregate.riskBoardings; }
      const selected = chooseUpgrade(state, upgradeChoices(state.upgrades, rng), policy); aggregate.upgrades[selected] += 1;
      state = installUpgrade(state, selected); if (state.status === 'playing') offers = makeOffers(state.floor, state.upgrades, false, rng); continue;
    }
    board(state, offers, policy, aggregate); state = resolveFloor(state, rng);
    if (state.floor === 50 && scoreAt50 < 0) { scoreAt50 = state.coins; energyAt50 = state.energy; stressAt50 = state.stress; risksAt50 = aggregate.riskBoardings; }
    if (state.status === 'playing') offers = makeOffers(state.floor, state.upgrades, false, rng);
  }
  return { state, scoreAt50, energyAt50, stressAt50, endgameRisks: Math.max(0, aggregate.riskBoardings - risksAt50) };
}

function emptyAggregate(runs: number): Aggregate {
  return { runs, wins: 0, floors: 0, coins: 0, winnerCoins: 0, winnerEnergy: 0, maxStress: 0, riskBoardings: 0, weightRejects: 0, deaths: { energy: 0, stress: 0, bomb: 0, other: 0 }, boarded: Object.fromEntries(Object.keys(PASSENGERS).map((kind) => [kind, 0])) as Record<PassengerKind, number>, upgrades: { battery: 0, solar: 0, calm: 0, concierge: 0, reinforced: 0, express: 0 } };
}

function rounded(value: number) { return Math.round(value * 10) / 10; }
function percentile(values: number[], position: number) { return values.length ? values[Math.min(values.length - 1, Math.floor((values.length - 1) * position))] : 0; }
const rankDistribution = (scores: number[], thresholds: number[]) => Object.fromEntries(['D', 'C', 'B', 'A', 'S'].map((grade, index) => {
  const low = thresholds[index]; const high = thresholds[index + 1] ?? Number.POSITIVE_INFINITY;
  return [grade, scores.length ? rounded(scores.filter((score) => score >= low && score < high).length / scores.length * 100) : 0];
}));
const runs = Math.max(1, Number(process.argv[2] || 10000));
const mode = process.argv[3] || 'risk';
const summarize = (aggregate: Aggregate) => ({
  runs, winRate: rounded(aggregate.wins / runs * 100), averageFloor: rounded(aggregate.floors / runs), averageCoins: rounded(aggregate.coins / runs),
  winnerCoins: aggregate.wins ? rounded(aggregate.winnerCoins / aggregate.wins) : 0, winnerEnergy: aggregate.wins ? rounded(aggregate.winnerEnergy / aggregate.wins) : 0,
  averagePeakStress: rounded(aggregate.maxStress / runs), riskBoardingsPerRun: rounded(aggregate.riskBoardings / runs), weightRejectsPerRun: rounded(aggregate.weightRejects / runs), deaths: aggregate.deaths,
  upgradeMix: Object.fromEntries(Object.entries(aggregate.upgrades).map(([key, count]) => [key, rounded(count / runs)])),
});

const report = mode === 'opening' ? ([
  { label: 'first-shift-blind-all', tutorial: true, boarding: 'all' },
  { label: 'repeat-blind-all', tutorial: false, boarding: 'all' },
  { label: 'repeat-first-only', tutorial: false, boarding: 'first' },
  { label: 'repeat-conservative', tutorial: false, boarding: 'conservative' },
  { label: 'no-passengers', tutorial: false, boarding: 'none' },
] as OpeningPlan[]).map((plan, planIndex) => {
  let reachedTen = 0; let energy = 0; let stress = 0; let coins = 0; let peakStress = 0; let risks = 0; let weightRejects = 0; let lowEnergy = 0;
  const deaths: Record<string, number> = { energy: 0, stress: 0, bomb: 0, other: 0 };
  for (let run = 0; run < runs; run += 1) {
    const result = simulateOpening(51001 + planIndex * 1000003 + run * 97, plan);
    peakStress += result.peakStress; risks += result.risks; weightRejects += result.weightRejects;
    if (result.state.floor >= 10) { reachedTen += 1; energy += result.state.energy; stress += result.state.stress; coins += result.state.coins; if (result.state.energy <= 5) lowEnergy += 1; }
    else deaths[deathReason(result.state.message)] += 1;
  }
  return { plan: plan.label, runs, reach10Rate: rounded(reachedTen / runs * 100), lowEnergyAt10Rate: reachedTen ? rounded(lowEnergy / reachedTen * 100) : 0,
    averageEnergyAt10: reachedTen ? rounded(energy / reachedTen) : 0, averageStressAt10: reachedTen ? rounded(stress / reachedTen) : 0,
    averageCoinsAt10: reachedTen ? rounded(coins / reachedTen) : 0, averagePeakStress: rounded(peakStress / runs),
    riskBoardings: rounded(risks / runs), weightRejects: rounded(weightRejects / runs), deaths };
}) : mode === 'endgame' ? ([
  { label: 'calculated-hold', before: 'calculated', after: 'calculated' },
  { label: 'calculated-sprint', before: 'calculated', after: 'sprint' },
  { label: 'conservative-hold', before: 'conservative', after: 'conservative' },
  { label: 'conservative-sprint', before: 'conservative', after: 'sprint' },
] as EndgamePlan[]).map((plan, planIndex) => {
  const reached: ReturnType<typeof simulateEndgame>[] = [];
  for (let run = 0; run < runs; run += 1) {
    const result = simulateEndgame(91001 + planIndex * 1000003 + run * 97, plan); if (result.scoreAt50 >= 0) reached.push(result);
  }
  const winners = reached.filter((result) => result.state.status === 'won'); const sWinners = winners.filter((result) => result.state.coins >= 900);
  const gains = winners.map((result) => result.state.coins - result.scoreAt50).sort((a, b) => a - b);
  const scoreBands = [[0, 650], [650, 750], [750, 850], [850, 900], [900, Number.POSITIVE_INFINITY]].map(([low, high]) => {
    const band = reached.filter((result) => result.scoreAt50 >= low && result.scoreAt50 < high); const bandWins = band.filter((result) => result.state.status === 'won');
    return { scoreAt50: high === Number.POSITIVE_INFINITY ? `${low}+` : `${low}-${high - 1}`, runs: band.length,
      surviveRate: band.length ? rounded(bandWins.length / band.length * 100) : 0, sRate: band.length ? rounded(bandWins.filter((result) => result.state.coins >= 900).length / band.length * 100) : 0 };
  });
  return { plan: plan.label, runs, reach50Rate: rounded(reached.length / runs * 100), surviveFrom50Rate: reached.length ? rounded(winners.length / reached.length * 100) : 0,
    sFrom50Rate: reached.length ? rounded(sWinners.length / reached.length * 100) : 0, averageScoreAt50: reached.length ? rounded(reached.reduce((sum, result) => sum + result.scoreAt50, 0) / reached.length) : 0,
    averageEnergyAt50: reached.length ? rounded(reached.reduce((sum, result) => sum + result.energyAt50, 0) / reached.length) : 0,
    averageStressAt50: reached.length ? rounded(reached.reduce((sum, result) => sum + result.stressAt50, 0) / reached.length) : 0,
    winnerGain: { p10: percentile(gains, .1), p50: percentile(gains, .5), p90: percentile(gains, .9) },
    endgameRiskBoardings: reached.length ? rounded(reached.reduce((sum, result) => sum + result.endgameRisks, 0) / reached.length) : 0, scoreBands };
}) : mode === 'scores' ? (['conservative', 'thief', 'drunk', 'celebrity', 'bomb', 'calculated', 'reckless'] as Policy[]).map((policy, policyIndex) => {
  const aggregate = emptyAggregate(runs); const scores: number[] = [];
  for (let run = 0; run < runs; run += 1) {
    const state = simulateRun(31001 + policyIndex * 1000003 + run * 97, policy, aggregate);
    if (state.status === 'won') scores.push(state.coins);
  }
  scores.sort((a, b) => a - b);
  return { policy, winRate: rounded(scores.length / runs * 100), winners: scores.length,
    winnerScore: { p10: percentile(scores, .1), p25: percentile(scores, .25), p50: percentile(scores, .5), p75: percentile(scores, .75), p90: percentile(scores, .9) },
    legacyRanks: rankDistribution(scores, [0, 125, 250, 450, 700]), currentRanks: rankDistribution(scores, SCORE_RANKS.map((rank) => rank.min)) };
}) : mode === 'upgrades' ? [
  { label: 'baseline' },
  ...(['battery', 'solar', 'calm', 'concierge', 'reinforced', 'express'] as UpgradeKey[]).map((prefer) => ({ label: `prefer-${prefer}`, prefer })),
  ...(['battery', 'solar', 'calm', 'concierge', 'reinforced', 'express'] as UpgradeKey[]).map((ban) => ({ label: `ban-${ban}`, ban })),
].map((plan) => {
  const aggregate = emptyAggregate(runs);
  for (let run = 0; run < runs; run += 1) simulateRun(82001 + run * 97, 'calculated', aggregate, plan);
  return { plan: plan.label, ...summarize(aggregate) };
}) : (['conservative', 'thief', 'drunk', 'celebrity', 'bomb', 'calculated', 'reckless'] as Policy[]).map((policy, policyIndex) => {
  const aggregate = emptyAggregate(runs);
  for (let run = 0; run < runs; run += 1) simulateRun(21001 + policyIndex * 1000003 + run * 97, policy, aggregate);
  const riskMix = Object.fromEntries([...RISK_KINDS].map((kind) => [kind, rounded(aggregate.boarded[kind] / runs)]));
  return { policy, ...summarize(aggregate), riskMix };
});

console.log(JSON.stringify(report, null, 2));
