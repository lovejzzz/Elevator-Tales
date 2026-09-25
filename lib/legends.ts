import { DARK_LEGEND_POWER, LEGEND_KINDS, type LegendKind } from './game-data';

/** v9 legends ride floor 1 → floor 10 and leave a permanent keepsake on delivery.
 * Keepsakes live in their own row and never use one of the six ability slots. */
export type KeepsakeKey = 'wrench' | 'redString' | 'pocketWatch' | 'roundsLog' | 'vinyl' | 'bell' | 'stock';
export const KEEPSAKE_KEYS: KeepsakeKey[] = ['wrench', 'redString', 'pocketWatch', 'roundsLog', 'vinyl', 'bell', 'stock'];
export const LEGEND_KEEPSAKE: Record<LegendKind, KeepsakeKey | 'random'> = {
  operator: 'wrench', matchmaker: 'redString', don: 'pocketWatch', matron: 'roundsLog',
  nightingale: 'vinyl', medium: 'bell', tycoon: 'stock', stranger: 'random',
};
export const KEEPSAKES: Record<KeepsakeKey, { name: string; description: string }> = {
  wrench: { name: '老周的扳手', description: '配电箱免费升1级；此后每次升级便宜5金币。' },
  redString: { name: '红绳', description: '赚钱的符号（🎉热闹、🎲江湖）每级绿线每层 +2 金币；此后未配对恋人呼唤同伴的概率为35%。' },
  pocketWatch: { name: '怀表', description: '坏人链接每层多存1金币；坏人链接躁动每层最多1点。' },
  roundsLog: { name: '查房记录', description: '躁动上限+2；每次进商店躁动−3；低躁动关门时，每位正常到站乘客再+1金币；检查员印章只需1层低躁动。' },
  vinyl: { name: '黑胶唱片', description: '音乐家提前出现（不必等到16层）；中躁动时每位音乐家演出收入再+2金币，每位正常到站乘客小费再+2。' },
  bell: { name: '招魂铃', description: '幽灵永久视为受控：不再延误邻座，到站+2金币；另外每位幽灵到站再+3金币。' },
  stock: { name: '股票凭证', description: '每次进商店，未花金币得15%利息，最多+12金币。' },
};

export const LEGEND_DESTINATION = 10;
export const LEGEND_DECLINE_COINS = 10;
export const LEGEND_POOL_DEFAULT: LegendKind[] = [...LEGEND_KINDS];
/** Legends unlocked after the first finished run; the rest are earned. */
export const LEGEND_STARTERS: LegendKind[] = ['operator', 'matchmaker', 'matron', 'tycoon'];

// Tunable legend values. One catalog, read by settlement, forecasts and the UI.
export const LEGEND_RULES = {
  operatorMotorSaving: 1,
  wrenchDiscount: 5,
  matchmakerLoverCall: 0.5,
  matchmakerNeighbourCoins: 3,
  redStringBond: 2,
  redStringLoverCall: 0.35,
  donStashPerFloor: 7,
  donAgitation: 1,
  matronCabinCalm: 1,
  matronBadNeighbourAgitation: 2,
  nightingaleMediumCoins: 7,
  mediumSeanceCoins: 3,
  matronQuietCoins: 2,
  tycoonPrepay: 10,
  tycoonBalance: 40,
  strangerKeepsakeCoins: 20,
  musicianMediumCoins: 2,
  vinylMusicianBonus: 2,
  stockRate: 0.15,
  stockCap: 12,
};

/** Legends who hold ghosts under control, alongside an Exorcist. */
export const GHOST_CONTROLLERS = ['exorcist', 'medium'] as const;
export const CHILD_CARERS = ['lover', 'nurse', 'matron'] as const;
export const DRUNK_CARERS = ['nurse', 'matron'] as const;

/** v9.20 dark legends: one waits as a fourth card when leaving the 60F shop and rides to the 70F shop.
 * Each pays in its own way and costs in its own way; tuned in scripts/balance-sim. */
export const DARK_LEGEND_RULES = {
  from: 60, destination: 70,
  nightOperatorSaving: 2, nightOperatorAgitation: 1, nightOperatorBoxLevels: 1,
  severerPerRed: 3, severerPerGreen: 1, severerPay: 25,
  kingpinStash: 7, kingpinAgitation: 1, kingpinDismissal: 30,
  coldMatronCalm: 2, coldMatronPower: DARK_LEGEND_POWER, coldMatronCap: 2,
  bansheeAgitation: 1, bansheeHighCoins: 10, bansheePay: 15,
  necromancerPerDark: 2, necromancerAgitation: 1, necromancerPay: 20,
  highRollerPerPoint: 8, // v9.20.3: pays per point of agitation when the doors close before 70F (was +40 unless high / −40)
  thirteenCoins: 8, thirteenAgitation: 2, thirteenPower: 2, thirteenPayMax: 25,
};
