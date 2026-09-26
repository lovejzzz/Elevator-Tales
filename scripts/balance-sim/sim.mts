import { boardNet, netValue, netIncludesAgitation } from '../../lib/net-value.ts';
import { activeConnection } from '../../lib/game-interaction.ts';
import { ADJACENT } from '../../lib/game-data.ts';
// v9 balance simulator. Archetype bots play the production engine (no second rule set)
// and every run records the three design targets: many viable styles, close calls in
// every run, and never feeling rich.
import { SYMBOL_RULES, redCount } from '../../lib/symbols.ts';
import * as E from '../../lib/game-engine.ts';
import { PASSENGERS, isDark, isDarkLegend, isLegend, type LegendKind, type PassengerKind, type UpgradeKey } from '../../lib/game-data.ts';
import { DARK_RULES, isBombKind, outburstIsPower } from '../../lib/dark-rules.ts';
import { abyssLossChance } from '../../lib/game-forecast.ts';
import { DARK_LEGEND_RULES } from '../../lib/legends.ts';
import { conflictLinks, riderProfile } from '../../lib/rider-profile.ts';
import { motorCost, agitationBand, ECONOMY_RULES } from '../../lib/balance-v832.ts';
import { BOX_LINES, BOX_PRICES, boxTotal, boxedMotorCost, chargeCost, emergencyUnitPrice, type BoxLine } from '../../lib/power-box.ts';
import type { Rider, RunState } from '../../lib/game-engine.ts';

// v9.18: bots have no clock; they play Bomber timers in floors (the simulator's stand-in for the real-time timer).
E.BOMB_RULES.realtime = false;

// ---------- deterministic streams ----------
export const rngFor = (seed: number) => () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const hash = (text: string) => { let h = 2166136261; for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const stream = (seed: number, channel: string, floor: number) => rngFor(hash(`${seed}/${channel}/${floor}`));
/** Evaluation never consumes the real streams. 0.5 means no incident, no tip, low relay. */
const previewRng = () => { const seq = [0.5, 0.73, 0.41, 0.9, 0.62, 0.55]; let i = 0; return () => seq[i++ % seq.length]; };

// ---------- archetypes ----------
export type BotId = 'coop' | 'crime' | 'occult' | 'quiet' | 'lively' | 'investor' | 'balanced' | 'novice' | 'tempo' | 'gamble' | 'mixed' | 'casual' | 'casualnet' | 'human';
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
  // A thoughtful first-week player: seats riders by printed fare like the novice, but shops like the optimizer.
  casual: { id: 'casual', name: '休闲', favored: [], favor: 0, band: null, abilities: GENERIC_ABILITIES, box: ['transformer', 'storage', 'motor'], boxEager: false, legends: [] },
  // The casual player reading a "net" figure on each card: printed fare minus trip power at the shop price.
  casualnet: { id: 'casualnet', name: '看净值', favored: [], favor: 0, band: null, abilities: GENERIC_ABILITIES, box: ['transformer', 'storage', 'motor'], boxEager: false, legends: [] },
  novice: { id: 'novice', name: '新手', favored: [], favor: 0, band: null, abilities: [], box: [], boxEager: false, legends: [] },
  // v9.18 calibrated to six real playtest records (scripts/balance-sim/calibrate.mts): reads card values, avoids
  // Thieves and Drifters, keeps agitation low, spends everything on power, levels storage, never buys calming.
  human: { id: 'human', name: '真人型', favored: [], favor: 0, band: 'low', abilities: [], box: ['storage', 'transformer', 'motor'], boxEager: false, legends: [] },
};

/** Knobs fitted so the human bot's behaviour matches the real records (occupancy, boarding, time at low agitation). */
// v10: lookahead on — with symbol links the ascend button's agitation forecast is what a player checks before boarding more.
export const HUMAN = { fill: 6, stressMargin: 1, avoid: ['thief', 'drunk'] as PassengerKind[], minNet: -2, transitCalm: false, lookahead: true };
export type LegendMode = 'auto' | 'board' | 'decline' | 'none';
export type RunOptions = { bot: BotId; seed: number; horizon: number; legendMode: LegendMode; forceLegend?: LegendKind; genericShop?: boolean; forceAbility?: UpgradeKey; boxOrder?: BoxLine[];
  /** Audit hook: called with the cabin as it departs and the settled result (scripts/audit). */
  onAscent?: (before: RunState, after: RunState) => void };

