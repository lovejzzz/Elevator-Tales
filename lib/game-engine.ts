import { BONDS, conflictLinks, profileWeight, randomTraits, riderProfile, type VariableTraits } from './rider-profile';
import { SYMBOL_RULES, greenCount, pairLink, symbolLedger, symbolsOf } from './symbols';
import { AGITATION_RULES, ECONOMY_RULES, FARE_RULES, GHOST_RULES, JOURNEY_RULES, journeyExtension } from './balance-v832';
import { ADJACENT, BASE_OF, DARK_LEGEND_KINDS, DARK_LEGEND_OF, DARK_OF, PASSENGERS, UNLOCK_TIERS, UPGRADES, isAnyLegend, isDark, isDarkLegend, isLegend, passengerCategory, type DarkLegendKind, type LegendKind, type PassengerKind, type UpgradeKey } from './game-data';
import { ABYSS_EVENTS, ABYSS_EVENT_KINDS, type AbyssEventKind, DARK_RESONANCE, DARK_RULES, ITEMS, ITEM_SLOTS, MARKET_ITEM_KEYS, MARKET_STOCK, SHOP_ITEM_KEYS, MYSTERY_IDENTITIES, MYSTERY_RULES, abyssStep, abyssTier, outburstChance, outburstIsPower, corruptible, darkShare, isBombKind, isCarrierKind, isSurvivor, itemPrice, type ItemKey, type MysteryIdentity } from './dark-rules';
import { BOX_MAX_LEVEL, BOX_PRICES, BOX_TOTAL_CAP, emergencySectorCap, EMPTY_BOX, affordableUnits, boxTotal, boxedMotorCost, chargeCost, emergencyUnitPrice, motorNoise, shopEntryCharge, storageCap, type BoxLine, type PowerBox } from './power-box';
import { districtWeight } from './districts';
import { CHILD_CARERS, DARK_LEGEND_RULES, DRUNK_CARERS, GHOST_CONTROLLERS, KEEPSAKE_KEYS, LEGEND_DECLINE_COINS, LEGEND_DESTINATION, LEGEND_KEEPSAKE, LEGEND_POOL_DEFAULT, LEGEND_RULES, type KeepsakeKey } from './legends';
import { V9_AGITATION, NIGHT_UNREST, nightUnrest, crowdingThreshold, agitationBand, AGITATION_HIGH_MIN, musicBeatForAgitation, BASE_AGITATION_CAP, motorCost, REPAIR_WORK, REPAIR_DURATION, REPAIR_DURATION_CAP, REPAIR_MOTOR_SAVING, INSPECTION_WORK, INSPECTION_BONUS, CHILD_CARE_WORK, CHILD_CARE_BONUS, COMMUTER_QUIET_BONUS, TOURIST_MEDIUM_BONUS, RESERVE_CELL_CHARGE, RESERVE_CELL_PRICE, CAPACITY_UPGRADE } from './balance-v832';
import { rollShopRewards, shopFloorIncome, shopOpportunities, SHOP_RULES, SHOP_TUNING, deliveryGapCharge, deliveryUpgradeIncome, naturalChargeBoost, finaleIncome, flywheelSaving, consumeFlywheel, boosted, ABILITY_LEVEL2, LEVEL2_TEXT } from './shop-effects';
import { experimentalRiskLinks, rollExperimentalRiskIncome, type RiskLinkTuning } from './risk-link-experiment';
import { DISMISSALS_PER_SECTOR, OFFER_PARTNERS, RISK_STASH_PER_ASCENT, UPGRADE_SLOTS, isRushFloor, offerRiskChance, riskPartnerships } from './shift-rules';

/** v9.19 midnight fields: corruption progress, item effects, withdrawal, the Mystery's identity, contraband boxes. */
export type MidnightRiderFields = { corruption?: number; warded?: boolean; cuffed?: boolean; alarm?: boolean; sedated?: number; sealed?: boolean; withdrawal?: number; identity?: MysteryIdentity; /** v9.20.1: abyss step when this dark card was drawn (its fare premium). */ extreme?: number; revealed?: boolean; contraband?: boolean; summoned?: boolean; crewFloors?: number; /** v9.21: extra coins on arrival (the eve-of-the-abyss bounty). */ bounty?: number };
export type Rider = MidnightRiderFields & { id: string; kind: PassengerKind; ownerId?: string; parcelId?: string; routeStops?: number; bombMs?: number; bombMsTotal?: number; /** v9.18.4: seconds that still count for the defusal bonus; they drain even while an Officer locks the timer. */ bonusMs?: number; big?: 'top' | 'bottom'; boxId?: string; inspected?: boolean; parcelBig?: boolean; tier?: 'rare' | 'legendary'; disguised?: boolean; destination: number; patience: number; boardedAt: number; fareBonus: number; localFareRatio?: number; stash?: number; volatile?: boolean; fuse?: number; calledByLover?: boolean; traits?: VariableTraits; copySeed?: number; repairProgress?: number; repairDone?: boolean; quietStreak?: number; complianceReady?: boolean; careProgress?: number };
export type ChangeLine = { label: string; amount: number };
export type ArrivalReceipt = { riderId:string; kind:PassengerKind; slot:number; coins:number; power?:number; ability?:UpgradeKey; /** v9.18.4: the keepsake a delivered legend left behind. */ keepsake?:KeepsakeKey; /** UI only: an incident exit card (never set by the engine). */ incident?:boolean };
/** v9.18.1: who the Thief robbed on the last floor, for the pickpocket animation. */
export type TheftReceipt = { thief: number; victims: Array<{ slot: number; coins: number }> };
/** v9.18.3: every box opened, used or taken on the last floor, for the in-place box animation. `slot` is where the box
 * (or, for a Mimic's copy, the Mimic) sat; `thief` is where the Thief who took it sat. */
export type BoxEvent = { slot: number; by: 'arrival' | 'child' | 'mimic' | 'mechanic' | 'thief' | 'inspect'; coins?: number; power?: number; ability?: UpgradeKey; thief?: number; big?: boolean; tier?: BoxTier };
/** v9.18.3: a rider who left early in a high-agitation incident (no fare), for the exit card. */
export type IncidentReceipt = { riderId: string; kind: PassengerKind; slot: number };
export type ShopCard = { key: UpgradeKey; price: number; purchased: boolean };
export type RunState = {
  floor: number; energy: number; energyCap: number; stress: number; stressCap: number; weightCap: number; coins: number; earned: number; shop: ShopCard[];
  cabin: Array<Rider | null>; swapped: boolean; upgrades: Record<UpgradeKey, number>;
  lastThefts?: TheftReceipt[];
  /** v9.18.2: which rider each uncontrolled Ghost delayed on the last floor, for the haunting animation. */
  lastHaunts?: Array<{ ghost: number; victim: number }>;
  lastBoxEvents?: BoxEvent[];
  lastIncident?: IncidentReceipt;
  /** v9.17.2: an ability found in a box while every slot is full, waiting for the player to swap it in or pass. */
  pendingAbility?: UpgradeKey;
  /** Abilities swapped out for a box's ability; each is sold (refunded) on entering the next shop. */
  pendingSales?: UpgradeKey[];
  restStops: number;
  oldMovesUsed?: number;
  lastArrivals?: ArrivalReceipt[];
  shopSeen?: UpgradeKey[];
  calmCharge?: boolean;
  reservedRider?: Rider;
  reservationUsedSector?: number;
  reservedIds?: string[];
  bufferPower?: number;
  bufferGapTurns?: number;
  flywheelSector?: number;
  flywheelSpent?: number;
  retimeUsedSector?: number;
  rebooked?: Record<string,number>;
  punchCount?: number;
  dismissalsUsed?: number;
  serviceTurns?: number;
  reserveCell?: boolean;
  /** v9 power box, keepsakes, legends and in-transit emergency charging. */
  box?: PowerBox;
  boxBoughtFloor?: number;
  freeBoxLevels?: number;
  keepsakes?: KeepsakeKey[];
  legendOffer?: LegendKind;
  legendStatus?: 'offered' | 'boarded' | 'declined' | 'delivered' | 'dismissed';
  /** v9.20: the dark legend offered when leaving the 60F shop. */
  darkLegendOffer?: DarkLegendKind;
  emergencySector?: number;
  dispatchSector?: number;
  dispatchCount?: number;
  stabilizerSector?: number;
  stabilizerUsed?: number;
  emergencyUsed?: number;
  calmSector?: number;
  calmUsed?: number;
  rerolledFloor?: number;
  shopUpgradeBought: boolean;
  shopExtraBought?: boolean;
  /** v9.19 items: the bag, this shop's stock and how many of each were bought (prices rise). */
  items?: ItemKey[];
  itemStock?: Array<{ key: ItemKey; price: number; sold: boolean }>;
  /** v9.21 the eve of the abyss: the announced events of floors 81–89, and the night market's stall on its floor. */
  abyssEvents?: Array<{ floor: number; kind: AbyssEventKind }>;
  marketStock?: Array<{ key: ItemKey; price: number; sold: boolean }>;
  marketFloor?: number;
  itemBought?: Partial<Record<ItemKey, number>>;
  /** A flare lit on this floor: no dark rider causes trouble on the ascent from it. */
  flareFloor?: number;
  /** v9.21.1 Long Flare: the last floor its quiet covers (flareFloor through flareUntil). */
  flareUntil?: number;
  /** v9.19: the shop floor where an ability was last raised to level 2 (one per shop). */
  abilityRaisedFloor?: number;
  /** v9.19: an ordinary Bomber blew up (neighbours thrown out unpaid), for the explosion effect. */
  lastBlast?: { bomber: number; slots: number[]; coins: number };
  /** v9.19: riders who turned dark (or were purified) on the last floor, and riders summoned in. */
  lastCorruption?: Array<{ slot: number; from: PassengerKind; to: PassengerKind }>;
  lastSummons?: number[];
  /** v9.20.1: seats whose dark rider lashed out on the last ascent. */
  lastOutbursts?: number[];
  status: 'playing' | 'upgrade' | 'lost'; message: string; log: string[];
  lastEarnings: { total: number; sources: ChangeLine[] }; lastPressure: { delta: number; sources: ChangeLine[] }; lastEnergy: { delta: number; sources: ChangeLine[] };
};

export const EMPTY_UPGRADES: Record<UpgradeKey, number> = { battery: 0, capacity: 0, calm: 0, concierge: 0, reinforced: 0, express: 0, tipjar: 0, relay: 0, crowd: 0, meter: 0, rails: 0, insulation: 0, reservation: 0, single: 0, delay:0, buffer:0, soundproof:0, retime:0, punchcard:0, finale:0, dispatch:0 };
export const boxOf = (state: Pick<RunState,'box'>): PowerBox => state.box ?? EMPTY_BOX;
export const hasKeepsake = (state: Pick<RunState,'keepsakes'>, key: KeepsakeKey) => Boolean(state.keepsakes?.includes(key));
export const legendInCabin = (cabin: Array<Rider|null>, kind: LegendKind | DarkLegendKind) => cabin.some(r => r?.kind === kind);
const sectorOf = (floor: number) => Math.floor(floor / 10);
// Dispatch merges Reservation and Rebooking: one use per sector, either way.
export const DISPATCH_USES_PER_SECTOR = 2;
const dispatchUsed = (state: RunState, sector: number) => (state.dispatchSector === sector ? state.dispatchCount ?? 0 : 0) >= boosted(state, 'dispatch', DISPATCH_USES_PER_SECTOR);
/** v9.18.4: Dispatch uses left in this ten-floor sector (the UI never offered Dispatch before; only the retired abilities had buttons). */
export const dispatchRemaining = (state: RunState) => Math.max(0, boosted(state, 'dispatch', DISPATCH_USES_PER_SECTOR) - (state.dispatchSector === Math.floor(state.floor / 10) ? state.dispatchCount ?? 0 : 0));
const dispatchTick = (state: RunState, sector: number) => state.upgrades.dispatch ? { dispatchSector: sector, dispatchCount: (state.dispatchSector === sector ? state.dispatchCount ?? 0 : 0) + 1 } : {};
export function retimeRider(state:RunState,id:string,delta:number):RunState {
  const r=state.cabin.find(r=>r?.id===id),sector=Math.floor(state.floor/10);
  if(state.status!=='playing'||!(state.upgrades.retime||state.upgrades.dispatch)||!r||r.boardedAt!==state.floor||(state.upgrades.dispatch?dispatchUsed(state,sector):state.retimeUsedSector===sector)||isAnyLegend(r.kind)||![-1,1].includes(delta)||r.destination+delta<=state.floor)return state;
  return {...state,...dispatchTick(state,sector),cabin:state.cabin.map(p=>p?.id===id?{...p,destination:p.destination+delta}:p),retimeUsedSector:state.upgrades.dispatch?state.retimeUsedSector:sector,rebooked:{...state.rebooked,[id]:r.destination+delta},message:state.upgrades.dispatch?`调度完成：${delta<0?'提前':'延后'} 1 站，车费与倒计时不变，撤回不退次数。`:'改签完成：车费与倒计时不变，撤回不退次数。'};
}
export function settleBuffer(raw:number,cap:number,stored:number,enabled:boolean) {
  const released=enabled?Math.min(stored,Math.max(0,cap-raw)):0;
  const captured=enabled?Math.min(4-stored,Math.max(0,raw-cap)):0;
  return {energy:Math.min(cap,raw+released),stored:enabled?stored-released+captured:0,released,captured};
}
export const SOUNDPROOF_RULES = { riskCap: Infinity };
export const redAgitationProtection=(state:RunState)=>state.upgrades.soundproof
 ? Math.min(boosted(state,'soundproof',1),conflictLinks(state.cabin).filter(l=>l.effect==='agitation').length)
   +(SHOP_TUNING.soundproofRisk?Math.min(SOUNDPROOF_RULES.riskCap,riskPartnerships(state.cabin).agitation):0)
 :0;
export const oldMovesRemaining = (state:RunState) => Math.max(0,2-(state.oldMovesUsed ?? Number(state.swapped)));
export const CALM_RULES = { relief: 3 };
export function applyCalmCharge(state:RunState):RunState {
  if(!state.calmCharge||!state.upgrades.calm||state.status==='lost'||state.stress<=0)return state;
  const delta=-Math.min(CALM_RULES.relief,state.stress);
  return {...state,stress:state.stress+delta,calmCharge:false,lastPressure:{delta,sources:[{label:'手动调节',amount:delta}]},message:'手动调节已使用：最多降低3躁动，不恢复电量。'};
}
export function reserveOffer(state:RunState,offers:Rider[],id:string):RunState {
  const rider=offers.find(r=>r.id===id),sector=Math.floor(state.floor/10);
  // v9.16: a Courier and his parcel travel as a pair, so neither can be held on its own.
  if(state.status!=='playing'||!(state.upgrades.reservation||state.upgrades.dispatch)||!rider||isAnyLegend(rider.kind)||rider.kind==='parcel'||Boolean(rider.parcelId)||state.reservedRider||(state.upgrades.dispatch?dispatchUsed(state,sector):state.reservationUsedSector===sector)||state.reservedIds?.includes(id)||state.cabin.some(r=>r?.id===id))return state;
  return {...state,reservedRider:{...rider,destination:state.rebooked?.[id]??rider.destination},reservationUsedSector:state.upgrades.dispatch?state.reservationUsedSector:sector,...dispatchTick(state,sector),reservedIds:[...(state.reservedIds??[]),id],message:'已留座：下一批占一个候客位，属性与剩余路程不变。'};
}
/** Consume a reservation at the next actual candidate batch, including shop exit.
 * Generate the ordinary packet first; the held rider replaces exactly one card. */
export function nextOfferBatch(state:RunState,rng:()=>number=Math.random):{state:RunState;offers:Rider[]} {
  const offers=makeOffers(state.floor,state.upgrades,false,rng,state.cabin,undefined,{},{keepsakes:state.keepsakes,legendPool:[]});
  // v9.20: leaving the 60F shop, the dark self of this shift's legend (or a random one) waits as a fourth card.
  if(state.floor===DARK_LEGEND_RULES.from&&!state.darkLegendOffer){
    const kind=state.legendOffer?DARK_LEGEND_OF[state.legendOffer]:DARK_LEGEND_KINDS[rand(0,DARK_LEGEND_KINDS.length-1,rng)];
    offers.push(darkLegendRider(kind,state.floor,rng));
    state={...state,darkLegendOffer:kind};
  }
  // v9.21 a Bounty floor: one dark card waiting here pays extra on arrival.
  if(abyssEventAt(state,state.floor)==='bounty'){
    const dark=offers.findIndex(o=>isDark(o.kind)&&!isAnyLegend(o.kind)),at=dark>=0?dark:offers.findIndex(o=>o.kind!=='parcel'&&!isAnyLegend(o.kind)&&!o.parcelId);
    if(at>=0)offers[at]={...offers[at],bounty:ABYSS_EVENTS.bountyCoins};
  }
  if(!state.reservedRider)return {state,offers};
  const held=state.reservedRider;
  const rider={...held,destination:state.floor+held.destination-held.boardedAt,boardedAt:state.floor,calledByLover:false};
  // The held rider replaces one ordinary card, never a Courier or his parcel.
  const replace=Math.max(0,offers.findIndex(o=>o.kind!=='courier'&&o.kind!=='parcel'));
  return {state:{...state,reservedRider:undefined},offers:[rider,...offers.filter((_,i)=>i!==replace)]};
}
export const LOVER_CALL_CHANCE = .15;
export const INSPECTOR_COMPLIANCE_REWARD = 1;
export const INSPECTOR_ENERGY_LIMIT = 3;
export const COURIER_ARRIVAL_CHARGE = 2;
/** v9.18.2: agitation each Thief held by an Officer or Lawyer removes per floor (tuned in scripts/balance-sim). */
export const THIEF_RULES = { controlledCalm: 1 };
/** v9.18.1: what a Thief lifts from each adjacent rider per floor, by how full their pockets are (about 2 on average).
 * Officers, Lawyers, the Don, legends and boxes are never robbed. */
export const PICKPOCKET: Partial<Record<PassengerKind, number>> = {
  celebrity: 4, tourist: 3, mystery: 3, shifter: 3,
  commuter: 2, courier: 2, lover: 2, musician: 2, coach: 2, mimic: 2, bomb: 2,
  mechanic: 1, nurse: 1, child: 1, drunk: 1, exorcist: 1, inspector: 1, thief: 1, ghost: 0,
};
/** v9.18.2: what an uncontrolled Thief takes across one adjacent pair each floor (0 when neither is such a Thief);
 * 'box' when the Thief eyes a box on the other side. Drawn as the pickpocket link. */
export function stealLink(cabin: Array<Rider | null>, first: number, second: number): number | 'box' {
  for (const [t, v] of [[first, second], [second, first]]) {
    const thief = cabin[t];
    if (thief?.kind !== 'thief' || thiefHeld(cabin, t)) continue;
    if (!neighbours(t).includes(v)) continue;
    if (cabin[v]?.kind === 'parcel') { const links = parcelLinks(cabin); if (links.eyed.get(v) === t) return 'box'; continue; }
    const coins = ECONOMY_RULES.thiefPerVictim ? pickpocketFrom(cabin[v]) : 0;
    if (coins) return coins;
  }
  return 0;
}
export const pickpocketFrom = (v: Rider | null | undefined) => (!v || v.kind === 'parcel' || ['cop', 'lawyer', 'don', 'crookedcop'].includes(v.kind) || isAnyLegend(v.kind) ? 0 : PICKPOCKET[v.kind] ?? ECONOMY_RULES.thiefPerVictim);
/** Bomb timers (v9.18 study): the dealt range, and how many steps an unlocked timer drops per floor at high agitation. */
export const BOMB_RULES = { fuseMin: 3, fuseMax: 6, highTick: 2,
  /** v9.18 real-time timer: a Bomber aboard counts down in real seconds (base + per stop of his trip) instead of floors.
   * The UI calls tickBombs while the run is live; the simulator keeps floor timers (realtime off). */
  realtime: true, baseSeconds: 10, secondsPerStop: 10,
  /** Defusal bonus: coins per this many whole seconds left when the Bomber arrives (real-time only). */
  bonusSeconds: 3 };
/** Seconds a Bomber gets for a trip of this many stops. */
export const bombSeconds = (stops: number) => BOMB_RULES.baseSeconds + BOMB_RULES.secondsPerStop * Math.max(1, stops);
/** v9.18: count real time down on every Bomber aboard not locked by an adjacent Officer; one at zero ends the run. */
export function tickBombs(state: RunState, ms: number): RunState {
  if (!BOMB_RULES.realtime || state.status !== 'playing' || ms <= 0) return state;
  let changed = false, madExploded = false, blownAt = -1;
  const cabin = state.cabin.map((r, slot) => {
    if (!isBombKind(r?.kind) || r!.bombMs === undefined) return r;
    changed = true;
    // An Officer's lock stops the timer, not the clock: the defusal bonus keeps draining in real time.
    const bonusMs = Math.max(0, Math.min(r!.bonusMs ?? r!.bombMs!, r!.bombMs!) - ms);
    if (bombLocked(state.cabin, slot)) return { ...r!, bonusMs };
    // At high agitation the timer runs at highTick× speed, the same rule as floor timers.
    const bombMs = Math.max(0, r!.bombMs! - ms * bombTick(state.stress));
    if (bombMs === 0) { if (r!.kind === 'madbomber') madExploded = true; else if (blownAt < 0) blownAt = slot; }
    return { ...r!, bombMs, bonusMs: Math.min(bonusMs, bombMs) };
  });
  if (!changed) return state;
  if (madExploded) return { ...state, cabin, status: 'lost', message: '炸弹倒计时归零：疯炸客的怪炸弹炸了。午夜班次戛然而止。' };
  if (blownAt >= 0) {
    // v9.19: an ordinary Bomber no longer ends the shift; his bomb throws him and his neighbours out and costs coins.
    const blast = blastAt(cabin, blownAt, state.coins);
    const message = `炸弹客的炸弹炸了：${blast.slots.length} 人被炸下车，没付车费，损失 ${blast.coins} 金币。`;
    return { ...state, cabin: blast.cabin, coins: state.coins - blast.coins, lastBlast: { bomber: blownAt, slots: blast.slots, coins: blast.coins }, message, log: [`${state.floor}F · ${message}`, ...state.log].slice(0, 4) };
  }
  return { ...state, cabin };
}
export const bombTick = (stress: number) => (agitationBand(stress) === 'high' ? BOMB_RULES.highTick : 1);
/** v9.16 Courier parcels: an unclaimed parcel pays coins or power at random when it reaches its floor;
 * a Courier without his parcel beside him agitates the cabin and pays nothing. Tuned in scripts/balance-sim. */
