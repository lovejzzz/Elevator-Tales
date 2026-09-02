'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { ArrowUp, BatteryCharging, BookOpen, Coins, Gauge, HelpCircle, LockKeyhole, RotateCcw, Sparkles, Volume2, VolumeX, Weight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ADJACENT, PASSENGER_ORDER, PASSENGERS, UNLOCK_TIERS, UPGRADES, type PassengerKind, type UpgradeKey } from '@/lib/game-data';

type Rider = { id: string; kind: PassengerKind; destination: number; patience: number; boardedAt: number; fuse?: number };
type DragPayload = { type: 'offer'; id: string } | { type: 'slot'; slot: number };
type RunState = {
  floor: number; energy: number; energyCap: number; stress: number; stressCap: number; weightCap: number; coins: number;
  cabin: Array<Rider | null>; swapped: boolean; upgrades: Record<UpgradeKey, number>;
  status: 'playing' | 'upgrade' | 'lost' | 'won'; message: string; log: string[];
};

const EMPTY_UPGRADES: Record<UpgradeKey, number> = { battery: 0, solar: 0, calm: 0, concierge: 0, reinforced: 0, express: 0 };
const initialRun = (): RunState => ({ floor: 1, energy: 15, energyCap: 24, stress: 0, stressCap: 15, weightCap: 10, coins: 0, cabin: Array(6).fill(null), swapped: false, upgrades: { ...EMPTY_UPGRADES }, status: 'playing', message: '门已开启。把候选人物直接拖进指定站位。', log: ['01F · 午夜班次开始'] });
const neighbours = (slot: number) => ADJACENT.flatMap(([a, b]) => a === slot ? [b] : b === slot ? [a] : []);
const hasNeighbour = (cabin: Array<Rider | null>, slot: number, kinds: PassengerKind[]) => neighbours(slot).some((i) => cabin[i] && kinds.includes(cabin[i]!.kind));
const neighbourCount = (cabin: Array<Rider | null>, slot: number) => neighbours(slot).filter((i) => cabin[i]).length;
const totalWeight = (cabin: Array<Rider | null>) => cabin.reduce((sum, rider) => sum + (rider ? PASSENGERS[rider.kind].weight : 0), 0);
const unlockedAt = (floor: number) => UNLOCK_TIERS.flatMap((tier) => tier.floor <= floor ? tier.kinds : []);
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function weightedKind(floor: number): PassengerKind {
  const pool = unlockedAt(floor);
  const total = pool.reduce((sum, kind) => sum + PASSENGERS[kind].rarity, 0);
  let roll = Math.random() * total;
  for (const kind of pool) { roll -= PASSENGERS[kind].rarity; if (roll <= 0) return kind; }
  return pool[0];
}

function makeOffers(floor: number, upgrades: Record<UpgradeKey, number>): Rider[] {
  const used = new Set<PassengerKind>();
  const firstShift: PassengerKind[] = ['commuter', 'courier', 'mechanic'];
  return Array.from({ length: 3 }, (_, index) => {
    let kind = floor === 1 ? firstShift[index] : weightedKind(floor); let guard = 0;
    while (used.has(kind) && guard++ < 15) kind = weightedKind(floor);
    used.add(kind);
    const spec = PASSENGERS[kind];
    const trip = Math.max(1, rand(spec.trip[0], spec.trip[1]) - upgrades.express);
    return { id: `f${floor}-${index}-${Math.random().toString(36).slice(2, 7)}`, kind, destination: Math.min(60, floor + trip), patience: trip + spec.patience + upgrades.concierge * 3, boardedAt: floor, fuse: kind === 'bomb' ? rand(3, 6) : undefined };
  });
}

function Portrait({ kind, large = false }: { kind: PassengerKind; large?: boolean }) {
  const spec = PASSENGERS[kind]; const x = spec.cell % 3; const y = Math.floor(spec.cell / 3);
  return <span className={`portrait-window ${large ? 'portrait-large' : ''}`} aria-hidden="true"><span className="portrait-sheet" style={{ backgroundImage: `url(/assets/passengers-${spec.sheet}.png)`, backgroundPosition: `${x * 50}% ${y * 100}%` }} /></span>;
}

