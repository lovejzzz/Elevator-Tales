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
export const BOX_PRICES = [15, 35, 60];
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
/** v9.19: early shops sell power at a discount, so a careful early run is not starved (cautious-player aid).
 * v10.1.2: up to 40F at 40% off — a first real playtest ran dry at 26F; the novice bot goes 31→54F, skilled play unchanged. */
export const EARLY_CHARGE = { until: 40, factor: 0.6 };
/** v10.2.5: shop power costs 25% more from the 61F shop on (after midnight), where skilled runs held 250–300 coins. */
export const LATE_CHARGE = { from: 61, factor: 1.25 };
export const chargeUnitPrice = (box: PowerBox, floor = Infinity) => CHARGE_PRICES[box.transformer] * (floor <= EARLY_CHARGE.until ? EARLY_CHARGE.factor : floor >= LATE_CHARGE.from && floor !== Infinity ? LATE_CHARGE.factor : 1);
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
