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
