import assert from 'node:assert/strict';
import { agitationThreshold, crowdAgitation, difficultyTier, expressTrip, failureLesson, initialRun, installUpgrade, leaveShop, makeOffers, nextShopFloor, patienceCost, previewUpgrade, readyPartner, resolveFloor, synergyPartnerAtSlot, travelEnergyCost, upgradeChoices, upgradePrice, type ChangeLine, type Rider, type RunState } from '../lib/game-engine';
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
assert.equal(planPlacement({ ...emptyPlacement, status: 'lost' }, placedLover, 0).ok, false);
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


for (let occupied = 0; occupied <= 6; occupied += 1) {
  const cabin = Array.from({ length: 6 }, (_, i) => i < occupied ? rider('commuter', `crowd-${i}`) : null);
  const before = { ...initialRun(), stress: 5, cabin };
  const after = resolveFloor(before, () => .9);
  assert.equal(after.lastPressure.delta, crowdAgitation(occupied));
}
assert.equal(agitationThreshold(15), 10);
assert.equal(agitationThreshold(18), 12);
assert.equal(patienceCost({ ...initialRun(), stress: 9 }), 1);
assert.equal(patienceCost({ ...initialRun(), stress: 10 }), 2);
const anxious = resolveFloor({ ...initialRun(), stress: 10, cabin: [rider('commuter', 'anxious', { patience: 5 }), null, null, null, null, null] }, () => .9);
assert.equal(anxious.cabin[0]?.patience, 3, 'patience cost uses agitation at departure, before same-floor relief');

const packed = Array.from({ length: 6 }, (_, i) => rider('commuter', `packed-${i}`));
const crowdedLoss = resolveFloor({ ...initialRun(), stress: 14, cabin: packed }, () => .9);
assert.equal(crowdedLoss.status, 'lost');
assert.match(failureLesson(crowdedLoss), /躁动/);
const allArrive = resolveFloor({ ...initialRun(), stress: 5, cabin: packed.map((p) => ({ ...p, destination: 2 })) }, () => .9);
assert.equal(allArrive.stress, 1, 'six arrivals relieve six, after full-cabin agitation of two');
assert.equal(sourceMap(allArrive.lastPressure.sources)['乘客到站舒缓'], -6);
assert.equal(allArrive.earned, 42);
assert.equal(allArrive.coins, 42);
assert.equal(allArrive.cabin.filter(Boolean).length, 0);
const impatient = resolveFloor({ ...initialRun(), cabin: [rider('commuter', 'late', { patience: 1 }), null, null, null, null, null] }, () => .9);
assert.equal(impatient.stress, 1, 'wide-cabin relief offsets one of the two agitation points');
assert.equal(sourceMap(impatient.lastPressure.sources)['耐心归零'], 2);
assert.equal(impatient.coins, 0);
assert.equal(impatient.lastEnergy.sources.some((s) => s.label.includes('到站')), false);
const musical = resolveFloor({ ...initialRun(), stress: 4, cabin: [rider('musician', 'music'), ...packed.slice(0, 3), null, null] }, () => .9);
assert.equal(musical.lastPressure.delta, 0, 'musician offsets four-person crowding');
const controlled = resolveFloor({ ...initialRun(), cabin: [rider('thief', 'thief'), rider('cop', 'cop'), null, null, null, null] }, () => .9);
assert.equal(sourceMap(controlled.lastEarnings.sources)['受控小偷'], 1);
assert.equal(controlled.lastPressure.sources.some((s) => s.label === '小偷未受控'), false);

assert.equal(difficultyTier(30), 0); assert.equal(difficultyTier(31), 1);
assert.deepEqual([travelEnergyCost(2), travelEnergyCost(31), travelEnergyCost(61), travelEnergyCost(301)], [2, 3, 4, 12]);
for (const floor of [59, 60, 99, 999]) {
  const offers = makeOffers(floor, initialRun().upgrades, false, () => .5);
  assert.ok(offers.every((p) => p.destination > floor), 'destinations never clamp to a final floor');
}
const atSixty = resolveFloor({ ...initialRun(), floor: 59, energy: 20 }, () => .5);
assert.equal(atSixty.floor, 60); assert.equal(atSixty.status, 'upgrade');
assert.equal(atSixty.shop.length, 3);
const beyondSixty = resolveFloor(leaveShop(atSixty), () => .5);
assert.equal(beyondSixty.floor, 61); assert.equal(beyondSixty.status, 'playing');
const thousand = resolveFloor({ ...initialRun(), floor: 999, energy: 100, energyCap: 100 }, () => .5);
assert.equal(thousand.floor, 1000); assert.equal(thousand.status, 'upgrade');
assert.equal(nextShopFloor(60), 70);
assert.equal(resolveFloor(atSixty), atSixty, 'the shop cannot advance while open');
assert.equal(resolveFloor(crowdedLoss), crowdedLoss, 'lost games cannot continue');

