import { BONDS, bondStatus, conflictLinks, profileWeight, randomTraits, riderProfile, type VariableTraits } from './rider-profile';
import { AGITATION_RULES, ECONOMY_RULES, FARE_RULES, GHOST_RULES, JOURNEY_RULES, journeyExtension } from './balance-v832';
import { ADJACENT, PASSENGERS, UNLOCK_TIERS, UPGRADES, type PassengerKind, type UpgradeKey } from './game-data';
import { agitationBand, AGITATION_HIGH_MIN, musicBeatForAgitation, BASE_AGITATION_CAP, motorCost, REPAIR_WORK, REPAIR_DURATION, REPAIR_DURATION_CAP, REPAIR_MOTOR_SAVING, INSPECTION_WORK, INSPECTION_BONUS, CHILD_CARE_WORK, CHILD_CARE_BONUS, COMMUTER_QUIET_BONUS, TOURIST_MEDIUM_BONUS, RESERVE_CELL_CHARGE, RESERVE_CELL_PRICE, CAPACITY_UPGRADE } from './balance-v832';
import { rollShopRewards, shopFloorIncome, shopOpportunities } from './shop-effects';
import { experimentalRiskLinks, rollExperimentalRiskIncome, type RiskLinkTuning } from './risk-link-experiment';
import { DISMISSALS_PER_SECTOR, OFFER_PARTNERS, RISK_STASH_PER_ASCENT, UPGRADE_SLOTS, isRushFloor, offerRiskChance, riskPartnerships } from './shift-rules';

export type Rider = { id: string; kind: PassengerKind; destination: number; patience: number; boardedAt: number; fareBonus: number; stash?: number; volatile?: boolean; fuse?: number; calledByLover?: boolean; traits?: VariableTraits; copySeed?: number; repairProgress?: number; repairDone?: boolean; quietStreak?: number; complianceReady?: boolean; careProgress?: number };
export type ChangeLine = { label: string; amount: number };
export type ShopCard = { key: UpgradeKey; price: number; purchased: boolean };
export type RunState = {
  floor: number; energy: number; energyCap: number; stress: number; stressCap: number; weightCap: number; coins: number; earned: number; shop: ShopCard[];
  cabin: Array<Rider | null>; swapped: boolean; upgrades: Record<UpgradeKey, number>;
  restStops: number;
  dismissalsUsed?: number;
  serviceTurns?: number;
  reserveCell?: boolean;
  shopUpgradeBought: boolean;
  status: 'playing' | 'upgrade' | 'lost'; message: string; log: string[];
  lastEarnings: { total: number; sources: ChangeLine[] }; lastPressure: { delta: number; sources: ChangeLine[] }; lastEnergy: { delta: number; sources: ChangeLine[] };
};

export const EMPTY_UPGRADES: Record<UpgradeKey, number> = { battery: 0, capacity: 0, calm: 0, concierge: 0, reinforced: 0, express: 0, tipjar: 0, relay: 0, crowd: 0, meter: 0 };
export const LOVER_CALL_CHANCE = .25;
export const INSPECTOR_COMPLIANCE_REWARD = 1;
export const INSPECTOR_ENERGY_LIMIT = 3;
export const COURIER_ARRIVAL_CHARGE = 2;
export const CONTROLLED_GHOST_SAVING = 1;
export const SHOP_ENTRY_CHARGE = 5;
export const INITIAL_ENERGY = 50;
export const ENERGY_CAPACITY = 60;
export const AGITATION_CAPACITY = BASE_AGITATION_CAP;
export const ARRIVAL_RELIEF_CAP = 2;
export const HIGH_RISK_BONUS = 4;
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
export const initialRun = (): RunState => ({ floor: 1, restStops: 0, shopUpgradeBought: false, energy: INITIAL_ENERGY, energyCap: ENERGY_CAPACITY, stress: 0, stressCap: AGITATION_CAPACITY, weightCap: 10, coins: 0, earned: 0, shop: [], cabin: Array(6).fill(null), swapped: false, upgrades: { ...EMPTY_UPGRADES }, status: 'playing', message: '门已开启。把候选人物直接拖进指定站位。', log: ['01F · 无尽班次开始'], lastEarnings: { total: 0, sources: [] }, lastPressure: { delta: 0, sources: [] }, lastEnergy: { delta: 0, sources: [] } });
export const nextShopFloor = (floor: number) => (Math.floor(floor / 10) + 1) * 10;
export const difficultyTier = (floor: number) => Math.floor(Math.max(0, floor - 1) / 30);
export const agitationThreshold = (_cap: number) => AGITATION_HIGH_MIN;
export const arrivalRelief = (arrivals: number) => Math.min(AGITATION_RULES.arrivalReliefCap, Math.max(0, arrivals));
// Retained only for archived experiment callers. Patience no longer affects play.
export const patienceCost = (_state: RunState) => 0;
export const eventPressureMultiplier = (_state: Pick<RunState, 'stress' | 'stressCap'>) => 1;
export const passengerEnergy = (state: RunState) => state.cabin.reduce((sum,rider,slot)=>sum+(rider?riderProfile(rider,state.cabin,slot).energy:0),0);
export const stabilizedEnergy = (state: RunState) => state.upgrades.reinforced > 0 && state.cabin.filter(Boolean).length >= 3 ? Math.min(1,passengerEnergy(state)) : 0;
export const crowdAgitation = (_occupied: number) => 0;
export const REST_STOP_CAP = 0;
export const shiftAgitation = (_floor: number, _occupied: number, _restStops = 0) => 0;
export function shiftOutlook(floor: number, _occupied = 1, _restStops = 0) {
  const next = floor + 1;
  if (next % 10 === 0) return '下一站：商店';
  return isRushFloor(floor) ? '临近维修层 · 急客时段' : '';
}

