import { ADJACENT, PASSENGERS, UNLOCK_TIERS, UPGRADES, type PassengerKind, type UpgradeKey } from './game-data';

export type Rider = { id: string; kind: PassengerKind; destination: number; patience: number; boardedAt: number; fareBonus: number; fuse?: number; calledByLover?: boolean };
export type ChangeLine = { label: string; amount: number };
export type RunState = {
  floor: number; energy: number; energyCap: number; stress: number; stressCap: number; weightCap: number; coins: number;
  cabin: Array<Rider | null>; swapped: boolean; upgrades: Record<UpgradeKey, number>;
  status: 'playing' | 'upgrade' | 'lost' | 'won'; message: string; log: string[];
  lastEarnings: { total: number; sources: ChangeLine[] }; lastPressure: { delta: number; sources: ChangeLine[] }; lastEnergy: { delta: number; sources: ChangeLine[] };
};

export const EMPTY_UPGRADES: Record<UpgradeKey, number> = { battery: 0, solar: 0, calm: 0, concierge: 0, reinforced: 0, express: 0 };
export const LOVER_CALL_CHANCE = .25;
export const initialRun = (): RunState => ({ floor: 1, energy: 15, energyCap: 24, stress: 0, stressCap: 15, weightCap: 10, coins: 0, cabin: Array(6).fill(null), swapped: false, upgrades: { ...EMPTY_UPGRADES }, status: 'playing', message: '门已开启。把候选人物直接拖进指定站位。', log: ['01F · 午夜班次开始'], lastEarnings: { total: 0, sources: [] }, lastPressure: { delta: 0, sources: [] }, lastEnergy: { delta: 0, sources: [] } });

export const neighbours = (slot: number) => ADJACENT.flatMap(([a, b]) => a === slot ? [b] : b === slot ? [a] : []);
export const hasNeighbour = (cabin: Array<Rider | null>, slot: number, kinds: PassengerKind[]) => neighbours(slot).some((i) => cabin[i] && kinds.includes(cabin[i]!.kind));
export const neighbourCount = (cabin: Array<Rider | null>, slot: number) => neighbours(slot).filter((i) => cabin[i]).length;
export const totalWeight = (cabin: Array<Rider | null>) => cabin.reduce((sum, rider) => sum + (rider ? PASSENGERS[rider.kind].weight : 0), 0);
export const isFreeReseat = (cabin: Array<Rider | null>, source: number, target: number, floor: number) => Boolean(cabin[source] && cabin[source]!.boardedAt === floor && (!cabin[target] || cabin[target]!.boardedAt === floor));
export const unlockedAt = (floor: number) => UNLOCK_TIERS.flatMap((tier) => tier.floor <= floor ? tier.kinds : []);
const READY_PARTNERS: Partial<Record<PassengerKind, PassengerKind[]>> = { lover: ['lover'], thief: ['cop', 'lawyer'], cop: ['thief', 'bomb'], lawyer: ['thief'], drunk: ['musician', 'nurse'], musician: ['drunk', 'child'], nurse: ['drunk', 'child'], child: ['lover', 'musician', 'nurse'], ghost: ['exorcist'], exorcist: ['ghost'], bomb: ['cop'] };
export const readyPartner = (kind: PassengerKind, cabin: Array<Rider | null>, excludeId?: string): PassengerKind | null => {
  const partners = READY_PARTNERS[kind] ?? [];
  return partners.find((partner) => cabin.some((rider) => rider?.id !== excludeId && rider?.kind === partner)) ?? null;
};
export const rand = (min: number, max: number, rng: () => number = Math.random) => Math.floor(rng() * (max - min + 1)) + min;
export const travelEnergyCost = (destinationFloor: number) => destinationFloor < 25 ? 2 : destinationFloor < 50 ? 3 : 4;
export const emergencyEnergyRunway = (floor: number, floors = 3) => Array.from({ length: floors }, (_, index) => travelEnergyCost(Math.min(60, floor + index + 1))).reduce((sum, cost) => sum + cost, 1);
export const expressTrip = (baseTrip: number, installed: number) => installed > 0 && baseTrip >= 5 ? baseTrip - 1 : baseTrip;

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) { const target = rand(0, index, rng); [result[index], result[target]] = [result[target], result[index]]; }
  return result;
}

function weightedKind(floor: number, rng: () => number): PassengerKind {
  const pool = unlockedAt(floor);
  const total = pool.reduce((sum, kind) => sum + PASSENGERS[kind].rarity, 0);
  let roll = rng() * total;
  for (const kind of pool) { roll -= PASSENGERS[kind].rarity; if (roll <= 0) return kind; }
  return pool[0];
}

