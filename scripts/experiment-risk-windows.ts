import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { CHARGE_PRICE, initialRun, resolveFloor, type Rider, type RunState } from '../experiments/v8.31/lib/game-engine';

let id = 0;
const rider = (kind: Rider['kind'], destination: number): Rider => ({ id: `window-${id++}`, kind, destination, boardedAt: 1, fareBonus: 0, patience: 0 });
const state = (cabin: Array<Rider | null>, extra: Partial<RunState> = {}): RunState => ({ ...initialRun(), cabin: [...cabin, ...Array(6 - cabin.length).fill(null)], ...extra });
const rng = () => 0;

const theft = [3, 4, 5, 6].map(trip => ({ trip, variants: (['cop', 'nurse', 'musician'] as const).map(support => {
  let s = state([rider('thief', trip + 1), rider(support, trip + 1)]);
  for (let n = 0; n < trip; n++) s = resolveFloor(s, rng);
  return { support, coins: s.coins, energySpent: 50 - s.energy, stress: s.stress, status: s.status,
    replacementCostAdjustedCoins: s.coins - CHARGE_PRICE * (50 - s.energy) };
}) }));
assert.ok(theft[0].variants[0].coins > theft[0].variants[1].coins);
assert.ok(theft[3].variants[0].coins < theft[3].variants[1].coins);

const delay = [1, 2, 3].map(companions => {
  const cabin: Array<Rider | null> = [rider('ghost', 9), rider('tourist', 3), null, null, null, null];
  if (companions >= 2) cabin[2] = rider('commuter', 9);
  if (companions >= 3) cabin[4] = rider('commuter', 9);
  const before = state(cabin, { floor: 2 });
  const delayed = resolveFloor(before, rng);
  assert.equal(delayed.cabin[1]?.destination, 4, 'real ghost resolution extended this rider past the planned stop');
  const withoutTarget = { ...delayed, cabin: delayed.cabin.map((r, slot) => slot === 1 ? null : r) };
  const withExtraFloor = resolveFloor(delayed, rng), withoutExtraFloor = resolveFloor(withoutTarget, rng);
  const flow = (s: RunState) => s.lastEarnings.sources.filter(line => !/到站|揭晓车费/.test(line.label)).reduce((sum, line) => sum + line.amount, 0);
  const additionalFlow = flow(withExtraFloor) - flow(withoutExtraFloor);
  const additionalEnergy = withoutExtraFloor.lastEnergy.delta - withExtraFloor.lastEnergy.delta;
  return { companions, additionalFlow, additionalEnergy, marginalCoinsAfterEnergyReplacement: additionalFlow - additionalEnergy * CHARGE_PRICE,
    excludes: 'Fare timing, replacement-rider opportunity, future arrivals, and human decision time' };
});
assert.deepEqual(delay.map(row => row.marginalCoinsAfterEnergyReplacement), [-1, 0, 1]);

const reclaim = [0, 1, 2, 3, 4, 5].map(stress => {
  const s = state([rider('commuter', 2), null, rider('courier', 2)], { stress });
  const off = resolveFloor(s, rng);
  const on = resolveFloor({ ...s, upgrades: { ...s.upgrades, solar: 1 } }, rng);
  return { stress, extraEnergy: on.energy - off.energy, remainingStress: on.stress, status: on.status };
});
assert.deepEqual(reclaim.map(row => row.extraEnergy), [0, 1, 2, 2, 2, 2]);
const out = new URL('../experiments/v8.29/', import.meta.url); mkdirSync(out, { recursive: true });
const report = { version: '8.29', theft, delay, reclaim, limitations: 'Controlled legal windows, not proof of a winning strategy. Coin equivalents value energy at the current shop price, not the shadow price near failure.' };
writeFileSync(new URL('risk-windows.json', out), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