export const PARCEL_RULES = {
  payoutCoins: 6, payoutPower: 3, lostAgitation: 1, enabled: true,
  /** v9.17: share of Couriers who bring a two-part box (upper + lower seat of one column). */
  bigChance: 0.15,
  /** v9.17 box tiers: chance a Courier (and his box) is rare or legendary. */
  rareChance: 0.16, legendaryChance: 0.04,
  /** Contents in coins by size and tier (power is half); a Courier delivering it pays his fare + (value − 6). */
  values: { small: { common: 6, rare: 12, legendary: 24 }, big: { common: 16, rare: 30, legendary: 60 } },
  /** An empty-handed Courier beside a Bomber holds the bomb; leaving first, he carries it away and the Bomber
   * becomes a disguised Commuter (same fare, no timer). */
  bombCarry: true,
  /** A Mimic under a box carries a copy of the same tier, opened when he gets off. */
  mimicCopiesBox: true,
  /** An unclaimed box beside an empty-handed Courier counts as his. */
  adopt: true,
  /** A second empty-handed Courier touching a box: both +1 agitation (the owner still pays); an unclaimed box then serves neither. */
  contest: true,
  /** An uncontrolled Thief beside a box stays calm and takes it when he leaves, tipping this share of its coin value. */
  thiefShare: 0.5,
  /** A Child beside a box opens it at the next floor (its contents are paid out). */
  childOpens: true,
  /** An Inspector beside a Courier's box checks it once: the Courier rides 1 floor longer and pays this much more. */
  inspectCoins: 5,
  /** A Mechanic beside an unclaimed box uses it for parts: his repair completes at once, the box is used up. */
  mechanicParts: true,
  /** v9.17.2: contents are hidden until opened and rolled then: coins or half as much power, between half and
   * one and a half times the tier's average; sometimes an ability instead, likelier for rarer boxes and crates. */
  abilityChance: { common: 0.03, rare: 0.1, legendary: 0.25 }, crateAbilityBonus: 0.05,
  /** v9.18.3: better boxes travel farther. A Courier's trip (stops) by his box's tier; a crate rides one stop more.
   * Study (scripts/balance-sim variants tripOld … wideFee3, 6 bots × 250 runs each): 2–4/3–5/4–6 without a fee cut
   * Courier boarding 41% → 16% and the novice 48 → 33F; these ranges with a 3-coin fee keep 37% and 41F. */
  trips: { common: [1, 4], rare: [2, 5], legendary: [3, 6] } as Record<BoxTier, [number, number]>, crateExtraStop: 1,
  /** v9.18.3: a Courier who delivers his box pays this much more per stop of his route beyond `freeStops`. */
  stopFee: 3, freeStops: 2,
};
/** A box is one parcel card: a single seat, or a two-part box whose halves share a boxId. */
export const boxIdOf = (r: Rider) => r.boxId ?? r.id;
export const isBigParcel = (r: Rider | null | undefined) => r?.kind === 'parcel' && Boolean(r.big);
/** Seats a rider, a two-part box taking the upper and lower seat of the target's column. Null if it does not fit. */
export function seatRider(cabin: Array<Rider | null>, rider: Rider, target: number): Array<Rider | null> | null {
  if (!isBigParcel(rider)) { if (cabin[target]) return null; return cabin.map((r, i) => (i === target ? rider : r)); }
  const top = target % 3, bottom = top + 3, boxId = boxIdOf(rider);
  if (cabin[top] || cabin[bottom]) return null;
  return cabin.map((r, i) => (i === top ? { ...rider, big: 'top' as const, boxId } : i === bottom ? { ...rider, id: `${boxId}-b`, big: 'bottom' as const, boxId } : r));
}
/** Removes a rider; a box leaves whole. With a Courier, his own box leaves with him (used by dismissal). */
export function unseatRider(cabin: Array<Rider | null>, id: string, withOwnBox = false): Array<Rider | null> {
  const r = cabin.find(x => x?.id === id); if (!r) return cabin;
  const box = r.kind === 'parcel' ? boxIdOf(r) : null;
  return cabin.map(x => (!x ? x : x.id === id || (box && x.kind === 'parcel' && boxIdOf(x) === box) || (withOwnBox && x.kind === 'parcel' && x.ownerId === id) ? null : x));
}
type Box = { id: string; slots: number[]; ownerId?: string; big: boolean; tier?: BoxTier; touching: number[] };
function boxesIn(cabin: Array<Rider | null>): Box[] {
  const map = new Map<string, Box>();
  cabin.forEach((r, slot) => {
    if (r?.kind !== 'parcel') return;
    const id = boxIdOf(r), box = map.get(id) ?? { id, slots: [], ownerId: r.ownerId, big: Boolean(r.big), tier: r.tier, touching: [] };
    box.slots.push(slot); map.set(id, box);
  });
  for (const box of map.values()) box.touching = [...new Set(box.slots.flatMap(neighbours))].filter(i => !box.slots.includes(i));
  return [...map.values()];
}
export type ParcelLinks = { boxes: Box[]; carrier: Map<number, number>; served: Map<number, number[]>; contested: Set<number>; eyed: Map<number, number>; bombs: Map<number, number> };
/** Which Courier each box travels with: his own box touching him first; then an unclaimed box (its Courier not aboard)
 * touching exactly one empty-handed Courier. A box touched by a second empty-handed Courier sets both arguing, and an
 * unclaimed one touched by two serves neither. Also which uncontrolled Thief eyes which box. Keys are parcel seats. */
export function parcelLinks(cabin: Array<Rider | null>): ParcelLinks {
  const carrier = new Map<number, number>(), served = new Map<number, number[]>(), contested = new Set<number>(), eyed = new Map<number, number>();
  const boxes = boxesIn(cabin);
  const isCourier = (i: number) => isCarrierKind(cabin[i]?.kind) && Boolean(cabin[i]!.parcelId);
  const give = (box: Box, c: number) => { box.slots.forEach(p => carrier.set(p, c)); served.set(c, [...(served.get(c) ?? []), ...box.slots]); };
  for (const box of boxes) {
    const owner = cabin.findIndex(x => Boolean(box.ownerId) && x?.id === box.ownerId);
    if (owner >= 0 && box.touching.includes(owner)) give(box, owner);
  }
  if (PARCEL_RULES.adopt) for (const box of boxes) {
    if (carrier.has(box.slots[0]) || cabin.some(x => Boolean(box.ownerId) && x?.id === box.ownerId)) continue;
    const takers = box.touching.filter(c => isCourier(c) && !served.has(c));
    if (takers.length === 1 || (takers.length > 1 && !PARCEL_RULES.contest)) give(box, takers[0]);
    else if (takers.length > 1) takers.forEach(c => contested.add(c));
  }
  if (PARCEL_RULES.contest) for (const box of boxes) {
    const c = carrier.get(box.slots[0]); if (c === undefined) continue;
    box.touching.forEach(o => { if (o !== c && isCourier(o) && !served.has(o)) { contested.add(o); contested.add(c); } });
  }
  if (PARCEL_RULES.thiefShare > 0) cabin.forEach((r, t) => {
    if (r?.kind !== 'thief' || thiefHeld(cabin, t) || hasNeighbour(cabin, t, ['don'])) return;
    const box = boxes.find(b => b.touching.includes(t) && !b.slots.some(p => eyed.has(p)));
    box?.slots.forEach(p => eyed.set(p, t));
  });
  // An empty-handed Courier beside a Bomber holds the bomb (one Courier per bomb).
  const bombs = new Map<number, number>();
  if (PARCEL_RULES.bombCarry) cabin.forEach((r, c) => {
    if (!isCourier(c) || served.has(c)) return;
    const b = neighbours(c).find(i => cabin[i]?.kind === 'bomb' && ![...bombs.values()].includes(i));
    if (b !== undefined) bombs.set(c, b);
  });
  return { boxes, carrier, served, contested, eyed, bombs };
}
export const thiefEyesParcel = (links: ParcelLinks, slot: number) => [...links.eyed.values()].includes(slot);
/** True unless this Courier carries a box system and no box travels with him. */
export const parcelBeside = (cabin: Array<Rider | null>, slot: number, links: ParcelLinks = parcelLinks(cabin)) => {
  const c = cabin[slot]; if (!c || !isCarrierKind(c.kind) || !c.parcelId) return true;
  return links.served.has(slot) || links.bombs.has(slot);
};
/** Coin value of a box's contents when opened: small 6, two-part 16. */
export type BoxTier = 'common' | 'rare' | 'legendary';
/** Coins inside a box of this size and tier; opened boxes pay this or half as much power, at random. */
export const boxCoins = (r: { big?: unknown; tier?: BoxTier }) => PARCEL_RULES.values[r.big ? 'big' : 'small'][r.tier ?? 'common'];
export const boxPower = (r: { big?: unknown; tier?: BoxTier }) => Math.round(boxCoins(r) / 2);
/** The most power one box can hold (its roll tops out at 1.5× the average). */
export const boxPowerMax = (r: { big?: unknown; tier?: BoxTier }) => Math.round(boxCoins(r) * 1.5 / 2);
export type BoxContents = { coins: number; power: number; ability?: UpgradeKey };
/** Rolls a box's contents when it is opened; with every slot full an ability becomes its sale value in coins. */
export function rollBox(r: { big?: unknown; tier?: BoxTier }, rng: () => number, upgrades: Record<UpgradeKey, number>): BoxContents {
  const chance = PARCEL_RULES.abilityChance[r.tier ?? 'common'] + (r.big ? PARCEL_RULES.crateAbilityBonus : 0);
  if (rng() < chance) {
    const pool = (Object.keys(UPGRADES) as UpgradeKey[]).filter(k => !RETIRED_UPGRADES.includes(k) && !upgrades[k]);
    if (pool.length) return { coins: 0, power: 0, ability: pool[Math.floor(rng() * pool.length)] };
    return { coins: SELL_REFUND, power: 0 };
  }
  const coins = Math.max(1, Math.round(boxCoins(r) * (0.5 + rng())));
  return rng() < .5 ? { coins, power: 0 } : { coins: 0, power: Math.max(1, Math.round(coins / 2)) };
}
/** v9.17: the most power boxes could pay out at the next floor (each opening pays power half the time):
 * unclaimed boxes reaching their floor, boxes beside a Child, and a Mimic getting off under a box. */
export function possibleBoxPower(state: RunState): number {
  const next = state.floor + 1, cabin = state.cabin, links = parcelLinks(cabin);
  let power = 0;
  for (const box of links.boxes) {
    const top = cabin[box.slots[0]]!, c = links.carrier.get(box.slots[0]);
    const delivering = c !== undefined && next >= cabin[c]!.destination;
    const ownerAboard = cabin.some(r => Boolean(box.ownerId) && r?.id === box.ownerId);
    const childOpens = PARCEL_RULES.childOpens && !delivering && box.touching.some(i => cabin[i]?.kind === 'child');
    const opensUnclaimed = c === undefined && !ownerAboard && next >= top.destination;
    if (childOpens || opensUnclaimed) power += boxPowerMax(top);
  }
  if (PARCEL_RULES.mimicCopiesBox) cabin.forEach((r, i) => { if (r?.kind === 'mimic' && i >= 3 && next >= r.destination && cabin[i - 3]?.kind === 'parcel') power += boxPowerMax(cabin[i - 3]!); });
  return power;
}
/** Every Courier whose own box is aboard has it touching him (either half of a two-part box). */
export const parcelLayoutOk = (cabin: Array<Rider | null>) => boxesIn(cabin).every(box => {
  const owner = cabin.findIndex(x => Boolean(box.ownerId) && x?.id === box.ownerId);
  return owner < 0 || box.touching.includes(owner);
});
export const CONTROLLED_GHOST_SAVING = 1;
export const SHOP_ENTRY_CHARGE = 5;
export const INITIAL_ENERGY = 50;
export const START_RULES = { energy: INITIAL_ENERGY };
export const ENERGY_CAPACITY = 60;
export const AGITATION_CAPACITY = BASE_AGITATION_CAP;
export const ARRIVAL_RELIEF_CAP = 2;
export const HIGH_RISK_BONUS = 4;
export const RISK_RULES = { highRiskBonus: HIGH_RISK_BONUS };
export const HIGH_RISK_START = 17;
export const OFFER_PRESSURE_STEP = 40;
export const MAX_FORCED_RISK_OFFERS = 1;
export const PRESSURE_RECOVERY_PER_POINT = 0;
export const DRUNK_APPETITE_THRESHOLD = AGITATION_HIGH_MIN;
export const DRUNK_APPETITE_NEIGHBOURS = 0;
export const DRUNK_APPETITE_BONUS = 1;
/** Explicit experiment overrides; normal play always uses the constants above. */
export type FareTuning = { appetiteThreshold?: number; appetiteNeighbours?: number; appetiteBonus?: number; riskLinks?: RiskLinkTuning };
export type OfferTuning = { highRiskStart?: number; pressureStep?: number; volatileSpan?: number };
export const initialRun = (): RunState => ({ floor: 1, restStops: 0, shopUpgradeBought: false, energy: START_RULES.energy, energyCap: ENERGY_CAPACITY, stress: 0, stressCap: AGITATION_CAPACITY, weightCap: 10, coins: 0, earned: 0, shop: [], cabin: Array(6).fill(null), swapped: false, upgrades: { ...EMPTY_UPGRADES }, status: 'playing', message: '门已开启。把候选人物直接拖进指定站位。', log: ['01F · 无尽班次开始'], lastEarnings: { total: 0, sources: [] }, lastPressure: { delta: 0, sources: [] }, lastEnergy: { delta: 0, sources: [] } });
/** Opening batch plus the legend on offer, if any. */
export function startRun(tutorial = false, rng: () => number = Math.random, legendPool?: LegendKind[]): { state: RunState; offers: Rider[] } {
  const state = initialRun();
  const offers = makeOffers(1, state.upgrades, tutorial, rng, state.cabin, undefined, {}, { legendPool: tutorial ? [] : legendPool });
  const legend = offers.find(r => isLegend(r.kind))?.kind as LegendKind | undefined;
  return { state: legend ? { ...state, legendOffer: legend, legendStatus: 'offered' } : state, offers };
}
export const nextShopFloor = (floor: number) => (Math.floor(floor / 10) + 1) * 10;
export const difficultyTier = (floor: number) => Math.floor(Math.max(0, floor - 1) / 30);
export const agitationThreshold = (_cap: number) => AGITATION_HIGH_MIN;
export const arrivalRelief = (arrivals: number) => Math.min(AGITATION_RULES.arrivalReliefCap, Math.max(0, arrivals));
// Retained only for archived experiment callers. Patience no longer affects play.
export const patienceCost = (_state: RunState) => 0;
export const eventPressureMultiplier = (_state: Pick<RunState, 'stress' | 'stressCap'>) => 1;
export const passengerEnergy = (state: RunState) => state.cabin.reduce((sum,rider,slot)=>sum+(rider?riderProfile(rider,state.cabin,slot).energy:0),0);
export const STABILIZER_SECTOR_CAP = 5;
const stabilizerUsed = (state: RunState) => state.stabilizerSector === Math.floor(state.floor / 10) ? state.stabilizerUsed ?? 0 : 0;
export const stabilizedEnergy = (state: RunState) => state.upgrades.reinforced > 0 && state.cabin.filter(Boolean).length >= 5 && stabilizerUsed(state) < boosted(state, 'reinforced', STABILIZER_SECTOR_CAP) ? Math.min(1,passengerEnergy(state)) : 0;
export const crowdAgitation = (_occupied: number) => 0;
export const REST_STOP_CAP = 0;
export const shiftAgitation = (_floor: number, _occupied: number, _restStops = 0) => 0;
export function shiftOutlook(floor: number, _occupied = 1, _restStops = 0) {
  const next = floor + 1;
  if (next % 10 === 0) return '下一站：商店';
  return isRushFloor(floor) ? '临近商店 · 急客时段' : '';
}

export const neighbours = (slot: number) => ADJACENT.flatMap(([a, b]) => a === slot ? [b] : b === slot ? [a] : []);
export const hasNeighbour = (cabin: Array<Rider | null>, slot: number, kinds: PassengerKind[]) => neighbours(slot).some((i) => cabin[i] && kinds.includes(cabin[i]!.kind));
/** v9.19 control rules shared by settlement, forecasts and the UI. */
export const isUndercover = (r: Rider | null | undefined) => Boolean(r?.kind === 'mystery' && r.revealed && r.identity === 'undercover');
/** A Thief or Robber is held by an adjacent Officer, Crooked Cop or revealed Undercover Officer (a Lawyer holds Thieves
 * only), or by handcuffs; a Shyster beside a Robber gets him off. */
export function thiefHeld(cabin: Array<Rider | null>, slot: number): boolean {
  const r = cabin[slot]; if (!r) return false;
  if (r.cuffed) return true;
  const near = neighbours(slot).map(i => cabin[i]);
  if (r.kind === 'robber' && near.some(n => n?.kind === 'shyster')) return false;
  const holders: PassengerKind[] = r.kind === 'thief' ? ['cop', 'lawyer', 'crookedcop'] : ['cop', 'crookedcop'];
  return near.some(n => Boolean(n && holders.includes(n.kind)) || isUndercover(n));
}
/** A Bomber's timer is locked by an adjacent Officer, Crooked Cop or Undercover Officer; the Mad Bomber's only by a Crooked Cop. */
export function bombLocked(cabin: Array<Rider | null>, slot: number): boolean {
  const r = cabin[slot], near = neighbours(slot).map(i => cabin[i]);
  if (r?.kind === 'madbomber') return near.some(n => n?.kind === 'crookedcop');
  return near.some(n => n?.kind === 'cop' || n?.kind === 'crookedcop' || isUndercover(n));
}
export const GHOST_CONTROL_KINDS: PassengerKind[] = [...GHOST_CONTROLLERS, 'summoner'];
/** A flare lit on this floor: no dark rider causes trouble on the coming ascent. */
/** v9.21 the eve of the abyss: the event announced for this floor, if any. */
export const abyssEventAt = (state: Pick<RunState, 'abyssEvents'>, floor: number): AbyssEventKind | undefined => state.abyssEvents?.find(e => e.floor === floor)?.kind;
/** A Flare, or a Hush floor: no dark rider causes trouble on the ascent from this floor. */
export const flareCovers = (state: Pick<RunState, 'flareFloor' | 'flareUntil' | 'floor'>) => state.flareFloor !== undefined && state.floor >= state.flareFloor && state.floor <= Math.max(state.flareFloor, state.flareUntil ?? state.flareFloor);
export const troubleFree = (state: Pick<RunState, 'flareFloor' | 'flareUntil' | 'floor' | 'abyssEvents'>) => flareCovers(state) || abyssEventAt(state, state.floor) === 'hush';
/** Outburst odds for the ascent from this floor: the abyss step, doubled on a Surge floor (never above the cap); none
 * on a Hush floor or after a Flare, so the cards and seats stop printing odds that cannot happen. */
export const outburstChanceAt = (state: Pick<RunState, 'floor' | 'abyssEvents' | 'flareFloor' | 'flareUntil'>) => troubleFree(state) ? 0 : Math.min(DARK_RULES.outburstMax, outburstChance(state.floor + 1) * (abyssEventAt(state, state.floor) === 'surge' ? ABYSS_EVENTS.surgeMultiplier : 1));
/** Four of floors 81–89, one of each event, drawn on the shop's stream as the 80F shop opens. */
export function drawAbyssEvents(rng: () => number): Array<{ floor: number; kind: AbyssEventKind }> {
  const floors = Array.from({ length: ABYSS_EVENTS.to - ABYSS_EVENTS.from + 1 }, (_, i) => ABYSS_EVENTS.from + i);
  for (let i = floors.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [floors[i], floors[j]] = [floors[j], floors[i]]; }
  const kinds = [...ABYSS_EVENT_KINDS];
  for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
  return kinds.map((kind, i) => ({ floor: floors[i], kind })).sort((a, b) => a.floor - b.floor);
}
export const MYSTERY_NAMES = Object.fromEntries(MYSTERY_IDENTITIES.map(k => [k, MYSTERY_RULES[k].name])) as Record<MysteryIdentity, string>;
/** What a rider's banked coins are called when paid out. */
/** v9.19: an Overtimer at (or past) his stop stays aboard unless a neighbour is getting off on the same floor, his
 * alarm rings or a flare burns; past `overstayMax` he walks off unpaid. Either way he does not arrive as a paying rider.
 * `destinations` lets the forecast test delayed destinations. */