export const neighbours = (slot: number) => ADJACENT.flatMap(([a, b]) => a === slot ? [b] : b === slot ? [a] : []);
export const hasNeighbour = (cabin: Array<Rider | null>, slot: number, kinds: PassengerKind[]) => neighbours(slot).some((i) => cabin[i] && kinds.includes(cabin[i]!.kind));
export const neighbourCount = (cabin: Array<Rider | null>, slot: number) => neighbours(slot).filter((i) => cabin[i]).length;
/** Every occupied neighboring position is one companion, including another Tourist. */
export const touristCompanionCount = (cabin: Array<Rider | null>, slot: number) => neighbourCount(cabin, slot);
export const totalWeight = profileWeight;
function rawRiderAgitation(state: RunState, slot: number): ChangeLine[] {
  const rider = state.cabin[slot], fixed: ChangeLine[] = [];
  if (!rider) return fixed;
  const add = (label: string, amount: number) => { if (amount > 0) fixed.push({ label, amount }); };
  add(`${PASSENGERS[rider.kind].name}自身躁动`, riderProfile(rider,state.cabin,slot).agitation);
  if (rider.volatile) add(`${PASSENGERS[rider.kind].name}高危`, 1);
  switch (rider.kind) {
    case 'thief': if (!hasNeighbour(state.cabin, slot, ['cop', 'lawyer'])) add('小偷未受控', 1); break;
    case 'child': if (!hasNeighbour(state.cabin, slot, ['lover', 'nurse'])) add('儿童无人照顾', 1); break;
    case 'drunk': if (!hasNeighbour(state.cabin, slot, ['nurse'])) add('醉汉未安抚', 1); break;
    case 'celebrity': if (neighbourCount(state.cabin, slot) > 1) add('名人被围', 1); break;
  }
  return fixed;
}

