// Usage:
//   npx tsx scripts/balance-sim/main.mts run [--runs 60] [--bots all] [--horizon 150] [--seed 9001] [--workers 8] [--out file.json]
//   npx tsx scripts/balance-sim/main.mts legends [--runs 40] [--bots coop,crime,...] [--out file.json]
//   npx tsx scripts/balance-sim/main.mts report --in file.json
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BOTS, runOne, type BotId, type LegendMode, type RunLog } from './sim.mts';
import { LEGEND_KINDS, UPGRADES, type LegendKind, type UpgradeKey } from '../../lib/game-data.ts';
import { RETIRED_UPGRADES } from '../../lib/game-engine.ts';
import { report, legendReport, itemReport } from './report.mts';
import { applyVariant } from './variants.mts';
import type { BoxLine } from '../../lib/power-box.ts';

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (name: string, fallback: string) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : fallback; };
const self = fileURLToPath(import.meta.url);
type Job = { bot: BotId; seed: number; horizon: number; legendMode: LegendMode; forceLegend?: LegendKind; tag?: string; genericShop?: boolean; forceAbility?: UpgradeKey; boxOrder?: BoxLine[] };

if (cmd === 'shard') {
  applyVariant(opt('variant', 'baseline'));
  const jobs: Job[] = JSON.parse(fs.readFileSync(opt('jobs', ''), 'utf8'));
  const out = jobs.map(j => ({ ...runOne(j), tag: j.tag, legendMode: j.legendMode, forceLegend: j.forceLegend, forceAbility: j.forceAbility }));
  fs.writeFileSync(opt('out', ''), JSON.stringify(out));
} else if (cmd === 'report') {
  const logs = JSON.parse(fs.readFileSync(opt('in', ''), 'utf8'));
  console.log(logs[0]?.tag?.startsWith('legend') ? legendReport(logs) : report(logs));
} else {
  const runs = Number(opt('runs', cmd === 'legends' ? '30' : '60')), horizon = Number(opt('horizon', '150')), seed0 = Number(opt('seed', '9001'));
  const EXPLORATORY = ['tempo', 'gamble', 'mixed', 'casual', 'casualnet'];
  const bots = (opt('bots', 'all') === 'all' ? Object.keys(BOTS).filter(b => !EXPLORATORY.includes(b)) : opt('bots', '').split(',')) as BotId[];
  const jobs: Job[] = [];
  for (const bot of bots) for (let i = 0; i < runs; i++) {
    const seed = seed0 + i * 7919;
    if (cmd === 'accept') {
      jobs.push({ bot, seed, horizon, legendMode: 'auto' });
      if (['coop', 'crime', 'occult', 'quiet', 'lively'].includes(bot)) jobs.push({ bot, seed, horizon, legendMode: 'auto', genericShop: true });
      continue;
    }
    if (cmd === 'items') {
      jobs.push({ bot, seed, horizon, legendMode: 'none', tag: 'item:none' });
      for (const key of (Object.keys(UPGRADES) as UpgradeKey[]).filter(k => !RETIRED_UPGRADES.includes(k))) jobs.push({ bot, seed, horizon, legendMode: 'none', forceAbility: key, tag: 'item:' + key });
    } else if (cmd === 'legends') for (const legend of LEGEND_KINDS) for (const mode of ['board', 'decline'] as LegendMode[]) jobs.push({ bot, seed, horizon, legendMode: mode, forceLegend: legend, tag: `legend:${legend}` });
    else jobs.push({ bot, seed, horizon, legendMode: (opt('legend', 'auto') as LegendMode), genericShop: args.includes('--generic-shop'), boxOrder: opt('box-line', '') ? (opt('box-line', '').split(',') as BoxLine[]) : undefined });
  }
  const workers = Number(opt('workers', '8'));
  const tmp = fs.mkdtempSync('/tmp/balance-sim-');
  const shards = Array.from({ length: workers }, (_, w) => jobs.filter((_, i) => i % workers === w));
  const started = Date.now();
  await Promise.all(shards.map((shard, w) => new Promise<void>((resolve, reject) => {
    const jobsFile = `${tmp}/jobs-${w}.json`, outFile = `${tmp}/out-${w}.json`;
    fs.writeFileSync(jobsFile, JSON.stringify(shard));
    const child = spawn(process.execPath, ['--import', 'tsx', self, 'shard', '--jobs', jobsFile, '--out', outFile, '--variant', opt('variant', 'baseline')], { stdio: ['ignore', 'ignore', 'inherit'] });
    child.on('exit', code => (code === 0 ? resolve() : reject(new Error('shard failed ' + w))));
  })));
  const logs: RunLog[] = shards.flatMap((_, w) => JSON.parse(fs.readFileSync(`${tmp}/out-${w}.json`, 'utf8')));
  const out = opt('out', '');
  if (out) fs.writeFileSync(out, JSON.stringify(logs));
  console.log(`variant ${opt('variant', 'baseline')} · ${logs.length} runs in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.log(cmd === 'legends' ? legendReport(logs as never) : cmd === 'items' ? itemReport(logs as never) : report(logs));
}
