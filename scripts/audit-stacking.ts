import assert from 'node:assert/strict';
import { ADJACENT, PASSENGERS, PASSENGER_ORDER, type PassengerKind } from '../lib/game-data';
import {
  energyBreakdown,
  energySavings,
  initialRun,
  passengerEnergy,
  resolveFloor,
  riderAgitation,
  touristCompanionCount,
  type Rider,
  type RunState,
} from '../lib/game-engine';
import { BONDS, bondStatus, conflictLinks, randomTraits, riderProfile, type VariableTraits } from '../lib/rider-profile';

const neighborSlots = [0, 2, 4];
const rngFor = (seed: number) => () => {
  let value = seed += 0x6d2b79f5;
  value = Math.imul(value ^ value >>> 15, value | 1);
  value ^= value + Math.imul(value ^ value >>> 7, value | 61);
  return ((value ^ value >>> 14) >>> 0) / 4294967296;
};
const traitsFor = (kind: PassengerKind): VariableTraits | undefined => kind === 'mystery' || kind === 'shifter'
  ? { weight: 0, energy: kind === 'shifter' ? 2 : 1, agitation: kind === 'shifter' ? 1 : 0, fare: kind === 'shifter' ? 38 : 24, bond: BONDS[kind], revision: 0 }
  : undefined;
const rider = (kind: PassengerKind, id: string, extra: Partial<Rider> = {}): Rider => ({
  kind, id, destination: 20, patience: 0, boardedAt: 1, fareBonus: 0,
  traits: traitsFor(kind), copySeed: kind === 'mimic' ? id.length * 7919 : undefined,
  fuse: kind === 'bomb' ? 9 : undefined, ...extra,
});
const state = (cabin: Array<Rider | null>, extra: Partial<RunState> = {}): RunState => ({
  ...initialRun(), energy: 100, energyCap: 100, stressCap: 99, cabin, ...extra,
});
const sourceAmount = (run: RunState, label: string) => run.lastEarnings.sources.find(line => line.label === label)?.amount ?? 0;

// Every directed relationship can stack to the three-neighbor geometry limit.
const genericLinks = PASSENGER_ORDER.flatMap(kind => {
  if (kind === 'mimic') return [];
  return [1, 2, 3].map(count => {
    const target = rider(kind, `${kind}-target`, { destination: 2 });
    const liked = BONDS[kind].likes[0];
    const cabin: Array<Rider | null> = [null, target, null, null, null, null];
    neighborSlots.slice(0, count).forEach((slot, index) => { cabin[slot] = rider(liked, `${kind}-like-${index}`); });
    const links = bondStatus(target, cabin, 1).supportCount;
    assert.equal(links, count, `${kind}: every support neighbor should count`);
    const plain = resolveFloor(state(cabin, { upgrades: { ...initialRun().upgrades, battery: 0 } }), () => .9);
    const upgraded = resolveFloor(state(cabin, { upgrades: { ...initialRun().upgrades, battery: 3 } }), () => .9);
    const label = `${PASSENGERS[kind].name}${kind === 'mystery' ? '揭晓车费' : '到站'}`;
    assert.equal(sourceAmount(upgraded, label) - sourceAmount(plain, label), count * 6, `${kind}: contract levels must remain linear per support link`);
    return { kind, count, arrivalGainFromThreeContracts: count * 6 };
  });
});

const genericConflicts = PASSENGER_ORDER.flatMap(kind => {
  if (kind === 'mimic') return [];
  return [1, 2, 3].map(count => {
    const target = rider(kind, `${kind}-target`);
    const avoided = BONDS[kind].avoids[0];
    const cabin: Array<Rider | null> = [null, target, null, null, null, null];
    neighborSlots.slice(0, count).forEach((slot, index) => { cabin[slot] = rider(avoided, `${kind}-avoid-${index}`); });
    const firstFloor = conflictLinks(cabin);
    const secondFloor = conflictLinks(state(cabin, { floor: 2 }).cabin);
    assert.equal(firstFloor.length, count);
    assert.deepEqual(secondFloor, firstFloor);
    return { kind, count, effects: firstFloor.map(link => link.effect) };
  });
});

// Skill-specific marginal curves.
const mechanicCurve = [0, 1, 2, 3].map(count => {
  const cabin: Array<Rider | null> = [rider('coach', 'load-a'), rider('coach', 'load-b'), rider('coach', 'load-c'), null, null, null];
  [3, 4, 5].slice(0, count).forEach((slot, index) => { cabin[slot] = rider('mechanic', `mechanic-${index}`); });
  const run = state(cabin); const energy = energyBreakdown(run);
  return { count, people: energy.people, saved: energy.saved, total: energy.total };
});
assert.deepEqual(mechanicCurve.map(row => row.total), [4, 4, 4, 4]);

