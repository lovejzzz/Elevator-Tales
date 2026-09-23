// v9 rule checks: legends and keepsakes, power box, emergency charging, free and paid
// abilities, agitation bands, crowding and incidents, reworked abilities and roles.
import assert from 'node:assert/strict';
import * as E from '../lib/game-engine';
import { LEGEND_KINDS, PASSENGERS, isLegend, type PassengerKind } from '../lib/game-data';
import { motorCost, AGITATION_HIGH_MIN } from '../lib/balance-v832';
import { BOX_PRICES, chargeCost, storageCap } from '../lib/power-box';
import { riderProfile } from '../lib/rider-profile';
import type { Rider, RunState } from '../lib/game-engine';
import { translateGameText } from '../lib/i18n';
import { sectorForecast } from '../lib/game-forecast';
import { motorAdvanceNotice, motorScheduleText, nightUnrest } from '../lib/balance-v832';
import { calmRescuePlan, departureRisk, rescuePlan, sectorNeed } from '../lib/departure-guard';
import { stressForecast } from '../lib/game-forecast';
import { boardNet, netValue, pairedNet } from '../lib/net-value';
import { drawLegend } from '../lib/legend-unlocks';
import { QUIPS, quip } from '../lib/quips';
import { playSfx, SAMPLES } from '../lib/game-sfx';
import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { OFFER_PARTNERS } from '../lib/shift-rules';
import { districtFor } from '../lib/districts';

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
assert.equal(opening.offers.length, 4);
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
  assert.deepEqual(schedule, [1, 1, 2, 2, 2, 2, 2, 2, 2, 2], "v9.6: motor 1 on 1–10, then a flat 2");
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
assert.equal(translateGameText(motorAdvanceNotice(20), 'en'), 'Motor fixed at 2');
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
  assert.equal(netValue(rider('courier', 15, 1, { boardedAt: 15 }), s), 5);
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
  assert.deepEqual([40, 41, 42, 44, 60, 61, 62, 63, 81, 100, 101, 140].map(nightUnrest), [0, 1, 0, 1, 0, 1, 0, 1, 1, 2, 3, 4]);
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
console.log(JSON.stringify({ version: 'v9', checks: 27, passed: true }));