export function makeOffers(floor: number, upgrades: Record<UpgradeKey, number>, tutorial = false, rng: () => number = Math.random, cabin: Array<Rider | null> = [], loverCallChance = LOVER_CALL_CHANCE): Rider[] {
  const used = new Set<PassengerKind>();
  const firstShift: PassengerKind[] = ['lover', 'lover', 'courier']; const firstShiftTrips = [5, 5, 2]; const guidedShift = floor === 1 && tutorial;
  const waitingLover = cabin.some((rider, slot) => rider?.kind === 'lover' && !hasNeighbour(cabin, slot, ['lover']));
  const loverCalled = !tutorial && waitingLover && loverCallChance > 0 && rng() < loverCallChance;
  return Array.from({ length: 3 }, (_, index) => {
    let kind = guidedShift ? firstShift[index] : loverCalled && index === 0 ? 'lover' : weightedKind(floor, rng); let guard = 0;
    while (!guidedShift && used.has(kind) && guard++ < 15) kind = weightedKind(floor, rng);
    used.add(kind);
    const spec = PASSENGERS[kind];
    const baseTrip = guidedShift ? firstShiftTrips[index] : rand(spec.trip[0], spec.trip[1], rng);
    const trip = expressTrip(baseTrip, upgrades.express);
    return { id: `f${floor}-${index}-${rng().toString(36).slice(2, 7)}`, kind, destination: Math.min(60, floor + trip), patience: trip + spec.patience + upgrades.concierge * 3, boardedAt: floor, fareBonus: upgrades.concierge * 2, fuse: kind === 'bomb' ? rand(3, 6, rng) : undefined, calledByLover: loverCalled && index === 0 };
  });
}

