// v9.18 simulator calibration: behaviour of the human bot against real playtest records (the “Copy run record”
// JSON players send). Compares rule-independent habits: riders per floor, share of offers boarded, time spent at
// low / high agitation, coins kept after shops, and which power-box line is levelled first.
// Usage: npx tsx scripts/balance-sim/calibrate.mts records.json [runs] [fill,margin ...]
import fs from 'node:fs';
import { runOne, HUMAN, type RunLog } from './sim.mts';

type Floor = { floor?: number; stress?: number; cabin?: Array<[string, number] | null>; offers?: string[]; shop?: number; coins?: number; box?: Record<string, number> };
type RunRecord = { version: string; floor: number; cause: string; floors: Floor[] };
const records: RunRecord[] = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const runs = Number(process.argv[3] ?? 200);
const settings = (process.argv.slice(4).length ? process.argv.slice(4) : ['6,1,1']).map(x => x.split(',').map(Number));

function realHabits() {
  let floors = 0, riders = 0, offered = 0, boarded = 0, low = 0, high = 0; const kept: number[] = []; const first: string[] = [];
  for (const r of records) {
    let prev: string[] = [];
    for (const f of r.floors) {
      if (f.shop !== undefined) { kept.push(f.coins ?? 0); continue; }
      const cab = (f.cabin ?? []).filter(Boolean).map(c => c![0]);
      floors++; riders += cab.length; offered += f.offers?.length ?? 0;
      const left = [...prev]; for (const k of cab) { const i = left.indexOf(k); if (i >= 0) left.splice(i, 1); else boarded++; }
      prev = cab; const s = f.stress ?? 0; if (s <= 2) low++; else if (s >= 5) high++;
    }
    const shop = r.floors.find(f => f.shop !== undefined && f.box); if (shop?.box) first.push(Object.entries(shop.box).find(([, v]) => Number(v) > 0)?.[0] ?? 'none');
  }
  kept.sort((a, b) => a - b);
  return { riders: riders / floors, boarded: boarded / offered, low: low / floors, high: high / floors, keptCoins: kept[kept.length >> 1], firstBox: first.join('/'), floors: records.map(r => r.floor).sort((a, b) => a - b) };
}
function botHabits(logs: RunLog[]) {
  const floors = logs.reduce((n, l) => n + l.floor, 0), band = { low: 0, medium: 0, high: 0 };
  logs.forEach(l => { band.low += l.stressFloors.low; band.medium += l.stressFloors.medium; band.high += l.stressFloors.high; });
  const tot = band.low + band.medium + band.high;
  const off = logs.reduce((n, l) => n + Object.entries(l.offered).filter(([k]) => k !== 'parcel').reduce((m, [, v]) => m + v, 0), 0);
  const bd = logs.reduce((n, l) => n + Object.entries(l.boarded).filter(([k]) => k !== 'parcel').reduce((m, [, v]) => m + v, 0), 0);
  const kept = logs.flatMap(l => l.shops.map(s => s.exitCoins)).sort((a, b) => a - b);
  const fl = logs.map(l => l.floor).sort((a, b) => a - b), causes: { [k: string]: number } = {};
  logs.forEach(l => { causes[l.cause] = (causes[l.cause] ?? 0) + 1; });
  return { riders: logs.reduce((n, l) => n + (l.riderFloors ?? 0), 0) / floors, boarded: bd / off, low: band.low / tot, high: band.high / tot, keptCoins: kept[kept.length >> 1], median: fl[fl.length >> 1], p10: fl[Math.floor(fl.length * .1)], p90: fl[Math.floor(fl.length * .9)], causes };
}
const pct = (x: number) => `${Math.round(100 * x)}%`;
const real = realHabits();
console.log(`real (${records.length} runs, floors ${real.floors.join(', ')}): riders ${real.riders.toFixed(2)} · boarded ${pct(real.boarded)} · low ${pct(real.low)} · high ${pct(real.high)} · coins kept after shops ${real.keptCoins} · first box ${real.firstBox}`);
for (const [fill, margin, calm = 1, look = 1] of settings) {
  HUMAN.fill = fill; HUMAN.stressMargin = margin; HUMAN.transitCalm = Boolean(calm); HUMAN.lookahead = Boolean(look);
  const logs = Array.from({ length: runs }, (_, i) => runOne({ bot: 'human', seed: 424242 + i * 7919, horizon: 150, legendMode: 'auto' }));
  const b = botHabits(logs);
  console.log(`human fill ${fill} margin ${margin} transit calming ${calm ? 'yes' : 'no'} preview ${look ? 'yes' : 'no'}: riders ${b.riders.toFixed(2)} · boarded ${pct(b.boarded)} · low ${pct(b.low)} · high ${pct(b.high)} · coins kept ${b.keptCoins} · floors median ${b.median} (p10 ${b.p10}, p90 ${b.p90}) · causes ${Object.entries(b.causes).map(([k, v]) => `${k} ${pct(v / runs)}`).join(' ')}`);
}
