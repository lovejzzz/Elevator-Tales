import { PASSENGERS, SCORE_RANKS, type PassengerKind, type UpgradeKey } from '../lib/game-data';
import { hasNeighbour, initialRun, installUpgrade, LOVER_CALL_CHANCE, makeOffers, neighbourCount, neighbours, readyPartner, resolveFloor, totalWeight, travelEnergyCost, upgradeChoices, type Rider, type RunState } from '../lib/game-engine';
import { energyForecast, stressForecast } from '../lib/game-forecast';

type Policy = 'conservative' | 'calculated' | 'pulse' | 'sprint' | 'reckless' | 'thief' | 'drunk' | 'celebrity' | 'bomb';
type UpgradePlan = { label: string; prefer?: UpgradeKey; ban?: UpgradeKey };
type OpeningPlan = { label: string; tutorial: boolean; boarding: 'all' | 'first' | 'conservative' | 'none' };
type EndgamePlan = { label: string; before: Policy; after: Policy };
type Aggregate = {
  runs: number; wins: number; floors: number; coins: number; winnerCoins: number; winnerEnergy: number;
  maxStress: number; riskBoardings: number; weightRejects: number; deaths: Record<string, number>;
  pressureRiskFloors: number; pressureReliefFloors: number; pressureCancelledFloors: number; pressureSources: Record<string, number>;
  checkpointCrises: number; checkpointEnergyCrises: number; checkpointStressCrises: number; checkpointRescueOffers: number; checkpointRescues: number; checkpointDeadEnds: number;
  recoveryEnergyRescues: number; recoveryStressRescues: number; recoveryAlive1: number; recoveryAlive3: number; recoveryAlive5: number;
  recoveryEnergyAlive1: number; recoveryEnergyAlive3: number; recoveryEnergyAlive5: number; recoveryStressAlive1: number; recoveryStressAlive3: number; recoveryStressAlive5: number;
  loverPairedRiderTurns: number; loverSoloRiderTurns: number; loverPairedArrivals: number; loverCallsOffered: number; loverCallsBoarded: number;
  forecastFloors: number; stressForecastMisses: number; energyForecastMisses: number; stressUnsafeMisses: number; energyUnsafeMisses: number;
  stressUncertaintyFloors: number; energyUncertaintyFloors: number;
  decisionFloors: number; fullCabinFloors: number; openDecisionFloors: number; contestedChoiceFloors: number;
  synergyChoiceFloors: number; riskVsSafeChoiceFloors: number; threeWayChoiceFloors: number; tensionChoiceFloors: number; goldenChoiceFloors: number;
  rushZoneFloors: number; rushBonusFloors: number; rushBonusCoins: number; flowStateFloors: number; flowChoiceFloors: number;
  occupancyBeforeBoard: number[];
  offered: Record<PassengerKind, number>; boarded: Record<PassengerKind, number>; upgrades: Record<UpgradeKey, number>;
};

const loverRarityOverride = Number(process.env.ET_LOVER_RARITY);
const loverTripMinOverride = Number(process.env.ET_LOVER_TRIP_MIN);
const loverTripMaxOverride = Number(process.env.ET_LOVER_TRIP_MAX);
const loverCallChanceOverride = Number(process.env.ET_LOVER_CALL_CHANCE);
const loverCallChance = Number.isFinite(loverCallChanceOverride) ? Math.max(0, Math.min(1, loverCallChanceOverride)) : LOVER_CALL_CHANCE;
const loverResponseBonusOverride = Number(process.env.ET_LOVER_RESPONSE_BONUS);
const loverResponseBonus = Number.isFinite(loverResponseBonusOverride) ? Math.max(0, loverResponseBonusOverride) : 24;
if (Number.isFinite(loverRarityOverride) && loverRarityOverride > 0) PASSENGERS.lover.rarity = loverRarityOverride;
if (Number.isFinite(loverTripMinOverride) && Number.isFinite(loverTripMaxOverride) && loverTripMinOverride > 0 && loverTripMaxOverride >= loverTripMinOverride) PASSENGERS.lover.trip = [loverTripMinOverride, loverTripMaxOverride];
const makeSimOffers = (floor: number, state: RunState, rng: () => number, tutorial = false) => makeOffers(floor, state.upgrades, tutorial, rng, state.cabin, loverCallChance);