function agitationBySlot(state: RunState) {
  const lines = state.cabin.map((_, slot) => rawRiderAgitation(state, slot).map(line => ({...line})));
  state.cabin.forEach((rider, calmerSlot) => {
    if (!rider || rider.kind !== 'nurse') return;
    const targets = neighbours(calmerSlot)
      .filter(slot => lines[slot].some(line => line.amount > 0))
      .sort((a,b) => lines[b].reduce((sum,line)=>sum+line.amount,0)-lines[a].reduce((sum,line)=>sum+line.amount,0) || a-b);
    const treated = targets;
    treated.forEach(target => {
      let remaining = 1;
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
export const serviceSaving = (state: RunState) => (state.serviceTurns ?? 0) > 0 ? Math.min(REPAIR_MOTOR_SAVING, motorCost(state.floor+1)) : 0;
export const cooperationBonus = (state: RunState) => 1 + state.upgrades.battery * 2;
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
    if (kind === 'mimic') return slot >= 3 ? cabin[slot-3]?.kind ?? null : null;
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
    if(rider?.kind==='ghost'&&hasNeighbour(state.cabin,slot,['exorcist']))saved+=CONTROLLED_GHOST_SAVING;
  });
  if(GHOST_RULES.oneSavingPerExorcist){
    const providers=state.cabin.filter((rider,slot)=>rider?.kind==='exorcist'&&hasNeighbour(state.cabin,slot,['ghost'])).length;
    saved=Math.min(saved,providers*CONTROLLED_GHOST_SAVING);
  }
  return Math.min(saved,Math.max(0,passengerEnergy(state)-stabilizedEnergy(state)));
};
// Compatibility export for archived callers: the remaining passenger cost.
export const inspectionExtraEnergy = (state: RunState) => Math.max(0, passengerEnergy(state) - stabilizedEnergy(state) - energySavings(state));
export function energyBreakdown(state: RunState) {
  const motor=travelEnergyCost(state.floor+1),people=passengerEnergy(state),stabilizer=stabilizedEnergy(state),shared=energySavings(state);
  const service=serviceSaving(state);
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
  const conflictProtection=0;
  return {motor,people,stabilizer,shared,service,conflict,conflictProtection,riderCosts,saved:stabilizer+shared+service+conflictProtection,total:motor+people+conflict-stabilizer-shared-service-conflictProtection};
}
export const totalEnergyCost = (state: RunState) => energyBreakdown(state).total;
// Inspector judges the controllable load, not the route's unavoidable motor.
export const inspectionLoad = (state: RunState) => { const cost = energyBreakdown(state); return cost.total - cost.motor; };
export const expressTrip = (baseTrip: number, installed: number) => installed > 0 && baseTrip >= 5 ? baseTrip - 1 : baseTrip;

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) { const target = rand(0, index, rng); [result[index], result[target]] = [result[target], result[index]]; }
  return result;
}

const INTRINSIC_RISK: PassengerKind[] = ['thief','drunk','child','celebrity','inspector','mystery','shifter'];
function weightedKind(floor: number, rng: () => number, forcedRisk = false, excludeLover = false): PassengerKind {
  const unlocked = unlockedAt(floor);
  const pool = unlocked.filter(kind => (!forcedRisk || INTRINSIC_RISK.includes(kind)) && (!excludeLover || kind !== 'lover'));
  const total = pool.reduce((sum, kind) => sum + PASSENGERS[kind].rarity, 0);
  let roll = rng() * total;
  for (const kind of pool) { roll -= PASSENGERS[kind].rarity; if (roll <= 0) return kind; }
  return pool[0];
}

export function makeOffers(floor: number, upgrades: Record<UpgradeKey, number>, tutorial = false, rng: () => number = Math.random, cabin: Array<Rider | null> = [], loverCallChance = LOVER_CALL_CHANCE, tuning: OfferTuning = {}): Rider[] {
  const guided = floor === 1 && tutorial;
  const available = unlockedAt(floor);
  const waiting = cabin.some((rider, slot) => rider?.kind === 'lover' && !hasNeighbour(cabin, slot, ['lover']));
  const called = !tutorial && waiting && rng() < loverCallChance;
  // A call fills one slot, not the anchor's whole encounter packet. The other
  // two slots still introduce an interacting pair, without another Lover.
  const anchor = weightedKind(floor, rng, false, called);
  const eligible = (kind: PassengerKind) => available.includes(kind) && (!called || kind !== 'lover');
  const tension = floor >= 21 && rng() < .3 ? BONDS[anchor].avoids.filter(eligible) : [];
  const partners = tension.length ? tension : OFFER_PARTNERS[anchor].filter(eligible);
  const partner = partners[rand(0, partners.length - 1, rng)] ?? 'tourist';
  const kinds: PassengerKind[] = guided ? ['lover', 'lover', 'courier'] : [anchor, partner, called ? 'lover' : weightedKind(floor, rng)];
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
    const traits = kind === 'mystery' || kind === 'shifter' ? randomTraits(kind, available, rng) : undefined;
    const volatile = !guided && index !== calmIndex && (index === rushIndex || rng() < chance);
    return { id: 'f' + floor + '-' + index + '-' + rng().toString(36).slice(2, 7), kind,
      destination: floor + expressTrip(baseTrip, upgrades.express), patience: 0, traits, volatile,
      copySeed: kind === 'mimic' ? rand(0, 2147483647, rng) : undefined,
      boardedAt: floor, fareBonus: upgrades.concierge * ECONOMY_RULES.conciergeTip, stash: 0,
      fuse: kind === 'bomb' ? rand(3, 6, rng) : undefined, calledByLover: called && index === 2,
    };
  });
  // Variable riders bring one matching visible relation in their own packet.
  if (!guided && offers[0].traits) offers[0].traits.bond.likes = [offers[1].kind];
  return guided ? offers : shuffle(offers, rng);
}

