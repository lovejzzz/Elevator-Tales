import { DARK_OF, isDark, isDarkLegend, isLegend, type PassengerKind } from './game-data';

/** v9.19 “After midnight”: tuning for the dark versions, corruption and the late sectors (scripts/balance-sim). */
export const DARK_RULES = {
  /** Share of new cards that arrive as their dark version, from each boarding floor on (cards drawn on leaving the
   * 60F shop ride to 61F and up, so the first dark cards appear right after the midnight bell). */
  share: [[60, 0.35], [70, 0.6], [80, 0.85], [90, 1]] as Array<[number, number]>,
  /** Leaving the shop on this floor rings the midnight bell. */
  midnightFloor: 60,
  overtimePay: 2, overstayAgitation: 1, overstayMax: 3,
  voyeurAgitation: 1, voyeurPhoto: 3,
  smugglerBoxMultiplier: 2, seizeReward: 15, bribe: 8,
  scrapperCoins: 4, scrapperMotor: 1, fenceCoins: 2,
  exFareBonus: 1,
  noiseAgitation: 1, noiseHighCoins: 4,
  /** A Brawler or Noisemaker getting off lowers agitation this much (after ordinary arrival relief). */
  troublemakerRelief: 2,
  robberBase: 2, robberRate: 0.03, robberCap: 10, robberAgitation: 1, robberBounty: 15,
  crookedFee: 3, crookedCalm: 1,
  shysterPerRed: 3, shysterCap: 9, shysterAgitation: 0,
  brawlerSelf: 1, brawlerPerNormal: 1, brawlerHighBonus: 2,
  pusherCalm: 2, withdrawal: 1, withdrawalFloors: 2,
  creepyPerNeighbour: 1, creepyAloneBonus: 10,
  wraithDrain: 1, wraithControlledCoins: 4,
  summonEvery: 3, summonTrip: 4, summonFareBonus: 1,
  taskmasterFareBonus: 1, taskmasterAgitation: 1,
  scandalPerNeighbour: 1, scandalVoyeur: 3,
  grafterFee: 2, grafterAgitation: 1,
  /** The Mad Bomber's real-time timer is this share of an ordinary Bomber's. */
  madbomberSeconds: 0.6,
  /** A normal rider beside at least this many dark riders for this many departures in a row turns dark. */
  corruptionNeighbours: 2, corruptionFloors: 2,
  /** From this floor, every `abyssEvery` floors the dark riders' troubles grow one step. */
  abyssFrom: 80, abyssEvery: 20,
  /** v9.20.1 the abyss: from `extremeFrom`, one step every `extremeEvery` floors. Dark riders grow more extreme with each
   * step: a dark card drawn there pays +`extremeFarePerStep` of its base fare per step, and every dark rider aboard may lash
   * out each floor (`outburstPerStep` per step, at most `outburstMax`) for +`outburstAgitation`. A Flare or a Sedative
   * stops it; nothing else does. The odds are printed on the cards and the ascend button reports the chance to boil over. */
  // v9.22 late money: the premium went 0.5 → 0.25 per step (with dark fares ×0.75 and no survivor bonus) so post-midnight floors stop piling up coins.
  extremeFrom: 80, extremeEvery: 5, extremeFarePerStep: 0.25, outburstPerStep: 0.1, outburstMax: 0.5, outburstAgitation: 3,
  /** Riders whose outburst drains power instead (the parts-strippers, the cold and the tireless). */
  outburstPower: 6,
  /** An ordinary Bomber reaching zero blows his neighbours out of the cabin and costs this many coins. */
  blastCoins: 20,
};

/** v9.21 “the eve of the abyss”: leaving the 80F shop, four of floors 81–89 are announced, one of each kind.
 * Hush: no dark rider causes trouble on the ascent from that floor (a free Flare). Surge: outburst odds ×`surgeMultiplier`
 * on that ascent. Bounty: one dark card waiting there pays +`bountyCoins` on arrival. Market: a stall at that floor sells
 * items at shop prices. Known in advance, so the floors between can be planned around them. */