function riderState(cabin: Array<Rider | null>, slot: number, weight: number): { label: string; tone: 'active' | 'warn' | 'neutral' } | null {
  const rider = cabin[slot];
  if (!rider) return null;
  switch (rider.kind) {
    case 'lover': return hasNeighbour(cabin, slot, ['lover']) ? { label: '已配对', tone: 'active' } : { label: '等待配对', tone: 'warn' };
    case 'thief': return hasNeighbour(cabin, slot, ['cop', 'lawyer']) ? { label: '已受控制', tone: 'active' } : { label: '未受控制', tone: 'warn' };
    case 'cop': return hasNeighbour(cabin, slot, ['thief', 'bomb']) ? { label: '正在控制', tone: 'active' } : null;
    case 'lawyer': return hasNeighbour(cabin, slot, ['thief']) ? { label: '正在控制', tone: 'active' } : null;
    case 'drunk': return hasNeighbour(cabin, slot, ['musician', 'nurse']) ? { label: '已被安抚', tone: 'active' } : { label: '不稳定', tone: 'warn' };
    case 'child': return hasNeighbour(cabin, slot, ['lover', 'musician', 'nurse']) ? { label: '有人照顾', tone: 'active' } : { label: '无人照顾', tone: 'warn' };
    case 'ghost': return hasNeighbour(cabin, slot, ['exorcist']) ? { label: '已被镇压', tone: 'active' } : { label: '正在作祟', tone: 'warn' };
    case 'exorcist': return hasNeighbour(cabin, slot, ['ghost']) ? { label: '正在驱魔', tone: 'active' } : null;
    case 'coach': { const count = neighbourCount(cabin, slot); return count ? { label: `激励 ${count} 人`, tone: 'active' } : { label: '等待邻座', tone: 'neutral' }; }
    case 'celebrity': { const count = neighbourCount(cabin, slot); return count === 1 ? { label: '状态最佳', tone: 'active' } : count > 1 ? { label: '被围住', tone: 'warn' } : { label: '缺少关注', tone: 'neutral' }; }
    case 'inspector': return weight <= 8 ? { label: '检查通过', tone: 'active' } : { label: '发现超载', tone: 'warn' };
    case 'musician': return cabin.filter(Boolean).length >= 4 ? { label: '正在演奏', tone: 'active' } : null;
    case 'nurse': return hasNeighbour(cabin, slot, ['drunk', 'child']) ? { label: '正在安抚', tone: 'active' } : null;
    default: return null;
  }
}

function upgradeImpact(key: UpgradeKey, run: RunState): string {
  switch (key) {
    case 'battery': return `能源 ${run.energy}/${run.energyCap} → ${Math.min(run.energyCap + 5, run.energy + 5)}/${run.energyCap + 5}`;
    case 'calm': return `压力 ${run.stress}/${run.stressCap} → ${Math.max(0, run.stress - 3)}/${run.stressCap + 3}`;
    case 'reinforced': return `载重上限 ${run.weightCap} → ${run.weightCap + 3}`;
    case 'solar': return `每四层回充 ${run.upgrades.solar + 1} 能源`;
    case 'concierge': return `新乘客额外耐心 +${(run.upgrades.concierge + 1) * 3}`;
    case 'express': return `新乘客路程缩短 ${run.upgrades.express + 1} 层`;
  }
}

function urgentUpgrade(key: UpgradeKey, run: RunState, weight: number) {
  return (key === 'battery' && run.energy <= 6) || (key === 'calm' && run.stress >= run.stressCap - 4) || (key === 'reinforced' && weight >= run.weightCap - 1);
}

function playTone(enabled: boolean, type: 'select' | 'depart' | 'arrive' | 'danger' | 'upgrade') {
  if (!enabled || typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  const notes = type === 'danger' ? [155, 128] : type === 'upgrade' ? [330, 440, 660] : type === 'depart' ? [220, 165] : type === 'arrive' ? [392, 523] : [440];
  notes.forEach((frequency, index) => {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = type === 'danger' ? 'sawtooth' : 'sine'; osc.frequency.value = frequency;
    gain.gain.setValueAtTime(.0001, ctx.currentTime + index * .08); gain.gain.exponentialRampToValueAtTime(.055, ctx.currentTime + index * .08 + .015); gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + index * .08 + .16);
    osc.connect(gain).connect(ctx.destination); osc.start(ctx.currentTime + index * .08); osc.stop(ctx.currentTime + index * .08 + .18);
  });
  setTimeout(() => ctx.close(), 700);
}

