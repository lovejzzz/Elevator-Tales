// Burst study: how often a floor's symbol level climbs, and how spiky per-floor income gets.
import fs from 'node:fs';
import type { RunLog } from './sim.mts';
type Floor = [number, number, number, number];
const files = process.argv.slice(2);
for (const f of files) {
  const logs: RunLog[] = JSON.parse(fs.readFileSync(f, 'utf8'));
  const floors: Floor[] = logs.flatMap(l => l.burst ?? []);
  const lvShare = (k: number) => (100 * floors.filter(x => x[1] >= k).length / floors.length).toFixed(2);
  const gains = floors.map(x => x[2]).sort((a, b) => a - b), q = (p: number) => gains[Math.floor(p * (gains.length - 1))];
  const runsWith = (k: number) => (100 * logs.filter(l => (l.burst ?? []).some(x => x[1] >= k)).length / logs.length).toFixed(1);
  // a burst floor: at least 4× the run's median floor income and at least 40 coins
  let bursts = 0, burstRuns = 0;
  for (const l of logs) { const g = (l.burst ?? []).map(x => x[2]).sort((a: number, b: number) => a - b); const med = g[Math.floor(g.length / 2)] ?? 0; const n = (l.burst ?? []).filter(x => x[2] >= Math.max(40, 4 * med)).length; bursts += n; if (n) burstRuns++; }
  const byBot: Record<string, number[]> = {}; for (const l of logs) (byBot[l.bot] ??= []).push(l.floor);
  const med = (a: number[]) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const deaths: Record<string, number> = {}; for (const l of logs) deaths[l.cause] = (deaths[l.cause] ?? 0) + 1;
  console.log(`== ${f.split('/').pop()} (${logs.length} runs, ${floors.length} floors)`);
  console.log(`  floors at level ≥2/3/4/5: ${lvShare(2)}% / ${lvShare(3)}% / ${lvShare(4)}% / ${lvShare(5)}%   runs reaching ≥3/4/5: ${runsWith(3)}% / ${runsWith(4)}% / ${runsWith(5)}%`);
  console.log(`  floor income p50 ${q(.5)} p90 ${q(.9)} p99 ${q(.99)} p99.9 ${q(.999)} max ${gains.at(-1)}   burst floors ${bursts} in ${(100 * burstRuns / logs.length).toFixed(1)}% of runs`);
  const kShare = (k: number) => (100 * floors.filter(x => (x[3] ?? 0) >= k).length / floors.length).toFixed(2);
  const kRuns = (k: number) => (100 * logs.filter(l => (l.burst ?? []).some(x => (x[3] ?? 0) >= k)).length / logs.length).toFixed(1);
  console.log(`  chain arrivals ≥2/3/4/5: floors ${kShare(2)}% / ${kShare(3)}% / ${kShare(4)}% / ${kShare(5)}%   runs ${kRuns(2)}% / ${kRuns(3)}% / ${kRuns(4)}% / ${kRuns(5)}%`);
  const nov = logs.filter(l => l.bot === 'novice' || l.bot === 'human'); const nk = (k: number) => (100 * nov.filter(l => (l.burst ?? []).some(x => (x[3] ?? 0) >= k)).length / Math.max(1, nov.length)).toFixed(1);
  console.log(`  novice+human runs with a chain ≥3/4/5: ${nk(3)}% / ${nk(4)}% / ${nk(5)}%`);
  const chainCoins = logs.map(l => Object.entries(l.income ?? {}).filter(([k]) => k.includes('连锁') && !k.includes('|')).reduce((n, [, v]) => n + (v as number), 0));
  const bySize: Record<string, number> = {}; for (const l of logs) for (const [k, v] of Object.entries(l.income ?? {})) if (k.includes('连锁') && !k.includes('|')) { const m = k.match(/×([\d.]+)/)?.[1] ?? '?'; bySize[m] = (bySize[m] ?? 0) + (v as number); }
  const exitMed = (() => { const a = logs.flatMap(l => (l.shops ?? []).map(s => s.exitCoins)).sort((x: number, y: number) => x - y); return a[Math.floor(a.length / 2)]; })();
  console.log(`  chain coins per run: mean ${(chainCoins.reduce((a: number, b: number) => a + b, 0) / logs.length).toFixed(1)} · by multiplier ${Object.entries(bySize).map(([k, v]) => `×${k}: ${(v / logs.length).toFixed(1)}`).join(' ')}   shop-exit coins median ${exitMed}`);
  console.log(`  median floor by bot: ${Object.entries(byBot).map(([b, a]) => `${b} ${med(a)}`).join(' · ')}`);
  console.log(`  causes: ${Object.entries(deaths).map(([k, v]) => `${k} ${(100 * v / logs.length).toFixed(0)}%`).join(' · ')}`);
}
