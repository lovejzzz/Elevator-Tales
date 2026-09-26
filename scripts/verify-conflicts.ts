// v10 symbol links: the rulebook the old per-kind like/avoid tables used to be (lib/symbols.ts).
import assert from 'node:assert/strict';
import { PASSENGER_ORDER, isAnyLegend, isDark, type PassengerKind } from '../lib/game-data';
import { EMPTY_UPGRADES, energyBreakdown, initialRun, resolveFloor, symbolCoins, type Rider, type RunState } from '../lib/game-engine';
import { stressForecast } from '../lib/game-forecast';
import { conflictLinks, randomTraits } from '../lib/rider-profile';
import { RIDER_SYMBOLS, SYMBOLS, SYMBOL_KEYS, greenBySymbol, opposes, pairLink, redCount, symbolLedger, symbolShapes, symbolsOf, type SymbolKey } from '../lib/symbols';

const rider = (kind: PassengerKind, id: string, extra: Partial<Rider> = {}): Rider => ({ kind, id, destination: 20, patience: 0, boardedAt: 1, fareBonus: 0, ...extra });
const state = (cabin: Array<Rider | null>, extra: Partial<RunState> = {}): RunState => ({ ...initialRun(), floor: 20, energy: 50, stressCap: 99, coins: 100, cabin, ...extra });
const amount = (lines: Array<{ label: string; amount: number }>, label: string) => lines.find(line => line.label === label)?.amount ?? 0;
const seat = (...kinds: Array<PassengerKind | null>) => [...kinds, ...Array(6 - kinds.length).fill(null)].map((k, i) => k ? rider(k, `${k}-${i}`) : null);

// Every ordinary and dark rider carries exactly two symbols, never a pair of opposites.
const symbolled = PASSENGER_ORDER.filter(k => !isAnyLegend(k) && !['parcel', 'mystery', 'shifter', 'mimic'].includes(k));
for (const kind of symbolled) {
  const s = RIDER_SYMBOLS[kind];
  assert.ok(s && s.length === 2 && s[0] !== s[1] && !opposes(s[0], s[1]), `${kind} has two non-opposite symbols`);
}
// Each symbol is on at least four day riders, so every symbol can be built around before midnight.
for (const k of SYMBOL_KEYS) assert.ok(symbolled.filter(kind => !isDark(kind) && RIDER_SYMBOLS[kind]!.includes(k)).length >= 4, `${SYMBOLS[k].zh} on four day riders`);

// Shared minus opposite, one for one.
assert.deepEqual(pairLink(['quiet', 'order'], ['lively', 'order']), { shared: [], clashes: [] }, 'one match and one clash draw no line');
assert.deepEqual(pairLink(['quiet', 'order'], ['quiet', 'order']).shared, ['quiet', 'order'], 'identical symbols: two green links');
assert.equal(pairLink(['quiet', 'order'], ['lively', 'street']).clashes.length, 2, 'both symbols opposite: two red links');
assert.equal(conflictLinks(seat('commuter', 'drunk')).length, 2);
assert.equal(conflictLinks(seat('commuter', 'cop')).length, 0);
assert.equal(amount(resolveFloor(state(seat('commuter', 'drunk')), () => .9).lastPressure.sources, '红线躁动'), 2, 'each red link adds 1 agitation');
assert.equal(energyBreakdown(state(seat('courier', 'ghost'))).conflict, 0, 'red links never cost power');
assert.equal(amount(resolveFloor(state(seat('drunk', 'inspector')), () => .9).lastEarnings.sources, '红线金币损失'), 0, 'red links never cost coins');

