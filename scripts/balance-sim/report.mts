import { BOTS, type BotId, type RunLog } from './sim.mts';
import { PASSENGERS, LEGEND_KINDS, type PassengerKind } from '../../lib/game-data.ts';

const q = (xs: number[], p: number) => { if (!xs.length) return NaN; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))]; };
const med = (xs: number[]) => q(xs, 0.5);
const pct = (n: number, d: number) => (d ? (100 * n) / d : 0);
const f1 = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : '—');
const pad = (s: string | number, n: number) => String(s).padStart(n);

type Check = { name: string; value: string; target: string; pass: boolean };
const check = (name: string, value: string, target: string, pass: boolean): Check => ({ name, value, target, pass });

export function report(logs: RunLog[]) {
  const out: string[] = [];
  const by = (bot: BotId) => logs.filter(l => l.bot === bot && l.shopStyle !== 'generic');
  const key = (l: RunLog) => `${l.bot}${l.shopStyle === 'generic' ? '*' : ''}`;
  out.push('bot        n  median  p10  p90  alive%  energy% agit% bomb%  calls/10F  escapes≥2%  emerg  affluent%  exitCoins  abil  box  legend✓%  high%');
  const groups = [...new Set(logs.map(key))];
  for (const g of groups) {
    const L = logs.filter(l => key(l) === g), n = L.length, bot = L[0].bot;
    const floors = L.map(l => l.floor);
    const cause = (c: string) => pct(L.filter(l => l.cause === c).length, n);
    const deaths = L.filter(l => l.cause !== 'alive').length;
    const dc = (c: string) => pct(L.filter(l => l.cause === c).length, deaths);
    const shops = L.flatMap(l => l.shops);
    const bands = L.reduce((a, l) => ({ low: a.low + l.stressFloors.low, medium: a.medium + l.stressFloors.medium, high: a.high + l.stressFloors.high }), { low: 0, medium: 0, high: 0 });
    out.push([(BOTS[bot].name + (g.endsWith('*') ? '*' : '')).padEnd(8), pad(n, 3), pad(med(floors), 6), pad(q(floors, 0.1), 4), pad(q(floors, 0.9), 4), pad(f1(cause('alive')), 7), pad(f1(dc('energy')), 7), pad(f1(dc('agitation')), 5), pad(f1(dc('bomb')), 5),
      pad(f1(med(L.map(l => (10 * l.closeCalls) / Math.max(1, l.floor)))), 10), pad(f1(pct(L.filter(l => l.escapes >= 2).length, n)), 11), pad(f1(med(L.map(l => l.emergencyUnits))), 6),
      pad(f1(pct(shops.filter(s => s.affluent).length, shops.length)), 10), pad(f1(med(shops.map(s => s.exitCoins))), 10), pad(f1(med(L.map(l => l.abilities.length))), 5), pad(f1(med(L.map(l => l.box.length))), 4),
      pad(f1(pct(L.filter(l => l.legendStatus === 'delivered').length, L.filter(l => l.legend).length)), 9), pad(f1(pct(bands.high, bands.low + bands.medium + bands.high)), 6)].join(' '));
  }

  // philosophy checks
  const checks: Check[] = [];
  const skilled = logs.filter(l => l.bot !== 'novice' && l.shopStyle !== 'generic');
  // Diversity, measured two ways: rider styles with the same sensible shopping, and each style's own package.
  const generic = logs.filter(l => l.shopStyle === 'generic'), own = logs.filter(l => l.shopStyle !== 'generic');
  const RIDER_STYLES: BotId[] = ['coop', 'crime', 'occult', 'quiet', 'lively'];
  const medOf = (set: RunLog[], b: BotId) => med(set.filter(l => l.bot === b).map(l => l.floor));
  const gm = RIDER_STYLES.filter(b => generic.some(l => l.bot === b)).map(b => ({ b, m: medOf(generic, b) }));
  if (gm.length > 1) {
    const best = Math.max(...gm.map(a => a.m)), worst = Math.min(...gm.map(a => a.m));
    checks.push(check('多流派：五种乘客流派（同样合理购物）最弱 / 最强', gm.map(a => `${BOTS[a.b].name}${a.m}`).join(' ') + ` → ${f1((100 * worst) / best)}%`, '≥ 80%', worst / best >= 0.8));
  }
  const traps = gm.filter(a => own.some(l => l.bot === a.b)).map(a => ({ b: a.b, r: medOf(own, a.b) / a.m }));
  if (traps.length) checks.push(check('多流派：各流派自己的招牌能力不是陷阱（招牌组合 / 合理购物）', traps.map(t => `${BOTS[t.b].name}${f1(100 * t.r)}%`).join(' '), '全部 ≥ 85%', traps.every(t => t.r >= 0.85)));
  const inv = medOf(own, 'investor'), balm = medOf(own, 'balanced');
  if (Number.isFinite(inv) && Number.isFinite(balm)) checks.push(check('多流派：电箱投资路线可行', `${inv} vs 均衡 ${balm}`, '≥ 均衡的 85%', inv >= 0.85 * balm));
  const bal = by('balanced');
  if (bal.length) {
    const m = med(bal.map(l => l.floor));
    checks.push(check('长度：均衡型中位楼层', f1(m), '55–85', m >= 55 && m <= 85));
    const p90 = q(bal.map(l => l.floor), 0.9), p10 = q(bal.map(l => l.floor), 0.1);
    checks.push(check('长度：均衡型 p10–p90 跨度', `${p10}–${p90}`, '跨度 ≥ 35 且 p90 ≤ 120', p90 - p10 >= 35 && p90 <= 120));
  }
  const alive = pct(skilled.filter(l => l.cause === 'alive').length, skilled.length);
  checks.push(check('长度：150 层仍存活（所有熟练型）', f1(alive) + '%', '≤ 5%', alive <= 5));
  const esc = pct(skilled.filter(l => l.escapes >= 2).length, skilled.length);
  checks.push(check('死里逃生：至少 2 次险情后幸存的局', f1(esc) + '%', '≥ 70%', esc >= 70));
  const rate = med(skilled.map(l => (10 * l.closeCalls) / Math.max(1, l.floor)));
  checks.push(check('死里逃生：每 10 层险情次数（中位）', f1(rate), '0.8–3.0（有张力但不是一直在崩）', rate >= 0.8 && rate <= 3));
  const deaths = skilled.filter(l => l.cause !== 'alive');
  const dp = (c: string) => pct(deaths.filter(l => l.cause === c).length, deaths.length);
  // v2 gate: the original 'power ≤ 60 and agitation 20–40' only admitted agitation 39–40 (bombs ~1%).
  checks.push(check('死因：电量 / 躁动 / 炸弹', `${f1(dp('energy'))} / ${f1(dp('agitation'))} / ${f1(dp('bomb'))}`, '躁动 20–40，电量 ≤ 80，炸弹 ≤ 10', dp('energy') <= 80 && dp('agitation') >= 20 && dp('agitation') <= 40 && dp('bomb') <= 10));
  const shops = skilled.flatMap(l => l.shops);
  const aff = pct(shops.filter(s => s.affluent).length, shops.length);
  checks.push(check('不宽裕：进店时钱够“充满所需电量 + 升一级电箱 + 余 20”', f1(aff) + '%', '≤ 15%', aff <= 15));
  const exit = med(shops.map(s => s.exitCoins));
  checks.push(check('不宽裕：离店时剩余金币（中位）', f1(exit), '≤ 15', exit <= 15));
  const nov = by('novice');
  if (nov.length && bal.length) {
    const nm = med(nov.map(l => l.floor)), bm = med(bal.map(l => l.floor));
    checks.push(check('新手：坐满本能不被立刻惩罚，但技巧有回报', `${nm} vs 均衡 ${bm}`, '新手 ≥ 25 且 ≤ 均衡的 70%', nm >= 25 && nm <= 0.7 * bm));
  }
  // box line spread
  const firstLines = skilled.filter(l => l.box.length).map(l => l.box[0]);
  const lineShare = Math.max(0, ...['storage', 'transformer', 'motor'].map(x => pct(firstLines.filter(y => y === x).length, firstLines.length)));
  checks.push(check('配电箱：熟练型每局升级数（中位）', f1(med(skilled.map(l => l.box.length))), '≥ 3', med(skilled.map(l => l.box.length)) >= 3));
  checks.push(check('配电箱：第一次升级集中在同一线路', f1(lineShare) + '%', '≤ 60%', lineShare <= 60));
  // role adoption (balanced bot is the neutral reference)
  const ref = bal.length ? bal : skilled;
  const offered: Record<string, number> = {}, boarded: Record<string, number> = {};
  for (const l of ref) { for (const [k, v] of Object.entries(l.offered)) offered[k] = (offered[k] ?? 0) + v; for (const [k, v] of Object.entries(l.boarded)) boarded[k] = (boarded[k] ?? 0) + v; }
  // The Courier's parcel is not a person; its usage is reported by parcel-report.mts.
  const roles = Object.keys(offered).filter(k => !LEGEND_KINDS.includes(k as never) && k !== 'parcel' && offered[k] >= 20);
  const adopt = roles.map(k => ({ k, a: pct(boarded[k] ?? 0, offered[k]) })).sort((a, b) => a.a - b.a);
  const outOfBand = adopt.filter(r => r.a < 15 || r.a > 65);
  checks.push(check('人物：均衡型上车率都在 15–65%', outOfBand.length ? outOfBand.map(r => `${PASSENGERS[r.k as PassengerKind]?.name ?? r.k} ${f1(r.a)}%`).join('，') : '全部在区间内', '无越界', !outOfBand.length));

  out.push('', '设计目标检查');
  for (const c of checks) out.push(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}：${c.value}（目标 ${c.target}）`);
  const pressure: Record<string, number> = {};
  for (const l of skilled) for (const [k, v] of Object.entries(l.pressure)) pressure[k] = (pressure[k] ?? 0) + v;
  const ptotal = Object.values(pressure).reduce((a, b) => a + b, 0);
  out.push('', '躁动来源占比：' + Object.entries(pressure).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k} ${f1(pct(v, ptotal))}%`).join(' · '));
  out.push('', '均衡型上车率：' + adopt.map(r => `${PASSENGERS[r.k as PassengerKind]?.name ?? r.k} ${Math.round(r.a)}%`).join(' · '));
  const abil: Record<string, number> = {};
  for (const l of skilled) for (const a of l.abilities) abil[a] = (abil[a] ?? 0) + 1;
  out.push('能力被选次数：' + Object.entries(abil).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '));
  return out.join('\n');
}