const shop: RunState = { ...initialRun(), floor: 10, status: 'upgrade', energy: 10, stress: 8, coins: 70, earned: 70, shop: [
  { key: 'battery', price: 35, purchased: false }, { key: 'calm', price: 35, purchased: false }, { key: 'solar', price: 55, purchased: false },
] };
assert.equal(installUpgrade(initialRun(), 'battery').upgrades.battery, 0, 'no free upgrade outside the shop');
const preview = previewUpgrade(shop, 'battery');
assert.equal(preview.coins, 70); assert.equal(shop.energy, 10, 'preview does not mutate actual state');
const boughtBattery = installUpgrade(shop, 'battery');
assert.equal(boughtBattery.coins, 35); assert.equal(boughtBattery.earned, 70);
assert.equal(boughtBattery.energy, 18); assert.equal(boughtBattery.energyCap, 29);
assert.equal(boughtBattery.status, 'upgrade', 'buying one card keeps other purchases available');
assert.equal(installUpgrade(boughtBattery, 'battery'), boughtBattery, 'double click must not double-charge');
assert.equal(installUpgrade(boughtBattery, 'solar'), boughtBattery, 'insufficient money must change nothing');
assert.equal(installUpgrade(boughtBattery, 'concierge'), boughtBattery, 'only offered cards may be purchased');
const boughtBoth = installUpgrade(boughtBattery, 'calm');
assert.equal(boughtBoth.coins, 0); assert.equal(boughtBoth.stress, 2); assert.equal(boughtBoth.stressCap, 18);
assert.equal(boughtBoth.shop.filter((card) => card.purchased).length, 2);
const left = leaveShop(boughtBoth); assert.equal(left.status, 'playing'); assert.deepEqual(left.shop, []);
assert.equal(installUpgrade(left, 'calm'), left, 'leaving cannot reopen/rebuy');
assert.equal(leaveShop({ ...shop, coins: 0 }).status, 'playing', 'healthy players can leave without a purchase');
assert.equal(leaveShop({ ...shop, coins: 0, energy: 0 }).status, 'lost', 'no unearned crisis rescue');
const crisis = resolveFloor({ ...initialRun(), floor: 9, energy: 1, coins: 100, earned: 100 }, () => .5);
assert.equal(crisis.status, 'upgrade');
const rescue = crisis.shop.find((card) => card.key === 'battery' || card.key === 'reinforced')!;
assert.ok(rescue);
assert.equal(leaveShop(installUpgrade(crisis, rescue.key)).status, 'playing');
const doubleCrisis = resolveFloor({ ...initialRun(), floor: 9, energy: 1, stress: 14, coins: 200, earned: 200, cabin: packed.map((p) => ({ ...p, destination: 16, patience: 20 })) }, () => .5);
assert.equal(doubleCrisis.status, 'upgrade', 'a paid multi-card shop can rescue both issues when affordable');
assert.ok(doubleCrisis.shop.some((c) => c.key === 'battery') && doubleCrisis.shop.some((c) => c.key === 'calm'));
assert.equal(leaveShop(doubleCrisis).status, 'lost');
assert.equal(leaveShop(installUpgrade(installUpgrade(doubleCrisis, 'battery'), 'calm')).status, 'playing');
assert.ok(upgradePrice('battery', 70, 2) > upgradePrice('battery', 10, 0));
assert.ok(upgradePrice('calm', 20, 1) > upgradePrice('calm', 20, 0));
assert.ok(!upgradeChoices({ ...initialRun().upgrades, express: 1 }, () => .5).includes('express'));
assert.equal(expressTrip(4, 1), 4); assert.equal(expressTrip(5, 1), 4);