export const ABYSS_EVENTS = { shopFloor: 80, from: 81, to: 89, surgeMultiplier: 2, bountyCoins: 20 } as const;
export type AbyssEventKind = 'hush' | 'surge' | 'bounty' | 'market';
export const ABYSS_EVENT_KINDS: AbyssEventKind[] = ['hush', 'surge', 'bounty', 'market'];

/** v9.20 hidden “dark resonance”: a cabin of at least `min` riders, all dark versions or dark legends, calms down and pays.
 * Deliberately not described on any card or rule page. */
export const DARK_RESONANCE = { min: 4, calm: 2, coinsPerRider: 1 };

/** Share of new cards turning dark on this floor (0 before midnight). */
export function darkShare(floor: number) {
  let share = 0;
  for (const [from, value] of DARK_RULES.share) if (floor >= from) share = value;
  return share;
}
/** 0 before the abyss; 1, 2 … every `abyssEvery` floors from `abyssFrom`. */
export const abyssTier = (floor: number) => floor >= DARK_RULES.abyssFrom ? 1 + Math.floor((floor - DARK_RULES.abyssFrom) / DARK_RULES.abyssEvery) : 0;
/** v9.20.1: the abyss step on this floor (0 before `extremeFrom`, then 1, 2 … every `extremeEvery` floors). */
export const abyssStep = (floor: number) => floor >= DARK_RULES.extremeFrom ? 1 + Math.floor((floor - DARK_RULES.extremeFrom) / DARK_RULES.extremeEvery) : 0;
/** v9.20.1: dark riders whose outburst drains power (the rest add agitation). */
export const POWER_OUTBURSTS: PassengerKind[] = ['scrapper', 'wraith', 'overtimer', 'summoner', 'smuggler', 'grafter', 'noisemaker', 'voyeur'];
export const outburstIsPower = (kind: PassengerKind) => POWER_OUTBURSTS.includes(kind);
/** Chance that one dark rider lashes out on the ascent to this floor. */
export const outburstChance = (floor: number) => Math.min(DARK_RULES.outburstMax, DARK_RULES.outburstPerStep * abyssStep(floor));
/** A normal rider who can still turn dark (has a dark version, not a legend or a box). */
export const corruptible = (kind: PassengerKind) => Boolean(DARK_OF[kind]) && !isLegend(kind);
/** Riders the midnight rules call “normal” (survivors): people who are neither dark, legends nor boxes. */
export const isSurvivor = (kind: PassengerKind) => kind !== 'parcel' && !isLegend(kind) && !isDark(kind) && !isDarkLegend(kind);
export const isBombKind = (kind: PassengerKind | undefined) => kind === 'bomb' || kind === 'madbomber';
export const isCarrierKind = (kind: PassengerKind | undefined) => kind === 'courier' || kind === 'smuggler';

/** v9.19 Mystery rider: an identity drawn when he appears, revealed one floor after boarding. */
export type MysteryIdentity = 'undercover' | 'fugitive' | 'magnate' | 'saint';
export const MYSTERY_IDENTITIES: MysteryIdentity[] = ['undercover', 'fugitive', 'magnate', 'saint'];
export const MYSTERY_RULES: Record<MysteryIdentity, { fare: number; name: string; en: string; zh: string; enLine: string }> = {
  undercover: { fare: 6, name: '便衣警察', en: 'Undercover Officer', zh: '管住身边的小偷、劫匪，锁住炸弹客（锁不住疯炸客）', enLine: 'Controls adjacent Thieves and Robbers; locks Bomb Carriers (not the Mad Bomber)' },
  fugitive: { fare: 16, name: '逃犯', en: 'Fugitive', zh: '每层 +1 躁动 · 车费 16', enLine: '+1 agitation/floor · fare 16' },
  magnate: { fare: 20, name: '富商', en: 'Magnate', zh: '车费 20', enLine: 'Fare 20' },
  saint: { fare: 6, name: '好心人', en: 'Good Samaritan', zh: '抵消每位邻座自身躁动 1/层', enLine: 'Cancels 1 of each neighbor’s own agitation/floor' },
};

