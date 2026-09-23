// v9.16 Courier parcel usage from a saved run file: npx tsx scripts/balance-sim/parcel-report.mts file.json
import fs from 'node:fs';
import type { RunLog } from './sim.mts';
const logs: RunLog[] = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const byBot = new Map<string, RunLog[]>();
for (const l of logs) byBot.set(l.bot, [...(byBot.get(l.bot) ?? []), l]);
const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : '–');
console.log('bot        offers  paired  courierOnly  parcelOnly  opened  courierDelivered/boarded');
for (const [bot, ls] of byBot) {
  const sum = (k: keyof NonNullable<RunLog['parcel']>) => ls.reduce((n, l) => n + (l.parcel?.[k] ?? 0), 0);
  const offered = sum('offered');
  const boarded = ls.reduce((n, l) => n + (l.boarded.courier ?? 0), 0), delivered = ls.reduce((n, l) => n + (l.delivered.courier ?? 0), 0);
  console.log(`${bot.padEnd(10)} ${String(offered).padStart(6)}  ${pct(sum('paired'), offered).padStart(6)}  ${pct(sum('courierOnly'), offered).padStart(11)}  ${pct(sum('parcelOnly'), offered).padStart(10)}  ${String(sum('opened')).padStart(6)}  ${delivered}/${boarded}`);
}
