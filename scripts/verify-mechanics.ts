import assert from 'node:assert/strict';
import { initialRun, makeOffers, resolveFloor, type ChangeLine, type Rider } from '../lib/game-engine';
import type { PassengerKind } from '../lib/game-data';

const rider = (kind: PassengerKind, id: string, overrides: Partial<Rider> = {}): Rider => ({
  id, kind, destination: 8, patience: 10, boardedAt: 1, fareBonus: 0, ...overrides,
});
const sourceMap = (sources: ChangeLine[]) => Object.fromEntries(sources.map((line) => [line.label, line.amount]));

const balanced = resolveFloor({ ...initialRun(), cabin: [rider('nurse', 'nurse'), rider('thief', 'thief'), null, null, null, null] }, () => 0.9);
assert.equal(balanced.stress, 0, 'same-floor relief should cancel pressure regardless of slot order');
assert.equal(balanced.lastPressure.delta, 0);
assert.deepEqual(sourceMap(balanced.lastPressure.sources), { '护士安抚': -1, '小偷': 1 });

const impatient = resolveFloor({ ...initialRun(), cabin: [rider('commuter', 'late', { patience: 1 }), null, null, null, null, null] }, () => 0.9);
assert.equal(impatient.stress, 2);
assert.equal(sourceMap(impatient.lastPressure.sources)['耐心归零'], 2);

const drunk = resolveFloor({ ...initialRun(), cabin: [rider('drunk', 'drunk'), null, null, null, null, null] }, () => 0.1);
assert.equal(drunk.stress, 2);
assert.equal(sourceMap(drunk.lastPressure.sources)['醉汉闹事'], 2);

const lovers = resolveFloor({ ...initialRun(), cabin: [rider('lover', 'lover-a'), rider('lover', 'lover-b'), null, null, null, null] }, () => 0.9);
assert.equal(lovers.lastEarnings.total, 2);
assert.equal(sourceMap(lovers.lastEarnings.sources)['恋人连携'], 2);

const soloLover = resolveFloor({ ...initialRun(), cabin: [rider('lover', 'solo', { patience: 10 }), null, null, null, null, null] }, () => 0.9);
assert.equal(soloLover.cabin[0]?.patience, 9, 'solo lovers should only lose the normal one patience per floor');
const calledOffers = makeOffers(2, initialRun().upgrades, false, () => 0.1, soloLover.cabin);
assert.equal(calledOffers[0].kind, 'lover', 'a solo lover should sometimes call another lover into the next offer');
assert.equal(calledOffers[0].calledByLover, true, 'the called lover should retain its causal marker');

console.log('Mechanics verified: pressure rules, lover pairing, and the lover call.');
