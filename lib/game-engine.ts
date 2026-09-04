import { BONDS, bondStatus, profileWeight, randomTraits, riderProfile, type VariableTraits } from './rider-profile';
import { ADJACENT, MECHANIC_SAVING, PASSENGERS, UNLOCK_TIERS, UPGRADES, type PassengerKind, type UpgradeKey } from './game-data';

export type Rider = { id: string; kind: PassengerKind; destination: number; patience: number; boardedAt: number; fareBonus: number; volatile?: boolean; fuse?: number; calledByLover?: boolean; traits?: VariableTraits; copySeed?: number };
export type ChangeLine = { label: string; amount: number };
export type ShopCard = { key: UpgradeKey; price: number; purchased: boolean };
export type RunState = {
  floor: number; energy: number; energyCap: number; stress: number; stressCap: number; weightCap: number; coins: number; earned: number; shop: ShopCard[];
  cabin: Array<Rider | null>; swapped: boolean; upgrades: Record<UpgradeKey, number>;
  restStops: number;
  status: 'playing' | 'upgrade' | 'lost'; message: string; log: string[];
  lastEarnings: { total: number; sources: ChangeLine[] }; lastPressure: { delta: number; sources: ChangeLine[] }; lastEnergy: { delta: number; sources: ChangeLine[] };
};

export const EMPTY_UPGRADES: Record<UpgradeKey, number> = { battery: 0, solar: 0, calm: 0, concierge: 0, reinforced: 0, express: 0 };
export const LOVER_CALL_CHANCE = .25;
export const INSPECTOR_COMPLIANCE_REWARD = 1;
export const INSPECTOR_ENERGY_LIMIT = 4;
export const COURIER_ARRIVAL_CHARGE = 1;
export const INITIAL_ENERGY = 42;
export const ENERGY_CAPACITY = 60;
export const AGITATION_CAPACITY = 6;
export const HIGH_RISK_BONUS = 8;
export const HIGH_RISK_START = 30;
export const OFFER_PRESSURE_STEP = 40;
export type OfferTuning = { highRiskStart?: number; pressureStep?: number; volatileSpan?: number };
export const initialRun = (): RunState => ({ floor: 1, restStops: 0, energy: INITIAL_ENERGY, energyCap: ENERGY_CAPACITY, stress: 0, stressCap: AGITATION_CAPACITY, weightCap: 10, coins: 0, earned: 0, shop: [], cabin: Array(6).fill(null), swapped: false, upgrades: { ...EMPTY_UPGRADES }, status: 'playing', message: '门已开启。把候选人物直接拖进指定站位。', log: ['01F · 无尽班次开始'], lastEarnings: { total: 0, sources: [] }, lastPressure: { delta: 0, sources: [] }, lastEnergy: { delta: 0, sources: [] } });
export const nextShopFloor = (floor: number) => (Math.floor(floor / 10) + 1) * 10;
export const difficultyTier = (floor: number) => Math.floor(Math.max(0, floor - 1) / 30);
export const agitationThreshold = (cap: number) => Math.max(1, cap - 2);
// Retained only for archived experiment callers. Patience no longer affects play.
export const patienceCost = (_state: RunState) => 0;
export const eventPressureMultiplier = (_state: Pick<RunState, 'stress' | 'stressCap'>) => 1;
export const passengerEnergy = (state: RunState) => state.cabin.reduce((sum,rider,slot)=>sum+(rider?riderProfile(rider,state.cabin,slot).energy:0),0);
export const stabilizedEnergy = (state: RunState) => state.upgrades.reinforced > 0 ? Math.min(1,passengerEnergy(state)) : 0;
export const crowdAgitation = (_occupied: number) => 0;
export const REST_STOP_CAP = 0;
export const shiftAgitation = (_floor: number, _occupied: number, _restStops = 0) => 0;
export function shiftOutlook(floor: number, _occupied = 1, _restStops = 0) {
  const next = floor + 1;
  if (next % 10 === 0) return '下一站：商店';
  return floor >= OFFER_PRESSURE_STEP && floor % OFFER_PRESSURE_STEP === 0 ? '本层起，高危候客增加' : '';
}

