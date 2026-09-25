// v9 rule checks: legends and keepsakes, power box, emergency charging, free and paid
// abilities, agitation bands, crowding and incidents, reworked abilities and roles.
import assert from 'node:assert/strict';
import * as E from '../lib/game-engine';
import { DARK_LEGEND_KINDS, LEGEND_KINDS, PASSENGERS, isDark, isDarkLegend, isLegend, type PassengerKind } from '../lib/game-data';
import { DARK_LEGEND_RULES as DLR } from '../lib/legends';
import { conflictLinks } from '../lib/rider-profile';
import { motorCost, AGITATION_HIGH_MIN, ECONOMY_RULES } from '../lib/balance-v832';
import { BOX_PRICES, chargeCost, storageCap } from '../lib/power-box';
import { riderProfile } from '../lib/rider-profile';
import type { Rider, RunState } from '../lib/game-engine';
import { translateGameText } from '../lib/i18n';
import { sectorForecast } from '../lib/game-forecast';
import { motorAdvanceNotice, motorScheduleText, nightUnrest } from '../lib/balance-v832';
import { calmRescuePlan, departureRisk, rescuePlan, sectorNeed } from '../lib/departure-guard';
import { stressForecast, energyForecast, abyssLossChance, shopAgitationRoom } from '../lib/game-forecast';
import { boardNet, netValue, pairedNet } from '../lib/net-value';
import { fuseState } from '../lib/bomb-state';
import { drawLegend } from '../lib/legend-unlocks';
import { addDiscoveredPassengers, sanitizeDiscoveredPassengers } from '../lib/passenger-discovery';
import { QUIPS, quip } from '../lib/quips';
import { playSfx, SAMPLES } from '../lib/game-sfx';
import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { OFFER_PARTNERS } from '../lib/shift-rules';
import { districtFor } from '../lib/districts';
import { planPlacement } from '../lib/game-interaction';
import { cardSummary, displayName } from '../lib/card-summary';
import { DARK_RESONANCE, DARK_RULES as DARK, ITEMS as ITEMS_V, MYSTERY_CLUES, MYSTERY_IDENTITIES, abyssStep, itemPrice, mysteryClue, outburstChance } from '../lib/dark-rules';

// Most checks here predate the v9.18 real-time Bomber timer and verify floor timers; the real-time block switches it on.
E.BOMB_RULES.realtime = false;
const seq = (...values: number[]) => { let i = 0; return () => values[i++ % values.length]; };
const fixed = (v = 0.5) => () => v;
let n = 0;
const rider = (kind: PassengerKind, floor: number, trip: number, extra: Partial<Rider> = {}): Rider => ({ id: `${kind}-${n++}`, kind, destination: floor + trip, patience: 0, boardedAt: floor - 1, fareBonus: 0, stash: 0, volatile: false, ...extra });
const run = (floor: number, seats: Array<Rider | null>, extra: Partial<RunState> = {}): RunState => ({ ...E.initialRun(), floor, energy: 60, coins: 200, cabin: [...seats, ...Array(6 - seats.length).fill(null)], ...extra });
const lines = (s: RunState, kind: 'lastPressure' | 'lastEarnings' | 'lastEnergy') => Object.fromEntries(s[kind].sources.map(l => [l.label, l.amount]));

// Unlocks: all 21 riders reachable, legends never in the ordinary pool.
assert.ok(E.unlockedAt(16).includes('lawyer') && !E.unlockedAt(15).includes('lawyer'));
assert.ok(E.unlockedAt(21).includes('inspector') && !E.unlockedAt(20).includes('inspector'));
assert.ok(E.unlockedAt(41).includes('shifter') && !E.unlockedAt(40).includes('shifter'));
assert.equal(new Set(E.unlockedAt(41)).size, 21);
assert.ok(!E.unlockedAt(999).some(isLegend));
console.log('PASS 21 riders unlock by floor 41; legends stay out of the ordinary pool');

// Opening: a fourth legend card outside the tutorial, none inside it.
const opening = E.startRun(false, seq(0.1, 0.3, 0.5, 0.7, 0.9));
assert.equal(opening.offers.filter(r => r.kind !== 'parcel').length, 4);
assert.equal(opening.offers.filter(r => isLegend(r.kind)).length, 1);
assert.ok(opening.state.legendOffer && isLegend(opening.state.legendOffer));
const tutorial = E.startRun(true, fixed());
assert.equal(tutorial.offers.length, 3);
assert.ok(!tutorial.offers.some(r => isLegend(r.kind)) && !tutorial.state.legendOffer);
assert.ok(E.nextOfferBatch({ ...opening.state, floor: 2 }, fixed()).offers.every(r => !isLegend(r.kind)));
console.log('PASS one legend waits as a fourth card on floor 1 only, never in the tutorial');

// Declining pays a shift allowance; boarding does not.
{
  const legend = opening.offers.find(r => isLegend(r.kind))!;
  const plain = opening.offers.find(r => !isLegend(r.kind))!;
  const declined = E.resolveFloor({ ...opening.state, cabin: [plain, null, null, null, null, null] }, fixed());
  assert.equal(lines(declined, 'lastEarnings')['谢绝传奇：当班补贴'], 10);
  assert.equal(declined.legendStatus, 'declined');
  const boarded = E.resolveFloor({ ...opening.state, cabin: [legend, plain, null, null, null, null] }, fixed());
  assert.equal(lines(boarded, 'lastEarnings')['谢绝传奇：当班补贴'], undefined);
  assert.equal(boarded.legendStatus, 'boarded');
  assert.equal(riderProfile(legend, [legend]).energy, 0);
}
console.log('PASS declining a legend pays 10; boarding does not; legends use no power');

// Delivery at the first shop grants the keepsake.
{
  const operator = { ...E.legendRider('operator', fixed()), destination: 10, boardedAt: 1 };
  const s = E.resolveFloor(run(9, [operator, rider('commuter', 9, 3)], { legendStatus: 'boarded' }), fixed());
  assert.equal(s.status, 'upgrade');
  assert.deepEqual(s.keepsakes, ['wrench']);
  assert.equal(s.freeBoxLevels, 1);
  assert.equal(s.legendStatus, 'delivered');
  const free = E.buyBoxLevel(s, 'motor');
  assert.equal(free.coins, s.coins);
  assert.equal(free.box?.motor, 1);
  const paid = E.buyBoxLevel(free, 'storage');
  assert.equal(s.coins - paid.coins, BOX_PRICES[0] - 5, 'wrench discount applies after the free level');
  const matron = { ...E.legendRider('matron', fixed()), destination: 10, boardedAt: 1 };
  const m = E.resolveFloor(run(9, [matron, rider('commuter', 9, 3)], { stress: 7 }), fixed());
  assert.equal(m.stressCap, E.initialRun().stressCap + 2);
  assert.equal(lines(m, 'lastPressure')['查房记录：进店舒缓'], -3);
}
console.log('PASS keepsakes on delivery: wrench (free level, then −5), rounds log (+2 cap, −3 at shops)');

// Power box: shop-only, one level per shop, five per run, prices and effects.
{
  const shop = run(10, [], { status: 'upgrade', coins: 500, energy: 10 });
  const outside = { ...shop, status: 'playing' as const };
  assert.equal(E.buyBoxLevel(outside, 'storage'), outside, 'not outside a shop');
  const a = E.buyBoxLevel(shop, 'storage');
  assert.equal(shop.coins - a.coins, 15);
  assert.equal(a.energyCap, storageCap(a.box!));
  assert.equal(a.energyCap, 75);
  assert.equal(E.buyBoxLevel(a, 'motor'), a, 'one level per shop');
  let s = a; let floor = 10;
  for (const line of ['storage', 'storage', 'transformer', 'transformer', 'motor'] as const) { floor += floor === 50 ? 30 : 10; s = E.buyBoxLevel({ ...s, floor, status: 'upgrade' }, line); }
  // v9.19 ladder: five levels until 80F, then one more every 30 floors, each at three times the price of the last.
  assert.equal(Object.values(s.box!).reduce((x, y) => x + y, 0), 6, 'five levels before 80F, a sixth at 80F');
  assert.equal(E.boxTotalCap(79), 5); assert.equal(E.boxTotalCap(80), 6); assert.equal(E.boxTotalCap(110), 7);
  const five = { ...shop, floor: 70, box: { storage: 2, transformer: 2, motor: 1 } };
  assert.equal(E.buyBoxLevel(five, 'motor'), five, 'no sixth level before 80F');
  assert.equal(E.boxLevelPrice({ ...five, floor: 80 }, 'motor'), BOX_PRICES[1] * E.BOX_LADDER.priceStep, 'the sixth level costs three times as much');
  assert.equal(chargeCost({ storage: 0, transformer: 2, motor: 0 }, 10), 15);
  // v9.7 motor: level 1 saves 1 every third floor, level 2 on even floors, never below 1; level 3 quiets unrest.
  assert.equal(E.effectiveMotor({ floor: 23, box: { storage: 0, transformer: 0, motor: 1 } }), motorCost(24) - 1);
  assert.equal(E.effectiveMotor({ floor: 21, box: { storage: 0, transformer: 0, motor: 1 } }), motorCost(22));
  assert.equal(E.effectiveMotor({ floor: 45, box: { storage: 0, transformer: 0, motor: 2 } }), 1);
  assert.equal(E.effectiveMotor({ floor: 44, box: { storage: 0, transformer: 0, motor: 2 } }), 2);
  assert.equal(E.effectiveMotor({ floor: 3, box: { storage: 0, transformer: 0, motor: 2 } }), 1, 'never below 1');
}
console.log('PASS power box: shop only, one per shop, five per run, capacity/price/motor effects');

// Emergency charging: 4 coins, 20 per sector, resets next sector, never in shops.
{
  const s = run(12, [rider('commuter', 12, 3)], { energy: 5, coins: 200 });
  const a = E.emergencyCharge(s, 20);
  assert.equal(a.energy, 25); assert.equal(s.coins - a.coins, 80);
  assert.equal(E.emergencyCharge(a, 1), a, 'sector cap');
  const next = E.emergencyCharge({ ...a, floor: 21 }, 1);
  assert.equal(next.energy, a.energy + 1, 'new sector resets the allowance');
  assert.equal(E.emergencyCharge({ ...s, status: 'upgrade' }, 1).energy, s.energy);
}
console.log('PASS emergency charging price, sector cap and reset');

// Abilities: the first pick is free, a second costs 40, a third is impossible.
{
  const s = run(10, [], { status: 'upgrade', coins: 100, shop: [{ key: 'relay', price: 0, purchased: false }, { key: 'tipjar', price: 0, purchased: false }, { key: 'meter', price: 0, purchased: false }] });
  const a = E.installUpgrade(s, 'relay');
  assert.equal(a.coins, 100); assert.equal(a.upgrades.relay, 1);
  const b = E.installUpgrade(a, 'tipjar');
  assert.equal(b.coins, 60); assert.equal(b.upgrades.tipjar, 1);
  assert.equal(E.installUpgrade(b, 'meter'), b);
  assert.ok(!E.drawUpgradeOffer({ ...E.EMPTY_UPGRADES }, [], fixed(0.3), 60).keys.some(k => E.RETIRED_UPGRADES.includes(k)));
}
console.log('PASS free first ability, 40-coin second, retired abilities never offered');

// Agitation bands: low and medium tips, high-band incidents, crowding at six riders.
{
  const low = E.resolveFloor(run(20, [rider('commuter', 20, 1)], { stress: 1 }), fixed());
  assert.equal(lines(low, 'lastEarnings')['安静好评'], 1);
  const mid = E.resolveFloor(run(20, [rider('commuter', 20, 1)], { stress: 3 }), fixed());
  assert.equal(lines(mid, 'lastEarnings')['热闹小费'], 1);
  const six = E.resolveFloor(run(20, Array.from({ length: 6 }, () => rider('commuter', 20, 4))), fixed());
  // v9.20.2: a full cabin costs power (fans), not agitation.
  assert.equal(lines(six, 'lastPressure')['车厢拥挤'], undefined); assert.equal(lines(six, 'lastEnergy')['车厢挤满：风扇耗电'], -1);
  const five = E.resolveFloor(run(20, Array.from({ length: 5 }, () => rider('commuter', 20, 4))), fixed());
  assert.equal(lines(five, 'lastEnergy')['车厢挤满：风扇耗电'], undefined);
  const high = run(20, [rider('commuter', 20, 4), rider('courier', 20, 4)], { stress: AGITATION_HIGH_MIN });
  const hit = E.resolveFloor(high, fixed(0.1));
  assert.equal(hit.cabin.filter(Boolean).length, 1, 'incident removes one rider without pay');
  assert.equal(E.resolveFloor(high, fixed(0.9)).cabin.filter(Boolean).length, 2);
}
console.log('PASS band tips, crowding at six, 20% high-band incident');

