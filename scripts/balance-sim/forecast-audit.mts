// v9.17 audit: play bot games and, before every real ascent, check what the player was told against what
// settlement did. Power and agitation must land inside the forecast range, the ascend guard must flag every
// power loss and never cry wolf, and the bomb timer label must match the outcome.
// Usage: npx tsx scripts/balance-sim/forecast-audit.mts [runsPerBot]
import * as E from '../../lib/game-engine.ts';
import { stressForecast, energyForecast } from '../../lib/game-forecast.ts';
import { departureRisk } from '../../lib/departure-guard.ts';
import { fuseState } from '../../lib/bomb-state.ts';
import { runOne } from './sim.mts';

const runs = Number(process.argv[2] ?? 40);
const misses = new Map<string, { n: number; ex: string[] }>();
const note = (k: string, d: string) => { const m = misses.get(k) ?? { n: 0, ex: [] }; m.n++; if (m.ex.length < 3) m.ex.push(d); misses.set(k, m); };
const cab = (s: E.RunState) => s.cabin.map(r => (r ? r.kind + (r.big ? '*' : '') : '-')).join(',');
const lines = (xs: E.ChangeLine[]) => xs.filter(l => l.amount).map(l => `${l.label}${l.amount > 0 ? '+' : ''}${l.amount}`).join(' ');
let ascents = 0;
for (const bot of ['balanced', 'crime', 'occult', 'tempo', 'lively', 'casual', 'novice'] as const) for (let i = 0; i < runs; i++) {
  runOne({ bot, seed: 31337 + i * 7919, horizon: 150, legendMode: 'auto', onAscent: (b, a) => {
    ascents++;
    const sf = stressForecast(b), ef = energyForecast(b), risk = departureRisk(b);
    const ds = a.stress - b.stress, de = a.energy - b.energy, alive = a.status !== 'lost';
    const ctx = `${b.floor}F [${cab(b)}]`;
    if (alive && (ds < sf.lowDelta || ds > sf.highDelta)) note('agitation outside forecast', `${ctx} ${ds} vs ${sf.lowDelta}..${sf.highDelta} | ${lines(a.lastPressure.sources)}`);
    if (alive && (de < ef.lowDelta || de > ef.highDelta)) note('power outside forecast', `${ctx} ${de} vs ${ef.lowDelta}..${ef.highDelta} | ${lines(a.lastEnergy.sources)}`);
    if (a.status === 'lost' && a.message.includes('电量') && !risk.fatal) note('power loss the ascend guard did not flag', ctx);
    if (risk.fatal && alive) note('ascend guard flagged a floor that was survived', `${ctx} energy ${b.energy}→${a.energy} need ${risk.need}`);
    b.cabin.forEach((r, s) => {
      if (r?.kind !== 'bomb') return;
      const shown = fuseState(b.cabin, s, b.floor), ghost = b.cabin.some(x => x?.kind === 'ghost');
      if (shown === 'late' && a.cabin.some(x => x?.id === r.id && x.disguised)) note('bomb shown too late but carried off', ctx);
      if (!ghost && a.status === 'lost' && a.message.includes('炸弹') && shown !== 'late') note('bomb exploded without the late warning', ctx);
    });
  } });
}
console.log(`ascents audited: ${ascents}`);
if (!misses.size) console.log('no mismatches');
for (const [k, v] of [...misses].sort((x, y) => y[1].n - x[1].n)) { console.log(`\n${v.n}× ${k}`); v.ex.forEach(e => console.log('   ' + e.slice(0, 300))); }
