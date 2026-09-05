import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { ADJACENT, type PassengerKind } from '../lib/game-data';
import { hasNeighbour, initialRun, neighbours, resolveFloor, totalEnergyCost, type Rider, type RunState } from '../lib/game-engine';

// Deliberately NOT a live game rule. Evaluate proposed links atop the current
// engine, without changing makeOffers, resolveFloor or production UI.
const alphabet: Array<PassengerKind | null> = [null, 'thief', 'nurse', 'musician', 'cop'];
const setup = (kinds: Array<PassengerKind | null>): RunState => ({ ...initialRun(), floor: 4,
  cabin: kinds.map((kind, i): Rider | null => kind ? { id: `seat-${i}`, kind, boardedAt: 3, destination: 7, fareBonus: 0, patience: 0 } : null) });
const edges = (s: RunState) => ADJACENT.filter(([a, b]) => s.cabin[a]?.kind === 'thief' && s.cabin[b]?.kind === 'thief'
  && !hasNeighbour(s.cabin, a, ['cop', 'lawyer']) && !hasNeighbour(s.cabin, b, ['cop', 'lawyer']));
function trial(s: RunState, coinsPerMember: number, pressurePerEdge: number) {
  const base = resolveFloor(s, () => .9), links = edges(s).length;
  const extraCoins = links * coinsPerMember * 2, linkPressure = links * pressurePerEdge;
  return { links, coins: base.coins - s.coins + extraCoins, energy: totalEnergyCost(s), pressure: base.stress - s.stress + linkPressure,
    safeOneFloor: base.status !== 'lost' && base.stress + linkPressure < s.stressCap,
    netFlowAtShopEnergyPrice: base.coins - s.coins + extraCoins - 2 * totalEnergyCost(s) };
}
const configs = [1, 2, 3].flatMap(coinsPerMember => [1, 2].map(pressurePerEdge => ({ coinsPerMember, pressurePerEdge,
  evaluated: 0, safeOneFloor: 0, positiveNetFlow: 0, maxSafeNetFlow: -Infinity })));
let layouts = 0;
for (let n = 0; n < 5 ** 6; n++) {
  let encoded = n;
  const kinds = Array.from({ length: 6 }, () => { const kind = alphabet[encoded % 5]; encoded = Math.floor(encoded / 5); return kind; });
  const s = setup(kinds); if (!edges(s).length) continue; layouts++;
  for (const config of configs) {
    const result = trial(s, config.coinsPerMember, config.pressurePerEdge);
    config.evaluated++; config.safeOneFloor += Number(result.safeOneFloor);
    if (result.safeOneFloor) {
      config.positiveNetFlow += Number(result.netFlowAtShopEnergyPrice > 0);
      config.maxSafeNetFlow = Math.max(config.maxSafeNetFlow, result.netFlowAtShopEnergyPrice);
    }
  }
}
for (const [a, b] of ADJACENT) assert.equal(neighbours(a).filter(i => neighbours(b).includes(i)).length, 0,
  'adjacent riders cannot share one adjacent helper on this bipartite six-seat board');
const candidate = setup(['thief', 'thief', null, 'nurse', 'nurse', null]);
const calmPair = trial(candidate, 2, 1);
assert.deepEqual([calmPair.coins, calmPair.energy, calmPair.pressure, calmPair.safeOneFloor], [12, 5, 1, true]);
const controlled = trial(setup(['thief', 'thief', null, 'cop', 'nurse', null]), 2, 1);
assert.equal(controlled.links, 0); assert.equal(controlled.pressure, 0);
const allThieves = trial(setup(Array(6).fill('thief')), 2, 1);
assert.equal(allThieves.links, 7); assert.equal(allThieves.pressure, 13); assert.equal(allThieves.safeOneFloor, false);
const report = { status: 'research-only, not implemented in live rules', distinctLayouts: layouts, configurations: configs.length,
  evaluations: configs.reduce((sum, c) => sum + c.evaluated, 0), configs,
  hypothesis: 'Each edge between two uncontrolled thieves gives each endpoint +2 coins/floor and the cabin +1 agitation/floor. Control breaks the edge. Ordinary calming does not remove its cabin-wide pressure.',
  examples: { calmPair, controlled, allThieves },
  limits: 'One non-arrival floor at zero initial agitation; not survival probabilities. No arrival fares, helper acquisition cost, future departures, or player comprehension. Positive net flow is not a winning build. Exhaustive layouts are not equally probable encounters, nor proven reachable from real offer and trip histories.' };
const out = new URL('../experiments/v8.29/', import.meta.url); mkdirSync(out, { recursive: true });
writeFileSync(new URL('risk-links-research.json', out), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