export function overtimerLingers(state: Pick<RunState, 'cabin' | 'floor' | 'flareFloor' | 'flareUntil'>, slot: number, destinations?: Array<number | null>): boolean {
  const rider = state.cabin[slot], nextFloor = state.floor + 1;
  if (rider?.kind !== 'overtimer' || rider.alarm || troubleFree(state)) return false;
  return !neighbours(slot).some(i => { const n = state.cabin[i]; return Boolean(n && n.kind !== 'parcel' && n.kind !== 'overtimer' && nextFloor >= (destinations?.[i] ?? n.destination)); });
}
export const stashLabel = (kind: PassengerKind) => kind === 'overtimer' ? '加班费' : kind === 'voyeur' ? '偷拍照片' : kind === 'scandal' ? '丑闻热度' : '坏人暂存';
/** The same person as another version (corruption turns dark, holy water turns back). Timers and boxes follow. */
export function turnRider(r: Rider, to: PassengerKind): Rider {
  const next: Rider = { ...r, kind: to, corruption: 0 };
  if (to === 'madbomber' && r.bombMs !== undefined) { next.bombMs = Math.ceil(r.bombMs * DARK_RULES.madbomberSeconds); next.bombMsTotal = Math.ceil((r.bombMsTotal ?? r.bombMs) * DARK_RULES.madbomberSeconds); next.bonusMs = next.bombMs; }
  if (to === 'madbomber' && r.fuse !== undefined) next.fuse = Math.max(1, Math.ceil(r.fuse * DARK_RULES.madbomberSeconds));
  return next;
}
/** v9.19: an ordinary Bomber's bomb blows him and every adjacent rider out of the cabin (no fares) and costs coins. */
export function blastAt(cabin: Array<Rider | null>, bomber: number, coins: number): { cabin: Array<Rider | null>; slots: number[]; coins: number } {
  const hit = [bomber, ...neighbours(bomber).filter(i => cabin[i] && !isAnyLegend(cabin[i]!.kind))];
  const ids = new Set(hit.map(i => cabin[i]?.id).filter(Boolean));
  const boxes = new Set(hit.map(i => cabin[i]).filter(r => r?.kind === 'parcel').map(r => boxIdOf(r!)));
  const next = cabin.map(r => r && (ids.has(r.id) || (r.kind === 'parcel' && boxes.has(boxIdOf(r)))) ? null : r);
  return { cabin: next, slots: hit.filter(i => cabin[i]), coins: Math.min(Math.max(0, coins), DARK_RULES.blastCoins) };
}
export const neighbourCount = (cabin: Array<Rider | null>, slot: number) => neighbours(slot).filter((i) => cabin[i] && cabin[i]!.kind !== 'parcel').length;
/** Every occupied neighboring position is one companion, including another Tourist. */
export const touristCompanionCount = (cabin: Array<Rider | null>, slot: number) => neighbourCount(cabin, slot);
export const totalWeight = profileWeight;
function rawRiderAgitation(state: RunState, slot: number): ChangeLine[] {
  const rider = state.cabin[slot], fixed: ChangeLine[] = [];
  if (!rider) return fixed;
  const add = (label: string, amount: number) => { if (amount > 0) fixed.push({ label, amount }); };
  // v9.19: a sedated rider adds no agitation of their own (and skips withdrawal).
  if ((rider.sedated ?? 0) > 0) return fixed;
  add(`${PASSENGERS[rider.kind].name}自身躁动`, riderProfile(rider,state.cabin,slot).agitation);
  if (rider.volatile) add(`${PASSENGERS[rider.kind].name}急躁`, 1);
  if ((rider.withdrawal ?? 0) > 0) add('药贩走后的戒断', DARK_RULES.withdrawal);
  const cabin = state.cabin, dark = !troubleFree(state), abyss = abyssTier(state.floor + 1);
  const survivorsBeside = () => neighbours(slot).filter(i => cabin[i] && isSurvivor(cabin[i]!.kind)).length;
  switch (rider.kind) {
    case 'thief': if (!thiefHeld(cabin, slot) && !hasNeighbour(cabin, slot, ['don']) && !thiefEyesParcel(parcelLinks(cabin), slot)) add('小偷未受控', 1); break;
    case 'robber': if (dark && !thiefHeld(cabin, slot)) add('劫匪行凶', DARK_RULES.robberAgitation); break;
    case 'overtimer': if (dark && state.floor >= rider.destination && !rider.alarm) add('加班魂赖着不走', DARK_RULES.overstayAgitation); break;
    case 'voyeur': if (dark && survivorsBeside()) add('偷拍惊扰', DARK_RULES.voyeurAgitation); break;
    case 'noisemaker': if (dark && agitationBand(state.stress) !== 'high') add('噪音乐手起哄', DARK_RULES.noiseAgitation); break;
    case 'shyster': if (dark) add('讼棍挑事', DARK_RULES.shysterAgitation); break;
    case 'brawler': if (dark && !hasNeighbour(cabin, slot, ['crookedcop'])) { add('狂徒发狂', DARK_RULES.brawlerSelf + abyss); add('狂徒挑衅普通人', DARK_RULES.brawlerPerNormal * survivorsBeside()); } break;
    case 'creepychild': if (dark) add('怪童吓人', DARK_RULES.creepyPerNeighbour * survivorsBeside()); break;
    case 'taskmaster': if (dark) add('监工催逼', DARK_RULES.taskmasterAgitation * survivorsBeside()); break;
    case 'grafter': if (dark) add('贪腐检查员敲诈', neighbourCount(cabin, slot) ? DARK_RULES.grafterAgitation : 0); break;
    case 'mystery': if (rider.revealed && rider.identity === 'fugitive') add('逃犯心虚', 1); break;
    case 'smuggler':
    case 'courier': {
      const links = parcelLinks(state.cabin);
      if (!parcelBeside(state.cabin, slot, links)) add(rider.kind === 'smuggler' ? '走私客在找黑箱' : '快递员在找纸箱', PARCEL_RULES.lostAgitation);
      if (links.contested.has(slot)) add('快递员争纸箱', 1);
      break;
    }
    case 'child': if (!hasNeighbour(state.cabin, slot, [...CHILD_CARERS]) && !(PARCEL_RULES.childOpens && neighbours(slot).some(i => state.cabin[i]?.kind === 'parcel'))) add('儿童无人照顾', 1); break;
    case 'drunk': if (!hasNeighbour(state.cabin, slot, [...DRUNK_CARERS, 'crookedcop'])) add('醉汉未安抚', 1); break;
    case 'celebrity': if (neighbourCount(state.cabin, slot) > 1) add('名人被围', 1); break;
    case 'tycoon': if (neighbourCount(state.cabin, slot) > 1) add('大亨嫌挤', 1); break;
    case 'matron': add('坏人惊扰护士长', LEGEND_RULES.matronBadNeighbourAgitation * neighbours(slot).filter(i => state.cabin[i] && passengerCategory(state.cabin[i]!.kind) === 'bad').length); break;
  }
  return fixed;
}

function agitationBySlot(state: RunState) {
  const lines = state.cabin.map((_, slot) => rawRiderAgitation(state, slot).map(line => ({...line})));
  state.cabin.forEach((rider, calmerSlot) => {
    // v9.19: the Pusher cancels 2 per neighbour, a revealed Good Samaritan 1, like the Nurse.
    const calm = rider?.kind === 'nurse' ? 1 : rider?.kind === 'pusher' ? DARK_RULES.pusherCalm : rider?.kind === 'mystery' && rider.revealed && rider.identity === 'saint' ? 1 : 0;
    if (!rider || !calm) return;
    const targets = neighbours(calmerSlot)
      .filter(slot => lines[slot].some(line => line.amount > 0))
      .sort((a,b) => lines[b].reduce((sum,line)=>sum+line.amount,0)-lines[a].reduce((sum,line)=>sum+line.amount,0) || a-b);
    const treated = targets;
    treated.forEach(target => {
      let remaining = calm;
      lines[target].forEach(source => {
        const reduction = Math.min(remaining, source.amount);
        source.amount -= reduction;
        remaining -= reduction;
      });
    });
  });
  return lines.map(fixed => fixed.filter(line => line.amount > 0));
}

/** Visible, deterministic passenger agitation after adjacent calming. */
export function riderAgitation(state: RunState, slot: number) {
  const fixed = agitationBySlot(state)[slot] ?? [];
  const low = fixed.reduce((sum, line) => sum + line.amount, 0);
  return { fixed, random: 0, low, high: low };
}
/** Retired API for archival callers. Agitation never converts to energy. */
export const arrivalRegeneration = (_state: RunState, _arrivals: number, _extraAgitation = 0) => 0;
/** One cabin-wide beat, decided from departure state; musicians do not stack. */
export function musicAgitation(state: RunState) {
  if (!state.cabin.some(r => r?.kind === 'musician')) return 0;
  return musicBeatForAgitation(state.stress);
}
/** Motor cost for the coming ascent after the power box. Legends and service savings are itemized separately. */
export const effectiveMotor = (state: Pick<RunState,'floor'|'box'>) => boxedMotorCost(motorCost(state.floor+1), boxOf(state), state.floor+1);
export const operatorSaving = (state: RunState) => legendInCabin(state.cabin,'operator') && state.cabin.filter(Boolean).length < 6 ? Math.min(LEGEND_RULES.operatorMotorSaving, effectiveMotor(state)) : 0;
/** v9.20 Night Operator: motor −2 every floor, even with a full cabin. */
export const nightOperatorSaving = (state: RunState) => legendInCabin(state.cabin,'nightoperator') ? Math.min(DARK_LEGEND_RULES.nightOperatorSaving, effectiveMotor(state) - operatorSaving(state)) : 0;
export const serviceSaving = (state: RunState) => (state.serviceTurns ?? 0) > 0 ? Math.max(0, Math.min(REPAIR_MOTOR_SAVING, effectiveMotor(state) - operatorSaving(state) - nightOperatorSaving(state))) : 0;
export const cooperationBonus = (state: RunState) => 1 + (state.upgrades.battery ? boosted(state, 'battery', ECONOMY_RULES.cooperationIncrement) : 0) + (hasKeepsake(state,'redString') ? LEGEND_RULES.redStringBond : 0);
// One cabin-wide reward per travelled floor. Further contract levels improve
// coins, not soothing; boarding, reseating and dismissing cannot trigger it.
export const COOPERATION_RELIEF = 0;
export const cooperationRelief = (_state: Pick<RunState, 'upgrades'>) => 0;
export const isFreeReseat = (cabin: Array<Rider | null>, source: number, target: number, floor: number) => Boolean(cabin[source] && cabin[source]!.boardedAt === floor && (!cabin[target] || cabin[target]!.boardedAt === floor));
export const unlockedAt = (floor: number) => UNLOCK_TIERS.flatMap((tier) => tier.floor <= floor ? tier.kinds : []);
const READY_PARTNERS: Partial<Record<PassengerKind, PassengerKind[]>> = { lover: ['lover'], thief: ['cop', 'lawyer'], cop: ['thief', 'bomb'], lawyer: ['thief'], drunk: ['nurse'], musician: ['tourist'], nurse: ['drunk', 'child'], child: ['lover', 'nurse'], ghost: ['exorcist'], exorcist: ['ghost'], bomb: ['cop'] };
export const synergyPartnerAtSlot = (kind: PassengerKind, cabin: Array<Rider | null>, slot: number, excludeId?: string): PassengerKind | null => {
  const partners = [...(READY_PARTNERS[kind] ?? []), ...BONDS[kind].likes];
  return partners.find((partner) => neighbours(slot).some((nearby) => cabin[nearby]?.id !== excludeId && cabin[nearby]?.kind === partner)) ?? null;
};
export const readyPartner = (kind: PassengerKind, cabin: Array<Rider | null>, excludeId?: string, candidate?: Rider): PassengerKind | null => {
  const atSlot = (slot: number): PassengerKind | null => {
    // v9.20.3 (English playtest 12): a legend or a box above has no fare to copy, so it is not a partner.
    if (kind === 'mimic') { const above = slot >= 3 ? cabin[slot-3] : null; return above && !isAnyLegend(above.kind) && above.kind !== 'parcel' ? above.kind : null; }
    if (!candidate || !['mystery', 'shifter', 'mimic'].includes(kind)) return synergyPartnerAtSlot(kind, cabin, slot, excludeId);
    const placed = cabin.map((r, i) => i === slot ? candidate : r);
    const profile = riderProfile(candidate, placed, slot);
    return neighbours(slot).map(i => placed[i]).find(r => r && r.id !== candidate.id && profile.bond.likes.includes(r.kind))?.kind ?? null;
  };
  const occupiedSlot = cabin.findIndex((rider) => rider?.id === excludeId);
  if (occupiedSlot >= 0) return atSlot(occupiedSlot);
  for (let slot = 0; slot < cabin.length; slot += 1) if (!cabin[slot]) { const partner = atSlot(slot); if (partner) return partner; }
  return null;
};
export const rand = (min: number, max: number, rng: () => number = Math.random) => Math.floor(rng() * (max - min + 1)) + min;
// Fixed route difficulty. Announced in the HUD and rules from the start;
// independent of money, load, previous choices and random outcomes.
export const travelEnergyCost = motorCost;
export const energySavings = (state: RunState) => {
  let saved=0;
  state.cabin.forEach((rider,slot)=>{
    if(rider?.kind==='ghost'&&hasNeighbour(state.cabin,slot,[...GHOST_CONTROLLERS]))saved+=CONTROLLED_GHOST_SAVING;
  });
  if(GHOST_RULES.oneSavingPerExorcist){
    const providers=state.cabin.filter((rider,slot)=>(rider?.kind==='exorcist'||rider?.kind==='medium')&&hasNeighbour(state.cabin,slot,['ghost'])).length;
    saved=Math.min(saved,providers*CONTROLLED_GHOST_SAVING);
  }
  return Math.min(saved,Math.max(0,passengerEnergy(state)-stabilizedEnergy(state)));
};
// Compatibility export for archived callers: the remaining passenger cost.
export const inspectionExtraEnergy = (state: RunState) => Math.max(0, passengerEnergy(state) - stabilizedEnergy(state) - energySavings(state));
/** v9.19: power the dark riders cost on the coming ascent (Scrappers strip parts, uncontrolled Wraiths drain). */
export function darkEnergyLines(state: RunState): ChangeLine[] {
  const lines: ChangeLine[] = [];
  // v9.20.2: a packed cabin needs the fans on (the riders' cost, not the motor's; a Flare does not help).
  if (V9_AGITATION.crowdingPower && state.cabin.filter(Boolean).length >= crowdingThreshold(state.floor + 1)) lines.push({ label: '车厢挤满：风扇耗电', amount: V9_AGITATION.crowdingPower });
  if (troubleFree(state)) return lines;
  const scrappers = state.cabin.filter(r => r?.kind === 'scrapper').length;
  if (scrappers) lines.push({ label: '拆机人拆零件', amount: scrappers * DARK_RULES.scrapperMotor });
  const wraiths = state.cabin.filter((r, i) => r?.kind === 'wraith' && !hasNeighbour(state.cabin, i, GHOST_CONTROL_KINDS) && !hasKeepsake(state, 'bell')).length;
  if (wraiths) lines.push({ label: '怨灵吸电', amount: wraiths * (DARK_RULES.wraithDrain + abyssTier(state.floor + 1)) });
  return lines;
}
export function energyBreakdown(state: RunState) {
  const motor=effectiveMotor(state),people=passengerEnergy(state),stabilizer=stabilizedEnergy(state),shared=energySavings(state);
  const dark=darkEnergyLines(state).reduce((n,l)=>n+l.amount,0);
  const service=serviceSaving(state)+operatorSaving(state)+nightOperatorSaving(state);
  const links=conflictLinks(state.cabin);
  const flat=links.filter(link=>link.effect==='energy').length;
  // Per-person multiplier costs are shared with the cabin display. Flat edge
  // costs and cabin-wide savings stay separate, never counted on both riders.
  const riderCosts=state.cabin.map((rider,slot)=>{
    const base=rider?riderProfile(rider,state.cabin,slot).energy:0;
    const extra=base*links.filter(link=>(link.first===slot||link.second===slot)&&(link.effect==='overload'||link.effect==='gamble')).length;
    return {base,extra,total:base+extra};
  });
  const multiplied=riderCosts.reduce((sum,rider)=>sum+rider.extra,0);
  const conflict=flat+multiplied;
  const conflictProtection=state.upgrades.insulation ? conflict : 0;
  // v10: Quiet and Spirit green links save power, never more than the riders themselves use.
  const symbol=Math.min(people,symbolLedger(state.cabin).power);
  return {motor,people,stabilizer,shared,service,conflict,conflictProtection,symbol,riderCosts,dark,saved:stabilizer+shared+service+conflictProtection+symbol,total:motor+people+conflict+dark-stabilizer-shared-service-conflictProtection-symbol};
}
export const totalEnergyCost = (state: RunState) => energyBreakdown(state).total;
// Inspector judges the controllable load, not the route's unavoidable motor.
export const inspectionLoad = (state: RunState) => { const cost = energyBreakdown(state); return cost.total - cost.motor; };
export const expressTrip = (baseTrip: number, installed: number) => installed > 0 && baseTrip >= SHOP_TUNING.expressMinimum ? baseTrip - 1 : baseTrip;

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) { const target = rand(0, index, rng); [result[index], result[target]] = [result[target], result[index]]; }
  return result;
}

/** Support riders never roll the agitated (high-risk) variant: an agitated Nurse or Inspector contradicts the role. */
const CALM_NATURED: PassengerKind[] = ['nurse', 'inspector', 'cop', 'lawyer', 'mechanic', 'courier', 'exorcist'];
const INTRINSIC_RISK: PassengerKind[] = ['thief','drunk','child','celebrity','inspector','mystery','shifter'];
/** v9.19 draw weights: Commuters and Lovers thin out from 51F; a Courier is half as likely while one rides. */
export const OFFER_WEIGHTS = { lateFrom: 51, lateCommuter: 0.5, lateLover: 0.5, courierAboard: 0.5 };
function weightedKind(floor: number, rng: () => number, forcedRisk = false, excludeLover = false, unlocked: PassengerKind[] = unlockedAt(floor), courierAboard = false): PassengerKind {
  // v9.20: once every new card is a dark version (90F), riders without a dark self stop appearing.
  const allDark = darkShare(floor) >= 1;
  const pool = unlocked.filter(kind => (!forcedRisk || INTRINSIC_RISK.includes(kind)) && (!excludeLover || kind !== 'lover') && (!allDark || Boolean(DARK_OF[kind])));
  // District themes draw their riders at 1.5×; duplicates in the pool (Medium's ghosts) stack.
  const late = floor >= OFFER_WEIGHTS.lateFrom;
  const weight = (kind: PassengerKind) => PASSENGERS[kind].rarity * districtWeight(floor, kind)
    * (late && kind === 'commuter' ? OFFER_WEIGHTS.lateCommuter : late && kind === 'lover' ? OFFER_WEIGHTS.lateLover : 1)
    * (courierAboard && kind === 'courier' ? OFFER_WEIGHTS.courierAboard : 1);
  const total = pool.reduce((sum, kind) => sum + weight(kind), 0);
  let roll = rng() * total;
  for (const kind of pool) { roll -= weight(kind); if (roll <= 0) return kind; }
  return pool[0];
}