export function resolveFloor(state: RunState, rng: () => number = Math.random): RunState {
  const nextFloor = state.floor + 1;
  const energyCost = travelEnergyCost(nextFloor);
  let energy = state.energy; let stress = state.stress; let coins = state.coins;
  const earningSources: ChangeLine[] = []; const pressureSources: ChangeLine[] = []; const energySources: ChangeLine[] = [];
  const addCoins = (label: string, amount: number) => { coins += amount; const existing = earningSources.find((line) => line.label === label); if (existing) existing.amount += amount; else earningSources.push({ label, amount }); };
  const adjustPressure = (label: string, amount: number) => { if (!amount) return; stress += amount; const existing = pressureSources.find((line) => line.label === label); if (existing) existing.amount += amount; else pressureSources.push({ label, amount }); };
  const adjustEnergy = (label: string, amount: number) => { if (!amount) return; energy += amount; const existing = energySources.find((line) => line.label === label); if (existing) existing.amount += amount; else energySources.push({ label, amount }); };
  adjustEnergy('行驶', -energyCost);
  let cabin = state.cabin.map((rider) => rider ? { ...rider, patience: rider.patience - 1 } : null);
  const notes: string[] = []; const stressReasons: string[] = []; const occupied = cabin.filter(Boolean).length; const weight = totalWeight(cabin);
  const effectCabin = [...cabin]; const deferredSwaps: Array<[number, number]> = [];
  effectCabin.forEach((rider, slot) => {
    if (!rider) return;
    const calmDrunk = hasNeighbour(effectCabin, slot, ['musician', 'nurse']); const controlledThief = hasNeighbour(effectCabin, slot, ['cop', 'lawyer']);
    const pairedLover = hasNeighbour(effectCabin, slot, ['lover']); const controlledGhost = hasNeighbour(effectCabin, slot, ['exorcist']);
    switch (rider.kind) {
      case 'mechanic': if (nextFloor % 3 === 0) { adjustEnergy('维修工回充', 1); notes.push('维修工回充 +1'); } break;
      case 'lover': if (pairedLover) addCoins('恋人连携', 1); break;
      case 'thief': addCoins(controlledThief ? '受控小偷' : '小偷', controlledThief ? 1 : 3); if (!controlledThief && nextFloor % 2 === 0) { adjustPressure('小偷未受控', 1); stressReasons.push('小偷未受控制，压力 +1'); } break;
      case 'drunk': if (calmDrunk) addCoins('醉汉安抚', 1); else if (rng() < .25) { adjustPressure('醉汉闹事', 2); const options = neighbours(slot); deferredSwaps.push([slot, options[rand(0, options.length - 1, rng)]]); stressReasons.push('醉汉闹事并乱换位，压力 +2'); } break;
      case 'musician': if (occupied >= 4) adjustPressure('音乐家安抚', -1); break;
      case 'nurse': if (nextFloor % 2 === 0) adjustPressure('护士安抚', -1); break;
      case 'child': if (!hasNeighbour(effectCabin, slot, ['lover', 'musician', 'nurse']) && nextFloor % 2 === 0) rider.patience -= 1; break;
      case 'ghost': if (controlledGhost) adjustEnergy('幽灵转能', 1); else if (nextFloor % 3 === 0) { const nearby = neighbours(slot).filter((i) => effectCabin[i]); if (nearby.length) { effectCabin[nearby[rand(0, nearby.length - 1, rng)]]!.destination += 1; notes.push('幽灵令邻座延误一层'); } } break;
      case 'celebrity': { const count = neighbourCount(effectCabin, slot); if (count === 1) addCoins('名人关注', 3); if (count > 1 && nextFloor % 2 === 0) { adjustPressure('名人被围', 1); stressReasons.push('名人被多人围住，压力 +1'); } break; }
      case 'inspector': if (nextFloor % 2 === 0) { if (weight <= 8) adjustEnergy('检查通过', 1); else { adjustPressure('检查员超载', 1); stressReasons.push('检查员发现超载，压力 +1'); } } break;
      case 'bomb': { const paused = hasNeighbour(effectCabin, slot, ['cop']) && nextFloor % 2 === 0; if (!paused) rider.fuse = (rider.fuse ?? 1) - 1; break; }
    }
  });
  deferredSwaps.forEach(([from, to]) => { [cabin[from], cabin[to]] = [cabin[to], cabin[from]]; });
  if (state.upgrades.solar && nextFloor % 4 === 0) { adjustEnergy('应急回充', state.upgrades.solar); notes.push(`应急回充 +${state.upgrades.solar}`); }
  let arrivals = 0;
  cabin = cabin.map((rider, slot) => {
    if (!rider) return null;
    if (rider.kind === 'bomb' && (rider.fuse ?? 0) <= 0 && nextFloor < rider.destination) return rider;
    if (nextFloor < rider.destination) return rider;
    const spec = PASSENGERS[rider.kind]; let fare = spec.fare;
    if (rider.kind === 'lover' && hasNeighbour(cabin, slot, ['lover'])) fare *= 2;
    if (rider.kind === 'thief' && hasNeighbour(cabin, slot, ['cop', 'lawyer'])) fare += 5;
    if (rider.kind === 'ghost' && hasNeighbour(cabin, slot, ['exorcist'])) fare += 6;
    if (rider.kind === 'coach') fare += neighbourCount(cabin, slot) * 3;
    if (hasNeighbour(cabin, slot, ['coach']) && rider.kind !== 'coach') fare = Math.ceil(fare * 1.5);
    fare += rider.fareBonus;
    addCoins(`${spec.name}到站`, fare); adjustEnergy(`${spec.name}到站`, spec.energy); arrivals += 1; return null;
  });
  let impatient = 0;
  cabin = cabin.map((rider) => { if (rider && rider.patience <= 0) { impatient += 1; adjustPressure('耐心归零', 2); return null; } return rider; });
  if (impatient) stressReasons.push(`${impatient} 位乘客失去耐心，压力 +${impatient * 2}`);
  if (energy > state.energyCap) adjustEnergy('超额回充未储存', state.energyCap - energy);
  energy = Math.min(state.energyCap, energy); stress = Math.max(0, stress);
  const bombFailed = cabin.some((rider) => rider?.kind === 'bomb' && (rider.fuse ?? 0) <= 0); const checkpoint = nextFloor % 10 === 0 && nextFloor < 60;
  let status: RunState['status'] = checkpoint ? 'upgrade' : 'playing';
  let message = arrivals ? `${arrivals} 位乘客抵达。门再次开启。` : '电梯继续向上，新的面孔正在等候。';
  if (impatient) message = `${impatient} 位乘客失去耐心离开，压力上升。`;
  if (bombFailed) { status = 'lost'; message = '引信熄灭前没能抵达。午夜班次戛然而止。'; }
  else if (checkpoint && energy <= 0 && stress >= state.stressCap) { status = 'lost'; message = '能源耗尽且压力突破上限，维修层也无法同时挽回。'; }
  else if (!checkpoint && energy <= 0) { status = 'lost'; message = '能源耗尽，轿厢停在了楼层之间。'; }
  else if (!checkpoint && stress >= state.stressCap) { status = 'lost'; message = '压力突破上限，午夜班次失控。'; }
  else if (nextFloor >= 60) { status = 'won'; message = '六十层。城市在脚下安静下来，午夜班次完成。'; }
  if (stressReasons.length && status === 'playing') message = stressReasons.slice(0, 2).join(' · ');
  else if (notes.length && status === 'playing') message = notes.slice(0, 2).join(' · ');
  const lastEarnings = { total: coins - state.coins, sources: earningSources }; const lastPressure = { delta: stress - state.stress, sources: pressureSources }; const lastEnergy = { delta: energy - state.energy, sources: energySources }; const incomeNote = lastEarnings.total ? `+${lastEarnings.total} 金币 · ` : '';
  return { ...state, floor: nextFloor, energy, stress, coins, cabin, swapped: false, status, message, lastEarnings, lastPressure, lastEnergy, log: [`${String(nextFloor).padStart(2, '0')}F · ${incomeNote}${message}`, ...state.log].slice(0, 4) };
}

