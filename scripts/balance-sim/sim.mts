// v9 balance simulator. Archetype bots play the production engine (no second rule set)
// and every run records the three design targets: many viable styles, close calls in
// every run, and never feeling rich.
import * as E from '../../lib/game-engine.ts';
import { PASSENGERS, isLegend, type LegendKind, type PassengerKind, type UpgradeKey } from '../../lib/game-data.ts';
import { riderProfile } from '../../lib/rider-profile.ts';
import { motorCost, agitationBand } from '../../lib/balance-v832.ts';
import { BOX_LINES, BOX_PRICES, BOX_TOTAL_CAP, boxTotal, boxedMotorCost, chargeCost, emergencyUnitPrice, type BoxLine } from '../../lib/power-box.ts';
import { RESERVE_CELL_PRICE } from '../../lib/balance-v832.ts';
import type { Rider, RunState } from '../../lib/game-engine.ts';

// ---------- deterministic streams ----------
export const rngFor = (seed: number) => () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const hash = (text: string) => { let h = 2166136261; for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const stream = (seed: number, channel: string, floor: number) => rngFor(hash(`${seed}/${channel}/${floor}`));
/** Evaluation never consumes the real streams. 0.5 means no incident, no tip, low relay. */
const previewRng = () => { const seq = [0.5, 0.73, 0.41, 0.9, 0.62, 0.55]; let i = 0; return () => seq[i++ % seq.length]; };

// ---------- archetypes ----------
export type BotId = 'coop' | 'crime' | 'occult' | 'quiet' | 'lively' | 'investor' | 'balanced' | 'novice' | 'tempo' | 'gamble' | 'mixed';
export type Bot = {
  id: BotId; name: string; favored: PassengerKind[]; favor: number;
  band: 'low' | 'medium' | 'high' | null; abilities: UpgradeKey[]; box: BoxLine[]; boxEager: boolean; legends: LegendKind[]; fixedBox?: boolean;
};
// Ordered by the measured v9 value study (.balance-sim/v9-items-final.json).
const GENERIC_ABILITIES: UpgradeKey[] = ['battery', 'reinforced', 'concierge', 'punchcard', 'relay', 'express', 'buffer', 'meter', 'dispatch', 'single', 'soundproof', 'calm', 'finale', 'tipjar', 'crowd', 'insulation'];
export const BOTS: Record<BotId, Bot> = {
  coop: { id: 'coop', name: '协作', favored: ['lover', 'tourist', 'coach', 'commuter', 'courier', 'celebrity'], favor: 1.2, band: null, abilities: ['meter', 'battery'], box: ['transformer', 'storage', 'motor'], boxEager: false, legends: ['matchmaker', 'nightingale'] },
  crime: { id: 'crime', name: '坏人', favored: ['thief', 'drunk', 'bomb', 'cop', 'lawyer', 'nurse'], favor: 1.4, band: 'high', abilities: ['soundproof', 'calm'], box: ['motor', 'transformer', 'storage'], boxEager: false, legends: ['don'] },
  occult: { id: 'occult', name: '灵异节能', favored: ['ghost', 'exorcist', 'mechanic', 'courier', 'mimic', 'mystery', 'shifter'], favor: 1.2, band: null, abilities: ['buffer', 'relay'], box: ['motor', 'storage', 'transformer'], boxEager: false, legends: ['medium', 'operator'] },
  quiet: { id: 'quiet', name: '安静秩序', favored: ['commuter', 'inspector', 'mechanic', 'nurse', 'child', 'courier'], favor: 1.2, band: 'low', abilities: ['punchcard', 'single'], box: ['storage', 'transformer', 'motor'], boxEager: false, legends: ['matron', 'tycoon'] },
  lively: { id: 'lively', name: '热闹', favored: ['musician', 'tourist', 'drunk', 'celebrity', 'child', 'coach'], favor: 1.3, band: 'medium', abilities: ['tipjar', 'concierge'], box: ['transformer', 'motor', 'storage'], boxEager: false, legends: ['nightingale', 'matchmaker'] },
  investor: { id: 'investor', name: '电箱投资', favored: [], favor: 0, band: null, abilities: ['relay', 'reinforced'], box: ['motor', 'transformer', 'storage'], boxEager: true, legends: ['tycoon', 'operator'] },
  balanced: { id: 'balanced', name: '均衡', favored: [], favor: 0, band: null, abilities: GENERIC_ABILITIES, box: ['transformer', 'motor', 'storage'], boxEager: false, legends: [] },
  // Exploratory styles (npm run balance:explore): not acceptance gates, used to look for new viable builds.
  tempo: { id: 'tempo', name: '快进快出', favored: ['courier', 'commuter', 'mechanic', 'child', 'musician'], favor: 1.3, band: null, abilities: ['finale', 'single', 'express'], box: ['transformer', 'storage', 'motor'], boxEager: false, legends: ['operator', 'tycoon'] },
  gamble: { id: 'gamble', name: '豪赌', favored: ['mystery', 'shifter', 'mimic', 'bomb', 'celebrity', 'cop'], favor: 1.4, band: null, abilities: ['insulation', 'meter'], box: ['storage', 'transformer', 'motor'], boxEager: false, legends: ['stranger', 'don'] },
  mixed: { id: 'mixed', name: '混搭', favored: ['thief', 'cop', 'ghost', 'exorcist', 'tourist', 'nurse', 'drunk'], favor: 1.1, band: null, abilities: ['crowd', 'insulation', 'soundproof'], box: ['transformer', 'motor', 'storage'], boxEager: false, legends: ['medium', 'don'] },
  novice: { id: 'novice', name: '新手', favored: [], favor: 0, band: null, abilities: [], box: [], boxEager: false, legends: [] },
};

export type LegendMode = 'auto' | 'board' | 'decline' | 'none';
export type RunOptions = { bot: BotId; seed: number; horizon: number; legendMode: LegendMode; forceLegend?: LegendKind; genericShop?: boolean; forceAbility?: UpgradeKey; boxOrder?: BoxLine[] };

// ---------- valuation ----------
const EP = 2.5; // coins per power at decision time; power is the scarce resource
const EP_FUTURE = 2.2;
const shopFloor = (floor: number) => E.nextShopFloor(floor);
const futureMotor = (state: RunState, floor: number) => boxedMotorCost(motorCost(floor), E.boxOf(state), floor);

function transitIncome(r: Rider, cabin: Array<Rider | null>, slot: number) {
  if (r.kind === 'thief' && !E.hasNeighbour(cabin, slot, ['cop', 'lawyer'])) return 3;
  if (r.kind === 'celebrity' && E.neighbourCount(cabin, slot) === 1) return 2;
  if (r.kind === 'don') return 3;
  return 0;
}
/** Power needed to reach the next shop with known riders and at least one rider aboard, versus what is reachable. */
export function sectorBudget(state: RunState) {
  if (state.status !== 'playing') return { need: 0, avail: state.energy, slack: state.energy };
  const shop = shopFloor(state.floor);
  let need = 0, refunds = 0;
  for (let f = state.floor + 1; f <= shop; f++) {
    let riders = 0;
    state.cabin.forEach((r, slot) => { if (r && r.destination >= f) riders += riderProfile(r, state.cabin, slot).energy; });
    const aboard = state.cabin.some(r => r && r.destination >= f);
    need += futureMotor(state, f) + (aboard ? riders : 1);
  }
  state.cabin.forEach(r => { if (r?.kind === 'courier' && r.destination <= shop) refunds += 2; });
  const emergency = Math.min((E.boxOf(state).storage >= 3 ? 10 : 20) - (state.emergencySector === Math.floor(state.floor / 10) ? state.emergencyUsed ?? 0 : 0), Math.floor(Math.max(0, state.coins) / emergencyUnitPrice(E.boxOf(state))));
  const avail = state.energy + refunds + Math.max(0, emergency) + (state.reserveCell ? 8 : 0);
  return { need, avail, slack: avail - need };
}

function agitationPenalty(stress: number, cap: number, bot: Bot) {
  if (stress >= cap) return 1e5;
  let p = 0;
  if (stress >= cap - 1) p += 30; else if (stress >= cap - 2) p += 12;
  const band = agitationBand(stress);
  if (band === 'high') p += (bot.band === 'high' ? 1.5 : 4) * (stress - 4);
  if (band === 'medium') p += bot.band === 'low' ? 3 : bot.band === 'medium' ? -2 : 0.5;
  if (band === 'low' && bot.band === 'medium') p += 1.5;
  return p;
}

const LEGEND_HEURISTIC = 14; // keepsake and in-sector effects the one-step preview cannot see
function evaluate(state: RunState, bot: Bot): number {
  const after = E.resolveFloor(state, previewRng());
  if (after.status === 'lost') return -1e6 + after.floor;
  let v = after.coins - state.coins + EP * (after.energy - state.energy);
  after.cabin.forEach((r, slot) => {
    if (!r) return;
    const rem = Math.max(1, r.destination - after.floor);
    const fare = E.arrivalFare(r, after.cabin, slot, E.cooperationBonus(after), after.stress);
    const energy = riderProfile(r, after.cabin, slot).energy;
    v += Math.pow(0.95, rem) * fare - EP_FUTURE * energy * rem + 0.8 * transitIncome(r, after.cabin, slot) * rem;
    if (bot.favored.includes(r.kind)) v += bot.favor * Math.min(rem, 5);
    if (isLegend(r.kind)) v += LEGEND_HEURISTIC + (bot.legends.includes(r.kind as LegendKind) ? 12 : 0);
    if (r.kind === 'bomb' && (r.fuse ?? 9) < rem && !E.hasNeighbour(after.cabin, slot, ['cop'])) v -= 150;
    // Visible progress a player can plan around: repairs, compliance stamps, child care.
    const low = agitationBand(after.stress) === 'low';
    if (r.kind === 'mechanic' && !r.repairDone && low && rem >= 2) v += 0.6 * 3 * EP;
    if (r.kind === 'inspector' && !r.complianceReady && low && rem >= 2) v += 0.6 * 12;
    if (r.kind === 'child' && (r.careProgress ?? 0) < 2 && E.hasNeighbour(after.cabin, slot, ['lover', 'nurse', 'matron']) && rem >= 1) v += 0.6 * 6;
  });
  v -= agitationPenalty(after.stress, after.stressCap, bot);
  if (after.status === 'playing') {
    // Second ascent with the same riders: agitation and power trends a player can read from the forecast.
    const after2 = E.resolveFloor(after, previewRng());
    if (after2.status === 'lost') v -= after2.message.includes('躁动') ? 60 : 25;
    else v -= 0.6 * agitationPenalty(after2.stress, after2.stressCap, bot);
    const { slack } = sectorBudget(after);
    if (slack < 0) v -= 7 * -slack;
    else if (slack < 5) v -= 5 - slack;
  }
  return v;
}

const place = (state: RunState, rider: Rider, slot: number): RunState => ({ ...state, cabin: state.cabin.map((r, i) => (i === slot ? rider : r)) });

function chooseBoarding(state: RunState, offers: Rider[], bot: Bot, mode: LegendMode): RunState {
  let pool = offers.filter(o => !isLegend(o.kind) || mode === 'auto' || mode === 'board');
  let cur = state;
  if (mode === 'board') {
    const legend = pool.find(o => isLegend(o.kind));
    const slot = cur.cabin.findIndex(r => !r);
    if (legend && slot >= 0) { cur = place(cur, legend, !cur.cabin[1] ? 1 : slot); pool = pool.filter(o => o !== legend); }
  }
  if (bot.id === 'novice') {
    // Instinct: fill seats with the highest printed fare, but heed a red "you will not survive the next floor" forecast.
    for (const o of [...pool].sort((a, b) => PASSENGERS[b.kind].fare - PASSENGERS[a.kind].fare)) {
      const slot = cur.cabin.findIndex(r => !r); if (slot < 0) break;
      const cand = place(cur, o, slot);
      const preview = E.resolveFloor(cand, previewRng());
      if (cur.cabin.some(Boolean) && (preview.status === 'lost' || preview.stress >= preview.stressCap - 2)) continue;
      cur = cand;
    }
    return cur;
  }
  let score = cur.cabin.some(Boolean) ? evaluate(cur, bot) : -Infinity;
  for (;;) {
    let best: { s: RunState; v: number; used: Rider[] } | null = null;
    const empty = [0, 1, 2, 3, 4, 5].filter(i => !cur.cabin[i]);
    for (const o of pool) for (const slot of empty) {
      const cand = place(cur, o, slot); const v = evaluate(cand, bot);
      if (!best || v > best.v) best = { s: cand, v, used: [o] };
    }
    // Pairs, so that synergies that need two new riders (lovers, cop+thief) are visible.
    for (let i = 0; i < pool.length; i++) for (let j = i + 1; j < pool.length; j++) for (const a of empty) for (const b of empty) {
      if (a === b) continue;
      const cand = place(place(cur, pool[i], a), pool[j], b); const v = evaluate(cand, bot);
      if (!best || v > best.v) best = { s: cand, v, used: [pool[i], pool[j]] };
    }
    if (!best || best.v <= score + 0.01) break;
    cur = best.s; score = best.v; pool = pool.filter(o => !best!.used.includes(o));
  }
  return cur;
}

// ---------- shop ----------
function sectorNeed(state: RunState, occupancy: number) {
  let need = 0;
  for (let f = state.floor + 1; f <= state.floor + 10; f++) need += futureMotor(state, f) + occupancy;
  return need;
}
function shop(state: RunState, bot: Bot, rng: () => number, log: RunLog): RunState {
  let s = state;
  const entry = { floor: s.floor, energy: s.energy, coins: s.coins, cap: s.energyCap };
  if (s.energy <= 0 || s.stress >= s.stressCap) s = E.repairEmergency(s);
  // 1. free ability
  const pickAbility = () => {
    const cards = E.availableShopCards(s).map(c => c.key);
    const order = bot.id === 'novice' ? cards : [...bot.abilities, ...GENERIC_ABILITIES];
    return order.find(k => cards.includes(k));
  };
  let key = pickAbility();
  if (bot.id !== 'novice' && key && !bot.abilities.includes(key) && bot.abilities.length && s.coins >= E.REROLL_PRICE + 40) { s = E.rerollShop(s, rng); key = pickAbility(); }
  if (key) { s = E.installUpgrade(s, key); log.abilities.push(key); }
  // 2. free box level from the wrench
  const lineFor = () => bot.box.find(l => E.canBuyBoxLevel(s, l)) ?? BOX_LINES.find(l => E.canBuyBoxLevel(s, l));
  while ((s.freeBoxLevels ?? 0) > 0 && lineFor()) { const l = lineFor()!; s = E.buyBoxLevel(s, l); log.box.push(l); }
  // 3. power plan for the next sector
  const occupancy = bot.id === 'novice' ? 6 : 3.2;
  const need = sectorNeed(s, occupancy);
  const target = Math.min(s.energyCap, Math.ceil(need + 4));
  const chargeFor = (units: number) => chargeCost(E.boxOf(s), Math.max(0, units));
  // 4. box investment
  if (bot.id !== 'novice' && bot.box.length && boxTotal(E.boxOf(s)) < BOX_TOTAL_CAP) {
    const bottleneck: BoxLine[] = need > s.energyCap ? ['storage', 'motor', 'transformer'] : s.floor >= 30 ? ['motor', 'transformer', 'storage'] : ['transformer', 'motor', 'storage'];
    const order = bot.fixedBox ? bot.box : bot.id === 'balanced' || bot.id === 'investor' ? bottleneck : [...bot.box, ...bottleneck];
    const line = order.find(l => E.canBuyBoxLevel(s, l));
    if (line) {
      const price = BOX_PRICES[E.boxOf(s)[line]];
      const floorNeed = bot.boxEager ? Math.ceil(Math.min(target, need) * 0.8) : Math.ceil(Math.min(target, need) * 0.9);
      if (s.coins - price >= chargeFor(floorNeed - s.energy)) { s = E.buyBoxLevel(s, line); log.box.push(line); }
    }
  }
  // 5. charge
  const want = bot.id === 'novice' ? s.energyCap - s.energy : Math.max(0, target - s.energy);
  let units = Math.min(want, E.affordableChargingPlan(s).units);
  if (units > 0) s = E.chargeBattery(s, units);
  // 5b. with surplus beyond the power plan and a box level, buy a second ability card
  if (bot.id !== 'novice') {
    const extra = pickAbility();
    const reserveFor = chargeFor(Math.max(0, target - s.energy));
    if (extra && s.coins - E.SHOP_PRICES.extraAbility >= reserveFor) { s = E.installUpgrade(s, extra); if (s.shopExtraBought) log.abilities.push(extra); }
  }
  // 6. reserve cell with genuine surplus
  if (bot.id !== 'novice' && !s.reserveCell && s.coins >= RESERVE_CELL_PRICE + 25) s = E.buyReserveCell(s);
  // top up with anything left if still under target (scarcity check reads what remains)
  units = Math.min(Math.max(0, target - s.energy), E.affordableChargingPlan(s).units);
  if (units > 0) s = E.chargeBattery(s, units);
  const boxPrice = Math.min(...BOX_LINES.map(l => (E.boxOf(state)[l] < 3 ? BOX_PRICES[E.boxOf(state)[l]] : Infinity)));
  // Rich = after paying for everything the next sector really needs (shop charge to cap, the emergency power
  // beyond the cap at its higher price, one box level) there are still 20 coins spare.
  const needBeyondCap = Math.max(0, Math.ceil(need) - state.energyCap);
  const survivalCost = chargeCost(E.boxOf(state), Math.max(0, Math.min(state.energyCap, Math.ceil(need)) - entry.energy)) + needBeyondCap * emergencyUnitPrice(E.boxOf(state));
  const extraPrice = Object.values(state.upgrades).filter(Boolean).length < 5 ? E.SHOP_PRICES.extraAbility : 0;
  const affluent = entry.coins >= survivalCost + (Number.isFinite(boxPrice) ? boxPrice : 0) + extraPrice + 20;
  log.shops.push({ ...entry, exitCoins: s.coins, exitEnergy: s.energy, target, affluent });
  return E.leaveShop(s);
}

// ---------- run ----------
export type ShopLog = { floor: number; energy: number; coins: number; cap: number; exitCoins: number; exitEnergy: number; target: number; affluent: boolean };
export type RunLog = {
  bot: BotId; seed: number; floor: number; cause: 'energy' | 'agitation' | 'bomb' | 'alive';
  closeCalls: number; escapes: number; powerCalls: number; stressCalls: number; bombCalls: number;
  emergencyUnits: number; incidents: number; dismissals?: number; shops: ShopLog[]; abilities: UpgradeKey[]; box: BoxLine[];
  legend?: LegendKind; legendStatus?: string; keepsakes: string[]; boarded: Record<string, number>; delivered: Record<string, number>; offered: Record<string, number>;
  shopStyle: 'archetype' | 'generic'; peakCoins: number; pressure: Record<string, number>; deathSources?: string; stressFloors: { low: number; medium: number; high: number };
};

function causeOf(state: RunState): RunLog['cause'] {
  if (state.status !== 'lost') return 'alive';
  if (state.message.includes('炸弹')) return 'bomb';
  if (state.message.includes('躁动')) return 'agitation';
  return 'energy';
}

export function runOne(opt: RunOptions): RunLog {
  const base = BOTS[opt.bot];
  let bot: Bot = opt.genericShop ? { ...base, abilities: GENERIC_ABILITIES, box: ['transformer', 'motor', 'storage'], boxEager: false } : base;
  if (opt.boxOrder) bot = { ...bot, box: opt.boxOrder, fixedBox: true };
  const pool = opt.legendMode === 'none' ? [] : opt.forceLegend ? [opt.forceLegend] : undefined;
  let { state, offers } = E.startRun(false, stream(opt.seed, 'offers', 1), pool);
  if (opt.forceAbility) state = { ...E.previewUpgrade({ ...state, status: 'upgrade' }, opt.forceAbility), status: 'playing' };
  const log: RunLog = { bot: opt.bot, seed: opt.seed, floor: 1, cause: 'alive', closeCalls: 0, escapes: 0, powerCalls: 0, stressCalls: 0, bombCalls: 0, emergencyUnits: 0, incidents: 0,
    shops: [], abilities: [], box: [], legend: state.legendOffer, keepsakes: [], boarded: {}, delivered: {}, offered: {}, shopStyle: opt.genericShop ? 'generic' : 'archetype', peakCoins: 0, pressure: {}, stressFloors: { low: 0, medium: 0, high: 0 } };
  const callFloors: number[] = [];
  const mode: LegendMode = bot.id === 'novice' && opt.legendMode === 'auto' ? 'board' : opt.legendMode;
  while (state.status !== 'lost' && state.floor < opt.horizon) {
    if (state.status === 'upgrade') {
      state = shop(state, bot, stream(opt.seed, 'shop', state.floor), log);
      if (state.status === 'playing') ({ state, offers } = E.nextOfferBatch(state, stream(opt.seed, 'offers', state.floor)));
      continue;
    }
    // pre-departure tools
    if (state.calmCharge && state.stress >= state.stressCap - 2) state = E.applyCalmCharge(state);
    const before = new Set(state.cabin.filter(Boolean).map(r => r!.id));
    for (const r of state.cabin) if (r?.kind === 'bomb' && (r.fuse ?? 9) <= 1 && r.destination > state.floor + 1 && !E.hasNeighbour(state.cabin, state.cabin.indexOf(r), ['cop'])) state = E.dismissRider(state, r.id);
    for (const o of offers) log.offered[o.kind] = (log.offered[o.kind] ?? 0) + 1;
    state = chooseBoarding(state, offers, bot, mode);
    if (!state.cabin.some(Boolean)) { const slot = 0; state = place(state, offers.find(o => !isLegend(o.kind)) ?? offers[0], slot); }
    for (const r of state.cabin) if (r && !before.has(r.id)) log.boarded[r.kind] = (log.boarded[r.kind] ?? 0) + 1;
    // Dispatch / Rebooking: shorten the longest new trip by one stop (fare unchanged).
    if (bot.id !== 'novice' && (state.upgrades.dispatch || state.upgrades.retime)) {
      const fresh = state.cabin.filter(r => r && r.boardedAt === state.floor && !isLegend(r.kind) && r.destination - state.floor >= 3).sort((a, b) => b!.destination - a!.destination)[0];
      if (fresh) state = E.retimeRider(state, fresh.id, -1);
    }
    // emergency power / reserve cell only when the actual next ascent would fail
    const test = () => E.resolveFloor(state, previewRng());
    // Paid dismissal when the forecast says this cabin will not survive (two per sector, fare forfeited).
    if (bot.id !== 'novice') {
      const doomed = (st: RunState) => { const a = E.resolveFloor(st, previewRng()); if (a.status === 'lost') return a.message.includes('躁动') || a.message.includes('炸弹'); return a.status === 'playing' && E.resolveFloor(a, previewRng()).status === 'lost' && a.stress >= a.stressCap - 1; };
      if (doomed(state)) {
        let best: { st: RunState; v: number } | null = null;
        for (const r of state.cabin) {
          if (!r || r.boardedAt >= state.floor) continue;
          const st = E.dismissRider(state, r.id); if (st === state || !st.cabin.some(Boolean)) continue;
          const v = evaluate(st, bot) - (state.coins - st.coins);
          if (!best || v > best.v) best = { st, v };
        }
        if (best && !doomed(best.st)) { state = best.st; log.dismissals = (log.dismissals ?? 0) + 1; }
      }
    }
    const powerDeath = () => { const t = test(); return t.status === 'lost' && t.message.includes('电量'); };
    {
      if (powerDeath() && state.reserveCell) state = E.consumeReserveCell(state);
      let guard = 0;
      while (guard++ < 12 && powerDeath() && E.emergencyAllowance(state) > 0) { state = E.emergencyCharge(state, 1); log.emergencyUnits++; }
    }
    log.stressFloors[agitationBand(state.stress)]++;
    const cabinBefore = state.cabin.filter(Boolean).map(r => r!);
    const next = E.resolveFloor(state, stream(opt.seed, 'resolve', state.floor));
    for (const r of cabinBefore) if (!next.cabin.some(n => n?.id === r.id) && next.lastArrivals?.some(a => a.riderId === r.id)) log.delivered[r.kind] = (log.delivered[r.kind] ?? 0) + 1;
    if (next.message.includes('车厢事故') || next.log[0]?.includes('车厢事故')) log.incidents++;
    for (const line of next.lastPressure.sources) if (line.amount > 0) log.pressure[line.label] = (log.pressure[line.label] ?? 0) + line.amount;
    if (next.status === 'lost') log.deathSources = next.lastPressure.sources.map(l => `${l.label}${l.amount > 0 ? '+' : ''}${l.amount}`).join(' ') + ` | stress ${next.stress}/${next.stressCap} riders ${state.cabin.filter(Boolean).map(r => r!.kind).join(',')}`;
    state = next;
    log.peakCoins = Math.max(log.peakCoins, state.coins);
    if (state.status === 'playing') {
      // close calls: the next ascent is nearly unaffordable, agitation is one or two steps from loss, or a fuse is about to blow
      const cost = E.energyBreakdown(state).total + (state.cabin.some(Boolean) ? 0 : 1);
      const power = state.energy - cost <= 2;
      const stress = state.stress >= state.stressCap - 2;
      const bomb = state.cabin.some((r, i) => r?.kind === 'bomb' && (r.fuse ?? 9) <= 1 && r.destination > state.floor + 1 && !E.hasNeighbour(state.cabin, i, ['cop']));
      if (power) log.powerCalls++; if (stress) log.stressCalls++; if (bomb) log.bombCalls++;
      if (power || stress || bomb) { log.closeCalls++; callFloors.push(state.floor); }
      ({ state, offers } = E.nextOfferBatch(state, stream(opt.seed, 'offers', state.floor)));
    }
  }
  log.floor = state.floor; log.cause = causeOf(state);
  log.escapes = callFloors.filter(f => log.cause === 'alive' || f <= log.floor - 3).length;
  log.legendStatus = state.legendStatus; log.keepsakes = state.keepsakes ?? [];
  return log;
}