export type OfferContext = { keepsakes?: KeepsakeKey[]; legendPool?: LegendKind[] };
/** Early extra kinds: the Medium brings ghosts while aboard; the vinyl keepsake brings musicians. */
export function availableKinds(floor: number, cabin: Array<Rider | null> = [], keepsakes: KeepsakeKey[] = []): PassengerKind[] {
  const kinds = unlockedAt(floor);
  // The Medium draws spirits: ghosts join early and are drawn at double weight while she rides.
  if (legendInCabin(cabin, 'medium')) kinds.push(...(kinds.includes('ghost') ? ['ghost' as const] : ['ghost' as const, 'ghost' as const]));
  if (keepsakes.includes('vinyl') && !kinds.includes('musician')) kinds.push('musician');
  return kinds;
}
export function darkLegendRider(kind: DarkLegendKind, floor: number = DARK_LEGEND_RULES.from, rng: () => number = Math.random): Rider {
  return { id: 'dlegend-' + kind + '-' + rng().toString(36).slice(2, 7), kind, destination: DARK_LEGEND_RULES.destination, patience: 0, boardedAt: floor, fareBonus: 0, stash: 0, volatile: false };
}
export function legendRider(kind: LegendKind, rng: () => number = Math.random): Rider {
  return { id: 'legend-' + kind + '-' + rng().toString(36).slice(2, 7), kind, destination: LEGEND_DESTINATION, patience: 0, boardedAt: 1, fareBonus: 0, stash: 0, volatile: false };
}
export function makeOffers(floor: number, upgrades: Record<UpgradeKey, number>, tutorial = false, rng: () => number = Math.random, cabin: Array<Rider | null> = [], loverCallChance?: number, tuning: OfferTuning = {}, context: OfferContext = {}): Rider[] {
  const guided = floor === 1 && tutorial;
  const available = availableKinds(floor, cabin, context.keepsakes);
  loverCallChance ??= legendInCabin(cabin, 'matchmaker') ? LEGEND_RULES.matchmakerLoverCall : context.keepsakes?.includes('redString') ? LEGEND_RULES.redStringLoverCall : LOVER_CALL_CHANCE;
  const waiting = cabin.some((rider, slot) => rider?.kind === 'lover' && !hasNeighbour(cabin, slot, ['lover']));
  const called = !tutorial && waiting && rng() < loverCallChance;
  // v9.19.1: a lone Ex calls the other one in, as a Lover calls a partner (the card promised it; it never happened).
  const exCalled = !tutorial && !called && cabin.filter(r => r?.kind === 'exlover').length === 1 && rng() < LOVER_CALL_CHANCE;
  // A call fills one slot, not the anchor's whole encounter packet. The other
  // two slots still introduce an interacting pair, without another Lover.
  const courierAboard = cabin.some(r => isCarrierKind(r?.kind));
  const anchor = weightedKind(floor, rng, false, called, available, courierAboard);
  const eligible = (kind: PassengerKind) => available.includes(kind) && (!called || kind !== 'lover') && (darkShare(floor) < 1 || Boolean(DARK_OF[kind]));
  // v10: a tense packet pairs the anchor with someone holding an opposite symbol.
  const anchorSymbols = symbolsOf({ kind: anchor });
  const tension = floor >= 21 && rng() < .3 ? available.filter(k => eligible(k) && pairLink(anchorSymbols, symbolsOf({ kind: k })).clashes.length > 0) : [];
  // v10: a partner must really interact with the anchor — an ability pair (READY_PARTNERS) or a symbol link that does not
  // cancel out — and anyone sharing a symbol with the anchor is a partner too. Mimic, Mystery and Shifter keep their list.
  const linksWith = (k: PassengerKind) => { const l = pairLink(anchorSymbols, symbolsOf({ kind: k })); return l.shared.length + l.clashes.length > 0; };
  const variable = ['mimic', 'mystery', 'shifter'].includes(anchor);
  const story = OFFER_PARTNERS[anchor].filter(k => eligible(k) && (variable || (READY_PARTNERS[anchor] ?? []).includes(k) || linksWith(k)));
  const bySymbol = variable ? [] : available.filter(k => eligible(k) && pairLink(anchorSymbols, symbolsOf({ kind: k })).shared.length > 0);
  const partners = tension.length ? tension : [...new Set([...story, ...bySymbol])];
  const partner = partners[rand(0, partners.length - 1, rng)] ?? 'tourist';
  const kinds: PassengerKind[] = guided ? ['lover', 'lover', 'courier'] : [anchor, partner, called ? 'lover' : exCalled ? 'exlover' : weightedKind(floor, rng, false, false, available, courierAboard)];
  // v9.16: a Courier brings his parcel as an extra card, so one Courier per floor keeps the row at five cards or fewer.
  if (!guided && PARCEL_RULES.enabled) kinds.forEach((kind, i) => { if (kind === 'courier' && kinds.indexOf('courier') !== i) kinds[i] = 'commuter'; });
  // At least one non-high-risk card survives every packet, even after 60F.
  // Its role may still carry intrinsic risk. No player-resource-based rescue.
  const calmIndex = guided ? -1 : rand(0, 2, rng);
  const rushIndex = isRushFloor(floor) ? (calmIndex + 1 + rand(0, 1, rng)) % 3 : -1;
  const chance = tuning.highRiskStart !== undefined
    ? floor < tuning.highRiskStart ? 0 : Math.min(.55, (floor - tuning.highRiskStart + 1) / (tuning.volatileSpan ?? 100))
    : offerRiskChance(floor);
  const offers = kinds.map((kind, index): Rider => {
    const spec = PASSENGERS[kind];
    const rolledTrip = guided ? [5, 5, 2][index] : rand(spec.trip[0], spec.trip[1], rng) + journeyExtension(floor);
    const baseTrip = JOURNEY_RULES.localFrom31 && floor>=31 && index===floor%3
      ? Math.min(rolledTrip,spec.trip[0]+JOURNEY_RULES.localExtra) : rolledTrip;
    // v9.19: the Mystery no longer rolls random traits; he carries a hidden identity, revealed one floor after boarding.
    const traits = kind === 'shifter' ? randomTraits(kind, available, rng) : undefined;
    const identity = kind === 'mystery' ? MYSTERY_IDENTITIES[rand(0, MYSTERY_IDENTITIES.length - 1, rng)] : undefined;
    const volatile = !guided && index !== calmIndex && !CALM_NATURED.includes(kind) && (index === rushIndex || rng() < chance);
    return { id: 'f' + floor + '-' + index + '-' + rng().toString(36).slice(2, 7), kind,
      ...(JOURNEY_RULES.prorateLocalFare && baseTrip<rolledTrip ? {localFareRatio:baseTrip/rolledTrip} : {}),
      destination: floor + expressTrip(baseTrip, upgrades.express), patience: 0, traits, volatile, ...(identity ? { identity } : {}),
      copySeed: kind === 'mimic' ? rand(0, 2147483647, rng) : undefined,
      boardedAt: floor, fareBonus: upgrades.concierge ? boosted({ upgrades }, 'concierge', ECONOMY_RULES.conciergeTip) : 0, stash: 0,
      fuse: kind === 'bomb' ? rand(BOMB_RULES.fuseMin, BOMB_RULES.fuseMax, rng)+Number(Boolean(upgrades.delay)) : undefined,
      bombMs: kind === 'bomb' && BOMB_RULES.realtime ? bombSeconds(expressTrip(baseTrip, upgrades.express)) * 1000 : undefined,
      bombMsTotal: kind === 'bomb' && BOMB_RULES.realtime ? bombSeconds(expressTrip(baseTrip, upgrades.express)) * 1000 : undefined, calledByLover: (called || exCalled) && index === 2,
    };
  });
  // Variable riders bring one matching visible relation in their own packet.
  if (!guided && offers[0].traits) offers[0].traits.bond.likes = [offers[1].kind];
  if (guided) return offers;
  const shuffled = shuffle(offers, rng);
  const courierAt = PARCEL_RULES.enabled ? shuffled.findIndex(r => r.kind === 'courier') : -1;
  if (courierAt >= 0) {
    const courier = shuffled[courierAt], parcelId = courier.id + '-parcel';
    const big = rng() < PARCEL_RULES.bigChance, roll = rng();
    const tier = roll < PARCEL_RULES.legendaryChance ? 'legendary' as const : roll < PARCEL_RULES.legendaryChance + PARCEL_RULES.rareChance ? 'rare' as const : undefined;
    const [lo, hi] = PARCEL_RULES.trips[tier ?? 'common'];
    const trip = rand(lo, hi, rng) + (big ? PARCEL_RULES.crateExtraStop : 0) + journeyExtension(floor);
    const destination = floor + expressTrip(trip, upgrades.express);
    shuffled[courierAt] = { ...courier, destination, routeStops: destination - floor, localFareRatio: undefined, parcelId, ...(big ? { parcelBig: true } : {}), ...(tier ? { tier } : {}) };
    shuffled.splice(courierAt + 1, 0, { id: parcelId, kind: 'parcel', ownerId: courier.id, destination, patience: 0, volatile: false, boardedAt: floor, fareBonus: 0, stash: 0, ...(big ? { big: 'top' as const, boxId: parcelId } : {}), ...(tier ? { tier } : {}) });
  }
  // v9.19 after midnight: each ordinary card may arrive as its dark version (a Courier's box turns into a black box).
  const share = darkShare(floor);
  const darken = (i: number) => {
    const r = shuffled[i], to = DARK_OF[r.kind]!;
    shuffled[i] = turnRider(r, to);
    // v9.19.1: a Mad Bomber keeps the Bomber's trip, but never under his own minimum (a 2-stop dash paid 50 for nothing).
    const minTrip = PASSENGERS.madbomber.trip[0], trip = r.destination - floor;
    if (to === 'madbomber' && trip < minTrip) {
      const ms = bombSeconds(minTrip) * 1000 * DARK_RULES.madbomberSeconds;
      shuffled[i] = { ...shuffled[i], destination: floor + minTrip, bombMs: shuffled[i].bombMs !== undefined ? ms : undefined, bombMsTotal: shuffled[i].bombMsTotal !== undefined ? ms : undefined, bonusMs: shuffled[i].bombMs !== undefined ? ms : shuffled[i].bonusMs, fuse: shuffled[i].fuse !== undefined ? shuffled[i].fuse! + minTrip - trip : undefined };
    }
    if (to === 'smuggler') shuffled.forEach((b, j) => { if (b.kind === 'parcel' && b.ownerId === r.id) shuffled[j] = { ...b, contraband: true }; });
  };
  if (share > 0) shuffled.forEach((r, i) => { if (DARK_OF[r.kind] && rng() < share) darken(i); });
  // v9.20.1: dark cards drawn in the abyss carry its step (their fare premium; the odds of lashing out grow with depth).
  const step = abyssStep(floor + 1);
  if (step) shuffled.forEach((r, i) => { if (isDark(r.kind)) shuffled[i] = { ...r, extreme: step }; });
  // The first batch after the midnight bell always shows at least one changed face.
  if (floor === DARK_RULES.midnightFloor && share > 0 && !shuffled.some(r => isDark(r.kind))) { const i = shuffled.findIndex(r => DARK_OF[r.kind]); if (i >= 0) darken(i); }
  // A legend waits as a fourth card on floor 1 only; it never replaces an ordinary offer.
  const pool = floor === 1 ? (context.legendPool ?? LEGEND_POOL_DEFAULT) : [];
  if (pool.length) shuffled.push(legendRider(pool[rand(0, pool.length - 1, rng)], rng));
  return shuffled;
}

/** Progress is earned on an actual ascent; quotes may project one ascent without mutation. */
export function riderAfterWork(rider: Rider, cabin: Array<Rider | null>, slot: number, agitation: number, inspectionWork = INSPECTION_WORK): Rider {
  const next = { ...rider };
  const low = agitationBand(agitation) === 'low';
  if (next.kind === 'mechanic' && !next.repairDone && low) {
    next.repairProgress = Math.min(REPAIR_WORK, (next.repairProgress ?? 0) + 1);
    next.repairDone = next.repairProgress >= REPAIR_WORK;
  }
  if (next.kind === 'inspector' && !next.complianceReady) {
    // v9.7: any departure that is not at high agitation counts (low or medium), two in a row.
    const calmEnough = INSPECTION_RULE.allowMedium ? agitationBand(agitation) !== 'high' : agitationBand(agitation) === 'low';
    next.quietStreak = calmEnough ? Math.min(inspectionWork, (next.quietStreak ?? 0) + 1) : 0;
    next.complianceReady = next.quietStreak >= inspectionWork;
  }
  if (next.kind === 'child' && hasNeighbour(cabin, slot, [...CHILD_CARERS])) {
    next.careProgress = Math.min(CHILD_CARE_WORK, (next.careProgress ?? 0) + 1);
  }
  return next;
}

/** v9 cabin-wide agitation terms, shared by settlement and the forecast. */
export function cabinPressureLines(state: RunState): ChangeLine[] {
  const occupied = state.cabin.filter(Boolean).length, band = agitationBand(state.stress), red = conflictLinks(state.cabin).length;
  const lines: ChangeLine[] = [];
  if (occupied >= crowdingThreshold(state.floor + 1) && V9_AGITATION.crowding) lines.push({ label: '车厢拥挤', amount: V9_AGITATION.crowding });
  // A floor where someone is due to get off stays calm when arrivalsCalm is on (players can plan around the clock).
  const unrest = nightUnrest(state.floor + 1, occupied), arriving = state.cabin.some(r => r && r.destination <= state.floor + 1);
  const quiet = boxOf(state).motor >= 3 ? 1 : 0;
  const settled = unrest - quiet - (NIGHT_UNREST.arrivalsCalm && arriving ? 1 : 0);
  if (settled > 0) lines.push({ label: '夜深人躁', amount: settled });
  const noise = motorNoise(boxOf(state), occupied); if (noise) lines.push({ label: '电机噪音', amount: noise });
  // v9.18.2: a Thief held by an adjacent Officer or Lawyer stops stealing and helps keep order instead.
  const reformed = state.cabin.filter((r, i) => r?.kind === 'thief' && thiefHeld(state.cabin, i)).length;
  if (reformed && THIEF_RULES.controlledCalm) lines.push({ label: '受管小偷帮忙维持秩序', amount: -reformed * THIEF_RULES.controlledCalm });
  const crooked = state.cabin.filter(r => r?.kind === 'crookedcop').length;
  if (crooked) lines.push({ label: '黑警镇场', amount: -crooked * DARK_RULES.crookedCalm });
  if (legendInCabin(state.cabin, 'don')) lines.push({ label: '教父的威压', amount: LEGEND_RULES.donAgitation });
  if (legendInCabin(state.cabin, 'matchmaker') && red) lines.push({ label: '月老见不得争吵', amount: red });
  if (legendInCabin(state.cabin, 'nightingale') && band === 'low') lines.push({ label: '夜莺要气氛', amount: 1 });
  if (legendInCabin(state.cabin, 'matron')) lines.push({ label: '护士长巡房', amount: -LEGEND_RULES.matronCabinCalm });
  // v9.20 dark legends.
  if (legendInCabin(state.cabin, 'nightoperator')) lines.push({ label: '夜班老周关了灯', amount: DARK_LEGEND_RULES.nightOperatorAgitation });
  if (legendInCabin(state.cabin, 'severer')) { const green = greenLinks(state.cabin); if (green) lines.push({ label: '剪线婆剪断绿线', amount: green * DARK_LEGEND_RULES.severerPerGreen }); }
  if (legendInCabin(state.cabin, 'kingpin')) lines.push({ label: '黑老大的威压', amount: DARK_LEGEND_RULES.kingpinAgitation });
  if (legendInCabin(state.cabin, 'coldmatron')) lines.push({ label: '冷面护士长打镇静剂', amount: -DARK_LEGEND_RULES.coldMatronCalm });
  if (legendInCabin(state.cabin, 'banshee')) lines.push({ label: '哭丧女哀嚎', amount: DARK_LEGEND_RULES.bansheeAgitation });
  if (legendInCabin(state.cabin, 'necromancer')) lines.push({ label: '死灵师低语', amount: DARK_LEGEND_RULES.necromancerAgitation });
  // Undocumented on purpose: a cabin of nothing but night people settles down (players find it themselves).
  if (darkResonance(state.cabin)) lines.push({ label: '暗黑共鸣', amount: -DARK_RESONANCE.calm });
  // v10: Order and Hearth green links calm the cabin; Street ones stir it.
  lines.push(...symbolLedger(state.cabin).agitationLines);
  return lines;
}
/** v9.20.1: seats whose dark rider may lash out on the next ascent (none under a Flare, none while sedated). */
export const outburstSlots = (state: Pick<RunState, 'cabin' | 'floor' | 'flareFloor' | 'flareUntil'>) => troubleFree(state) || !outburstChance(state.floor + 1) ? [] : state.cabin.flatMap((r, slot) => r && isDark(r.kind) && !((r.sedated ?? 0) > 0) ? [slot] : []);
/** Green links (active cooperation) in the cabin, each pair counted once. */
/** v10: green links are shared symbols between neighbours (lib/symbols.ts). */
export const greenLinks = (cabin: Array<Rider | null>) => greenCount(cabin);
/** v10: what the cabin's symbol links pay on this ascent; the Battery and the Red String raise each green link. */
export const symbolCoins = (state: Pick<RunState, 'cabin' | 'upgrades' | 'keepsakes'>) => symbolLedger(state.cabin, SYMBOL_RULES, cooperationBonus(state as RunState) - 1);
/** v9.20 hidden “dark resonance”: at least four riders aboard and every one of them a dark version or a dark legend.
 * Returns the number of riders (0 when the cabin does not qualify). */
export function darkResonance(cabin: Array<Rider | null>): number {
  const riders = cabin.filter((r): r is Rider => Boolean(r) && r!.kind !== 'parcel');
  return riders.length >= DARK_RESONANCE.min && riders.every(r => isDark(r.kind) || isDarkLegend(r.kind)) ? riders.length : 0;
}
export const partnershipAgitation = (state: RunState) => { const a = riskPartnerships(state.cabin).agitation; return hasKeepsake(state, 'pocketWatch') ? Math.min(1, a) : a; };
export const arrivalReliefCapFor = (state: RunState) => AGITATION_RULES.arrivalReliefCap + Number(legendInCabin(state.cabin, 'matron'));
export const ROUNDS_LOG_SHOP_RELIEF = 3;

