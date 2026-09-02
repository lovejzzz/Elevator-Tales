'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { ArrowUp, BatteryCharging, BookOpen, Coins, Gauge, HelpCircle, LockKeyhole, RotateCcw, Sparkles, Volume2, VolumeX, Weight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ADJACENT, PASSENGER_ORDER, PASSENGERS, SCORE_RANKS, UPGRADES, type PassengerKind, type UpgradeKey } from '@/lib/game-data';
import { EMPTY_UPGRADES, hasNeighbour, initialRun, installUpgrade, isFreeReseat, makeOffers, neighbourCount, neighbours, resolveFloor, totalWeight, unlockedAt, upgradeChoices, type Rider, type RunState } from '@/lib/game-engine';

type DragPayload = { type: 'offer'; id: string } | { type: 'slot'; slot: number };

const signedDelta = (value: number) => value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '不变';
const scoreRank = (coins: number) => {
  const index = SCORE_RANKS.findLastIndex((rank) => coins >= rank.min);
  return { ...SCORE_RANKS[Math.max(0, index)], next: SCORE_RANKS[index + 1] ?? null };
};
const shiftPhase = (floor: number) => floor >= 60 ? '天台抵达' : floor >= 50 ? `黎明将至 · 剩${60 - floor}层` : floor >= 40 ? '危险区段' : floor >= 25 ? '高层夜色' : floor >= 10 ? '城市深处' : '午夜启程';

function Portrait({ kind, large = false }: { kind: PassengerKind; large?: boolean }) {
  const spec = PASSENGERS[kind]; const x = spec.cell % 3; const y = Math.floor(spec.cell / 3);
  return <span className={`portrait-window ${large ? 'portrait-large' : ''}`} aria-hidden="true"><span className="portrait-sheet" style={{ backgroundImage: `url(/assets/passengers-${spec.sheet}.png)`, backgroundPosition: `${x * 50}% ${y * 100}%` }} /></span>;
}

