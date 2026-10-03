/** v9 power box: the elevator's own long-term investment, bought with coins at shops.
 * Three lines of three levels; one level per shop and five levels per run, so no run
 * can max every line. Each line's top level carries a drawback. */
export type BoxLine = 'storage' | 'transformer' | 'motor';
export type PowerBox = Record<BoxLine, number>;

export const BOX_LINES: BoxLine[] = ['storage', 'transformer', 'motor'];
export const EMPTY_BOX: PowerBox = { storage: 0, transformer: 0, motor: 0 };
export const BOX_MAX_LEVEL = 3;
export const BOX_TOTAL_CAP = 5;
/** Price of the next level, indexed by the line's current level. */
/** v10.3: the second and third levels cost 45 / 80 (they were 35 / 60). A level pays for itself several times over a run,
 * and with the ability step free this is the mid-run purchase that takes coins back; the first level stays 15. */
export const BOX_PRICES = [15, 45, 80];
export const STORAGE_CAPS = [60, 75, 90, 110];
export const CHARGE_PRICES = [2, 1.75, 1.5, 1.25];
export const BASE_SHOP_ENTRY_CHARGE = 5;
export const EMERGENCY_PRICES = { base: 4, topTransformer: 3 };
export const EMERGENCY_SECTOR_CAP = 20;

export const BOX_LINE_LABELS: Record<BoxLine, { name: string; levels: string[] }> = {
  storage: { name: '蓄电', levels: ['电量上限75；进商店免费补10电', '电量上限90；进商店免费补15电', '电量上限110；进商店免费补20电；途中补电上限降为每十层10电'] },
  transformer: { name: '变压', levels: ['充电1.75金币/电', '充电1.5金币/电', '充电1.25金币/电；途中补电3金币/电'] },
  motor: { name: '电机', levels: ['每三层运转−1', '偶数层运转−1', '每3层有2层运转−1'] },
};

export const boxTotal = (box: PowerBox) => box.storage + box.transformer + box.motor;
export const storageCap = (box: PowerBox) => STORAGE_CAPS[box.storage];
export const shopEntryCharge = (box: PowerBox) => BASE_SHOP_ENTRY_CHARGE + 5 * box.storage;
export const emergencySectorCap = (box: PowerBox) => (box.storage >= BOX_MAX_LEVEL ? 10 : EMERGENCY_SECTOR_CAP);
/** Shop power by depth: the factor on the unit price at each shop (10F, 20F, …; the last entry holds from there on).
 * v9.19 / v10.1.2: 40% off up to the 40F shop — a first real playtest ran dry at 26F, and the novice bot loses 3 floors
 * if the 30F and 40F shops cost more.
 * v10.3: one even ramp after that (+0.2 a shop to 80F) instead of two cliffs (0.6 → 1 at the 50F shop, 1.25 from 70F).
 * The recorded player's charge bill doubled at the 50F shop (40–68 → 74–119 coins) and nothing else was bought after it. */
export const CHARGE_DEPTH = [0.6, 0.6, 0.6, 0.6, 0.8, 1, 1.2, 1.4];
export const chargeDepthFactor = (floor = Infinity) => floor === Infinity ? 1 : CHARGE_DEPTH[Math.min(CHARGE_DEPTH.length - 1, Math.max(0, Math.ceil(floor / 10) - 1))];
export const chargeUnitPrice = (box: PowerBox, floor = Infinity) => CHARGE_PRICES[box.transformer] * chargeDepthFactor(floor);
/** Whole coins, rounded up, for a batch of shop charge. */
export const chargeCost = (box: PowerBox, units: number, floor = Infinity) => Math.ceil(units * chargeUnitPrice(box, floor) - 1e-9);
/** Most units a wallet can buy at the box's shop price. */
export const affordableUnits = (box: PowerBox, coins: number, floor = Infinity) => Math.floor((coins + 1e-9) / chargeUnitPrice(box, floor));
export const emergencyUnitPrice = (box: PowerBox) => (box.transformer >= BOX_MAX_LEVEL ? EMERGENCY_PRICES.topTransformer : EMERGENCY_PRICES.base);
/** v9.7 motor for the flat motor schedule: level 1 saves 1 on even floors, level 2+ on every floor (never below 1).
 * Level 3 adds a quiet motor that cancels 1 late-night unrest (see cabinPressureLines). */
export const MOTOR_BOX = { l1Every: 3, l2Every: 2 };
/** v9.7 motor for the flat motor schedule: level 1 saves 1 every third floor, level 2 on every even floor
 * (never below 1). Level 3 adds a quiet motor that cancels 1 late-night unrest (see cabinPressureLines). */
export function motorReduction(level: number, destination: number) {
  // v9.19.1: late-night unrest is gone, so level 3 (it used to quiet the unrest) now saves 1 on two floors in three.
  if (level >= 3) return destination % 3 !== 0 ? 1 : 0;
  if (level >= 2) return destination % MOTOR_BOX.l2Every === 0 ? 1 : 0;
  if (level >= 1) return destination % MOTOR_BOX.l1Every === 0 ? 1 : 0;
  return 0;
}
export const boxedMotorCost = (base: number, box: PowerBox, destination: number) => Math.max(1, base - motorReduction(box.motor, destination));
export const motorNoise = (_box: PowerBox, _occupied: number) => 0;
