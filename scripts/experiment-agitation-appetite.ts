import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { arrivalFare, initialRun, resolveFloor, type FareTuning, type Rider, type RunState } from '../lib/game-engine';
import { passengerBrief } from '../lib/passenger-presentation';

let id = 0;
const rider = (kind: Rider['kind'], extra: Partial<Rider> = {}): Rider => ({ kind, id: `appetite-${id++}`, destination: 5, boardedAt: 1, patience: 0, fareBonus: 0, ...extra });
const state = (stress: number, neighbours: number, extra: Partial<Rider> = {}): RunState => {
  const s = initialRun(); s.floor = 4; s.stress = stress;
  s.cabin[1] = rider('drunk', extra);
  [0, 2, 4].slice(0, neighbours).forEach((slot, i) => { s.cabin[slot] = rider(i === 0 ? 'nurse' : 'tourist', { destination: 9 }); });
  return s;
};
const samples: Array<{ threshold: number; bonus: number; minimumNeighbours: number; cases: number; triggered: number; loneRiderTriggers: number; maxExtraFare: number; meanExtraFare: number }> = [];
for (const threshold of [2, 3, 4]) for (const bonus of [.5, 1, 1.5]) for (const minimumNeighbours of [0, 2]) {
  const tuning: FareTuning = { appetiteThreshold: threshold, appetiteBonus: bonus, appetiteNeighbours: minimumNeighbours };
  let cases = 0, triggered = 0, loneRiderTriggers = 0, maxExtraFare = 0, totalExtraFare = 0;
  for (let stress = 0; stress < 6; stress++) for (let neighbours = 0; neighbours <= 3; neighbours++) for (const volatile of [false, true]) {
    const before = state(stress, neighbours, { volatile });
    const after = resolveFloor(before, () => .9, tuning), control = resolveFloor(before, () => .9, { ...tuning, appetiteBonus: 0 });
    const extra = after.coins - control.coins;
    assert.equal(after.energy, control.energy); assert.equal(after.stress, control.stress); assert.equal(after.status, control.status);
    cases++; totalExtraFare += extra; maxExtraFare = Math.max(maxExtraFare, extra);
    if (extra) { triggered++; if (!neighbours) loneRiderTriggers++; }
  }
  samples.push({ threshold, bonus, minimumNeighbours, cases, triggered, loneRiderTriggers, maxExtraFare, meanExtraFare: totalExtraFare / cases });
}
// Boundary, timing and multiplier order for the selected prototype.
const below = state(2, 2), at = state(3, 2), above = state(4, 2);
assert.equal(arrivalFare(at.cabin[1]!, at.cabin, 1, 3, at.stress), 31);
assert.equal(arrivalFare(below.cabin[1]!, below.cabin, 1, 3, below.stress), 17);
assert.equal(arrivalFare(state(3, 0).cabin[1]!, state(3, 0).cabin, 1, 3, 3), 14);
assert.equal(resolveFloor(at).lastEarnings.sources.find(line => line.label === '醉汉躁动加价')?.amount, 14);
assert.equal(resolveFloor(above).lastEarnings.sources.find(line => line.label === '醉汉躁动加价')?.amount, 14);
assert.equal(passengerBrief(at.cabin[1]!, at.floor, at.cabin, 3, 0, 1, at.stress).expectedFare, 31);
const uncontrolled = state(2, 2); uncontrolled.cabin[0] = rider('tourist', { destination: 9 });
assert.equal(resolveFloor(uncontrolled).lastEarnings.sources.find(line => line.label === '醉汉躁动加价'), undefined, 'agitation gained during ascent cannot retroactively change the departure condition');
const coach = state(3, 2, { fareBonus: 3, volatile: true }); coach.cabin[2] = rider('coach', { destination: 9 });
assert.equal(arrivalFare(coach.cabin[1]!, coach.cabin, 1, 3, 3), 61, '(14+8) × (1+1+0.5) + 3 bond + 3 tip');
const regenerated = { ...at, upgrades: { ...at.upgrades, solar: 1 } };
assert.equal(resolveFloor(regenerated).lastEarnings.sources.find(line => line.label === '醉汉躁动加价')?.amount, 14, 'arrival relief must not cancel a locked-in premium');
assert.equal(resolveFloor(regenerated).stress, 2); assert.equal(resolveFloor(regenerated).lastEnergy.sources.find(line => line.label === '压力回收')?.amount, 1);
const s = state(3, 2); const both = resolveFloor({ ...s, cabin: s.cabin.map(r => r ? { ...r, destination: 5 } : null) });
assert.equal(both.lastEarnings.sources.find(line => line.label === '醉汉躁动加价')?.amount, 14, 'simultaneous departures see the same pre-departure neighbors');
const selected = samples.find(row => row.threshold === 3 && row.bonus === 1 && row.minimumNeighbours === 2)!;
assert.equal(selected.loneRiderTriggers, 0);
const report = { version: '8.29', configurations: samples.length, controlledCases: samples.reduce((sum, row) => sum + row.cases, 0), selected, samples,
  rationale: 'Threshold 3 leaves 3 points to the initial failure cap. Two neighbors prevents a solo-rider premium. +100% base is legible, not a whole-payout doubling. The choice remains a playtest hypothesis, not an optimum inferred from this grid.',
  limits: 'Uniform fixed states are sensitivity checks, not encounter probabilities, optimal play, human fun, or a measured session length.' };
const out = new URL('../experiments/v8.29/', import.meta.url); mkdirSync(out, { recursive: true });
writeFileSync(new URL('agitation-appetite.json', out), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
