import assert from 'node:assert/strict';
import { emergencyEnergyRunway, expressTrip, failureLesson, initialRun, installUpgrade, makeOffers, NIGHT_RUSH_MAX, NIGHT_RUSH_MIN, nightRushBonus, readyPartner, resolveFloor, synergyPartnerAtSlot, upgradeChoices, type ChangeLine, type Rider } from '../lib/game-engine';
import { PASSENGER_ORDER, PASSENGERS, UPGRADES, type PassengerKind } from '../lib/game-data';
import { energyForecast, stressForecast } from '../lib/game-forecast';
import { activeConnection, planPlacement } from '../lib/game-interaction';
import { passengerBrief, PASSENGER_RULES } from '../lib/passenger-presentation';
import { metricChanges } from '../lib/metric-feedback';
import { metricSound } from '../lib/game-audio';

const rider = (kind: PassengerKind, id: string, overrides: Partial<Rider> = {}): Rider => ({
  id, kind, destination: 8, patience: 10, boardedAt: 1, fareBonus: 0, ...overrides,
});
const sourceMap = (sources: ChangeLine[]) => Object.fromEntries(sources.map((line) => [line.label, line.amount]));

const emptyPlacement = initialRun(); const placedLover = rider('lover', 'placed-lover');
const placeFirst = planPlacement(emptyPlacement, placedLover, 0);
assert.equal(placeFirst.ok, true); assert.equal(placeFirst.tone, 'place');
assert.equal(emptyPlacement.cabin[0], null, 'hover previews must never mutate live cabin state');
const placeSecond = planPlacement(placeFirst.next, rider('lover', 'second-lover'), 1);
assert.equal(placeSecond.tone, 'combo'); assert.equal(activeConnection(placeSecond.next.cabin, 0, 1), true);
assert.deepEqual(placeSecond.slots, [1, 0], 'both members of a newly formed pair should receive feedback');
const invalidPlacement = planPlacement(placeFirst.next, rider('nurse', 'blocked-nurse'), 0);
assert.equal(invalidPlacement.ok, false); assert.equal(invalidPlacement.tone, 'error');
assert.equal(invalidPlacement.next.cabin, placeFirst.next.cabin, 'a rejected drop must preserve the cabin');
assert.equal(planPlacement(placeFirst.next, placedLover, 0).changed, false, 'dropping on the source should not replay a success effect');
assert.equal(planPlacement({ ...placeFirst.next, weightCap: 1 }, rider('lover', 'too-heavy'), 1).ok, false);
const oldPassengerRun = { ...placeFirst.next, floor: 2 };
const firstReseat = planPlacement(oldPassengerRun, placedLover, 1);
assert.equal(firstReseat.next.swapped, true);
assert.equal(planPlacement(firstReseat.next, placedLover, 2).ok, false, 'a second old-rider move must be rejected in both drag and tap flows');
const newRider = rider('courier', 'new-arrival', { boardedAt: 2 });
const afterBoarding = planPlacement(firstReseat.next, newRider, 3);
assert.equal(planPlacement(afterBoarding.next, newRider, 4).ok, true, 'new riders still move freely after the old-rider swap was used');
assert.equal(planPlacement(afterBoarding.next, newRider, 1).ok, false, 'a new rider cannot bypass the swap limit by targeting an old rider');
assert.equal(planPlacement({ ...emptyPlacement, status: 'won' }, placedLover, 0).ok, false);
for (const target of [-1, 6, 0.5, NaN]) assert.equal(planPlacement(emptyPlacement, placedLover, target).ok, false);

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

assert.deepEqual([NIGHT_RUSH_MIN, NIGHT_RUSH_MAX], [5, 9]);
assert.equal(nightRushBonus(5, 4), 2);
assert.equal(nightRushBonus(9, 6), 3);
assert.equal(nightRushBonus(4, 6), 0);
assert.equal(nightRushBonus(5, 3), 0);
const rushCabin = [rider('commuter', 'rush-1'), rider('commuter', 'rush-2'), rider('commuter', 'rush-3'), rider('commuter', 'rush-4'), null, null];
const rushRide = resolveFloor({ ...initialRun(), stress: 5, cabin: rushCabin }, () => 0.9);
assert.equal(sourceMap(rushRide.lastEarnings.sources)['午夜热区'], 2, 'four riders in the controlled pressure band should create two rush-tip coins');
const nurseRush = resolveFloor({ ...initialRun(), stress: 10, cabin: [rider('nurse', 'rush-nurse'), ...rushCabin.slice(0, 3), null, null] }, () => 0.9);
assert.equal(nurseRush.stress, 9, 'a nurse should be able to bring the cabin back into the rush zone');
assert.equal(sourceMap(nurseRush.lastEarnings.sources)['午夜热区'], 2);

