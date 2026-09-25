// v9.19.1 research: how each dark rider pays and costs in simulated runs (balanced and human-like bots).
// Usage: tsx scripts/balance-sim/dark-report.mts [runs]
import { runOne } from './sim.mts';
import { DARK_KINDS, DARK_LEGEND_KINDS, PASSENGERS, type PassengerKind } from '../../lib/game-data.ts';

const runs = Number(process.argv[2] ?? 120);
type Stat = { offered: number; boarded: number; delivered: number; fare: number; agitation: number; floorsAboard: number };
const stats = new Map<PassengerKind, Stat>([...DARK_KINDS, ...DARK_LEGEND_KINDS].map(k => [k, { offered: 0, boarded: 0, delivered: 0, fare: 0, agitation: 0, floorsAboard: 0 }]));
const names = new Map([...DARK_KINDS, ...DARK_LEGEND_KINDS].map(k => [PASSENGERS[k].name, k]));
const floors: number[] = [];
for (const bot of ['balanced', 'human'] as const) for (let seed = 1; seed <= runs; seed++) {
  const log = runOne({ bot, seed: 50000 + seed, horizon: 200, legendMode: 'auto', onAscent: (before, after) => {
    for (const r of before.cabin) if (r && stats.has(r.kind)) stats.get(r.kind)!.floorsAboard++;
    for (const a of after.lastArrivals ?? []) if (stats.has(a.kind)) { const s = stats.get(a.kind)!; s.delivered++; s.fare += a.coins; }
    // Agitation lines that name a dark rider (“劫匪行凶”, “狂徒发狂” …) are charged to that rider.
    for (const line of after.lastPressure.sources) if (line.amount > 0) for (const [name, kind] of names) if (line.label.startsWith(name)) { stats.get(kind)!.agitation += line.amount; break; }
  } });
  if (bot === 'balanced') floors.push(log.floor);
  for (const [k, s] of stats) { s.offered += log.offered[k] ?? 0; s.boarded += log.boarded[k] ?? 0; }
}
floors.sort((a, b) => a - b);
console.log(`balanced median ${floors[Math.floor(floors.length / 2)]}F over ${runs} runs (plus ${runs} human-like runs in the table)`);
console.log('kind            board%  avgFare  agit/floor  floors/trip');
for (const [k, s] of [...stats].sort((a, b) => b[1].boarded / Math.max(1, b[1].offered) - a[1].boarded / Math.max(1, a[1].offered))) {
  const pct = (100 * s.boarded / Math.max(1, s.offered)).toFixed(0).padStart(5);
  const fare = (s.fare / Math.max(1, s.delivered)).toFixed(1).padStart(7);
  const agit = (s.agitation / Math.max(1, s.floorsAboard)).toFixed(2).padStart(10);
  const trip = (s.floorsAboard / Math.max(1, s.boarded)).toFixed(1).padStart(11);
  console.log(`${PASSENGERS[k].name.padEnd(8, '　')} ${pct}  ${fare}  ${agit}  ${trip}`);
}
