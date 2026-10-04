import assert from 'node:assert/strict';
import { failureLesson, initialRun, type Rider, type RunState } from '../lib/game-engine';
import { translateGameText } from '../lib/i18n';
import { conflictEffectText } from '../lib/rider-profile';
import { cancelledEdges, symbolEdges } from '../lib/symbols';

// v10.2.4 ten-run browser playtest checks.
const rider = (kind: Rider['kind'], id: string) => ({ id, kind, destination: 9, patience: 0, boardedAt: 1 }) as unknown as Rider;

// An Officer (Lively, Order) beside a Commuter (Quiet, Order): Order is shared, Lively opposes Quiet, so the pair cancels.
const cabin = [rider('cop', 'a'), rider('commuter', 'b'), null, null, null, null];
assert.equal(symbolEdges(cabin).length, 0, 'the net rule leaves no link');
assert.deepEqual(cancelledEdges(cabin).map(e => [e.first, e.second, e.shared]), [[0, 1, ['order']]], 'the cancelled pair is reported with what they share');
// A Tourist (Lively, Hearth) above a Lover (Hearth, Quiet): Hearth shared, Lively opposes Quiet.
assert.equal(cancelledEdges([rider('tourist', 'c'), null, null, rider('lover', 'd'), null, null]).length, 1);
// Two Commuters really link, so nothing is cancelled.
assert.equal(cancelledEdges([rider('commuter', 'e'), rider('commuter', 'f'), null, null, null, null]).length, 0);

// Both resources failing names the agitation source like a single failure, and says power ran out too.
const both = { ...initialRun(), status: 'lost', energy: -1, stress: 11, stressCap: 8, message: '电量耗尽，轿厢停在了楼层之间。',
  lastPressure: { delta: 4, sources: [{ label: '红线躁动', amount: 5 }, { label: '乘客到站舒缓', amount: -1 }] } } as RunState;
const lesson = failureLesson(both);
assert.match(lesson, /红线躁动 \+5/);
assert.match(lesson, /电量也在这一层用完/);
assert.doesNotMatch(translateGameText(lesson, 'en'), /[㐀-鿿]/, 'the English lesson has no Chinese left');

// Red-link texts carry words, not emoji.
for (const effect of ['agitation', 'energy', 'coins', 'overload', 'gamble'] as const) assert.doesNotMatch(conflictEffectText(effect), /[\u{1F300}-\u{1FAFF}☀-➿]/u, effect);
console.log('playtest v10.2.4: cancelled pairs, both-failure lesson and emoji-free red links verified');

// v10.2.7 human playtest (82F): the Exit Pass never takes a legend, because an ordinary dismissal lets any legend off for
// free (the Kingpin excepted); short trips after 31F never pay under 2; the Ghost keeps 1 coin a floor.
{
  const E = await import('../lib/game-engine');
  const { riderProfile } = await import('../lib/rider-profile');
  const R = (kind: Rider['kind'], id: string, dest: number, extra: Partial<Rider> = {}) => ({ id, kind, destination: dest, patience: 0, boardedAt: 61, fareBonus: 0, stash: 0, volatile: false, ...extra }) as Rider;
  const st = { ...initialRun(), floor: 63, status: 'playing', coins: 40, dismissalsUsed: 2, items: ['dismiss'], cabin: [R('drunk', 'a', 66), R('severer', 's', 70), null, null, null, null] } as RunState;
  assert.equal(E.itemUsable(st, 'dismiss', st.cabin[1]), false, 'the Exit Pass does not take the Severer');
  const off = E.dismissRider(st, 's');
  assert.ok(!off.cabin.some(r => r?.kind === 'severer') && off.coins === 40, 'the Severer leaves free by ordinary dismissal, even with no dismissals left');
  const lover = R('lover', 'l', 66, { boardedAt: 63, localFareRatio: 1 / 3 });
  assert.equal(riderProfile(lover, [lover], 0).fare, 2, 'a short-trip Lover after 31F still pays 2');
  const ghost = R('ghost', 'g', 44, { boardedAt: 35 });
  assert.equal(riderProfile(ghost, [ghost], 0).fare, 9, 'a Ghost riding 9 floors pays 9 after 31F');
  console.log('playtest v10.2.7: Exit Pass and legends, 2-coin fare floor, Ghost fare verified');
}