const RISK_KINDS = new Set<PassengerKind>(['thief', 'drunk', 'celebrity', 'bomb']);
const CARETAKERS: PassengerKind[] = ['lover', 'musician', 'nurse'];
const CONTROLLERS: PassengerKind[] = ['cop', 'lawyer'];
const mulberry32 = (seed: number) => () => { let value = seed += 0x6d2b79f5; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; };
const canPair = (cabin: Array<Rider | null>, partners: PassengerKind[]) => cabin.some((rider) => rider && partners.includes(rider.kind)) && cabin.some((rider, slot) => !rider && neighbours(slot).some((nearby) => cabin[nearby] && partners.includes(cabin[nearby]!.kind)));

function placementScore(cabin: Array<Rider | null>, rider: Rider, slot: number, policy: Policy, stress: number): number {
  const placed = cabin.map((current, index) => index === slot ? rider : current);
  const weight = totalWeight(placed); const adjacent = neighbourCount(placed, slot);
  switch (rider.kind) {
    case 'lover': return hasNeighbour(placed, slot, ['lover']) ? 18 : 0;
    case 'thief': return policy === 'pulse' && stress < 5 ? hasNeighbour(placed, slot, CONTROLLERS) ? 2 : 20 : hasNeighbour(placed, slot, CONTROLLERS) ? 22 : -8;
    case 'cop': return hasNeighbour(placed, slot, ['thief', 'bomb']) ? 20 : 2;
    case 'lawyer': return hasNeighbour(placed, slot, ['thief']) ? 18 : 2;
    case 'drunk': return policy === 'pulse' && stress < 5 ? hasNeighbour(placed, slot, ['musician', 'nurse']) ? 2 : 20 : hasNeighbour(placed, slot, ['musician', 'nurse']) ? 22 : -9;
    case 'nurse': return hasNeighbour(placed, slot, ['drunk', 'child']) ? 20 : 4;
    case 'child': return hasNeighbour(placed, slot, CARETAKERS) ? 18 : -8;
    case 'ghost': return hasNeighbour(placed, slot, ['exorcist']) ? 24 : -7;
    case 'exorcist': return hasNeighbour(placed, slot, ['ghost']) ? 22 : 3;
    case 'coach': return adjacent * 5;
    case 'celebrity': return policy === 'pulse' && stress < 5 ? adjacent > 1 ? 20 : adjacent === 1 ? 8 : 0 : adjacent === 1 ? 18 : adjacent > 1 ? -15 : 0;
    case 'inspector': return weight <= 8 ? 12 : -10;
    case 'bomb': return hasNeighbour(placed, slot, ['cop']) ? 24 : -6;
    default: return adjacent;
  }
}

function offerScore(state: RunState, rider: Rider, policy: Policy): number {
  const spec = PASSENGERS[rider.kind]; const trip = rider.destination - state.floor;
  const base = spec.energy * 18 + spec.fare * .45 - trip * 2.4 - spec.weight * 2 + (rider.calledByLover ? loverResponseBonus : 0);
  if (policy === 'reckless') return base + (RISK_KINDS.has(rider.kind) ? 30 : 0);
  if (policy === 'sprint') return base + spec.fare * .9 + (RISK_KINDS.has(rider.kind) ? 42 : 0);
  if (policy === 'pulse') {
    if (rider.kind === 'bomb' && (rider.fuse ?? 0) < trip && !canPair(state.cabin, ['cop'])) return Number.NEGATIVE_INFINITY;
    if (rider.kind === 'child' && !canPair(state.cabin, CARETAKERS)) return Number.NEGATIVE_INFINITY;
    if (rider.kind === 'ghost' && state.energy < 12 && !canPair(state.cabin, ['exorcist'])) return Number.NEGATIVE_INFINITY;
    const pressureRisk = rider.kind === 'thief' || rider.kind === 'drunk' || rider.kind === 'celebrity';
    const controlled = rider.kind === 'thief' ? canPair(state.cabin, CONTROLLERS) : rider.kind === 'drunk' ? canPair(state.cabin, ['musician', 'nurse']) : false;
    if (state.stress >= 9 && pressureRisk && !controlled) return Number.NEGATIVE_INFINITY;
    const buildPressure = state.stress < 5 && pressureRisk ? 34 : 0;
    const relievePressure = state.stress >= 8 && (rider.kind === 'nurse' || rider.kind === 'musician') ? 28 : 0;
    return base + buildPressure + relievePressure + (RISK_KINDS.has(rider.kind) ? 10 : 0);
  }
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
  offers.forEach((rider) => { aggregate.offered[rider.kind] += 1; });
  aggregate.loverCallsOffered += offers.filter((rider) => rider.calledByLover).length;
  const ordered = policy === 'reckless' ? [...offers] : [...offers].sort((a, b) => offerScore(state, b, policy) - offerScore(state, a, policy));
  for (const rider of ordered) {
    if (!Number.isFinite(offerScore(state, rider, policy))) continue;
    if (totalWeight(state.cabin) + PASSENGERS[rider.kind].weight > state.weightCap) { aggregate.weightRejects += 1; continue; }
    const empty = state.cabin.map((current, slot) => current ? -1 : slot).filter((slot) => slot >= 0);
    if (!empty.length) break;
    const target = empty.sort((a, b) => placementScore(state.cabin, rider, b, policy, state.stress) - placementScore(state.cabin, rider, a, policy, state.stress))[0];
    state.cabin[target] = rider; aggregate.boarded[rider.kind] += 1;
    if (rider.calledByLover) aggregate.loverCallsBoarded += 1;
    if (RISK_KINDS.has(rider.kind)) aggregate.riskBoardings += 1;
  }
}