export function legendReport(logs: Array<RunLog & { tag: string; legendMode: string; forceLegend: string }>) {
  const out: string[] = ['传奇         载上中位  谢绝中位  同种子平均差  载上更好的比例  送达率  （按流派的平均差）'];
  const deltas: Record<string, number> = {};
  for (const legend of LEGEND_KINDS) {
    const L = logs.filter(l => l.forceLegend === legend);
    const board = L.filter(l => l.legendMode === 'board'), decline = L.filter(l => l.legendMode === 'decline');
    const key = (l: RunLog) => `${l.bot}/${l.seed}`;
    const dmap = new Map(decline.map(l => [key(l), l.floor]));
    const pairs = board.filter(l => dmap.has(key(l))).map(l => ({ bot: l.bot, d: l.floor - dmap.get(key(l))! }));
    const mean = pairs.reduce((a, p) => a + p.d, 0) / Math.max(1, pairs.length);
    deltas[legend] = mean;
    const perBot = [...new Set(pairs.map(p => p.bot))].map(b => { const ps = pairs.filter(p => p.bot === b); return `${BOTS[b].name}${ps.reduce((a, p) => a + p.d, 0) / ps.length >= 0 ? '+' : ''}${f1(ps.reduce((a, p) => a + p.d, 0) / ps.length)}`; }).join(' ');
    out.push(`${(PASSENGERS[legend].name).padEnd(8)} ${pad(med(board.map(l => l.floor)), 8)} ${pad(med(decline.map(l => l.floor)), 9)} ${pad(f1(mean), 12)} ${pad(f1(pct(pairs.filter(p => p.d > 0).length, pairs.length)) + '%', 14)} ${pad(f1(pct(board.filter(l => l.legendStatus === 'delivered').length, board.length)) + '%', 7)}  ${perBot}`);
  }
  const vals = Object.values(deltas);
  const hi = Math.max(...vals), lo = Math.min(...vals);
  out.push('', `最强/最弱传奇增益：${f1(hi)} / ${f1(lo)}（目标：都在 +5 至 +12，比值 ≤ 2）`);
  out.push(`${vals.every(v => v >= 5 && v <= 12) && hi / Math.max(lo, 0.01) <= 2 ? 'PASS' : 'FAIL'}  传奇强度区间`);
  return out.join('\n');
}

export function itemReport(logs: Array<RunLog & { tag: string; forceAbility?: string }>) {
  const base = new Map(logs.filter(l => l.tag === 'item:none').map(l => [`${l.bot}/${l.seed}`, l.floor]));
  const rows = [...new Set(logs.map(l => l.tag))].filter(t => t !== 'item:none').map(tag => {
    const d = logs.filter(l => l.tag === tag && base.has(`${l.bot}/${l.seed}`)).map(l => l.floor - base.get(`${l.bot}/${l.seed}`)!);
    const mean = d.reduce((a, b) => a + b, 0) / d.length;
    const sd = Math.sqrt(d.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, d.length - 1)) / Math.sqrt(d.length);
    return { tag: tag.slice(5), mean, lo: mean - 1.96 * sd, hi: mean + 1.96 * sd, n: d.length };
  }).sort((a, b) => b.mean - a.mean);
  return ['能力（第 1 层起装上，同种子对比）   平均增益  95%区间', ...rows.map(r => `${r.tag.padEnd(12)} ${pad(f1(r.mean), 8)}  [${f1(r.lo)}, ${f1(r.hi)}]  n=${r.n}`)].join('\n');
}
