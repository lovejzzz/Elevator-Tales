import assert from 'node:assert/strict';
import { initialRun, resolveFloor, type Rider, type RunState } from '../lib/game-engine';
import { translateGameText } from '../lib/i18n';
import { ADJACENT } from '../lib/game-data';
import { CHAIN_RULES, arrivalChain, chainMultiplier, chainOutlook, chainPath } from '../lib/symbols';

// v10.3 the chain cash-in: riders getting off together, joined by green links of one symbol, have their fares
// multiplied from the fourth rider on (×3, ×6, ×12).
const R = (kind: Rider['kind'], id: string, dest: number) => ({ id, kind, destination: dest, patience: 0, boardedAt: 20, fareBonus: 0, stash: 0, volatile: false }) as unknown as Rider;
const quiet = ['commuter', 'inspector', 'commuter', 'inspector', 'commuter', 'inspector'] as const;
const cabinOf = (k: number, dest = 25) => quiet.map((kind, i) => i < k ? R(kind, `q${i}`, dest) : R('tourist', `t${i}`, 29));
const ride = (cabin: Array<Rider | null>) => resolveFloor({ ...initialRun(), floor: 24, status: 'playing', energy: 60, coins: 0, stress: 0, stressCap: 10, cabin } as RunState, () => 0.5, {}, () => 0.5);

assert.deepEqual([1, 2, 3, 4, 5, 6].map(k => chainMultiplier(k)), [1, 1, 1, 3, 6, 12], 'the multiplier ladder');
assert.equal(ride(cabinOf(3)).lastChain, undefined, 'three riders are not a chain');
for (const [k, m] of [[4, 3], [5, 6], [6, 12]] as const) {
  const after = ride(cabinOf(k)), chain = after.lastChain!;
  assert.ok(chain, `${k} riders chain`);
  assert.equal(chain.multiplier, m);
  assert.equal(chain.slots.length, k);
  assert.ok(chain.fares > 0 && chain.bonus === Math.round(chain.fares * (m - 1)), 'the bonus brings the fares paid up to ×m');
  // The fares are what those riders actually paid on arrival.
  const paid = after.lastArrivals!.filter(a => chain.slots.includes(a.slot)).reduce((n, a) => n + a.coins, 0);
  assert.ok(chain.fares <= paid, `fares ${chain.fares} are within the payouts ${paid}`);
  const line = after.lastEarnings.sources.find(l => l.label.includes('连锁'));
  assert.equal(line?.amount, chain.bonus, 'the coin lines carry the chain');
  assert.doesNotMatch(translateGameText(line!.label, 'en'), /[㐀-鿿]/, 'the chain line reads in English');
  assert.doesNotMatch(translateGameText(after.message, 'en'), /[㐀-鿿]/, 'the arrival message reads in English');
  // The show lights every chained seat once, each from a neighbour already lit.
  assert.deepEqual(chain.path.map(([s]) => s).sort((a, b) => a - b), [...chain.slots].sort((a, b) => a - b));
  chain.path.forEach(([s, from], i) => { if (i) assert.ok(from !== null && ADJACENT.some(([a, b]) => (a === s && b === from) || (a === from && b === s)) && chain.path.slice(0, i).some(([x]) => x === from), `seat ${s} lit from a lit neighbour`); });
}
// Linked riders who get off on different floors are no chain; neither are riders who share a stop but no link.
assert.equal(ride(quiet.map((kind, i) => R(kind, `d${i}`, i < 2 ? 25 : 26))).lastChain, undefined, 'split stops break the chain');
assert.equal(arrivalChain([R('tourist', 'a', 25), R('commuter', 'b', 25), R('tourist', 'c', 25), R('commuter', 'd', 25), null, null], [0, 1, 2, 3]).slots.length, 0, 'no shared symbol, no chain');
// The coin box sees a chain forming before it pays.
assert.deepEqual(chainOutlook(cabinOf(3, 27), 24), { symbol: chainOutlook(cabinOf(3, 27), 24)!.symbol, size: 3, stop: 27, slots: [0, 1, 2] });
assert.equal(chainOutlook([R('commuter', 'x', 27), R('inspector', 'y', 28), null, null, null, null], 24), null, 'riders on different stops are not forming anything');
assert.ok(chainPath(cabinOf(6), arrivalChain(cabinOf(6), [0, 1, 2, 3, 4, 5])).length === 6);
assert.equal(CHAIN_RULES.on, 'paid');
console.log('v10.3 chain cash-in: ladder, paid fares, coin line, English text and the lighting order verified');
