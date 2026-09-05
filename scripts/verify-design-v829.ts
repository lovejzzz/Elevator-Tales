import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PASSENGER_ORDER, type PassengerKind } from '../experiments/v8.31/lib/game-data';
import { arrivalFare, arrivalRegeneration, initialRun, makeOffers, resolveFloor, upgradePrice, type Rider, type RunState } from '../experiments/v8.31/lib/game-engine';
import { energyForecast, stressForecast } from '../experiments/v8.31/lib/game-forecast';
import { activeConnection } from '../experiments/v8.31/lib/game-interaction';
import { passengerBrief, passengerCardSections } from '../experiments/v8.31/lib/passenger-presentation';
import { randomTraits } from '../experiments/v8.31/lib/rider-profile';
import { offerReveal } from '../experiments/v8.31/lib/offer-reveal';

let serial = 0, seed = 904829;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const rider = (kind: PassengerKind, destination = 8, extra: Partial<Rider> = {}): Rider => ({ id: `case-${serial++}`, kind, destination, boardedAt: 1, patience: 0, fareBonus: 0, ...extra });
const state = (cabin: Array<Rider | null>, extra: Partial<RunState> = {}): RunState => ({ ...initialRun(), cabin: [...cabin, ...Array(6 - cabin.length).fill(null)], ...extra });
const recovery = (s: RunState) => ({ ...s, upgrades: { ...s.upgrades, solar: 1 } });
const value = (s: RunState, label: string) => s.lastEnergy.sources.find(line => line.label === label)?.amount ?? 0;

const fuel = recovery(state([rider('child', 2), null, rider('courier', 2)]));
const converted = resolveFloor(fuel, () => .9);
assert.equal(value(converted, '压力回收'), 1);
assert.equal(converted.energy, 50); assert.equal(converted.stress, 0);
assert.equal(resolveFloor({ ...fuel, upgrades: { ...fuel.upgrades, solar: 0 } }, () => .9).energy, 49);
const emptyTank = recovery(state([rider('commuter', 2), null, rider('courier', 2)]));
assert.equal(value(resolveFloor(emptyTank), '压力回收'), 0, 'zero agitation is not fuel');
const calm = recovery(state([rider('child', 2), rider('nurse', 8), rider('courier', 2)]));
assert.equal(value(resolveFloor(calm), '压力回收'), 0, 'prevented agitation is not stored fuel');
assert.equal(arrivalRegeneration(recovery(state([rider('commuter')], { stress: 4 })), 6), 2, 'existing arrival-relief cap bounds conversion');
assert.equal(resolveFloor(recovery(state([rider('child')], { stress: 5 }))).status, 'lost', 'the circuit cannot prevent agitation failure');
assert.equal(value(resolveFloor(recovery(state([rider('child')]))), '压力回收'), 0, 'no arrival, no conversion');
assert.equal(resolveFloor(recovery(state([rider('courier', 2)], { energy: 60, stress: 1 }))).energy, 60, 'capacity still applies');
assert.equal(upgradePrice('solar', 10, 0), 30); assert.equal(upgradePrice('battery', 10, 0), 30);

const quiet = state([rider('thief'), rider('nurse')]);
const quietAfter = resolveFloor(quiet);
assert.equal(quietAfter.lastEarnings.sources.find(line => line.label === '小偷')?.amount, 4);
assert.ok(activeConnection(quiet.cabin, 0, 1));