/** Progress is earned on an actual ascent; quotes may project one ascent without mutation. */
export function riderAfterWork(rider: Rider, cabin: Array<Rider | null>, slot: number, agitation: number): Rider {
  const next = { ...rider };
  const low = agitationBand(agitation) === 'low';
  if (next.kind === 'mechanic' && !next.repairDone && low) {
    next.repairProgress = Math.min(REPAIR_WORK, (next.repairProgress ?? 0) + 1);
    next.repairDone = next.repairProgress >= REPAIR_WORK;
  }
  if (next.kind === 'inspector' && !next.complianceReady) {
    next.quietStreak = low ? Math.min(INSPECTION_WORK, (next.quietStreak ?? 0) + 1) : 0;
    next.complianceReady = next.quietStreak >= INSPECTION_WORK;
  }
  if (next.kind === 'child' && hasNeighbour(cabin, slot, ['lover', 'nurse'])) {
    next.careProgress = Math.min(CHILD_CARE_WORK, (next.careProgress ?? 0) + 1);
  }
  return next;
}

export function resolveFloor(state: RunState, rng: () => number = Math.random, fareTuning: FareTuning = {}): RunState {
  if (state.status !== 'playing') return state;
  if (!state.cabin.some(Boolean)) return { ...state, message: '至少接一位乘客才能上行。' };
  const nextFloor = state.floor + 1;
  const checkpoint = nextFloor % 10 === 0;
  const energyCost = travelEnergyCost(nextFloor);
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
  const redLinks=conflictLinks(state.cabin);
  const {conflict:redEnergy,conflictProtection}=energyBreakdown(state);
  if(redEnergy)adjustEnergy('红线额外耗电',-redEnergy);
  if(conflictProtection)adjustEnergy('维修工抵消红线耗电',conflictProtection);
  let cabin = state.cabin.map((rider,slot) => rider ? riderAfterWork(rider,state.cabin,slot,state.stress) : null);
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
    if (line.amount > 0) stressReasons.push(`${PASSENGERS[rider.kind].name}：${line.label}，躁动 +${line.amount}`);
  }); });
  const redAgitation=redLinks.filter(link=>link.effect==='agitation').length;
  if(redAgitation){
    adjustPressure('红线躁动',redAgitation);
    stressReasons.push(`红线冲突：躁动 +${redAgitation}`);
  }
  const riskLinks = experimentalRiskLinks(state.cabin, fareTuning.riskLinks);
  if (riskLinks.agitation) adjustPressure('同伙躁动（实验）', riskLinks.agitation);
  const partnership = riskPartnerships(state.cabin);
  if (partnership.agitation) adjustPressure('坏人链接躁动', partnership.agitation);
  const stashPerStep = RISK_STASH_PER_ASCENT + Number(agitationBand(state.stress) === 'high');
  for (const slot of partnership.members) cabin[slot]!.stash = (cabin[slot]!.stash ?? 0) + stashPerStep;
  const shopIncome = shopFloorIncome(state);
  if (shopIncome.crowd) addCoins('共乘票', shopIncome.crowd);
  if (shopIncome.meter) addCoins('长途计价器', shopIncome.meter);
  const effectCabin = [...cabin];
  effectCabin.forEach((rider, slot) => {
    if (!rider) return;
    const controlledThief = hasNeighbour(effectCabin, slot, ['cop', 'lawyer']);
    const controlledGhost = hasNeighbour(effectCabin, slot, ['exorcist']);
    switch (rider.kind) {
      case 'mechanic': break; // Shared savings are itemized in lastEnergy.
      case 'tourist': break; // Companion rewards are paid on delivery only.
      case 'lover': break; // Pairing increases delivery value, never idle income.
      case 'thief': if (!controlledThief) addCoins('小偷', ECONOMY_RULES.thiefTravel); break;
      case 'drunk': break;
      case 'ghost': if (controlledGhost) notes.push('幽灵受控，不再延误邻座'); else if (nextFloor % 3 === 0) { const nearby = neighbours(slot).filter((i) => effectCabin[i]); if (nearby.length) { effectCabin[nearby[rand(0, nearby.length - 1, rng)]]!.destination += 1; notes.push('幽灵令邻座延误一层'); } } break;
      case 'celebrity': if (neighbourCount(effectCabin, slot) === 1) addCoins('名人关注', ECONOMY_RULES.celebrityTravel); break;
      case 'bomb': { const secured = hasNeighbour(effectCabin, slot, ['cop']); if (!secured) rider.fuse = (rider.fuse ?? 1) - 1; break; }
    }
  });
  let arrivals = 0;
  const arrivalSlots: number[] = [];
  cabin = cabin.map((rider, slot) => {
    if (!rider) return null;
    if (rider.kind === 'bomb' && (rider.fuse ?? 0) <= 0 && nextFloor < rider.destination) return rider;
    if (nextFloor < rider.destination) return rider;
    const spec = PASSENGERS[rider.kind]; const profile = riderProfile(rider, cabin, slot);
    const fare = arrivalFare(rider, cabin, slot, cooperationBonus(state), state.stress, fareTuning);
    const appetitePremium = rider.kind === 'drunk' ? fare - arrivalFare(rider, cabin, slot, cooperationBonus(state), state.stress, { ...fareTuning, appetiteBonus: 0 }) : 0;
    if (profile.hidden) notes.push(`${spec.name}封存车费揭晓：${profile.fare} 金币`);
    if (rider.kind === 'courier') adjustEnergy('快递员电池包', COURIER_ARRIVAL_CHARGE);
    addCoins(`${spec.name}${profile.hidden ? '揭晓车费' : '到站'}`, fare - appetitePremium - (rider.stash ?? 0));
    if (rider.stash) addCoins('坏人暂存兑现', rider.stash);
    if (appetitePremium) addCoins('醉汉躁动加价', appetitePremium);
    arrivals += 1; arrivalSlots.push(slot); return null;
  });
  const shopRewards = rollShopRewards(shopOpportunities(state, effectCabin, arrivalSlots), rng);
  if (shopRewards.tips) addCoins('小费盒额外小费', shopRewards.tips);
  if (shopRewards.energy) adjustEnergy('并联回充', shopRewards.energy);
  if (state.upgrades.crowd && effectCabin.filter(Boolean).length >= 4 && arrivalSlots.length) addCoins('共乘票', 3);
  if (state.upgrades.meter) {
    const eligible = arrivalSlots.filter(slot => nextFloor - effectCabin[slot]!.boardedAt >= 5).length;
    if (eligible) addCoins('长途计价器', eligible * 4);
  }
  const riskIncome = rollExperimentalRiskIncome(state.cabin, fareTuning.riskLinks, rng);
  if (riskIncome) addCoins('同伙收入（实验）', riskIncome);
  const redCoinDemand=Math.max(0, redLinks.filter(link=>link.effect==='coins').length*2 - (state.cabin.some(r=>r?.kind==='lawyer') ? 2 : 0));
  const redCoinLoss=Math.min(coins,redCoinDemand);
  if(redCoinLoss)addCoins('红线金币损失',-redCoinLoss);
  // Arriving on the same floor as fuse expiry is still safe.
  const bombFailed = cabin.some((rider) => rider?.kind === 'bomb' && (rider.fuse ?? 0) <= 0);
  const relieved = Math.min(Math.max(0, stress), arrivalRelief(arrivals));
  if (relieved) adjustPressure('乘客到站舒缓', -relieved);
  if(checkpoint&&energy<state.energyCap)adjustEnergy('抵达商店补电',Math.min(SHOP_ENTRY_CHARGE,state.energyCap-energy));
  if (energy > state.energyCap) adjustEnergy('超额回充未储存', state.energyCap - energy);
  energy = Math.min(state.energyCap, energy); stress = Math.max(0, stress);
  let status: RunState['status'] = checkpoint ? 'upgrade' : 'playing';
  let message = arrivals ? `${arrivals} 位乘客抵达。门再次开启。` : '电梯继续向上，新的面孔正在等候。';
  if (bombFailed) { status = 'lost'; message = '炸弹倒计时归零：乘客未能及时到站。午夜班次戛然而止。'; }
  else if (energy < 0 || (!checkpoint && energy === 0)) { status = 'lost'; message = '电量耗尽，轿厢停在了楼层之间。'; }
  else if (!checkpoint && stress >= state.stressCap) { status = 'lost'; message = '躁动达到上限，午夜班次失控。'; }
  if (stressReasons.length && status === 'playing') message = stressReasons.slice(0, 2).join(' · ');
  else if (notes.length && status === 'playing') message = notes.slice(0, 2).join(' · ');
  const lastEarnings = { total: coins - state.coins, sources: earningSources }; const lastPressure = { delta: stress - state.stress, sources: pressureSources }; const lastEnergy = { delta: energy - state.energy, sources: energySources }; const incomeNote = lastEarnings.total ? `${lastEarnings.total>0?'+':''}${lastEarnings.total} 金币 · ` : '';
  cabin = cabin.map(rider => rider?.kind === 'shifter' ? { ...rider, traits: randomTraits('shifter', unlockedAt(nextFloor), rng, (rider.traits?.revision ?? 0) + 1) } : rider);
  if (cabin.some(rider => rider?.kind === 'shifter') && status === 'playing') message += ' 百变人已变化，关门前查看新属性。';
  const crisis: UpgradeCrisis = energy <= 0 && stress >= state.stressCap ? 'both' : energy <= 0 ? 'energy' : stress >= state.stressCap ? 'stress' : null;
  const shop = status === 'upgrade' ? upgradeChoices(state.upgrades, rng, crisis).map((key) => ({ key, price: upgradePrice(key, nextFloor, state.upgrades[key]), purchased: false })) : [];
  return { ...state, floor: nextFloor, energy, stress, coins, serviceTurns, restStops: 0, dismissalsUsed: checkpoint ? 0 : (state.dismissalsUsed ?? 0), shopUpgradeBought: false, earned: state.earned + lastEarnings.total, shop, cabin, swapped: false, status, message, lastEarnings, lastPressure, lastEnergy, log: [`${String(nextFloor).padStart(2, '0')}F · ${incomeNote}${message}`, ...state.log].slice(0, 4) };
}

