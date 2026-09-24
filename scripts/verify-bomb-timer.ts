import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BOMB_RULES, failureLesson, initialRun, resolveFloor, type Rider } from '../lib/game-engine';
import { PASSENGERS } from '../lib/game-data';
import { translateGameText } from '../lib/i18n';
import { PASSENGER_RULES, passengerFace } from '../lib/passenger-presentation';

// Floor-timer checks; the v9.18 real-time timer is verified in verify-v9.
BOMB_RULES.realtime = false;
const rider = (kind: Rider['kind'], id: string, extra: Partial<Rider> = {}): Rider => ({
  kind, id, boardedAt: 1, destination: 6, patience: 6, fareBonus: 0, ...extra,
});

const exposed = [
  PASSENGERS.bomb.short,
  PASSENGERS.bomb.detail,
  PASSENGERS.bomb.risk?.guide ?? '',
  ...PASSENGER_RULES.bomb,
  ...PASSENGER_RULES.cop,
  ...PASSENGER_RULES.lawyer,
  passengerFace(rider('bomb', 'face', { fuse: 4 }), { ...initialRun(), cabin: [rider('bomb', 'face', { fuse: 4 }), null, null, null, null, null] }).special,
];
assert.ok(exposed.every((line) => !/引信|延缓/u.test(line)), 'player-facing Bomb Timer copy must avoid metaphorical wording');
assert.ok(exposed.every((line) => !/偶数|奇数/u.test(line)), 'current Bomb Timer rules must not depend on odd/even floors');
assert.ok(exposed.every((line) => !/[\u3400-\u9fff]/u.test(translateGameText(line, 'en'))), 'Bomb Timer copy must translate completely');
assert.ok(exposed.every((line) => !/\bfuse\b/iu.test(translateGameText(line, 'en'))), 'English copy must use Bomb timer instead of fuse');

const unprotected = { ...initialRun(), floor: 1, cabin: [rider('bomb', 'unsafe', { fuse: 1, destination: 4 }), null, null, null, null, null] };
// v9.19: an ordinary Bomber at zero blows himself and his neighbours out and costs coins; the shift goes on.
const blasted = resolveFloor({ ...unprotected, coins: 30, cabin: [rider('bomb', 'unsafe', { fuse: 1, destination: 4 }), rider('commuter', 'near'), null, null, null, rider('tourist', 'far')] }, () => .9);
assert.equal(blasted.status, 'playing');
assert.deepEqual(blasted.lastBlast?.slots, [0, 1]);
assert.equal(blasted.cabin[5]?.id, 'far', 'riders not beside the bomb stay aboard');
// Only the Mad Bomber's contraption ends the shift, and the lesson names the Crooked Cop.
const failed = resolveFloor({ ...unprotected, cabin: [rider('madbomber', 'mad', { fuse: 1, destination: 4 }), null, null, null, null, null] }, () => .9);
assert.equal(failed.status, 'lost');
assert.match(failed.message, /炸弹倒计时归零/u);
assert.match(failureLesson(failed), /黑警/u);

const protectedRun = { ...initialRun(), floor: 1, cabin: [rider('cop', 'officer'), rider('bomb', 'protected', { fuse: 2 }), null, null, null, null] };
assert.equal(resolveFloor(protectedRun, () => .9).cabin[1]?.fuse, 2, 'Officer must lock the timer while adjacent');
assert.equal(resolveFloor({ ...protectedRun, floor: 2 }, () => .9).cabin[1]?.fuse, 2, 'Officer protection must not depend on odd/even floors');

const arrivalRun = { ...initialRun(), floor: 1, cabin: [rider('bomb', 'arriving', { fuse: 1, destination: 2 }), null, null, null, null, null] };
assert.notEqual(resolveFloor(arrivalRun, () => .9).status, 'lost', 'zero on the arrival floor must remain safe');

const component = readFileSync(new URL('../components/elevator-game.tsx', import.meta.url), 'utf8');
assert.doesNotMatch(component, /引信/u, 'cabin, detail, and failure UI must use the new term');

console.log(JSON.stringify({ version: 'v8.20', visibleCopyChecks: exposed.length + 3, timerLifecycleChecks: 3, noFuseMetaphor: true }));