const ghostDelayState = { ...initialRun(), floor: 2, cabin: [rider('ghost', 'forecast-ghost', { destination: 8 }), rider('commuter', 'forecast-late', { destination: 3, patience: 1 }), null, rider('tourist', 'forecast-decoy', { destination: 8 }), null, null] };
const ghostPressureForecast = stressForecast(ghostDelayState);
assert.deepEqual([ghostPressureForecast.lowDelta, ghostPressureForecast.highDelta], [0, 2], 'the pressure forecast should include a ghost-delayed passenger losing patience');
assert.match(ghostPressureForecast.details, /可能耐心归零/);
const ghostDelayed = resolveFloor(ghostDelayState, () => 0);
assert.equal(ghostDelayed.lastPressure.delta, 2);
assert.ok(ghostDelayed.lastPressure.delta >= ghostPressureForecast.lowDelta && ghostDelayed.lastPressure.delta <= ghostPressureForecast.highDelta);
const ghostEnergyForecast = energyForecast(ghostDelayState);
assert.deepEqual([ghostEnergyForecast.lowDelta, ghostEnergyForecast.highDelta], [-2, -1], 'the energy forecast should show that the ghost may delay an arrival refill');

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

for (const kind of PASSENGER_ORDER) {
  const brief = passengerBrief(rider(kind, `brief-${kind}`, { fareBonus: 4 }), 2);
  assert.equal(brief.coins, PASSENGERS[kind].fare);
  assert.equal(brief.tip, 4, 'upgrade tips are separate because fare multipliers do not apply to them');
  assert.equal(brief.energy, PASSENGERS[kind].energy);
  assert.equal(brief.distance, 6);
  assert.ok(brief.rules.length > 0);
  assert.ok(brief.rules.every((line) => line.endsWith('。')), `${kind} must have complete sentences`);
}
assert.equal(passengerBrief(rider('ghost', 'zero-energy'), 10).energy, 0);
assert.equal(passengerBrief(rider('commuter', 'past-destination'), 10).distance, 0);
assert.match(PASSENGER_RULES.inspector.join(''), /偶数层/);
assert.match(PASSENGER_RULES.bomb.join(''), /到站当层归零则安全/);

const placementMetrics = metricChanges(emptyPlacement, placeFirst.next, '恋人上车');
assert.deepEqual(placementMetrics.map(({ key, delta, tone }) => ({ key, delta, tone })), [{ key: 'weight', delta: 1, tone: 'neutral' }]);
assert.equal(metricSound(placementMetrics[0]), 'load');
assert.deepEqual(metricChanges(placeFirst.next, placeFirst.next, '重复放置'), []);
const removedMetrics = metricChanges(placeFirst.next, emptyPlacement, '恋人下车');
assert.equal(removedMetrics[0].delta, -1);
assert.equal(metricSound(removedMetrics[0]), 'unload');
const pairedMetrics = metricChanges({ ...initialRun(), cabin: [rider('lover', 'lover-a'), rider('lover', 'lover-b'), null, null, null, null] }, lovers, '到站');
assert.equal(pairedMetrics.find((change) => change.key === 'coins')?.delta, 2);
assert.equal(metricSound(pairedMetrics.find((change) => change.key === 'coins')!), 'coin');
assert.equal(metricSound(pairedMetrics.find((change) => change.key === 'energy')!), 'drain');
const pressureUpMetrics = metricChanges(initialRun(), { ...initialRun(), stress: 2 }, '事件');
assert.equal(pressureUpMetrics[0].tone, 'danger');
assert.equal(metricSound(pressureUpMetrics[0]), 'pressure');
const pressureDownMetrics = metricChanges({ ...initialRun(), stress: 2 }, initialRun(), '安抚');
assert.equal(pressureDownMetrics[0].tone, 'gain', 'pressure decrease is relief, not a loss');
assert.equal(metricSound(pressureDownMetrics[0]), 'relief');
const zeroNetBefore = { ...initialRun(), cabin: [rider('courier', 'zero-net', { destination: 2 }), null, null, null, null, null] };
const zeroNetMetrics = metricChanges(zeroNetBefore, resolveFloor(zeroNetBefore, () => .9), '到站');
const balancedEnergy = zeroNetMetrics.find((change) => change.key === 'energy')!;
assert.equal(balancedEnergy.delta, 0);
assert.deepEqual(balancedEnergy.sources.map(({ amount }) => amount), [-2, 2]);
assert.equal(metricSound(balancedEnergy), null, 'net-zero must not play a fake resource gain');
const cappedBefore = { ...initialRun(), energy: 24, cabin: [rider('nurse', 'floor-zero'), rider('mechanic', 'capped-arrival', { destination: 2 }), null, null, null, null] };
const cappedMetrics = metricChanges(cappedBefore, resolveFloor(cappedBefore, () => .9), '到站');
for (const change of cappedMetrics) assert.equal(change.sources.reduce((sum, line) => sum + line.amount, 0), change.delta, 'receipts must reconcile to actual state changes');
assert.ok(cappedMetrics.find((change) => change.key === 'stress')?.sources.some((source) => source.label === '压力下限修正'));
const upgradeMetrics = metricChanges(initialRun(), installUpgrade(initialRun(), 'reinforced'), '升级');
assert.equal(upgradeMetrics.find((change) => change.key === 'weight')?.capDelta, 3);
assert.equal(upgradeMetrics.find((change) => change.key === 'energy')?.delta, 3);
assert.equal(upgradeMetrics.find((change) => change.key === 'energy')?.capDelta, 3);

console.log('Mechanics and presentation verified: all 18 passenger briefs, placement/removal changes, net-zero and capped receipts, pressure direction, metric sound cues, upgrades, and existing game rules.');