const lovers = resolveFloor({ ...initialRun(), cabin: [rider('lover', 'lover-a'), rider('lover', 'lover-b'), null, null, null, null] }, () => .9);
assert.equal(lovers.lastEarnings.total, 2);
assert.equal(lovers.earned, 2);
const solo = resolveFloor({ ...initialRun(), cabin: [rider('lover', 'solo'), null, null, null, null, null] }, () => .9);
assert.equal(solo.cabin[0]?.patience, 9);
assert.equal(makeOffers(2, solo.upgrades, false, () => .1, solo.cabin)[0].calledByLover, true);
const bombLoss = resolveFloor({ ...initialRun(), cabin: [rider('bomb', 'bomb', { fuse: 1 }), null, null, null, null, null] }, () => .9);
assert.equal(bombLoss.status, 'lost'); assert.match(failureLesson(bombLoss), /引信/);
const safeBomb = resolveFloor({ ...initialRun(), cabin: [rider('bomb', 'safe-bomb', { fuse: 1, destination: 2 }), null, null, null, null, null] }, () => .9);
assert.equal(safeBomb.status, 'playing'); assert.equal(safeBomb.coins, 26);

for (const kind of PASSENGER_ORDER) {
  const brief = passengerBrief(rider(kind, `brief-${kind}`, { fareBonus: 4 }), 2);
  assert.equal(brief.coins, PASSENGERS[kind].fare); assert.equal(brief.tip, 4);
  assert.equal(brief.energy, PASSENGERS[kind].energy); assert.equal(brief.distance, 6);
  assert.ok(brief.rules.length > 0 && brief.rules.every((line) => line.endsWith('。')));
}
assert.match(PASSENGER_RULES.inspector.join(''), /偶数层/);
assert.equal(passengerBrief(rider('commuter', 'countdown'), 7).distance, 1);
assert.equal(passengerBrief(rider('commuter', 'countdown'), 8).distance, 0);
const placementMetrics = metricChanges(emptyPlacement, placeFirst.next, '恋人上车');
assert.equal(metricSound(placementMetrics[0]), 'load');
assert.equal(metricSound(metricChanges(placeFirst.next, emptyPlacement, '下车')[0]), 'unload');
assert.deepEqual(metricChanges(emptyPlacement, emptyPlacement, '未变'), []);
assert.equal(metricSound(metricChanges(initialRun(), { ...initialRun(), stress: 2 }, '事件')[0]), 'pressure');
assert.equal(metricSound(metricChanges({ ...initialRun(), stress: 2 }, initialRun(), '安抚')[0]), 'relief');
const purchaseMetrics = metricChanges(shop, boughtBattery, '购买增容电池');
assert.equal(purchaseMetrics.find((c) => c.key === 'coins')?.delta, -35);
assert.equal(metricSound(purchaseMetrics.find((c) => c.key === 'coins')!), 'drain');
const zeroBefore = { ...initialRun(), cabin: [rider('courier', 'zero', { destination: 2 }), null, null, null, null, null] };
const zeroMetrics = metricChanges(zeroBefore, resolveFloor(zeroBefore, () => .9), '到站');
assert.equal(zeroMetrics.find((c) => c.key === 'energy')?.delta, 0);
assert.equal(zeroMetrics.find((c) => c.key === 'energy')?.sources.length, 2);
assert.equal(metricSound(zeroMetrics.find((c) => c.key === 'energy')!), null);

let seed = 47081;
const rng = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
for (let i = 0; i < 2000; i += 1) {
  const floor = 1 + Math.floor(rng() * 180);
  const before: RunState = { ...initialRun(), floor, energy: 5 + Math.floor(rng() * 20), stress: Math.floor(rng() * 15), cabin: Array.from({ length: 6 }, (_, slot) => {
    if (rng() < .25) return null;
    const kind = PASSENGER_ORDER[Math.floor(rng() * PASSENGER_ORDER.length)];
    return rider(kind, `random-${i}-${slot}`, { destination: floor + 1 + Math.floor(rng() * 8), patience: 1 + Math.floor(rng() * 12), fuse: 1 + Math.floor(rng() * 6) });
  }) };
  const pressure = stressForecast(before); const energy = energyForecast(before); const after = resolveFloor(before, rng);
  assert.ok(after.lastPressure.delta >= pressure.lowDelta && after.lastPressure.delta <= pressure.highDelta, `pressure forecast ${i}`);
  assert.ok(after.lastEnergy.delta >= energy.lowDelta && after.lastEnergy.delta <= energy.highDelta, `energy forecast ${i}`);
  assert.equal(after.earned - before.earned, after.coins - before.coins);
  for (const change of metricChanges(before, after, '到站')) assert.equal(change.sources.reduce((sum, line) => sum + line.amount, 0), change.delta);
}
assert.equal(new Set(Object.values(UPGRADES).map((upgrade) => upgrade.strategy)).size, 6);
console.log('Verified: endless 60/1000-floor transitions; crowding, fatigue and high-agitation patience; paid multi-card shops; no overdraft/double purchase; 2,000 randomized forecast/receipt checks; passenger and placement regressions.');