// v10.2.9 (76F playtest, 66F): +7 agitation from 8/12. Calming alone cost 72 coins; the free manual relief was unused and
// dismissing the Taskmaster cost 10. The rescue plan now picks the cheapest way, counting the fares removed riders forgo.
{
  const E = await import('../lib/game-engine');
  const { calmRescuePlan } = await import('../lib/departure-guard');
  const R = (kind: Rider['kind'], id: string, stops: number, boardedAt: number, extra: Partial<Rider> = {}) => ({ id, kind, destination: 66 + stops, patience: 0, boardedAt, fareBonus: 0, stash: 0, volatile: false, ...extra }) as Rider;
  const shifterTraits = { weight: 0, energy: 1, agitation: 1, fare: 14, bond: { likes: ['commuter'], avoids: ['drunk'] }, conflictEffect: 'agitation', revision: 3, symbols: ['quiet', 'street'] } as unknown as Rider['traits'];
  const base = initialRun();
  const st = { ...base, floor: 66, status: 'playing', energy: 40, coins: 94, stress: 8, stressCap: 12, calmCharge: true, keepsakes: ['roundsLog'],
    upgrades: { ...base.upgrades, calm: 1, express: 1, tipjar: 1, meter: 1, punchcard: 1, finale: 1 },
    cabin: [R('parcel', 'p', 4, 66), R('taskmaster', 't', 3, 65, { volatile: true }), R('shifter', 's', 1, 63, { traits: shifterTraits }), R('ghost', 'g', 6, 63), R('creepychild', 'c', 3, 64), R('nurse', 'n', 1, 63)] } as RunState;
  const withManual = calmRescuePlan(st)!;
  assert.deepEqual([withManual.manual, withManual.remove.length, withManual.calm, withManual.cost], [true, 0, 1, 18], JSON.stringify(withManual));
  const noManual = calmRescuePlan({ ...st, calmCharge: false })!;
  assert.deepEqual(noManual.remove.map(r => [r.kind, r.paid]), [['taskmaster', 10]], JSON.stringify(noManual));
  assert.ok(noManual.cost + noManual.forfeit < 4 * E.calmPrice(66), 'dismissing the Taskmaster beats 72 coins of calming even counting his fare');
  console.log('playtest v10.2.9: the agitation rescue picks the free relief or a dismissal over costly calming');
}

// v10.2.10 (screenshots, 2F): a second Commuter drew a Quiet link but nothing moved on the rail. Each rail box now lists its
// sources from one settled preview of the next floor; the lines add up to the change, and the new rider moves only his own line.
{
  const { floorPreview, energyForecast } = await import('../lib/game-forecast');
  const R = (kind: Rider['kind'], id: string, dest: number, boardedAt: number) => ({ id, kind, destination: dest, patience: 0, boardedAt, fareBonus: 0, stash: 0, volatile: false }) as Rider;
  const cab = [R('lover', 'a', 7, 1), R('lover', 'b', 5, 1), R('commuter', 'c', 4, 1), null, null, R('matchmaker', 'm', 10, 1)];
  const st = { ...initialRun(), floor: 2, status: 'playing', energy: 48, coins: 0, stress: 0, cabin: cab } as RunState;
  const before = floorPreview(st)!, after = floorPreview({ ...st, cabin: [...cab.slice(0, 4), R('commuter', 'd', 7, 2), cab[5]] })!;
  const sum = (l: Array<{ amount: number }>) => l.reduce((n, x) => n + x.amount, 0);
  assert.equal(sum(after.energy), after.energyDelta, 'the power lines add up'); assert.equal(after.energyDelta, energyForecast({ ...st, cabin: [...cab.slice(0, 4), R('commuter', 'd', 7, 2), cab[5]] }).lowDelta);
  assert.deepEqual(after.energy, [{ label: '电梯运转', amount: -1 }, { label: '乘客耗电', amount: -4 }, { label: '安静绿线省电', amount: 2 }]);
  assert.deepEqual(before.energy.find(l => l.label === '乘客耗电'), { label: '乘客耗电', amount: -3 }, 'only the riders’ line moves');
  assert.deepEqual([after.stress, after.stressUnused], [[{ label: '人间绿线', amount: -1 }], 1], 'Hearth relief at 0 is shown as unused, not as +1');
  assert.equal(after.coinDelta, 0);
  assert.equal(floorPreview({ ...st, status: 'upgrade' }), null);
  console.log('playtest v10.2.10: rail source lists add up and show what a new rider moves');
}

