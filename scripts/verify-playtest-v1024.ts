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