/** v9.20: before the reveal, a Mystery shows one clue. Each clue fits exactly two identities (a ring:
 * Undercover–Fugitive–Magnate–Saint–Undercover), so the card narrows him down to a coin flip without giving him away. */
export type MysteryClue = 'doors' | 'cash' | 'manners' | 'helpful';
export const MYSTERY_CLUES: Record<MysteryClue, { zh: string; en: string; fits: [MysteryIdentity, MysteryIdentity] }> = {
  doors: { zh: '一直盯着车门', en: 'Keeps watching the doors', fits: ['undercover', 'fugitive'] },
  cash: { zh: '手里攥着一沓现金', en: 'Clutching a wad of cash', fits: ['fugitive', 'magnate'] },
  manners: { zh: '衣着考究，彬彬有礼', en: 'Well dressed and polite', fits: ['magnate', 'saint'] },
  helpful: { zh: '主动帮人按住电梯门', en: 'Holds the door for others', fits: ['saint', 'undercover'] },
};
/** The clue a Mystery shows: one of the two that fit his identity, fixed by his id (so it never changes on screen). */
export function mysteryClue(rider: { id: string; identity?: MysteryIdentity }): MysteryClue | undefined {
  if (!rider.identity) return undefined;
  const fitting = (Object.keys(MYSTERY_CLUES) as MysteryClue[]).filter(k => MYSTERY_CLUES[k].fits.includes(rider.identity!));
  let hash = 0; for (const ch of rider.id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return fitting[hash % fitting.length];
}

/** v9.19 items: one-use tools kept in a four-slot bag, bought in shops at rising prices. */
export type ItemKey = 'cell' | 'swap' | 'dismiss' | 'candy' | 'fuse' | 'aroma' | 'holywater' | 'cuffs' | 'amulet' | 'alarm' | 'sedative' | 'seal' | 'cutter' | 'flare'
  | 'longflare' | 'sandalwood' | 'strongsedative' | 'greatamulet';
export type ItemTarget = 'none' | 'rider' | 'dark' | 'normal' | 'thief' | 'overtimer' | 'child' | 'bomb' | 'parcel';
/** v10.1.2: the Ghost's fare grows with the ride — coins per floor from boarding to his stop (he uses no power). */
/** `unheldAgitation`: an unheld Ghost haunts the cabin (+N agitation a floor) — the price of his longer, dearer ride. */
export const GHOST_RIDE = { perFloor: 1, unheldAgitation: 1 };
export const ITEM_SLOTS = 4;
export const ITEMS: Record<ItemKey, { name: string; en: string; zh: string; enText: string; from: number; price: number; target: ItemTarget; market?: true; art?: ItemKey }> = {
  cell: { name: '应急电池', en: 'Spare Cell', zh: '立即 +15 电（不超过上限）', enText: '+15 power now (up to the cap)', from: 1, price: 20, target: 'none' },
  swap: { name: '换位券', en: 'Swap Ticket', zh: '本层多一次老乘客换位', enText: 'One more old-rider move this floor', from: 1, price: 10, target: 'none' },
  dismiss: { name: '请离券', en: 'Exit Pass', zh: '免费请离一位乘客（不占请离次数；传奇本来就能免费请离，不用券）', enText: 'Dismiss one rider for free (no dismissal used; legends already leave free without a pass)', from: 1, price: 15, target: 'rider' },
  candy: { name: '糖果', en: 'Candy', zh: '一位儿童直接算照顾满', enText: 'A Child counts as fully cared for', from: 11, price: 12, target: 'child' },
  fuse: { name: '延时引信', en: 'Longer Fuse', zh: '一颗炸弹 +20 秒', enText: 'One bomb +20 seconds', from: 31, price: 18, target: 'bomb' },
  aroma: { name: '香薰', en: 'Incense', zh: '立即 −2 躁动', enText: '−2 agitation now', from: 21, price: 25, target: 'none' },
  holywater: { name: '圣水', en: 'Holy Water', zh: '把一位暗黑版净化回原版（本次路程）', enText: 'Purify one dark rider back to the original (this trip)', from: 60, price: 60, target: 'dark' },
  cuffs: { name: '手铐', en: 'Handcuffs', zh: '一位小偷或劫匪整段路程被管住', enText: 'A Thief or Robber is controlled for the whole trip', from: 60, price: 30, target: 'thief' },
  amulet: { name: '护身符', en: 'Amulet', zh: '一位普通人本次路程不会被同化', enText: 'A normal rider cannot be corrupted this trip', from: 60, price: 25, target: 'normal' },
  alarm: { name: '闹钟', en: 'Alarm Clock', zh: '加班魂到站就下车', enText: 'An Overtimer gets off at his floor', from: 60, price: 15, target: 'overtimer' },
  sedative: { name: '镇静剂', en: 'Sedative', zh: '一位乘客 3 层内自身不产生躁动、不会深渊发作，也不会戒断', enText: 'A rider adds no agitation of their own for 3 floors: no abyss outbursts, no withdrawal', from: 60, price: 30, target: 'rider' },
  seal: { name: '封条', en: 'Seal', zh: '一个纸箱或黑箱不会被没收、偷走或拆开', enText: 'A box cannot be seized, stolen or opened', from: 60, price: 20, target: 'parcel' },
  cutter: { name: '引线剪', en: 'Wire Cutter', zh: '当场拆掉一颗炸弹：炸弹客下车并付车费', enText: 'Defuse one bomb now: the bomber gets off and pays', from: 60, price: 45, target: 'bomb' },
  flare: { name: '照明弹', en: 'Flare', zh: '本层所有暗黑版的麻烦都不发生', enText: 'No dark rider causes trouble this floor', from: 80, price: 120, target: 'none' },
  // v9.21.1 night-market goods: sold only at the Night market (never in shops), stronger and dearer versions of shop items.
  longflare: { name: '长明照明弹', en: 'Long Flare', zh: '本层和下一层所有暗黑版的麻烦都不发生', enText: 'No dark rider causes trouble this floor or the next', from: 81, price: 190, target: 'none', market: true, art: 'flare' },
  sandalwood: { name: '檀香', en: 'Sandalwood', zh: '立即 −5 躁动', enText: '−5 agitation now', from: 81, price: 120, target: 'none', market: true, art: 'aroma' },
  strongsedative: { name: '强效镇静剂', en: 'Strong Sedative', zh: '一位乘客直到下车都不产生躁动、不会深渊发作，也不会戒断', enText: 'A rider adds no agitation of their own until they get off: no abyss outbursts, no withdrawal', from: 81, price: 80, target: 'rider', market: true, art: 'sedative' },
  greatamulet: { name: '大护身符', en: 'Great Amulet', zh: '车里所有普通人本次路程都不会被同化', enText: 'Every normal rider aboard is safe from corruption this trip', from: 81, price: 90, target: 'none', market: true, art: 'amulet' },
};
export const ITEM_KEYS = Object.keys(ITEMS) as ItemKey[];
/** Shop items (the Night market also sells one of these) and the night-market goods sold nowhere else. */
export const SHOP_ITEM_KEYS = ITEM_KEYS.filter(k => !ITEMS[k].market);
export const MARKET_ITEM_KEYS = ITEM_KEYS.filter(k => ITEMS[k].market);
export const MARKET_STOCK = { goods: 2, shopItems: 1 } as const;
/** Price rises half the base each time the same item is bought, and a little with depth. */
export const itemPrice = (key: ItemKey, floor: number, bought = 0) => Math.round(ITEMS[key].price * (1 + 0.5 * bought) * (1 + Math.max(0, floor - 60) / 200));