/** `shopRng` draws the next shop's cards on its own stream (the daily shift keeps them identical for everyone). */
export function resolveFloor(state: RunState, rng: () => number = Math.random, fareTuning: FareTuning = {}, shopRng: () => number = rng): RunState {
  if (state.status !== 'playing') return state;
  if (!state.cabin.some(Boolean)) return { ...state, message: '至少接一位乘客才能上行。' };
  const nextFloor = state.floor + 1;
  const checkpoint = nextFloor % 10 === 0;
  const energyCost = effectiveMotor(state);
  const departBand = agitationBand(state.stress);
  let energy = state.energy; let stress = state.stress; let coins = state.coins;
  const earningSources: ChangeLine[] = []; const pressureSources: ChangeLine[] = []; const energySources: ChangeLine[] = [];
  const addCoins = (label: string, amount: number) => { coins += amount; const existing = earningSources.find((line) => line.label === label); if (existing) existing.amount += amount; else earningSources.push({ label, amount }); };
  const adjustPressure = (label: string, amount: number) => { if (!amount) return; stress += amount; const existing = pressureSources.find((line) => line.label === label); if (existing) existing.amount += amount; else pressureSources.push({ label, amount }); };
  const adjustEnergy = (label: string, amount: number) => { if (!amount) return; energy += amount; const existing = energySources.find((line) => line.label === label); if (existing) existing.amount += amount; else energySources.push({ label, amount }); };
  adjustEnergy('电梯运转', -energyCost);
  state.cabin.forEach((rider,slot)=>{if(rider){const cost=riderProfile(rider,state.cabin,slot).energy;if(cost)adjustEnergy(`${PASSENGERS[rider.kind].name}耗电`,-cost);}});
  if (stabilizedEnergy(state)) adjustEnergy('稳压模块抵消', stabilizedEnergy(state));
  if (energySavings(state)) adjustEnergy('节能少耗', energySavings(state));
  if (serviceSaving(state)) adjustEnergy('检修运转节能', serviceSaving(state));
  if (operatorSaving(state)) adjustEnergy('老周照看电机', operatorSaving(state));
  if (nightOperatorSaving(state)) adjustEnergy('夜班老周关灯省电', nightOperatorSaving(state));
  const redLinks=conflictLinks(state.cabin);
  const {conflict:redEnergy,conflictProtection}=energyBreakdown(state);
  if(redEnergy)adjustEnergy('红线额外耗电',-redEnergy);
  for (const line of darkEnergyLines(state)) adjustEnergy(line.label, -line.amount);
  if(conflictProtection)adjustEnergy('绝缘衬层抵消',conflictProtection);
  if(energyBreakdown(state).symbol)adjustEnergy('符号绿线省电',energyBreakdown(state).symbol);
  const inspectionWork = hasKeepsake(state,'roundsLog') ? 1 : INSPECTION_RULE.work;
  let cabin = state.cabin.map((rider,slot) => rider ? riderAfterWork(rider,state.cabin,slot,state.stress,inspectionWork) : null);
  const notes: string[] = []; const stressReasons: string[] = [];
  let serviceTurns = Math.max(0,(state.serviceTurns ?? 0)-1);
  // Work uses the visible departure band, not agitation spent or removed.
  cabin.forEach((rider,slot) => {
    if (!rider) return;
    if (rider.kind === 'mechanic' && rider.repairDone && !state.cabin[slot]?.repairDone) {
      serviceTurns = Math.min(REPAIR_DURATION_CAP,serviceTurns+REPAIR_DURATION);
      notes.push(`维修工检修完成：后续${serviceTurns}层运转少耗1电`);
    }
  });
  adjustPressure('音乐家节拍',musicAgitation(state));
  state.cabin.forEach((rider, slot) => { if (rider) riderAgitation(state, slot).fixed.forEach(line => {
    adjustPressure(line.label, line.amount);
    // v9.19.1: “教练急躁” already names the rider; only labels without the name get a “谁：” prefix.
    if (line.amount > 0) stressReasons.push(`${line.label.startsWith(PASSENGERS[rider.kind].name) ? line.label : `${PASSENGERS[rider.kind].name}：${line.label}`}，躁动 +${line.amount}`);
  }); });
  const redAgitation=redLinks.filter(link=>link.effect==='agitation').length;
  if(redAgitation){
    adjustPressure('红线躁动',redAgitation);
    stressReasons.push(`红线冲突：躁动 +${redAgitation}`);
  }
  if(redAgitationProtection(state))adjustPressure('隔音门抵消',-redAgitationProtection(state));
  // v9 cabin-wide agitation: crowding, top-level motor noise and legends.
  for (const line of cabinPressureLines(state)) { adjustPressure(line.label, line.amount); if (line.amount > 0 && line.label === '车厢拥挤') stressReasons.push(`车厢拥挤：躁动 +${line.amount}`); }
  // v9.20.1 the abyss: every dark rider aboard may lash out (the odds are on his card); a Flare or a Sedative stops it.
  const lastOutbursts: number[] = [];
  outburstSlots(state).forEach(slot => {
    if (rng() >= outburstChanceAt(state)) return;
    const kind = state.cabin[slot]!.kind, name = PASSENGERS[kind].name;
    if (outburstIsPower(kind)) { adjustEnergy(`${name}发作`, -DARK_RULES.outburstPower); notes.push(`${name}发作，吸走 ${DARK_RULES.outburstPower} 电`); }
    else { adjustPressure(`${name}发作`, DARK_RULES.outburstAgitation); stressReasons.push(`${name}发作，躁动 +${DARK_RULES.outburstAgitation}`); }
    lastOutbursts.push(slot);
  });
  const riskLinks = experimentalRiskLinks(state.cabin, fareTuning.riskLinks);
  if (riskLinks.agitation) adjustPressure('同伙躁动', riskLinks.agitation);
  const partnership = riskPartnerships(state.cabin);
  const watch = hasKeepsake(state,'pocketWatch');
  if (partnershipAgitation(state)) adjustPressure('坏人链接躁动', partnershipAgitation(state));
  const stashPerStep = RISK_STASH_PER_ASCENT + Number(agitationBand(state.stress) === 'high') + Number(watch);
  // v9.19: the longer a crew holds together, the more each member banks (3, 4, 5 … per floor); leaving the crew resets it.
  cabin.forEach((r, slot) => { if (!r) return; if (partnership.members.includes(slot)) { r.stash = (r.stash ?? 0) + stashPerStep + (r.crewFloors ?? 0); r.crewFloors = (r.crewFloors ?? 0) + 1; } else if (r.crewFloors) r.crewFloors = 0; });
  cabin.forEach(rider => { if (rider?.kind === 'don') rider.stash = (rider.stash ?? 0) + LEGEND_RULES.donStashPerFloor; if (rider?.kind === 'kingpin') rider.stash = (rider.stash ?? 0) + DARK_LEGEND_RULES.kingpinStash; });
  if (departBand === 'medium') {
    const musicians = state.cabin.filter(r => r?.kind === 'musician').length;
    if (musicians) addCoins('音乐家演出', musicians * (LEGEND_RULES.musicianMediumCoins + (hasKeepsake(state,'vinyl') ? LEGEND_RULES.vinylMusicianBonus : 0)));
    if (legendInCabin(state.cabin,'nightingale')) addCoins('夜莺驻唱', LEGEND_RULES.nightingaleMediumCoins);
  }
  if (state.floor === 1 && legendInCabin(state.cabin,'tycoon')) addCoins('大亨预付', LEGEND_RULES.tycoonPrepay);
  if (legendInCabin(state.cabin,'medium')) {
    const seance = state.cabin.filter((r, i) => r?.kind === 'ghost' && hasNeighbour(state.cabin, i, [...GHOST_CONTROLLERS])).length;
    if (seance) addCoins('灵媒降神会', seance * LEGEND_RULES.mediumSeanceCoins);
  }
  let legendStatus = state.legendStatus;
  if (state.floor === 1 && state.legendOffer) {
    if (legendInCabin(state.cabin, state.legendOffer)) legendStatus = 'boarded';
    else { legendStatus = 'declined'; addCoins('谢绝传奇：当班补贴', LEGEND_DECLINE_COINS); }
  }
  if (legendInCabin(state.cabin,'stranger')) {
    const roll = rand(0, 3, rng);
    if (roll === 0) addCoins('13号房客', 2);
    else if (roll === 1) adjustPressure('13号房客', -1);
    else if (roll === 2) adjustEnergy('13号房客', 1);
  }
  // v9.20 dark legends.
  if (legendInCabin(state.cabin,'otherthirteen')) {
    const roll = rand(0, 3, rng);
    if (roll === 0) addCoins('另一个13号', DARK_LEGEND_RULES.thirteenCoins);
    else if (roll === 1) { adjustPressure('另一个13号', DARK_LEGEND_RULES.thirteenAgitation); stressReasons.push(`另一个13号：躁动 +${DARK_LEGEND_RULES.thirteenAgitation}`); }
    else if (roll === 2) adjustEnergy('另一个13号', -DARK_LEGEND_RULES.thirteenPower);
  }
  if (legendInCabin(state.cabin,'severer')) { const red = conflictLinks(state.cabin).length; if (red) addCoins('剪线婆收怨', red * DARK_LEGEND_RULES.severerPerRed); }
  if (legendInCabin(state.cabin,'banshee') && departBand === 'high') addCoins('哭丧女的哀歌', DARK_LEGEND_RULES.bansheeHighCoins);
  if (legendInCabin(state.cabin,'necromancer')) { const night = state.cabin.filter(r => r && isDark(r.kind)).length; if (night) addCoins('死灵师收魂', night * DARK_LEGEND_RULES.necromancerPerDark); }
  const resonance = darkResonance(state.cabin);
  if (resonance) addCoins('暗黑共鸣', resonance * DARK_RESONANCE.coinsPerRider);
  const shopIncome = shopFloorIncome(state);
  if (shopIncome.crowd) addCoins('共乘票', shopIncome.crowd);
  if (shopIncome.meter) addCoins('长途计价器', shopIncome.meter);
  const effectCabin = [...cabin]; const lastThefts: TheftReceipt[] = []; const lastHaunts: Array<{ ghost: number; victim: number }> = [];
  const dark = !troubleFree(state), abyss = abyssTier(nextFloor), summoners: number[] = [];
  const haunt = (slot: number) => { const nearby = neighbours(slot).filter((i) => effectCabin[i] && effectCabin[i]!.kind !== 'parcel'); if (!nearby.length) return; const victim = nearby[rand(0, nearby.length - 1, rng)]; effectCabin[victim]!.destination += 1; lastHaunts.push({ ghost: slot, victim }); notes.push(effectCabin[slot]!.kind === 'wraith' ? '怨灵令邻座延误一层' : '幽灵令邻座延误一层'); };
  effectCabin.forEach((rider, slot) => {
    if (!rider) return;
    const controlledThief = thiefHeld(effectCabin, slot);
    const controlledGhost = hasNeighbour(effectCabin, slot, GHOST_CONTROL_KINDS) || hasKeepsake(state,'bell');
    switch (rider.kind) {
      case 'mechanic': break; // Shared savings are itemized in lastEnergy.
      case 'tourist': break; // Companion rewards are paid on delivery only.
      case 'lover': break; // Pairing increases delivery value, never idle income.
      case 'thief': {
        // v9.17: he picks the pockets of every adjacent rider except Officers, Lawyers, the Don and legends.
        if (controlledThief) break;
        const victims = neighbours(slot).map(i => ({ slot: i, coins: ECONOMY_RULES.thiefPerVictim ? pickpocketFrom(effectCabin[i]) : 0 })).filter(v => v.coins > 0);
        const take = ECONOMY_RULES.thiefTravel + victims.reduce((n, v) => n + v.coins, 0);
        if (take) addCoins(ECONOMY_RULES.thiefPerVictim ? '小偷顺手牵羊' : '小偷', take);
        if (victims.length) lastThefts.push({ thief: slot, victims });
        break;
      }
      case 'drunk': break;
      case 'ghost': if (controlledGhost) notes.push('幽灵受控，不再延误邻座'); else if (nextFloor % 3 === 0) haunt(slot); break;
      case 'celebrity': if (neighbourCount(effectCabin, slot) === 1) addCoins('名人关注', ECONOMY_RULES.celebrityTravel); break;
      case 'madbomber':
      case 'bomb': { if (!bombLocked(effectCabin, slot) && !BOMB_RULES.realtime) rider.fuse = (rider.fuse ?? 1) - bombTick(state.stress); break; }
      // v9.19 dark riders on the move. A flare (troubleFree) stops their trouble, not their income.
      case 'robber': if (dark && !controlledThief) { const take = Math.min(Math.max(0, coins), DARK_RULES.robberCap + 3 * abyss, DARK_RULES.robberBase + 2 * abyss + Math.floor(Math.max(0, coins) * DARK_RULES.robberRate)); if (take > 0) addCoins('劫匪抢走', -take); } break;
      case 'crookedcop': if (dark) { const fee = Math.min(Math.max(0, coins), DARK_RULES.crookedFee + 2 * abyss); if (fee > 0) addCoins('黑警保护费', -fee); } break;
      case 'shyster': { const fee = Math.min(DARK_RULES.shysterCap, conflictLinks(effectCabin).length * DARK_RULES.shysterPerRed); if (fee) addCoins('讼棍打官司', fee); break; }
      case 'scrapper': addCoins('拆机人卖零件', DARK_RULES.scrapperCoins + (hasNeighbour(effectCabin, slot, ['grafter']) ? DARK_RULES.fenceCoins : 0)); break;
      case 'grafter': { const n = neighbourCount(effectCabin, slot); if (n) addCoins('贪腐检查员收检查费', n * DARK_RULES.grafterFee); break; }
      case 'noisemaker': if (departBand === 'high') addCoins('噪音乐手演出', DARK_RULES.noiseHighCoins); break;
      case 'overtimer': rider.stash = (rider.stash ?? 0) + DARK_RULES.overtimePay; break;
      case 'voyeur': if (dark && neighbours(slot).some(i => effectCabin[i] && isSurvivor(effectCabin[i]!.kind))) rider.stash = (rider.stash ?? 0) + DARK_RULES.voyeurPhoto; break;
      case 'scandal': rider.stash = (rider.stash ?? 0) + neighbourCount(effectCabin, slot) * DARK_RULES.scandalPerNeighbour + (hasNeighbour(effectCabin, slot, ['voyeur']) ? DARK_RULES.scandalVoyeur : 0); break;
      case 'wraith': if (controlledGhost) addCoins('怨灵受控：供奉', DARK_RULES.wraithControlledCoins); else if (dark) haunt(slot); break;
      case 'summoner': if (nextFloor % DARK_RULES.summonEvery === 0) summoners.push(slot); break;
    }
  });
  let arrivals = 0;
  let keepsakes = state.keepsakes ?? [];
  let freeBoxLevels = state.freeBoxLevels ?? 0;
  let stressCapBonus = 0;
  let punchCount=state.punchCount??0;
  const arrivalSlots: number[] = []; const lastArrivals:ArrivalReceipt[]=[];
  // v9.17 box events before arrivals, in priority order: a Courier delivering this floor keeps his box; otherwise
  // a Thief leaving takes the box he eyes, then a Child opens a box beside them, then a Mechanic uses an unclaimed
  // box for parts. An Inspector checks a Courier's box once (he rides one floor longer).
  const stolen = new Set<number>(), thiefTips = new Map<number, number>();
  // v9.17.2 hidden contents, rolled on opening. Abilities won this floor are installed after settlement.
  const wonAbilities: UpgradeKey[] = []; let pendingAbility = state.pendingAbility;
  const lastBoxEvents: BoxEvent[] = []; let lastIncident: IncidentReceipt | undefined;
  const boxEvent = (slot: number, by: BoxEvent['by'], box: { big?: unknown; tier?: BoxTier }, got?: { coins?: number; power?: number; ability?: UpgradeKey }) =>
    lastBoxEvents.push({ slot, by, ...(got?.ability ? { ability: got.ability } : got?.power ? { power: got.power } : got ? { coins: got.coins ?? 0 } : {}), ...(box.big ? { big: true } : {}), ...(box.tier ? { tier: box.tier } : {}) });
  const receive = (box: { big?: unknown; tier?: BoxTier }, label: string, say: string) => {
    const installed = { ...state.upgrades }; wonAbilities.forEach(k => { installed[k] = 1; }); if (pendingAbility) installed[pendingAbility] = 1;
    let got = rollBox(box, rng, installed);
    // Every slot full: the first such ability waits for the player to swap it in; any other is sold at once.
    if (got.ability && Object.values(installed).filter(Boolean).length - (pendingAbility ? 1 : 0) >= UPGRADE_SLOTS) {
      if (!pendingAbility) { pendingAbility = got.ability; notes.push(`${say}能力「${UPGRADES[got.ability].name}」（安装位已满，可以替换一项）`); return got; }
      got = { coins: SELL_REFUND, power: 0 };
    }
    if (got.ability) { wonAbilities.push(got.ability); notes.push(`${say}能力「${UPGRADES[got.ability].name}」`); return got; }
    if (got.coins) { addCoins(label, got.coins); notes.push(`${say}${got.coins} 金币`); return got; }
    adjustEnergy(label, got.power); notes.push(`${say}${got.power} 电的电池`); return got;
  };
  {
    const before = parcelLinks(cabin);
    const delivering = (box: Box) => { const c = before.carrier.get(box.slots[0]); return c !== undefined && nextFloor >= cabin[c]!.destination; };
    const openBox = (box: Box, by: string) => { const got = receive(box, `${by}拆开纸箱`, `${by}拆开纸箱：`); boxEvent(Math.min(...box.slots), 'child', box, got); box.slots.forEach(p => { cabin[p] = null; }); };
    for (const box of before.boxes) {
      if (delivering(box)) continue;
      // v9.19: a sealed box cannot be seized, stolen or opened on the way.
      if (cabin[box.slots[0]]?.sealed) continue;
      // v9.19: an ordinary Inspector beside a Smuggler's black box seizes it (a reward for you; the Smuggler is left empty-handed).
      if (cabin[box.slots[0]]?.contraband && box.touching.some(i => cabin[i]?.kind === 'inspector')) {
        box.slots.forEach(p => { cabin[p] = null; });
        addCoins('检查员没收黑箱', DARK_RULES.seizeReward);
        lastBoxEvents.push({ slot: Math.min(...box.slots), by: 'inspect', coins: DARK_RULES.seizeReward });
        notes.push(`检查员没收了黑箱：举报奖励 +${DARK_RULES.seizeReward} 金币`); continue;
      }
      const thief = before.eyed.get(box.slots[0]);
      if (thief !== undefined && nextFloor >= cabin[thief]!.destination) {
        box.slots.forEach(p => stolen.add(p)); thiefTips.set(thief, Math.max(1, Math.floor(boxCoins(box) * (0.5 + rng()) * PARCEL_RULES.thiefShare)));
        lastBoxEvents.push({ slot: Math.min(...box.slots), by: 'thief', thief, ...(box.big ? { big: true } : {}), ...(box.tier ? { tier: box.tier } : {}) });
        notes.push('小偷带走了纸箱'); continue;
      }
      if (PARCEL_RULES.childOpens && box.touching.some(i => cabin[i]?.kind === 'child')) { openBox(box, '小孩'); continue; }
      const mechanic = box.touching.find(i => cabin[i]?.kind === 'mechanic' && !cabin[i]!.repairDone);
      if (PARCEL_RULES.mechanicParts && mechanic !== undefined && !before.carrier.has(box.slots[0]) && !cabin.some(r => Boolean(box.ownerId) && r?.id === box.ownerId)) {
        boxEvent(Math.min(...box.slots), 'mechanic', box);
        box.slots.forEach(p => { cabin[p] = null; });
        cabin[mechanic] = { ...cabin[mechanic]!, repairDone: true, repairProgress: REPAIR_WORK };
        serviceTurns = Math.min(REPAIR_DURATION_CAP, serviceTurns + REPAIR_DURATION);
        notes.push(`维修工拆了纸箱当零件：检修完成，后续${serviceTurns}层运转少耗1电`); continue;
      }
      const c = before.carrier.get(box.slots[0]);
      if (PARCEL_RULES.inspectCoins && c !== undefined && !cabin[box.slots[0]]!.inspected && box.touching.some(i => cabin[i]?.kind === 'inspector')) {
        box.slots.forEach(p => { cabin[p] = { ...cabin[p]!, inspected: true }; });
        lastBoxEvents.push({ slot: Math.min(...box.slots), by: 'inspect', coins: PARCEL_RULES.inspectCoins });
        cabin[c] = { ...cabin[c]!, destination: cabin[c]!.destination + 1 };
        notes.push(`检查员验货：快递员晚一层到站，签收多付 ${PARCEL_RULES.inspectCoins} 金币`);
      }
    }
  }
  const links = parcelLinks(cabin);
  // A Courier leaving before the Bomber beside him carries the bomb away; the Bomber stays aboard in disguise.
  const disarmed = new Set([...links.bombs].filter(([c, b]) => nextFloor >= cabin[c]!.destination && nextFloor < cabin[b]!.destination).map(([, b]) => b));
  if (disarmed.size) notes.push('快递员带走了炸弹：炸弹客乔装成通勤者');
  const withdrawalIds = new Set<string>();
  cabin = cabin.map((rider, slot) => {
    if (!rider) return null;
    if (disarmed.has(slot)) return { ...rider, kind: 'commuter', disguised: true, fuse: undefined, bombMs: undefined, bombMsTotal: undefined };
    if (isBombKind(rider.kind) && !BOMB_RULES.realtime && (rider.fuse ?? 0) <= 0 && nextFloor < rider.destination) return rider;
    if (rider.kind === 'parcel') {
      // With its Courier aboard the parcel travels with him and leaves when he does; unclaimed, it opens at its floor.
      if (stolen.has(slot)) return null;
      const by = links.carrier.get(slot);
      if (by !== undefined) return nextFloor >= cabin[by]!.destination ? null : rider;
      const owner = cabin.find(r => Boolean(rider.ownerId) && r?.id === rider.ownerId);
      if (owner) return nextFloor >= owner.destination ? null : rider;
      if (nextFloor < rider.destination) return rider;
      if (rider.big === 'bottom') return null; // the upper half opens the whole box
      const got = receive(rider, '纸箱开箱', '无人认领的纸箱开箱：');
      boxEvent(slot, 'arrival', rider, got);
      lastArrivals.push({ riderId: rider.id, kind: rider.kind, slot, coins: got.coins, ...(got.power ? { power: got.power } : {}), ...(got.ability ? { ability: got.ability } : {}) });
      return null;
    }
    if (nextFloor < rider.destination) return rider;
    // v9.19: the Overtimer only gets off with a neighbour who is getting off too (or his alarm rings, or a flare);
    // three floors past his stop he walks off without paying.
    if (overtimerLingers({ ...state, cabin }, slot)) {
      if (nextFloor - rider.destination < DARK_RULES.overstayMax) return rider;
      notes.push('加班魂过站太久，没付钱就走了'); return null;
    }
    if (rider.kind === 'pusher') neighbours(slot).forEach(i => { const n = cabin[i]; if (n && n.kind !== 'parcel' && nextFloor < n.destination && !(n.sedated ?? 0)) withdrawalIds.add(n.id); });
    const spec = PASSENGERS[rider.kind]; const profile = riderProfile(rider, cabin, slot);
    const fare = arrivalFare(rider, cabin, slot, cooperationBonus(state), state.stress, fareTuning, hasKeepsake(state,'bell'));
    const appetitePremium = rider.kind === 'drunk' ? fare - arrivalFare(rider, cabin, slot, cooperationBonus(state), state.stress, { ...fareTuning, appetiteBonus: 0 }, hasKeepsake(state,'bell')) : 0;
    if (profile.hidden) notes.push(`${spec.name}封存车费揭晓：${profile.fare} 金币`);
    const delivered = parcelBeside(cabin, slot, links);
    if (!delivered) notes.push(rider.kind === 'smuggler' ? '走私客没带着黑箱到站，没有付钱' : '快递员没带着纸箱到站，没有付钱');
    if (rider.kind === 'courier' && delivered) adjustEnergy('快递员电池包', COURIER_ARRIVAL_CHARGE);
    if (thiefTips.get(slot)) addCoins('小偷带走纸箱的小费', thiefTips.get(slot)!);
    // v9.18: a Bomber delivered in real time pays a bonus for the seconds still left on his timer.
    const defusal = rider.kind === 'bomb' && BOMB_RULES.realtime && rider.bombMs ? Math.floor(Math.min(rider.bonusMs ?? rider.bombMs, rider.bombMs) / 1000 / BOMB_RULES.bonusSeconds) : 0;
    if (defusal) addCoins('拆弹奖金', defusal);
    // A Mimic under a box carries a copy of it and opens the copy as he leaves.
    const above = slot >= 3 ? cabin[slot - 3] : null;
    if (rider.kind === 'mimic' && PARCEL_RULES.mimicCopiesBox && above?.kind === 'parcel') {
      boxEvent(slot, 'mimic', above, receive(above, '复制人的复制箱', '复制人打开复制箱：'));
    }
    const exposed = rider.kind === 'scandal' && hasNeighbour(cabin, slot, ['inspector', 'crookedcop']);
    const stash = exposed ? 0 : (rider.stash ?? 0);
    if (exposed) notes.push('丑闻曝光：丑闻明星这一趟车费归零');
    // v9.20: legends pay no fare, so their arrival adds no empty “到站 0” line.
    if (!isAnyLegend(rider.kind) || fare - appetitePremium - stash) addCoins(`${spec.name}${profile.hidden ? '揭晓车费' : '到站'}`, fare - appetitePremium - stash);
    if (stash) addCoins(stashLabel(rider.kind) + '兑现', stash);
    if (appetitePremium) addCoins('醉汉躁动加价', appetitePremium);
    let punchBonus=0;
    if(delivered&&state.upgrades.punchcard){punchCount=(punchCount+1)%5;if(punchCount===0){punchBonus=boosted(state,'punchcard',profile.fare);addCoins('第五位基价奖励',punchBonus);}}
    let extra = 0; let keepsakeLeft: KeepsakeKey | undefined;
    if (isDarkLegend(rider.kind)) {
      // v9.20: each dark legend pays in its own way on reaching the 70F shop.
      const pay = (label: string, amount: number) => { extra += amount; addCoins(label, amount); };
      switch (rider.kind) {
        case 'nightoperator': freeBoxLevels += DARK_LEGEND_RULES.nightOperatorBoxLevels; notes.push('夜班老周留下一级免费配电箱升级'); break;
        case 'severer': pay('剪线婆的酬金', DARK_LEGEND_RULES.severerPay); break;
        case 'coldmatron': stressCapBonus += DARK_LEGEND_RULES.coldMatronCap; notes.push(`冷面护士长留下病历：躁动上限 +${DARK_LEGEND_RULES.coldMatronCap}`); break;
        case 'banshee': pay('哭丧女的酬金', DARK_LEGEND_RULES.bansheePay); break;
        case 'necromancer': pay('死灵师的酬金', DARK_LEGEND_RULES.necromancerPay); break;
        case 'highroller': if (state.stress > 0) pay('赌王的赌注', DARK_LEGEND_RULES.highRollerPerPoint * state.stress); break; // v9.20.3: the agitation when the doors closed
        case 'otherthirteen': { const gift = rand(0, DARK_LEGEND_RULES.thirteenPayMax, rng); if (gift) pay('另一个13号的馈赠', gift); break; }
      }
    } else if (!isLegend(rider.kind)) {
      if (delivered && departBand === 'medium') { const tip = V9_AGITATION.mediumTip + (hasKeepsake(state,'vinyl') ? 2 : 0); extra += tip; addCoins('热闹小费', tip); }
      if (delivered && departBand === 'low') { const tip = V9_AGITATION.lowTip + (legendInCabin(state.cabin,'matron') ? LEGEND_RULES.matronQuietCoins : 0); extra += tip; addCoins('安静好评', tip); }
      if (delivered && departBand === 'low' && hasKeepsake(state,'roundsLog')) { extra += 1; addCoins('查房记录', 1); }
    } else {
      legendStatus = 'delivered';
      if (rider.kind === 'tycoon' && departBand === 'low' && !redLinks.some(l => l.first === slot || l.second === slot)) { extra += LEGEND_RULES.tycoonBalance; addCoins('大亨尾款', LEGEND_RULES.tycoonBalance); }
      const gift = LEGEND_KEEPSAKE[rider.kind];
      const owned = new Set(keepsakes);
      const key = gift === 'random' ? KEEPSAKE_KEYS.filter(k => !owned.has(k))[rand(0, Math.max(0, KEEPSAKE_KEYS.filter(k => !owned.has(k)).length - 1), rng)] : gift;
      if (key && !owned.has(key)) { keepsakeLeft = key; keepsakes = [...keepsakes, key]; notes.push(`${spec.name}留下信物`); if (key === 'wrench') freeBoxLevels += 1; if (key === 'roundsLog') stressCapBonus += 2; }
      if (gift === 'random') { const bonus = rand(0, LEGEND_RULES.strangerKeepsakeCoins, rng); if (bonus) { extra += bonus; addCoins('13号房客的馈赠', bonus); } }
    }
    lastArrivals.push({riderId:rider.id,kind:rider.kind,slot,coins:fare-(rider.stash??0)+stash+punchBonus+extra+defusal,...(keepsakeLeft?{keepsake:keepsakeLeft}:{})});
    arrivals += 1; arrivalSlots.push(slot); return null;
  });
  // v9.19 midnight bookkeeping on the riders still aboard.
  cabin = cabin.map(r => {
    if (!r) return r;
    let next = r;
    if ((r.sedated ?? 0) > 0 || (r.withdrawal ?? 0) > 0) next = { ...next, sedated: Math.max(0, (r.sedated ?? 0) - 1), withdrawal: Math.max(0, (r.withdrawal ?? 0) - 1) };
    if (withdrawalIds.has(r.id)) next = { ...next, withdrawal: DARK_RULES.withdrawalFloors };
    if (r.kind === 'mystery' && !r.revealed) { next = { ...next, revealed: true }; if (r.identity) notes.push(`神秘人身份揭晓：${MYSTERY_NAMES[r.identity]}`); }
    return next;
  });
  if (withdrawalIds.size) notes.push('药贩下车了：身边的人开始戒断');
  const lastCorruption: NonNullable<RunState['lastCorruption']> = [];
  if (dark) cabin = cabin.map((r, slot) => {
    if (!r) return r;
    if (!corruptible(r.kind) || r.warded) return r.corruption ? { ...r, corruption: 0 } : r;
    const darkBeside = neighbours(slot).filter(i => state.cabin[i] && isDark(state.cabin[i]!.kind) && cabin[i]).length;
    if (darkBeside < DARK_RULES.corruptionNeighbours) return r.corruption ? { ...r, corruption: 0 } : r;
    const progress = (r.corruption ?? 0) + 1;
    if (progress < DARK_RULES.corruptionFloors) return { ...r, corruption: progress };
    const to = DARK_OF[r.kind]!; lastCorruption.push({ slot, from: r.kind, to });
    notes.unshift(`${PASSENGERS[r.kind].name}被同化成了${PASSENGERS[to].name}`);
    return turnRider(r, to);
  });
  if (lastCorruption.some(e => e.to === 'smuggler')) cabin = cabin.map(r => r?.kind === 'parcel' && cabin.some(c => c?.kind === 'smuggler' && c.id === r.ownerId) ? { ...r, contraband: true } : r);
  const lastSummons: number[] = [];
  for (const s of summoners) {
    if (!cabin[s]) continue;
    const seat = cabin.findIndex((r, i) => !r && neighbours(s).includes(i)) >= 0 ? cabin.findIndex((r, i) => !r && neighbours(s).includes(i)) : cabin.findIndex(r => !r);
    if (seat < 0) continue;
    cabin = cabin.map((r, i) => i === seat ? { id: `summon-${nextFloor}-${seat}`, kind: 'ghost', destination: nextFloor + DARK_RULES.summonTrip, patience: 0, boardedAt: nextFloor, fareBonus: 0, stash: 0, volatile: false, summoned: true } : r);
    lastSummons.push(seat); notes.push('召魂人召来了一只幽灵');
  }
  const shopRewards = rollShopRewards(shopOpportunities(state, effectCabin, arrivalSlots), rng);
  if (shopRewards.tips) addCoins('小费盒额外小费', shopRewards.tips);
  const tipSlots=arrivalSlots.filter(slot=>neighbourCount(effectCabin,slot)>=2);
  for(const index of shopRewards.winningTipIndices){const receipt=lastArrivals.find(r=>r.slot===tipSlots[index]);if(receipt)receipt.coins+=boosted(state,'tipjar',ECONOMY_RULES.tipReward);}
  if(state.upgrades.meter)for(const receipt of lastArrivals)receipt.coins+=deliveryUpgradeIncome(state,effectCabin,[receipt.slot]).meter;
  if (shopRewards.energy) adjustEnergy('并联回充', shopRewards.energy);
  const chargeBoost=naturalChargeBoost(state,arrivalSlots.filter(i=>effectCabin[i]?.kind==='courier'&&parcelBeside(effectCabin,i)).length*COURIER_ARRIVAL_CHARGE+shopRewards.energy);
  if(chargeBoost)adjustEnergy('自然回充增幅',chargeBoost);
  const gapCharge=deliveryGapCharge(state,arrivalSlots.length);
  // The flywheel only saves motor power still being paid after Old Zhou and repairs.
  const flywheel=flywheelSaving(state,arrivalSlots.length,energyCost-serviceSaving(state)-operatorSaving(state)-nightOperatorSaving(state));
  if(flywheel)adjustEnergy('飞轮节能',flywheel);
  if(gapCharge.energy)adjustEnergy('等待到站回充',gapCharge.energy);
  const deliveredUpgrades=deliveryUpgradeIncome(state,effectCabin,arrivalSlots);
  if(deliveredUpgrades.crowd)addCoins(SHOP_RULES.mixed?'混乘票':'共乘票',deliveredUpgrades.crowd);
  if(deliveredUpgrades.single)addCoins('单站检票器',deliveredUpgrades.single);
  if(deliveredUpgrades.meter)addCoins('长途计价器',deliveredUpgrades.meter);
  const finale=finaleIncome(state,arrivalSlots.length,cabin.filter(Boolean).length);if(finale)addCoins('谢幕礼',finale);
  if (departBand === 'high' && rng() < V9_AGITATION.incidentChance) {
    const victims = cabin.flatMap((rider, slot) => rider && !isAnyLegend(rider.kind) && rider.kind !== 'parcel' ? [slot] : []);
    if (victims.length) {
      const slot = victims[rand(0, victims.length - 1, rng)];
      notes.unshift(`车厢事故：${PASSENGERS[cabin[slot]!.kind].name}受不了混乱，提前下车，未付车费`);
      stressReasons.unshift(`车厢事故：${PASSENGERS[cabin[slot]!.kind].name}提前下车`);
      lastIncident = { riderId: cabin[slot]!.id, kind: cabin[slot]!.kind, slot };
      cabin = cabin.map((rider, i) => i === slot ? null : rider);
    }
  }
  for (const line of symbolCoins(state).lines) addCoins(line.label, line.amount);
  const riskIncome = rollExperimentalRiskIncome(state.cabin, fareTuning.riskLinks, rng);
  if (riskIncome) addCoins('同伙收入', riskIncome);
  const redCoinDemand=Math.max(0, redLinks.filter(link=>link.effect==='coins').length*2 - (state.cabin.some(r=>r?.kind==='lawyer') ? 2 : 0) - (state.upgrades.insulation ? Infinity : 0));
  const redCoinLoss=Math.min(coins,redCoinDemand);
  if(redCoinLoss)addCoins('红线金币损失',-redCoinLoss);
  const insulatedIncome=state.upgrades.insulation?Math.min(boosted(state,'insulation',INSULATION_RULES.cap),redLinks.length*INSULATION_RULES.coinsPerLink):0;
  if(insulatedIncome)addCoins('绝缘衬层：冲突小费',insulatedIncome);
  // Arriving on the same floor as fuse expiry is still safe.
  const bombFailed = !BOMB_RULES.realtime && cabin.some((rider) => rider?.kind === 'madbomber' && (rider.fuse ?? 0) <= 0);
  let lastBlast: RunState['lastBlast'];
  if (!BOMB_RULES.realtime) { const b = cabin.findIndex(r => r?.kind === 'bomb' && (r.fuse ?? 0) <= 0); if (b >= 0) { const blast = blastAt(cabin, b, coins); cabin = blast.cabin; if (blast.coins) addCoins('炸弹客的炸弹炸了', -blast.coins); lastBlast = { bomber: b, slots: blast.slots, coins: blast.coins }; notes.unshift('炸弹客的炸弹炸了：邻座被炸下车，没付车费'); } }
  const relieved = Math.min(Math.max(0, stress), Math.min(arrivals, arrivalReliefCapFor(state)));
  if (relieved) adjustPressure('乘客到站舒缓', -relieved);
  // v9.19.1: when a Brawler or Noisemaker gets off, the cabin breathes out; high-agitation play needs a way down.
  const calmedDown = Math.min(Math.max(0, stress), DARK_RULES.troublemakerRelief * lastArrivals.filter(a => a.kind === 'brawler' || a.kind === 'noisemaker').length);
  if (calmedDown) adjustPressure('闹事的人下车了', -calmedDown);
  if (checkpoint && hasKeepsake({keepsakes},'roundsLog') && stress > 0) adjustPressure('查房记录：进店舒缓', -Math.min(ROUNDS_LOG_SHOP_RELIEF, stress));
  const entryCharge = shopEntryCharge(boxOf(state));
  if(checkpoint&&entryCharge&&energy<state.energyCap)adjustEnergy('抵达商店补电',Math.min(entryCharge,state.energyCap-energy));
  // v9.17.2: abilities swapped out for a box's ability are sold on entering the shop.
  const soldOnEntry = checkpoint ? (state.pendingSales ?? []) : [];
  if (soldOnEntry.length) addCoins('卖掉被替换的能力', soldOnEntry.length * SELL_REFUND);
  if(checkpoint&&hasKeepsake({keepsakes},'stock')){const interest=Math.min(LEGEND_RULES.stockCap,Math.floor(Math.max(0,coins)*LEGEND_RULES.stockRate));if(interest)addCoins('股票利息',interest);}
  const buffer=settleBuffer(energy,state.energyCap,state.bufferPower??0,Boolean(state.upgrades.buffer)&&!SHOP_TUNING.bufferGap&&!SHOP_TUNING.bufferFlywheel);
  if(buffer.released)adjustEnergy('缓冲槽补电',buffer.released);
  if(buffer.captured)adjustEnergy('存入缓冲槽',-buffer.captured);
  if (energy > state.energyCap) adjustEnergy('超额回充未储存', state.energyCap - energy);
  energy = Math.min(state.energyCap, energy); stress = Math.max(0, stress);
  let status: RunState['status'] = checkpoint ? 'upgrade' : 'playing';
  let message = arrivals ? `${arrivals} 位乘客抵达。门再次开启。` : '电梯继续向上，新的面孔正在等候。';
  if (bombFailed) { status = 'lost'; message = '炸弹倒计时归零：疯炸客的怪炸弹炸了。午夜班次戛然而止。'; }
  else if (energy < 0 || (!checkpoint && energy === 0)) { status = 'lost'; message = '电量耗尽，轿厢停在了楼层之间。'; }
  else if (!checkpoint && stress >= state.stressCap) { status = 'lost'; message = '躁动达到上限，午夜班次失控。'; }
  if (stressReasons.length && status === 'playing') message = stressReasons.slice(0, 2).join(' · ');
  // v9.18.4: two controlled Ghosts printed the same note twice; merge repeats into “×2”.
  else if (notes.length && status === 'playing') message = [...new Set(notes)].map(n => { const k = notes.filter(x => x === n).length; return k > 1 ? `${n} ×${k}` : n; }).slice(0, 2).join(' · ');
  const lastEarnings = { total: coins - state.coins, sources: earningSources }; const lastPressure = { delta: stress - state.stress, sources: pressureSources }; const lastEnergy = { delta: energy - state.energy, sources: energySources }; const incomeNote = lastEarnings.total ? `${lastEarnings.total>0?'+':''}${lastEarnings.total} 金币 · ` : '';
  cabin = cabin.map(rider => rider?.kind === 'shifter' ? { ...rider, traits: randomTraits('shifter', unlockedAt(nextFloor), rng, (rider.traits?.revision ?? 0) + 1) } : rider);
  if (cabin.some(rider => rider?.kind === 'shifter') && status === 'playing') message += ' 百变人已变化，关门前查看新属性。';
  const drawn=status==='upgrade'?drawUpgradeOffer(state.upgrades,state.shopSeen??[],shopRng,nextFloor):{keys:[],seen:state.shopSeen};
  const shop = drawn.keys.map(key=>({key,price:upgradePrice(key,nextFloor,state.upgrades[key]),purchased:false}));
  if(SHOP_TUNING.bufferGap)state={...state,bufferGapTurns:gapCharge.progress};
  state=consumeFlywheel(state,flywheel);
  const stabilized = stabilizedEnergy(state);
  const itemStock = status === 'upgrade' ? drawItemStock(nextFloor, shopRng, state.itemBought) : state.itemStock;
  // v9.21 the eve of the abyss: announced as the 80F shop opens; the night market's stall stands only on its own floor.
  const abyssEvents = status === 'upgrade' && nextFloor === ABYSS_EVENTS.shopFloor ? drawAbyssEvents(shopRng) : state.abyssEvents;
  const marketHere = status === 'playing' && abyssEvents?.some(e => e.floor === nextFloor && e.kind === 'market');
  const marketStock = marketHere ? drawMarketStock(nextFloor, shopRng, state.itemBought) : undefined, marketFloor = marketHere ? nextFloor : undefined;
  const settled: RunState = { ...state, abyssEvents, marketStock, marketFloor, lastOutbursts, lastThefts, lastHaunts, lastBoxEvents, lastIncident, lastBlast, lastCorruption, lastSummons, itemStock, pendingAbility, pendingSales: checkpoint ? [] : state.pendingSales, stressCap: state.stressCap + stressCapBonus, stabilizerSector: stabilized ? Math.floor(state.floor / 10) : state.stabilizerSector, stabilizerUsed: stabilized ? stabilizerUsed(state) + stabilized : state.stabilizerUsed, calmCharge: checkpoint && state.upgrades.calm ? true : state.calmCharge, keepsakes, freeBoxLevels, legendStatus, floor: nextFloor, energy, stress, coins, serviceTurns, punchCount, lastArrivals, bufferPower:buffer.stored, restStops: 0, dismissalsUsed: checkpoint ? 0 : (state.dismissalsUsed ?? 0), shopUpgradeBought: false, shopExtraBought: false, earned: state.earned + lastEarnings.total, shop, shopSeen:drawn.seen, cabin, swapped: false, oldMovesUsed:0, status, message, lastEarnings, lastPressure, lastEnergy, log: [`${String(nextFloor).padStart(2, '0')}F · ${incomeNote}${message}`, ...state.log].slice(0, 4) };
  // Abilities found in boxes install like a shop pick (effects such as Safety Margin apply at once).
  return wonAbilities.reduce((run, key) => previewUpgrade(run, key), settled);
}

