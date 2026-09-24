// v9.16 Courier parcel usage from a saved run file: npx tsx scripts/balance-sim/parcel-report.mts file.json
import fs from 'node:fs';
import type { RunLog } from './sim.mts';
const logs: RunLog[] = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const byBot = new Map<string, RunLog[]>();
for (const l of logs) byBot.set(l.bot, [...(byBot.get(l.bot) ?? []), l]);
const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : '–');
console.log('bot        offers  paired  courierOnly  parcelOnly  adopted | paid unpaid | big off/board | thefts child parts inspect contest bomb mimic | rare off/board');
for (const [bot, ls] of byBot) {
  const sum = (k: keyof NonNullable<RunLog['parcel']>) => ls.reduce((n, l) => n + (l.parcel?.[k] ?? 0), 0);
  const offered = sum('offered'), arrived = sum('delivered') + sum('unpaid');
  console.log(`${bot.padEnd(10)} ${String(offered).padStart(6)}  ${pct(sum('paired'), offered).padStart(6)}  ${pct(sum('courierOnly'), offered).padStart(11)}  ${pct(sum('parcelOnly'), offered).padStart(10)}  ${pct(sum('adopted'), offered).padStart(7)} | ${pct(sum('delivered'), arrived).padStart(4)} ${pct(sum('unpaid'), arrived).padStart(6)} | ${String(sum('bigOffered')).padStart(5)}/${pct(sum('bigBoarded'), sum('bigOffered')).padStart(4)} | ${[sum('thefts'), sum('childOpens'), sum('parts'), sum('inspected'), sum('contested'), sum('bombCarry'), sum('mimicCopy')].map(n => String(n).padStart(6)).join(' ')} | ${sum('rareOffered')}/${pct(sum('rareBoarded'), sum('rareOffered'))}`);
}