export const neighbours = (slot: number) => ADJACENT.flatMap(([a, b]) => a === slot ? [b] : b === slot ? [a] : []);
export const hasNeighbour = (cabin: Array<Rider | null>, slot: number, kinds: PassengerKind[]) => neighbours(slot).some((i) => cabin[i] && kinds.includes(cabin[i]!.kind));
export const neighbourCount = (cabin: Array<Rider | null>, slot: number) => neighbours(slot).filter((i) => cabin[i]).length;
export const TOURIST_COMPANION_CAP = 2;
/** Distinct non-Tourist professions beside this Tourist, capped for balance. */
export const touristCompanionCount = (cabin: Array<Rider | null>, slot: number) => Math.min(TOURIST_COMPANION_CAP, new Set(neighbours(slot).map((i) => cabin[i]?.kind).filter((kind): kind is PassengerKind => Boolean(kind) && kind !== 'tourist')).size);
export const totalWeight = profileWeight;
function rawRiderAgitation(state: RunState, slot: number): ChangeLine[] {
  const rider = state.cabin[slot], fixed: ChangeLine[] = [];
  if (!rider) return fixed;
  const add = (label: string, amount: number) => { if (amount > 0) fixed.push({ label, amount }); };
  add(`${PASSENGERS[rider.kind].name}自身躁动`, riderProfile(rider,state.cabin,slot).agitation);
  if (rider.volatile) add(`${PASSENGERS[rider.kind].name}高危`, 1);
  const bonds=bondStatus(rider,state.cabin,slot);
  if ((state.floor + 1) % 2 === 0) add('邻座冲突', bonds.conflictCount);
  switch (rider.kind) {
    case 'thief': if (!hasNeighbour(state.cabin, slot, ['cop', 'lawyer'])) add('小偷未受控', 1); break;
    case 'child': if (!hasNeighbour(state.cabin, slot, ['lover', 'musician', 'nurse'])) add('儿童无人照顾', 1); break;
    case 'drunk': if (!hasNeighbour(state.cabin, slot, ['musician', 'nurse'])) add('醉汉未安抚', 1); break;
    case 'celebrity': if (neighbourCount(state.cabin, slot) > 1) add('名人被围', 1); break;
    case 'inspector': if (totalEnergyCost(state) > INSPECTOR_ENERGY_LIMIT) add('检查员：总耗电超过4', 1); break;
  }
  return fixed;
}

function agitationBySlot(state: RunState) {
  const lines = state.cabin.map((_, slot) => rawRiderAgitation(state, slot).map(line => ({...line})));
  state.cabin.forEach((rider, calmerSlot) => {
    if (!rider || !['musician','nurse'].includes(rider.kind)) return;
    const target = neighbours(calmerSlot)
      .filter(slot => lines[slot].some(line => line.amount > 0))
      .sort((a,b) => lines[b].reduce((sum,line)=>sum+line.amount,0)-lines[a].reduce((sum,line)=>sum+line.amount,0) || a-b)[0];
    if (target === undefined) return;
    const source = lines[target].find(line => line.amount > 0);
    if (source) source.amount -= 1;
  });
  return lines.map(fixed => fixed.filter(line => line.amount > 0));
}