export type UpgradeCrisis = 'energy' | 'stress' | 'both' | null;
export const upgradeChoices = (upgrades: Record<UpgradeKey, number> = EMPTY_UPGRADES, rng: () => number = Math.random, _crisis: UpgradeCrisis = null): UpgradeKey[] => {
  return drawUpgradeOffer(upgrades,[],rng).keys;
};
/** v9: capacity moved into the power box, rails into the base game; Longer Fuse retired; Reservation and Rebooking merged into Dispatch. */
/** Insulation turns each red link into a small income while it rides (tuned in scripts/balance-sim). */
export const INSULATION_RULES = { coinsPerLink: 1, cap: 3 };
export const RETIRED_UPGRADES:UpgradeKey[]=['capacity','rails','delay','reservation','retime'];
export const UPGRADE_GROUPS:UpgradeKey[][]=[['calm','insulation','soundproof','dispatch'],['battery','concierge','tipjar','crowd','single','punchcard','finale'],['reinforced','express','relay','meter','buffer']];
export function drawUpgradeOffer(upgrades:Record<UpgradeKey,number>,history:UpgradeKey[],rng:()=>number,floor=Infinity) {
  const added:UpgradeKey[]=['rails','insulation','reservation','single','delay','buffer','soundproof','retime','punchcard','finale','dispatch'];
  const pool=(Object.keys(UPGRADES) as UpgradeKey[]).filter(k=>!upgrades[k]&&!RETIRED_UPGRADES.includes(k)&&(!SHOP_RULES.mixed||k!=='crowd'||floor>=20)&&(k!=='delay'||floor>=30)&&(SHOP_RULES.expanded||!added.includes(k)));
  if(!SHOP_RULES.grouped)return {keys:shuffle(pool,rng).slice(0,3),seen:[...history]};
  let seen=history.filter(k=>pool.includes(k));const keys:UpgradeKey[]=[];
  const pick=(candidates:UpgradeKey[])=>{
    if(!candidates.length)return;
    let fresh=candidates.filter(k=>!seen.includes(k));
    if(!fresh.length){seen=seen.filter(k=>!candidates.includes(k));fresh=candidates;}
    const key=shuffle(fresh,rng)[0];keys.push(key);seen.push(key);
  };
  UPGRADE_GROUPS.forEach(group=>pick(pool.filter(k=>group.includes(k))));
  while(keys.length<Math.min(3,pool.length))pick(pool.filter(k=>!keys.includes(k)));
  return {keys:shuffle(keys,rng),seen};
}
/** v9: the first ability of each shop is free; one of the remaining cards may then be bought. */
export const SHOP_PRICES = { extraAbility: 40 };
export const availableShopCards = (state: RunState) => state.shopExtraBought ? [] : state.shop.filter(card => !card.purchased && !state.upgrades[card.key]);

export function failureLesson(state: RunState): string {
  if (state.status !== 'lost') return '';
  if (state.message.includes('炸弹倒计时')) return '疯炸客的怪炸弹归零 · 普通警察锁不住它：让黑警挨着他，或带一把引线剪；来不及送达就拒载。';
  if (state.energy <= 0 && state.stress >= state.stressCap) return '双重失控 · 下一班提前留好维修预算，关门前先处理更接近上限的一项。';
  if (state.message.includes('电量')) {
    const motor = Math.abs(state.lastEnergy.sources.find(s=>s.label==='电梯运转')?.amount ?? 0);
    const people = state.lastEnergy.sources.filter(s=>s.label.endsWith('耗电')).reduce((n,s)=>n+Math.max(0,-s.amount),0);
    const restored = state.lastEnergy.sources.reduce((sum,line)=>sum+Math.max(0,line.amount),0);
    const spent = state.lastEnergy.sources.reduce((sum,line)=>sum+Math.max(0,-line.amount),0);
    const ledger = `电量耗尽 · 本层总扣电 ${spent}（运转 ${motor}、人物与红线 ${people}）；抵消与回电 +${restored}；净变化 ${state.lastEnergy.delta}。`;
    if (state.reserveCell) return ledger+'还有一份未使用的应急电池。关门前可用它补电。';
    // v9.18.4: name the real in-transit cap (10 with full Storage) and say when it was already used up.
    const cap = emergencySectorCap(boxOf(state)), usedUp = emergencySectorLeft(state) <= 0;
    // v9.19.1: past the allowance, overtime charging still sells power; name it when the wallet could have paid.
    const overtime = overtimeChargeOffer({ ...state, status: 'playing', energy: 0 });
    if (usedUp && overtime && state.coins >= overtime.price) return ledger+`本段途中补电已用满，但你还有 ${state.coins} 金币：断电警告里的“加急补电”（这一包 ${overtime.price} 币 / ${overtime.units} 电）能救这一层，下次看到它就买。`;
    if (usedUp) return ledger+`本段途中补电已用满（每十层 ${cap} 电）：离店前要充够到下个商店的电量，配电箱升级别挤掉充电的钱。`;
    if (state.coins >= 8) return ledger+`你带着 ${state.coins} 金币离场：电量告急时可在电量栏“途中补电”，每十层最多 ${cap} 电；用完后断电警告里还有更贵的“加急补电”。`;
    return ledger+'离店时要预留到下个商店的电量；电量栏会显示到店约剩多少。';
  }
  if (state.message.includes('躁动')) {
    // v9.18.4: name every source tied for the top, and give the advice for the most actionable one.
    const positive = state.lastPressure.sources.filter((line) => line.amount > 0).sort((a, b) => b.amount - a.amount);
    if (!positive.length) return '躁动失控 · 下一班优先处理急躁乘客与红色冲突。';
    const top = positive.filter(line => line.amount === positive[0].amount).slice(0, 3);
    const ADVICE: Array<[RegExp, string]> = [
      [/发作/, '深渊里的暗黑版越来越极端：车费更高，但每层都可能发作 +3 躁动（卡上写着几率）。关门前看“失控几率”，赚够了就少带几位；照明弹和镇静剂能压住发作。'],
      [/无人照顾/, '儿童要挨着护士或恋人。'], [/未安抚/, '醉汉要挨着护士。'], [/未受控/, '让警察或律师挨着小偷，被管住的小偷反而每层帮全车 −1。'],
      [/红线/, '把红线两端的人分开，或请离其中一位。'], [/找纸箱|争纸箱/, '快递员要挨着他自己的纸箱，纸箱没上车就别带他。'], [/被围/, '名人只留1位邻座，可避免围观新增躁动。'],
      [/嫌挤/, '大亨最多留1位邻座。'], [/急躁/, '急躁乘客每层 +1，路程越长越亏；后期优先带短途的。'],
      [/夜深人躁/, '夜深人躁是整车压力，护士挡不住：多带短途乘客靠到站舒缓（每位 −1，每层最多 −2），商店里用满安抚额度，手动调节留到最紧的一层。'],
    ];
    const advice = ADVICE.find(([re]) => top.some(line => re.test(line.label)))?.[1] ?? '护士需贴邻抵消新增躁动；音乐家影响整车，高档最多减2，并不保证安全。';
    return `躁动失控 · 最后一层主要来源：${top.map(line => `${line.label} +${line.amount}`).join('、')}。${advice}`;
  }
  return '班次中断 · 下一班留意关门前的电量与躁动预报。';
}