// Reworked abilities.
{
  const calm = E.previewUpgrade({ ...run(10, []), status: 'upgrade', stress: 6 }, 'calm');
  assert.equal(calm.stressCap, E.initialRun().stressCap + 2);
  assert.equal(E.applyCalmCharge({ ...calm, status: 'playing' }).stress, 3);
  const used = { ...calm, status: 'playing' as const, calmCharge: false, cabin: [rider('commuter', 19, 3), null, null, null, null, null] };
  assert.equal(E.resolveFloor({ ...used, floor: 19 }, fixed()).calmCharge, true, 'recharged at the next shop');
  const thieves = [rider('thief', 20, 4), rider('thief', 20, 4)];
  const noisy = E.resolveFloor(run(20, thieves), fixed());
  const quiet = E.resolveFloor(run(20, thieves, { upgrades: { ...E.EMPTY_UPGRADES, soundproof: 1 } }), fixed());
  assert.ok((lines(noisy, 'lastPressure')['坏人链接躁动'] ?? 0) > 0);
  assert.ok(quiet.stress < noisy.stress, 'soundproof cancels criminal-link agitation');
  const red = run(20, [rider('courier', 20, 4), rider('ghost', 20, 4)]);
  assert.ok(E.energyBreakdown(red).conflict > 0);
  const insulated = { ...red, upgrades: { ...E.EMPTY_UPGRADES, insulation: 1 } };
  assert.equal(E.energyBreakdown(insulated).conflictProtection, E.energyBreakdown(insulated).conflict);
  const stab = run(20, Array.from({ length: 5 }, () => rider('commuter', 20, 9)), { upgrades: { ...E.EMPTY_UPGRADES, reinforced: 1 } });
  let s = stab, saved = 0;
  for (let i = 0; i < 7; i++) { saved += E.stabilizedEnergy(s); s = E.resolveFloor({ ...s, stress: 0 }, fixed()); }
  assert.equal(saved, 5, 'stabilizer capped at five per sector');
  const dispatch = run(20, [], { upgrades: { ...E.EMPTY_UPGRADES, dispatch: 1 } });
  const r1 = { ...rider('tourist', 20, 5), boardedAt: 20 }, r2 = { ...rider('tourist', 20, 5), boardedAt: 20 }, r3 = { ...rider('tourist', 20, 5), boardedAt: 20 };
  let d = { ...dispatch, cabin: [r1, r2, r3, null, null, null] };
  d = E.retimeRider(d, r1.id, -1); d = E.retimeRider(d, r2.id, -1);
  assert.equal(E.retimeRider(d, r3.id, -1), d, 'two dispatch uses per sector');
}
console.log('PASS safety margin, soundproof, insulation, stabilizer cap, dispatch uses');