function riderState(cabin: Array<Rider | null>, slot: number, weight: number): { label: string; tone: 'active' | 'warn' | 'neutral' } | null {
  const rider = cabin[slot];
  if (!rider) return null;
  switch (rider.kind) {
    case 'lover': return hasNeighbour(cabin, slot, ['lover']) ? { label: '已配对', tone: 'active' } : { label: '正在呼唤同伴', tone: 'neutral' };
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

function activeConnection(cabin: Array<Rider | null>, first: number, second: number): boolean {
  const a = cabin[first]; const b = cabin[second];
  if (!a || !b) return false;
  const supports = (source: PassengerKind, target: PassengerKind, sourceSlot: number) => {
    if (source === 'lover') return target === 'lover';
    if (source === 'thief') return target === 'cop' || target === 'lawyer';
    if (source === 'cop') return target === 'thief' || target === 'bomb';
    if (source === 'lawyer') return target === 'thief';
    if (source === 'drunk') return target === 'musician' || target === 'nurse';
    if (source === 'child') return target === 'lover' || target === 'musician' || target === 'nurse';
    if (source === 'ghost') return target === 'exorcist';
    if (source === 'exorcist') return target === 'ghost';
    if (source === 'bomb') return target === 'cop';
    if (source === 'coach') return true;
    if (source === 'celebrity') return neighbourCount(cabin, sourceSlot) === 1;
    return false;
  };
  return supports(a.kind, b.kind, first) || supports(b.kind, a.kind, second);
}

const CONNECTION_POINTS = [[47, 50], [150, 50], [253, 50], [47, 150], [150, 150], [253, 150]];

function upgradeImpact(key: UpgradeKey, run: RunState): string {
  switch (key) {
    case 'battery': return `能源 ${run.energy}/${run.energyCap} → ${Math.min(run.energyCap + 5, run.energy + 5)}/${run.energyCap + 5}`;
    case 'calm': return `压力 ${run.stress}/${run.stressCap} → ${Math.max(0, run.stress - 3)}/${run.stressCap + 3}`;
    case 'reinforced': return `载重 ${run.weightCap} → ${run.weightCap + 3} · 能源 ${run.energy}/${run.energyCap} → ${Math.min(run.energyCap + 3, run.energy + 3)}/${run.energyCap + 3}`;
    case 'solar': return `每四层回充 ${run.upgrades.solar + 1} 能源`;
    case 'concierge': return `新乘客耐心 +${(run.upgrades.concierge + 1) * 3} · 到站小费 +${(run.upgrades.concierge + 1) * 2}`;
    case 'express': return '长途新乘客路程缩短 1 层 · 最低 3 层 · 本局唯一';
  }
}

type StressForecast = { range: string; details: string; summary: string; tone: 'safe' | 'caution' | 'danger' };
type EnergyForecast = { range: string; summary: string; danger: boolean };

function stressForecast(state: RunState, weight: number): StressForecast {
  const nextFloor = state.floor + 1;
  const occupied = state.cabin.filter(Boolean).length;
  let impatient = 0; let thieves = 0; let drunks = 0; let celebrities = 0; let inspectors = 0; let relief = 0;
  state.cabin.forEach((rider, slot) => {
    if (!rider) return;
    const unattendedChild = rider.kind === 'child' && !hasNeighbour(state.cabin, slot, ['lover', 'musician', 'nurse']);
    const projectedPatience = rider.patience - 1 - (nextFloor % 2 === 0 && unattendedChild ? 1 : 0);
    if (nextFloor < rider.destination && projectedPatience <= 0) impatient += 1;
    switch (rider.kind) {
      case 'thief': if (!hasNeighbour(state.cabin, slot, ['cop', 'lawyer']) && nextFloor % 2 === 0) thieves += 1; break;
      case 'drunk': if (!hasNeighbour(state.cabin, slot, ['musician', 'nurse'])) drunks += 1; break;
      case 'musician': if (occupied >= 4) relief += 1; break;
      case 'nurse': if (nextFloor % 2 === 0) relief += 1; break;
      case 'celebrity': if (nextFloor % 2 === 0 && neighbourCount(state.cabin, slot) > 1) celebrities += 1; break;
      case 'inspector': if (nextFloor % 2 === 0 && weight > 8) inspectors += 1; break;
    }
  });
  const fixedRise = impatient * 2 + thieves + celebrities + inspectors;
  const low = Math.max(0, state.stress + fixedRise - relief);
  const high = Math.max(0, state.stress + fixedRise + drunks * 2 - relief);
  const lowDelta = low - state.stress; const highDelta = high - state.stress;
  const range = lowDelta === highDelta ? signedDelta(lowDelta) : `${signedDelta(lowDelta)}～${signedDelta(highDelta)}`;
  const reasons = [
    impatient ? `${impatient} 人耐心归零 +${impatient * 2}` : '',
    thieves ? `小偷 +${thieves}` : '',
    celebrities ? `名人 +${celebrities}` : '',
    inspectors ? `超载检查 +${inspectors}` : '',
    drunks ? `醉汉 ${Math.round((1 - .75 ** drunks) * 100)}% 概率闹事` : '',
    relief ? `安抚 −${relief}` : '',
  ].filter(Boolean);
  const details = reasons.join(' · ');
  const summary = details ? `下一层 ${range} · ${details}` : '下一层压力不变 · 没有已知来源';
  const tone = state.stress + highDelta >= state.stressCap || lowDelta >= 2 ? 'danger' : highDelta > 0 ? 'caution' : 'safe';
  return { range, details, summary, tone };
}

function energyForecast(state: RunState, weight: number): EnergyForecast {
  const nextFloor = state.floor + 1; const drain = nextFloor < 25 ? 2 : nextFloor < 50 ? 3 : 4;
  let fixedGain = 0; const reasons: string[] = [];
  state.cabin.forEach((rider, slot) => {
    if (!rider) return;
    if (rider.kind === 'mechanic' && nextFloor % 3 === 0) fixedGain += 1;
    if (rider.kind === 'ghost' && hasNeighbour(state.cabin, slot, ['exorcist'])) fixedGain += 1;
    if (rider.kind === 'inspector' && nextFloor % 2 === 0 && weight <= 8) fixedGain += 1;
  });
  if (state.upgrades.solar && nextFloor % 4 === 0) fixedGain += state.upgrades.solar;
  let destinations: Array<Array<number | null>> = [state.cabin.map((rider) => rider?.destination ?? null)];
  if (nextFloor % 3 === 0) state.cabin.forEach((rider, slot) => {
    if (rider?.kind !== 'ghost' || hasNeighbour(state.cabin, slot, ['exorcist'])) return;
    const targets = neighbours(slot).filter((index) => state.cabin[index]);
    if (targets.length) destinations = destinations.flatMap((variant) => targets.map((target) => variant.map((destination, index) => index === target && destination !== null ? destination + 1 : destination)));
  });
  const deltas = destinations.map((variant) => {
    const arrivalGain = state.cabin.reduce((sum, rider, index) => sum + (rider && variant[index] !== null && nextFloor >= variant[index]! ? PASSENGERS[rider.kind].energy : 0), 0);
    return Math.min(state.energyCap, state.energy - drain + fixedGain + arrivalGain) - state.energy;
  });
  const low = Math.min(...deltas); const high = Math.max(...deltas); const range = low === high ? signedDelta(low) : `${signedDelta(low)}～${signedDelta(high)}`;
  const arrivals = state.cabin.filter((rider) => rider && nextFloor >= rider.destination).length;
  reasons.push(`行驶 −${drain}`); if (fixedGain) reasons.push(`效果 +${fixedGain}`); if (arrivals) reasons.push(`${arrivals} 人可能到站回充`);
  const danger = state.energy + low <= 0;
  return { range, summary: `下一层能源 ${range} · ${reasons.join(' · ')}`, danger };
}

function playTone(enabled: boolean, type: 'select' | 'depart' | 'arrive' | 'danger' | 'upgrade' | 'victory') {
  if (!enabled || typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  const notes = type === 'danger' ? [155, 128] : type === 'victory' ? [392, 523, 659, 784] : type === 'upgrade' ? [330, 440, 660] : type === 'depart' ? [220, 165] : type === 'arrive' ? [392, 523] : [440];
  notes.forEach((frequency, index) => {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = type === 'danger' ? 'sawtooth' : 'sine'; osc.frequency.value = frequency;
    gain.gain.setValueAtTime(.0001, ctx.currentTime + index * .08); gain.gain.exponentialRampToValueAtTime(.055, ctx.currentTime + index * .08 + .015); gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + index * .08 + .16);
    osc.connect(gain).connect(ctx.destination); osc.start(ctx.currentTime + index * .08); osc.stop(ctx.currentTime + index * .08 + .18);
  });
  setTimeout(() => ctx.close(), type === 'victory' ? 1100 : 700);
}

export default function ElevatorGame() {
  const [run, setRun] = useState<RunState>(initialRun); const [offers, setOffers] = useState<Rider[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null); const [doors, setDoors] = useState<'open' | 'closing' | 'moving'>('open');
  const [pendingOfferId, setPendingOfferId] = useState<string | null>(null);
  const [dragged, setDragged] = useState<DragPayload | null>(null); const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [intro, setIntro] = useState(true); const [help, setHelp] = useState(false); const [pressureHelp, setPressureHelp] = useState(false); const [archive, setArchive] = useState(false); const [sound, setSound] = useState(true);
  const [highest, setHighest] = useState(1); const [bestCoins, setBestCoins] = useState(0); const [runStartBest, setRunStartBest] = useState(0); const [choices, setChoices] = useState<UpgradeKey[]>([]); const busyRef = useRef(false);
  const locked = doors !== 'open' || run.status !== 'playing';

  useEffect(() => { const savedBest = Math.max(0, Number(localStorage.getItem('elevator-tales-best-coins') || 0)); const savedHighest = Math.max(1, Number(localStorage.getItem('elevator-tales-highest') || 1)); setHighest(savedHighest); setBestCoins(savedBest); setRunStartBest(savedBest); setOffers(makeOffers(1, EMPTY_UPGRADES, savedHighest <= 1)); }, []);
  useEffect(() => { if (run.floor > highest) { setHighest(run.floor); localStorage.setItem('elevator-tales-highest', String(run.floor)); } if (run.status === 'upgrade') setChoices(upgradeChoices(run.upgrades)); }, [run.floor, run.status, run.upgrades, highest]);
  useEffect(() => { if ((run.status === 'lost' || run.status === 'won') && run.coins > bestCoins) { setBestCoins(run.coins); localStorage.setItem('elevator-tales-best-coins', String(run.coins)); } }, [run.status, run.coins, bestCoins]);
  const weight = useMemo(() => totalWeight(run.cabin), [run.cabin]); const unlocked = unlockedAt(Math.max(run.floor, highest));
  const pressurePreview = useMemo(() => stressForecast(run, weight), [run, weight]); const energyPreview = useMemo(() => energyForecast(run, weight), [run, weight]);
  const rank = scoreRank(run.coins); const forecastTone = energyPreview.danger ? 'danger' : pressurePreview.tone;
  const previousRank = scoreRank(Math.max(0, run.coins - run.lastEarnings.total)); const rankedUp = run.lastEarnings.total > 0 && previousRank.grade !== rank.grade;
  const rankProgress = rank.next ? Math.max(0, Math.min(100, (run.coins - rank.min) / (rank.next.min - rank.min) * 100)) : 100;
  const phase = shiftPhase(run.floor); const upgradeCount = Object.values(run.upgrades).reduce((sum, count) => sum + count, 0); const floorsLeft = Math.max(0, 60 - run.floor);
  const sTarget = SCORE_RANKS[SCORE_RANKS.length - 1].min; const sGap = Math.max(0, sTarget - run.coins); const sprintPace = floorsLeft * 23;
  const earningSummary = run.lastEarnings.sources.slice(0, 2).map((line) => `${line.label} +${line.amount}`).join(' · ') + (run.lastEarnings.sources.length > 2 ? ` · 另 ${run.lastEarnings.sources.length - 2} 项` : '');
  const pressureSummary = run.lastPressure.sources.slice(0, 2).map((line) => `${line.label} ${signedDelta(line.amount)}`).join(' · ') + (run.lastPressure.sources.length > 2 ? ` · 另 ${run.lastPressure.sources.length - 2} 项` : '');
  const energySummary = run.lastEnergy.sources.slice(0, 2).map((line) => `${line.label} ${signedDelta(line.amount)}`).join(' · ') + (run.lastEnergy.sources.length > 2 ? ` · 另 ${run.lastEnergy.sources.length - 2} 项` : '');
  const departureForecast = `下一层 · 能源 ${energyPreview.range} · 压力 ${pressurePreview.range}${pressurePreview.details ? ` · ${pressurePreview.details}` : ''}`;
  const nextRankGoal = rank.next ? `再赚 ${rank.next.min - run.coins} 金币可升至 ${rank.next.grade} 级` : '';
  const resultChallenge = run.coins > runStartBest ? `新纪录 · 比原纪录多 ${run.coins - runStartBest} 金币${nextRankGoal ? ` · ${nextRankGoal}` : ''}` : rank.next ? `${nextRankGoal}${runStartBest > run.coins ? ` · 距个人最佳 ${runStartBest - run.coins}` : ''}` : '已达最高评级 · 下一班继续刷新纪录';

  const reset = useCallback(() => { const fresh = initialRun(); setRunStartBest(bestCoins); setRun(fresh); setOffers(makeOffers(1, fresh.upgrades)); setSelectedSlot(null); setPendingOfferId(null); setDragged(null); setDragOverSlot(null); setDoors('open'); setIntro(false); busyRef.current = false; }, [bestCoins]);
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
    if (selectedSlot === null) { const rider = run.cabin[slot]; if (rider && (!run.swapped || rider.boardedAt === run.floor)) setSelectedSlot(slot); return; }
    if (selectedSlot === slot) { setSelectedSlot(null); return; }
    setRun((current) => {
      const freeReseat = isFreeReseat(current.cabin, selectedSlot, slot, current.floor);
      if (current.swapped && !freeReseat) return { ...current, message: '本层旧乘客的唯一一次换位已经用过。' };
      const cabin = [...current.cabin]; [cabin[selectedSlot], cabin[slot]] = [cabin[slot], cabin[selectedSlot]];
      return { ...current, cabin, swapped: current.swapped || !freeReseat, message: freeReseat ? '本层新乘客已重新安排，不消耗换位。' : '站位已调整。本层不能再次交换旧乘客。' };
    });
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
          const freeReseat = isFreeReseat(cabin, source, target, current.floor);
          if (current.swapped && !freeReseat) return { ...current, message: '本层旧乘客的唯一一次换位已经用过。' };
          [cabin[source], cabin[target]] = [cabin[target], cabin[source]];
          return { ...current, cabin, swapped: current.swapped || !freeReseat, message: freeReseat ? `${PASSENGERS[offer.kind].name}已重新安排，不消耗换位。` : `${PASSENGERS[offer.kind].name}已拖到 ${target + 1} 号位，本层旧乘客换位已用。` };
        }
        if (cabin[target]) return { ...current, message: `${target + 1} 号位已经有人，请拖到空位。` };
        if (totalWeight(cabin) + PASSENGERS[offer.kind].weight > current.weightCap) return { ...current, message: `载重会超出 ${current.weightCap}，无法上车。` };
        cabin[target] = offer;
        return { ...current, cabin, message: `${PASSENGERS[offer.kind].name}已直接站到 ${target + 1} 号位。` };
      });
    } else if (payload.slot !== target) {
      setRun((current) => {
        if (!current.cabin[payload.slot]) return current;
        const freeReseat = isFreeReseat(current.cabin, payload.slot, target, current.floor);
        if (current.swapped && !freeReseat) return { ...current, message: '本层旧乘客的唯一一次换位已经用过。' };
        const cabin = [...current.cabin];
        [cabin[payload.slot], cabin[target]] = [cabin[target], cabin[payload.slot]];
        return { ...current, cabin, swapped: current.swapped || !freeReseat, message: freeReseat ? '本层新乘客已重新安排，不消耗换位。' : `乘客已拖到 ${target + 1} 号位，本层旧乘客换位已用。` };
      });
    }
    setDragged(null); setDragOverSlot(null); setSelectedSlot(null); setPendingOfferId(null); playTone(sound, 'select');
  };
  const depart = useCallback(() => {
    if (locked || busyRef.current) return;
    busyRef.current = true; setSelectedSlot(null); setPendingOfferId(null); setDoors('closing'); playTone(sound, 'depart'); setTimeout(() => setDoors('moving'), 420);
    setTimeout(() => { setRun((current) => { const resolved = resolveFloor(current); if (resolved.status === 'playing') setOffers(makeOffers(resolved.floor, resolved.upgrades, false, Math.random, resolved.cabin)); playTone(sound, resolved.status === 'lost' ? 'danger' : resolved.status === 'won' ? 'victory' : 'arrive'); return resolved; }); setDoors('open'); busyRef.current = false; }, 920);
  }, [locked, sound]);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === 'Enter' && !intro && !help && !pressureHelp && !archive) depart(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [depart, intro, help, pressureHelp, archive]);
  const chooseUpgrade = (key: UpgradeKey) => {
    setRun((current) => {
      const updated = installUpgrade(current, key);
      if (updated.status === 'playing') setOffers(makeOffers(current.floor, updated.upgrades, false, Math.random, updated.cabin)); return updated;
    }); playTone(sound, 'upgrade');
  };

  return <main className={`game-shell ${run.floor >= 50 ? 'phase-dawn' : ''} ${run.status === 'won' ? 'shift-won' : ''}`}>
    <div className="ambient-grain" />
    <header className="brand-bar"><div><p className="eyebrow">A MIDNIGHT MANAGEMENT TALE</p><h1>Elevator Tales</h1></div><div className="brand-actions"><button className="icon-button" onClick={() => setHelp(true)} aria-label="玩法说明"><HelpCircle /></button><button className="icon-button" onClick={() => setSound((value) => !value)} aria-label={sound ? '关闭声音' : '打开声音'}>{sound ? <Volume2 /> : <VolumeX />}</button><button className="text-button" onClick={() => setArchive(true)}>乘客档案 <span>{String(unlocked.length).padStart(2, '0')} / 18</span></button></div></header>
    <section className="game-grid">
      <aside className="status-rail">
        <div className="floor-plaque"><span>FLOOR</span><strong>{String(run.floor).padStart(2, '0')}</strong><small>{phase}</small><progress className="floor-progress" aria-label={`前往六十层，当前 ${run.floor} 层`} max={60} value={run.floor} /></div>
        <div className="meter-card energy" title={energyPreview.summary}><div><BatteryCharging /><span>能源</span><b>{run.energy}</b></div><div className="meter-track"><i style={{ width: `${Math.max(0, Math.min(100, run.energy / run.energyCap * 100))}%` }} /></div><small>NEXT {energyPreview.range} · {run.energyCap} MAX</small>{run.lastEnergy.sources.length > 0 && <div className={`energy-receipt ${run.lastEnergy.delta > 0 ? 'gained' : run.lastEnergy.delta < 0 ? 'spent' : 'balanced'}`} key={run.floor} aria-live="polite" title={energySummary}><b>{run.lastEnergy.delta === 0 ? '本层持平' : `本层 ${signedDelta(run.lastEnergy.delta)}`}</b><span>{energySummary}</span></div>}</div>
        <div className="meter-card pressure" title={pressurePreview.summary}><div><Gauge /><span className="meter-label">压力<button className="meter-help" onClick={() => setPressureHelp(true)} aria-label="查看压力来源" title="查看压力来源"><HelpCircle /></button></span><b>{run.stress}</b></div><div className="meter-track"><i style={{ width: `${Math.min(100, run.stress / run.stressCap * 100)}%` }} /></div><small>NEXT {pressurePreview.range} · {run.stressCap} LIMIT</small>{run.lastPressure.sources.length > 0 && <div className={`pressure-receipt ${run.lastPressure.delta > 0 ? 'rose' : run.lastPressure.delta < 0 ? 'fell' : 'balanced'}`} key={run.floor} aria-live="polite" title={pressureSummary}><b>{run.lastPressure.delta === 0 ? '本层抵消' : `本层 ${signedDelta(run.lastPressure.delta)}`}</b><span>{pressureSummary}</span></div>}</div>
        <div className={`load-card ${weight > 8 ? 'load-warn' : ''}`}><Weight /><span>载重</span><b>{weight} / {run.weightCap}</b></div>
        <div className={`score-card ${rankedUp ? 'rank-up' : ''}`}><Coins /><span>本次收入</span><strong>{run.coins}</strong><progress className="rank-progress" aria-label={`${rank.grade}级进度`} max={100} value={rankProgress} /><small><b>{rank.grade}</b><span className="rank-full"> {rank.name} · {rank.next ? `距 ${rank.next.grade} 级 ${rank.next.min - run.coins}` : '最高评级'} · 最佳 {bestCoins}</span><span className="rank-compact"> · {rank.next ? `距 ${rank.next.grade} ${rank.next.min - run.coins}` : '最高级'} · 最佳{bestCoins}</span></small>{run.lastEarnings.total > 0 && <div className="earning-receipt" key={run.floor} aria-live="polite" title={earningSummary}><b>{rankedUp ? `晋升 ${rank.grade} 级 · ` : ''}本层 +{run.lastEarnings.total}</b><span>{earningSummary}</span></div>}</div>
        {run.floor >= 50 && run.floor < 60 && <div className={`final-push ${sGap === 0 ? 'secured' : sGap <= sprintPace ? 'on-track' : 'must-risk'}`}><span>FINAL PUSH · 剩 {floorsLeft} 层</span><b>{sGap === 0 ? 'S 级已锁定' : sGap <= sprintPace ? `S 级在望 · 还差 ${sGap}` : `需要冒险 · 还差 ${sGap}`}</b></div>}
        <div className="event-log">{run.log.slice(0, 3).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div>
      </aside>
      <section className={`elevator-stage doors-${doors}`} aria-label="电梯座舱">
        <div className="elevator-image" /><div className="motion-lines" /><div className="floor-indicator"><ArrowUp /><b>{String(run.floor).padStart(2, '0')}</b></div><div className="cabin-title"><span>CAR № 07</span><i /><span>{run.cabin.filter(Boolean).length} / 6 OCCUPIED</span></div>
        <div className="adjacency-key"><i />连线站位互为邻座</div>
        <div className="standing-grid"><svg className="adjacency-map" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">{ADJACENT.map(([first, second]) => <line key={`${first}-${second}`} className={activeConnection(run.cabin, first, second) ? 'active' : ''} x1={CONNECTION_POINTS[first][0]} y1={CONNECTION_POINTS[first][1]} x2={CONNECTION_POINTS[second][0]} y2={CONNECTION_POINTS[second][1]} />)}</svg>{run.cabin.map((rider, index) => {
          const state = riderState(run.cabin, index, weight);
          return <button key={index} className={`standing-slot ${rider ? 'occupied' : ''} ${selectedSlot === index ? 'selected' : ''} ${dragOverSlot === index ? 'drag-target' : ''}`} onClick={() => clickSlot(index)} draggable={Boolean(rider) && !locked && (!run.swapped || rider?.boardedAt === run.floor)} onDragStart={(event) => rider && startDrag(event, { type: 'slot', slot: index })} onDragEnd={endDrag} onDragOver={(event) => { if (!locked) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDragOverSlot(index); } }} onDragLeave={() => setDragOverSlot((current) => current === index ? null : current)} onDrop={(event) => dropOnSlot(event, index)} aria-label={rider ? `${index + 1}号位，${PASSENGERS[rider.kind].name}${state ? `，${state.label}` : ''}` : `${index + 1}号空位`}>
            {rider ? <><Portrait kind={rider.kind} large /><span className="slot-destination">{rider.destination}F</span>{state && rider.kind !== 'bomb' && <span className={`slot-state ${state.tone}`}>{state.label}</span>}<span className="rider-name">{PASSENGERS[rider.kind].name}</span><span className={`patience patience-${Math.min(3, rider.patience)}`}>{'◆'.repeat(Math.max(0, Math.min(5, rider.patience)))}</span>{rider.fuse !== undefined && <span className="fuse">引信 {rider.fuse}</span>}</> : <span className="slot-number">{String(index + 1).padStart(2, '0')}</span>}
          </button>;
        })}</div>
        <div className="door door-left" /><div className="door door-right" />
        <div className="cabin-message" aria-live="polite"><Sparkles /><span>{run.message}</span></div><div className="swap-status">{pendingOfferId ? '点一个空位安排乘客' : selectedSlot !== null ? '再选一个站位完成调整' : run.swapped ? <><LockKeyhole /> 旧乘客换位已用 · 新上客仍可调整</> : '拖拽人物安排站位 · 有效组合会亮起'}</div>
      </section>
      <aside className="arrival-panel">
        <div className="arrival-heading"><div><span>{doors === 'open' ? 'DOORS OPEN' : 'IN TRANSIT'}</span><h2>谁要上楼？</h2></div><div className="arrival-count">3</div></div>
        <div className="passenger-list">{offers.map((offer) => { const spec = PASSENGERS[offer.kind]; const boarded = run.cabin.some((rider) => rider?.id === offer.id); const pending = pendingOfferId === offer.id; const tooHeavy = !boarded && weight + spec.weight > run.weightCap; const isDragging = dragged?.type === 'offer' && dragged.id === offer.id; const choosing = !boarded && !pending && !tooHeavy; return <button className={`passenger-card tone-${spec.tone} ${boarded ? 'boarded' : ''} ${pending ? 'pending' : ''} ${isDragging ? 'dragging' : ''}`} key={offer.id} onClick={() => toggleOffer(offer)} draggable={!locked && !tooHeavy} onDragStart={(event) => startDrag(event, { type: 'offer', id: offer.id })} onDragEnd={endDrag} disabled={locked || tooHeavy} aria-pressed={boarded || pending} title={spec.detail}><Portrait kind={offer.kind} /><span className="passenger-copy"><strong>{spec.name}</strong><small>{spec.title} · 前往 {offer.destination}F</small><span className="tag-row"><i>{spec.weight} 载重</i><i>{offer.patience} 耐心</i>{offer.fuse !== undefined && <i>引信 {offer.fuse}</i>}</span><em>{spec.short}</em>{spec.risk && <span className={`risk-guide ${spec.risk.label === '致命风险' ? 'fatal' : ''}`}><b>{spec.risk.label}</b><span>{spec.risk.guide}</span></span>}</span><span className={`select-mark ${choosing ? 'reward-mark' : ''}`}>{boarded ? '✓' : pending ? '→' : tooHeavy ? '×' : <><b>{spec.fare + offer.fareBonus}</b><small>底价</small><em>+{spec.energy}能</em></>}</span></button>; })}</div>
        <button className="depart-button" onClick={depart} disabled={locked}><span>{doors === 'open' ? '关门上行' : '正在上行'}</span><b>ENTER</b></button><p className={`panel-hint forecast-${forecastTone}`} aria-live="polite">{pendingOfferId ? '已选中乘客 · 请点电梯里的目标空位' : departureForecast}</p>
      </aside>
    </section>
    <footer className="footer-line"><span>ELV–07 / v3.4</span><i /><span>THE CITY NEVER REALLY SLEEPS</span></footer>

    <Dialog open={intro} onOpenChange={setIntro}><DialogContent className="story-dialog intro-dialog" showCloseButton={false}><p className="dialog-kicker">CAR № 07 · 00:17 AM</p><DialogHeader><DialogTitle>今晚，所有人<br />都想再上一层。</DialogTitle><DialogDescription>安排六个站位，让合适的人彼此相邻。在能源耗尽、压力失控或危险爆发前，抵达六十层。</DialogDescription></DialogHeader><div className="intro-rules"><span><b>01</b> 拖拽或点选</span><span><b>02</b> 看连线配邻座</span><span><b>03</b> 关门上行</span></div><Button className="story-primary" onClick={() => setIntro(false)}>开始午夜班次 <ArrowUp /></Button><button className="story-link" onClick={() => { setIntro(false); setHelp(true); }}>先阅读值班手册</button></DialogContent></Dialog>
    <Dialog open={help} onOpenChange={setHelp}><DialogContent className="story-dialog manual-dialog"><p className="dialog-kicker">NIGHT OPERATOR&apos;S MANUAL</p><DialogHeader><DialogTitle>值班手册</DialogTitle><DialogDescription>每次上行都消耗能源，等待会消耗乘客耐心。普通乘坐不会直接增加压力，只有人物事件和耐心归零会加压。</DialogDescription></DialogHeader><div className="manual-grid"><div><b>安排站位</b><p>桌面端可把人物直接拖进空位；手机端点乘客，再点目标空位。</p></div><div><b>相邻关系</b><p>轿厢连线两端互为邻座；有效组合形成后连线会亮起。</p></div><div><b>压力预报</b><p>点压力旁的问号可看完整来源；关门前也会预报下一层的具体变化。</p></div><div><b>收益标记</b><p>候客卡右侧显示基础金币和到站能源；连携关系可能带来额外奖励。</p></div><div><b>一次换位</b><p>本层新上客可自由调整；牵动已在车内的旧乘客时，每层只能换位一次。</p></div><div><b>十层升级</b><p>每十层选择一项永久升级。撑到60层即完成班次。</p></div></div></DialogContent></Dialog>
    <Dialog open={pressureHelp} onOpenChange={setPressureHelp}><DialogContent className="story-dialog pressure-dialog"><p className="dialog-kicker">PRESSURE CONTROL</p><DialogHeader><DialogTitle>压力从哪里来？</DialogTitle><DialogDescription>普通乘坐和电梯耗能都不会加压。压力达到 {run.stressCap} 时本局结束；每次关门前，系统会先按当前站位预报下一层。</DialogDescription></DialogHeader><div className="pressure-rule-grid"><section className="pressure-rise"><small>会增加压力</small><b>耐心归零</b><p>每位离开的乘客 +2</p><b>未受控制的小偷</b><p>每逢偶数层 +1</p><b>未被安抚的醉汉</b><p>每层 25% 概率 +2</p><b>被多人围住的名人</b><p>两名以上邻座时，偶数层 +1</p><b>检查员发现超载</b><p>总载重超过 8 时，偶数层 +1</p></section><section className="pressure-relief"><small>会降低压力</small><b>音乐家开始演奏</b><p>车内至少 4 人时，每层 −1</p><b>护士进行安抚</b><p>每逢偶数层 −1</p><em>加压与安抚在同一层可相互抵消，压力最低为 0。</em></section></div><div className={`pressure-now forecast-${pressurePreview.tone}`}><small>按你现在的站位</small><b>{pressurePreview.summary}</b></div></DialogContent></Dialog>
    <Dialog open={archive} onOpenChange={setArchive}><DialogContent className="story-dialog archive-dialog"><p className="dialog-kicker">PASSENGER ARCHIVE</p><DialogHeader><DialogTitle>午夜乘客档案</DialogTitle><DialogDescription>最高抵达 {highest}F。更高楼层会出现更难处理的乘客。</DialogDescription></DialogHeader><div className="archive-grid">{PASSENGER_ORDER.map((kind) => { const open = unlocked.includes(kind); const spec = PASSENGERS[kind]; return <div className={`archive-item ${open ? '' : 'locked'}`} key={kind}>{open ? <Portrait kind={kind} /> : <LockKeyhole />}<span><b>{open ? spec.name : '未解锁'}</b><small>{open ? spec.short : '继续向上抵达新楼层'}</small></span></div>; })}</div></DialogContent></Dialog>
    <Dialog open={run.status === 'upgrade'}><DialogContent className="story-dialog upgrade-dialog" showCloseButton={false}><p className="dialog-kicker">FLOOR {run.floor} · MAINTENANCE STOP</p><DialogHeader><DialogTitle>选择一项轿厢升级</DialogTitle><DialogDescription>维修灯亮了。下方只展示本局的实际变化，取舍仍由你决定。</DialogDescription></DialogHeader><div className="upgrade-grid">{choices.map((key) => <button key={key} onClick={() => chooseUpgrade(key)}><Sparkles /><small>{UPGRADES[key].label}</small><b>{UPGRADES[key].name}</b><p>{UPGRADES[key].description}</p><em>{upgradeImpact(key, run)}</em></button>)}</div></DialogContent></Dialog>
    <Dialog open={run.status === 'lost' || run.status === 'won'}><DialogContent className={`story-dialog result-dialog ${run.status === 'won' ? 'victory-dialog' : ''}`} showCloseButton={false}>{run.status === 'won' && <div className="victory-seal" aria-hidden="true"><span>60</span><small>TOP FLOOR</small></div>}<p className="dialog-kicker">{run.status === 'won' ? 'SHIFT COMPLETE · DAWN / 60F' : `SHIFT REPORT · ${String(run.floor).padStart(2, '0')}F`}</p><DialogHeader><DialogTitle>{run.status === 'won' ? '天亮以前，抵达顶层。' : '这趟电梯，停下了。'}</DialogTitle><DialogDescription>{run.message}</DialogDescription></DialogHeader>{run.status === 'won' && <p className="victory-note">{run.floor - 1} 次上行 · {upgradeCount} 次改装 · 午夜班次完成</p>}<div className="result-score"><span>本次收入 <b>{run.coins}</b></span><span>班次评级 <b className="result-grade">{rank.grade}</b><small>{rank.name}</small></span><span>最佳收入 <b>{Math.max(run.coins, bestCoins)}</b></span><span>最高楼层 <b>{Math.max(run.floor, highest)}</b></span></div><p className={`result-challenge ${run.coins > runStartBest ? 'record' : ''}`}>{resultChallenge}</p><Button className="story-primary" onClick={reset}><RotateCcw /> {run.status === 'won' && rank.next ? `再开一班 · 冲击 ${rank.next.grade} 级` : run.status === 'won' ? '再开一班 · 刷新纪录' : rank.next ? `再值一次 · 冲击 ${rank.next.grade} 级` : '再值一次 · 刷新纪录'}</Button><button className="story-link" onClick={() => setArchive(true)}><BookOpen /> 查看乘客档案</button></DialogContent></Dialog>
  </main>;
}