const ghostCurve = [0, 1, 2, 3].map(count => {
  const cabin: Array<Rider | null> = [null, rider('exorcist', 'warden'), null, rider('coach', 'load-a'), null, rider('coach', 'load-b')];
  neighborSlots.slice(0, count).forEach((slot, index) => { cabin[slot] = rider('ghost', `ghost-${index}`); });
  const run = state(cabin); const energy = energyBreakdown(run);
  return { count, people: energy.people, saved: energy.saved, total: energy.total };
});
assert.deepEqual(ghostCurve.map(row => row.saved), [0, 2, 3, 3]);

const courierCurve = [1, 2, 3].map(count => {
  const cabin: Array<Rider | null> = Array(6).fill(null);
  for (let index = 0; index < count; index += 1) cabin[index] = rider('courier', `courier-${index}`, { destination: 2 });
  const result = resolveFloor(state(cabin, { energy: 50 }));
  return { count, netPower: result.lastEnergy.delta, recharge: result.lastEnergy.sources.find(line => line.label === '快递员电池包')?.amount ?? 0 };
});
assert.deepEqual(courierCurve.map(row => row.netPower), [0, 1, 2]);

const subsets = (count: number) => Array.from({ length: 1 << 6 }, (_, mask) => mask).filter(mask => mask.toString(2).split('1').length - 1 === count);
const loverCurve = [1, 2, 3, 4, 5, 6].map(count => {
  const best = subsets(count).map(mask => {
    const cabin = Array.from({ length: 6 }, (_, slot) => mask & (1 << slot) ? rider('lover', `lover-${slot}`, { destination: 2 }) : null);
    const edges = ADJACENT.filter(([a, b]) => cabin[a] && cabin[b]).length;
    const result = resolveFloor(state(cabin));
    return { mask, edges, coins: result.lastEarnings.total };
  }).sort((a, b) => b.coins - a.coins || b.edges - a.edges)[0];
  return { count, links: best.edges, arrivalFloorCoins: best.coins };
});
const contractLoverCurve = [0, 1, 2, 3, 4, 5].map(level => {
  const cabin = Array.from({ length: 6 }, (_, slot) => rider('lover', `contract-lover-${slot}`, { destination: 2 }));
  const upgrades = { ...initialRun().upgrades, battery: level };
  return { level, arrivalFloorCoins: resolveFloor(state(cabin, { upgrades })).lastEarnings.total };
});
assert.deepEqual(contractLoverCurve.map(row => row.arrivalFloorCoins), [176, 204, 232, 260, 288, 316]);

const coachCurve = [0, 1, 2, 3].map(count => {
  const cabin: Array<Rider | null> = [null, rider('tourist', 'coach-target', { destination: 2 }), null, null, null, null];
  neighborSlots.slice(0, count).forEach((slot, index) => { cabin[slot] = rider('coach', `coach-${index}`); });
  return { count, touristFare: sourceAmount(resolveFloor(state(cabin)), '游客到站') };
});
assert.deepEqual(coachCurve.map(row => row.touristFare), [18, 27, 36, 45]);
const conciergeCoachCurve = [0, 1, 2, 3].map(level => {
  const cabin: Array<Rider | null> = [rider('coach', 'tip-coach-a'), rider('tourist', 'tip-target', { destination: 2, fareBonus: level * 3 }), rider('coach', 'tip-coach-b'), null, rider('coach', 'tip-coach-c'), null];
  return { level, touristFare: sourceAmount(resolveFloor(state(cabin)), '游客到站') };
});
assert.deepEqual(conciergeCoachCurve.map(row => row.touristFare), [45, 48, 51, 54]);

const touristCurve = [0, 1, 2, 3].map(count => {
  const cabin: Array<Rider | null> = [null, rider('tourist', 'tourist-target'), null, null, null, null];
  const kinds: PassengerKind[] = ['commuter', 'courier', 'mechanic'];
  neighborSlots.slice(0, count).forEach((slot, index) => { cabin[slot] = rider(kinds[index], `tourist-neighbor-${index}`); });
  return { count, companions: touristCompanionCount(cabin, 1) };
});
assert.deepEqual(touristCurve.map(row => row.companions), [0, 1, 2, 3]);

const touristCabinCurve = [1, 2, 3, 4, 5, 6].map(count => {
  const best = subsets(count).map(mask => {
    const cabin = Array.from({ length: 6 }, (_, slot) => mask & (1 << slot) ? rider('tourist', `tourist-${slot}`) : null);
    const result = resolveFloor(state(cabin));
    return { mask, companionCoins: sourceAmount(result, '游客旅伴') };
  }).sort((a, b) => b.companionCoins - a.companionCoins)[0];
  return { count, companionCoins: best.companionCoins };
});
assert.deepEqual(touristCabinCurve.map(row => row.companionCoins), [0, 2, 4, 8, 10, 14]);