export type UpgradeCrisis = 'energy' | 'stress' | 'both' | null;
export const upgradeChoices = (upgrades: Record<UpgradeKey, number> = EMPTY_UPGRADES, rng: () => number = Math.random, _crisis: UpgradeCrisis = null): UpgradeKey[] => {
  if (Object.values(upgrades).filter(Boolean).length >= UPGRADE_SLOTS) return [];
  const pool = (Object.keys(UPGRADES) as UpgradeKey[]).filter(key => !upgrades[key]);
  return shuffle(pool, rng).slice(0, 3);
  // Both repairs are permanent services, never dependent on a random card.
};
export const availableShopCards = (state: RunState) => state.shopUpgradeBought || Object.values(state.upgrades).filter(Boolean).length >= UPGRADE_SLOTS ? [] : state.shop.filter(card => !card.purchased && !state.upgrades[card.key]);

export function failureLesson(state: RunState): string {
  if (state.status !== 'lost') return '';
  if (state.message.includes('炸弹倒计时')) return '炸弹倒计时归零 · 下一班让炸弹客与警察相邻，警察会在相邻期间锁住倒计时；来不及送达就拒载。';
  if (state.energy <= 0 && state.stress >= state.stressCap) return '双重失控 · 下一班提前留好维修预算，关门前先处理更接近上限的一项。';
  if (state.message.includes('电量')) {
    const motor = Math.abs(state.lastEnergy.sources.find(s=>s.label==='电梯运转')?.amount ?? 0);
    const people = state.lastEnergy.sources.filter(s=>s.label.endsWith('耗电')).reduce((n,s)=>n+Math.max(0,-s.amount),0);
    if (state.reserveCell) return `电量耗尽 · 最后一层运转${motor}电、人物与红线${people}电；还有一份未使用的应急电池。关门前可用它补电。`;
    return `电量耗尽 · 最后一层运转${motor}电、人物与红线${people}电。${people===0?'当时已没有人物耗电；问题是剩余续航，不是乘客太多。':'人物耗电在到站前持续发生，离店时要算完整路程。'}途中不能直接充电，可在商店预备一份应急电池。`;
  }
  if (state.message.includes('躁动')) {
    const source = state.lastPressure.sources.filter((line) => line.amount > 0).sort((a, b) => b.amount - a.amount)[0];
    const advice = source?.label.includes('被围')
      ? '名人只留1位邻座，可避免围观新增躁动。'
      : '护士需贴邻抵消新增躁动；音乐家影响整车，高档最多减2，并不保证安全。';
    return source ? `躁动失控 · 最后一层主要来源：${source.label} +${source.amount}。${advice}` : '躁动失控 · 下一班优先处理高危乘客与红色冲突。';
  }
  return '班次中断 · 下一班留意关门前的电量与躁动预报。';
}