// A symbol with any green link works once; shapes raise its level (row +1, square +2, full +4 and nothing else).
const threeTourists = seat('tourist', 'tourist', 'tourist');
assert.deepEqual(greenBySymbol(threeTourists), { lively: 2, hearth: 2 }, 'a row of Tourists: Lively and Hearth at level 2');
assert.equal(greenBySymbol(seat('tourist', 'tourist', null, 'tourist')).lively, 1, 'many links, no shape: level 1');
const square = seat('tourist', 'tourist', null, 'tourist', 'tourist');
assert.equal(greenBySymbol(square).lively, 3, 'a 2×2 square: level 3');
const full = seat('tourist', 'tourist', 'tourist', 'tourist', 'tourist', 'tourist');
assert.equal(greenBySymbol(full).lively, 5, 'a full cabin: level 5, its rows and squares not counted again');
assert.deepEqual(symbolShapes(full).map(s => s.kind), ['full', 'full']);

// The six effects, per level and per floor.
const ledger = (kinds: Array<PassengerKind | null>) => symbolLedger(seat(...kinds));
assert.equal(ledger(['tourist', 'child']).coins, 2, 'Lively +2 coins');
assert.deepEqual(ledger(['tourist', 'child']).agitationLines, [{ label: '人间绿线', amount: -1 }], 'Hearth −1 agitation');
const street = ledger(['drunk', 'coach']);
assert.equal(street.lines.find(l => l.label.startsWith('江湖'))?.amount, 2, 'Street +2 coins');
assert.ok(!street.agitationLines.some(l => l.label.startsWith('江湖')), 'v10.1: Street green links add no agitation');
assert.deepEqual(ledger(['commuter', 'inspector']).agitationLines, [{ label: '秩序绿线', amount: -1 }], 'Order −1 agitation');
assert.equal(ledger(['commuter', 'inspector']).power, 1, 'Quiet saves 1 power');
assert.equal(ledger(['ghost', 'thief']).power, 1, 'Spirit saves 1 power');
// Power saved never exceeds what the riders themselves use (two Ghosts use no power).
assert.equal(energyBreakdown(state(seat('ghost', 'ghost'))).symbol, 0);
const quietPair = state(seat('commuter', 'inspector'));
assert.equal(energyBreakdown(quietPair).symbol, 1);
assert.equal(amount(resolveFloor(quietPair, () => .9).lastEnergy.sources, '符号绿线省电'), 1, 'settlement saves what the forecast shows');
assert.ok((stressForecast(quietPair).sources ?? []).some(s => s.label === '秩序绿线'), 'the agitation forecast lists the Order calm');

// The Battery and the Red String add 2 per level of a coin symbol.
assert.equal(symbolCoins({ cabin: seat('tourist', 'child'), upgrades: { ...EMPTY_UPGRADES, battery: 1 }, keepsakes: [] } as unknown as RunState).coins, 4);
assert.equal(symbolCoins({ cabin: seat('tourist', 'child'), upgrades: EMPTY_UPGRADES, keepsakes: ['redString'] } as unknown as RunState).coins, 4);

// Variable riders: the Mimic shows the symbols above him, the Mystery none until revealed, the Shifter two random ones.
const mimicCabin = [rider('ghost', 'g'), null, null, rider('mimic', 'm'), null, null];
assert.deepEqual(symbolsOf(mimicCabin[3], mimicCabin, 3), RIDER_SYMBOLS.ghost);
assert.deepEqual(symbolsOf(rider('mimic', 'm'), [null, null, null, rider('mimic', 'm'), null, null], 3), []);
assert.deepEqual(symbolsOf(rider('mystery', 'x', { identity: 'magnate' })), []);
assert.deepEqual(symbolsOf(rider('mystery', 'x', { identity: 'magnate', revealed: true })), ['lively', 'order']);
let seed = 5; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (let i = 0; i < 200; i++) { const sy = randomTraits('shifter', ['commuter', 'tourist'], rng).symbols as SymbolKey[]; assert.ok(sy.length === 2 && sy[0] !== sy[1] && !opposes(sy[0], sy[1])); }

// Legends and boxes carry no symbols and draw no symbol lines.
assert.equal(redCount(seat('matchmaker', 'commuter', 'parcel')), 0);

console.log(JSON.stringify({ version: 'v10', symbolled: symbolled.length, perSymbol: Object.fromEntries(SYMBOL_KEYS.map(k => [k, symbolled.filter(kind => RIDER_SYMBOLS[kind]!.includes(k)).length])) }));