const calmerCurve = [0, 1, 2, 3].map(count => {
  const target = rider('shifter', 'agitated', { volatile: true, traits: { weight: 0, energy: 1, agitation: 1, fare: 38, bond: { likes: ['lawyer'], avoids: ['commuter'] }, revision: 0 } });
  const cabin: Array<Rider | null> = [null, target, null, null, null, null];
  neighborSlots.forEach((slot, index) => { cabin[slot] = index < count ? rider(index % 2 ? 'musician' : 'nurse', `calmer-${index}`) : rider('commuter', `conflict-${index}`); });
  return { count, targetAgitation: riderAgitation(state(cabin, { floor: 1 }), 1).low };
});
assert.deepEqual(calmerCurve.map(row => row.targetAgitation), [2, 1, 0, 0]);

const nurseFanout = [1, 2, 3].map(count => {
  const cabin: Array<Rider | null> = [null, rider('nurse', 'nurse'), null, null, null, null];
  neighborSlots.slice(0, count).forEach((slot, index) => { cabin[slot] = rider('drunk', `drunk-${index}`); });
  const result = resolveFloor(state(cabin));
  return { count, calmIncome: sourceAmount(result, '醉汉安抚'), agitation: result.lastPressure.delta, nurseLinks: bondStatus(cabin[1]!, cabin, 1).supportCount };
});
const thiefFanout = [1, 2, 3].map(count => {
  const cabin: Array<Rider | null> = [null, rider('cop', 'fanout-cop'), null, null, null, null];
  neighborSlots.slice(0, count).forEach((slot, index) => { cabin[slot] = rider('thief', `fanout-thief-${index}`); });
  const result = resolveFloor(state(cabin));
  const directedLinks = cabin.reduce((sum, occupant, slot) => sum + (occupant ? bondStatus(occupant, cabin, slot).supportCount : 0), 0);
  return { count, controlledIncome: sourceAmount(result, '受控小偷'), agitation: result.lastPressure.delta, directedLinks };
});
assert.deepEqual(thiefFanout.map(row => [row.controlledIncome, row.agitation, row.directedLinks]), [[1, 0, 2], [2, 0, 4], [3, 0, 6]]);

const copFanout = [1, 2, 3].map(count => {
  const cabin: Array<Rider | null> = [null, rider('cop', 'cop'), null, null, null, null];
  neighborSlots.slice(0, count).forEach((slot, index) => { cabin[slot] = rider('bomb', `bomb-${index}`, { fuse: 4 }); });
  const result = resolveFloor(state(cabin, { floor: 1 }));
  return { count, pausedBombs: result.cabin.filter(r => r?.kind === 'bomb' && r.fuse === 4).length };
});
assert.deepEqual(copFanout.map(row => row.pausedBombs), [1, 2, 3], 'one Officer must lock every adjacent Bomb timer without an odd/even gate');

const ghostDelayCurve = [1, 2, 3].map(count => {
  const target = rider('commuter', 'delay-target');
  const cabin: Array<Rider | null> = [null, target, null, null, null, null];
  neighborSlots.slice(0, count).forEach((slot, index) => { cabin[slot] = rider('ghost', `delay-ghost-${index}`); });
  const result = resolveFloor(state(cabin, { floor: 2 }), () => 0);
  return { count, addedStops: (result.cabin.find(r => r?.id === target.id)?.destination ?? target.destination) - target.destination };
});
assert.deepEqual(ghostDelayCurve.map(row => row.addedStops), [1, 2, 3]);

const inspectorCurve = [1, 2, 3, 4, 5].map(count => {
  const cabin = Array.from({ length: 6 }, (_, slot) => slot < count ? rider('inspector', `inspector-${slot}`) : null);
  const result = resolveFloor(state(cabin));
  return { count, totalPower: energyBreakdown(state(cabin)).total, complianceCoins: sourceAmount(result, '检查员合规奖励'), agitation: result.lastPressure.delta };
});
assert.deepEqual(inspectorCurve.map(row => row.complianceCoins), [1, 2, 3, 0, 0]);

const celebrityCurve = [1, 2, 3, 4, 5, 6].map(count => {
  const best = subsets(count).map(mask => {
    const cabin = Array.from({ length: 6 }, (_, slot) => mask & (1 << slot) ? rider('celebrity', `celebrity-${slot}`) : null);
    const result = resolveFloor(state(cabin));
    return { mask, attention: sourceAmount(result, '名人关注'), agitation: result.lastPressure.delta };
  }).sort((a, b) => (b.attention - b.agitation * 6) - (a.attention - a.agitation * 6))[0];
  return { count, attention: best.attention, agitation: best.agitation };
});