const pair = state([rider('lover', 2, { volatile: true }), rider('lover', 2)]);
assert.equal(arrivalFare(pair.cabin[0]!, pair.cabin, 0), 31);
assert.equal(passengerBrief(pair.cabin[0]!, 1, pair.cabin).expectedFare, 31);
assert.equal(resolveFloor(pair).coins, 48, 'high-risk premium participates in the existing lover multiplier');
const hidden = rider('mystery', 2, { traits: randomTraits('mystery', PASSENGER_ORDER, random) });
assert.equal(passengerBrief(hidden, 1, [hidden]).expectedFare, null);
assert.equal(offerReveal([rider('lover'), rider('lover'), rider('courier')], []).debutIds.length, 2, 'first encounter is recorded once per kind');
assert.equal(offerReveal([hidden], ['mystery']).cue, offerReveal([{...hidden, traits:{...hidden.traits!, fare:40}}], ['mystery']).cue, 'sealed fare cannot influence reveal cues');
const component = readFileSync(new URL('../experiments/v8.31/components/elevator-game.tsx.txt', import.meta.url), 'utf8');
assert.doesNotMatch(component, /discoverStrategies|strategy-discoveries|本班发现|发现 · /, 'never label player strategies or announce their discovery');
const tourist = rider('tourist');
const sections = passengerCardSections(tourist, state([tourist]));
assert.equal(sections.greenBonus.length, 0);
assert.ok(!sections.green.find(row => row.targetLabel === '任何邻座')!.effects.some(effect => effect.text.includes('到站')));
assert.ok(sections.green.find(row => row.targets?.includes('celebrity'))!.effects.some(effect => effect.text === '本人到站时 +3/人'));

let offerBatches = 0, supportBatches120 = 0, calls = 0;
for (const floor of [1, 40, 80, 120, 160]) for (let n = 0; n < 4000; n++) {
  const offers = makeOffers(floor, initialRun().upgrades, false, random, [rider('lover', floor + 6)]);
  for (const candidate of offers) if (candidate.calledByLover) { calls++; assert.equal(candidate.kind, 'lover'); }
  if (floor === 120 && offers.some(r => ['nurse', 'musician', 'mechanic', 'exorcist'].includes(r.kind))) supportBatches120++;
  const before = JSON.stringify(offers);
  const plan = offerReveal(offers, []);
  assert.equal(plan.debutIds.length, 3); assert.equal(plan.cue, 'debut');
  assert.equal(JSON.stringify(offers), before, 'reveal never modifies the roll or order');
  assert.equal(offerReveal(offers, PASSENGER_ORDER).debutIds.length, 0);
  offerBatches++;
}
assert.ok(supportBatches120 > 0, 'support characters must remain obtainable beyond floor 120');
assert.ok(calls > 4000 && calls < 6000, 'lover response must work across all five pressure tiers');

let forecastChecks = 0;
for (let n = 0; n < 10000; n++) {
  const floor = 1 + Math.floor(random() * 150);
  const s = initialRun(); s.floor = floor; s.energy = Math.floor(random() * 61); s.stress = Math.floor(random() * 9);
  s.upgrades.solar = n % 2; s.upgrades.reinforced = Number(random() < .5); s.upgrades.battery = n % 4;
  s.cabin = Array.from({ length: 6 }, (_, i) => {
    if (i > 0 && random() < .3) return null;
    const kind = PASSENGER_ORDER[Math.floor(random() * PASSENGER_ORDER.length)];
    return rider(kind, floor + 1 + Math.floor(random() * 3), { fuse: 1 + Math.floor(random() * 4), volatile: random() < .4,
      traits: ['mystery', 'shifter'].includes(kind) ? randomTraits(kind as 'mystery' | 'shifter', PASSENGER_ORDER, random) : undefined,
      copySeed: Math.floor(random() * 10000) });
  });
  const e = energyForecast(s), p = stressForecast(s), after = resolveFloor(s, random);
  assert.ok(after.lastEnergy.delta >= e.lowDelta && after.lastEnergy.delta <= e.highDelta, `energy forecast at case ${n}`);
  assert.ok(after.lastPressure.delta >= p.lowDelta && after.lastPressure.delta <= p.highDelta, `pressure forecast at case ${n}`);
  assert.ok(after.energy <= s.energyCap);
  forecastChecks++;
}
console.log(JSON.stringify({ version: '8.29', forecastChecks, forecastMisses: 0, offerBatches, supportBatches120, calls, conversion: 'actual arrival relief only; 1 energy/point; cap 2; no invented stats or hidden-fare reveal' }));
