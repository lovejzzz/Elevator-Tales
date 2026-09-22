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
  motor: { name: '电机', levels: ['41层起运转−1', '31层起运转−1', '所有楼层再−1（最低1）；5人以上每层+1躁动'] },
};

export const boxTotal = (box: PowerBox) => box.storage + box.transformer + box.motor;
export const storageCap = (box: PowerBox) => STORAGE_CAPS[box.storage];
export const shopEntryCharge = (box: PowerBox) => BASE_SHOP_ENTRY_CHARGE + 5 * box.storage;
export const emergencySectorCap = (box: PowerBox) => (box.storage >= BOX_MAX_LEVEL ? 10 : EMERGENCY_SECTOR_CAP);
export const chargeUnitPrice = (box: PowerBox) => CHARGE_PRICES[box.transformer];
/** Whole coins, rounded up, for a batch of shop charge. */
export const chargeCost = (box: PowerBox, units: number) => Math.ceil(units * chargeUnitPrice(box) - 1e-9);
/** Most units a wallet can buy at the box's shop price. */
export const affordableUnits = (box: PowerBox, coins: number) => Math.floor((coins + 1e-9) / chargeUnitPrice(box));
export const emergencyUnitPrice = (box: PowerBox) => (box.transformer >= BOX_MAX_LEVEL ? EMERGENCY_PRICES.topTransformer : EMERGENCY_PRICES.base);
export function motorReduction(level: number, destination: number) {
  if (level >= 3) return (destination >= 31 ? 1 : 0) + 1;
  if (level >= 2) return destination >= 31 ? 1 : 0;
  if (level >= 1) return destination >= 41 ? 1 : 0;
  return 0;
}
export const boxedMotorCost = (base: number, box: PowerBox, destination: number) => Math.max(1, base - motorReduction(box.motor, destination));
export const motorNoise = (box: PowerBox, occupied: number) => (box.motor >= BOX_MAX_LEVEL && occupied >= 5 ? 1 : 0);