export function previewUpgrade(current: RunState, key: UpgradeKey): RunState {
  if (current.upgrades[key] || Object.values(current.upgrades).filter(Boolean).length >= UPGRADE_SLOTS) return current;
  const upgrades = { ...current.upgrades, [key]: 1 }; const energyCap = current.energyCap + (key === 'capacity' ? CAPACITY_UPGRADE : 0); const energy = current.energy; let stressCap = current.stressCap; let stress = current.stress; const weightCap = current.weightCap;
  if (key === 'calm') { stressCap += 2; if(!SHOP_RULES.optionalCalm)stress = Math.max(0, stress - 2); }
  return { ...current, upgrades, energyCap, energy: Math.min(energyCap, energy), stressCap, stress, weightCap, calmCharge:key==='calm'&&SHOP_RULES.optionalCalm?true:current.calmCharge };
}

/** Retained for archived research only. v9 abilities are a free choice of one per shop. */
export const UPGRADE_BASE_PRICES: Record<UpgradeKey, number> = { battery: 30, capacity: 35, calm: 35, concierge: 40, reinforced: 45, express: 45, tipjar: 30, relay: 30, crowd: 24, meter: 25, rails:24, insulation:24, reservation:20, single:24, delay:24, buffer:8, soundproof:24, retime:24, punchcard:24, finale:24, dispatch:24 };
export const upgradePrice = (_key: UpgradeKey, _floor: number, _installed: number) => 0;
export const REROLL_PRICE = 10;
/** v9.7: sell an installed ability at a shop for a small refund, freeing its slot for a new card. */
export const SELL_REFUND = 15;
export function canSellUpgrade(state: RunState, key: UpgradeKey) {
  return state.status === 'upgrade' && state.upgrades[key] > 0 && !(key === 'calm' && state.stress >= state.stressCap - 2);
}
export function sellUpgrade(state: RunState, key: UpgradeKey): RunState {
  if (!canSellUpgrade(state, key)) return state;
  const upgrades = { ...state.upgrades, [key]: 0 };
  const stressCap = key === 'calm' ? state.stressCap - 2 : state.stressCap;
  return { ...state, upgrades, stressCap, calmCharge: key === 'calm' ? false : state.calmCharge, coins: state.coins + SELL_REFUND,
    message: `卖出${UPGRADES[key].name}，退回 ${SELL_REFUND} 金币；空出一个安装位。`, lastEarnings: { total: SELL_REFUND, sources: [{ label: '卖出能力', amount: SELL_REFUND }] }, lastEnergy: { delta: 0, sources: [] }, lastPressure: { delta: 0, sources: [] } };
}
/** v9.17.2: swap an installed ability for the one found in a box (the old one is sold at the next shop), or pass. */
export function canReplaceWithBoxAbility(state: RunState, key: UpgradeKey) {
  return Boolean(state.pendingAbility) && state.upgrades[key] > 0 && !(key === 'calm' && state.stress >= state.stressCap - 2);
}
export function resolveBoxAbility(state: RunState, replace: UpgradeKey | null): RunState {
  const found = state.pendingAbility; if (!found) return state;
  if (!replace) return { ...state, pendingAbility: undefined, message: `放弃了纸箱里的能力「${UPGRADES[found].name}」。` };
  if (!canReplaceWithBoxAbility(state, replace)) return state;
  const stressCap = replace === 'calm' ? state.stressCap - 2 : state.stressCap;
  const removed = { ...state, upgrades: { ...state.upgrades, [replace]: 0 }, stressCap, calmCharge: replace === 'calm' ? false : state.calmCharge };
  const next = previewUpgrade(removed, found);
  return { ...next, pendingAbility: undefined, pendingSales: [...(state.pendingSales ?? []), replace],
    message: `装上「${UPGRADES[found].name}」，换下的「${UPGRADES[replace].name}」会在下次进商店时卖掉（退 ${SELL_REFUND} 金币）。` };
}
export function rerollShop(current: RunState, rng: () => number = Math.random): RunState {
  if (current.status !== 'upgrade' || current.shopUpgradeBought || current.rerolledFloor === current.floor || current.coins < REROLL_PRICE || !current.shop.length) return current;
  const drawn = drawUpgradeOffer(current.upgrades, current.shopSeen ?? [], rng, current.floor);
  return { ...current, coins: current.coins - REROLL_PRICE, rerolledFloor: current.floor, shopSeen: drawn.seen, shop: drawn.keys.map(key => ({ key, price: 0, purchased: false })), message: `重抽能力，支付 ${REROLL_PRICE} 金币。` };
}
/** v9.19 box ladder: from 60F the power box takes one more level every 20 floors (up to every line maxed);
 * each level past the fifth costs twice the one before. */
/** v9.19 box ladder past the five-level cap: one more level from 60F and every `every` floors after, each costing
 * `priceStep` times the one before (a late-game coin sink, tuned in scripts/balance-sim). */
export const BOX_LADDER = { from: 80, every: 30, priceStep: 3 };
export const boxTotalCap = (floor: number) => Math.min(BOX_MAX_LEVEL * 3, BOX_TOTAL_CAP + (floor >= BOX_LADDER.from ? 1 + Math.floor((floor - BOX_LADDER.from) / BOX_LADDER.every) : 0));
export const boxLevelPrice = (state: RunState, line: BoxLine) => (state.freeBoxLevels ?? 0) > 0 ? 0 : ((BOX_PRICES[boxOf(state)[line]] ?? Infinity) - (hasKeepsake(state,'wrench') ? LEGEND_RULES.wrenchDiscount : 0)) * BOX_LADDER.priceStep ** Math.max(0, boxTotal(boxOf(state)) - BOX_TOTAL_CAP + 1);
export function canBuyBoxLevel(state: RunState, line: BoxLine) {
  const box = boxOf(state), free = (state.freeBoxLevels ?? 0) > 0;
  return state.status === 'upgrade' && box[line] < BOX_MAX_LEVEL && boxTotal(box) < boxTotalCap(state.floor) && (free || state.boxBoughtFloor !== state.floor) && state.coins >= boxLevelPrice(state, line);
}
export function buyBoxLevel(current: RunState, line: BoxLine): RunState {
  if (!canBuyBoxLevel(current, line)) return current;
  const free = (current.freeBoxLevels ?? 0) > 0, price = boxLevelPrice(current, line);
  const box = { ...boxOf(current), [line]: boxOf(current)[line] + 1 };
  const energyCap = storageCap(box);
  return { ...current, box, energyCap, coins: current.coins - price, freeBoxLevels: free ? (current.freeBoxLevels ?? 1) - 1 : current.freeBoxLevels, boxBoughtFloor: free ? current.boxBoughtFloor : current.floor,
    message: free ? '老周的扳手：配电箱免费升级。' : `配电箱升级，支付 ${price} 金币。`, log: [`${current.floor}F · 配电箱升级 −${price} 金币`, ...current.log].slice(0, 4) };
}
/** Emergency power still allowed this sector, ignoring the wallet. */
export function emergencySectorLeft(state: RunState) {
  const used = state.emergencySector === sectorOf(state.floor) ? state.emergencyUsed ?? 0 : 0;
  return Math.max(0, emergencySectorCap(boxOf(state)) - used);
}
export function emergencyAllowance(state: RunState) {
  const used = state.emergencySector === sectorOf(state.floor) ? state.emergencyUsed ?? 0 : 0;
  return Math.max(0, Math.min(emergencySectorCap(boxOf(state)) - used, state.energyCap - state.energy, Math.floor(state.coins / emergencyUnitPrice(boxOf(state)))));
}
/** In-transit calming (v9.5): pay coins before departure to lower agitation, capped per ten floors. 0 per sector disables. */
/** Inspector stamp condition: v9.7 counts medium agitation too (research switch for the balance simulator). */
export const INSPECTION_RULE = { allowMedium: true, work: INSPECTION_WORK };
export const CALM_PURCHASE = { price: 8, perSector: 6, base: 6, perTen: 2 };
/** Calming price: flat `price`, or when `base` is set, base + perTen per ten floors (the late night costs more). */
export const calmPrice = (floor: number) => CALM_PURCHASE.base ? CALM_PURCHASE.base + CALM_PURCHASE.perTen * Math.floor(floor / 10) : CALM_PURCHASE.price;
export function calmAllowance(state: RunState) {
  if ((state.status !== 'playing' && state.status !== 'upgrade') || !CALM_PURCHASE.perSector) return 0;
  const used = state.calmSector === sectorOf(state.floor) ? state.calmUsed ?? 0 : 0;
  return Math.max(0, Math.min(CALM_PURCHASE.perSector - used, state.stress, Math.floor(state.coins / calmPrice(state.floor))));
}
export function buyCalm(state: RunState, units: number): RunState {
  if (!Number.isSafeInteger(units) || units <= 0 || units > calmAllowance(state)) return state;
  const sector = sectorOf(state.floor), used = state.calmSector === sector ? state.calmUsed ?? 0 : 0, cost = units * calmPrice(state.floor);
  return { ...state, stress: state.stress - units, coins: state.coins - cost, calmSector: sector, calmUsed: used + units, message: `途中安抚 −${units} 躁动，支付 ${cost} 金币。`,
    lastEarnings: { total: 0, sources: [] }, lastEnergy: { delta: 0, sources: [] }, lastPressure: { delta: -units, sources: [{ label: '途中安抚', amount: -units }] } };
}
/** v9.18.4 coin sink: once a sector's calming allowance is spent, each extra point costs 2×, 3×, 4× … the calming price.
 * Late runs piled up hundreds of unusable coins while late-night unrest outran the allowance; this spends them at a rising rate. */
export const OVERTIME_CALM = { firstMultiplier: 2, step: 1 };
export function overtimeCalmPrice(state: RunState): number | null {
  if ((state.status !== 'playing' && state.status !== 'upgrade') || !CALM_PURCHASE.perSector || state.stress <= 0) return null;
  const used = state.calmSector === sectorOf(state.floor) ? state.calmUsed ?? 0 : 0;
  if (used < CALM_PURCHASE.perSector) return null;
  return calmPrice(state.floor) * (OVERTIME_CALM.firstMultiplier + OVERTIME_CALM.step * (used - CALM_PURCHASE.perSector));
}
export function buyOvertimeCalm(state: RunState): RunState {
  const price = overtimeCalmPrice(state);
  if (price === null || state.coins < price) return state;
  const used = state.calmSector === sectorOf(state.floor) ? state.calmUsed ?? 0 : 0;
  return { ...state, stress: state.stress - 1, coins: state.coins - price, calmSector: sectorOf(state.floor), calmUsed: used + 1, message: `加急安抚 −1 躁动，支付 ${price} 金币；下一点更贵。`,
    lastEarnings: { total: 0, sources: [] }, lastEnergy: { delta: 0, sources: [] }, lastPressure: { delta: -1, sources: [{ label: '加急安抚', amount: -1 }] } };
}
/** Paid mid-sector charging before departure: double the shop price, capped per sector. */
export function emergencyCharge(state: RunState, units: number): RunState {
  if (state.status !== 'playing' || !Number.isSafeInteger(units) || units <= 0 || units > emergencyAllowance(state)) return state;
  const sector = sectorOf(state.floor), used = state.emergencySector === sector ? state.emergencyUsed ?? 0 : 0;
  const cost = units * emergencyUnitPrice(boxOf(state));
  return { ...state, energy: state.energy + units, coins: state.coins - cost, emergencySector: sector, emergencyUsed: used + units, message: `途中补电 +${units}，支付 ${cost} 金币。`,
    lastEarnings: { total: 0, sources: [] }, lastPressure: { delta: 0, sources: [] }, lastEnergy: { delta: units, sources: [{ label: '途中补电', amount: units }] } };
}
/** v9.19 overtime charging: once a sector's in-transit allowance is spent, power is still for sale in packs, each pack's
 * unit price `firstMultiplier`, then +`step` … times the in-transit price (the same rising sink as overtime calming). */
export const OVERTIME_CHARGE = { pack: 5, firstMultiplier: 3, step: 2 };
export function overtimeChargeOffer(state: RunState): { units: number; price: number } | null {
  if (state.status !== 'playing' || state.energy >= state.energyCap) return null;
  const cap = emergencySectorCap(boxOf(state)), used = state.emergencySector === sectorOf(state.floor) ? state.emergencyUsed ?? 0 : 0;
  if (used < cap) return null;
  const packs = Math.floor((used - cap) / OVERTIME_CHARGE.pack), units = Math.min(OVERTIME_CHARGE.pack, state.energyCap - state.energy);
  return { units, price: units * emergencyUnitPrice(boxOf(state)) * (OVERTIME_CHARGE.firstMultiplier + OVERTIME_CHARGE.step * packs) };
}
export function buyOvertimeCharge(state: RunState): RunState {
  const offer = overtimeChargeOffer(state);
  if (!offer || state.coins < offer.price) return state;
  const used = state.emergencySector === sectorOf(state.floor) ? state.emergencyUsed ?? 0 : 0;
  return { ...state, energy: state.energy + offer.units, coins: state.coins - offer.price, emergencySector: sectorOf(state.floor), emergencyUsed: used + OVERTIME_CHARGE.pack,
    message: `加急补电 +${offer.units}，支付 ${offer.price} 金币；下一包更贵。`,
    lastEarnings: { total: 0, sources: [] }, lastPressure: { delta: 0, sources: [] }, lastEnergy: { delta: offer.units, sources: [{ label: '加急补电', amount: offer.units }] } };
}
/** v9.19 ability level 2 (see ABILITY_LEVEL2): with every slot full, one installed ability per shop can be raised. */
export const abilityLevel2Price = (state: RunState) => ABILITY_LEVEL2.price + ABILITY_LEVEL2.step * Object.values(state.upgrades).filter(v => v >= 2).length;
export function canRaiseAbility(state: RunState, key: UpgradeKey): boolean {
  return state.status === 'upgrade' && state.upgrades[key] === 1 && ABILITY_LEVEL2.keys.includes(key) && Object.values(state.upgrades).filter(Boolean).length >= UPGRADE_SLOTS
    && state.abilityRaisedFloor !== state.floor && state.coins >= abilityLevel2Price(state);
}
export function raiseAbility(state: RunState, key: UpgradeKey): RunState {
  if (!canRaiseAbility(state, key)) return state;
  const price = abilityLevel2Price(state);
  return { ...state, upgrades: { ...state.upgrades, [key]: 2 }, coins: state.coins - price, abilityRaisedFloor: state.floor,
    message: `「${UPGRADES[key].name}」升到 2 级，支付 ${price} 金币。`, log: [`${state.floor}F · 「${UPGRADES[key].name}」2级 −${price} 金币`, ...state.log].slice(0, 4) };
}
export function installUpgrade(current: RunState, key: UpgradeKey): RunState {
  const card = current.shop.find((item) => item.key === key);
  const price = current.shopUpgradeBought ? SHOP_PRICES.extraAbility : 0;
  if (current.status !== 'upgrade' || current.shopExtraBought || !card || card.purchased || current.coins < price || current.upgrades[key] > 0 || Object.values(current.upgrades).filter(Boolean).length >= UPGRADE_SLOTS) return current;
  const preview = previewUpgrade(current, key);
  const extra = current.shopUpgradeBought;
  const shop = extra ? [] : current.shop.map(item => item.key === key ? { ...item, purchased: true } : { ...item, price: SHOP_PRICES.extraAbility });
  return { ...preview, coins: current.coins - price, shopUpgradeBought: true, shopExtraBought: extra, shop,
    message: extra ? `${UPGRADES[key].name}已加购，花费 ${price} 金币。` : `${UPGRADES[key].name}已选取（本店免费一项）。`,
    lastEarnings: { total: 0, sources: [] }, lastPressure: { delta: 0, sources: [] }, lastEnergy: { delta: 0, sources: [] },
    log: [`${current.floor}F · ${extra ? `加购${UPGRADES[key].name} −${price} 金币` : `选取${UPGRADES[key].name}`}`, ...current.log].slice(0, 4) };
}

export function leaveShop(current: RunState): RunState {
  if (current.status !== 'upgrade') return current;
  const failed = current.energy <= 0 || current.stress >= current.stressCap;
  return { ...current, shop: [], status: failed ? 'lost' : 'playing', message: current.energy <= 0 ? '金币或维修不足，电量未能恢复。' : current.stress >= current.stressCap ? '维修后躁动仍然失控，班次结束。' : '商店已关门，继续上行。' };
}

export const CHARGE_PRICE = 2;
export const SOOTHE_PRICE = 8;
export function sootheAgitation(state: RunState, units: number): RunState {
  // Emergency-only: a shop cannot tune an otherwise safe agitation band.
  if (state.status !== 'upgrade' || state.stress < state.stressCap || units !== state.stress - state.stressCap + 1 || !Number.isSafeInteger(units) || state.coins < units * SOOTHE_PRICE) return state;
  const cost = units * SOOTHE_PRICE;
  return { ...state, stress: state.stress - units, coins: state.coins - cost,
    message: `商店舒缓 −${units} 躁动，支付 ${cost} 金币。`,
    lastEarnings: { total: 0, sources: [] }, lastEnergy: { delta: 0, sources: [] },
    lastPressure: { delta: -units, sources: [{ label: '商店舒缓', amount: -units }] },
    log: [`${state.floor}F · 商店舒缓 −${cost} 金币`, ...state.log].slice(0, 4) };
}
export function chargingPlan(state: RunState) {
  const target = Math.min(state.energyCap, 50);
  const units = Math.max(0, target - state.energy);
  return {target,units,cost:chargeCost(boxOf(state),units,state.floor),baseline:(nextShopFloor(state.floor)-state.floor)*travelEnergyCost(state.floor+1)};
}
export function affordableChargingPlan(state: RunState) {
  const units=Math.max(0,Math.min(state.energyCap-state.energy,affordableUnits(boxOf(state),state.coins,state.floor)));
  return {units,cost:chargeCost(boxOf(state),units,state.floor),target:state.energy+units};
}
export function purchaseRepairWarning(state: RunState, key: UpgradeKey, price: number) {
  if (state.coins < price) return null;
  const after = previewUpgrade(state, key), remaining = state.coins - price;
  if (remaining < emergencyRepairPlan(after).cost) return 'crisis';
  if (remaining < chargingPlan(after).cost) return 'reference';
  return null;
}
export function chargeBattery(state: RunState, units: number): RunState {
  const cost=chargeCost(boxOf(state),units,state.floor);
  if(state.status!=='upgrade'||!Number.isSafeInteger(units)||units<=0||state.energy+units>state.energyCap||state.coins<cost)return state;
  return {...state,energy:state.energy+units,coins:state.coins-cost,message:`充电 +${units}，支付 ${cost} 金币。`,lastEarnings:{total:0,sources:[]},lastEnergy:{delta:units,sources:[{label:'商店充电',amount:units}]},log:[`${state.floor}F · 充电 −${cost} 金币`,...state.log].slice(0,4)};
}
export function buyReserveCell(state: RunState): RunState {
  if (state.status !== 'upgrade' || state.reserveCell || state.coins < RESERVE_CELL_PRICE) return state;
  return {...state,reserveCell:true,coins:state.coins-RESERVE_CELL_PRICE,message:`应急电池已备好，支付${RESERVE_CELL_PRICE}金币；关门前可补${RESERVE_CELL_CHARGE}电。`,lastEarnings:{total:0,sources:[]},lastEnergy:{delta:0,sources:[]},lastPressure:{delta:0,sources:[]}};
}
export function consumeReserveCell(state: RunState): RunState {
  if (state.status !== 'playing' || !state.reserveCell || state.energy >= state.energyCap) return state;
  const charge = Math.min(RESERVE_CELL_CHARGE,state.energyCap-state.energy);
  return {...state,reserveCell:false,energy:state.energy+charge,message:`应急电池补充${charge}电。`,lastEarnings:{total:0,sources:[]},lastEnergy:{delta:charge,sources:[{label:'应急电池',amount:charge}]},lastPressure:{delta:0,sources:[]}};
}
// Compatibility for earlier research records; this is a pure action, not a React hook.
export { consumeReserveCell as useReserveCell };
// Compatibility for the current UI; new callers use applyCalmCharge (not a React hook).
export { applyCalmCharge as useCalmCharge };
export const dismissalsRemaining = (state: RunState) => Math.max(0, DISMISSALS_PER_SECTOR - (state.dismissalsUsed ?? 0));
export const dismissalCost=(state: RunState,rider:Rider)=>rider.kind==='kingpin'?DARK_LEGEND_RULES.kingpinDismissal:isAnyLegend(rider.kind)?0:4+Math.max(0,rider.destination-state.floor)*2;
export function dismissRider(state: RunState, id: string): RunState {
  const slot=state.cabin.findIndex(r=>r?.id===id),rider=state.cabin[slot];
  if(state.status!=='playing'||!rider||rider.boardedAt>=state.floor||rider.destination<=state.floor)return state;
  const cost=dismissalCost(state,rider);
  if(state.coins<cost || (!isAnyLegend(rider.kind) && dismissalsRemaining(state) <= 0))return state;
  const message=`已请离${PASSENGERS[rider.kind].name}，赔偿 ${cost} 金币；不结算到站收益。`;
  return {...state,legendStatus:isLegend(rider.kind)?'dismissed':state.legendStatus,coins:state.coins-cost,dismissalsUsed:(state.dismissalsUsed ?? 0)+(isAnyLegend(rider.kind)?0:1),cabin:unseatRider(state.cabin,rider.id,true),message,log:[`${state.floor}F · ${message}`,...state.log].slice(0,4),lastEarnings:{total:0,sources:[]},lastEnergy:{delta:0,sources:[]},lastPressure:{delta:0,sources:[]}};
}
export function installedUpgradeSummary(state: RunState,key:UpgradeKey) {
 const count=state.upgrades[key];
 if(!count)return '未安装';
 switch(key){
  // v9.17.2: live values only where they change; otherwise the ability's own (translated, current) description.
  // The old Stabilizer line said "at least 3 riders" after the rule became 5.
  case 'battery':return `🎉🎲 每级绿线每层 +${cooperationBonus(state) - 1} 金币`;
  case 'calm':return `躁动上限 ${state.stressCap} · ${state.calmCharge?'手动调节可用（−3 躁动）':'手动调节已用，下个商店补满'}`;
  default:return count>=2&&LEVEL2_TEXT[key]?`2级：${LEVEL2_TEXT[key]![0]}`:UPGRADES[key].description;
 }
}

