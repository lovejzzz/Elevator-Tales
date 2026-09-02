import assert from 'node:assert/strict';
import { emergencyEnergyRunway, expressTrip, failureLesson, initialRun, installUpgrade, makeOffers, readyPartner, resolveFloor, synergyPartnerAtSlot, upgradeChoices, type ChangeLine, type Rider } from '../lib/game-engine';
import { UPGRADES, type PassengerKind } from '../lib/game-data';

const rider = (kind: PassengerKind, id: string, overrides: Partial<Rider> = {}): Rider => ({
  id, kind, destination: 8, patience: 10, boardedAt: 1, fareBonus: 0, ...overrides,
});
const sourceMap = (sources: ChangeLine[]) => Object.fromEntries(sources.map((line) => [line.label, line.amount]));

const guidedOffers = makeOffers(1, initialRun().upgrades, true, () => 0.5);
assert.deepEqual(guidedOffers.map((offer) => offer.kind), ['lover', 'lover', 'courier'], 'the first shift should demonstrate a real adjacency pairing');
assert.deepEqual(guidedOffers.map((offer) => offer.destination), [6, 6, 3], 'the guided lover pair should travel and arrive together');
assert.equal(readyPartner('lover', [guidedOffers[0], null, null, null, null, null], guidedOffers[1].id), 'lover', 'the second guided lover should show that its pairing is ready');
assert.equal(readyPartner('thief', [rider('cop', 'ready-cop'), null, null, null, null, null]), 'cop');
assert.equal(readyPartner('commuter', [rider('cop', 'unused-cop'), null, null, null, null, null]), null);
assert.equal(synergyPartnerAtSlot('lover', [guidedOffers[0], null, null, null, null, null], 1, guidedOffers[1].id), 'lover', 'an adjacent empty slot should be highlighted for the selected lover');
assert.equal(synergyPartnerAtSlot('lover', [guidedOffers[0], null, null, null, null, null], 2, guidedOffers[1].id), null, 'a non-adjacent empty slot should not be highlighted');
const fullCabin = [rider('lover', 'full-lover'), rider('commuter', 'full-1'), rider('commuter', 'full-2'), rider('commuter', 'full-3'), rider('commuter', 'full-4'), rider('commuter', 'full-5')];
assert.equal(readyPartner('lover', fullCabin, 'waiting-lover'), null, 'a full cabin must not advertise an impossible new pairing');

const balanced = resolveFloor({ ...initialRun(), cabin: [rider('nurse', 'nurse'), rider('thief', 'thief'), null, null, null, null] }, () => 0.9);
assert.equal(balanced.stress, 0, 'same-floor relief should cancel pressure regardless of slot order');
assert.equal(balanced.lastPressure.delta, 0);
assert.deepEqual(sourceMap(balanced.lastPressure.sources), { '护士安抚': -1, '小偷未受控': 1 });

const impatient = resolveFloor({ ...initialRun(), cabin: [rider('commuter', 'late', { patience: 1 }), null, null, null, null, null] }, () => 0.9);
assert.equal(impatient.stress, 2);
assert.equal(sourceMap(impatient.lastPressure.sources)['耐心归零'], 2);

const drunk = resolveFloor({ ...initialRun(), cabin: [rider('drunk', 'drunk'), null, null, null, null, null] }, () => 0.1);
assert.equal(drunk.stress, 2);
assert.equal(sourceMap(drunk.lastPressure.sources)['醉汉闹事'], 2);

const energyLoss = resolveFloor({ ...initialRun(), energy: 1 }, () => 0.9);
assert.match(failureLesson(energyLoss), /短途和高回能乘客/);
const pressureLoss = resolveFloor({ ...initialRun(), stress: 14, cabin: [rider('thief', 'risky-thief'), null, null, null, null, null] }, () => 0.9);
assert.match(failureLesson(pressureLoss), /小偷未受控 \+1/);
const bombLoss = resolveFloor({ ...initialRun(), cabin: [rider('bomb', 'bomb', { fuse: 1 }), null, null, null, null, null] }, () => 0.9);
assert.match(failureLesson(bombLoss), /炸弹客与警察相邻/);

const energyRescueChoices = upgradeChoices(initialRun().upgrades, () => 0.5, 'energy');
assert.ok(energyRescueChoices.some((key) => key === 'battery' || key === 'reinforced'), 'an energy crisis checkpoint should always offer a rescue');
const stressRescueChoices = upgradeChoices(initialRun().upgrades, () => 0.5, 'stress');
assert.ok(stressRescueChoices.includes('calm'), 'a pressure crisis checkpoint should always offer calm control');
const deepEnergyRescue = installUpgrade({ ...initialRun(), floor: 10, status: 'upgrade', energy: -8 }, 'battery');
assert.equal(deepEnergyRescue.status, 'playing', 'a labeled energy rescue should restart even after a deep deficit');
assert.equal(deepEnergyRescue.energy, emergencyEnergyRunway(10), 'an emergency energy restart should cover three baseline moves plus one point');
assert.equal(emergencyEnergyRunway(10), 7);
assert.equal(emergencyEnergyRunway(30), 10);
assert.equal(emergencyEnergyRunway(50), 13);
assert.equal(expressTrip(4, 1), 4, 'express should no longer erase the tradeoff on short trips');
assert.equal(expressTrip(5, 1), 4, 'express should still accelerate medium and long-haul trips');
assert.equal(expressTrip(8, 0), 8, 'express should do nothing before installation');
const deepStressRescue = installUpgrade({ ...initialRun(), status: 'upgrade', stress: 21 }, 'calm');
assert.equal(deepStressRescue.status, 'playing', 'a labeled pressure rescue should de-escalate even after a deep overrun');
assert.equal(deepStressRescue.stress, deepStressRescue.stressCap - 1, 'an emergency pressure reset should leave one point of margin');
const doubleCrisis = resolveFloor({ ...initialRun(), floor: 9, energy: 1, stress: 14, cabin: [rider('thief', 'double-crisis'), null, null, null, null, null] }, () => 0.9);
assert.equal(doubleCrisis.status, 'lost', 'a simultaneous energy and pressure failure should not open a misleading upgrade choice');
assert.match(doubleCrisis.message, /能源耗尽且压力/);
assert.match(failureLesson(doubleCrisis), /双重失控/);

const lovers = resolveFloor({ ...initialRun(), cabin: [rider('lover', 'lover-a'), rider('lover', 'lover-b'), null, null, null, null] }, () => 0.9);
assert.equal(lovers.lastEarnings.total, 2);
assert.equal(sourceMap(lovers.lastEarnings.sources)['恋人连携'], 2);

const soloLover = resolveFloor({ ...initialRun(), cabin: [rider('lover', 'solo', { patience: 10 }), null, null, null, null, null] }, () => 0.9);
assert.equal(soloLover.cabin[0]?.patience, 9, 'solo lovers should only lose the normal one patience per floor');
const calledOffers = makeOffers(2, initialRun().upgrades, false, () => 0.1, soloLover.cabin);
assert.equal(calledOffers[0].kind, 'lover', 'a solo lover should sometimes call another lover into the next offer');
assert.equal(calledOffers[0].calledByLover, true, 'the called lover should retain its causal marker');
assert.equal(new Set(Object.values(UPGRADES).map((upgrade) => upgrade.strategy)).size, 6, 'every upgrade should expose a distinct strategic role');

console.log('Mechanics verified: pressure rules, lover pairing, crisis rescue, and the lover call.');