function chooseUpgrade(state: RunState, choices: UpgradeKey[], policy: Policy, plan?: UpgradePlan): UpgradeKey {
  if (state.energy <= 0) return choices.find((key) => key === 'battery' || key === 'reinforced') ?? choices[0];
  if (state.stress >= state.stressCap) return choices.find((key) => key === 'calm') ?? choices[0];
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

function recordPressure(aggregate: Aggregate, state: RunState) {
  const hasRise = state.lastPressure.sources.some((source) => source.amount > 0);
  const hasRelief = state.lastPressure.sources.some((source) => source.amount < 0);
  if (hasRise) aggregate.pressureRiskFloors += 1;
  if (hasRelief) aggregate.pressureReliefFloors += 1;
  if (hasRise && hasRelief && state.lastPressure.delta === 0) aggregate.pressureCancelledFloors += 1;
  state.lastPressure.sources.forEach((source) => { aggregate.pressureSources[source.label] = (aggregate.pressureSources[source.label] ?? 0) + Math.abs(source.amount); });
}

function recordDecision(aggregate: Aggregate, state: RunState, offers: Rider[]) {
  const occupied = state.cabin.filter(Boolean).length; const emptySlots = state.cabin.length - occupied; const weight = totalWeight(state.cabin);
  aggregate.decisionFloors += 1; aggregate.occupancyBeforeBoard[occupied] += 1;
  if (!emptySlots) { aggregate.fullCabinFloors += 1; return; }
  const legal = offers.filter((rider) => weight + PASSENGERS[rider.kind].weight <= state.weightCap);
  if (!legal.length) return;
  aggregate.openDecisionFloors += 1;
  const contested = legal.length > emptySlots; const hasSynergy = legal.some((rider) => readyPartner(rider.kind, state.cabin, rider.id));
  const hasRisk = legal.some((rider) => RISK_KINDS.has(rider.kind)); const hasSafe = legal.some((rider) => !RISK_KINDS.has(rider.kind));
  const hasSustain = legal.some((rider) => PASSENGERS[rider.kind].energy >= 2 || rider.kind === 'mechanic');
  const hasScore = legal.some((rider) => PASSENGERS[rider.kind].fare >= 13 || RISK_KINDS.has(rider.kind) || rider.kind === 'lover');
  const threeWay = legal.length >= 3 && hasSynergy && hasSustain && hasScore;
  const pressure = stressForecast(state); const energy = energyForecast(state); const tense = state.energy + energy.lowDelta <= travelEnergyCost(state.floor + 2) + 3 || state.stress + pressure.highDelta >= state.stressCap - 4;
  const flowState = occupied >= 4 && occupied <= 5 && state.stress >= 5 && state.stress <= 9 && state.energy >= 6 && state.energy <= 16;
  if (occupied >= 4 && state.stress >= 5 && state.stress <= 9) aggregate.rushZoneFloors += 1;
  if (contested) aggregate.contestedChoiceFloors += 1;
  if (hasSynergy) aggregate.synergyChoiceFloors += 1;
  if (hasRisk && hasSafe) aggregate.riskVsSafeChoiceFloors += 1;
  if (threeWay) aggregate.threeWayChoiceFloors += 1;
  if (contested && tense) aggregate.tensionChoiceFloors += 1;
  if (occupied >= 4 && contested && threeWay && tense) aggregate.goldenChoiceFloors += 1;
  if (flowState) aggregate.flowStateFloors += 1;
  if (flowState && contested) aggregate.flowChoiceFloors += 1;
}

function simulateRun(seed: number, policy: Policy, aggregate: Aggregate, plan?: UpgradePlan) {
  const rng = mulberry32(seed); let state = initialRun(); let offers = makeSimOffers(1, state, rng); let maxStress = 0;
  const recoveries: Array<{ floor: number; type: 'energy' | 'stress' }> = [];
  while (state.status === 'playing' || state.status === 'upgrade') {
    if (state.status === 'upgrade') {
      const energyCrisis = state.energy <= 0; const stressCrisis = state.stress >= state.stressCap; const crisis = energyCrisis || stressCrisis; const choices = upgradeChoices(state.upgrades, rng, energyCrisis ? 'energy' : stressCrisis ? 'stress' : null);
      if (crisis) aggregate.checkpointCrises += 1; if (energyCrisis) aggregate.checkpointEnergyCrises += 1; if (stressCrisis) aggregate.checkpointStressCrises += 1;
      const hasRescue = energyCrisis && stressCrisis ? false : choices.some((key) => energyCrisis ? key === 'battery' || key === 'reinforced' : stressCrisis ? key === 'calm' : false);
      if (crisis && hasRescue) aggregate.checkpointRescueOffers += 1;
      const selected = chooseUpgrade(state, choices, policy, plan); aggregate.upgrades[selected] += 1;
      state = installUpgrade(state, selected); if (crisis && state.status === 'playing') { aggregate.checkpointRescues += 1; const type = energyCrisis ? 'energy' : 'stress'; recoveries.push({ floor: state.floor, type }); if (type === 'energy') aggregate.recoveryEnergyRescues += 1; else aggregate.recoveryStressRescues += 1; } if (crisis && !hasRescue) aggregate.checkpointDeadEnds += 1;
      if (state.status === 'playing') offers = makeSimOffers(state.floor, state, rng);
      continue;
    }
    recordDecision(aggregate, state, offers);
    board(state, offers, policy, aggregate);
    state.cabin.forEach((rider, slot) => {
      if (rider?.kind !== 'lover') return;
      if (hasNeighbour(state.cabin, slot, ['lover'])) {
        aggregate.loverPairedRiderTurns += 1;
        if (rider.destination <= state.floor + 1) aggregate.loverPairedArrivals += 1;
      }
      else aggregate.loverSoloRiderTurns += 1;
    });
    const pressurePrediction = stressForecast(state); const energyPrediction = energyForecast(state);
    aggregate.forecastFloors += 1;
    if (pressurePrediction.lowDelta !== pressurePrediction.highDelta) aggregate.stressUncertaintyFloors += 1;
    if (energyPrediction.lowDelta !== energyPrediction.highDelta) aggregate.energyUncertaintyFloors += 1;
    const stressBefore = state.stress; const energyBefore = state.energy; const stressCap = state.stressCap;
    state = resolveFloor(state, rng); recordPressure(aggregate, state); maxStress = Math.max(maxStress, state.stress);
    const rushEarning = state.lastEarnings.sources.find((source) => source.label === '午夜热区');
    if (rushEarning) { aggregate.rushBonusFloors += 1; aggregate.rushBonusCoins += rushEarning.amount; }
    if (state.lastPressure.delta < pressurePrediction.lowDelta || state.lastPressure.delta > pressurePrediction.highDelta) aggregate.stressForecastMisses += 1;
    if (state.lastEnergy.delta < energyPrediction.lowDelta || state.lastEnergy.delta > energyPrediction.highDelta) aggregate.energyForecastMisses += 1;
    if (stressBefore + pressurePrediction.highDelta < stressCap && state.stress >= stressCap) aggregate.stressUnsafeMisses += 1;
    if (energyBefore + energyPrediction.lowDelta > 0 && state.energy <= 0) aggregate.energyUnsafeMisses += 1;
    if (state.status === 'playing') offers = makeSimOffers(state.floor, state, rng);
  }
  aggregate.floors += state.floor; aggregate.coins += state.coins; aggregate.maxStress += maxStress;
  recoveries.forEach((recovery) => { const survived = (distance: number) => state.floor > recovery.floor + distance || state.floor === recovery.floor + distance && state.status === 'won'; if (survived(1)) { aggregate.recoveryAlive1 += 1; if (recovery.type === 'energy') aggregate.recoveryEnergyAlive1 += 1; else aggregate.recoveryStressAlive1 += 1; } if (survived(3)) { aggregate.recoveryAlive3 += 1; if (recovery.type === 'energy') aggregate.recoveryEnergyAlive3 += 1; else aggregate.recoveryStressAlive3 += 1; } if (survived(5)) { aggregate.recoveryAlive5 += 1; if (recovery.type === 'energy') aggregate.recoveryEnergyAlive5 += 1; else aggregate.recoveryStressAlive5 += 1; } });
  if (state.status === 'won') { aggregate.wins += 1; aggregate.winnerCoins += state.coins; aggregate.winnerEnergy += state.energy; }
  else aggregate.deaths[deathReason(state.message)] += 1;
  return state;
}

function boardOpening(state: RunState, offers: Rider[], plan: OpeningPlan, aggregate: Aggregate) {
  offers.forEach((rider) => { aggregate.offered[rider.kind] += 1; });
  aggregate.loverCallsOffered += offers.filter((rider) => rider.calledByLover).length;
  if (plan.boarding === 'none') return;
  if (plan.boarding === 'conservative') { board(state, offers, 'conservative', aggregate); return; }
  const candidates = plan.boarding === 'first' ? offers.slice(0, 1) : offers;
  for (const rider of candidates) {
    if (totalWeight(state.cabin) + PASSENGERS[rider.kind].weight > state.weightCap) { aggregate.weightRejects += 1; continue; }
    const target = state.cabin.findIndex((current) => !current);
    if (target < 0) break;
    state.cabin[target] = rider; aggregate.boarded[rider.kind] += 1;
    if (rider.calledByLover) aggregate.loverCallsBoarded += 1;
    if (RISK_KINDS.has(rider.kind)) aggregate.riskBoardings += 1;
  }
}

function simulateOpening(seed: number, plan: OpeningPlan) {
  const rng = mulberry32(seed); const aggregate = emptyAggregate(1); let state = initialRun();
  let offers = makeSimOffers(1, state, rng, plan.tutorial); let peakStress = 0;
  while (state.status === 'playing' && state.floor < 10) {
    boardOpening(state, offers, plan, aggregate); state = resolveFloor(state, rng); peakStress = Math.max(peakStress, state.stress);
    if (state.status === 'playing') offers = makeSimOffers(state.floor, state, rng);
  }
  return { state, peakStress, risks: aggregate.riskBoardings, weightRejects: aggregate.weightRejects };
}

function simulateEndgame(seed: number, plan: EndgamePlan) {
  const rng = mulberry32(seed); const aggregate = emptyAggregate(1); let state = initialRun(); let offers = makeSimOffers(1, state, rng);
  let scoreAt50 = -1; let energyAt50 = 0; let stressAt50 = 0; let risksAt50 = 0;
  while (state.status === 'playing' || state.status === 'upgrade') {
    const policy = state.floor >= 50 ? plan.after : plan.before;
    if (state.status === 'upgrade') {
      if (state.floor === 50 && scoreAt50 < 0) { scoreAt50 = state.coins; energyAt50 = state.energy; stressAt50 = state.stress; risksAt50 = aggregate.riskBoardings; }
      const selected = chooseUpgrade(state, upgradeChoices(state.upgrades, rng), policy); aggregate.upgrades[selected] += 1;
      state = installUpgrade(state, selected); if (state.status === 'playing') offers = makeSimOffers(state.floor, state, rng); continue;
    }
    board(state, offers, policy, aggregate); state = resolveFloor(state, rng);
    if (state.floor === 50 && scoreAt50 < 0) { scoreAt50 = state.coins; energyAt50 = state.energy; stressAt50 = state.stress; risksAt50 = aggregate.riskBoardings; }
    if (state.status === 'playing') offers = makeSimOffers(state.floor, state, rng);
  }
  return { state, scoreAt50, energyAt50, stressAt50, endgameRisks: Math.max(0, aggregate.riskBoardings - risksAt50) };
}

function emptyAggregate(runs: number): Aggregate {
  const emptyRoster = () => Object.fromEntries(Object.keys(PASSENGERS).map((kind) => [kind, 0])) as Record<PassengerKind, number>;
  return { runs, wins: 0, floors: 0, coins: 0, winnerCoins: 0, winnerEnergy: 0, maxStress: 0, riskBoardings: 0, weightRejects: 0, pressureRiskFloors: 0, pressureReliefFloors: 0, pressureCancelledFloors: 0, pressureSources: {}, checkpointCrises: 0, checkpointEnergyCrises: 0, checkpointStressCrises: 0, checkpointRescueOffers: 0, checkpointRescues: 0, checkpointDeadEnds: 0, recoveryEnergyRescues: 0, recoveryStressRescues: 0, recoveryAlive1: 0, recoveryAlive3: 0, recoveryAlive5: 0, recoveryEnergyAlive1: 0, recoveryEnergyAlive3: 0, recoveryEnergyAlive5: 0, recoveryStressAlive1: 0, recoveryStressAlive3: 0, recoveryStressAlive5: 0, loverPairedRiderTurns: 0, loverSoloRiderTurns: 0, loverPairedArrivals: 0, loverCallsOffered: 0, loverCallsBoarded: 0, forecastFloors: 0, stressForecastMisses: 0, energyForecastMisses: 0, stressUnsafeMisses: 0, energyUnsafeMisses: 0, stressUncertaintyFloors: 0, energyUncertaintyFloors: 0, decisionFloors: 0, fullCabinFloors: 0, openDecisionFloors: 0, contestedChoiceFloors: 0, synergyChoiceFloors: 0, riskVsSafeChoiceFloors: 0, threeWayChoiceFloors: 0, tensionChoiceFloors: 0, goldenChoiceFloors: 0, rushZoneFloors: 0, rushBonusFloors: 0, rushBonusCoins: 0, flowStateFloors: 0, flowChoiceFloors: 0, occupancyBeforeBoard: Array(7).fill(0), deaths: { energy: 0, stress: 0, bomb: 0, other: 0 }, offered: emptyRoster(), boarded: emptyRoster(), upgrades: { battery: 0, solar: 0, calm: 0, concierge: 0, reinforced: 0, express: 0 } };
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
  loverBoardingsPerRun: rounded(aggregate.boarded.lover / runs), pairedLoverTurnsPerRun: rounded(aggregate.loverPairedRiderTurns / runs),
  loverPairActivationRate: aggregate.loverPairedRiderTurns + aggregate.loverSoloRiderTurns ? rounded(aggregate.loverPairedRiderTurns / (aggregate.loverPairedRiderTurns + aggregate.loverSoloRiderTurns) * 100) : 0,
  loverComboBonusCoinsPerRun: rounded((aggregate.loverPairedRiderTurns + aggregate.loverPairedArrivals * PASSENGERS.lover.fare) / runs),
  loverCallsPerRun: rounded(aggregate.loverCallsOffered / runs), loverCallAcceptanceRate: aggregate.loverCallsOffered ? rounded(aggregate.loverCallsBoarded / aggregate.loverCallsOffered * 100) : 0,
  loverParameters: { rarity: PASSENGERS.lover.rarity, trip: PASSENGERS.lover.trip, callChance: loverCallChance, responsePriority: loverResponseBonus },
  pressure: { riskFloorsPerRun: rounded(aggregate.pressureRiskFloors / runs), reliefFloorsPerRun: rounded(aggregate.pressureReliefFloors / runs), cancelledFloorsPerRun: rounded(aggregate.pressureCancelledFloors / runs), sourcesPerRun: Object.fromEntries(Object.entries(aggregate.pressureSources).sort((a, b) => b[1] - a[1]).map(([label, total]) => [label, rounded(total / runs)])) },
  checkpoints: { crises: aggregate.checkpointCrises, energyCrises: aggregate.checkpointEnergyCrises, stressCrises: aggregate.checkpointStressCrises, rescueOffers: aggregate.checkpointRescueOffers, rescues: aggregate.checkpointRescues, deadEnds: aggregate.checkpointDeadEnds, crisesPerRun: rounded(aggregate.checkpointCrises / runs), rescueOfferRate: aggregate.checkpointCrises ? rounded(aggregate.checkpointRescueOffers / aggregate.checkpointCrises * 100) : 0, rescueRate: aggregate.checkpointCrises ? rounded(aggregate.checkpointRescues / aggregate.checkpointCrises * 100) : 0 },
  recovery: { energyRescues: aggregate.recoveryEnergyRescues, stressRescues: aggregate.recoveryStressRescues, aliveAfter1Rate: aggregate.checkpointRescues ? rounded(aggregate.recoveryAlive1 / aggregate.checkpointRescues * 100) : 0, aliveAfter3Rate: aggregate.checkpointRescues ? rounded(aggregate.recoveryAlive3 / aggregate.checkpointRescues * 100) : 0, aliveAfter5Rate: aggregate.checkpointRescues ? rounded(aggregate.recoveryAlive5 / aggregate.checkpointRescues * 100) : 0, energyAliveAfter1Rate: aggregate.recoveryEnergyRescues ? rounded(aggregate.recoveryEnergyAlive1 / aggregate.recoveryEnergyRescues * 100) : 0, energyAliveAfter3Rate: aggregate.recoveryEnergyRescues ? rounded(aggregate.recoveryEnergyAlive3 / aggregate.recoveryEnergyRescues * 100) : 0, energyAliveAfter5Rate: aggregate.recoveryEnergyRescues ? rounded(aggregate.recoveryEnergyAlive5 / aggregate.recoveryEnergyRescues * 100) : 0, stressAliveAfter1Rate: aggregate.recoveryStressRescues ? rounded(aggregate.recoveryStressAlive1 / aggregate.recoveryStressRescues * 100) : 0, stressAliveAfter3Rate: aggregate.recoveryStressRescues ? rounded(aggregate.recoveryStressAlive3 / aggregate.recoveryStressRescues * 100) : 0, stressAliveAfter5Rate: aggregate.recoveryStressRescues ? rounded(aggregate.recoveryStressAlive5 / aggregate.recoveryStressRescues * 100) : 0 },
  roster: Object.fromEntries((Object.keys(PASSENGERS) as PassengerKind[]).map((kind) => [kind, { offersPerRun: rounded(aggregate.offered[kind] / runs), boardingsPerRun: rounded(aggregate.boarded[kind] / runs), acceptanceRate: aggregate.offered[kind] ? rounded(aggregate.boarded[kind] / aggregate.offered[kind] * 100) : 0 }])),
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
}) : mode === 'checkpoints' ? (['conservative', 'calculated', 'reckless'] as Policy[]).map((policy, policyIndex) => {
  const aggregate = emptyAggregate(runs);
  for (let run = 0; run < runs; run += 1) simulateRun(71001 + policyIndex * 1000003 + run * 97, policy, aggregate);
  return { policy, winRate: rounded(aggregate.wins / runs * 100), ...summarize(aggregate).checkpoints, deaths: aggregate.deaths };
}) : mode === 'recovery' ? (['conservative', 'calculated', 'reckless'] as Policy[]).map((policy, policyIndex) => {
  const aggregate = emptyAggregate(runs);
  for (let run = 0; run < runs; run += 1) simulateRun(73001 + policyIndex * 1000003 + run * 97, policy, aggregate);
  return { policy, winRate: rounded(aggregate.wins / runs * 100), rescues: aggregate.checkpointRescues, ...summarize(aggregate).recovery, deaths: aggregate.deaths };
}) : mode === 'pressure' ? (['conservative', 'calculated', 'reckless'] as Policy[]).map((policy, policyIndex) => {
  const aggregate = emptyAggregate(runs);
  for (let run = 0; run < runs; run += 1) simulateRun(61001 + policyIndex * 1000003 + run * 97, policy, aggregate);
  return { policy, winRate: rounded(aggregate.wins / runs * 100), averagePeakStress: rounded(aggregate.maxStress / runs), ...summarize(aggregate).pressure, deaths: aggregate.deaths };
}) : mode === 'forecast' ? (['conservative', 'calculated', 'reckless'] as Policy[]).map((policy, policyIndex) => {
  const aggregate = emptyAggregate(runs);
  for (let run = 0; run < runs; run += 1) simulateRun(69001 + policyIndex * 1000003 + run * 97, policy, aggregate);
  return {
    policy, runs, forecastFloors: aggregate.forecastFloors,
    stressBoundMisses: aggregate.stressForecastMisses, energyBoundMisses: aggregate.energyForecastMisses,
    stressUnsafeMisses: aggregate.stressUnsafeMisses, energyUnsafeMisses: aggregate.energyUnsafeMisses,
    stressUncertaintyRate: rounded(aggregate.stressUncertaintyFloors / aggregate.forecastFloors * 100),
    energyUncertaintyRate: rounded(aggregate.energyUncertaintyFloors / aggregate.forecastFloors * 100),
  };
}) : mode === 'interest' ? (['conservative', 'calculated', 'pulse', 'reckless'] as Policy[]).map((policy, policyIndex) => {
  const aggregate = emptyAggregate(runs);
  for (let run = 0; run < runs; run += 1) simulateRun(77001 + policyIndex * 1000003 + run * 97, policy, aggregate);
  const rate = (value: number) => rounded(value / aggregate.decisionFloors * 100);
  return {
    policy, runs, decisionFloors: aggregate.decisionFloors,
    rates: { fullCabin: rate(aggregate.fullCabinFloors), openDecision: rate(aggregate.openDecisionFloors), contestedChoice: rate(aggregate.contestedChoiceFloors), synergyChoice: rate(aggregate.synergyChoiceFloors), riskVsSafeChoice: rate(aggregate.riskVsSafeChoiceFloors), threeWayChoice: rate(aggregate.threeWayChoiceFloors), tensionChoice: rate(aggregate.tensionChoiceFloors), goldenChoice: rate(aggregate.goldenChoiceFloors), rushZone: rate(aggregate.rushZoneFloors), flowState: rate(aggregate.flowStateFloors), flowChoice: rate(aggregate.flowChoiceFloors) },
    perRun: { contestedChoice: rounded(aggregate.contestedChoiceFloors / runs), synergyChoice: rounded(aggregate.synergyChoiceFloors / runs), threeWayChoice: rounded(aggregate.threeWayChoiceFloors / runs), tensionChoice: rounded(aggregate.tensionChoiceFloors / runs), goldenChoice: rounded(aggregate.goldenChoiceFloors / runs), rushZone: rounded(aggregate.rushZoneFloors / runs), flowState: rounded(aggregate.flowStateFloors / runs), flowChoice: rounded(aggregate.flowChoiceFloors / runs) },
    occupancy: Object.fromEntries(aggregate.occupancyBeforeBoard.map((count, occupied) => [occupied, rate(count)])),
  };
}) : mode === 'roster' ? (['conservative', 'calculated', 'reckless'] as Policy[]).map((policy, policyIndex) => {
  const aggregate = emptyAggregate(runs);
  for (let run = 0; run < runs; run += 1) simulateRun(67001 + policyIndex * 1000003 + run * 97, policy, aggregate);
  return { policy, winRate: rounded(aggregate.wins / runs * 100), roster: summarize(aggregate).roster };
}) : mode === 'pulse' ? (['conservative', 'calculated', 'pulse', 'reckless'] as Policy[]).map((policy, policyIndex) => {
  const aggregate = emptyAggregate(runs);
  for (let run = 0; run < runs; run += 1) simulateRun(79001 + policyIndex * 1000003 + run * 97, policy, aggregate);
  return { policy, winRate: rounded(aggregate.wins / runs * 100), averageFloor: rounded(aggregate.floors / runs), averageCoins: rounded(aggregate.coins / runs), winnerCoins: aggregate.wins ? rounded(aggregate.winnerCoins / aggregate.wins) : 0, averagePeakStress: rounded(aggregate.maxStress / runs), rushZoneFloorsPerRun: rounded(aggregate.rushZoneFloors / runs), rushBonusFloorsPerRun: rounded(aggregate.rushBonusFloors / runs), rushBonusCoinsPerRun: rounded(aggregate.rushBonusCoins / runs), flowFloorsPerRun: rounded(aggregate.flowStateFloors / runs), tensionChoicesPerRun: rounded(aggregate.tensionChoiceFloors / runs), deaths: aggregate.deaths };
}) : mode === 'scores' ? (['conservative', 'thief', 'drunk', 'celebrity', 'bomb', 'calculated', 'pulse', 'reckless'] as Policy[]).map((policy, policyIndex) => {
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