/** Visible, deterministic passenger agitation after adjacent calming. */
export function riderAgitation(state: RunState, slot: number) {
  const fixed = agitationBySlot(state)[slot] ?? [];
  const low = fixed.reduce((sum, line) => sum + line.amount, 0);
  return { fixed, random: 0, low, high: low };
}
export const cooperationBonus = (state: RunState) => 3 + state.upgrades.battery * 2;
// One cabin-wide reward per travelled floor. Further contract levels improve
// coins, not soothing; boarding, reseating and dismissing cannot trigger it.
export const COOPERATION_RELIEF = 0;
export const cooperationRelief = (_state: Pick<RunState, 'upgrades'>) => 0;
export const isFreeReseat = (cabin: Array<Rider | null>, source: number, target: number, floor: number) => Boolean(cabin[source] && cabin[source]!.boardedAt === floor && (!cabin[target] || cabin[target]!.boardedAt === floor));
export const unlockedAt = (floor: number) => UNLOCK_TIERS.flatMap((tier) => tier.floor <= floor ? tier.kinds : []);
const READY_PARTNERS: Partial<Record<PassengerKind, PassengerKind[]>> = { lover: ['lover'], thief: ['cop', 'lawyer'], cop: ['thief', 'bomb'], lawyer: ['thief'], drunk: ['musician', 'nurse'], musician: ['drunk', 'child'], nurse: ['drunk', 'child'], child: ['lover', 'musician', 'nurse'], ghost: ['exorcist'], exorcist: ['ghost'], bomb: ['cop'] };
export const synergyPartnerAtSlot = (kind: PassengerKind, cabin: Array<Rider | null>, slot: number, excludeId?: string): PassengerKind | null => {
  const partners = [...(READY_PARTNERS[kind] ?? []), ...BONDS[kind].likes];
  return partners.find((partner) => neighbours(slot).some((nearby) => cabin[nearby]?.id !== excludeId && cabin[nearby]?.kind === partner)) ?? null;
};
export const readyPartner = (kind: PassengerKind, cabin: Array<Rider | null>, excludeId?: string, candidate?: Rider): PassengerKind | null => {
  const atSlot = (slot: number): PassengerKind | null => {
    if (!candidate || !['mystery', 'shifter', 'mimic'].includes(kind)) return synergyPartnerAtSlot(kind, cabin, slot, excludeId);
    const placed = cabin.map((r, i) => i === slot ? candidate : r);
    const profile = riderProfile(candidate, placed, slot);
    return neighbours(slot).map(i => placed[i]).find(r => r && r.id !== candidate.id && (kind === 'mimic' || profile.bond.likes.includes(r.kind)))?.kind ?? null;
  };
  const occupiedSlot = cabin.findIndex((rider) => rider?.id === excludeId);
  if (occupiedSlot >= 0) return atSlot(occupiedSlot);
  for (let slot = 0; slot < cabin.length; slot += 1) if (!cabin[slot]) { const partner = atSlot(slot); if (partner) return partner; }
  return null;
};
export const rand = (min: number, max: number, rng: () => number = Math.random) => Math.floor(rng() * (max - min + 1)) + min;
export const travelEnergyCost = (_destinationFloor: number) => 1;
export const energySavings = (state: RunState) => {
  const next=state.floor+1;
  let saved=state.upgrades.solar&&next%4===0?1:0;
  state.cabin.forEach((rider,slot)=>{
    if(rider?.kind==='mechanic')saved+=MECHANIC_SAVING;
    if(rider?.kind==='ghost'&&hasNeighbour(state.cabin,slot,['exorcist']))saved++;
  });
  return Math.min(saved,Math.max(0,passengerEnergy(state)-stabilizedEnergy(state)));
};
// Compatibility export for archived callers: the remaining passenger cost.
export const inspectionExtraEnergy = (state: RunState) => Math.max(0, passengerEnergy(state) - stabilizedEnergy(state) - energySavings(state));
export function energyBreakdown(state: RunState) {
  const motor=travelEnergyCost(state.floor+1),people=passengerEnergy(state),stabilizer=stabilizedEnergy(state),shared=energySavings(state);
  return {motor,people,stabilizer,shared,saved:stabilizer+shared,total:motor+people-stabilizer-shared};
}
export const totalEnergyCost = (state: RunState) => energyBreakdown(state).total;
export const expressTrip = (baseTrip: number, installed: number) => installed > 0 && baseTrip >= 5 ? baseTrip - 1 : baseTrip;

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) { const target = rand(0, index, rng); [result[index], result[target]] = [result[target], result[index]]; }
  return result;
}

const INTRINSIC_RISK: PassengerKind[] = ['thief','drunk','child','celebrity','inspector','mystery','shifter'];
function weightedKind(floor: number, rng: () => number, forcedRisk = false): PassengerKind {
  const unlocked = unlockedAt(floor);
  const pool = forcedRisk ? unlocked.filter(kind => INTRINSIC_RISK.includes(kind)) : unlocked;
  const total = pool.reduce((sum, kind) => sum + PASSENGERS[kind].rarity, 0);
  let roll = rng() * total;
  for (const kind of pool) { roll -= PASSENGERS[kind].rarity; if (roll <= 0) return kind; }
  return pool[0];
}

