// v10 symbol links. Every rider carries two of six symbols; links follow from the symbols alone.
// Neighbours sharing a symbol are joined by a green link, neighbours holding opposite symbols by a red one, and one pair
// can carry both. Shapes of one symbol (a full row, a 2×2 square, the whole cabin) pay a bonus on top. Riders' own
// abilities (the Officer holding a Thief, the Lovers' pairing…) stay in their rules; this file replaces the old per-kind
// like / avoid lists.
import type { MysteryIdentity } from './dark-rules';
import { ADJACENT, type PassengerKind } from './game-data';

export type SymbolKey = 'lively' | 'quiet' | 'order' | 'street' | 'hearth' | 'spirit';
export const SYMBOL_KEYS: SymbolKey[] = ['lively', 'quiet', 'order', 'street', 'hearth', 'spirit'];
export const SYMBOLS: Record<SymbolKey, { zh: string; en: string; opposite: SymbolKey }> = {
  lively: { zh: '热闹', en: 'Lively', opposite: 'quiet' },
  quiet: { zh: '安静', en: 'Quiet', opposite: 'lively' },
  order: { zh: '秩序', en: 'Order', opposite: 'street' },
  street: { zh: '江湖', en: 'Street', opposite: 'order' },
  hearth: { zh: '人间', en: 'Hearth', opposite: 'spirit' },
  spirit: { zh: '幽冥', en: 'Spirit', opposite: 'hearth' },
};

type Pair = [SymbolKey, SymbolKey];
/** Day riders are weighted so each symbol turns up about equally often; dark versions lean to Lively, Street and Spirit,
 * the opposites of the day's Quiet, Order and Hearth, so midnight turns many settled neighbours into red links. */
export const RIDER_SYMBOLS: Partial<Record<PassengerKind, Pair>> = {
  // v10.1: the Courier and the Mechanic know the building's odd corners (Street·Spirit): Spirit was the scarcest day symbol
  // and its opposite, Hearth, sat on the most common riders.
  commuter: ['quiet', 'order'], tourist: ['lively', 'hearth'], courier: ['street', 'spirit'], mechanic: ['street', 'spirit'],
  lover: ['hearth', 'quiet'], musician: ['lively', 'spirit'], thief: ['street', 'spirit'], cop: ['lively', 'order'],
  lawyer: ['quiet', 'street'], drunk: ['lively', 'street'], nurse: ['hearth', 'order'], child: ['lively', 'hearth'],
  ghost: ['quiet', 'spirit'], exorcist: ['order', 'spirit'], coach: ['lively', 'street'], celebrity: ['lively', 'spirit'],
  inspector: ['quiet', 'order'], bomb: ['street', 'spirit'],
  overtimer: ['order', 'spirit'], voyeur: ['quiet', 'street'], smuggler: ['quiet', 'street'], scrapper: ['lively', 'street'],
  exlover: ['lively', 'spirit'], noisemaker: ['lively', 'street'], robber: ['lively', 'street'], crookedcop: ['order', 'spirit'],
  shyster: ['street', 'spirit'], brawler: ['lively', 'street'], pusher: ['quiet', 'street'], creepychild: ['quiet', 'spirit'],
  wraith: ['lively', 'spirit'], summoner: ['street', 'spirit'], taskmaster: ['lively', 'order'], scandal: ['lively', 'street'],
  grafter: ['lively', 'order'], madbomber: ['lively', 'spirit'],
};
/** A Mystery shows no symbols until his identity is revealed. */
export const MYSTERY_SYMBOLS: Record<MysteryIdentity, Pair> = {
  undercover: ['quiet', 'order'], fugitive: ['quiet', 'street'], magnate: ['lively', 'order'], saint: ['hearth', 'quiet'],
};

/** Tunable payouts (per floor): each shared symbol, each opposite pair, and each shape of one symbol. */
/** `net`: a pair's shared and opposite symbols cancel one for one (one match and one clash draw no line).
 * `mixed`: each symbol's green link pays in its own resource (SYMBOL_EFFECTS); otherwise every green link pays coins.
 * Shapes count as extra green links of their symbol (row / square / full). */
export const SYMBOL_RULES = { greenCoins: 1, redAgitation: 1, row: 1, square: 2, full: 4, net: true, mixed: true, active: true };
/** What one green link of each symbol does per floor. Opposite symbols pay in different resources. */
/** `freePower`: power saved that may also offset the motor (not capped by the riders' own use). `outburst`: abyss outburst
 * odds removed per level (0.1 = 10 points). */