// ---------- valuation ----------
const EP = 2.5; // coins per power at decision time; power is the scarce resource
const EP_FUTURE = 2.2;
const shopFloor = (floor: number) => E.nextShopFloor(floor);
const futureMotor = (state: RunState, floor: number) => boxedMotorCost(motorCost(floor), E.boxOf(state), floor);

function transitIncome(r: Rider, cabin: Array<Rider | null>, slot: number) {
  if (r.kind === 'thief' && !E.hasNeighbour(cabin, slot, ['cop', 'lawyer'])) return ECONOMY_RULES.thiefTravel + E.neighbours(slot).reduce((n, i) => n + E.pickpocketFrom(cabin[i]), 0);
  if (r.kind === 'celebrity' && E.neighbourCount(cabin, slot) === 1) return 2;
  if (r.kind === 'don') return 3;
  // v9.19 dark riders: the coins each one moves per floor (banked ones are paid on arrival, which a player plans for too).
  const n = E.neighbourCount(cabin, slot), normal = E.neighbours(slot).filter(i => cabin[i] && !isDark(cabin[i]!.kind) && cabin[i]!.kind !== 'parcel').length;
  switch (r.kind) {
    case 'robber': return E.thiefHeld(cabin, slot) ? 0 : -(DARK_RULES.robberBase + 3);
    case 'crookedcop': return -DARK_RULES.crookedFee;
    case 'shyster': return Math.min(DARK_RULES.shysterCap, conflictLinks(cabin).length * DARK_RULES.shysterPerRed);
    case 'scrapper': return DARK_RULES.scrapperCoins + (E.hasNeighbour(cabin, slot, ['grafter']) ? DARK_RULES.fenceCoins : 0) - EP;
    case 'grafter': return n * DARK_RULES.grafterFee;
    case 'overtimer': return DARK_RULES.overtimePay;
    case 'voyeur': return normal ? DARK_RULES.voyeurPhoto : 0;
    case 'scandal': return n * DARK_RULES.scandalPerNeighbour + (E.hasNeighbour(cabin, slot, ['voyeur']) ? DARK_RULES.scandalVoyeur : 0);
    case 'wraith': return E.hasNeighbour(cabin, slot, E.GHOST_CONTROL_KINDS) ? DARK_RULES.wraithControlledCoins : -EP;
  }
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
  state.cabin.forEach((r, slot) => { if (r?.kind === 'courier' && r.destination <= shop && E.parcelBeside(state.cabin, slot)) refunds += 2; });
  const emergency = Math.min((E.boxOf(state).storage >= 3 ? 10 : 20) - (state.emergencySector === Math.floor(state.floor / 10) ? state.emergencyUsed ?? 0 : 0), Math.floor(Math.max(0, state.coins) / emergencyUnitPrice(E.boxOf(state))));
  const avail = state.energy + refunds + Math.max(0, emergency);
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

/** v10: the coins a cabin's symbol links will pay over the floors each pair stays together, minus their red links'
 * agitation at the bot's price for it. The one-step preview only sees a single floor of them. */
function linkOutlook(state: RunState, bot: Bot) {
  // Rule-agnostic: the ledger of the cabin as it thins out floor by floor (riders leave at their destinations).
  const agi = bot.band === 'high' ? 2 : 3;
  let v = 0;
  for (let t = 1; t <= 6; t++) {
    const cabin = state.cabin.map(r => r && r.destination > state.floor + t ? r : null);
    if (!cabin.some(Boolean)) break;
    const l = E.symbolCoins({ ...state, cabin });
    v += Math.pow(0.9, t) * (l.coins + EP * (Math.min(l.power, cabin.reduce((n, r, i) => n + (r ? riderProfile(r, cabin, i).energy : 0), 0)) + l.freePower) - agi * (redCount(cabin) * SYMBOL_RULES.redAgitation + l.agitationLines.reduce((n, x) => n + x.amount, 0)));
  }
  return v;
}
const LEGEND_HEURISTIC = 14; // keepsake and in-sector effects the one-step preview cannot see
function evaluate(state: RunState, bot: Bot): number {
  const after = E.resolveFloor(state, previewRng());
  if (after.status === 'lost') return -1e6 + after.floor;
  let v = after.coins - state.coins + EP * (after.energy - state.energy);
  const links = E.parcelLinks(after.cabin);
  after.cabin.forEach((r, slot) => {
    if (!r) return;
    const rem = Math.max(1, r.destination - after.floor);
    const fare = E.arrivalFare(r, after.cabin, slot, E.cooperationBonus(after), after.stress);
    const energy = riderProfile(r, after.cabin, slot).energy;
    v += Math.pow(0.95, rem) * fare - EP_FUTURE * energy * rem + 0.8 * transitIncome(r, after.cabin, slot) * rem;
    if (bot.favored.includes(r.kind)) v += bot.favor * Math.min(rem, 5);
    if (isLegend(r.kind)) v += LEGEND_HEURISTIC + (bot.legends.includes(r.kind as LegendKind) ? 12 : 0);
    // v9.20: what a dark legend pays on reaching the 70F shop (the one-step preview only sees his per-floor effects).
    if (isDarkLegend(r.kind)) v += Math.pow(0.95, rem) * ({ nightoperator: 20, severer: DARK_LEGEND_RULES.severerPay, kingpin: (r.stash ?? 0) + DARK_LEGEND_RULES.kingpinStash * rem, coldmatron: 15, banshee: DARK_LEGEND_RULES.bansheePay, necromancer: DARK_LEGEND_RULES.necromancerPay, highroller: DARK_LEGEND_RULES.highRollerPerPoint * (bot.band === 'high' ? 5 : bot.band === 'medium' ? 3 : 1.5), otherthirteen: DARK_LEGEND_RULES.thirteenPayMax / 2 } as Record<string, number>)[r.kind];
    if (r.kind === 'parcel' && r.big !== 'bottom' && !links.carrier.has(slot) && !after.cabin.some(o => Boolean(r.ownerId) && o?.id === r.ownerId)) v += Math.pow(0.95, rem) * (E.boxCoins(r) + EP_FUTURE * E.boxPower(r)) / 2;
    if (r.kind === 'courier' && r.parcelId && E.parcelBeside(after.cabin, slot, links)) v += Math.pow(0.95, rem) * EP_FUTURE * E.COURIER_ARRIVAL_CHARGE;
    // A Courier still waiting for a box: the chance one is dealt (about one floor in four) before he leaves.
    else if (r.kind === 'courier' && r.parcelId && E.PARCEL_RULES.adopt) v += 0.8 * PASSENGERS.courier.fare * (1 - Math.pow(0.73, Math.max(0, rem - 1)));
    // A Thief eyeing a box tips half its coins when he leaves.
    if (r.kind === 'thief' && E.thiefEyesParcel(links, slot)) v += Math.pow(0.95, rem) * E.boxCoins({}) * E.PARCEL_RULES.thiefShare;
    // v9.19: an ordinary blast costs the neighbours' fares and coins; only the Mad Bomber ends the run.
    if (isBombKind(r.kind) && (r.fuse ?? 9) < rem && !E.bombLocked(after.cabin, slot)) v -= r.kind === 'madbomber' ? 150 : 40;
    // Visible progress a player can plan around: repairs, compliance stamps, child care.
    const low = agitationBand(after.stress) === 'low';
    if (r.kind === 'mechanic' && !r.repairDone && low && rem >= 2) v += 0.6 * 3 * EP;
    if (r.kind === 'inspector' && !r.complianceReady && low && rem >= 2) v += 0.6 * 12;
    if (r.kind === 'child' && (r.careProgress ?? 0) < 2 && E.hasNeighbour(after.cabin, slot, ['lover', 'nurse', 'matron']) && rem >= 1) v += 0.6 * 6;
  });
  // v10: symbol links keep paying (and red ones keep agitating) until one of the pair gets off.
  v += linkOutlook(after, bot);
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

/** Seats a rider as the UI does (a two-part box takes a whole column); null when it does not fit. */
const place = (state: RunState | null, rider: Rider, slot: number): RunState | null => {
  if (!state) return null;
  const cabin = E.seatRider(state.cabin, rider, slot);
  return cabin ? { ...state, cabin } : null;
};
/** The UI refuses a Courier and his parcel aboard in non-adjacent seats. */
const valid = (state: RunState) => E.parcelLayoutOk(state.cabin);

/** The same net value the cards show (lib/net-value.ts). */
export const cardNet = (o: Rider, state: RunState) => netValue(o, state) ?? 0;
function chooseBoarding(state: RunState, offers: Rider[], bot: Bot, mode: LegendMode): RunState {
  let pool = offers.filter(o => !isLegend(o.kind) || mode === 'auto' || mode === 'board');
  let cur = state;
  if (mode === 'board') {
    const legend = pool.find(o => isLegend(o.kind));
    const slot = cur.cabin.findIndex(r => !r);
    if (legend && slot >= 0) { cur = place(cur, legend, !cur.cabin[1] ? 1 : slot)!; pool = pool.filter(o => o !== legend); }
  }
  if (bot.id === 'human') {
    // Board the best card values first, skip Thieves and Drifters, stop at a comfortable cabin, keep well below the cap.
    // v10: the card shows the rider's value at his best seat in this cabin (symbol links included).
    const net = (o: Rider) => boardNet(o, cur)?.value ?? cardNet(o, cur);
    for (const o of [...pool].sort((a, b) => net(b) - net(a))) {
      if (cur.cabin.filter(Boolean).length >= HUMAN.fill) break;
      if (o.kind === 'parcel' || HUMAN.avoid.includes(o.kind) || (cur.cabin.some(Boolean) && net(o) < HUMAN.minNet)) continue;
      const parcel = o.parcelId ? pool.find(p => p.id === o.parcelId) : undefined;
      let cand: RunState | null = null;
      if (parcel) { for (const [a, b] of ADJACENT.flatMap(([a, b]) => [[a, b], [b, a]])) { const c = place(place(cur, o, a), parcel, b); if (c && valid(c)) { cand = c; break; } } }
      else {
        // v10: a player sees the symbol lines while dragging, so the rider goes to the seat with the best links.
        const seatValue = (c: RunState) => { const l = E.symbolCoins(c); return l.coins + EP * (l.power + l.freePower) - 2 * (redCount(c.cabin) * SYMBOL_RULES.redAgitation + l.agitationLines.reduce((n, x) => n + x.amount, 0)); };
        for (const slot of [0, 1, 2, 3, 4, 5].filter(i => !cur.cabin[i])) { const c = place(cur, o, slot); if (c && (!cand || seatValue(c) > seatValue(cand))) cand = c; }
      }
      if (!cand) continue;
      if (HUMAN.lookahead) {
        const preview = E.resolveFloor(cand, previewRng());
        if (cur.cabin.some(Boolean) && (preview.status === 'lost' || preview.stress > preview.stressCap - HUMAN.stressMargin)) continue;
      } else if (cur.cabin.some(Boolean) && cur.stress >= cur.stressCap - HUMAN.stressMargin && netIncludesAgitation(o, cur)) continue; // judges by the card, not a settlement preview
      cur = cand;
    }
    return cur;
  }
  if (bot.id === 'novice' || bot.id === 'casual' || bot.id === 'casualnet') {
    // Instinct: fill seats with the highest printed fare, but heed a red "you will not survive the next floor" forecast.
    // casualnet ranks by the card's net value instead and skips riders whose net is negative once someone is aboard.
    const net = (o: Rider) => cardNet(o, cur);
    const order = bot.id === 'casualnet' ? [...pool].sort((a, b) => net(b) - net(a)) : [...pool].sort((a, b) => PASSENGERS[b.kind].fare - PASSENGERS[a.kind].fare);
    for (const o of order) {
      // The card says the Courier only pays with his parcel beside him: casual players take both or neither,
      // or (with adoption) put a spare parcel beside a Courier who is still waiting for one.
      if (o.kind === 'parcel') {
        if (!E.PARCEL_RULES.adopt) continue;
        const needy = cur.cabin.flatMap((r, i) => r?.kind === 'courier' && !E.parcelBeside(cur.cabin, i) ? [i] : []);
        const cand = needy.flatMap(i => E.neighbours(i)).map(i => place(cur, o, i)).find(c => c && valid(c) && needy.some(i => E.parcelBeside(c.cabin, i)));
        if (cand) cur = cand;
        continue;
      }
      if (bot.id === 'casualnet' && cur.cabin.some(Boolean) && net(o) < 0) continue;
      const slot = cur.cabin.findIndex(r => !r); if (slot < 0) break;
      const parcel = o.parcelId ? pool.find(p => p.id === o.parcelId) : undefined;
      let cand = place(cur, o, slot);
      if (parcel) {
        cand = null;
        for (const [a, b] of ADJACENT.flatMap(([a, b]) => [[a, b], [b, a]])) { const c = place(place(cur, o, a), parcel, b); if (c && valid(c)) { cand = c; break; } }
      }
      if (!cand) continue;
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
      const cand = place(cur, o, slot); if (!cand || !valid(cand)) continue; const v = evaluate(cand, bot);
      if (!best || v > best.v) best = { s: cand, v, used: [o] };
    }
    // Pairs, so that synergies that need two new riders (lovers, cop+thief) are visible.
    for (let i = 0; i < pool.length; i++) for (let j = i + 1; j < pool.length; j++) for (const a of empty) for (const b of empty) {
      if (a === b) continue;
      const cand = place(place(cur, pool[i], a), pool[j], b); if (!cand || !valid(cand)) continue; const v = evaluate(cand, bot);
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
    const order = bot.id === 'novice' || bot.id === 'human' ? cards : [...bot.abilities, ...GENERIC_ABILITIES];
    return order.find(k => cards.includes(k));
  };
  if (bot.id === 'human') {
    // Real records: take the first card, fill the battery, then a storage level if coins remain; no calming, no extras.
    const first = pickAbility(); if (first) { s = E.installUpgrade(s, first); log.abilities.push(first); }
    while ((s.freeBoxLevels ?? 0) > 0 && E.canBuyBoxLevel(s, 'storage')) { s = E.buyBoxLevel(s, 'storage'); log.box.push('storage'); }
    const units = Math.min(s.energyCap - s.energy, E.affordableChargingPlan(s).units);
    if (units > 0) s = E.chargeBattery(s, units);
    const line = bot.box.find(l => E.canBuyBoxLevel(s, l));
    if (line) { s = E.buyBoxLevel(s, line); log.box.push(line); const more = Math.min(s.energyCap - s.energy, E.affordableChargingPlan(s).units); if (more > 0) s = E.chargeBattery(s, more); }
    log.shops.push({ ...entry, exitCoins: s.coins, exitEnergy: s.energy, target: s.energyCap, affluent: false });
    return E.leaveShop(s);
  }
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
  const chargeFor = (units: number) => chargeCost(E.boxOf(s), Math.max(0, units), s.floor);
  // 4. box investment
  if (bot.id !== 'novice' && bot.box.length && boxTotal(E.boxOf(s)) < E.boxTotalCap(s.floor)) {
    const bottleneck: BoxLine[] = need > s.energyCap ? ['storage', 'motor', 'transformer'] : s.floor >= 30 ? ['motor', 'transformer', 'storage'] : ['transformer', 'motor', 'storage'];
    const order = bot.fixedBox ? bot.box : bot.id === 'balanced' || bot.id === 'investor' ? bottleneck : [...bot.box, ...bottleneck];
    const line = order.find(l => E.canBuyBoxLevel(s, l));
    if (line) {
      const price = E.boxLevelPrice(s, line);
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
  // v9.19: with every slot full, raise the first raisable ability when the coins beyond the power plan allow it.
  if (bot.id !== 'novice') {
    const key = (Object.keys(s.upgrades) as UpgradeKey[]).find(k => E.canRaiseAbility(s, k));
    if (key && s.coins - E.abilityLevel2Price(s) >= chargeFor(Math.max(0, target - s.energy))) s = E.raiseAbility(s, key);
  }
  // (The Reserve Cell left the shop in v9.0.2; bots no longer buy what players cannot.)
  // v9.7 shop calming: bring high agitation down with coins beyond the power plan.
  while (s.stress >= s.stressCap - 3 && E.calmAllowance(s) > 0 && s.coins - E.calmPrice(s.floor) >= chargeFor(Math.max(0, target - s.energy))) { const next = E.buyCalm(s, 1); if (next === s) break; s = next; }
  // top up with anything left if still under target (scarcity check reads what remains)
  units = Math.min(Math.max(0, target - s.energy), E.affordableChargingPlan(s).units);
  if (units > 0) s = E.chargeBattery(s, units);
  const boxPrice = Math.min(...BOX_LINES.map(l => (E.boxOf(state)[l] < 3 ? BOX_PRICES[E.boxOf(state)[l]] : Infinity)));
  // Rich = after paying for everything the next sector really needs (shop charge to cap, the emergency power
  // beyond the cap at its higher price, one box level) there are still 20 coins spare.
  const needBeyondCap = Math.max(0, Math.ceil(need) - state.energyCap);
  const survivalCost = chargeCost(E.boxOf(state), Math.max(0, Math.min(state.energyCap, Math.ceil(need)) - entry.energy), state.floor) + needBeyondCap * emergencyUnitPrice(E.boxOf(state));
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
  emergencyUnits: number; incidents: number; dismissals?: number; riderFloors?: number; links?: number; calmUnits?: number; inspectors?: number; stamped?: number; shops: ShopLog[]; abilities: UpgradeKey[]; box: BoxLine[];
  bombDismissals?: number; marketBuys?: number; itemsUsed?: number; overtimeCharge?: number; boxAbilities?: number; boxAbilityFinds?: number; parcel?: Record<'offered' | 'paired' | 'courierOnly' | 'parcelOnly' | 'opened' | 'adopted' | 'unpaid' | 'delivered' | 'thefts' | 'bigOffered' | 'bigBoarded' | 'childOpens' | 'parts' | 'inspected' | 'contested' | 'bombCarry' | 'mimicCopy' | 'rareBoarded' | 'rareOffered', number>; legend?: LegendKind; legendStatus?: string; keepsakes: string[]; boarded: Record<string, number>; delivered: Record<string, number>; offered: Record<string, number>;
  shopStyle: 'archetype' | 'generic'; peakCoins: number; pressure: Record<string, number>; income?: Record<string, number>; deathSources?: string; stressFloors: { low: number; medium: number; high: number };
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
    for (const r of state.cabin) if (isBombKind(r?.kind) && (r!.fuse ?? 9) <= E.bombTick(state.stress) && r!.destination > state.floor + 1 && !E.bombLocked(state.cabin, state.cabin.indexOf(r))) { const before = state; state = E.dismissRider(state, r.id); if (state !== before) log.bombDismissals = (log.bombDismissals ?? 0) + 1; }
    for (const o of offers) log.offered[o.kind] = (log.offered[o.kind] ?? 0) + 1;
    state = chooseBoarding(state, offers, bot, mode);
    if (!state.cabin.some(Boolean)) { const slot = 0; state = place(state, offers.find(o => !isLegend(o.kind) && o.kind !== 'parcel') ?? offers[0], slot) ?? state; }
    for (const r of state.cabin) if (r && !before.has(r.id)) log.boarded[r.kind] = (log.boarded[r.kind] ?? 0) + 1;
    {
      const p = (log.parcel ??= { offered: 0, paired: 0, courierOnly: 0, parcelOnly: 0, opened: 0, adopted: 0, unpaid: 0, delivered: 0, thefts: 0, bigOffered: 0, bigBoarded: 0, childOpens: 0, parts: 0, inspected: 0, contested: 0, bombCarry: 0, mimicCopy: 0, rareBoarded: 0, rareOffered: 0 });
      if (offers.some(o => o.kind === 'parcel' && o.tier)) p.rareOffered++;
      if (state.cabin.some(r => r?.kind === 'parcel' && r.tier && r.big !== 'bottom' && !before.has(r.id))) p.rareBoarded++;
      if (offers.some(o => o.big)) p.bigOffered++;
      if (state.cabin.some(r => r?.big === 'top' && !before.has(r.id))) p.bigBoarded++;
      if (offers.some(o => o.kind === 'parcel')) p.offered++;
      state.cabin.forEach((r, slot) => {
        if (!r || before.has(r.id)) return;
        if (r.kind === 'courier' && r.parcelId) { if (E.parcelBeside(state.cabin, slot)) p.paired++; else p.courierOnly++; }
        if (r.kind === 'parcel' && r.big !== 'bottom' && !state.cabin.some(o => Boolean(r.ownerId) && o?.id === r.ownerId)) { const by = E.parcelLinks(state.cabin).carrier.get(slot); if (by !== undefined && state.cabin[by]?.parcelId !== r.id) p.adopted++; else p.parcelOnly++; }
      });
    }
    // Dispatch / Rebooking: shorten the longest new trip by one stop (fare unchanged).
    if (bot.id !== 'novice' && (state.upgrades.dispatch || state.upgrades.retime)) {
      const fresh = state.cabin.filter(r => r && r.boardedAt === state.floor && !isLegend(r.kind) && r.destination - state.floor >= 3).sort((a, b) => b!.destination - a!.destination)[0];
      if (fresh) state = E.retimeRider(state, fresh.id, -1);
    }
    // emergency power only when the actual next ascent would fail
    const test = () => E.resolveFloor(state, previewRng());
    // Paid dismissal when the forecast says this cabin will not survive (two per sector, fare forfeited).
    if (bot.id !== 'novice' && bot.id !== 'human') {
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
      let guard = 0;
      while (guard++ < 12 && powerDeath() && E.emergencyAllowance(state) > 0) { state = E.emergencyCharge(state, 1); log.emergencyUnits++; }
      // v9.19: past the allowance, skilled bots buy overtime packs while they would otherwise run out.
      guard = 0;
      while (bot.id !== 'human' && bot.id !== 'novice' && guard++ < 6 && powerDeath() && E.buyOvertimeCharge(state) !== state) { state = E.buyOvertimeCharge(state); log.overtimeCharge = (log.overtimeCharge ?? 0) + 1; }
      const calmDeath = () => { const t = test(); return t.status === 'lost' && t.message.includes('躁动'); };
      guard = 0;
      while ((bot.id !== 'human' || HUMAN.transitCalm) && guard++ < 12 && calmDeath() && E.calmAllowance(state) > 0) { state = E.buyCalm(state, 1); log.calmUnits = (log.calmUnits ?? 0) + 1; }
    }
    // v9.21 the night market: skilled and human-like bots buy a Flare (else a Sedative) when coins allow; held tools
    // are used on a real gamble (a 20%+ chance this ascent ends the run). Bots still buy nothing at ordinary shops.
    if (state.marketFloor === state.floor && state.marketStock && bot.id !== 'novice') {
      // v9.21.1: the dearer night-market goods come first when the bot can afford them and keep 40 coins.
      for (const want of ['longflare', 'flare', 'strongsedative', 'sedative', 'sandalwood'] as const) { const i = state.marketStock.findIndex(c => c.key === want && !c.sold); if (i >= 0 && state.coins - state.marketStock[i].price >= 40) { state = E.buyMarketItem(state, i); log.marketBuys = (log.marketBuys ?? 0) + 1; break; } }
    }
    if (state.items?.includes('sandalwood') && state.stress >= state.stressCap - 4) { state = E.applyItem(state, 'sandalwood'); log.itemsUsed = (log.itemsUsed ?? 0) + 1; }
    if (state.items?.length && abyssLossChance(state) >= 0.2) {
      const flare = (['longflare', 'flare'] as const).find(k => E.itemUsable(state, k));
      if (flare) { state = E.applyItem(state, flare); log.itemsUsed = (log.itemsUsed ?? 0) + 1; }
      else for (const key of ['strongsedative', 'sedative'] as const) { if (!state.items.includes(key)) continue; const slot = E.outburstSlots(state).find(i => !outburstIsPower(state.cabin[i]!.kind)); const target = slot === undefined ? null : state.cabin[slot]; if (target && E.itemUsable(state, key, target)) { state = E.applyItem(state, key, target.id); log.itemsUsed = (log.itemsUsed ?? 0) + 1; } break; }
    }
    log.stressFloors[agitationBand(state.stress)]++;
    { const aboard = state.cabin.filter(r => r && !isLegend(r.kind)); log.riderFloors = (log.riderFloors ?? 0) + aboard.length; log.links = (log.links ?? 0) + ADJACENT.filter(([a, b]) => activeConnection(state.cabin, a, b)).length; }
    const cabinBefore = state.cabin.filter(Boolean).map(r => r!);
    const next = E.resolveFloor(state, stream(opt.seed, 'resolve', state.floor));
    opt.onAscent?.(state, next);
    // A box's ability with every slot full: swap out the lowest-ranked installed ability if the new one ranks higher.
    if (next.pendingAbility) {
      const rank = (k: UpgradeKey) => { const own = bot.abilities.indexOf(k); return own >= 0 ? own : bot.abilities.length + GENERIC_ABILITIES.indexOf(k); };
      const worst = (Object.keys(next.upgrades) as UpgradeKey[]).filter(k => next.upgrades[k] > 0 && E.canReplaceWithBoxAbility(next, k)).sort((a, b) => rank(b) - rank(a))[0];
      const found = next.pendingAbility;
      Object.assign(next, E.resolveBoxAbility(next, worst && rank(found) < rank(worst) ? worst : null));
      log.boxAbilities = (log.boxAbilities ?? 0) + 1;
    }
    for (const r of cabinBefore) if (!next.cabin.some(n => n?.id === r.id) && next.lastArrivals?.some(a => a.riderId === r.id)) log.delivered[r.kind] = (log.delivered[r.kind] ?? 0) + 1;
    for (const a of next.lastArrivals ?? []) if (a.kind === 'parcel') log.parcel!.opened++;
    {
      const p = log.parcel!, links = E.parcelLinks(state.cabin);
      if (next.lastEarnings.sources.some(l => l.label === '小偷带走纸箱的小费')) p.thefts++;
      if ([...next.lastEarnings.sources, ...next.lastEnergy.sources].some(l => l.label === '小孩拆开纸箱')) p.childOpens++;
      const said = (text: string) => next.message.includes(text) || next.log.some(line => line.includes(text));
      if (said('维修工拆了纸箱')) p.parts++;
      if (said('检查员验货')) p.inspected++;
      if (said('能力「')) log.boxAbilityFinds = (log.boxAbilityFinds ?? 0) + 1;
      if (said('快递员带走了炸弹')) p.bombCarry++;
      if (next.lastEarnings.sources.some(l => l.label === '复制人的复制箱') || next.lastEnergy.sources.some(l => l.label === '复制人的复制箱')) p.mimicCopy++;
      if (next.lastPressure.sources.some(l => l.label === '快递员争纸箱')) p.contested++;
      state.cabin.forEach((r, slot) => {
        if (r?.kind !== 'courier' || !r.parcelId || r.destination > state.floor + 1) return;
        if (next.cabin.some(n => n?.id === r.id)) return;
        if (!E.parcelBeside(state.cabin, slot, links)) { p.unpaid++; return; }
        p.delivered++;
      });
    }
    for (const a of next.lastArrivals ?? []) if (a.kind === 'inspector') { log.inspectors = (log.inspectors ?? 0) + 1; if (a.coins >= PASSENGERS.inspector.fare + 12) log.stamped = (log.stamped ?? 0) + 1; }
    if (next.message.includes('车厢事故') || next.log[0]?.includes('车厢事故')) log.incidents++;
    for (const line of next.lastPressure.sources) if (line.amount > 0) log.pressure[line.label] = (log.pressure[line.label] ?? 0) + line.amount;
    // v10.2.5: income by source and by ten-floor band, for the money study.
    { const band = `${Math.floor((next.floor - 1) / 10) * 10 + 1}`; const income = (log.income ??= {}); for (const line of next.lastEarnings.sources) if (line.amount > 0) { income[line.label] = (income[line.label] ?? 0) + line.amount; income[`@${band}`] = (income[`@${band}`] ?? 0) + line.amount; income[`${band}|${line.label.replace(/ ×\d+$/, '')}`] = (income[`${band}|${line.label.replace(/ ×\d+$/, '')}`] ?? 0) + line.amount; } }
    if (next.status === 'lost') log.deathSources = next.lastPressure.sources.map(l => `${l.label}${l.amount > 0 ? '+' : ''}${l.amount}`).join(' ') + ` | stress ${next.stress}/${next.stressCap} riders ${state.cabin.filter(Boolean).map(r => r!.kind).join(',')}`;
    state = next;
    log.peakCoins = Math.max(log.peakCoins, state.coins);
    if (state.status === 'playing') {
      // close calls: the next ascent is nearly unaffordable, agitation is one or two steps from loss, or a fuse is about to blow
      const cost = E.energyBreakdown(state).total + (state.cabin.some(Boolean) ? 0 : 1);
      const power = state.energy - cost <= 2;
      const stress = state.stress >= state.stressCap - 2;
      const bomb = state.cabin.some((r, i) => isBombKind(r?.kind) && (r!.fuse ?? 9) <= 1 && r!.destination > state.floor + 1 && !E.bombLocked(state.cabin, i));
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