export function makeOffers(floor: number, upgrades: Record<UpgradeKey, number>, tutorial = false, rng: () => number = Math.random, cabin: Array<Rider | null> = [], loverCallChance = LOVER_CALL_CHANCE, tuning: OfferTuning = {}): Rider[] {
  const used = new Set<PassengerKind>();
  const firstShift: PassengerKind[] = ['lover', 'lover', 'courier']; const firstShiftTrips = [5, 5, 2]; const guidedShift = floor === 1 && tutorial;
  const pressureStep=tuning.pressureStep??OFFER_PRESSURE_STEP, highRiskStart=tuning.highRiskStart??HIGH_RISK_START, volatileSpan=tuning.volatileSpan??55;
  const pressureQuota = guidedShift ? 0 : Math.min(3, Math.floor(floor / pressureStep));
  const waitingLover = cabin.some((rider, slot) => rider?.kind === 'lover' && !hasNeighbour(cabin, slot, ['lover']));
  const loverCalled = !tutorial && waitingLover && loverCallChance > 0 && rng() < loverCallChance;
  return Array.from({ length: 3 }, (_, index) => {
    const forcedRisk = index < pressureQuota;
    let kind = guidedShift ? firstShift[index] : loverCalled && index === 0 && !forcedRisk ? 'lover' : weightedKind(floor, rng, forcedRisk); let guard = 0;
    while (!guidedShift && used.has(kind) && guard++ < 15) kind = weightedKind(floor, rng, forcedRisk);
    used.add(kind);
    const spec = PASSENGERS[kind];
    const baseTrip = guidedShift ? firstShiftTrips[index] : rand(spec.trip[0], spec.trip[1], rng);
    const trip = expressTrip(baseTrip, upgrades.express);
    const traits = kind === 'mystery' || kind === 'shifter' ? randomTraits(kind, unlockedAt(floor), rng) : undefined;
    const patience = 0; // Retired field, retained for old report readers only.
    const highRiskChance = floor < highRiskStart ? 0 : Math.min(.75, (floor - highRiskStart + 1) / volatileSpan);
    const volatile = index < pressureQuota || rng() < highRiskChance;
    return { id: `f${floor}-${index}-${rng().toString(36).slice(2, 7)}`, kind, destination: floor + trip, patience, traits, volatile, copySeed: kind === 'mimic' ? rand(0, 2147483647, rng) : undefined, boardedAt: floor, fareBonus: upgrades.concierge * 3, fuse: kind === 'bomb' ? rand(3, 6, rng) : undefined, calledByLover: loverCalled && index === 0 };
  });
}