export const SYMBOL_EFFECTS: Record<SymbolKey, { coins?: number; agitation?: number; power?: number; freePower?: number; outburst?: number }> = {
  // v10.1: Street lost its +1 agitation (36% → 54% of floors active when built around) and pays 2 like Lively; its riders
  // carry their own risk. At +3 it left 124 coins after the 70F shop instead of 87.
  lively: { coins: 2 }, street: { coins: 2 }, order: { agitation: -1 }, hearth: { agitation: -1 }, quiet: { power: 1 }, spirit: { power: 1 },
};

type Seat = { id?: string; kind: PassengerKind; revealed?: boolean; identity?: MysteryIdentity; traits?: { symbols?: SymbolKey[] } } | null;
/** The symbols a rider shows in this seat: a Mimic shows those of the rider directly above him. */
export function symbolsOf(rider: Seat, cabin: Seat[] = [], slot = -1): SymbolKey[] {
  if (!rider) return [];
  if (rider.kind === 'mimic') { const above = slot >= 3 ? cabin[slot - 3] : null; return above && above.kind !== 'mimic' ? symbolsOf(above, cabin, slot - 3) : []; }
  if (rider.kind === 'mystery') return rider.revealed && rider.identity ? MYSTERY_SYMBOLS[rider.identity] : [];
  if (rider.traits?.symbols) return rider.traits.symbols;
  return RIDER_SYMBOLS[rider.kind] ?? [];
}
export const opposes = (a: SymbolKey, b: SymbolKey) => SYMBOLS[a].opposite === b;
/** What two neighbours share (green) and which of their symbols clash (red). */
export function pairLink(a: SymbolKey[], b: SymbolKey[]) {
  const shared = a.filter(s => b.includes(s)), clashes = a.flatMap(x => b.filter(y => opposes(x, y)).map(y => [x, y] as Pair));
  if (!SYMBOL_RULES.net) return { shared, clashes };
  const cancel = Math.min(shared.length, clashes.length);
  return { shared: shared.slice(cancel), clashes: clashes.slice(cancel) };
}
export type SymbolEdge = { first: number; second: number; shared: SymbolKey[]; clashes: Pair[] };
export function symbolEdges(cabin: Seat[]): SymbolEdge[] {
  return ADJACENT.flatMap(([first, second]) => {
    const link = pairLink(symbolsOf(cabin[first], cabin, first), symbolsOf(cabin[second], cabin, second));
    return link.shared.length || link.clashes.length ? [{ first, second, ...link }] : [];
  });
}
/** v10.2.4 (playtest: an Officer beside a Commuter shares Order yet shows no link): neighbours whose shared symbols and
 * clashes cancel out completely under the net rule. They have no link, but the cabin marks the pair so the player sees why. */
export function cancelledEdges(cabin: Seat[]): SymbolEdge[] {
  if (!SYMBOL_RULES.net) return [];
  return ADJACENT.flatMap(([first, second]) => {
    if (!cabin[first] || !cabin[second]) return [];
    const a = symbolsOf(cabin[first], cabin, first), b = symbolsOf(cabin[second], cabin, second);
    const shared = a.filter(s => b.includes(s)), clashes = a.flatMap(x => b.filter(y => opposes(x, y)).map(y => [x, y] as Pair));
    return shared.length && shared.length === clashes.length ? [{ first, second, shared, clashes }] : [];
  });
}
export const greenCount = (cabin: Seat[]) => symbolEdges(cabin).reduce((n, e) => n + e.shared.length, 0);
export const redCount = (cabin: Seat[]) => symbolEdges(cabin).reduce((n, e) => n + e.clashes.length, 0);

export type SymbolShape = { kind: 'row' | 'square' | 'full'; symbol: SymbolKey; slots: number[] };
const SHAPES: Array<{ kind: SymbolShape['kind']; slots: number[] }> = [
  { kind: 'full', slots: [0, 1, 2, 3, 4, 5] },
  { kind: 'row', slots: [0, 1, 2] }, { kind: 'row', slots: [3, 4, 5] },
  { kind: 'square', slots: [0, 1, 3, 4] }, { kind: 'square', slots: [1, 2, 4, 5] },
];
/** Shapes whose every seat shows the same symbol. A full cabin counts once as full (its rows and squares are not added). */
export function symbolShapes(cabin: Seat[]): SymbolShape[] {
  const found: SymbolShape[] = [];
  for (const shape of SHAPES) for (const symbol of SYMBOL_KEYS) {
    if (!shape.slots.every(i => symbolsOf(cabin[i], cabin, i).includes(symbol))) continue;
    if (shape.kind !== 'full' && found.some(f => f.kind === 'full' && f.symbol === symbol)) continue;
    found.push({ kind: shape.kind, symbol, slots: shape.slots });
  }
  return found;
}
const SHAPE_LABEL: Record<SymbolShape['kind'], string> = { row: '一排', square: '方块', full: '满车' };
/** Green links of each symbol this ascent (shapes counted as extra links of their symbol). */
export function greenBySymbol(cabin: Seat[], rules = SYMBOL_RULES) {
  const count: Partial<Record<SymbolKey, number>> = {};
  // `active`: a symbol with any green link counts once (level 1); shapes raise its level. Otherwise every link counts.
  for (const e of symbolEdges(cabin)) for (const s of e.shared) count[s] = rules.active ? 1 : (count[s] ?? 0) + 1;
  for (const sh of symbolShapes(cabin)) count[sh.symbol] = (count[sh.symbol] ?? 0) + rules[sh.kind];
  return count;
}
/** What the cabin's symbol links do on one ascent: coins (itemized), agitation lines (relief and Street trouble) and
 * power saved. `coinBonus` is added to every level of a coin-paying symbol (the Battery and the Red String). */
