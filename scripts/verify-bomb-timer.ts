import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { failureLesson, initialRun, resolveFloor, type Rider } from '../lib/game-engine';
import { PASSENGERS } from '../lib/game-data';
import { translateGameText } from '../lib/i18n';
import { PASSENGER_RULES, passengerFace } from '../lib/passenger-presentation';

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
assert.ok(exposed.every((line) => !/[\u3400-\u9fff]/u.test(translateGameText(line, 'en'))), 'Bomb Timer copy must translate completely');
assert.ok(exposed.every((line) => !/\bfuse\b/iu.test(translateGameText(line, 'en'))), 'English copy must use Bomb timer instead of fuse');

const unprotected = { ...initialRun(), floor: 1, cabin: [rider('bomb', 'unsafe', { fuse: 1, destination: 4 }), null, null, null, null, null] };
const failed = resolveFloor(unprotected, () => .9);
assert.equal(failed.status, 'lost');
assert.match(failed.message, /炸弹倒计时归零/u);
assert.match(failureLesson(failed), /偶数层倒计时不减/u);

const protectedRun = { ...initialRun(), floor: 1, cabin: [rider('cop', 'officer'), rider('bomb', 'protected', { fuse: 2 }), null, null, null, null] };
assert.equal(resolveFloor(protectedRun, () => .9).cabin[1]?.fuse, 2, 'Officer must pause the timer on even destination floors');

const arrivalRun = { ...initialRun(), floor: 1, cabin: [rider('bomb', 'arriving', { fuse: 1, destination: 2 }), null, null, null, null, null] };
assert.notEqual(resolveFloor(arrivalRun, () => .9).status, 'lost', 'zero on the arrival floor must remain safe');

const component = readFileSync(new URL('../components/elevator-game.tsx', import.meta.url), 'utf8');
assert.doesNotMatch(component, /引信/u, 'cabin, detail, and failure UI must use the new term');

console.log(JSON.stringify({ version: 'v8.18', visibleCopyChecks: exposed.length + 3, timerLifecycleChecks: 3, noFuseMetaphor: true }));