export function resolveFloor(state: RunState, rng: () => number = Math.random): RunState {
  if (state.status !== 'playing') return state;
  if (!state.cabin.some(Boolean)) return { ...state, message: '至少接一位乘客才能上行。' };
  const nextFloor = state.floor + 1;
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
  let cabin = state.cabin.map((rider) => rider ? { ...rider } : null);
  const notes: string[] = []; const stressReasons: string[] = [];
  state.cabin.forEach((rider, slot) => { if (rider) riderAgitation(state, slot).fixed.forEach(line => {
    adjustPressure(line.label, line.amount);
    if (line.amount > 0) stressReasons.push(`${PASSENGERS[rider.kind].name}：${line.label}，躁动 +${line.amount}`);
  }); });
  const effectCabin = [...cabin];
  effectCabin.forEach((rider, slot) => {
    if (!rider) return;
    const calmDrunk = hasNeighbour(effectCabin, slot, ['musician', 'nurse']); const controlledThief = hasNeighbour(effectCabin, slot, ['cop', 'lawyer']);
    const loverLinks = neighbours(slot).filter(nearby=>effectCabin[nearby]?.kind==='lover').length; const controlledGhost = hasNeighbour(effectCabin, slot, ['exorcist']);
    switch (rider.kind) {
      case 'mechanic': break; // Shared savings are itemized in lastEnergy.
      case 'tourist': { const companions=touristCompanionCount(effectCabin,slot); if(companions)addCoins('游客旅伴',companions); break; }
      case 'lover': if (loverLinks) addCoins('恋人连携', loverLinks); break;
      case 'thief': addCoins(controlledThief ? '受控小偷' : '小偷', controlledThief ? 1 : 3); break;
      case 'drunk': if (calmDrunk) addCoins('醉汉安抚', 1); break;
      case 'ghost': if (controlledGhost) notes.push('幽灵受控，不再延误邻座'); else if (nextFloor % 3 === 0) { const nearby = neighbours(slot).filter((i) => effectCabin[i]); if (nearby.length) { effectCabin[nearby[rand(0, nearby.length - 1, rng)]]!.destination += 1; notes.push('幽灵令邻座延误一层'); } } break;
      case 'celebrity': if (neighbourCount(effectCabin, slot) === 1) addCoins('名人关注', 3); break;
      case 'inspector': if (totalEnergyCost(state) <= INSPECTOR_ENERGY_LIMIT) addCoins('检查员合规奖励', INSPECTOR_COMPLIANCE_REWARD); break;
      case 'bomb': { const paused = hasNeighbour(effectCabin, slot, ['cop']) && nextFloor % 2 === 0; if (!paused) rider.fuse = (rider.fuse ?? 1) - 1; break; }
    }
  });
  if (state.upgrades.solar && nextFloor % 4 === 0 && energySavings(state)>0) notes.push('节能线路已计入；所有节能效果逐项叠加');
  let arrivals = 0;
  cabin = cabin.map((rider, slot) => {
    if (!rider) return null;
    if (rider.kind === 'bomb' && (rider.fuse ?? 0) <= 0 && nextFloor < rider.destination) return rider;
    if (nextFloor < rider.destination) return rider;
    const spec = PASSENGERS[rider.kind]; const profile = riderProfile(rider, cabin, slot); let fare = profile.fare + (rider.volatile ? HIGH_RISK_BONUS : 0);
    if (rider.kind === 'lover') fare *= 1 + neighbours(slot).filter(nearby=>cabin[nearby]?.kind==='lover').length;
    if (rider.kind === 'thief' && hasNeighbour(cabin, slot, ['cop', 'lawyer'])) fare += 5;
    if (rider.kind === 'ghost' && hasNeighbour(cabin, slot, ['exorcist'])) fare += 6;
    if (rider.kind === 'coach') fare += neighbourCount(cabin, slot) * 3;
    if (rider.kind !== 'coach') fare = Math.ceil(fare * (1 + .5 * neighbours(slot).filter(nearby=>cabin[nearby]?.kind==='coach').length));
    fare += rider.fareBonus;
    const supportCount=bondStatus(rider,cabin,slot).supportCount;
    if (supportCount) fare += cooperationBonus(state)*supportCount;
    if (profile.hidden) notes.push(`${spec.name}封存车费揭晓：${profile.fare} 金币`);
    if (rider.kind === 'courier') adjustEnergy('快递员电池包', COURIER_ARRIVAL_CHARGE);
    addCoins(`${spec.name}${profile.hidden ? '揭晓车费' : '到站'}`, fare); arrivals += 1; return null;
  });
  // Arriving on the same floor as fuse expiry is still safe.
  const bombFailed = cabin.some((rider) => rider?.kind === 'bomb' && (rider.fuse ?? 0) <= 0);
  if (arrivals) adjustPressure('乘客到站舒缓', -1);
  if (energy > state.energyCap) adjustEnergy('超额回充未储存', state.energyCap - energy);
  energy = Math.min(state.energyCap, energy); stress = Math.max(0, stress);
  const checkpoint = nextFloor % 10 === 0;
  let status: RunState['status'] = checkpoint ? 'upgrade' : 'playing';
  let message = arrivals ? `${arrivals} 位乘客抵达。门再次开启。` : '电梯继续向上，新的面孔正在等候。';
  if (bombFailed) { status = 'lost'; message = '炸弹倒计时归零：乘客未能及时到站。午夜班次戛然而止。'; }
  else if (energy < 0 || (!checkpoint && energy === 0)) { status = 'lost'; message = '电量耗尽，轿厢停在了楼层之间。'; }
  else if (!checkpoint && stress >= state.stressCap) { status = 'lost'; message = '躁动突破上限，午夜班次失控。'; }
  if (stressReasons.length && status === 'playing') message = stressReasons.slice(0, 2).join(' · ');
  else if (notes.length && status === 'playing') message = notes.slice(0, 2).join(' · ');
  const lastEarnings = { total: coins - state.coins, sources: earningSources }; const lastPressure = { delta: stress - state.stress, sources: pressureSources }; const lastEnergy = { delta: energy - state.energy, sources: energySources }; const incomeNote = lastEarnings.total ? `+${lastEarnings.total} 金币 · ` : '';
  cabin = cabin.map(rider => rider?.kind === 'shifter' ? { ...rider, traits: randomTraits('shifter', unlockedAt(nextFloor), rng, (rider.traits?.revision ?? 0) + 1) } : rider);
  if (cabin.some(rider => rider?.kind === 'shifter') && status === 'playing') message += ' 百变人已变化，关门前查看新属性。';
  const crisis: UpgradeCrisis = energy <= 0 && stress >= state.stressCap ? 'both' : energy <= 0 ? 'energy' : stress >= state.stressCap ? 'stress' : null;
  const shop = status === 'upgrade' ? upgradeChoices(state.upgrades, rng, crisis).map((key) => ({ key, price: upgradePrice(key, nextFloor, state.upgrades[key]), purchased: false })) : [];
  return { ...state, floor: nextFloor, energy, stress, coins, restStops: 0, earned: state.earned + lastEarnings.total, shop, cabin, swapped: false, status, message, lastEarnings, lastPressure, lastEnergy, log: [`${String(nextFloor).padStart(2, '0')}F · ${incomeNote}${message}`, ...state.log].slice(0, 4) };
}

