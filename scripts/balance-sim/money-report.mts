// v10.2.5 money study: where the coins come from and when shops find the player rich.
// Usage: npx tsx scripts/balance-sim/money-report.mts --in runs.json [--bots balanced,human]
import fs from 'node:fs';
import type { RunLog, ShopLog } from './sim.mts';
const args = process.argv.slice(2), opt = (n: string, f: string) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : f; };
const logs = JSON.parse(fs.readFileSync(opt('in', ''), 'utf8')) as RunLog[];
const bots = opt('bots', '') ? opt('bots', '').split(',') : [...new Set(logs.map(l => l.bot))];
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
for (const bot of bots) {
  const L = logs.filter(l => l.bot === bot && l.shopStyle !== 'generic'); if (!L.length) continue;
  console.log(`\n== ${bot} (${L.length} runs, median ${med(L.map(l => l.floor))}F)`);
  const byShop: Record<number, ShopLog[]> = {}; for (const l of L) for (const s of l.shops) (byShop[s.floor] ??= []).push(s);
  console.log('shop  n   entry$  exit$  affluent%  entryPower');
  for (const f of Object.keys(byShop).map(Number).sort((a, b) => a - b)) { const S = byShop[f]; console.log(`${String(f).padEnd(5)} ${String(S.length).padEnd(3)} ${String(med(S.map(s => s.coins))).padEnd(7)} ${String(med(S.map(s => s.exitCoins))).padEnd(6)} ${String(Math.round(100 * S.filter(s => s.affluent).length / S.length)).padEnd(10)} ${med(S.map(s => s.energy))}`); }
  const total: Record<string, number> = {}; for (const l of L) for (const [k, v] of Object.entries(l.income ?? {})) total[k] = (total[k] ?? 0) + v;
  const bands = Object.entries(total).filter(([k]) => k.startsWith('@')).sort((a, b) => Number(a[0].slice(1)) - Number(b[0].slice(1)));
  console.log('income per run by band: ' + bands.map(([k, v]) => `${k.slice(1)}F ${Math.round(v / L.length)}`).join(' · '));
  for (const [band] of bands) { const b = band.slice(1); const lines = Object.entries(total).filter(([k]) => k.startsWith(b + '|')).sort((x, y) => y[1] - x[1]).slice(0, 8); console.log(`  ${b}F: ` + lines.map(([k, v]) => `${k.split('|')[1]} ${Math.round(v / L.length)}`).join(' · ')); }
  const sources = Object.entries(total).filter(([k]) => !k.startsWith('@') && !k.includes('|')).sort((a, b) => b[1] - a[1]); const all = sources.reduce((n, [, v]) => n + v, 0);
  console.log('top sources: ' + sources.slice(0, 14).map(([k, v]) => `${k} ${Math.round(100 * v / all)}%`).join(' · '));
}
