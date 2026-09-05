import {fileURLToPath} from 'node:url';
// The only binding to the game checkout. No copied balance constants.
export * as E from '../../lib/game-engine.ts';
export {consumeReserveCell} from '../../lib/game-engine.ts';
export * as D from '../../lib/game-data.ts';
export * as R from '../../lib/rider-profile.ts';
export * as F from '../../lib/game-forecast.ts';
export * as I from '../../lib/game-interaction.ts';
export * as S from '../../lib/shop-effects.ts';
export * as U from '../../lib/shift-rules.ts';
export * as B from '../../lib/balance-v832.ts';
export * as P from '../../lib/passenger-presentation.ts';
export { GAME_VERSION } from '../../lib/changelog.ts';
export type { Rider, RunState } from '../../lib/game-engine.ts';
export type { PassengerKind, UpgradeKey } from '../../lib/game-data.ts';
export const GAME_ROOT = fileURLToPath(new URL('../../',import.meta.url));