export type UpgradeCrisis = 'energy' | 'stress' | 'both' | null;
export const upgradeChoices = (upgrades: Record<UpgradeKey, number> = EMPTY_UPGRADES, rng: () => number = Math.random, crisis: UpgradeCrisis = null): UpgradeKey[] => {
  const pool = (Object.keys(UPGRADES) as UpgradeKey[]).filter((key) => !['express', 'solar', 'reinforced'].includes(key) || upgrades[key] < 1); const choices = shuffle(pool, rng).slice(0, 3);
  if ((crisis === 'both' || crisis === 'stress') && !choices.includes('calm')) choices[choices.length - 1] = 'calm';
  return choices;
  // Recharge is a permanent service, never dependent on a random card.
};

export function failureLesson(state: RunState): string {
  if (state.status !== 'lost') return '';
  if (state.message.includes('炸弹倒计时')) return '炸弹倒计时归零 · 下一班让炸弹客与警察相邻，使偶数层倒计时不减；来不及送达就拒载。';
  if (state.energy <= 0 && state.stress >= state.stressCap) return '双重失控 · 下一班提前留好维修预算，关门前先处理更接近上限的一项。';
  if (state.message.includes('电量')) return '电量耗尽 · 每站耗电＝运转1＋所有人物耗电−节能。下次少接高耗电长途客，并先留充电费再买升级。';
  if (state.message.includes('躁动')) {
    const source = state.lastPressure.sources.filter((line) => line.amount > 0).sort((a, b) => b.amount - a.amount)[0];
    return source ? `躁动失控 · 最后一层主要来源：${source.label} +${source.amount}。下一班让护士或音乐家靠近高躁动乘客。` : '躁动失控 · 下一班优先处理高危乘客与红色冲突。';
  }
  return '班次中断 · 下一班留意关门前的电量与躁动预报。';
}

export function previewUpgrade(current: RunState, key: UpgradeKey): RunState {
  const upgrades = { ...current.upgrades, [key]: current.upgrades[key] + 1 }; const energyCap = current.energyCap; const energy = current.energy; let stressCap = current.stressCap; let stress = current.stress; const weightCap = current.weightCap;
  if (key === 'calm') { stressCap += 1; stress = Math.max(0, stress - 2); }
  return { ...current, upgrades, energyCap, energy: Math.min(energyCap, energy), stressCap, stress, weightCap };
}