// Roles and motor schedule.
{
  const top = rider('bomb', 20, 3), mimic = rider('mimic', 20, 3);
  assert.equal(riderProfile(mimic, [top, null, null, mimic, null, null], 3).fare, PASSENGERS.bomb.fare, 'mimic copies the fare above');
  assert.equal(riderProfile(mimic, [null, null, null, mimic, null, null], 3).fare, PASSENGERS.mimic.fare);
  const schedule = [1, 10, 11, 30, 31, 41, 46, 53, 88, 200].map(motorCost);
  assert.deepEqual(schedule, [1, 1, 2, 2, 2, 2, 2, 3, 7, 21], "v9.18: motor 1 on 1–10, 2 to 50F, then +1 every 8 floors from 51F");
  assert.equal(E.availableKinds(1, [E.legendRider('medium', fixed())]).filter(k => k === 'ghost').length, 2, 'medium doubles ghost weight early');
  assert.equal(LEGEND_KINDS.length, 8);
}
console.log('PASS mimic fare copy, motor schedule, medium ghost draw');
// Sector projection matches settlement when nobody boards: riders ride out, then one minimum rider.
{
  let s = run(12, [rider('commuter', 12, 3), rider('commuter', 12, 5)], { energy: 40 });
  const projected = sectorForecast(s);
  for (let f = 12; f < 20; f++) {
    if (!s.cabin.some(Boolean)) s = { ...s, cabin: [rider('commuter', f, 99), null, null, null, null, null] };
    s = E.resolveFloor({ ...s, stress: 0 }, fixed());
  }
  assert.equal(projected.shop, 20);
  assert.equal(s.energy, projected.projected, 'projection equals simulated settlement');
  assert.equal(sectorForecast(run(12, [rider('commuter', 12, 8)], { energy: 10 })).failFloor, 16, 'v9.6: 3 per floor (motor 2 + rider 1)');
}
console.log('PASS sector power forecast equals settlement with no new boarding');
// Daily shift: seeded streams reproduce the opening and the shop draw regardless of seating.
{
  const { stream, dailySeed } = await import('../lib/seeded');
  const seed = dailySeed('2026-09-22');
  const a = E.startRun(false, stream(seed, 'offers', 1)), b = E.startRun(false, stream(seed, 'offers', 1));
  assert.deepEqual(a.offers.map(r => [r.kind, r.destination]), b.offers.map(r => [r.kind, r.destination]));
  const pre = run(9, [rider('commuter', 9, 1), rider('tourist', 9, 3)]);
  const x = E.resolveFloor(pre, stream(seed, 'resolve', 9), {}, stream(seed, 'shop-draw', 10));
  const y = E.resolveFloor({ ...pre, cabin: [rider('courier', 9, 1), null, rider('thief', 9, 1), rider('ghost', 9, 4), null, null] }, stream(seed, 'resolve', 9), {}, stream(seed, 'shop-draw', 10));
  assert.deepEqual(x.shop.map(c => c.key), y.shop.map(c => c.key), 'same shop cards for different cabins');
}
console.log('PASS daily shift streams reproduce openings and shop draws');
// Generated motor texts translate by pattern, whatever the numbers.
assert.equal(translateGameText(motorAdvanceNotice(1), 'en'), 'Ahead: motor 2 from floor 11');
assert.equal(translateGameText(motorAdvanceNotice(20), 'en'), 'Ahead: motor 3 from floor 51');
assert.ok(!/[\u3400-\u9fff]/u.test(translateGameText(motorScheduleText(), 'en')), translateGameText(motorScheduleText(), 'en'));
console.log('PASS generated motor notice and schedule translate');
// v9.0.2 ascend guard: the playtest death at 14F (8 power, 9 needed, 87 coins) must be caught and rescuable.
{
  const lovers = [rider('lover', 14, 3), rider('lover', 14, 2), rider('tourist', 14, 3), rider('nurse', 14, 7), rider('drunk', 14, 5), rider('lover', 14, 3)];
  const s = run(14, lovers, { energy: 8, coins: 87 });
  const risk = departureRisk(s);
  assert.ok(risk.fatal, 'a worst-case power loss must arm the guard');
  assert.ok(risk.need >= 1 && risk.affordable >= risk.need, `rescue must be offered and affordable: ${JSON.stringify(risk)}`);
  assert.equal(departureRisk(E.emergencyCharge(s, risk.need)).fatal, false, 'charging the offered amount clears the guard');
  assert.equal(departureRisk({ ...s, energy: 40 }).fatal, false, 'a safe floor never asks twice');
  const ui = readFileSync(new URL('../components/elevator-game.tsx', import.meta.url), 'utf8');
  assert.ok(/if \(\(risk\.fatal \|\| stressFatal( \|\| gamble)?( \|\| strandedCourier)?\) && !departArmed\)/.test(ui), 'the ascend handler must stop a fatal floor (or an abyss gamble) until confirmed');
  const need = sectorNeed({ ...s, floor: 10, status: 'upgrade' });
  assert.deepEqual([need.from, need.to, need.riders], [11, 20, 40]);
  assert.equal(need.motor, Array.from({ length: 10 }, (_, i) => motorCost(11 + i)).reduce((a, b) => a + b, 0));
}
console.log('PASS ascend guard catches fatal floors and the shop shows next-sector need');
// v9.0.2 lover frequency: Lovers bring varied partners, call at 15%, and are no longer a district theme.
assert.deepEqual(OFFER_PARTNERS.lover, ['lover', 'tourist', 'child']);
assert.equal(E.LOVER_CALL_CHANCE, .15);
assert.ok(!districtFor(15).themed.includes('lover'));
{
  let lovers = 0, total = 0; const r = (() => { let x = 7; return () => (x = (x * 16807) % 2147483647) / 2147483647; })();
  for (let i = 0; i < 6000; i++) for (const o of E.makeOffers(11 + i % 10, E.initialRun().upgrades, false, r)) { total++; if (o.kind === 'lover') lovers++; }
  assert.ok(lovers / total < .13, `lover share 11-20F ${(lovers / total * 100).toFixed(1)}%`);
}
console.log('PASS lover share stays below 13% on 11-20F without a waiting Lover');
// v9.0.3 Insulation pays 1 coin per red link per floor, capped at 3, and still removes red-link coin loss.
{
  const cab = [rider('commuter', 12, 5), rider('celebrity', 12, 5)];
  const plain = E.resolveFloor(run(12, cab), fixed(0.99));
  const insulated = E.resolveFloor(run(12, cab, { upgrades: { ...E.initialRun().upgrades, insulation: 1 } }), fixed(0.99));
  assert.equal(lines(insulated, 'lastEarnings')['绝缘衬层：冲突小费'], 1);
  assert.equal(lines(insulated, 'lastEarnings')['红线金币损失'], undefined);
  assert.ok(lines(plain, 'lastEarnings')['红线金币损失'] < 0);
  assert.equal(E.INSULATION_RULES.cap, 3);
}
console.log('PASS insulation friction tip');
// v9.2.1 the intro must not open before storage is read: opening then closing a frame later froze it for returning players.
{
  const ui = readFileSync(new URL('../components/elevator-game.tsx', import.meta.url), 'utf8');
  assert.ok(ui.includes('useState<boolean | null>(null)') && ui.includes('setIntroState(current => current ?? !seen)'), 'intro starts unknown and opens only for unseen players');
}
console.log('PASS intro opens only after storage is read');
// v9.3.1 rescue plans: the 9.3 playtest's floor 28 had no way out, so the guard must say so instead of suggesting dismissals.
{
  const doomed = run(28, [null, null, rider('child', 21, 9, { boardedAt: 20 }), null, null, rider('lover', 27, 3, { boardedAt: 26 })], { energy: 1, coins: 12, emergencySector: 2, emergencyUsed: 10 }); // v9.6: 12 coins (the 9.3 run's 16 now survives at motor 2)
  const risk = departureRisk(doomed);
  assert.ok(risk.fatal && risk.need > risk.affordable, JSON.stringify(risk));
  assert.equal(rescuePlan(doomed), null, 'no dismissal and charge combination survives floor 28');
  const saveable = run(24, [rider('commuter', 24, 3, { boardedAt: 22 }), rider('tourist', 24, 3, { boardedAt: 22 }), rider('commuter', 24, 4, { boardedAt: 24 })], { energy: 3, coins: 8, emergencySector: 2, emergencyUsed: 0 });
  const plan = rescuePlan(saveable);
  assert.ok(plan && plan.remove.length === 1 && plan.remove[0].paid === 0 && plan.charge > 0, `withdraw the new rider, then charge: ${JSON.stringify(plan)}`);
}
console.log('PASS rescue plans are real or the floor is declared lost');
// v9.4 card net value: fare − trip power × charge price (+ courier refund) − trip agitation × 3; legends show none.
{
  const s = run(25, []); // past the v9.19 early charge discount
  assert.equal(netValue(rider('commuter', 25, 3, { boardedAt: 25 }), s), 0);
  assert.equal(netValue(rider('courier', 25, 1, { boardedAt: 25 }), s), 10);
  // v9.16: a Courier carrying a parcel is valued as the pair; a parcel alone as its unclaimed contents.
  assert.equal(netValue(rider('courier', 25, 1, { boardedAt: 25, parcelId: 'p' }), s), 8 - 2 - 2 + 4);
  assert.equal(netValue(rider('parcel', 25, 1, { boardedAt: 25, ownerId: 'c' }), s), (6 + 3 * 2) / 2 - 2);
  assert.equal(netValue(rider('thief', 25, 2, { boardedAt: 25 }), s), 5 - 4 - 6);
  assert.equal(netValue(rider('operator', 25, 9, { boardedAt: 25 }), s), null);
  // v9.19: until 20F power is 15% cheaper, so the same Commuter nets a little more.
  assert.ok(netValue(rider('commuter', 15, 3, { boardedAt: 15 }), run(15, []))! > netValue(rider('commuter', 25, 3, { boardedAt: 25 }), s)!);
}
console.log('PASS card net value');
// v9.5 legend shuffle bag: each unlocked legend once per cycle, never the same twice in a row.
{
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Pick<Storage, 'getItem' | 'setItem'> }).localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => { store.set(k, v); } };
  const pool = ['operator', 'matchmaker', 'matron', 'tycoon'] as const;
  const draws = Array.from({ length: 40 }, () => drawLegend([...pool])[0]);
  for (let i = 0; i < 40; i += 4) assert.equal(new Set(draws.slice(i, i + 4)).size, 4, `cycle ${i / 4} repeats: ${draws.slice(i, i + 4).join(",")}`);
  for (let i = 1; i < 40; i++) assert.notEqual(draws[i], draws[i - 1], `back-to-back ${draws[i]}`);
  assert.deepEqual(drawLegend([]), []);
}
console.log('PASS legend shuffle bag');
// v9.6 option A: flat motor 2 from 11F, late-night unrest from 41F, in-transit calming (8 coins, 6 per ten floors).
{
  // v9.19: late-night unrest is retired; late pressure comes from the dark riders themselves.
  assert.deepEqual([40, 41, 44, 61, 81, 101, 140].map(f => nightUnrest(f)), [0, 0, 0, 0, 0, 0, 0], 'v9.19: no late-night unrest');
  const late = run(43, [rider('commuter', 43, 5, { boardedAt: 40 })], { stress: 2, coins: 100 });
  const after = E.resolveFloor(late, fixed());
  assert.equal(lines(after, 'lastPressure')['夜深人躁'], undefined, 'no unrest line');
  const calmed = E.buyCalm(late, 2);
  assert.equal(E.calmPrice(43), 14, 'v9.7: 6 + 2 per ten floors');
  assert.deepEqual([calmed.stress, calmed.coins], [0, 72]);
  const arriving = E.resolveFloor(run(43, [rider('commuter', 43, 1, { boardedAt: 40 })], { stress: 2 }), fixed());
  assert.equal(lines(arriving, 'lastPressure')['夜深人躁'], undefined);
  let s = { ...late, stress: 8, stressCap: 10, coins: 200 };
  for (let i = 0; i < 6; i++) s = E.buyCalm(s, 1);
  assert.equal(s.stress, 2); assert.equal(E.calmAllowance(s), 0, 'six per ten floors');
  assert.equal(E.buyCalm(s, 1), s);
}
console.log('PASS option A: flat motor, late-night unrest and calming');
// v9.6.1 the 9.6 playtest screenshot (30F, 6/8, 1 coin): sources are itemised, and withdrawing the new Child is the rescue.
{
  const cab = [rider('child', 30, 2, { boardedAt: 30 }), rider('exorcist', 30, 4, { boardedAt: 28, volatile: true }), rider('lover', 30, 5, { boardedAt: 29, volatile: true }),
    rider('exorcist', 30, 1, { boardedAt: 27 }), rider('ghost', 30, 4, { boardedAt: 26 }), rider('exorcist', 30, 4, { boardedAt: 28 })];
  const s = run(30, cab, { stress: 6, coins: 1 });
  const f = stressForecast(s);
  const src = Object.fromEntries((f.sources ?? []).map(x => [x.label, x.amount]));
  assert.equal(src['急躁乘客'], 2); assert.equal(src['儿童无人照顾'], 1); assert.equal(src['车厢拥挤'], undefined, 'v9.20.2: a full cabin costs power, not agitation');
  assert.ok(s.stress + f.highDelta >= s.stressCap, 'the floor is fatal as shown');
  const plan = calmRescuePlan(s);
  assert.ok(plan && plan.remove.length === 1 && plan.remove[0].kind === 'child' && plan.remove[0].paid === 0 && plan.calm === 0, JSON.stringify(plan));
}
console.log('PASS agitation sources itemised and a real calming rescue found');
// v9.7 selling: +15 coins, frees the slot, shop cards stay visible when full; Safety Margin cannot be sold into a crisis.
{
  const full = { ...E.initialRun(), status: 'upgrade' as const, floor: 70, coins: 10, upgrades: { ...E.initialRun().upgrades, calm: 1, reinforced: 1, tipjar: 1, crowd: 1, buffer: 1, punchcard: 1 }, stressCap: 10, stress: 3 };
  const withShop = { ...full, shop: E.drawUpgradeOffer(full.upgrades, [], fixed(), 70).keys.map(key => ({ key, price: 0, purchased: false })) };
  assert.equal(withShop.shop.length, 3, 'cards are drawn even with six slots filled');
  assert.equal(E.availableShopCards(withShop).length, 3);
  const key = withShop.shop[0].key;
  assert.equal(E.installUpgrade(withShop, key), withShop, 'cannot install into a full kit');
  const sold = E.sellUpgrade(withShop, 'tipjar');
  assert.deepEqual([sold.coins, sold.upgrades.tipjar], [25, 0]);
  assert.notEqual(E.installUpgrade(sold, key), sold, 'a freed slot takes the new card');
  const soldCalm = E.sellUpgrade(withShop, 'calm');
  assert.deepEqual([soldCalm.stressCap, soldCalm.calmCharge], [8, false]);
  assert.equal(E.sellUpgrade({ ...withShop, stress: 8 }, 'calm').upgrades.calm, 1, 'not while agitation would exceed the lowered cap');
}
console.log('PASS selling abilities and full-kit shops');
// v9.8 juice: every rider and legend has boarding and arrival lines in both languages; sound never throws without audio.
{
  for (const kind of Object.keys(PASSENGERS) as PassengerKind[]) {
    for (const moment of ['board', 'arrive'] as const) { assert.ok(QUIPS[kind]?.[moment]?.length, `${kind} ${moment} lines`); assert.ok(quip(kind, moment, true) && quip(kind, moment, false), `${kind} ${moment} text`); }
  }
  assert.doesNotThrow(() => playSfx(true, 'ding'), 'no window, no audio, no error');
  assert.doesNotThrow(() => playSfx(false, 'record'));
}
console.log('PASS juice lines and silent-safe sound');
// v9.11 recorded samples: every mapped file ships, with its CC0 licence alongside.
{
  const dir = new URL('../public/audio/sfx/', import.meta.url);
  for (const spec of Object.values(SAMPLES)) for (const file of spec!.files) assert.ok(existsSync(new URL(`${file}.mp3`, dir)), `missing sample ${file}.mp3`);
  assert.ok(existsSync(new URL('LICENSE-kenney-casino-audio.txt', dir)) && existsSync(new URL('LICENSE-kenney-interface-sounds.txt', dir)), 'sample licences ship with the files');
}
console.log('PASS recorded samples and licences present');
// v9.14.2 cabin-aware card value: empty cabin = alone; partners and calming change it.
{
  const empty = run(15, []);
  const lover = rider('lover', 15, 4, { boardedAt: 15 });
  assert.equal(boardNet(lover, empty)?.value, netValue(lover, empty), 'empty cabin equals the alone value');
  const withLover = run(15, [rider('lover', 15, 4, { boardedAt: 14 })]);
  assert.ok(boardNet(lover, withLover)!.value > boardNet(lover, empty)!.value + 5, 'a second Lover is worth more beside the first');
  const child = rider('child', 15, 4, { boardedAt: 14 }), nurse = rider('nurse', 15, 4, { boardedAt: 15 });
  const childAlone = run(15, [child]);
  assert.ok(boardNet(nurse, childAlone)!.value > boardNet(nurse, empty)!.value, 'a Nurse is worth more with a Child to calm');
  const cared = run(15, [child, nurse]);
  assert.ok(boardNet(child, cared)!.value > boardNet(child, childAlone)!.value, 'a cared-for Child is worth more');
  assert.equal(boardNet(rider('operator', 15, 9), empty), null);
}
console.log('PASS cabin-aware card value');
// v9.14.3 partner potential: a combination rider shows what they are worth once paired, and the hint disappears
// when the partner is already aboard (the current value covers it).
{
  const empty = run(15, []);
  const lover = rider('lover', 15, 5, { boardedAt: 15 });
  const p = pairedNet(lover, empty);
  assert.ok(p && p.partner === 'lover' && p.value > boardNet(lover, empty)!.value, JSON.stringify(p));
  assert.equal(pairedNet(lover, run(15, [rider('lover', 15, 5, { boardedAt: 14 })])), null, 'partner already aboard');
  const nurse = rider('nurse', 15, 5, { boardedAt: 15 });
  assert.equal(pairedNet(nurse, empty)?.partner, 'child');
  assert.equal(pairedNet(rider('commuter', 15, 5, { boardedAt: 15 }), empty), null, 'no hint when pairing adds little');
}
console.log('PASS partner potential on cards');
// v9.15 bomb timer display: locked beside an Officer (settlement pauses it), late when it cannot arrive in time.
{
  const bomb = (fuse: number, trip: number) => rider('bomb', 30, trip, { fuse });
  assert.equal(fuseState([rider('cop', 30, 4), bomb(2, 4)], 1, 30), 'locked');
  assert.equal(fuseState([null, bomb(2, 4)], 1, 30), 'late');
  assert.equal(fuseState([null, bomb(4, 4)], 1, 30), 'live', 'expiring on the arrival floor is safe');
  const locked = E.resolveFloor(run(30, [rider('cop', 30, 4), bomb(2, 4)]), fixed());
  assert.equal(locked.cabin[1]?.fuse, 2, 'settlement agrees: a locked timer does not tick');
}
console.log('PASS bomb timer display matches settlement');
// v9.16 Courier parcel: an extra card that must sit beside its Courier; he pays only with it, an unclaimed one opens.
{
  assert.deepEqual([PASSENGERS.courier.fare, E.PARCEL_RULES.payoutCoins, E.PARCEL_RULES.payoutPower], [8, 6, 3], 'card texts quote these values');
  const rng = seq(0.11, 0.62, 0.37, 0.93, 0.48, 0.05, 0.76, 0.29);
  let withCourier = 0;
  for (let i = 0; i < 4000; i++) {
    const floor = 2 + (i % 100), offers = E.makeOffers(floor, E.EMPTY_UPGRADES, false, rng);
    const couriers = offers.filter(r => r.kind === 'courier');
    assert.ok(couriers.length <= 1 && offers.length <= 4, 'one Courier per floor, so at most four cards after the opening');
    if (!couriers.length) { assert.ok(!offers.some(r => r.kind === 'parcel')); continue; }
    withCourier++;
    const c = couriers[0], at = offers.indexOf(c), parcel = offers[at + 1];
    assert.ok(parcel?.kind === 'parcel' && c.parcelId === parcel.id && parcel.ownerId === c.id && parcel.destination === c.destination && !parcel.volatile);
  }
  assert.ok(withCourier > 200, 'Couriers still appear');
  const courier = (trip: number, extra: Partial<Rider> = {}) => rider('courier', 30, trip, { parcelId: 'box', ...extra });
  const parcel = (trip: number, extra: Partial<Rider> = {}) => rider('parcel', 30, trip, { id: 'box', ownerId: 'courier-owner', ...extra });
  // Delivered together: fare and the power pack; the parcel leaves with him and is not an arrival.
  const pair = run(30, [courier(1, { id: 'courier-owner' }), parcel(1)], { energy: 30 });
  const delivered = E.resolveFloor(pair, fixed());
  assert.equal(lines(delivered, 'lastEarnings')['快递员到站'], 8);
  assert.equal(lines(delivered, 'lastEnergy')['快递员电池包'], 2);
  assert.ok(delivered.cabin.every(r => !r) && delivered.lastArrivals?.length === 1 && delivered.lastArrivals[0].kind === 'courier');
  // Without the parcel beside him: +1 agitation a floor, then no fare and no power pack.
  const lost = run(30, [courier(2, { id: 'courier-owner' })], { energy: 30 });
  assert.equal(E.riderAgitation(lost, 0).low, 1);
  assert.equal(lines(E.resolveFloor(lost, fixed()), 'lastPressure')['快递员在找纸箱'], 1);
  const unpaid = E.resolveFloor(run(30, [courier(1)], { energy: 30 }), fixed());
  assert.ok(!lines(unpaid, 'lastEarnings')['快递员到站'] && !lines(unpaid, 'lastEnergy')['快递员电池包']);
  assert.equal(E.arrivalFare(courier(1), [courier(1), null, null, null, null, null], 0), 0);
  // Unclaimed: opens at its floor for 6 coins or 3 power, at random.
  const opened = (roll: number) => E.resolveFloor(run(30, [parcel(1)], { energy: 30 }), fixed(roll));
  assert.equal(lines(opened(0.1), 'lastEarnings')['纸箱开箱'], 4, 'v9.17.2: 6 × (0.5 + 0.1)');
  assert.equal(lines(opened(0.9), 'lastEnergy')['纸箱开箱'], 4, 'v9.17.2: half of 6 × 1.4');
  // Never anyone's neighbour: a Nurse or Coach beside it has no one to work on.
  const seats = [parcel(3), rider('coach', 30, 3), null, null, null, null];
  assert.equal(E.neighbourCount(seats, 1), 0);
  // Placement: refused unless the pair is adjacent (up, down, left or right).
  const fresh = courier(3, { id: 'courier-owner', boardedAt: 30 });
  const seated = run(30, [fresh], { energy: 30 });
  assert.ok(!planPlacement(seated, parcel(3, { boardedAt: 30 }), 2).ok);
  assert.ok(planPlacement(seated, parcel(3, { boardedAt: 30 }), 1).ok && planPlacement(seated, parcel(3, { boardedAt: 30 }), 3).ok);
  // A dismissed Courier takes his parcel; neither can be held for the next floor.
  const aboard = run(30, [courier(3, { id: 'courier-owner', boardedAt: 28 }), parcel(3, { boardedAt: 28 })]);
  assert.ok(E.dismissRider(aboard, 'courier-owner').cabin.every(r => !r));
  const holding = { ...run(30, []), upgrades: { ...E.EMPTY_UPGRADES, reservation: 1 } };
  const offer = [courier(3, { boardedAt: 30 }), parcel(3, { boardedAt: 30 })];
  assert.equal(E.reserveOffer(holding, offer, offer[0].id), holding);
  assert.equal(E.reserveOffer(holding, offer, offer[1].id), holding);
  // Cards: the Courier's pairing hint is his own parcel.
  assert.equal(pairedNet(courier(3, { boardedAt: 30 }), run(30, []))?.partner, 'parcel');
}
console.log('PASS Courier parcel rules');
// v9.17 Courier boxes: tiers and crates, adoption and disputes, the Thief, Child, Inspector, Mechanic, Mimic and bomb hand-off.
{
  const R = (kind: PassengerKind, id: string, dest: number, extra: Partial<Rider> = {}): Rider => ({ id, kind, destination: dest, patience: 0, boardedAt: 29, fareBonus: 0, stash: 0, volatile: false, ...extra });
  const go = (seats: Array<Rider | null>, roll = 0.4) => E.resolveFloor(run(30, seats, { energy: 30 }), fixed(roll));
  assert.deepEqual(E.PARCEL_RULES.values, { small: { common: 6, rare: 12, legendary: 24 }, big: { common: 16, rare: 30, legendary: 60 } }, 'rule texts quote these values');
  assert.deepEqual([ECONOMY_RULES.thiefTravel, ECONOMY_RULES.thiefPerVictim], [0, 2], 'the Thief text quotes 2 per neighbour');
  // Deals: tiers and crates appear, the Courier shares his box's tier.
  let crates = 0, tiered = 0;
  const rng = seq(0.11, 0.62, 0.37, 0.93, 0.48, 0.05, 0.76, 0.29, 0.14, 0.83);
  for (let i = 0; i < 6000; i++) {
    const offers = E.makeOffers(2 + (i % 100), E.EMPTY_UPGRADES, false, rng), box = offers.find(r => r.kind === 'parcel');
    if (!box) continue;
    const courier = offers.find(r => r.id === box.ownerId)!;
    assert.equal(courier.tier, box.tier); assert.equal(Boolean(courier.parcelBig), box.big === 'top');
    crates += Number(Boolean(box.big)); tiered += Number(Boolean(box.tier));
  }
  assert.ok(crates > 50 && tiered > 50, `crates ${crates}, tiered ${tiered}`);
  // A crate fills a column and cannot be moved; withdrawing or dismissing removes both halves.
  const crate = R('parcel', 'x', 33, { big: 'top', boxId: 'x', boardedAt: 30 });
  const seated = E.seatRider(Array(6).fill(null), crate, 4)!;
  assert.ok(seated[1]?.big === 'top' && seated[4]?.big === 'bottom' && seated[4]?.boxId === 'x');
  assert.equal(E.seatRider([null, null, null, null, R('nurse', 'n', 33), null], crate, 1), null, 'needs both seats of the column');
  assert.ok(E.unseatRider(seated, 'x').every(r => !r));
  const withCrate = run(30, seated, { energy: 30 });
  assert.ok(!planPlacement(withCrate, seated[1]!, 0).ok, 'a seated crate does not move');
  // Legendary crate delivered: fare 8 + (60 − 6).
  const legendary = go([R('parcel', 'p', 31, { ownerId: 'c', big: 'top', boxId: 'p', tier: 'legendary' }), R('courier', 'c', 31, { parcelId: 'p', parcelBig: true, tier: 'legendary' }), null, R('parcel', 'p-b', 31, { ownerId: 'c', big: 'bottom', boxId: 'p', tier: 'legendary' })]);
  assert.equal(lines(legendary, 'lastEarnings')['快递员到站'], 62);
  assert.equal(lines(go([R('parcel', 'q', 31, { tier: 'rare' })], 0.1), 'lastEarnings')['纸箱开箱'], 7, 'rare average 12 × 0.6');
  // Adoption: an unclaimed box beside an empty-handed Courier counts as his.
  assert.equal(lines(go([R('courier', 'c1', 31, { parcelId: 'gone' }), R('parcel', 'q', 35)]), 'lastEarnings')['快递员到站'], 8);
  // Dispute: another empty-handed Courier touching the box: both +1, the owner still pays.
  const dispute = run(30, [R('courier', 'c1', 34, { parcelId: 'p1' }), R('parcel', 'p1', 34, { ownerId: 'c1' }), R('courier', 'c2', 34, { parcelId: 'gone' })]);
  assert.deepEqual([E.riderAgitation(dispute, 0).low, E.riderAgitation(dispute, 2).low], [1, 2]);
  assert.ok(E.parcelBeside(dispute.cabin, 0));
  // Thief: picks every adjacent pocket except Officers, Lawyers, the Don and legends; beside a box he stays calm and takes it.
  assert.equal(lines(go([R('commuter', 'a', 34), R('thief', 't', 34), R('tourist', 'u', 34), null, R('nurse', 'n', 34)]), 'lastEarnings')['小偷顺手牵羊'], 6);
  const eyed = [R('courier', 'c', 33, { parcelId: 'p' }), R('parcel', 'p', 33, { ownerId: 'c' }), R('thief', 't', 31)];
  assert.equal(E.riderAgitation(run(30, eyed), 2).low, 0);
  const robbed = go(eyed);
  assert.equal(lines(robbed, 'lastEarnings')['小偷带走纸箱的小费'], 2, 'half of 6 × 0.9');
  assert.ok(!robbed.cabin.some(r => r?.kind === 'parcel') && E.riderAgitation(robbed, 0).low === 1, 'the Courier has lost his box');
  assert.ok(go([R('courier', 'c', 33, { parcelId: 'p' }), R('parcel', 'p', 33, { ownerId: 'c' }), R('thief', 't', 31), null, null, R('cop', 'k', 33)]).cabin.some(r => r?.kind === 'parcel'), 'a controlled Thief takes nothing');
  // Child opens a box at the next floor; Mechanic uses an unclaimed box for parts; Inspector delays and pays.
  const opened = go([R('courier', 'c', 33, { parcelId: 'p' }), R('parcel', 'p', 33, { ownerId: 'c' }), R('child', 'k', 33)], 0.1);
  assert.equal(lines(opened, 'lastEarnings')['小孩拆开纸箱'], 4);
  const parts = go([R('mechanic', 'm', 34), R('parcel', 'q', 34)]);
  assert.ok(parts.cabin[0]?.repairDone && !parts.cabin[1] && (parts.serviceTurns ?? 0) >= 4);
  const checked = go([R('courier', 'c', 32, { parcelId: 'p' }), R('parcel', 'p', 32, { ownerId: 'c' }), R('inspector', 'i', 34)]);
  assert.ok(checked.cabin[0]?.destination === 33 && checked.cabin[1]?.inspected);
  assert.equal(E.arrivalFare(checked.cabin[0]!, checked.cabin, 0), E.arrivalFare({ ...checked.cabin[0]! }, [checked.cabin[0], { ...checked.cabin[1]!, inspected: false }, null, null, null, null], 0) + 5);
  // Mimic under a box opens a copy of it.
  const mimicCab = [R('parcel', 'q', 36, { tier: 'legendary' }), null, null, R('mimic', 'm', 31, { copySeed: 1 })];
  assert.equal(lines(go(mimicCab, 0.3), 'lastEarnings')['复制人的复制箱'], 19, 'legendary average 24 × 0.8');
  const gifted = go(mimicCab, 0.1);
  assert.equal(Object.values(gifted.upgrades).filter(Boolean).length, 1, 'a 0.1 roll is inside the legendary 25% ability chance: installed at once');
  // Bomb hand-off: the empty-handed Courier leaves first with the bomb, pays, and the Bomber is a Disguised Commuter.
  const handoff = go([R('courier', 'c', 31, { parcelId: 'gone' }), R('bomb', 'b', 34, { fuse: 1 })]);
  assert.equal(lines(handoff, 'lastEarnings')['快递员到站'], 8);
  assert.ok(handoff.status === 'playing' && handoff.cabin[1]?.kind === 'commuter' && handoff.cabin[1]?.disguised && handoff.cabin[1]?.fuse === undefined);
  assert.equal(riderProfile(handoff.cabin[1]!, handoff.cabin).fare, PASSENGERS.bomb.fare, 'same fare in disguise');
  // v9.19: the timer still runs while he holds it; an ordinary bomb now blows the Bomber and his neighbours out instead of ending the shift.
  const blown = go([R('courier', 'c', 33, { parcelId: 'gone' }), R('bomb', 'b', 34, { fuse: 1 })]);
  assert.ok(blown.status === 'playing' && blown.lastBlast && blown.cabin.every(r => !r), 'the timer still runs while he holds it: both are blown out');
}
console.log('PASS v9.17 Courier boxes, crates and the characters who handle them');
// v9.17.1 audit fixes: the ascend guard matches settlement at shop floors, the bomb label knows about a Courier
// carrying it off, the power forecast includes box payouts, and no Chinese reaches the English interface.
{
  const R = (kind: PassengerKind, id: string, dest: number, extra: Partial<Rider> = {}): Rider => ({ id, kind, destination: dest, patience: 0, boardedAt: 18, fareBonus: 0, stash: 0, volatile: false, ...extra });
  const shopEve = run(19, [R('commuter', 'a', 22)], { energy: 1 });
  assert.notEqual(E.resolveFloor(shopEve, fixed()).status, 'lost', 'arriving at a shop floor with 0 power is safe (the shop opens)');
  assert.ok(E.energyBreakdown(shopEve).total >= 1 && !departureRisk(shopEve).fatal, 'so the guard does not call it fatal');
  assert.ok(departureRisk(run(18, [R('commuter', 'a', 22)], { energy: 1 })).fatal, 'elsewhere 0 power is still fatal');
  const held = [R('courier', 'c', 20, { parcelId: 'gone' }), R('bomb', 'b', 23, { fuse: 1 })];
  assert.equal(fuseState(held, 1, 19), 'carried');
  assert.equal(fuseState([R('courier', 'c', 22, { parcelId: 'gone' }), R('bomb', 'b', 23, { fuse: 1 })], 1, 19), 'late', 'a Courier leaving too late does not save it');
  const opening = run(19, [R('parcel', 'q', 20, { tier: 'rare' }), R('commuter', 'a', 22)], { energy: 20 });
  assert.equal(E.possibleBoxPower(opening), 9, 'the largest rare roll: 12 × 1.5 / 2');
  const ef = energyForecast(opening);
  assert.ok(ef.highDelta - ef.lowDelta >= 9, `forecast range includes the box's 9 power: ${ef.lowDelta}..${ef.highDelta}`);
  const en = (t: string) => translateGameText(t, 'en');
  for (const t of ['已锁住 · ', '来不及！倒计时 ', '快递员会带走 · ', '电梯运转 −1 · 维修工耗电 −1 · 另 3 项', '2 条红线', '免费选取', '确认冒险上行', '10F · 充电 −2 金币', '选取隔音门',
    '电量不够跑完下一段的运转；途中补电每十层有上限。再点一次确认离开。', '倒计时 2，但还有 4 站：到站前会爆炸，让警察站到旁边或请离'])
    assert.ok(!/[㐀-鿿]/u.test(en(t)), `untranslated: ${t} → ${en(t)}`);
  assert.ok(!/[a-z](Arrival|Power|Agitation)\b/.test(en('维修工到站 +6 · 快递员耗电 −1')), 'names and labels are separated');
}
console.log('PASS audit fixes: shop-floor guard, carried bomb label, box power in forecast, English leaks');
// v9.17.2 hidden box contents: rolled on opening, sometimes an ability (likelier when rarer); with every slot full the
// player may swap one out, and the one removed is sold on entering the next shop.
{
  const none = { ...E.EMPTY_UPGRADES };
  const rng = seq(0.07, 0.91, 0.33, 0.58, 0.15, 0.76, 0.42, 0.99, 0.24, 0.67, 0.02, 0.85);
  const tally = (r: { big?: 'top'; tier?: 'rare' | 'legendary' }) => {
    let abilities = 0; const coins: number[] = [];
    for (let i = 0; i < 3000; i++) { const got = E.rollBox(r, rng, none); if (got.ability) abilities++; else if (got.coins) coins.push(got.coins); }
    return { abilities, min: Math.min(...coins), max: Math.max(...coins) };
  };
  const common = tally({}), rare = tally({ tier: 'rare' }), legendary = tally({ tier: 'legendary' }), crate = tally({ big: 'top', tier: 'legendary' });
  assert.ok(common.min >= 3 && common.max <= 9 && common.max > common.min, `common rolls 3–9: ${common.min}–${common.max}`);
  assert.ok(common.abilities < rare.abilities && rare.abilities < legendary.abilities && legendary.abilities < crate.abilities, 'rarer boxes and crates hold abilities more often');
  // Every slot full: the found ability waits; swapping sells the old one at the next shop; passing drops it.
  const full = { ...E.EMPTY_UPGRADES, battery: 1, reinforced: 1, concierge: 1, punchcard: 1, relay: 1, express: 1 };
  const R = (kind: PassengerKind, id: string, dest: number, extra: Partial<Rider> = {}): Rider => ({ id, kind, destination: dest, patience: 0, boardedAt: 17, fareBonus: 0, stash: 0, volatile: false, ...extra });
  const found = E.resolveFloor(run(18, [R('parcel', 'q', 19, { tier: 'legendary' }), R('commuter', 'a', 25)], { energy: 30, upgrades: full }), fixed(0.1));
  assert.ok(found.pendingAbility && !full[found.pendingAbility], 'a legendary 0.1 roll is an ability; with no free slot it waits');
  assert.equal(Object.values(found.upgrades).filter(Boolean).length, 6);
  const passed = E.resolveBoxAbility(found, null);
  assert.ok(!passed.pendingAbility && passed.upgrades.relay === 1);
  const swapped = E.resolveBoxAbility(found, 'relay');
  assert.ok(!swapped.pendingAbility && swapped.upgrades.relay === 0 && swapped.upgrades[found.pendingAbility!] === 1 && swapped.pendingSales?.includes('relay'));
  const shop = E.resolveFloor({ ...swapped, floor: 19, cabin: [R('commuter', 'a', 25), null, null, null, null, null], energy: 30 }, fixed(0.6));
  assert.equal(lines(shop, 'lastEarnings')['卖掉被替换的能力'], E.SELL_REFUND);
  assert.deepEqual(shop.pendingSales, []);
}
console.log('PASS hidden box contents, ability finds and swaps');
// v9.18 real-time Bomber: seconds = 10 + 10 per stop, an adjacent Officer pauses it, zero ends the run, settlement no
// longer counts floors, and a delivery pays 1 coin per 3 seconds left.
{
  E.BOMB_RULES.realtime = true;
  const rng = seq(0.2, 0.4, 0.6, 0.8, 0.1, 0.9, 0.3, 0.7);
  let dealt = 0;
  for (let i = 0; i < 3000 && !dealt; i++) for (const o of E.makeOffers(40 + (i % 60), E.EMPTY_UPGRADES, false, rng)) if (o.kind === 'bomb') { assert.equal(o.bombMs, E.bombSeconds(o.destination - o.boardedAt) * 1000); dealt++; }
  assert.ok(dealt && PASSENGERS.bomb.fare === 26);
  const R = (kind: PassengerKind, id: string, dest: number, extra: Partial<Rider> = {}): Rider => ({ id, kind, destination: dest, patience: 0, boardedAt: 29, fareBonus: 0, stash: 0, volatile: false, ...extra });
  const armed = run(30, [R('bomb', 'b', 34, { fuse: 1, bombMs: 5000 })]);
  assert.equal(E.tickBombs(armed, 2000).cabin[0]?.bombMs, 3000);
  assert.equal(E.tickBombs(run(30, [R('cop', 'k', 34), R('bomb', 'b', 34, { fuse: 1, bombMs: 5000 })]), 9000).cabin[1]?.bombMs, 5000, 'an adjacent Officer pauses it');
  // v9.19: an ordinary Bomber's bomb blows him and his neighbours out (the shift goes on); the Mad Bomber's ends it.
  const boom = E.tickBombs({ ...armed, coins: 30, cabin: [R('bomb', 'b', 34, { fuse: 1, bombMs: 5000 }), R('tourist', 't', 34), null, R('commuter', 'c', 34), null, R('nurse', 'n', 34)] }, 6000);
  assert.ok(boom.status === 'playing' && boom.coins === 30 - DARK.blastCoins && boom.cabin.filter(Boolean).length === 1 && boom.cabin[5]?.kind === 'nurse' && boom.lastBlast?.slots.length === 3, JSON.stringify(boom.lastBlast));
  const mad = E.tickBombs(run(30, [R('madbomber', 'm', 34, { fuse: 1, bombMs: 5000 })]), 6000);
  assert.ok(mad.status === 'lost' && /炸弹倒计时归零/.test(mad.message));
  assert.equal(E.tickBombs(run(30, [R('cop', 'k', 34), R('madbomber', 'm', 34, { fuse: 1, bombMs: 5000 })]), 9000).status, 'lost', 'an ordinary Officer cannot lock the Mad Bomber');
  assert.equal(E.tickBombs(run(30, [R('crookedcop', 'k', 34), R('madbomber', 'm', 34, { fuse: 1, bombMs: 5000 })]), 9000).cabin[1]?.bombMs, 5000, 'a Crooked Cop locks it');
  const ascend = E.resolveFloor(armed, fixed());
  assert.ok(ascend.status === 'playing' && ascend.cabin[0]?.fuse === 1, 'settlement no longer counts floors down');
  const delivered = E.resolveFloor(run(30, [R('bomb', 'b', 31, { fuse: 1, bombMs: 9500 })]), fixed());
  assert.equal(lines(delivered, 'lastEarnings')['拆弹奖金'], 3);
  assert.equal(fuseState([R('bomb', 'b', 34, { bombMs: 8000 })], 0, 30), 'late', 'under 3 seconds a stop is too late');
  assert.equal(fuseState([R('bomb', 'b', 34, { bombMs: 30000 })], 0, 30), 'live');
  const inShop: RunState = { ...armed, status: 'upgrade' };
  assert.equal(E.tickBombs(inShop, 9000), inShop, 'no ticking in the shop');
  E.BOMB_RULES.realtime = false;
}
console.log('PASS real-time Bomber timer');
// v9.18.1 pickpocketing by pocket, theft receipts for the animation, and box receipts that name power or an ability.
{
  const R = (kind: PassengerKind, id: string, dest: number, extra: Partial<Rider> = {}): Rider => ({ id, kind, destination: dest, patience: 0, boardedAt: 29, fareBonus: 0, stash: 0, volatile: false, ...extra });
  const picked = E.resolveFloor(run(30, [R('celebrity', 'c', 34), R('thief', 't', 34), R('ghost', 'g', 34), null, R('child', 'k', 34)]), fixed());
  assert.equal(lines(picked, 'lastEarnings')['小偷顺手牵羊'], 4 + 0 + 1, 'Celebrity 4, Ghost 0, Child 1');
  assert.deepEqual(picked.lastThefts, [{ thief: 1, victims: [{ slot: 0, coins: 4 }, { slot: 4, coins: 1 }] }]);
  assert.equal(E.pickpocketFrom(R('cop', 'o', 34)), 0);
  const power = E.resolveFloor(run(30, [R('parcel', 'q', 31)], { energy: 30 }), fixed(0.9));
  assert.ok(power.lastArrivals?.[0].power && power.lastArrivals[0].coins === 0, 'a power box says how much power, not +0 coins');
  const ability = E.resolveFloor(run(30, [R('parcel', 'q', 31, { tier: 'legendary' })], { energy: 30 }), fixed(0.1));
  assert.ok(ability.lastArrivals?.[0].ability, 'an ability box names the ability');
}
console.log('PASS pickpocketing by pocket and box receipts');
// v9.18.2 visible rules: pickpocket links, boxes never link, an itemised fare that sums to the fare paid, recorded
// haunts, a held Thief calming the cabin, and the Bomber's total seconds for the fuse.
{
  const R = (kind: PassengerKind, id: string, dest: number, extra: Partial<Rider> = {}): Rider => ({ id, kind, destination: dest, patience: 0, boardedAt: 29, fareBonus: 0, stash: 0, volatile: false, ...extra });
  const cab = [R('celebrity', 'c', 34), R('thief', 't', 34), R('parcel', 'q', 34), null, R('ghost', 'g', 34), null];
  assert.equal(E.stealLink(cab, 0, 1), 4); assert.equal(E.stealLink(cab, 1, 2), 'box'); assert.equal(E.stealLink(cab, 1, 4), 0, 'nothing to steal from a Ghost');
  assert.equal(E.stealLink([R('thief', 't', 34), R('commuter', 'a', 34), null, R('cop', 'k', 34), null, null], 0, 1), 0, 'a held Thief steals nothing');
  const { activeConnection } = await import('../lib/game-interaction');
  assert.ok(!activeConnection([R('tourist', 'u', 34), R('parcel', 'q', 34), null, null, null, null], 0, 1), 'a box never links, even to a Tourist');
  const tour = [R('lover', 'l', 34), R('tourist', 'u', 34), R('lover', 'm', 34), null, R('parcel', 'q', 34), null];
  const lines9 = E.fareBreakdown(tour[1]!, tour, 1, 1, 0);
  assert.equal(lines9.reduce((n, l) => n + l.amount, 0), E.arrivalFare(tour[1]!, tour, 1, 1, 0));
  assert.deepEqual(lines9.map(l => l.label).slice(0, 2), ['基础车费', '游客：邻座 2 位 × 2'], 'the box is not a companion');
  const haunted = E.resolveFloor(run(29, [R('ghost', 'g', 40), R('commuter', 'a', 40)]), fixed());
  assert.deepEqual(haunted.lastHaunts, [{ ghost: 0, victim: 1 }]);
  const held = run(30, [R('thief', 't', 34), R('commuter', 'a', 34), null, R('cop', 'k', 34), null, null]);
  assert.equal(lines(E.resolveFloor(held, fixed()), 'lastPressure')['受管小偷帮忙维持秩序'], -1);
  E.BOMB_RULES.realtime = true;
  const rng = seq(0.2, 0.4, 0.6, 0.8, 0.1, 0.9, 0.3, 0.7); let bomber: Rider | undefined;
  for (let i = 0; i < 3000 && !bomber; i++) bomber = E.makeOffers(40 + (i % 60), E.EMPTY_UPGRADES, false, rng).find(o => o.kind === 'bomb');
  assert.ok(bomber && bomber.bombMsTotal === bomber.bombMs);
  E.BOMB_RULES.realtime = false;
}
console.log('PASS visible rules: pickpocket links, fare lines, haunts, held Thief, bomb fuse length');
// v9.18.3: a Mimic copies the fare above exactly (no second short-trip discount); better boxes travel farther; every
// box opened, used or taken is recorded for its animation; an incident names the rider who left without paying.
{
  const R = (kind: PassengerKind, id: string, dest: number, extra: Partial<Rider> = {}): Rider => ({ id, kind, destination: dest, patience: 0, boardedAt: 63, fareBonus: 0, stash: 0, volatile: false, ...extra });
  const mim = [R('bomb', 'b', 67, { fuse: 5 }), null, null, R('mimic', 'm', 66, { localFareRatio: 0.8 }), null, null];
  assert.equal(riderProfile(mim[3]!, mim, 3).fare, PASSENGERS.bomb.fare, 'a short-trip Mimic under a Bomber copies the full Bomber fare');
  let st = 918273; const rng = () => { st = (st + 0x6d2b79f5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; const trips: Record<string, number[]> = { common: [], rare: [], legendary: [] };
  for (let i = 0; i < 6000; i++) for (const o of E.makeOffers(12, E.EMPTY_UPGRADES, false, rng)) if (o.kind === 'courier') trips[o.tier ?? 'common'].push(o.destination - 12 - (o.parcelBig ? E.PARCEL_RULES.crateExtraStop : 0));
  for (const tier of ['common', 'rare', 'legendary'] as const) { const [lo, hi] = E.PARCEL_RULES.trips[tier]; assert.ok(trips[tier].length && trips[tier].every(t => t >= lo && t <= hi), `${tier} Courier trips stay in ${lo}–${hi}`); }
  const route = [R('courier', 'k', 70, { parcelId: 'k-p', routeStops: 5 }), R('parcel', 'k-p', 70, { ownerId: 'k' }), null, null, null, null];
  assert.equal(E.fareBreakdown(route[0]!, route, 0).find(l => l.label.startsWith('长途送货'))?.amount, E.PARCEL_RULES.stopFee * 3, 'a 5-stop route pays the fee for 3 stops');
  assert.ok(!E.fareBreakdown(route[0]!, [route[0], null, null, null, null, null], 0).some(l => l.label.startsWith('长途送货')), 'no fee without the box');
  const child = E.resolveFloor(run(20, [R('parcel', 'q', 30, { tier: 'rare' }), R('child', 'c', 30), null, null, null, null]), fixed());
  assert.equal(child.lastBoxEvents?.[0].by, 'child'); assert.equal(child.lastBoxEvents?.[0].slot, 0);
  const inc = E.resolveFloor(run(74, [R('bomb', 'b', 76, { fuse: 5 }), null, null, null, null, R('commuter', 'a', 76)], { stress: 6, stressCap: 10 }), fixed(0.05));
  assert.ok(inc.lastIncident && inc.cabin.every(r => r?.id !== inc.lastIncident!.riderId), 'the incident rider is named and gone');
}
console.log('PASS Mimic copies exactly, box trips by tier, box events, incident receipt');
// v9.18.4: an Officer's lock stops a Bomber's timer but not the defusal bonus clock.
{
  E.BOMB_RULES.realtime = true;
  const R = (kind: PassengerKind, id: string, dest: number, extra: Partial<Rider> = {}): Rider => ({ id, kind, destination: dest, patience: 0, boardedAt: 40, fareBonus: 0, stash: 0, volatile: false, ...extra });
  const locked = run(40, [R('bomb', 'b', 42, { bombMs: 30000, bombMsTotal: 30000 }), R('cop', 'k', 45)]);
  const after = E.tickBombs(locked, 12000);
  assert.equal(after.cabin[0]!.bombMs, 30000, 'the lock stops the timer');
  assert.equal(after.cabin[0]!.bonusMs, 18000, 'the defusal bonus keeps draining');
  const paid = E.resolveFloor({ ...after, floor: 41 }, fixed());
  assert.equal(lines(paid, 'lastEarnings')['拆弹奖金'], 6, '18 s left for the bonus pays 6, not 10');
  E.BOMB_RULES.realtime = false;
}
console.log('PASS locked Bomber: timer stops, defusal bonus drains');
// v9.18.4: overtime calming past the allowance (2×, 3×, …); placement warnings for red links and unattended riders.
{
  const base = { ...run(95, [null, null, null, null, null, null], { stress: 8, stressCap: 10 }), coins: 1000, calmSector: Math.floor(95 / 10), calmUsed: E.CALM_PURCHASE.perSector };
  assert.equal(E.calmAllowance(base), 0, 'allowance spent');
  const p1 = E.overtimeCalmPrice(base)!, one = E.buyOvertimeCalm(base), p2 = E.overtimeCalmPrice(one)!;
  assert.equal(p1, E.calmPrice(95) * 2, 'the first overtime point costs 2×');
  assert.equal(p2, E.calmPrice(95) * 3, 'the next costs 3×');
  assert.equal(one.stress, 7); assert.equal(one.coins, 1000 - p1);
  assert.equal(E.overtimeCalmPrice({ ...base, calmUsed: 2 }), null, 'no overtime while the allowance lasts');
  { const poor = { ...base, coins: p1 - 1 }; assert.equal(E.buyOvertimeCalm(poor), poor, 'cannot buy without the coins'); }
  const R = (kind: PassengerKind, id: string, dest: number): Rider => ({ id, kind, destination: dest, patience: 0, boardedAt: 30, fareBonus: 0, stash: 0, volatile: false });
  const st = run(30, [R('drunk', 'd', 34), null, null, R('courier', 'c', 35), null, null]);
  const placed = planPlacement(st, R('commuter', 'n', 33), 1);
  assert.ok(placed.ok && /注意：与醉汉红线/.test(placed.next.message), 'a new red link is announced beside the green one');
  const kid = planPlacement(run(30, [null, R('coach', 'k', 34), null, null, null, null]), R('child', 'x', 33), 2);
  assert.ok(kid.ok && /儿童无人照顾 \+1躁动\/层/.test(kid.next.message), 'an unattended Child is announced');
  const star = planPlacement(run(30, [R('celebrity', 's', 34), R('tourist', 't', 34), null, null, null, null]), R('commuter', 'm', 33), 3);
  assert.ok(star.ok && /名人被围/.test(star.next.message), 'a neighbour the placement newly crowds is announced');
  const courierFirst = planPlacement(run(30, [null, null, null, null, null, null]), R('courier', 'c2', 33), 0);
  assert.ok(courierFirst.ok && !/在找纸箱/.test(courierFirst.next.message), 'a Courier placed before his box is not nagged');
  const crate: Rider = { ...R('parcel', 'box', 34), ownerId: 'cc', big: 'top' };
  const eyed = planPlacement(run(30, [null, R('courier', 'cc', 34), null, null, R('thief', 'th', 33), null]), crate, 0);
  assert.ok(eyed.ok && eyed.slots.length === 2 && /小偷盯上了这个纸箱/.test(eyed.next.message), 'a big crate beside an unguarded Thief is announced');
  assert.ok(E.dispatchRemaining({ ...run(30, []), dispatchSector: 3, dispatchCount: 1 }) === 1 && E.dispatchRemaining(run(30, [])) === 2, 'Dispatch uses left per sector');
}
console.log('PASS overtime calming price ladder, placement warnings, Dispatch uses');
// v9.18.5: playtests 6–10 — crowding warning, merged notes, fixed engine messages all have English, charge default puts power first.
{
  const R = (kind: PassengerKind, id: string, dest: number): Rider => ({ id, kind, destination: dest, patience: 0, boardedAt: 30, fareBonus: 0, stash: 0, volatile: false });
  const five = run(30, [R('commuter', 'a', 34), R('commuter', 'b', 34), R('commuter', 'c', 34), R('commuter', 'd', 34), R('commuter', 'e', 34), null]);
  const sixth = planPlacement(five, R('commuter', 'f', 33), 5);
  assert.ok(sixth.ok && /车厢坐满：风扇 \+1电\/层/.test(sixth.next.message), 'filling the cabin to the crowding line is announced');
  const src = readFileSync('lib/game-engine.ts', 'utf8') + readFileSync('lib/game-interaction.ts', 'utf8');
  const leaks = [...src.matchAll(/(?:notes\.(?:push|unshift)|message:|message=|stressReasons\.push|return reject)\(?\s*'([^'\n]*[\u3400-\u9fff][^'\n]*)'/g)].map(m => m[1]).filter(text => /[\u3400-\u9fff]/.test(translateGameText(text, 'en')));
  assert.deepEqual(leaks, [], 'every fixed engine message has an English translation');
  assert.equal(translateGameText('幽灵受控，不再延误邻座 ×2', 'en'), 'Ghost under control: no more delays for neighbors ×2', 'merged notes translate with their count');
  assert.ok(!/Drunk|Lawyer|Exorcist|neighbour/.test(translateGameText('醉汉安抚 · 律师 · 驱魔师 · 教练邻座 2 位（+100%）', 'en')), 'English uses the card names and US spelling');
}
console.log('PASS crowding warning, merged notes, English coverage of engine messages');
// v9.19 after midnight: dark riders, corruption, the Mystery's identity, survivors, items.
{
  const R = (kind: PassengerKind, id: string, dest: number, extra: Partial<Rider> = {}): Rider => ({ id, kind, destination: dest, patience: 0, boardedAt: 60, fareBonus: 0, stash: 0, volatile: false, ...extra });
  const up = E.initialRun().upgrades;
  const darkCount = (floor: number) => Array.from({ length: 200 }, (_, i) => E.makeOffers(floor, up, false, seq(((i * 37) % 97) / 97, ((i * 53) % 89) / 89, ((i * 71) % 83) / 83, ((i * 13) % 79) / 79))).flat().filter(r => isDark(r.kind)).length;
  assert.equal(darkCount(59), 0, 'no dark card before midnight');
  const at60 = darkCount(60), at80 = darkCount(80);
  assert.ok(at60 > 0 && at80 > at60, `dark share rises with depth (${at60} → ${at80})`);
  const commuters = (floor: number) => Array.from({ length: 400 }, (_, i) => E.makeOffers(floor, up, false, seq(((i * 37) % 97) / 97, ((i * 53) % 89) / 89, ((i * 71) % 83) / 83))).flat().filter(r => r.kind === 'commuter' || r.kind === 'lover').length;
  assert.ok(commuters(52) < commuters(49), 'Commuters and Lovers thin out after 50F');

  // Corruption: a Commuter flanked by two dark riders turns after two departures; an Amulet keeps him.
  const flanked = run(62, [R('robber', 'x', 70), R('commuter', 'c', 70), R('brawler', 'y', 70)], { coins: 0, stressCap: 99 });
  const once = E.resolveFloor(flanked, fixed(.9));
  assert.equal(once.cabin[1]?.kind, 'commuter'); assert.equal(once.cabin[1]?.corruption, 1);
  const twice = E.resolveFloor({ ...once, status: 'playing' }, fixed(.9));
  assert.equal(twice.cabin[1]?.kind, 'overtimer', 'two floors between dark riders turn a Commuter into an Overtimer');
  assert.deepEqual(twice.lastCorruption, [{ slot: 1, from: 'commuter', to: 'overtimer' }]);
  const warded = E.resolveFloor({ ...once, status: 'playing', cabin: once.cabin.map(r => r?.id === 'c' ? { ...r, warded: true } : r) }, fixed(.9));
  assert.equal(warded.cabin[1]?.kind, 'commuter', 'an Amulet stops corruption');

  // The Mystery is revealed one floor after boarding and pays his identity's fare.
  const mystery = E.resolveFloor(run(40, [R('mystery', 'm', 45, { identity: 'magnate' })]), fixed(.9));
  assert.ok(mystery.cabin[0]?.revealed && mystery.log[0].includes('富商'));
  assert.equal(E.arrivalFare(mystery.cabin[0]!, mystery.cabin, 0, 0), 25);

  // Survivors: a normal rider delivered after midnight earns the survivor bonus; before midnight he does not.
  assert.equal(lines(E.resolveFloor(run(62, [R('commuter', 'a', 63)]), fixed(.9)), 'lastEarnings')['幸存者平安送达'], DARK.survivorBonus);
  assert.equal(lines(E.resolveFloor(run(40, [R('commuter', 'a', 41)]), fixed(.9)), 'lastEarnings')['幸存者平安送达'], undefined);

  // Robber robs the wallet unless held; held he pays a bounty. The Crooked Cop takes protection money and calms the cabin.
  const robbed = lines(E.resolveFloor(run(62, [R('robber', 'r', 70)], { coins: 200 }), fixed(.9)), 'lastEarnings');
  assert.equal(robbed['劫匪抢走'], -(DARK.robberBase + Math.floor(200 * DARK.robberRate)));
  const held = E.resolveFloor(run(62, [R('robber', 'r', 63), R('cop', 'p', 70)], { coins: 200 }), fixed(.9));
  assert.equal(lines(held, 'lastEarnings')['劫匪抢走'], undefined);
  assert.ok(E.fareBreakdown(R('robber', 'r', 63), [R('robber', 'r', 63), R('cop', 'p', 70), null, null, null, null], 0, 0).some(l => l.label === '劫匪赏金' && l.amount === DARK.robberBounty));
  const crooked = E.resolveFloor(run(62, [R('crookedcop', 'k', 70), R('drunk', 'd', 70)], { coins: 50, stress: 3 }), fixed(.9));
  assert.equal(lines(crooked, 'lastEarnings')['黑警保护费'], -DARK.crookedFee);
  assert.equal(lines(crooked, 'lastPressure')['黑警镇场'], -DARK.crookedCalm);
  assert.ok(E.thiefHeld([R('crookedcop', 'k', 70), R('thief', 't', 70), null, null, null, null], 1), 'a Crooked Cop holds a Thief');
  assert.ok(!E.thiefHeld([R('cop', 'k', 70), R('robber', 't', 70), R('shyster', 's', 70), null, null, null], 1), 'a Shyster frees the Robber from an Officer');

  // Overtimer: stays past his stop unless a neighbour gets off with him or his alarm rings; overtime banks each floor.
  const alone = E.resolveFloor(run(62, [R('overtimer', 'o', 63), null, null, R('tourist', 't', 70)]), fixed(.9));
  assert.equal(alone.cabin[0]?.kind, 'overtimer', 'an Overtimer with nobody leaving stays aboard');
  assert.equal(alone.cabin[0]?.stash, DARK.overtimePay);
  const together = E.resolveFloor(run(62, [R('overtimer', 'o', 63), R('commuter', 'c', 63)]), fixed(.9));
  assert.ok(!together.cabin.some(r => r?.id === 'o'), 'he leaves with a neighbour who gets off');
  const alarmed = E.resolveFloor(run(62, [R('overtimer', 'o', 63, { alarm: true })]), fixed(.9));
  assert.ok(!alarmed.cabin.some(r => r?.id === 'o'), 'the Alarm Clock gets him off on time');
  const lingering = run(65, [R('overtimer', 'o', 63, { stash: 6 })]);
  const walked = E.resolveFloor(lingering, fixed(.9));
  assert.ok(!walked.cabin.some(Boolean) && !walked.lastArrivals?.length && walked.lastEarnings.total <= 0, 'three floors past his stop he walks off unpaid');

  // Scandal: exposed beside an Inspector; Smuggler: an Inspector seizes the black box for a reward.
  assert.deepEqual(E.fareBreakdown(R('scandal', 's', 63), [R('scandal', 's', 63), R('inspector', 'i', 70), null, null, null, null], 0, 0), [{ label: '丑闻曝光：车费归零', amount: 0 }]);
  const box: Rider = { ...R('parcel', 'b', 66), ownerId: 'sm', contraband: true };
  const seized = E.resolveFloor(run(62, [R('smuggler', 'sm', 66, { parcelId: 'b' }), box, R('inspector', 'i', 70)]), fixed(.9));
  assert.ok(!seized.cabin.some(r => r?.id === 'b') && lines(seized, 'lastEarnings')['检查员没收黑箱'] === DARK.seizeReward, 'an Inspector seizes a black box');

  // Pusher: calms 2 per neighbour; when she leaves, her neighbours go into withdrawal.
  const pushed = E.resolveFloor(run(62, [R('pusher', 'p', 63), R('drunk', 'd', 70)], { stressCap: 99 }), fixed(.9));
  assert.equal(pushed.cabin[1]?.withdrawal, DARK.withdrawalFloors);
  assert.equal(E.riderAgitation(pushed, 1).fixed.find(l => l.label === '药贩走后的戒断')?.amount, DARK.withdrawal);

  // Summoner: on floors divisible by 3 he calls a Ghost into an empty seat beside him; Wraiths drain power unchecked.
  const summoned = E.resolveFloor(run(62, [R('summoner', 's', 70)]), fixed(.9));
  assert.equal(summoned.lastSummons?.length, 1); assert.equal(summoned.cabin[summoned.lastSummons![0]]?.kind, 'ghost');
  assert.ok(E.energyBreakdown(run(62, [R('wraith', 'w', 70)])).dark > 0, 'an unchecked Wraith drains power');
  assert.equal(E.energyBreakdown(run(62, [R('wraith', 'w', 70), R('summoner', 's', 70)])).dark, 0, 'a Summoner controls the Wraith');

  // A Flare stops dark trouble for the floor.
  assert.equal(lines(E.resolveFloor(run(62, [R('robber', 'r', 70)], { coins: 200, flareFloor: 62 }), fixed(.9)), 'lastEarnings')['劫匪抢走'], undefined);

  // Items: stock by depth, rising prices, a four-slot bag and their effects.
  const stock = E.drawItemStock(62, fixed(.3));
  assert.equal(stock.length, 3); assert.ok(E.drawItemStock(5, fixed(.99)).every(c => ['cell', 'swap', 'dismiss'].includes(c.key)), 'only basic items early');
  const shop: RunState = { ...run(60, []), status: 'upgrade', coins: 500, itemStock: [{ key: 'holywater', price: 60, sold: false }, { key: 'cutter', price: 45, sold: false }, { key: 'cell', price: 20, sold: false }] };
  let bag = E.buyItem(E.buyItem(E.buyItem(shop, 0), 1), 2);
  assert.deepEqual(bag.items, ['holywater', 'cutter', 'cell']); assert.equal(bag.coins, 500 - 125);
  assert.equal(E.buyItem(bag, 0), bag, 'a sold item cannot be bought twice');
  bag = { ...bag, status: 'playing', floor: 62, energy: 10, cabin: [R('robber', 'r', 70), R('bomb', 'b', 66, { bombMs: 20000 }), null, null, null, null] };
  assert.equal(E.applyItem(bag, 'cell').energy, 25);
  const purified = E.applyItem(bag, 'holywater', 'r');
  assert.equal(purified.cabin[0]?.kind, 'thief'); assert.deepEqual(purified.lastCorruption, [{ slot: 0, from: 'robber', to: 'thief' }]);
  assert.ok(!E.itemUsable(bag, 'holywater', bag.cabin[1]), 'Holy Water needs a dark rider');
  const cut = E.applyItem(bag, 'cutter', 'b');
  assert.ok(!cut.cabin.some(r => r?.id === 'b') && cut.coins > bag.coins && !cut.items!.includes('cutter'), 'the Wire Cutter removes the Bomber, who pays');
  assert.ok(Math.abs(itemPrice('holywater', 60, 1) - 90) < 1 && itemPrice('holywater', 100) > 60, 'repeat and depth raise item prices');
}
console.log('PASS v9.19 dark share, corruption, Mystery identity, survivors, dark riders, flare, items');
// v9.19.1 playtest fixes: two old-rider moves, corruption warning, black-box names, no dark names before midnight.
{
  const R = (kind: PassengerKind, id: string, dest: number, extra: Partial<Rider> = {}): Rider => ({ id, kind, destination: dest, patience: 0, boardedAt: 60, fareBonus: 0, stash: 0, volatile: false, ...extra });
  let st = run(62, [R('commuter', 'a', 70), R('tourist', 'b', 70), R('nurse', 'c', 70)]);
  const m1 = planPlacement(st, st.cabin[0]!, 3); assert.ok(m1.ok && !m1.next.swapped && /剩余1次/.test(m1.next.message), 'the first old-rider move leaves one');
  const m2 = planPlacement(m1.next, m1.next.cabin[1]!, 4); assert.ok(m2.ok && m2.next.swapped && E.oldMovesRemaining(m2.next) === 0, 'the second old-rider move is allowed');
  st = run(62, [R('robber', 'x', 70), R('commuter', 'c', 70)]);
  const warn = planPlacement(st, R('brawler', 'y', 70), 2);
  assert.ok(warn.ok && /通勤者会被同化成加班魂（2层后）/.test(warn.next.message), 'placing a second dark neighbour warns about corruption');
  assert.equal(displayName({ kind: 'parcel', contraband: true }, 'zh'), '黑箱');
  const early = cardSummary(R('lover', 'l', 5), run(1, []), 'zh');
  assert.ok(!early.chips.some(c => c.kinds.some(k => isDark(k))), 'ordinary cards name no dark rider before midnight');
  assert.ok(cardSummary(R('lover', 'l', 70), run(62, []), 'zh').chips.some(c => c.kinds.includes('exlover')), 'after midnight they do');
  // A lone Ex calls the other in; a Brawler getting off lowers agitation by 2 more, and the forecast knows.
  const ex = [R('exlover', 'e', 70), null, null, null, null, null];
  assert.ok(Array.from({ length: 40 }, (_, i) => E.makeOffers(64, E.initialRun().upgrades, false, seq(((i * 37) % 97) / 97, .01, ((i * 13) % 89) / 89), ex)).some(o => o[2]?.kind === 'exlover' && o[2].calledByLover), 'a lone Ex calls the other one');
  const calmed = run(64, [R('brawler', 'b', 65), R('crookedcop', 'k', 70)], { stress: 6, stressCap: 12 });
  const settledCalm = E.resolveFloor(calmed, fixed(.9));
  assert.equal(lines(settledCalm, 'lastPressure')['闹事的人下车了'], -DARK.troublemakerRelief);
  const fc = stressForecast(calmed);
  assert.ok(settledCalm.lastPressure.delta >= fc.lowDelta && settledCalm.lastPressure.delta <= fc.highDelta, 'the forecast counts the troublemaker relief');
  // v9.19.2: from the midnight shop on, at least two of the three items are tools against the dark riders.
  for (let i = 0; i < 30; i++) { const stock = E.drawItemStock(60 + i, seq(((i * 37) % 97) / 97, ((i * 53) % 89) / 89, ((i * 71) % 83) / 83)); assert.ok(stock.filter(c => ITEMS_V[c.key].from >= DARK.midnightFloor).length >= 2, `midnight items at ${60 + i}F: ${stock.map(c => c.key).join(",")}`); }
}
console.log('PASS v9.19.1 playtest fixes');
// v9.20: dark legends, the hidden dark resonance, Mystery clues and the abyss unrest.
{
  const R = (kind: PassengerKind, id: string, dest: number, extra: Partial<Rider> = {}): Rider => ({ id, kind, destination: dest, patience: 0, boardedAt: 60, fareBonus: 0, stash: 0, volatile: false, ...extra });
  // The dark self of this shift's legend waits as a fourth card on leaving the 60F shop, and only there.
  const at60 = E.nextOfferBatch(run(60, [], { legendOffer: 'matron', status: 'playing' }), fixed(.3));
  const dl = at60.offers.find(o => isDarkLegend(o.kind));
  assert.ok(dl?.kind === 'coldmatron' && dl.destination === DLR.destination && at60.state.darkLegendOffer === 'coldmatron', 'the Matron comes back as the Cold Matron at 60F');
  assert.ok(!E.nextOfferBatch(at60.state, fixed(.3)).offers.some(o => isDarkLegend(o.kind)), 'only one dark legend per shift');
  assert.ok(!E.nextOfferBatch(run(50, []), fixed(.3)).offers.some(o => isDarkLegend(o.kind)), 'no dark legend before midnight');
  assert.ok(E.nextOfferBatch(run(60, []), fixed(.3)).offers.some(o => isDarkLegend(o.kind)), 'a shift without a legend still meets a random dark legend');
  assert.equal(DARK_LEGEND_KINDS.length, LEGEND_KINDS.length); for (const k of DARK_LEGEND_KINDS) assert.ok(existsSync(`public/assets/riders/${k}.jpg`), k + ' has a portrait');
  // Per-floor effects, shared by the settlement and the forecast.
  const cold = E.resolveFloor(run(62, [R('coldmatron', 'm', 70), R('commuter', 'c', 66)], { stress: 5, stressCap: 12 }), fixed(.9));
  assert.equal(lines(cold, 'lastPressure')['冷面护士长打镇静剂'], -DLR.coldMatronCalm); assert.equal(lines(cold, 'lastEnergy')['冷面护士长耗电'], -DLR.coldMatronPower);
  const night = E.resolveFloor(run(62, [R('nightoperator', 'o', 70), R('commuter', 'c', 66)], { stress: 2, stressCap: 12 }), fixed(.9));
  assert.equal(lines(night, 'lastEnergy')['夜班老周关灯省电'], DLR.nightOperatorSaving); assert.equal(lines(night, 'lastPressure')['夜班老周关了灯'], DLR.nightOperatorAgitation);
  const zhou = E.resolveFloor(run(69, [R('nightoperator', 'o', 70), R('commuter', 'c', 72)], { stress: 1, stressCap: 12, freeBoxLevels: 0 }), fixed(.9));
  assert.equal(zhou.freeBoxLevels, DLR.nightOperatorBoxLevels, 'Night Zhou leaves a free power-box level at 70F');
  const matronDone = E.resolveFloor(run(69, [R('coldmatron', 'm', 70), R('commuter', 'c', 72)], { stress: 1, stressCap: 10 }), fixed(.9));
  assert.equal(matronDone.stressCap, 10 + DLR.coldMatronCap, 'the Cold Matron raises the agitation cap for good');
  assert.ok(/夜班老周关了灯 \+1躁动\/层/.test(planPlacement(run(60, [R('commuter', 'c', 64)]), E.darkLegendRider('nightoperator', 60, fixed(.3)), 3).next.message), 'placing Night Zhou warns about the lights');
  const king = run(69, [R('kingpin', 'k', 70, { stash: 72 }), R('commuter', 'c', 72)], { stress: 1, stressCap: 12 });
  assert.equal(E.dismissalCost(king, king.cabin[0]!), DLR.kingpinDismissal, 'the Kingpin is expensive to put off');
  const kingDone = E.resolveFloor(king, fixed(.9));
  assert.equal(kingDone.lastArrivals?.find(a => a.kind === 'kingpin')?.coins, 72 + DLR.kingpinStash, 'the Kingpin pays his bank on arrival');
  const bet = (stress: number) => E.resolveFloor(run(69, [R('highroller', 'h', 70), R('commuter', 'c', 72)], { stress, stressCap: 14, coins: 100 }), fixed(.9));
  // v9.20.3 (English playtest 11): he pays per point of agitation when the doors close before 70F; a calm cabin earns nothing.
  assert.equal(lines(bet(0), 'lastEarnings')['赌王的赌注'], undefined); assert.equal(lines(bet(9), 'lastEarnings')['赌王的赌注'], DLR.highRollerPerPoint * 9);
  const sev = E.resolveFloor(run(62, [R('severer', 's', 70), R('drunk', 'd', 66), R('commuter', 'c', 66)], { stress: 2, stressCap: 12 }), fixed(.9));
  assert.ok((lines(sev, 'lastEarnings')['剪线婆收怨'] ?? 0) === 3 * conflictLinks(run(62, [R('severer', 's', 70), R('drunk', 'd', 66), R('commuter', 'c', 66)]).cabin).length, 'the Severer pays per red link');
  // The Other Thirteen: the forecast brackets every roll.
  const odd = run(62, [R('otherthirteen', 't', 70), R('commuter', 'c', 66)], { stress: 4, stressCap: 12 });
  for (const v of [.05, .3, .55, .8]) { const after = E.resolveFloor(odd, fixed(v)); const sf = stressForecast(odd), ef = energyForecast(odd);
    assert.ok(after.stress - odd.stress >= sf.lowDelta && after.stress - odd.stress <= sf.highDelta, 'Other Thirteen agitation is forecast');
    assert.ok(after.energy - odd.energy >= ef.lowDelta && after.energy - odd.energy <= ef.highDelta, 'Other Thirteen power is forecast'); }
  // Hidden dark resonance: at least four riders, all dark (a dark legend counts); one normal rider breaks it.
  const allDark = run(64, [R('summoner', 'a', 70), R('shyster', 'b', 70), R('scrapper', 'c', 70), R('necromancer', 'd', 70)], { stress: 5, stressCap: 12 });
  assert.equal(E.darkResonance(allDark.cabin), 4);
  const res = E.resolveFloor(allDark, fixed(.9));
  assert.equal(lines(res, 'lastPressure')['暗黑共鸣'], -DARK_RESONANCE.calm); assert.equal(lines(res, 'lastEarnings')['暗黑共鸣'], 4 * DARK_RESONANCE.coinsPerRider);
  assert.equal(E.darkResonance(run(64, [R('summoner', 'a', 70), R('shyster', 'b', 70), R('scrapper', 'c', 70), R('commuter', 'd', 70)]).cabin), 0);
  assert.equal(E.darkResonance(run(64, [R('summoner', 'a', 70), R('shyster', 'b', 70), R('scrapper', 'c', 70)]).cabin), 0);
  for (const k of [...DARK_LEGEND_KINDS, 'mystery' as const]) assert.ok(!/共鸣|resonance/i.test(PASSENGERS[k].short + PASSENGERS[k].detail), 'no card documents the resonance');
  // Mystery clues: each fits two identities, the shown clue always fits, and it never changes for the same rider.
  for (const c of Object.values(MYSTERY_CLUES)) assert.equal(new Set(c.fits).size, 2);
  for (const identity of MYSTERY_IDENTITIES) for (let i = 0; i < 20; i++) { const m = { id: `m${i}x${identity}`, identity }; const c = mysteryClue(m)!; assert.ok(MYSTERY_CLUES[c].fits.includes(identity) && mysteryClue(m) === c); }
  assert.ok(cardSummary(R('mystery', 'q', 66, { identity: 'fugitive' }), run(62, []), 'zh').line.startsWith('线索：'), 'an unrevealed Mystery shows a clue');
  assert.ok(cardSummary(R('mystery', 'q', 66, { identity: 'fugitive' }), run(62, []), 'en').line.startsWith('Clue: '));
  // v9.20.1 the abyss gamble: steps every 5 floors from 80F; dark riders pay more and may lash out (agitation or power).
  assert.equal(abyssStep(DARK.extremeFrom - 1), 0); assert.equal(abyssStep(DARK.extremeFrom), 1); assert.equal(abyssStep(DARK.extremeFrom + DARK.extremeEvery), 2);
  assert.equal(outburstChance(DARK.extremeFrom - 1), 0); assert.ok(outburstChance(200) <= DARK.outburstMax);
  const deep = run(DARK.extremeFrom, [R('crookedcop', 'a', 99), R('commuter', 'c', 99), R('scrapper', 's', 99)], { stress: 1, stressCap: 20, energy: 60 });
  assert.ok(!E.riderAgitation(deep, 0).fixed.some(l => l.label === '深渊躁动'), 'no flat abyss tax any more');
  assert.deepEqual(E.outburstSlots(deep), [0, 2], 'only dark riders may lash out');
  assert.deepEqual(E.outburstSlots({ ...deep, flareFloor: deep.floor }), [], 'a Flare stops every outburst for a floor');
  assert.deepEqual(E.outburstSlots({ ...deep, cabin: deep.cabin.map((r, i) => i === 0 ? { ...r!, sedated: 2 } : r) }), [2], 'a sedated rider does not lash out');
  const burst = E.resolveFloor(deep, fixed(0)), calmFloor = E.resolveFloor(deep, fixed(.99));
  assert.equal(lines(burst, 'lastPressure')['黑警发作'], DARK.outburstAgitation); assert.equal(lines(burst, 'lastEnergy')['拆机人发作'], -DARK.outburstPower);
  assert.deepEqual(burst.lastOutbursts, [0, 2]); assert.ok(!calmFloor.lastOutbursts?.length);
  const fc = stressForecast(deep), ef = energyForecast(deep);
  for (const r of [burst, calmFloor]) { assert.ok(r.lastPressure.delta >= fc.lowDelta && r.lastPressure.delta <= fc.highDelta); assert.ok(r.lastEnergy.delta >= ef.lowDelta && r.lastEnergy.delta <= ef.highDelta); }
  assert.ok((fc.certainHighDelta ?? 99) < fc.highDelta && (ef.certainLowDelta ?? -99) > ef.lowDelta, 'the certain worst case leaves the gamble out');
  // Loss chance: exact for one rider; zero with room to spare; the ascend guard prices it.
  const edge = run(DARK.extremeFrom, [R('crookedcop', 'a', 99)], { stress: 9, stressCap: 11, energy: 60 });
  const pEdge = abyssLossChance(edge); assert.ok(Math.abs(pEdge - outburstChance(DARK.extremeFrom + 1)) < 1e-9, 'one rider at the edge: the chance is his odds');
  assert.equal(abyssLossChance({ ...edge, stress: 0, stressCap: 20 }), 0);
  // v9.20.3 (English playtest 8): a shop floor is a checkpoint — the relief that refills there and the 8-coin repair
  // count before the gamble; the ascend guard said 50% where the shop could fix it.
  const beforeShop = run(109, [R('exlover', 'a', 115)], { stress: 11, stressCap: 12, energy: 60, coins: 24 });
  assert.equal(shopAgitationRoom(beforeShop), 3); assert.equal(shopAgitationRoom({ ...beforeShop, floor: 108 }), 0);
  assert.equal(abyssLossChance(beforeShop), 0, 'reaching the cap at a shop is survivable when the repair can pay for it');
  assert.ok(abyssLossChance({ ...beforeShop, coins: 0 }) > 0, 'without the coins to repair it, it is still a gamble');
  const atShop = E.resolveFloor(beforeShop, fixed(0)); assert.equal(atShop.status, 'upgrade'); assert.ok(atShop.stress >= atShop.stressCap);
  assert.equal(E.leaveShop(E.repairEmergency(atShop)).status, 'playing', 'and the shop repair gets you out');
  // Dark cards drawn in the abyss carry its step and pay more.
  for (let i = 0; i < 30; i++) { const floor = 79 + i; for (const o of E.makeOffers(floor, E.EMPTY_UPGRADES, false, seq(((i * 37) % 97) / 97, ((i * 53) % 89) / 89, .5))) if (isDark(o.kind)) assert.equal(o.extreme ?? 0, abyssStep(floor + 1), `abyss dark cards at ${floor}F carry step ${abyssStep(floor + 1)}`); }
  const ex = R('robber', 'x', 99, { extreme: 2 });
  assert.equal(E.fareBreakdown(ex, [ex], 0).find(l => l.label === '深渊加价')?.amount, Math.round(PASSENGERS.robber.fare * DARK.extremeFarePerStep * 2));
  assert.equal(translateGameText('夜班老周关了灯', 'en'), 'Night Zhou: lights out');
  assert.deepEqual(addDiscoveredPassengers(sanitizeDiscoveredPassengers(['kingpin', 'lover']), ['severer']), ['lover', 'severer', 'kingpin'], 'met dark legends are archived');
  for (let i = 0; i < 20; i++) assert.ok(E.drawItemStock(80 + i, seq(((i * 37) % 97) / 97, ((i * 53) % 89) / 89)).some(c => c.key === 'flare'), 'a Flare is always on the abyss shelf');
}
console.log('PASS v9.20 dark legends, resonance, Mystery clues, the abyss gamble');
console.log(JSON.stringify({ version: 'v9', checks: 42, passed: true }));