// v10.2.11 (96F playtest): at 95F two dark riders could lash out (64% to boil over at 4/10). Calming to safe needed 96 coins,
// so the alert showed nothing; one 24-coin calm made it 16%, and dismissing the Taskmaster (8 coins) made it 0%.
{
  const { gambleRescuePlan } = await import('../lib/departure-guard');
  const { stressForecast } = await import('../lib/game-forecast');
  const R = (kind: Rider['kind'], id: string, dest: number, boardedAt: number, extra: Partial<Rider> = {}) => ({ id, kind, destination: dest, patience: 0, boardedAt, fareBonus: 0, stash: 0, volatile: false, ...extra }) as Rider;
  const base = initialRun();
  const st = { ...base, floor: 95, status: 'playing', energy: 40, coins: 37, stress: 4, stressCap: 10, calmCharge: false, dismissalsUsed: 1,
    upgrades: { ...base.upgrades, calm: 1, reinforced: 1, express: 1, tipjar: 1, punchcard: 1, finale: 1 },
    cabin: [null, R('madbomber', 'm', 100, 95, { volatile: true, fuse: 999 } as Partial<Rider>), null, null, R('taskmaster', 't', 97, 93, { volatile: true }), R('noisemaker', 'n', 98, 94)] } as RunState;
  assert.equal(Math.round((stressForecast(st).lossChance ?? 0) * 100), 64);
  const plan = gambleRescuePlan(st, 0.2)!;
  // v10.3: the Taskmaster's fare rose to 15, so losing his fare now costs more than the Noisemaker's (10 paid + 12
  // forfeited); the cheapest plan that brings the gamble under 20% dismisses the Noisemaker instead.
  assert.deepEqual([plan.remove.map(r => [r.kind, r.paid]), plan.calm, Math.round(plan.chance * 100)], [[['noisemaker', 10]], 0, 16], JSON.stringify(plan));
  const noDismissal = gambleRescuePlan({ ...st, dismissalsUsed: 2 }, 0.2)!;
  assert.deepEqual([noDismissal.remove.length, noDismissal.calm, noDismissal.cost, Math.round(noDismissal.chance * 100)], [0, 1, 24, 16], JSON.stringify(noDismissal));
  assert.equal(gambleRescuePlan({ ...st, stress: 0, cabin: [null, null, null, null, null, R('commuter', 'c', 97, 94)] }, 0.2), null, 'no plan when there is no gamble');
  console.log('playtest v10.2.11: the boil-over alert offers the cheapest affordable way down');
}