/** Exact arrival payout at this seating arrangement. UI must mask hidden fares. */
export const arrivalTip = (rider: Rider, agitation: number) => ECONOMY_RULES.conciergeCondition === 'any' || agitationBand(agitation) === ECONOMY_RULES.conciergeCondition ? rider.fareBonus : 0;
/** v9.18.2 itemised arrival fare: the exact lines settlement pays, so the rider sheet can show the arithmetic. */
export type FareLine = { label: string; amount: number };
export function fareBreakdown(rider: Rider, cabin: Array<Rider | null>, slot: number, bonus = 1, agitation = 0, tuning: FareTuning = {}, bellFare = false): FareLine[] {
  if (rider.kind === 'parcel') return [{ label: '纸箱本身不付钱', amount: 0 }];
  const lines: FareLine[] = [], add = (label: string, amount: number) => { if (amount) lines.push({ label, amount }); };
  // v9.19: a Scandal next to an Inspector or a Crooked Cop is exposed on arrival: nothing is paid.
  if (rider.kind === 'scandal' && hasNeighbour(cabin, slot, ['inspector', 'crookedcop'])) return [{ label: '丑闻曝光：车费归零', amount: 0 }];
  if (isCarrierKind(rider.kind) && rider.parcelId) {
    const links = parcelLinks(cabin), carried = (links.served.get(slot) ?? []).map(p => cabin[p]!);
    if (!carried.length && !links.bombs.has(slot)) return [{ label: rider.kind === 'smuggler' ? '身边没有黑箱：不付钱' : '身边没有纸箱：不付钱', amount: 0 }];
    if (carried.length && rider.kind === 'smuggler') add('黑箱送货费（箱价×2）', DARK_RULES.smugglerBoxMultiplier * Math.max(...carried.map(boxCoins)));
    if (carried.length && rider.kind === 'smuggler' && carried.some(p => neighbours(cabin.indexOf(p)).some(i => cabin[i]?.kind === 'grafter'))) add('贪腐检查员放行', DARK_RULES.bribe);
    if (carried.length && rider.kind === 'courier') add('纸箱送货费', Math.max(...carried.map(boxCoins)) - PARCEL_RULES.values.small.common);
    if (carried.length && rider.routeStops) add(`长途送货 ${rider.routeStops} 站`, PARCEL_RULES.stopFee * Math.max(0, rider.routeStops - PARCEL_RULES.freeStops));
    if (carried.some(p => p.inspected)) add('检查员验货', PARCEL_RULES.inspectCoins);
  }
  const baseFare = riderProfile(rider, cabin, slot).fare;
  lines.unshift({ label: '基础车费', amount: baseFare });
  let fare = baseFare;
  if (rider.kind === 'lover') { const pairs = neighbours(slot).filter(i => cabin[i]?.kind === 'lover').length; add(`恋人配对 ×${1 + pairs}`, fare * pairs); fare *= 1 + pairs; }
  if (rider.kind === 'thief' && thiefHeld(cabin, slot)) { add('受控到站奖励', 5); fare += 5; }
  if (rider.kind === 'robber' && thiefHeld(cabin, slot)) { add('劫匪赏金', DARK_RULES.robberBounty); fare += DARK_RULES.robberBounty; }
  if (rider.kind === 'ghost' && (bellFare || hasNeighbour(cabin, slot, GHOST_CONTROL_KINDS))) { add('受控幽灵', 2); fare += 2; }
  if ((rider.kind === 'ghost' || rider.kind === 'wraith') && hasNeighbour(cabin, slot, ['summoner'])) { add('召魂人加持', baseFare * DARK_RULES.summonFareBonus); fare += baseFare * DARK_RULES.summonFareBonus; }
  if (rider.kind === 'exlover' && cabin.some((r, i) => r?.kind === 'exlover' && i !== slot && !neighbours(slot).includes(i))) { add('怨偶分开坐', baseFare * DARK_RULES.exFareBonus); fare += baseFare * DARK_RULES.exFareBonus; }
  if (rider.kind === 'brawler' && agitationBand(agitation) === 'high') { add('狂徒高躁动加价', baseFare * DARK_RULES.brawlerHighBonus); fare += baseFare * DARK_RULES.brawlerHighBonus; }
  if (rider.kind === 'creepychild' && neighbourCount(cabin, slot) === 0) { add('怪童独处', DARK_RULES.creepyAloneBonus); fare += DARK_RULES.creepyAloneBonus; }
  if (rider.kind === 'ghost' && bellFare) { add('招魂铃', 3); fare += 3; }
  const gamble = conflictLinks(cabin).filter(link => link.effect === 'gamble' && (link.first === slot || link.second === slot)).length;
  const coaches = neighbours(slot).filter(i => cabin[i]?.kind === 'coach').length;
  const taskmasters = rider.kind === 'taskmaster' ? 0 : neighbours(slot).filter(i => cabin[i]?.kind === 'taskmaster').length;
  const appetite = agitationAppetite(rider, cabin, slot, agitation, tuning);
  const multiplier = gamble + (rider.kind === 'coach' ? 0 : .5 * coaches + appetite) + DARK_RULES.taskmasterFareBonus * taskmasters;
  const multiplied = FARE_RULES.baseOnlyMultipliers ? fare + Math.ceil(baseFare * multiplier) : Math.ceil(fare * (1 + multiplier));
  if (multiplied !== fare) add([gamble ? `赌局红线 ×${gamble}` : '', rider.kind !== 'coach' && coaches ? `教练邻座 ${coaches} 位（+${coaches * 50}%）` : '', taskmasters ? `监工邻座 ${taskmasters} 位（+${taskmasters * 100}%）` : '', rider.kind !== 'coach' && appetite ? '高躁动加价' : ''].filter(Boolean).join(' · '), multiplied - fare);
  if (rider.kind === 'coach') add(`教练：邻座 ${neighbourCount(cabin, slot)} 位`, neighbourCount(cabin, slot) * FARE_RULES.coachNeighbour);
  if (rider.kind === 'tourist') { const n = neighbourCount(cabin, slot); add(`游客：邻座 ${n} 位 × 2`, n * 2); add('夜莺相邻', Number(hasNeighbour(cabin, slot, ['nightingale'])) * 2); if (neighbours(slot).some(i => cabin[i]?.kind === 'parcel')) lines.push({ label: '纸箱不算邻座', amount: 0 }); }
  if (!isAnyLegend(rider.kind) && hasNeighbour(cabin, slot, ['matchmaker'])) add('月老相邻', LEGEND_RULES.matchmakerNeighbourCoins);
  if (rider.kind === 'commuter' && agitationBand(agitation) === 'low') add('低躁动到站', COMMUTER_QUIET_BONUS);
  if (rider.kind === 'tourist' && agitationBand(agitation) === 'medium') add('中躁动到站', TOURIST_MEDIUM_BONUS);
  if (rider.kind === 'inspector' && rider.complianceReady) add('合规印章', INSPECTION_BONUS);
  if (rider.kind === 'child' && (rider.careProgress ?? 0) >= CHILD_CARE_WORK) add('照顾完成', CHILD_CARE_BONUS);
  add('礼宾小费', arrivalTip(rider, agitation));
  add('急躁加价', rider.volatile ? RISK_RULES.highRiskBonus : 0);
  // v9.20.1: a dark card drawn in the abyss pays more the deeper it was drawn.
  add('深渊加价', rider.extreme && isDark(rider.kind) ? Math.round(PASSENGERS[rider.kind].fare * DARK_RULES.extremeFarePerStep * rider.extreme) : 0);
  add('悬赏', rider.bounty ?? 0);
  add(stashLabel(rider.kind), rider.stash ?? 0);
  // v10: links pay every floor (symbolCoins), not on arrival; `bonus` is kept for callers' signatures.
  void bonus;
  return lines;
}
export function arrivalFare(rider: Rider, cabin: Array<Rider | null>, slot: number, bonus = 1, agitation = 0, tuning: FareTuning = {}, bellFare = false) {
  return fareBreakdown(rider, cabin, slot, bonus, agitation, tuning, bellFare).reduce((n, l) => n + l.amount, 0);
}

export function agitationAppetite(rider: Rider, cabin: Array<Rider | null>, slot: number, agitation: number, tuning: FareTuning = {}) {
  return rider.kind === 'drunk' && agitation >= (tuning.appetiteThreshold ?? DRUNK_APPETITE_THRESHOLD)
    && neighbourCount(cabin, slot) >= (tuning.appetiteNeighbours ?? DRUNK_APPETITE_NEIGHBOURS)
    ? tuning.appetiteBonus ?? DRUNK_APPETITE_BONUS : 0;
}

/** Minimum repairs required to leave a shop alive, never a full refill. */
export function emergencyRepairPlan(state: RunState) {
  const energy = Math.max(0, 1 - state.energy);
  const stress = Math.max(0, state.stress - state.stressCap + 1);
  const cost = chargeCost(boxOf(state), energy, state.floor) + stress * SOOTHE_PRICE;
  return { energy, stress, cost, affordable: state.coins >= cost };
}
export function repairEmergency(state: RunState): RunState {
  const plan = emergencyRepairPlan(state);
  if (state.status !== 'upgrade' || !plan.affordable || !plan.cost) return state;
  let next = plan.energy ? chargeBattery(state, plan.energy) : state;
  if (plan.stress) next = sootheAgitation(next, plan.stress);
  return next;
}

// ---------------------------------------------------------------------------------------------------------------
// v9.19 items: a four-slot bag of one-use tools. Shops stock three at a time; each purchase of the same item costs more.
/** Three different items available from this floor, drawn on the shop's stream. */
export function drawItemStock(floor: number, rng: () => number, bought: RunState['itemBought'] = {}): NonNullable<RunState['itemStock']> {
  const pool = SHOP_ITEM_KEYS.filter(k => ITEMS[k].from <= floor);
  const picked: ItemKey[] = [];
  const draw = (from: ItemKey[]) => { const rest = from.filter(k => !picked.includes(k)); if (rest.length) picked.push(rest[Math.min(rest.length - 1, Math.floor(rng() * rest.length))]); };
  // v9.19.1: from the midnight shop on, at least two of the three are tools against the dark riders.
  const midnight = pool.filter(k => ITEMS[k].from >= DARK_RULES.midnightFloor);
  // v9.20: in the abyss (80F on) a Flare is always on the shelf: the one tool that quiets every dark rider for a floor.
  if (floor >= DARK_RULES.extremeFrom && pool.includes('flare')) picked.push('flare');
  if (midnight.length >= 2) { draw(midnight); draw(midnight); }
  while (picked.length < 3 && picked.length < pool.length) draw(pool);
  return picked.map(key => ({ key, price: itemPrice(key, floor, bought?.[key] ?? 0), sold: false }));
}
/** v9.21.1 the Night market's shelf: two of the four night-market goods (sold nowhere else, dearer) and one shop item. */
export function drawMarketStock(floor: number, rng: () => number, bought: RunState['itemBought'] = {}): NonNullable<RunState['marketStock']> {
  const goods = [...MARKET_ITEM_KEYS], picked: ItemKey[] = [];
  for (let i = 0; i < MARKET_STOCK.goods && goods.length; i++) picked.push(goods.splice(Math.min(goods.length - 1, Math.floor(rng() * goods.length)), 1)[0]);
  const shelf = SHOP_ITEM_KEYS.filter(k => ITEMS[k].from >= DARK_RULES.midnightFloor && ITEMS[k].from <= floor);
  for (let i = 0; i < MARKET_STOCK.shopItems && shelf.length; i++) picked.push(shelf.splice(Math.min(shelf.length - 1, Math.floor(rng() * shelf.length)), 1)[0]);
  return picked.map(key => ({ key, price: itemPrice(key, floor, bought?.[key] ?? 0), sold: false }));
}
export function buyItem(state: RunState, index: number): RunState {
  const card = state.itemStock?.[index];
  if (state.status !== 'upgrade' || !card || card.sold || state.coins < card.price || (state.items?.length ?? 0) >= ITEM_SLOTS) return state;
  const bought = { ...state.itemBought, [card.key]: (state.itemBought?.[card.key] ?? 0) + 1 };
  return { ...state, coins: state.coins - card.price, items: [...(state.items ?? []), card.key], itemBought: bought,
    itemStock: state.itemStock!.map((c, i) => i === index ? { ...c, sold: true } : c),
    message: `买下${ITEMS[card.key].name}，支付 ${card.price} 金币。`, log: [`${state.floor}F · 买下${ITEMS[card.key].name} −${card.price} 金币`, ...state.log].slice(0, 4) };
}
/** v9.21 the night market: buy one of its items on its floor, at shop prices (each repeat still costs more). */
export function buyMarketItem(state: RunState, index: number): RunState {
  const card = state.marketStock?.[index];
  if (state.status !== 'playing' || state.marketFloor !== state.floor || !card || card.sold || state.coins < card.price || (state.items?.length ?? 0) >= ITEM_SLOTS) return state;
  const bought = { ...state.itemBought, [card.key]: (state.itemBought?.[card.key] ?? 0) + 1 };
  return { ...state, coins: state.coins - card.price, items: [...(state.items ?? []), card.key], itemBought: bought,
    marketStock: state.marketStock!.map((c, i) => i === index ? { ...c, sold: true } : c),
    message: `在夜市买下${ITEMS[card.key].name}，支付 ${card.price} 金币。`, log: [`${state.floor}F · 夜市买下${ITEMS[card.key].name} −${card.price} 金币`, ...state.log].slice(0, 4) };
}
/** Whether an item can be used now, optionally on this rider. */
export function itemUsable(state: RunState, key: ItemKey, target?: Rider | null): boolean {
  if (state.status !== 'playing' || !state.items?.includes(key)) return false;
  const need = ITEMS[key].target;
  if (need === 'none') {
    if (key === 'flare' || key === 'longflare') return !flareCovers(state);
    if (key === 'greatamulet') return state.cabin.some(r => r && corruptible(r.kind) && !r.warded);
    return true;
  }
  if (!target || !state.cabin.some(r => r?.id === target.id)) return false;
  switch (need) {
    case 'rider': return target.kind !== 'parcel' && (key !== 'dismiss' || !isAnyLegend(target.kind));
    case 'dark': return isDark(target.kind);
    case 'normal': return corruptible(target.kind) && !target.warded;
    case 'thief': return (target.kind === 'thief' || target.kind === 'robber') && !target.cuffed;
    case 'overtimer': return target.kind === 'overtimer' && !target.alarm;
    case 'child': return target.kind === 'child' && (target.careProgress ?? 0) < CHILD_CARE_WORK;
    case 'bomb': return isBombKind(target.kind) && target.bombMs !== undefined;
    case 'parcel': return target.kind === 'parcel' && !target.sealed;
  }
  return false;
}
export function applyItem(state: RunState, key: ItemKey, targetId?: string): RunState {
  const target = targetId ? state.cabin.find(r => r?.id === targetId) ?? null : null;
  if (!itemUsable(state, key, target)) return state;
  const items = [...state.items!]; items.splice(items.indexOf(key), 1);
  const spec = ITEMS[key], done = (next: Partial<RunState>, message: string): RunState => ({ ...state, ...next, items, message, log: [`${state.floor}F · ${message}`, ...state.log].slice(0, 4) });
  const patch = (fn: (r: Rider) => Rider) => state.cabin.map(r => r && r.id === target!.id ? fn(r) : r);
  const name = target ? PASSENGERS[target.kind].name : '';
  switch (key) {
    case 'cell': return done({ energy: Math.min(state.energyCap, state.energy + 15) }, `用了${spec.name}：+${Math.min(15, state.energyCap - state.energy)} 电。`);
    case 'swap': return done({ oldMovesUsed: Math.max(0, (state.oldMovesUsed ?? Number(state.swapped)) - 1), swapped: false }, `用了${spec.name}：本层多一次老乘客换位。`);
    case 'aroma': return done({ stress: Math.max(0, state.stress - 2) }, `用了${spec.name}：躁动 −${Math.min(2, state.stress)}。`);
    case 'flare': return done({ flareFloor: state.floor, flareUntil: state.floor }, `点燃${spec.name}：这一层所有暗黑版都不会惹麻烦。`);
    case 'longflare': return done({ flareFloor: state.floor, flareUntil: state.floor + 1 }, `点燃${spec.name}：这一层和下一层所有暗黑版都不会惹麻烦。`);
    case 'sandalwood': return done({ stress: Math.max(0, state.stress - 5) }, `用了${spec.name}：躁动 −${Math.min(5, state.stress)}。`);
    case 'greatamulet': { const cabin = state.cabin.map(r => r && corruptible(r.kind) && !r.warded ? { ...r, warded: true, corruption: 0 } : r); return done({ cabin }, `挂上${spec.name}：车里 ${cabin.filter((r, i) => r?.warded && !state.cabin[i]?.warded).length} 位普通人这一趟不会被同化。`); }
    case 'strongsedative': return done({ cabin: patch(r => ({ ...r, sedated: Math.max(1, r.destination - state.floor), withdrawal: 0 })) }, `给${name}用了${spec.name}：直到下车都不产生躁动。`);
    case 'dismiss': return done({ cabin: unseatRider(state.cabin, target!.id, true), legendStatus: isLegend(target!.kind) ? 'dismissed' : state.legendStatus }, `用了${spec.name}：${name}免费下车。`);
    case 'candy': return done({ cabin: patch(r => ({ ...r, careProgress: CHILD_CARE_WORK })) }, `给了儿童${spec.name}：算作照顾满。`);
    case 'fuse': return done({ cabin: patch(r => ({ ...r, bombMs: (r.bombMs ?? 0) + 20000, bombMsTotal: (r.bombMsTotal ?? r.bombMs ?? 0) + 20000, bonusMs: (r.bonusMs ?? r.bombMs ?? 0) + 20000, fuse: (r.fuse ?? 0) + 2 })) }, `用了${spec.name}：${name}的炸弹 +20 秒。`);
    case 'holywater': {
      const to = BASE_OF[target!.kind as keyof typeof BASE_OF];
      // v9.20.6 (English playtest 21): purified “for this trip” means it stays purified; dark neighbours used to turn him back in 2 floors.
      const cabin = patch(r => ({ ...turnRider(r, to), warded: true, corruption: 0, bombMs: r.kind === 'madbomber' && r.bombMs !== undefined ? Math.ceil(r.bombMs / DARK_RULES.madbomberSeconds) : r.bombMs }));
      return done({ cabin: cabin.map(r => r?.kind === 'parcel' && r.ownerId === target!.id ? { ...r, contraband: false } : r), lastCorruption: [{ slot: state.cabin.findIndex(r => r?.id === target!.id), from: target!.kind, to }] }, `用了${spec.name}：${name}变回了${PASSENGERS[to].name}。`);
    }
    case 'cuffs': return done({ cabin: patch(r => ({ ...r, cuffed: true })) }, `给${name}戴上${spec.name}：整段路程被管住。`);
    case 'amulet': return done({ cabin: patch(r => ({ ...r, warded: true, corruption: 0 })) }, `给${name}戴上${spec.name}：这一趟不会被同化。`);
    case 'alarm': return done({ cabin: patch(r => ({ ...r, alarm: true })) }, `给加班魂上了${spec.name}：到站就下车。`);
    case 'sedative': return done({ cabin: patch(r => ({ ...r, sedated: 3, withdrawal: 0 })) }, `给${name}用了${spec.name}：3 层内不产生躁动。`);
    case 'seal': { const box = boxIdOf(target!); return done({ cabin: state.cabin.map(r => r?.kind === 'parcel' && boxIdOf(r) === box ? { ...r, sealed: true } : r) }, `给${target!.contraband ? '黑箱' : '纸箱'}贴上${spec.name}。`); }
    case 'cutter': {
      const slot = state.cabin.findIndex(r => r?.id === target!.id);
      const fare = arrivalFare(target!, state.cabin, slot, cooperationBonus(state), state.stress, {}, hasKeepsake(state, 'bell'));
      return done({ cabin: unseatRider(state.cabin, target!.id), coins: state.coins + fare, earned: state.earned + fare }, `用${spec.name}拆掉了炸弹：${name}下车，付了 ${fare} 金币。`);
    }
  }
}