const BASE_PRICES: Record<UpgradeKey, number> = { battery: 60, solar: 55, calm: 35, concierge: 50, reinforced: 45, express: 65 };
export const upgradePrice = (key: UpgradeKey, floor: number, installed: number) => BASE_PRICES[key] + Math.max(0, Math.floor(floor / 10) - 1) * 12 + installed * 15;
export function installUpgrade(current: RunState, key: UpgradeKey): RunState {
  const card = current.shop.find((item) => item.key === key);
  if (current.status !== 'upgrade' || !card || card.purchased || current.coins < card.price || (['express','solar','reinforced'].includes(key) && current.upgrades[key] > 0)) return current;
  const preview = previewUpgrade(current, key);
  return { ...preview, coins: current.coins - card.price, shop: current.shop.map((item) => item.key === key ? { ...item, purchased: true } : item), message: `${UPGRADES[key].name}已购入，花费 ${card.price} 金币。`, lastEarnings: { total: 0, sources: [] }, lastPressure: { delta: 0, sources: [] }, lastEnergy: { delta: 0, sources: [] }, log: [`${current.floor}F · 购买${UPGRADES[key].name} −${card.price} 金币`, ...current.log].slice(0, 4) };
}

export function leaveShop(current: RunState): RunState {
  if (current.status !== 'upgrade') return current;
  const failed = current.energy <= 0 || current.stress >= current.stressCap;
  return { ...current, shop: [], status: failed ? 'lost' : 'playing', message: current.energy <= 0 ? '金币或维修不足，电量未能恢复。' : current.stress >= current.stressCap ? '维修后躁动仍然失控，班次结束。' : '维修层已离开，继续挑战更高楼层。' };
}

export const CHARGE_PRICE = 1;
export function chargingPlan(state: RunState) {
  const target = Math.min(state.energyCap, 50);
  const units = Math.max(0, target - state.energy);
  return {target,units,cost:units*CHARGE_PRICE,baseline:(nextShopFloor(state.floor)-state.floor)*travelEnergyCost(state.floor+1)};
}
export function chargeBattery(state: RunState, units: number): RunState {
  if(state.status!=='upgrade'||!Number.isSafeInteger(units)||units<=0||state.energy+units>state.energyCap||state.coins<units*CHARGE_PRICE)return state;
  const cost=units*CHARGE_PRICE;
  return {...state,energy:state.energy+units,coins:state.coins-cost,message:`充电 +${units}，支付 ${cost} 金币。`,lastEarnings:{total:0,sources:[]},lastEnergy:{delta:units,sources:[{label:'商店充电',amount:units}]},log:[`${state.floor}F · 充电 −${cost} 金币`,...state.log].slice(0,4)};
}
export const dismissalCost=(state: RunState,rider:Rider)=>4+Math.max(0,rider.destination-state.floor)*2;
export function dismissRider(state: RunState, id: string): RunState {
  const slot=state.cabin.findIndex(r=>r?.id===id),rider=state.cabin[slot];
  if(state.status!=='playing'||!rider||rider.boardedAt>=state.floor||rider.destination<=state.floor)return state;
  const cost=dismissalCost(state,rider);
  if(state.coins<cost)return state;
  const message=`已请离${PASSENGERS[rider.kind].name}，赔偿 ${cost} 金币；不结算到站收益。`;
  return {...state,coins:state.coins-cost,cabin:state.cabin.map((r,i)=>i===slot?null:r),message,log:[`${state.floor}F · ${message}`,...state.log].slice(0,4),lastEarnings:{total:0,sources:[]},lastEnergy:{delta:0,sources:[]},lastPressure:{delta:0,sources:[]}};
}
export function installedUpgradeSummary(state: RunState,key:UpgradeKey) {
 const count=state.upgrades[key];
 if(!count)return '未安装';
 switch(key){
  case 'battery':return `每条协作连接的到站加成 +${cooperationBonus(state)} 金币（基础3 + 升级${count*2}）。`;
  case 'solar':return '到4的倍数层抵消1点人物耗电；与维修工、受控幽灵逐项叠加。所有节能最多抵完人物耗电，稳压先算。';
  case 'calm':return `躁动上限 ${state.stressCap}；每次购买时立即舒缓2点`;
  case 'concierge':return `此后新乘客到站小费 +${count*3}；不参与车费倍率`;
  case 'reinforced':return '每站抵消1点人物耗电，不影响运转1电；无人耗电时不触发，本局唯一。';
  case 'express':return '新乘客原定路程≥5站时少坐1站；本局唯一';
 }
}