export function symbolLedger(cabin: Seat[], rules = SYMBOL_RULES, coinBonus = 0) {
  const green = greenCount(cabin), red = redCount(cabin), shapes = symbolShapes(cabin);
  const lines: Array<{ label: string; amount: number }> = [], agitationLines: Array<{ label: string; amount: number }> = [];
  let power = 0, freePower = 0, outburstCut = 0;
  if (!rules.mixed) {
    if (green) lines.push({ label: `绿线 ${green} 条`, amount: green * rules.greenCoins });
    for (const s of shapes) lines.push({ label: `${SYMBOLS[s.symbol].zh}${SHAPE_LABEL[s.kind]}`, amount: rules[s.kind] });
  } else {
    for (const [symbol, n] of Object.entries(greenBySymbol(cabin, rules)) as Array<[SymbolKey, number]>) {
      const fx = SYMBOL_EFFECTS[symbol], name = n > 1 ? `${SYMBOLS[symbol].zh}绿线 ${n}级` : `${SYMBOLS[symbol].zh}绿线`;
      if (fx.coins) lines.push({ label: name, amount: n * (fx.coins * rules.greenCoins + coinBonus) });
      if (fx.agitation) agitationLines.push({ label: name, amount: n * fx.agitation });
      if (fx.power) power += n * fx.power;
      if (fx.freePower) freePower += n * fx.freePower;
      if (fx.outburst) outburstCut += n * fx.outburst;
    }
  }
  return { coins: lines.reduce((n, l) => n + l.amount, 0), lines, agitationLines, power, freePower, outburstCut, green, red, agitation: red * rules.redAgitation, shapes };
}

// The icons themselves are drawn as SVG in components/symbol-icon.tsx; text always uses the symbol's name.
/** One symbol's green-link effect per level, e.g. “+2 币” / “+2 coins”. */
export function symbolEffectText(symbol: SymbolKey, zh: boolean, level = 1, coinBonus = 0) {
  const fx = SYMBOL_EFFECTS[symbol], parts: string[] = [];
  if (fx.coins) parts.push(zh ? `+${level * (fx.coins + coinBonus)} 币` : `+${level * (fx.coins + coinBonus)} coins`);
  if (fx.agitation) parts.push(zh ? `${fx.agitation > 0 ? '+' : '−'}${level * Math.abs(fx.agitation)} 躁动` : `${fx.agitation > 0 ? '+' : '−'}${level * Math.abs(fx.agitation)} agitation`);
  if (fx.power) parts.push(zh ? `省 ${level * fx.power} 电` : `−${level * fx.power} power`);
  if (fx.freePower) parts.push(zh ? `省 ${level * fx.freePower} 电（也能抵电梯运转）` : `−${level * fx.freePower} power (the motor’s too)`);
  if (fx.outburst) parts.push(zh ? `深渊发作几率 −${Math.round(level * fx.outburst * 100)}%` : `abyss outburst odds −${Math.round(level * fx.outburst * 100)}%`);
  return parts.join(zh ? '，' : ', ');
}
/** Tooltip for one symbol: its name, what its green link does each floor, and its opposite. */
export function symbolTitle(symbol: SymbolKey, zh: boolean) {
  const opp = SYMBOLS[symbol].opposite;
  return zh
    ? `${SYMBOLS[symbol].zh}：和同样有${SYMBOLS[symbol].zh}的人挨着坐 = 绿线，每层 ${symbolEffectText(symbol, true)}；挨着${SYMBOLS[opp].zh} = 红线，每层 +1 躁动`
    : `${SYMBOLS[symbol].en}: beside another ${SYMBOLS[symbol].en} = green link, ${symbolEffectText(symbol, false)} a floor; beside ${SYMBOLS[opp].en} = red link, +1 agitation a floor`;
}