// v10.2.12 (player: before losing, the game suggested paying while the bag held items): items already owned come first in
// every rescue (agitation must-fail, boil-over gamble and power), and they cost no coins.
{
  const { calmRescuePlan, gambleRescuePlan, rescuePlan } = await import('../lib/departure-guard');
  const R = (kind: Rider['kind'], id: string, dest: number, boardedAt: number, extra: Partial<Rider> = {}) => ({ id, kind, destination: dest, patience: 0, boardedAt, fareBonus: 0, stash: 0, volatile: false, ...extra }) as Rider;
  const base = initialRun();
  const traits = { weight: 0, energy: 1, agitation: 1, fare: 14, bond: { likes: ['commuter'], avoids: ['drunk'] }, conflictEffect: 'agitation', revision: 3, symbols: ['quiet', 'street'] } as unknown as Rider['traits'];
  const s66 = { ...base, floor: 66, status: 'playing', energy: 40, coins: 94, stress: 8, stressCap: 12, calmCharge: false, upgrades: { ...base.upgrades, calm: 1 }, items: ['aroma', 'sedative', 'cell', 'swap'],
    cabin: [R('parcel', 'p', 70, 66), R('taskmaster', 't', 69, 65, { volatile: true }), R('shifter', 's', 67, 63, { traits }), R('ghost', 'g', 72, 63), R('creepychild', 'c', 69, 64), R('nurse', 'n', 67, 63)] } as RunState;
  const calm = calmRescuePlan(s66)!;
  assert.deepEqual([calm.items.map(u => u.key).sort(), calm.calm, calm.cost, calm.remove.length], [['aroma', 'sedative'], 0, 0, 0], JSON.stringify(calm));
  assert.equal(calmRescuePlan({ ...s66, items: [] })!.cost > 0, true, 'without items the rescue costs coins');
  const s95 = { ...base, floor: 95, status: 'playing', energy: 40, coins: 37, stress: 4, stressCap: 10, dismissalsUsed: 2, upgrades: { ...base.upgrades, calm: 1 }, items: ['aroma', 'sedative'],
    cabin: [null, R('madbomber', 'm', 100, 95, { volatile: true, fuse: 999 } as Partial<Rider>), null, null, R('taskmaster', 't', 97, 93, { volatile: true }), R('noisemaker', 'n', 98, 94)] } as RunState;
  const gamble = gambleRescuePlan(s95, 0.2)!;
  assert.deepEqual([gamble.items.length, gamble.cost, gamble.chance < 0.2], [1, 0, true], JSON.stringify(gamble));
  const sp = { ...base, floor: 44, status: 'playing', energy: 3, coins: 40, stress: 0, items: ['cell'], cabin: [R('commuter', 'a', 47, 42), R('tourist', 'b', 47, 42), R('lover', 'c', 48, 43), null, null, null] } as RunState;
  const power = rescuePlan(sp)!;
  assert.deepEqual([power.items.map(u => u.key), power.charge, power.cost], [['cell'], 0, 0], JSON.stringify(power));
  const reserve = rescuePlan({ ...sp, items: [], reserveCell: true })!;
  assert.deepEqual([reserve.reserve, reserve.charge, reserve.cost], [true, 0, 0], JSON.stringify(reserve));
  console.log('playtest v10.2.12: rescues use the items in the bag before coins');
}