function resolveFloor(state: RunState): RunState {
  const nextFloor = state.floor + 1;
  let energy = state.energy - (nextFloor < 25 ? 2 : nextFloor < 50 ? 3 : 4); let stress = state.stress; let coins = state.coins;
  let cabin = state.cabin.map((rider) => rider ? { ...rider, patience: rider.patience - 1 } : null);
  const notes: string[] = []; const stressReasons: string[] = []; const occupied = cabin.filter(Boolean).length; const weight = totalWeight(cabin);
  const effectCabin = [...cabin]; const deferredSwaps: Array<[number, number]> = [];
  effectCabin.forEach((rider, slot) => {
    if (!rider) return;
    const calmDrunk = hasNeighbour(effectCabin, slot, ['musician', 'nurse']); const controlledThief = hasNeighbour(effectCabin, slot, ['cop', 'lawyer']);
    const pairedLover = hasNeighbour(effectCabin, slot, ['lover']); const controlledGhost = hasNeighbour(effectCabin, slot, ['exorcist']);
    switch (rider.kind) {
      case 'mechanic': if (nextFloor % 3 === 0) { energy += 1; notes.push('维修工回充 +1'); } break;
      case 'lover': if (pairedLover) coins += 1; else if (nextFloor % 2 === 0) rider.patience -= 1; break;
      case 'thief': coins += controlledThief ? 1 : 2; if (!controlledThief && nextFloor % 2 === 0) { stress += 1; stressReasons.push('小偷未受控制，压力 +1'); } break;
      case 'drunk': if (calmDrunk) coins += 1; else if (Math.random() < .25) { stress += 2; const options = neighbours(slot); deferredSwaps.push([slot, options[rand(0, options.length - 1)]]); stressReasons.push('醉汉闹事并乱换位，压力 +2'); } break;
      case 'musician': if (occupied >= 4) stress = Math.max(0, stress - 1); break;
      case 'nurse': if (nextFloor % 2 === 0) stress = Math.max(0, stress - 1); break;
      case 'child': if (!hasNeighbour(effectCabin, slot, ['lover', 'musician', 'nurse']) && nextFloor % 2 === 0) rider.patience -= 1; break;
      case 'ghost': if (controlledGhost) energy += 1; else if (nextFloor % 3 === 0) { const nearby = neighbours(slot).filter((i) => effectCabin[i]); if (nearby.length) { effectCabin[nearby[rand(0, nearby.length - 1)]]!.destination += 1; notes.push('幽灵令邻座延误一层'); } } break;
      case 'celebrity': { const count = neighbourCount(effectCabin, slot); if (count === 1) coins += 2; if (count > 1) { stress += 1; stressReasons.push('名人被多人围住，压力 +1'); } break; }
      case 'inspector': if (nextFloor % 2 === 0) { if (weight <= 8) energy += 1; else { stress += 1; stressReasons.push('检查员发现超载，压力 +1'); } } break;
      case 'bomb': { const paused = hasNeighbour(effectCabin, slot, ['cop']) && nextFloor % 2 === 0; if (!paused) rider.fuse = (rider.fuse ?? 1) - 1; break; }
    }
  });
  deferredSwaps.forEach(([from, to]) => { [cabin[from], cabin[to]] = [cabin[to], cabin[from]]; });
  if (state.upgrades.solar && nextFloor % 4 === 0) { energy += state.upgrades.solar; notes.push(`应急回充 +${state.upgrades.solar}`); }
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
    coins += fare; energy += spec.energy; arrivals += 1; return null;
  });
  let impatient = 0;
  cabin = cabin.map((rider) => { if (rider && rider.patience <= 0) { impatient += 1; stress += 2; return null; } return rider; });
  if (impatient) stressReasons.push(`${impatient} 位乘客失去耐心，压力 +${impatient * 2}`);
  energy = Math.min(state.energyCap, energy); stress = Math.max(0, stress);
  const bombFailed = cabin.some((rider) => rider?.kind === 'bomb' && (rider.fuse ?? 0) <= 0); const checkpoint = nextFloor % 10 === 0 && nextFloor < 60;
  let status: RunState['status'] = checkpoint ? 'upgrade' : 'playing';
  let message = arrivals ? `${arrivals} 位乘客抵达。门再次开启。` : '电梯继续向上，新的面孔正在等候。';
  if (impatient) message = `${impatient} 位乘客失去耐心离开，压力上升。`;
  if (bombFailed) { status = 'lost'; message = '引信熄灭前没能抵达。午夜班次戛然而止。'; }
  else if (!checkpoint && energy <= 0) { status = 'lost'; message = '能源耗尽，轿厢停在了楼层之间。'; }
  else if (!checkpoint && stress >= state.stressCap) { status = 'lost'; message = '压力突破上限，午夜班次失控。'; }
  else if (nextFloor >= 60) { status = 'won'; message = '六十层。城市在脚下安静下来，午夜班次完成。'; }
  if (stressReasons.length && status === 'playing') message = stressReasons.slice(0, 2).join(' · ');
  else if (notes.length && status === 'playing') message = notes.slice(0, 2).join(' · ');
  return { ...state, floor: nextFloor, energy, stress, coins, cabin, swapped: false, status, message, log: [`${String(nextFloor).padStart(2, '0')}F · ${message}`, ...state.log].slice(0, 4) };
}