export function previewUpgrade(current: RunState, key: UpgradeKey): RunState {
  if (current.upgrades[key] || Object.values(current.upgrades).filter(Boolean).length >= UPGRADE_SLOTS) return current;
  const upgrades = { ...current.upgrades, [key]: 1 }; const energyCap = current.energyCap + (key === 'capacity' ? CAPACITY_UPGRADE : 0); const energy = current.energy; let stressCap = current.stressCap; let stress = current.stress; const weightCap = current.weightCap;
  if (key === 'calm') { stressCap += 1; stress = Math.max(0, stress - 2); }
  return { ...current, upgrades, energyCap, energy: Math.min(energyCap, energy), stressCap, stress, weightCap };
}

export const UPGRADE_BASE_PRICES: Record<UpgradeKey, number> = { battery: 30, capacity: 35, calm: 35, concierge: 40, reinforced: 45, express: 45, tipjar: 30, relay: 30, crowd: 40, meter: 25 };
export const upgradePrice = (key: UpgradeKey, _floor: number, _installed: number) => UPGRADE_BASE_PRICES[key];
export function installUpgrade(current: RunState, key: UpgradeKey): RunState {
  const card = current.shop.find((item) => item.key === key);
  if (current.status !== 'upgrade' || current.shopUpgradeBought || !card || card.purchased || current.coins < card.price || current.upgrades[key] > 0 || Object.values(current.upgrades).filter(Boolean).length >= UPGRADE_SLOTS) return current;
  const preview = previewUpgrade(current, key);
  return { ...preview, coins: current.coins - card.price, shopUpgradeBought: true, shop: [], message: `${UPGRADES[key].name}已购入，花费 ${card.price} 金币。`, lastEarnings: { total: 0, sources: [] }, lastPressure: { delta: 0, sources: [] }, lastEnergy: { delta: 0, sources: [] }, log: [`${current.floor}F · 购买${UPGRADES[key].name} −${card.price} 金币`, ...current.log].slice(0, 4) };
}