// v10.3 player ideas: an uncontrolled Thief beside a Ghost steals its power (+3 a floor); beside a Child he takes
// nothing and the Child cries (+1 agitation a floor). An Officer beside him stops both.
{
  const E = await import('../lib/game-engine');
  const { floorPreview } = await import('../lib/game-forecast');
  const R = (kind: Rider['kind'], id: string) => ({ id, kind, destination: 30, patience: 0, boardedAt: 20, fareBonus: 0, stash: 0, volatile: false }) as unknown as Rider;
  const at = (cabin: Array<Rider | null>) => ({ ...initialRun(), floor: 24, status: 'playing', energy: 40, coins: 0, stress: 0, stressCap: 10, cabin } as RunState);
  const line = (lines: Array<{ label: string; amount: number }>, label: string) => lines.find(l => l.label === label)?.amount ?? 0;
  const ghost = at([R('thief', 't'), R('ghost', 'g'), null, null, null, null]), afterGhost = E.resolveFloor(ghost, () => 0.9);
  assert.equal(line(afterGhost.lastEnergy.sources, '小偷偷幽灵的电'), E.THIEF_RULES.ghostPower, 'the Thief steals the Ghost’s power');
  assert.equal(line(afterGhost.lastEarnings.sources, '小偷顺手牵羊'), 0, 'and no coins from it');
  assert.equal(E.stealLink(ghost.cabin, 0, 1), 'power');
  assert.equal(floorPreview(ghost)!.energyDelta, afterGhost.lastEnergy.delta, 'the forecast counts the stolen power');
  assert.equal(E.energyBreakdown(ghost).theft, E.THIEF_RULES.ghostPower);
  const child = at([R('thief', 't'), R('child', 'c'), null, null, null, null]), afterChild = E.resolveFloor(child, () => 0.9);
  assert.equal(line(afterChild.lastPressure.sources, '小偷惹哭小孩'), E.THIEF_RULES.childAgitation, 'the Child cries');
  assert.equal(line(afterChild.lastEarnings.sources, '小偷顺手牵羊'), 0, 'a Child has nothing to steal');
  assert.equal(E.stealLink(child.cabin, 0, 1), 'tears');
  const held = at([R('cop', 'p'), R('thief', 't'), R('ghost', 'g'), null, null, null]), afterHeld = E.resolveFloor(held, () => 0.9);
  assert.equal(line(afterHeld.lastEnergy.sources, '小偷偷幽灵的电'), 0, 'a held Thief steals nothing');
  assert.equal(E.stealLink(held.cabin, 1, 2), 0);
  for (const label of ['小偷偷幽灵的电', '小偷惹哭小孩', '顺手牵羊 +2金币 +3电/层 · 惹哭儿童 +1躁动', '惹哭儿童 · +2躁动/层']) assert.doesNotMatch(translateGameText(label, 'en'), /[㐀-鿿]/, label);
  // A legend's pockets are the deepest; the Don and the Kingpin are not robbed.
  const legend = at([R('thief', 't'), R('operator', 'o'), null, R('celebrity', 'c'), null, null]), afterLegend = E.resolveFloor(legend, () => 0.9);
  assert.equal(E.pickpocketFrom(R('operator', 'o')), E.THIEF_RULES.legendCoins); assert.ok(E.THIEF_RULES.legendCoins > 4, 'more than from a Celebrity');
  assert.equal(line(afterLegend.lastEarnings.sources, '小偷顺手牵羊'), E.THIEF_RULES.legendCoins + 4, 'legend and Celebrity are both robbed');
  assert.equal(E.stealLink(legend.cabin, 0, 1), E.THIEF_RULES.legendCoins);
  assert.equal(E.pickpocketFrom(R('nightoperator', 'n')), E.THIEF_RULES.legendCoins, 'dark legends too');
  for (const boss of ['don', 'kingpin'] as const) assert.equal(E.pickpocketFrom(R(boss, 'b')), 0, boss);
  assert.equal(E.resolveFloor(at([R('cop', 'p'), R('thief', 't'), R('operator', 'o'), null, null, null]), () => 0.9).lastEarnings.sources.some(l => l.label === '小偷顺手牵羊'), false, 'a held Thief does not rob the legend');
  console.log('playtest v10.3: the Thief takes a Ghost’s power, makes a Child cry and robs legends');
}