const upgradeChoices = (): UpgradeKey[] => [...Object.keys(UPGRADES) as UpgradeKey[]].sort(() => Math.random() - .5).slice(0, 3);

export default function ElevatorGame() {
  const [run, setRun] = useState<RunState>(initialRun); const [offers, setOffers] = useState<Rider[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null); const [doors, setDoors] = useState<'open' | 'closing' | 'moving'>('open');
  const [pendingOfferId, setPendingOfferId] = useState<string | null>(null);
  const [dragged, setDragged] = useState<DragPayload | null>(null); const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [intro, setIntro] = useState(true); const [help, setHelp] = useState(false); const [archive, setArchive] = useState(false); const [sound, setSound] = useState(true);
  const [highest, setHighest] = useState(1); const [bestCoins, setBestCoins] = useState(0); const [choices, setChoices] = useState<UpgradeKey[]>([]); const busyRef = useRef(false);
  const locked = doors !== 'open' || run.status !== 'playing';

  useEffect(() => { setHighest(Math.max(1, Number(localStorage.getItem('elevator-tales-highest') || 1))); setBestCoins(Math.max(0, Number(localStorage.getItem('elevator-tales-best-coins') || 0))); setOffers(makeOffers(1, EMPTY_UPGRADES)); }, []);
  useEffect(() => { if (run.floor > highest) { setHighest(run.floor); localStorage.setItem('elevator-tales-highest', String(run.floor)); } if (run.status === 'upgrade') setChoices(upgradeChoices()); }, [run.floor, run.status, highest]);
  useEffect(() => { if ((run.status === 'lost' || run.status === 'won') && run.coins > bestCoins) { setBestCoins(run.coins); localStorage.setItem('elevator-tales-best-coins', String(run.coins)); } }, [run.status, run.coins, bestCoins]);
  const weight = useMemo(() => totalWeight(run.cabin), [run.cabin]); const unlocked = unlockedAt(Math.max(run.floor, highest));
  const riskWarnings = useMemo(() => Array.from(new Set(run.cabin.flatMap((rider, slot) => {
    if (!rider) return [];
    if (rider.kind === 'thief' && !hasNeighbour(run.cabin, slot, ['cop', 'lawyer'])) return ['小偷未受控制'];
    if (rider.kind === 'drunk' && !hasNeighbour(run.cabin, slot, ['musician', 'nurse'])) return ['醉汉未被安抚'];
    if (rider.kind === 'lover' && !hasNeighbour(run.cabin, slot, ['lover'])) return ['恋人尚未配对'];
    if (rider.kind === 'child' && !hasNeighbour(run.cabin, slot, ['lover', 'musician', 'nurse'])) return ['儿童无人照顾'];
    if (rider.kind === 'celebrity' && neighbourCount(run.cabin, slot) > 1) return ['名人被多人围住'];
    if (rider.kind === 'inspector' && weight > 8) return ['载重高于检查线'];
    if (rider.kind === 'bomb' && !hasNeighbour(run.cabin, slot, ['cop'])) return ['炸弹没有警察延缓'];
    return [];
  }))), [run.cabin, weight]);

  const reset = useCallback(() => { const fresh = initialRun(); setRun(fresh); setOffers(makeOffers(1, fresh.upgrades)); setSelectedSlot(null); setPendingOfferId(null); setDragged(null); setDragOverSlot(null); setDoors('open'); setIntro(false); busyRef.current = false; }, []);
  const toggleOffer = (offer: Rider) => {
    if (locked) return;
    const existing = run.cabin.findIndex((rider) => rider?.id === offer.id);
    if (existing >= 0) { setRun((current) => ({ ...current, cabin: current.cabin.map((rider, i) => i === existing ? null : rider), message: `${PASSENGERS[offer.kind].name}回到队伍中。` })); setPendingOfferId(null); playTone(sound, 'select'); return; }
    if (pendingOfferId === offer.id) { setPendingOfferId(null); setRun((current) => ({ ...current, message: '已取消安排。' })); return; }
    setPendingOfferId(offer.id); setSelectedSlot(null);
    setRun((current) => ({ ...current, message: `已选择${PASSENGERS[offer.kind].name}，现在点一个空位。` })); playTone(sound, 'select');
  };
  const clickSlot = (slot: number) => {
    if (locked) return;
    if (pendingOfferId) {
      const offer = offers.find((candidate) => candidate.id === pendingOfferId);
      if (!offer) { setPendingOfferId(null); return; }
      if (run.cabin[slot]) { setRun((current) => ({ ...current, message: `${slot + 1} 号位已经有人，请选择空位。` })); playTone(sound, 'danger'); return; }
      if (weight + PASSENGERS[offer.kind].weight > run.weightCap) { setRun((current) => ({ ...current, message: `载重会超出 ${run.weightCap}，无法上车。` })); setPendingOfferId(null); playTone(sound, 'danger'); return; }
      setRun((current) => ({ ...current, cabin: current.cabin.map((rider, i) => i === slot ? offer : rider), message: `${PASSENGERS[offer.kind].name}已站到 ${slot + 1} 号位。` }));
      setPendingOfferId(null); playTone(sound, 'select'); return;
    }
    if (run.swapped) return;
    if (selectedSlot === null) { if (run.cabin[slot]) setSelectedSlot(slot); return; }
    if (selectedSlot === slot) { setSelectedSlot(null); return; }
    setRun((current) => { const cabin = [...current.cabin]; [cabin[selectedSlot], cabin[slot]] = [cabin[slot], cabin[selectedSlot]]; return { ...current, cabin, swapped: true, message: '站位已调整。本层不能再次交换。' }; });
    setSelectedSlot(null); playTone(sound, 'select');
  };
  const startDrag = (event: DragEvent, payload: DragPayload) => {
    if (locked) { event.preventDefault(); return; }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/elevator-tales', JSON.stringify(payload));
    setPendingOfferId(null); setDragged(payload);
  };
  const endDrag = () => { setDragged(null); setDragOverSlot(null); };
  const dropOnSlot = (event: DragEvent, target: number) => {
    event.preventDefault();
    if (locked) return;
    let payload = dragged;
    try { payload = JSON.parse(event.dataTransfer.getData('application/elevator-tales')) as DragPayload; } catch { /* state fallback */ }
    if (!payload) return;
    if (payload.type === 'offer') {
      const offer = offers.find((candidate) => candidate.id === payload.id);
      if (!offer) return;
      setRun((current) => {
        const cabin = [...current.cabin];
        const source = cabin.findIndex((rider) => rider?.id === offer.id);
        if (source === target) return current;
        if (source >= 0) {
          if (current.swapped) return { ...current, message: '本层唯一一次换位已经用过。' };
          [cabin[source], cabin[target]] = [cabin[target], cabin[source]];
          return { ...current, cabin, swapped: true, message: `${PASSENGERS[offer.kind].name}已拖到 ${target + 1} 号位，本层换位已用。` };
        }
        if (cabin[target]) return { ...current, message: `${target + 1} 号位已经有人，请拖到空位。` };
        if (totalWeight(cabin) + PASSENGERS[offer.kind].weight > current.weightCap) return { ...current, message: `载重会超出 ${current.weightCap}，无法上车。` };
        cabin[target] = offer;
        return { ...current, cabin, message: `${PASSENGERS[offer.kind].name}已直接站到 ${target + 1} 号位。` };
      });
    } else if (payload.slot !== target) {
      setRun((current) => {
        if (current.swapped || !current.cabin[payload.slot]) return { ...current, message: current.swapped ? '本层唯一一次换位已经用过。' : current.message };
        const cabin = [...current.cabin];
        [cabin[payload.slot], cabin[target]] = [cabin[target], cabin[payload.slot]];
        return { ...current, cabin, swapped: true, message: `乘客已拖到 ${target + 1} 号位，本层换位已用。` };
      });
    }
    setDragged(null); setDragOverSlot(null); setSelectedSlot(null); setPendingOfferId(null); playTone(sound, 'select');
  };
  const depart = useCallback(() => {
    if (locked || busyRef.current) return;
    busyRef.current = true; setSelectedSlot(null); setPendingOfferId(null); setDoors('closing'); playTone(sound, 'depart'); setTimeout(() => setDoors('moving'), 420);
    setTimeout(() => { setRun((current) => { const resolved = resolveFloor(current); if (resolved.status === 'playing') setOffers(makeOffers(resolved.floor, resolved.upgrades)); playTone(sound, resolved.status === 'lost' ? 'danger' : 'arrive'); return resolved; }); setDoors('open'); busyRef.current = false; }, 920);
  }, [locked, sound]);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === 'Enter' && !intro && !help && !archive) depart(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [depart, intro, help, archive]);
  const chooseUpgrade = (key: UpgradeKey) => {
    setRun((current) => {
      const upgrades = { ...current.upgrades, [key]: current.upgrades[key] + 1 }; let energyCap = current.energyCap; let energy = current.energy; let stressCap = current.stressCap; let stress = current.stress; let weightCap = current.weightCap;
      if (key === 'battery') { energyCap += 5; energy += 5; } if (key === 'calm') { stressCap += 3; stress = Math.max(0, stress - 3); } if (key === 'reinforced') weightCap += 3;
      const rescued = energy <= 0 || stress >= stressCap; const status: RunState['status'] = rescued ? 'lost' : 'playing'; const message = rescued ? '升级来得太晚，轿厢仍未恢复稳定。' : `${UPGRADES[key].name}已安装。继续上行。`;
      const updated = { ...current, upgrades, energyCap, energy: Math.min(energyCap, energy), stressCap, stress, weightCap, status, message, log: [`${String(current.floor).padStart(2, '0')}F · 安装 ${UPGRADES[key].name}`, ...current.log].slice(0, 4) };
      if (status === 'playing') setOffers(makeOffers(current.floor, upgrades)); return updated;
    }); playTone(sound, 'upgrade');
  };

  return <main className="game-shell">
    <div className="ambient-grain" />
    <header className="brand-bar"><div><p className="eyebrow">A MIDNIGHT MANAGEMENT TALE</p><h1>Elevator Tales</h1></div><div className="brand-actions"><button className="icon-button" onClick={() => setHelp(true)} aria-label="玩法说明"><HelpCircle /></button><button className="icon-button" onClick={() => setSound((value) => !value)} aria-label={sound ? '关闭声音' : '打开声音'}>{sound ? <Volume2 /> : <VolumeX />}</button><button className="text-button" onClick={() => setArchive(true)}>乘客档案 <span>{String(unlocked.length).padStart(2, '0')} / 18</span></button></div></header>
    <section className="game-grid">
      <aside className="status-rail">
        <div className="floor-plaque"><span>FLOOR</span><strong>{String(run.floor).padStart(2, '0')}</strong><small>午夜班次</small></div>
        <div className="meter-card energy"><div><BatteryCharging /><span>能源</span><b>{run.energy}</b></div><div className="meter-track"><i style={{ width: `${Math.max(0, Math.min(100, run.energy / run.energyCap * 100))}%` }} /></div><small>{run.energyCap} MAX</small></div>
        <div className="meter-card pressure" title="乘客失去耐心或危险角色失控时，压力会上升"><div><Gauge /><span>压力</span><b>{run.stress}</b></div><div className="meter-track"><i style={{ width: `${Math.min(100, run.stress / run.stressCap * 100)}%` }} /></div><small>失控 / 离开 · {run.stressCap} LIMIT</small></div>
        <div className={`load-card ${weight > 8 ? 'load-warn' : ''}`}><Weight /><span>载重</span><b>{weight} / {run.weightCap}</b></div>
        <div className="score-card"><Coins /><span>本次收入</span><strong>{run.coins}</strong><small>最佳纪录 · {bestCoins}</small></div>
        <div className="event-log">{run.log.slice(0, 3).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div>
      </aside>
      <div className={`elevator-stage doors-${doors}`} role="region" aria-label="电梯座舱">
        <div className="elevator-image" /><div className="motion-lines" /><div className="floor-indicator"><ArrowUp /><b>{String(run.floor).padStart(2, '0')}</b></div><div className="cabin-title"><span>CAR № 07</span><i /><span>{run.cabin.filter(Boolean).length} / 6 OCCUPIED</span></div>
        <div className="standing-grid">{run.cabin.map((rider, index) => {
          const state = riderState(run.cabin, index, weight);
          return <button key={index} className={`standing-slot ${rider ? 'occupied' : ''} ${selectedSlot === index ? 'selected' : ''} ${dragOverSlot === index ? 'drag-target' : ''}`} onClick={() => clickSlot(index)} draggable={Boolean(rider) && !locked} onDragStart={(event) => rider && startDrag(event, { type: 'slot', slot: index })} onDragEnd={endDrag} onDragOver={(event) => { if (!locked) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDragOverSlot(index); } }} onDragLeave={() => setDragOverSlot((current) => current === index ? null : current)} onDrop={(event) => dropOnSlot(event, index)} aria-label={rider ? `${index + 1}号位，${PASSENGERS[rider.kind].name}${state ? `，${state.label}` : ''}` : `${index + 1}号空位`}>
            {rider ? <><Portrait kind={rider.kind} large /><span className="slot-destination">{rider.destination}F</span>{state && rider.kind !== 'bomb' && <span className={`slot-state ${state.tone}`}>{state.label}</span>}<span className="rider-name">{PASSENGERS[rider.kind].name}</span><span className={`patience patience-${Math.min(3, rider.patience)}`}>{'◆'.repeat(Math.max(0, Math.min(5, rider.patience)))}</span>{rider.fuse !== undefined && <span className="fuse">引信 {rider.fuse}</span>}</> : <span className="slot-number">{String(index + 1).padStart(2, '0')}</span>}
          </button>;
        })}</div>
        <div className="door door-left" /><div className="door door-right" />
        <div className="cabin-message" aria-live="polite"><Sparkles /><span>{run.message}</span></div><div className="swap-status">{pendingOfferId ? '点一个空位安排乘客' : run.swapped ? <><LockKeyhole /> 本层换位已用</> : selectedSlot !== null ? '再选一个站位完成交换' : '拖拽人物安排站位 · 也可点击换位'}</div>
      </div>
      <aside className="arrival-panel">
        <div className="arrival-heading"><div><span>{doors === 'open' ? 'DOORS OPEN' : 'IN TRANSIT'}</span><h2>谁要上楼？</h2></div><div className="arrival-count">3</div></div>
        <div className="passenger-list">{offers.map((offer) => { const spec = PASSENGERS[offer.kind]; const boarded = run.cabin.some((rider) => rider?.id === offer.id); const pending = pendingOfferId === offer.id; const tooHeavy = !boarded && weight + spec.weight > run.weightCap; const isDragging = dragged?.type === 'offer' && dragged.id === offer.id; return <button className={`passenger-card tone-${spec.tone} ${boarded ? 'boarded' : ''} ${pending ? 'pending' : ''} ${isDragging ? 'dragging' : ''}`} key={offer.id} onClick={() => toggleOffer(offer)} draggable={!locked && !tooHeavy} onDragStart={(event) => startDrag(event, { type: 'offer', id: offer.id })} onDragEnd={endDrag} disabled={locked || tooHeavy} aria-pressed={boarded || pending} title={spec.detail}><Portrait kind={offer.kind} /><span className="passenger-copy"><strong>{spec.name}</strong><small>{spec.title} · 前往 {offer.destination}F</small><span className="tag-row"><i>{spec.weight} 载重</i><i>{offer.patience} 耐心</i>{offer.fuse !== undefined && <i>引信 {offer.fuse}</i>}</span><em>{spec.short}</em></span><span className="select-mark">{boarded ? '✓' : pending ? '→' : tooHeavy ? '×' : '↗'}</span></button>; })}</div>
        <button className="depart-button" onClick={depart} disabled={locked}><span>{doors === 'open' ? '关门上行' : '正在上行'}</span><b>ENTER</b></button><p className={`panel-hint ${riskWarnings.length ? 'risk' : ''}`}>{pendingOfferId ? '已选中乘客 · 请点电梯里的目标空位' : riskWarnings.length ? `风险预警 · ${riskWarnings.slice(0, 2).join(' · ')}` : run.floor === 1 ? '拖拽，或点乘客再点空位；不必全部接上。' : '当前布局稳定 · 可安全关门'}</p>
      </aside>
    </section>
    <footer className="footer-line"><span>ELV–07 / v1.4</span><i /><span>THE CITY NEVER REALLY SLEEPS</span></footer>

    <Dialog open={intro} onOpenChange={setIntro}><DialogContent className="story-dialog intro-dialog" showCloseButton={false}><p className="dialog-kicker">CAR № 07 · 00:17 AM</p><DialogHeader><DialogTitle>今晚，所有人<br />都想再上一层。</DialogTitle><DialogDescription>安排六个站位，让合适的人彼此相邻。在能源耗尽、压力失控或危险爆发前，抵达六十层。</DialogDescription></DialogHeader><div className="intro-rules"><span><b>01</b> 拖拽或点选</span><span><b>02</b> 安排邻座</span><span><b>03</b> 关门上行</span></div><Button className="story-primary" onClick={() => setIntro(false)}>开始午夜班次 <ArrowUp /></Button><button className="story-link" onClick={() => { setIntro(false); setHelp(true); }}>先阅读值班手册</button></DialogContent></Dialog>
    <Dialog open={help} onOpenChange={setHelp}><DialogContent className="story-dialog manual-dialog"><p className="dialog-kicker">NIGHT OPERATOR&apos;S MANUAL</p><DialogHeader><DialogTitle>值班手册</DialogTitle><DialogDescription>每次上行都消耗能源，等待会消耗乘客耐心。耐心归零的乘客离开并增加压力。</DialogDescription></DialogHeader><div className="manual-grid"><div><b>安排站位</b><p>桌面端可把人物直接拖进空位；手机端点乘客，再点目标空位。</p></div><div><b>相邻关系</b><p>横向与纵向紧邻才算相邻。恋人、警察、音乐家等会因此改变表现。</p></div><div><b>压力来源</b><p>乘客失去耐心会增加2压力；小偷、醉汉、拥挤的名人和超载检查也会增加压力。</p></div><div><b>一次换位</b><p>轿厢内拖拽，或连续点两个站位完成交换；每层只能一次。</p></div><div><b>十层升级</b><p>每十层选择一项永久升级。撑到60层即完成班次。</p></div></div></DialogContent></Dialog>
    <Dialog open={archive} onOpenChange={setArchive}><DialogContent className="story-dialog archive-dialog"><p className="dialog-kicker">PASSENGER ARCHIVE</p><DialogHeader><DialogTitle>午夜乘客档案</DialogTitle><DialogDescription>最高抵达 {highest}F。更高楼层会出现更难处理的乘客。</DialogDescription></DialogHeader><div className="archive-grid">{PASSENGER_ORDER.map((kind) => { const open = unlocked.includes(kind); const spec = PASSENGERS[kind]; return <div className={`archive-item ${open ? '' : 'locked'}`} key={kind}>{open ? <Portrait kind={kind} /> : <LockKeyhole />}<span><b>{open ? spec.name : '未解锁'}</b><small>{open ? spec.short : '继续向上抵达新楼层'}</small></span></div>; })}</div></DialogContent></Dialog>
    <Dialog open={run.status === 'upgrade'}><DialogContent className="story-dialog upgrade-dialog" showCloseButton={false}><p className="dialog-kicker">FLOOR {run.floor} · MAINTENANCE STOP</p><DialogHeader><DialogTitle>选择一项轿厢升级</DialogTitle><DialogDescription>维修灯亮了。下方会按本局当前状态预览升级后的具体变化。</DialogDescription></DialogHeader><div className="upgrade-grid">{choices.map((key) => { const urgent = urgentUpgrade(key, run, weight); return <button className={urgent ? 'urgent' : ''} key={key} onClick={() => chooseUpgrade(key)}>{urgent && <span className="urgent-label">当前急需</span>}<Sparkles /><small>{UPGRADES[key].label}</small><b>{UPGRADES[key].name}</b><p>{UPGRADES[key].description}</p><em>{upgradeImpact(key, run)}</em></button>; })}</div></DialogContent></Dialog>
    <Dialog open={run.status === 'lost' || run.status === 'won'}><DialogContent className="story-dialog result-dialog" showCloseButton={false}><p className="dialog-kicker">SHIFT REPORT · {String(run.floor).padStart(2, '0')}F</p><DialogHeader><DialogTitle>{run.status === 'won' ? '天亮以前，抵达顶层。' : '这趟电梯，停下了。'}</DialogTitle><DialogDescription>{run.message}</DialogDescription></DialogHeader><div className="result-score"><span>本次收入 <b>{run.coins}</b></span><span>最佳收入 <b>{Math.max(run.coins, bestCoins)}</b></span><span>最高楼层 <b>{Math.max(run.floor, highest)}</b></span></div><Button className="story-primary" onClick={reset}><RotateCcw /> 再值一次午夜班</Button><button className="story-link" onClick={() => setArchive(true)}><BookOpen /> 查看乘客档案</button></DialogContent></Dialog>
  </main>;
}
