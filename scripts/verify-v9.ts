// v9 rule checks: legends and keepsakes, power box, emergency charging, free and paid
// abilities, agitation bands, crowding and incidents, reworked abilities and roles.
import assert from 'node:assert/strict';
import * as E from '../lib/game-engine';
import { LEGEND_KINDS, PASSENGERS, isLegend, type PassengerKind } from '../lib/game-data';
import { motorCost, AGITATION_HIGH_MIN, ECONOMY_RULES } from '../lib/balance-v832';
import { BOX_PRICES, chargeCost, storageCap } from '../lib/power-box';
import { riderProfile } from '../lib/rider-profile';
import type { Rider, RunState } from '../lib/game-engine';
import { translateGameText } from '../lib/i18n';
import { sectorForecast } from '../lib/game-forecast';
import { motorAdvanceNotice, motorScheduleText, nightUnrest } from '../lib/balance-v832';
import { calmRescuePlan, departureRisk, rescuePlan, sectorNeed } from '../lib/departure-guard';
import { stressForecast, energyForecast } from '../lib/game-forecast';
import { boardNet, netValue, pairedNet } from '../lib/net-value';
import { fuseState } from '../lib/bomb-state';
import { drawLegend } from '../lib/legend-unlocks';
import { QUIPS, quip } from '../lib/quips';
import { playSfx, SAMPLES } from '../lib/game-sfx';
import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { OFFER_PARTNERS } from '../lib/shift-rules';
import { districtFor } from '../lib/districts';
import { planPlacement } from '../lib/game-interaction';

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
  for (const line of ['storage', 'storage', 'transformer', 'transformer', 'motor'] as const) { floor += 10; s = E.buyBoxLevel({ ...s, floor, status: 'upgrade' }, line); }
  assert.equal(Object.values(s.box!).reduce((x, y) => x + y, 0), 5, 'five levels per run');
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
  assert.equal(lines(six, 'lastPressure')['车厢拥挤'], 1);
  const five = E.resolveFloor(run(20, Array.from({ length: 5 }, () => rider('commuter', 20, 4))), fixed());
  assert.equal(lines(five, 'lastPressure')['车厢拥挤'], undefined);
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
  assert.ok(/if \(\(risk\.fatal \|\| stressFatal\) && !departArmed\)/.test(ui), 'the ascend handler must stop a fatal floor until confirmed');
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
  const s = run(15, []);
  assert.equal(netValue(rider('commuter', 15, 3, { boardedAt: 15 }), s), 0);
  assert.equal(netValue(rider('courier', 15, 1, { boardedAt: 15 }), s), 10);
  // v9.16: a Courier carrying a parcel is valued as the pair; a parcel alone as its unclaimed contents.
  assert.equal(netValue(rider('courier', 15, 1, { boardedAt: 15, parcelId: 'p' }), s), 8 - 2 - 2 + 4);
  assert.equal(netValue(rider('parcel', 15, 1, { boardedAt: 15, ownerId: 'c' }), s), (6 + 3 * 2) / 2 - 2);
  assert.equal(netValue(rider('thief', 15, 2, { boardedAt: 15 }), s), 5 - 4 - 6);
  assert.equal(netValue(rider('operator', 15, 9, { boardedAt: 15 }), s), null);
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
  assert.deepEqual([40, 41, 42, 44, 60, 61, 62, 63, 81, 100, 101, 140].map(f => nightUnrest(f)), [0, 1, 0, 1, 0, 1, 0, 1, 1, 2, 3, 3], 'v9.18: capped at +3');
  const late = run(43, [rider('commuter', 43, 5, { boardedAt: 40 })], { stress: 2, coins: 100 });
  const after = E.resolveFloor(late, fixed());
  assert.equal(lines(after, 'lastPressure')['夜深人躁'], 1, 'floor 44 carries unrest');
  const calmed = E.buyCalm(late, 2);
  assert.equal(E.calmPrice(43), 14, 'v9.7: 6 + 2 per ten floors');
  assert.deepEqual([calmed.stress, calmed.coins], [0, 72]);
  const arriving = E.resolveFloor(run(43, [rider('commuter', 43, 1, { boardedAt: 40 })], { stress: 2 }), fixed());
  assert.equal(lines(arriving, 'lastPressure')['夜深人躁'], undefined, 'a floor where someone gets off loses 1 unrest');
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
  assert.equal(src['急躁乘客'], 2); assert.equal(src['儿童无人照顾'], 1); assert.equal(src['车厢拥挤'], 1);
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
  assert.equal(go([R('courier', 'c', 33, { parcelId: 'gone' }), R('bomb', 'b', 34, { fuse: 1 })]).status, 'lost', 'the timer still runs while he holds it');
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
  assert.ok(dealt && PASSENGERS.bomb.fare === 30);
  const R = (kind: PassengerKind, id: string, dest: number, extra: Partial<Rider> = {}): Rider => ({ id, kind, destination: dest, patience: 0, boardedAt: 29, fareBonus: 0, stash: 0, volatile: false, ...extra });
  const armed = run(30, [R('bomb', 'b', 34, { fuse: 1, bombMs: 5000 })]);
  assert.equal(E.tickBombs(armed, 2000).cabin[0]?.bombMs, 3000);
  assert.equal(E.tickBombs(run(30, [R('cop', 'k', 34), R('bomb', 'b', 34, { fuse: 1, bombMs: 5000 })]), 9000).cabin[1]?.bombMs, 5000, 'an adjacent Officer pauses it');
  const boom = E.tickBombs(armed, 6000);
  assert.ok(boom.status === 'lost' && /炸弹倒计时归零/.test(boom.message));
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
console.log(JSON.stringify({ version: 'v9', checks: 36, passed: true }));
