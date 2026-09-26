import assert from 'node:assert/strict';
import { boxLevelPrice, buyBoxLevel, chargeBattery, emergencyRepairPlan, initialRun, installUpgrade, leaveShop, repairEmergency, shopRescueShortfall, type RunState } from '../lib/game-engine';

// v10.2.3 playtest record: reached the 30F shop at agitation 13/8 with 101 coins, took Battery free, bought Buffer (40)
// and a power-box level, was left with 33 coins against a 48-coin rescue, and lost on leaving. Purchases may no longer
// spend the rescue money.
const shop = (): RunState => ({ ...initialRun(), floor: 29, status: 'upgrade', energy: 10, stress: 13, stressCap: 8, coins: 101,
  upgrades: { ...initialRun().upgrades, express: 1, relay: 1 }, box: { storage: 1, transformer: 0, motor: 0 },
  shop: [{ key: 'battery', price: 0, purchased: false }, { key: 'buffer', price: 0, purchased: false }, { key: 'calm', price: 0, purchased: false }] } as RunState);

let s = shop();
const rescue = emergencyRepairPlan(s).cost;
assert.equal(rescue, 48, 'six points over the cap at 8 coins');
s = installUpgrade(s, 'battery');
assert.equal(s.upgrades.battery, 1, 'the free pick costs nothing, so it is allowed');
s = installUpgrade(s, 'buffer');
assert.equal(s.upgrades.buffer, 1, 'a 40-coin extra still leaves 61 ≥ 48, so it is allowed');
assert.equal(s.coins, 61);
const price = boxLevelPrice(s, 'transformer');
assert.ok(s.coins - price < rescue, `the box level (${price}) would dip into the rescue`);
assert.equal(buyBoxLevel(s, 'transformer'), s, 'a power-box level that leaves the rescue unaffordable is refused');
assert.equal(chargeBattery(s, 20), s, 'charging that leaves the rescue unaffordable is refused');
assert.equal(shopRescueShortfall(s), 0);
const rescued = repairEmergency(s);
assert.equal(rescued.stress, 7, 'the minimum rescue stops one below the cap');
assert.equal(leaveShop(rescued).status, 'playing', 'after the rescue the shift goes on');
assert.equal(leaveShop(s).status, 'lost', 'leaving without the rescue still ends the shift');

// Out of a crisis nothing is held back.
const calm = { ...shop(), stress: 3 } as RunState;
assert.notEqual(buyBoxLevel(calm, 'transformer'), calm, 'without a crisis the box level can be bought');
console.log(`shop rescue: rescue ${rescue} coins held back; box level ${price} refused at 61 coins; rescue → agitation 7, shift continues`);