export type UpgradeCrisis = 'energy' | 'stress' | null;
export const upgradeChoices = (upgrades: Record<UpgradeKey, number> = EMPTY_UPGRADES, rng: () => number = Math.random, crisis: UpgradeCrisis = null): UpgradeKey[] => {
  const pool = (Object.keys(UPGRADES) as UpgradeKey[]).filter((key) => key !== 'express' || upgrades.express < 1); const choices = shuffle(pool, rng).slice(0, 3);
  const rescues: UpgradeKey[] = crisis === 'energy' ? ['battery', 'reinforced'] : crisis === 'stress' ? ['calm'] : [];
  if (rescues.length && !choices.some((key) => rescues.includes(key))) { const rescue = shuffle(rescues.filter((key) => pool.includes(key)), rng)[0]; if (rescue) choices[choices.length - 1] = rescue; }
  return choices;
};

export function failureLesson(state: RunState): string {
  if (state.status !== 'lost') return '';
  if (state.message.includes('能源') && state.message.includes('压力')) return '双重失控 · 下一班不要同时透支能源与压力；关门前先处理更接近上限的一项。';
  if (state.message.includes('引信')) return '引信归零 · 下一班让炸弹客与警察相邻以延缓；来不及送达就拒载。';
  if (state.message.includes('能源')) return '能源耗尽 · 下一班优先短途和高回能乘客；低于下一层耗能时不要空驶。';
  if (state.message.includes('压力')) {
    const source = state.lastPressure.sources.filter((line) => line.amount > 0).sort((a, b) => b.amount - a.amount)[0];
    return source ? `压力失控 · 最后一层主要来源：${source.label} +${source.amount}。下一班先解除人物风险。` : '压力失控 · 下一班先控制小偷、安抚醉汉，并避免检查员发现超载。';
  }
  return '班次中断 · 下一班留意关门前的能源与压力预报。';
}

export function installUpgrade(current: RunState, key: UpgradeKey): RunState {
  const energyCrisis = current.energy <= 0; const stressCrisis = current.stress >= current.stressCap;
  const upgrades = { ...current.upgrades, [key]: current.upgrades[key] + 1 }; let energyCap = current.energyCap; let energy = current.energy; let stressCap = current.stressCap; let stress = current.stress; let weightCap = current.weightCap;
  if (key === 'battery') { energyCap += 5; energy += 5; } if (key === 'calm') { stressCap += 3; stress = Math.max(0, stress - 3); } if (key === 'reinforced') { weightCap += 3; energyCap += 3; energy += 3; }
  if (energyCrisis && (key === 'battery' || key === 'reinforced')) energy = Math.max(emergencyEnergyRunway(current.floor), energy);
  if (stressCrisis && key === 'calm') stress = Math.min(stress, stressCap - 1);
  const stillFailed = energy <= 0 || stress >= stressCap; const status: RunState['status'] = stillFailed ? 'lost' : 'playing';
  const message = energy <= 0 ? '能源仍未恢复，轿厢停在维修层。' : stress >= stressCap ? '压力仍然超出上限，班次在维修层终止。' : energyCrisis ? `${UPGRADES[key].name}已安装，应急电量可覆盖三层基础行驶。` : `${UPGRADES[key].name}已安装。继续上行。`;
  return { ...current, upgrades, energyCap, energy: Math.min(energyCap, energy), stressCap, stress, weightCap, status, message, lastEarnings: { total: 0, sources: [] }, lastPressure: { delta: 0, sources: [] }, lastEnergy: { delta: 0, sources: [] }, log: [`${String(current.floor).padStart(2, '0')}F · 安装 ${UPGRADES[key].name}`, ...current.log].slice(0, 4) };
}