const mimicFields: Record<string, number> = {};
for (let seed = 0; seed < 12_000; seed += 1) {
  const cabin: Array<Rider | null> = [rider('tourist', 'mimic-a'), rider('mimic', 'mimic-target', { copySeed: seed }), rider('coach', 'mimic-b'), null, rider('shifter', 'mimic-c'), null];
  const profile = riderProfile(cabin[1]!, cabin, 1);
  assert.equal(profile.copies.length, 3);
  assert.deepEqual(new Set(profile.copies.map(copy => copy.field)), new Set(['energy', 'fare', 'agitation']));
  profile.copies.forEach(copy => { const key = `${copy.sourceKind}:${copy.field}`; mimicFields[key] = (mimicFields[key] ?? 0) + 1; });
}

const variableTraits = (['mystery', 'shifter'] as const).map((kind, kindIndex) => {
  const rng = rngFor(817_000 + kindIndex); const samples = 50_000;
  const energy: Record<number, number> = {}; const agitation: Record<number, number> = {}; let minFare = Infinity; let maxFare = -Infinity;
  for (let index = 0; index < samples; index += 1) {
    const traits = randomTraits(kind, PASSENGER_ORDER, rng);
    energy[traits.energy ?? 0] = (energy[traits.energy ?? 0] ?? 0) + 1;
    agitation[traits.agitation ?? 0] = (agitation[traits.agitation ?? 0] ?? 0) + 1;
    minFare = Math.min(minFare, traits.fare); maxFare = Math.max(maxFare, traits.fare);
    assert.notEqual(traits.bond.likes[0], traits.bond.avoids[0]);
  }
  return { kind, samples, energy, agitation, fareRange: [minFare, maxFare] };
});

// Exhaust all 21^3 neighbor triples around every center rider.
type Formation = { center: PassengerKind; neighbors: PassengerKind[]; coins: number; agitation: number; power: number; savings: number; supportLinks: number; conflictLinks: number };
const topFormations: Formation[] = [];
const bestByCenter = {} as Record<PassengerKind, Formation>;
let starFormations = 0;
for (const center of PASSENGER_ORDER) for (const first of PASSENGER_ORDER) for (const second of PASSENGER_ORDER) for (const third of PASSENGER_ORDER) {
  const cabin: Array<Rider | null> = [rider(first, 'star-a'), rider(center, 'star-center'), rider(second, 'star-b'), null, rider(third, 'star-c'), null];
  const run = state(cabin, { floor: 1 }); const result = resolveFloor(run, () => .9); const energy = energyBreakdown(run); const bond = bondStatus(cabin[1]!, cabin, 1);
  const row: Formation = { center, neighbors: [first, second, third], coins: result.lastEarnings.total, agitation: result.lastPressure.delta, power: energy.total, savings: energySavings(run), supportLinks: bond.supportCount, conflictLinks: bond.conflictCount };
  const score = (formation: Formation) => formation.coins - formation.agitation * 8 - formation.power * 2;
  if (!bestByCenter[center] || score(row) > score(bestByCenter[center])) bestByCenter[center] = row;
  topFormations.push(row); topFormations.sort((a, b) => (b.coins - b.agitation * 8 - b.power * 2) - (a.coins - a.agitation * 8 - a.power * 2)); if (topFormations.length > 12) topFormations.pop();
  assert.ok(energy.saved <= passengerEnergy(run));
  starFormations += 1;
}

console.log(JSON.stringify({
  version: 'v8.22-stack-audit', starFormations, genericSupportCases: genericLinks.length,
  genericConflictCases: genericConflicts.length, mechanicCurve, ghostCurve, courierCurve,
  loverCurve, contractLoverCurve, coachCurve, conciergeCoachCurve, touristCurve, touristCabinCurve, calmerCurve, nurseFanout, thiefFanout, copFanout,
  ghostDelayCurve, inspectorCurve, celebrityCurve, mimicSamples: 12_000,
  mimicFields, variableTraits, bestByCenter, topFormations,
  hardStops: ['green rewards stay linear', 'red conflicts resolve every floor', 'green and red links resolve independently', 'savings never erase motor cost', 'Musician and Nurse affect every adjacent rider', 'Officer locks every adjacent Bomb timer without an odd/even gate', 'Tourist companions stack per occupied neighbor with no rules cap', 'Tourist visual links do not add generic arrival rewards', 'Mimic copies three distinct fields'],
}, null, 2));