export function leaveShop(current: RunState): RunState {
  if (current.status !== 'upgrade') return current;
  const failed = current.energy <= 0 || current.stress >= current.stressCap;
  return { ...current, shop: [], status: failed ? 'lost' : 'playing', message: current.energy <= 0 ? '金币或维修不足，电量未能恢复。' : current.stress >= current.stressCap ? '维修后躁动仍然失控，班次结束。' : '维修层已离开，继续挑战更高楼层。' };
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
  return {target,units,cost:units*CHARGE_PRICE,baseline:(nextShopFloor(state.floor)-state.floor)*travelEnergyCost(state.floor+1)};
}
export function affordableChargingPlan(state: RunState) {
  const units=Math.max(0,Math.min(state.energyCap-state.energy,Math.floor(state.coins/CHARGE_PRICE)));
  return {units,cost:units*CHARGE_PRICE,target:state.energy+units};
}
export function purchaseRepairWarning(state: RunState, key: UpgradeKey, price: number) {
  if (state.coins < price) return null;
  const after = previewUpgrade(state, key), remaining = state.coins - price;
  if (remaining < emergencyRepairPlan(after).cost) return 'crisis';
  if (remaining < chargingPlan(after).cost) return 'reference';
  return null;
}
export function chargeBattery(state: RunState, units: number): RunState {
  if(state.status!=='upgrade'||!Number.isSafeInteger(units)||units<=0||state.energy+units>state.energyCap||state.coins<units*CHARGE_PRICE)return state;
  const cost=units*CHARGE_PRICE;
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
export const dismissalsRemaining = (state: RunState) => Math.max(0, DISMISSALS_PER_SECTOR - (state.dismissalsUsed ?? 0));
export const dismissalCost=(state: RunState,rider:Rider)=>4+Math.max(0,rider.destination-state.floor)*2;
export function dismissRider(state: RunState, id: string): RunState {
  const slot=state.cabin.findIndex(r=>r?.id===id),rider=state.cabin[slot];
  if(state.status!=='playing'||!rider||rider.boardedAt>=state.floor||rider.destination<=state.floor)return state;
  const cost=dismissalCost(state,rider);
  if(state.coins<cost || dismissalsRemaining(state) <= 0)return state;
  const message=`已请离${PASSENGERS[rider.kind].name}，赔偿 ${cost} 金币；不结算到站收益。`;
  return {...state,coins:state.coins-cost,dismissalsUsed:(state.dismissalsUsed ?? 0)+1,cabin:state.cabin.map((r,i)=>i===slot?null:r),message,log:[`${state.floor}F · ${message}`,...state.log].slice(0,4),lastEarnings:{total:0,sources:[]},lastEnergy:{delta:0,sources:[]},lastPressure:{delta:0,sources:[]}};
}
export function installedUpgradeSummary(state: RunState,key:UpgradeKey) {
 const count=state.upgrades[key];
 if(!count)return '未安装';
 switch(key){
  case 'battery':return `每条协作连接的到站加成 +${cooperationBonus(state)} 金币（基础1 + 升级${count*2}）。`;
  case 'capacity':return `电量上限${state.energyCap}；只扩容，不赠送电量，本局唯一。`;
  case 'calm':return `躁动上限 ${state.stressCap}；安装时立即舒缓2点，本局唯一`;
  case 'concierge':return `此后新乘客到站小费 +${count*ECONOMY_RULES.conciergeTip}；不参与车费倍率`;
  case 'reinforced':return '关门时至少3人，每站抵消1点人物耗电，不影响运转耗电；本局唯一。';
  case 'express':return '新乘客原定路程≥5站时少坐1站；本局唯一';
  default:return UPGRADES[key].description;
 }
}

/** Exact arrival payout at this seating arrangement. UI must mask hidden fares. */
export const arrivalTip = (rider: Rider, agitation: number) => ECONOMY_RULES.conciergeCondition === 'any' || agitationBand(agitation) === ECONOMY_RULES.conciergeCondition ? rider.fareBonus : 0;
export function arrivalFare(rider: Rider, cabin: Array<Rider | null>, slot: number, bonus = 1, agitation = 0, tuning: FareTuning = {}) {
  let fare = riderProfile(rider, cabin, slot).fare;
  const baseFare = fare;
  const companions = rider.kind === 'tourist' ? neighbourCount(cabin, slot) * 2 : 0;
  if (rider.kind === 'lover') fare *= 1 + neighbours(slot).filter(i => cabin[i]?.kind === 'lover').length;
  if (rider.kind === 'thief' && hasNeighbour(cabin, slot, ['cop', 'lawyer'])) fare += 5;
  if (rider.kind === 'ghost' && hasNeighbour(cabin, slot, ['exorcist'])) fare += 2;
  const gamble = conflictLinks(cabin).filter(link => link.effect === 'gamble' && (link.first === slot || link.second === slot)).length;
  const coaches = neighbours(slot).filter(i => cabin[i]?.kind === 'coach').length;
  const multiplier = gamble + (rider.kind === 'coach' ? 0 : .5 * coaches + agitationAppetite(rider, cabin, slot, agitation, tuning));
  fare = FARE_RULES.baseOnlyMultipliers ? fare + Math.ceil(baseFare * multiplier) : Math.ceil(fare * (1 + multiplier));
  if (rider.kind === 'coach') fare += neighbourCount(cabin, slot) * FARE_RULES.coachNeighbour;
  const preference = rider.kind === 'commuter' && agitationBand(agitation)==='low' ? COMMUTER_QUIET_BONUS : rider.kind === 'tourist' && agitationBand(agitation)==='medium' ? TOURIST_MEDIUM_BONUS : 0;
  const accomplishment = rider.kind === 'inspector' && rider.complianceReady ? INSPECTION_BONUS : rider.kind === 'child' && (rider.careProgress ?? 0)>=CHILD_CARE_WORK ? CHILD_CARE_BONUS : 0;
  return fare + companions + preference + accomplishment + arrivalTip(rider,agitation) + (rider.volatile ? HIGH_RISK_BONUS : 0) + (rider.stash ?? 0) + bonus * bondStatus(rider, cabin, slot).supportCount;
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
  const cost = energy * CHARGE_PRICE + stress * SOOTHE_PRICE;
  return { energy, stress, cost, affordable: state.coins >= cost };
}
export function repairEmergency(state: RunState): RunState {
  const plan = emergencyRepairPlan(state);
  if (state.status !== 'upgrade' || !plan.affordable || !plan.cost) return state;
  let next = plan.energy ? chargeBattery(state, plan.energy) : state;
  if (plan.stress) next = sootheAgitation(next, plan.stress);
  return next;
}