// v10.3 the simpler ability step: one free pick per shop and no prices. With a free slot it is a new ability; with all six
// full it is one free level-up. No second card for coins, no reroll.
{
  const E = await import('../lib/game-engine');
  const { ABILITY_SHOP } = await import('../lib/shop-effects');
  assert.deepEqual(ABILITY_SHOP, { extra: false, reroll: false, level2Free: true });
  const base = { ...initialRun(), status: 'upgrade', floor: 20, coins: 200, shop: [{ key: 'battery', price: 0, purchased: false }, { key: 'concierge', price: 0, purchased: false }, { key: 'express', price: 0, purchased: false }] } as RunState;
  const picked = E.installUpgrade(base, 'battery');
  assert.equal(picked.upgrades.battery, 1); assert.equal(picked.coins, 200, 'the pick is free');
  assert.equal(E.availableShopCards(picked).length, 0, 'the other cards lock after the pick');
  assert.equal(E.installUpgrade(picked, 'concierge'), picked, 'no second ability for coins');
  assert.equal(E.rerollShop(base, () => 0.5), base, 'no reroll');
  const full = { ...base, floor: 70, coins: 0, upgrades: { ...base.upgrades, battery: 1, concierge: 1, express: 1, reinforced: 1, tipjar: 1, meter: 1 } } as RunState;
  assert.equal(E.abilityLevel2Price(full), 0); assert.ok(E.canRaiseAbility(full, 'battery'), 'a level-up is free, even with no coins');
  const raised = E.raiseAbility(full, 'battery');
  assert.equal(raised.upgrades.battery, 2); assert.equal(raised.coins, 0);
  assert.equal(E.canRaiseAbility(raised, 'concierge'), false, 'one level-up per shop');
  assert.equal(E.canRaiseAbility({ ...full, upgrades: { ...full.upgrades, meter: 0 } } as RunState, 'battery'), false, 'level-ups start once all six slots are full');
  assert.doesNotMatch(translateGameText(raised.message, 'en'), /[㐀-鿿]/, 'the level-up message reads in English');
  console.log('playtest v10.3: one free ability pick per shop; a free level-up once the slots are full');
}

// v10.3 price scheme: shop power on one ramp, upper box levels at 60 / 120, items that follow depth.
{
  const { BOX_PRICES, CHARGE_DEPTH, EMPTY_BOX, chargeUnitPrice, emergencyUnitPrice } = await import('../lib/power-box');
  const { ITEMS, itemPrice } = await import('../lib/dark-rules');
  const { calmPrice } = await import('../lib/game-engine');
  const unit = (shop: number, transformer = 0) => Number(chargeUnitPrice({ ...EMPTY_BOX, transformer }, shop).toFixed(3));
  assert.deepEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(f => unit(f)), [1.2, 1.2, 1.2, 1.2, 1.6, 2, 2.4, 2.8, 2.8, 2.8], 'power by shop without a transformer');
  for (let i = 1; i < CHARGE_DEPTH.length; i++) assert.ok(CHARGE_DEPTH[i] >= CHARGE_DEPTH[i - 1] && CHARGE_DEPTH[i] - CHARGE_DEPTH[i - 1] <= 0.2 + 1e-9, 'no step in the ramp is more than 0.2');
  assert.equal(unit(45), unit(50), 'a floor between shops is priced like the next shop');
  assert.deepEqual(BOX_PRICES, [15, 60, 120]);
  // An item's listed price is what it costs on the floor it first appears.
  for (const key of ['cell', 'aroma', 'sedative', 'flare', 'longflare'] as const) assert.equal(itemPrice(key, ITEMS[key].from), ITEMS[key].price, key);
  assert.deepEqual([10, 40, 60, 80, 100].map(f => itemPrice('cell', f)), [20, 24, 28, 32, 36], 'a Spare Cell follows depth');
  assert.equal(itemPrice('cell', 80, 1), 48, 'a repeat still costs half as much again');
  for (const shop of [30, 40, 50, 60, 70, 80, 90, 100]) {
    // Carried goods stay near what the shop charges for the same thing there, and under the price of a rescue in transit.
    const cell = itemPrice('cell', shop) / 15, aroma = itemPrice('aroma', shop) / 2;
    assert.ok(cell >= unit(shop, 3) && cell < emergencyUnitPrice({ ...EMPTY_BOX }), `Spare Cell at ${shop}F: ${cell}`);
    assert.ok(Math.abs(aroma / calmPrice(shop) - 1) <= 0.15, `Incense at ${shop}F: ${aroma} against ${calmPrice(shop)}`);
  }
  console.log('playtest v10.3: power ramp, box levels 15 / 60 / 120, items follow depth');
}
