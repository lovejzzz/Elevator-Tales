'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { ArrowUp, BatteryCharging, BookOpen, Check, Coins, Gauge, HelpCircle, LockKeyhole, RotateCcw, Sparkles, Volume2, VolumeX, Weight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ADJACENT, PASSENGER_ORDER, PASSENGERS, SCORE_RANKS, UPGRADES, type PassengerKind, type UpgradeKey } from '@/lib/game-data';
import { EMPTY_UPGRADES, failureLesson, hasNeighbour, initialRun, installUpgrade, makeOffers, neighbourCount, NIGHT_RUSH_MAX, NIGHT_RUSH_MIN, nightRushBonus, readyPartner, resolveFloor, totalWeight, unlockedAt, upgradeChoices, type Rider, type RunState, type UpgradeCrisis } from '@/lib/game-engine';
import { energyForecast, stressForecast } from '@/lib/game-forecast';
import { activeConnection, planPlacement, type PlacementResult } from '@/lib/game-interaction';
import { disposeGameAudio, playGameSound as playTone, playMetricSounds } from '@/lib/game-audio';
import { passengerBrief } from '@/lib/passenger-presentation';
import { metricChanges, type MetricChange, type MetricKey } from '@/lib/metric-feedback';

type DragPayload = { type: 'offer'; id: string } | { type: 'slot'; slot: number };
type Feedback = { id: number; tone: 'place' | 'combo' | 'error' | 'arrival'; label: string; slots: number[]; coins?: number; energy?: number; pressure?: number };

function AnimatedNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(value); const current = useRef(value);
  useEffect(() => {
    const from = current.current; const start = performance.now();
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 280;
    let frame: number;
    const tick = (now: number) => {
      const progress = duration ? Math.min(1, (now - start) / duration) : 1;
      const next = Math.round(from + (value - from) * (1 - (1 - progress) ** 3));
      current.current = next; setShown(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span className="animated-number" aria-label={String(value)}>{shown}</span>;
}

const signedDelta = (value: number) => value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '不变';
function focusCabin(stage: HTMLElement | null, reduced: boolean) {
  if (window.matchMedia('(max-width: 700px)').matches) stage?.scrollIntoView({ block: 'center', behavior: reduced ? 'instant' : 'smooth' });
}
type MetricEvent = { id: number; label: string; changes: MetricChange[] };

function MetricResponse({ metric, event }: { metric: MetricKey; event: MetricEvent | null }) {
  const change = event?.changes.find((item) => item.key === metric);
  return <output className="metric-response" aria-live="polite" aria-atomic="true">
    {change && <span key={event!.id} className={`metric-pulse pulse-${change.tone}`}>
      <b>{signedDelta(change.delta)}</b><span>{change.label}{!change.delta && change.sources.length > 1 ? ' · 收支抵消' : ''}{change.capDelta !== 0 ? ` · 上限 ${signedDelta(change.capDelta)}` : ''}</span>
    </span>}
    {change && <span key={`ring-${event!.id}`} className={`metric-ring pulse-${change.tone}`} aria-hidden="true" />}
  </output>;
}
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

const CONNECTION_POINTS = [[47, 50], [150, 50], [253, 50], [47, 150], [150, 150], [253, 150]];

const rescuesCrisis = (key: UpgradeKey, crisis: UpgradeCrisis) => crisis === 'energy' ? key === 'battery' || key === 'reinforced' : crisis === 'stress' && key === 'calm';

function upgradeImpact(key: UpgradeKey, run: RunState): string {
  const preview = installUpgrade(run, key);
  switch (key) {
    case 'battery': return `能源 ${run.energy}/${run.energyCap} → ${preview.energy}/${preview.energyCap}`;
    case 'calm': return `压力 ${run.stress}/${run.stressCap} → ${preview.stress}/${preview.stressCap}`;
    case 'reinforced': return `载重 ${run.weightCap} → ${preview.weightCap} · 能源 ${run.energy}/${run.energyCap} → ${preview.energy}/${preview.energyCap}`;
    case 'solar': return `每四层回充 ${run.upgrades.solar + 1} 能源`;
    case 'concierge': return `新乘客耐心 +${(run.upgrades.concierge + 1) * 3} · 到站小费 +${(run.upgrades.concierge + 1) * 2}`;
    case 'express': return '新乘客原定 ≥5 层时，目的地提前 1 层 · 本局唯一';
  }
}

export default function ElevatorGame() {
  const [run, setRun] = useState<RunState>(initialRun); const [offers, setOffers] = useState<Rider[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null); const [doors, setDoors] = useState<'open' | 'closing' | 'moving' | 'opening'>('open');
  const [pendingOfferId, setPendingOfferId] = useState<string | null>(null);
  const [dragged, setDragged] = useState<DragPayload | null>(null); const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [guidedShift, setGuidedShift] = useState(false);
  const [intro, setIntro] = useState(true); const [help, setHelp] = useState(false); const [pressureHelp, setPressureHelp] = useState(false); const [archive, setArchive] = useState(false); const [sound, setSound] = useState(true);
  const [highest, setHighest] = useState(1); const [bestCoins, setBestCoins] = useState(0); const [runStartBest, setRunStartBest] = useState(0); const [choices, setChoices] = useState<UpgradeKey[]>([]); const busyRef = useRef(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [metricEvent, setMetricEvent] = useState<MetricEvent | null>(null);
  const soundEnabled = useRef(true);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const metricEventId = useRef(0);
  const feedbackId = useRef(0); const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null); const journeyTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const stageRef = useRef<HTMLElement>(null);
  const locked = doors !== 'open' || run.status !== 'playing';
  const flash = useCallback((event: Omit<Feedback, 'id'>) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ ...event, id: ++feedbackId.current });
    feedbackTimer.current = setTimeout(() => setFeedback(null), event.tone === 'arrival' ? 2600 : 1900);
  }, []);
  const reportMetrics = useCallback((before: RunState, after: RunState, label: string) => {
    const changes = metricChanges(before, after, label);
    if (!changes.length) return;
    setMetricEvent({ id: ++metricEventId.current, label, changes });
    playMetricSounds(soundEnabled.current, changes);
  }, []);
  useEffect(() => () => { journeyTimers.current.forEach(clearTimeout); if (feedbackTimer.current) clearTimeout(feedbackTimer.current); disposeGameAudio(); }, []);

  useEffect(() => { const savedBest = Math.max(0, Number(localStorage.getItem('elevator-tales-best-coins') || 0)); const savedHighest = Math.max(1, Number(localStorage.getItem('elevator-tales-highest') || 1)); const shouldGuide = savedHighest <= 1 || new URLSearchParams(window.location.search).get('tutorial') === '1'; setHighest(savedHighest); setBestCoins(savedBest); setRunStartBest(savedBest); setGuidedShift(shouldGuide); setOffers(makeOffers(1, EMPTY_UPGRADES, shouldGuide)); }, []);
  useEffect(() => { if (run.floor > highest) { setHighest(run.floor); localStorage.setItem('elevator-tales-highest', String(run.floor)); } if (run.status === 'upgrade') { const crisis: UpgradeCrisis = run.energy <= 0 ? 'energy' : run.stress >= run.stressCap ? 'stress' : null; setChoices(upgradeChoices(run.upgrades, Math.random, crisis)); } }, [run.floor, run.status, run.upgrades, run.energy, run.stress, run.stressCap, highest]);
  useEffect(() => { if ((run.status === 'lost' || run.status === 'won') && run.coins > bestCoins) { setBestCoins(run.coins); localStorage.setItem('elevator-tales-best-coins', String(run.coins)); } }, [run.status, run.coins, bestCoins]);
  const weight = useMemo(() => totalWeight(run.cabin), [run.cabin]); const occupied = run.cabin.filter(Boolean).length; const cabinFull = occupied === run.cabin.length; const unlocked = unlockedAt(Math.max(run.floor, highest));
  const pressurePreview = useMemo(() => stressForecast(run, weight), [run, weight]); const energyPreview = useMemo(() => energyForecast(run, weight), [run, weight]);
  const nextStressLow = run.stress + pressurePreview.lowDelta; const nextStressHigh = run.stress + pressurePreview.highDelta;
  const rushPayout = nightRushBonus(NIGHT_RUSH_MIN, occupied); const rushReady = nightRushBonus(run.stress, occupied) > 0; const rushPossible = rushPayout > 0 && nextStressLow <= NIGHT_RUSH_MAX && nextStressHigh >= NIGHT_RUSH_MIN;
  const rushGuaranteed = rushPossible && nextStressLow >= NIGHT_RUSH_MIN && nextStressHigh <= NIGHT_RUSH_MAX;
  const rank = scoreRank(run.coins); const forecastTone = energyPreview.danger ? 'danger' : rushGuaranteed ? 'rush' : pressurePreview.tone;
  const previousRank = scoreRank(Math.max(0, run.coins - run.lastEarnings.total)); const rankedUp = run.lastEarnings.total > 0 && previousRank.grade !== rank.grade;
  const rankProgress = rank.next ? Math.max(0, Math.min(100, (run.coins - rank.min) / (rank.next.min - rank.min) * 100)) : 100;
  const phase = shiftPhase(run.floor); const upgradeCount = Object.values(run.upgrades).reduce((sum, count) => sum + count, 0); const floorsLeft = Math.max(0, 60 - run.floor);
  const loverResponse = offers.some((rider) => rider.calledByLover); const firstPairLesson = run.floor === 1 && guidedShift;
  const firstPairActive = run.cabin.some((rider, slot) => rider?.kind === 'lover' && hasNeighbour(run.cabin, slot, ['lover']));
  const upgradeCrisis: UpgradeCrisis = run.status === 'upgrade' ? run.energy <= 0 ? 'energy' : run.stress >= run.stressCap ? 'stress' : null : null;
  const sTarget = SCORE_RANKS[SCORE_RANKS.length - 1].min; const sGap = Math.max(0, sTarget - run.coins); const sprintPace = floorsLeft * 23;
  const earningSummary = run.lastEarnings.sources.slice(0, 2).map((line) => `${line.label} +${line.amount}`).join(' · ') + (run.lastEarnings.sources.length > 2 ? ` · 另 ${run.lastEarnings.sources.length - 2} 项` : '');
  const pressureSummary = run.lastPressure.sources.slice(0, 2).map((line) => `${line.label} ${signedDelta(line.amount)}`).join(' · ') + (run.lastPressure.sources.length > 2 ? ` · 另 ${run.lastPressure.sources.length - 2} 项` : '');
  const energySummary = run.lastEnergy.sources.slice(0, 2).map((line) => `${line.label} ${signedDelta(line.amount)}`).join(' · ') + (run.lastEnergy.sources.length > 2 ? ` · 另 ${run.lastEnergy.sources.length - 2} 项` : '');
  const activeOfferId = pendingOfferId ?? (dragged?.type === 'offer' ? dragged.id : null);
  const activeRider = dragged?.type === 'slot' ? run.cabin[dragged.slot] : selectedSlot !== null ? run.cabin[selectedSlot] : offers.find((offer) => offer.id === activeOfferId);
  const placementPlans = activeRider ? run.cabin.map((_, slot) => planPlacement(run, activeRider, slot)) : [];
  const hoveredPlan = dragOverSlot !== null ? placementPlans[dragOverSlot] : null;
  const rushForecast = rushGuaranteed ? ` · 热区 +${rushPayout}` : rushPossible ? ` · 热区可能 +${rushPayout}` : '';
  const departureForecast = `下一层 · 能源 ${energyPreview.range} · 压力 ${pressurePreview.range}${rushForecast}${pressurePreview.details ? ` · ${pressurePreview.details}` : ''}`;
  const nextRankGoal = rank.next ? `再赚 ${rank.next.min - run.coins} 金币可升至 ${rank.next.grade} 级` : '';
  const resultChallenge = run.status === 'lost' ? failureLesson(run) : run.coins > runStartBest ? `新纪录 · 比原纪录多 ${run.coins - runStartBest} 金币${nextRankGoal ? ` · ${nextRankGoal}` : ''}` : rank.next ? `${nextRankGoal}${runStartBest > run.coins ? ` · 距个人最佳 ${runStartBest - run.coins}` : ''}` : '已达最高评级 · 下一班继续刷新纪录';

  const reset = useCallback(() => { journeyTimers.current.forEach(clearTimeout); journeyTimers.current = []; if (feedbackTimer.current) clearTimeout(feedbackTimer.current); setFeedback(null); setMetricEvent(null); setReceiptOpen(false); disposeGameAudio(); const fresh = initialRun(); setRunStartBest(bestCoins); setRun(fresh); setOffers(makeOffers(1, fresh.upgrades)); setGuidedShift(false); setSelectedSlot(null); setPendingOfferId(null); setDragged(null); setDragOverSlot(null); setDoors('open'); setIntro(false); busyRef.current = false; }, [bestCoins]);
  const commitPlacement = (result: PlacementResult) => {
    if (result.ok && result.changed) reportMetrics(run, result.next, result.label);
    setRun(result.next);
    if (!result.ok || result.changed) { flash({ tone: result.tone, label: result.label, slots: result.slots }); playTone(sound, result.ok ? result.tone === 'combo' ? 'combo' : 'place' : 'danger'); }
    if (result.ok) { setPendingOfferId(null); setSelectedSlot(null); setDragOverSlot(null); }
  };
  const toggleOffer = (offer: Rider) => {
    if (locked) return;
    const existing = run.cabin.findIndex((rider) => rider?.id === offer.id);
    if (existing >= 0) { const next = { ...run, cabin: run.cabin.map((rider, i) => i === existing ? null : rider), message: `${PASSENGERS[offer.kind].name}回到队伍中。` }; reportMetrics(run, next, `${PASSENGERS[offer.kind].name}下车`); setRun(next); setPendingOfferId(null); playTone(sound, 'select'); return; }
    if (pendingOfferId === offer.id) { setPendingOfferId(null); setRun((current) => ({ ...current, message: '已取消安排。' })); return; }
    setPendingOfferId(offer.id); setSelectedSlot(null); setDragOverSlot(null); setFeedback(null);
    setRun((current) => ({ ...current, message: `已选择${PASSENGERS[offer.kind].name}，现在点一个空位。` })); playTone(sound, 'select');
    if (window.matchMedia('(max-width: 700px)').matches) stageRef.current?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  const clickSlot = (slot: number) => {
    if (locked) return;
    if (pendingOfferId) {
      const offer = offers.find((candidate) => candidate.id === pendingOfferId);
      if (!offer) { setPendingOfferId(null); return; }
      commitPlacement(planPlacement(run, offer, slot)); return;
    }
    if (selectedSlot === null) { const rider = run.cabin[slot]; if (rider && (!run.swapped || rider.boardedAt === run.floor)) { setSelectedSlot(slot); playTone(sound, 'select'); } else if (rider) { flash({ tone: 'error', label: '本层旧乘客换位已用', slots: [slot] }); playTone(sound, 'danger'); } return; }
    if (selectedSlot === slot) { setSelectedSlot(null); return; }
    const rider = run.cabin[selectedSlot];
    if (rider) commitPlacement(planPlacement(run, rider, slot));
  };
  const startDrag = (event: DragEvent, payload: DragPayload) => {
    if (locked) { event.preventDefault(); return; }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/elevator-tales', JSON.stringify(payload));
    const portrait = event.currentTarget.querySelector<HTMLElement>('.portrait-window');
    if (portrait) { const bounds = portrait.getBoundingClientRect(); event.dataTransfer.setDragImage(portrait, bounds.width / 2, bounds.height / 2); }
    setPendingOfferId(null); setSelectedSlot(null); setFeedback(null); setDragged(payload); playTone(sound, 'select');
  };
  const endDrag = () => { setDragged(null); setDragOverSlot(null); };
  const dropOnSlot = (event: DragEvent, target: number) => {
    event.preventDefault();
    if (locked) return;
    let payload = dragged;
    try { payload = JSON.parse(event.dataTransfer.getData('application/elevator-tales')) as DragPayload; } catch { /* state fallback */ }
    if (!payload || typeof payload !== 'object') { endDrag(); return; }
    const rider = payload.type === 'offer' ? offers.find((candidate) => candidate.id === payload.id) : payload.type === 'slot' && Number.isInteger(payload.slot) ? run.cabin[payload.slot] : null;
    if (rider) commitPlacement(planPlacement(run, rider, target));
    endDrag();
  };
  const depart = useCallback(() => {
    if (locked || busyRef.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    busyRef.current = true; setSelectedSlot(null); setPendingOfferId(null); setDragged(null); setDragOverSlot(null); setFeedback(null); setDoors('closing'); playTone(sound, 'depart');
    journeyTimers.current.forEach(clearTimeout);
    journeyTimers.current = [
      setTimeout(() => setDoors('moving'), reduced ? 30 : 250),
      setTimeout(() => {
        const resolved = resolveFloor(run); let delivered = resolved;
        if (resolved.status === 'playing') { const nextOffers = makeOffers(resolved.floor, resolved.upgrades, false, Math.random, resolved.cabin); setOffers(nextOffers); if (nextOffers.some((rider) => rider.calledByLover) && resolved.lastPressure.delta <= 0) delivered = { ...resolved, message: '恋人的呼唤得到了回应。把两人安排在相邻站位。' }; }
        setRun(delivered); setDoors('opening');
        reportMetrics(run, resolved, `${resolved.floor} 层 · 到站结算`);
        flash({ tone: 'arrival', label: `${String(resolved.floor).padStart(2, '0')}F · 本层结算`, slots: [], coins: resolved.lastEarnings.total, energy: resolved.lastEnergy.delta, pressure: resolved.lastPressure.delta });
        playTone(soundEnabled.current, resolved.status === 'lost' ? 'danger' : resolved.status === 'won' ? 'victory' : 'arrive');
      }, reduced ? 70 : 470),
      setTimeout(() => { setDoors('open'); busyRef.current = false; }, reduced ? 110 : 730),
    ];
  }, [locked, sound, run, flash, reportMetrics]);
  useEffect(() => { const onKey = (event: KeyboardEvent) => {
    if (intro || help || pressureHelp || archive || receiptOpen || event.repeat) return;
    if (event.key === 'Escape') { setPendingOfferId(null); setSelectedSlot(null); setDragged(null); setDragOverSlot(null); return; }
    if (event.key === 'Enter' && !(event.target instanceof HTMLElement && event.target.closest('button,input,textarea,select,[contenteditable="true"]'))) { event.preventDefault(); focusCabin(stageRef.current, window.matchMedia('(prefers-reduced-motion: reduce)').matches); depart(); }
  }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [depart, intro, help, pressureHelp, archive, receiptOpen]);
  const chooseUpgrade = (key: UpgradeKey) => {
    const updated = installUpgrade(run, key); let delivered = updated;
    reportMetrics(run, updated, `安装${UPGRADES[key].name}`);
    if (updated.status === 'playing') { const nextOffers = makeOffers(run.floor, updated.upgrades, false, Math.random, updated.cabin); setOffers(nextOffers); if (nextOffers.some((rider) => rider.calledByLover)) delivered = { ...updated, message: '恋人的呼唤得到了回应。把两人安排在相邻站位。' }; }
    setRun(delivered); flash({ tone: 'combo', label: `${UPGRADES[key].name} · 已安装`, slots: [] }); playTone(sound, 'upgrade');
  };

  return <main className={`game-shell ${run.floor >= 50 ? 'phase-dawn' : ''} ${run.status === 'won' ? 'shift-won' : ''}`}>
    <div className="ambient-grain" />
    <header className="brand-bar"><div><p className="eyebrow">A MIDNIGHT MANAGEMENT TALE</p><h1>Elevator Tales</h1></div><div className="brand-actions"><button className="icon-button" onClick={() => setHelp(true)} aria-label="玩法说明"><HelpCircle /></button><button className="icon-button" onClick={() => { soundEnabled.current = !sound; if (sound) disposeGameAudio(); setSound(!sound); }} aria-label={sound ? '关闭声音' : '打开声音'}>{sound ? <Volume2 /> : <VolumeX />}</button><button className="text-button" onClick={() => setArchive(true)}>乘客档案 <span>{String(unlocked.length).padStart(2, '0')} / 18</span></button></div></header>
    <section className="game-grid">
      <aside className="status-rail">
        <div className="floor-plaque"><span>FLOOR</span><strong>{String(run.floor).padStart(2, '0')}</strong><small>{phase}</small><progress className="floor-progress" aria-label={`前往六十层，当前 ${run.floor} 层`} max={60} value={run.floor} /></div>
        <div data-metric="energy" className={`meter-card energy ${energyPreview.danger ? 'meter-danger' : ''}`} title={energyPreview.summary}><div><BatteryCharging /><span>能源</span><b><AnimatedNumber value={run.energy} /></b></div><MetricResponse metric="energy" event={metricEvent} /><div className="meter-track"><i style={{ width: `${Math.max(0, Math.min(100, run.energy / run.energyCap * 100))}%` }} /></div><small>NEXT {energyPreview.range} · {run.energyCap} MAX</small>{run.lastEnergy.sources.length > 0 && <div className={`energy-receipt ${run.lastEnergy.delta > 0 ? 'gained' : run.lastEnergy.delta < 0 ? 'spent' : 'balanced'}`} key={run.floor} aria-live="polite" title={energySummary}><b>{run.lastEnergy.delta === 0 ? '本层持平' : `本层 ${signedDelta(run.lastEnergy.delta)}`}</b><span>{energySummary}</span></div>}</div>
        <div data-metric="stress" className={`meter-card pressure ${rushReady ? 'rush-ready' : ''} ${pressurePreview.tone === 'danger' ? 'meter-danger' : ''}`} title={`${pressurePreview.summary}${rushForecast}`}><div><Gauge /><span className="meter-label">压力<button className="meter-help" onClick={() => setPressureHelp(true)} aria-label="查看压力来源" title="查看压力来源"><HelpCircle /></button></span><b><AnimatedNumber value={run.stress} /></b></div><MetricResponse metric="stress" event={metricEvent} /><div className="meter-track pressure-track"><span className="rush-band" style={{ left: `${NIGHT_RUSH_MIN / run.stressCap * 100}%`, width: `${(NIGHT_RUSH_MAX - NIGHT_RUSH_MIN) / run.stressCap * 100}%` }} aria-hidden="true" /><i style={{ width: `${Math.min(100, run.stress / run.stressCap * 100)}%` }} /></div><small>NEXT {pressurePreview.range} · {run.stressCap} LIMIT</small>{run.lastPressure.sources.length > 0 ? <div className={`pressure-receipt ${run.lastPressure.delta > 0 ? 'rose' : run.lastPressure.delta < 0 ? 'fell' : 'balanced'}`} key={run.floor} aria-live="polite" title={pressureSummary}><b>{run.lastPressure.delta === 0 ? '本层抵消' : `本层 ${signedDelta(run.lastPressure.delta)}`}</b><span>{pressureSummary}</span></div> : rushReady ? <div className="pressure-principle rush-principle"><b>午夜热区已就绪 · +{rushPayout}</b><span>下一层把压力保持在 {NIGHT_RUSH_MIN}–{NIGHT_RUSH_MAX}</span></div> : <div className="pressure-principle"><b>普通上行不加压</b><span>只看人物事件与耐心</span></div>}</div>
        <div data-metric="weight" className={`load-card ${weight > 8 ? 'load-warn' : ''}`}><Weight /><span>载重</span><b><AnimatedNumber value={weight} /> / {run.weightCap}</b><MetricResponse metric="weight" event={metricEvent} /></div>
        <div data-metric="coins" className={`score-card ${rankedUp ? 'rank-up' : ''}`}><Coins /><span>本次收入</span><strong><AnimatedNumber value={run.coins} /></strong><MetricResponse metric="coins" event={metricEvent} /><progress className="rank-progress" aria-label={`${rank.grade}级进度`} max={100} value={rankProgress} /><small><b>{rank.grade}</b><span className="rank-full"> {rank.name} · {rank.next ? `距 ${rank.next.grade} 级 ${rank.next.min - run.coins}` : '最高评级'} · 最佳 {bestCoins}</span><span className="rank-compact"> · {rank.next ? `距 ${rank.next.grade} ${rank.next.min - run.coins}` : '最高级'} · 最佳{bestCoins}</span></small>{run.lastEarnings.total > 0 && <div className="earning-receipt" key={run.floor} aria-live="polite" title={earningSummary}><b>{rankedUp ? `晋升 ${rank.grade} 级 · ` : ''}本层 +{run.lastEarnings.total}</b><span>{earningSummary}</span></div>}</div>
        {run.floor >= 50 && run.floor < 60 && <div className={`final-push ${sGap === 0 ? 'secured' : sGap <= sprintPace ? 'on-track' : 'must-risk'}`}><span>FINAL PUSH · 剩 {floorsLeft} 层</span><b>{sGap === 0 ? 'S 级已锁定' : sGap <= sprintPace ? `S 级在望 · 还差 ${sGap}` : `需要冒险 · 还差 ${sGap}`}</b></div>}
        {metricEvent && <button className="receipt-button" onClick={() => setReceiptOpen(true)}><BookOpen /> 本次变化明细 <span>↗</span></button>}
        <div className="event-log">{run.log.slice(0, 3).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div>
      </aside>
      <section ref={stageRef} className={`elevator-stage doors-${doors} ${activeRider ? 'is-placing' : ''} ${rushReady ? 'cabin-rush' : ''}`} aria-label="电梯座舱" aria-busy={doors !== 'open'}>
        <div className="elevator-image" /><div className="motion-lines" /><div className="floor-indicator"><ArrowUp /><b key={run.floor}>{String(run.floor).padStart(2, '0')}</b></div><div className="cabin-title"><span>CAR № 07</span><i /><span>{occupied} / 6 OCCUPIED</span></div>
        <div className="adjacency-key"><i />连线站位互为邻座</div>
        {feedback && <output key={feedback.id} className={`cabin-feedback feedback-${feedback.tone}`}>
          <div className="feedback-label">{feedback.tone === 'error' ? <X /> : feedback.tone === 'combo' ? <Sparkles /> : <Check />}<b>{feedback.label}</b></div>
          {feedback.tone === 'arrival' && <div className="feedback-values">{Boolean(feedback.coins) && <span className="value-coins"><Coins /><small>金币</small>+{feedback.coins}</span>}<span className={feedback.energy! > 0 ? 'value-gain' : feedback.energy! < 0 ? 'value-spent' : 'value-neutral'}><BatteryCharging /><small>能源</small>{signedDelta(feedback.energy ?? 0)}</span><span className={feedback.pressure! > 0 ? 'value-danger' : feedback.pressure! < 0 ? 'value-gain' : 'value-neutral'}><Gauge /><small>压力</small>{signedDelta(feedback.pressure ?? 0)}</span></div>}
          {feedback.tone === 'arrival' && <p className="feedback-cause">{earningSummary || energySummary}{pressureSummary ? ` · ${pressureSummary}` : ''}</p>}
        </output>}
        {doors === 'moving' && <div className="travel-caption"><ArrowUp />前往 {String(run.floor + 1).padStart(2, '0')}F</div>}
        <div className="standing-grid"><svg className="adjacency-map" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">{ADJACENT.map(([first, second]) => {
          const preview = hoveredPlan?.ok && hoveredPlan.changed && activeConnection(hoveredPlan.next.cabin, first, second);
          return <line key={`${first}-${second}`} className={`${activeConnection(run.cabin, first, second) ? 'active' : ''} ${preview ? 'preview-link' : ''}`} x1={CONNECTION_POINTS[first][0]} y1={CONNECTION_POINTS[first][1]} x2={CONNECTION_POINTS[second][0]} y2={CONNECTION_POINTS[second][1]} />;
        })}</svg>{run.cabin.map((rider, index) => {
          const state = riderState(run.cabin, index, weight); const plan = placementPlans[index]; const synergy = plan?.ok && plan.changed && plan.tone === 'combo';
          const target = dragOverSlot === index && Boolean(activeRider); const reaction = feedback?.slots.includes(index) ? feedback : null;
          return <button key={index} className={`standing-slot ${rider ? 'occupied' : ''} ${synergy ? 'synergy-target' : ''} ${plan ? plan.ok ? 'drop-valid' : 'drop-blocked' : ''} ${selectedSlot === index ? 'selected' : ''} ${target ? 'drag-target' : ''}`} onClick={() => clickSlot(index)} disabled={locked} draggable={Boolean(rider) && !locked && (!run.swapped || rider?.boardedAt === run.floor)} onDragStart={(event) => rider && startDrag(event, { type: 'slot', slot: index })} onDragEnd={endDrag} onMouseEnter={() => activeRider && window.matchMedia('(min-width: 701px) and (hover: hover)').matches && setDragOverSlot(index)} onMouseLeave={() => !dragged && setDragOverSlot(null)} onDragOver={(event) => { if (!locked && dragged) { event.preventDefault(); event.dataTransfer.dropEffect = plan?.ok ? 'move' : 'none'; setDragOverSlot(index); } }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOverSlot((current) => current === index ? null : current); }} onDrop={(event) => dropOnSlot(event, index)} aria-label={rider ? `${index + 1}号位，${PASSENGERS[rider.kind].name}${state ? `，${state.label}` : ''}` : `${index + 1}号空位${synergy ? '，可联动' : ''}`}>
            {rider ? <span className="rider-visual" key={rider.id}><Portrait kind={rider.kind} large /><span className="slot-destination">{rider.destination}F</span>{state && rider.kind !== 'bomb' && <span className={`slot-state ${state.tone}`}>{state.label}</span>}<span className="rider-name">{PASSENGERS[rider.kind].name}</span><span className={`patience patience-${Math.min(3, rider.patience)}`} title={`剩余耐心 ${rider.patience}`}>{'◆'.repeat(Math.max(0, Math.min(5, rider.patience)))}</span>{rider.fuse !== undefined && <span className="fuse">引信 {rider.fuse}</span>}</span> : <><span className="slot-number">{String(index + 1).padStart(2, '0')}</span>{target && plan?.ok && activeRider && <span className="placement-ghost"><Portrait kind={activeRider.kind} large /></span>}</>}
            {reaction && <span key={reaction.id} className={`slot-reaction reaction-${reaction.tone}`} aria-hidden="true" />}
            {target && plan && <span className={`drop-caption ${plan.ok ? 'allowed' : 'blocked'}`}>{plan.ok ? `${dragged ? '松手' : '点击'} · ${synergy ? '联动' : '就位'}` : '不可放置'}</span>}
          </button>;
        })}</div>
        <div className="door door-left" /><div className="door door-right" />
        <div className={`cabin-message ${hoveredPlan && !hoveredPlan.ok ? 'message-error' : ''}`} aria-live="polite"><Sparkles /><span>{hoveredPlan ? hoveredPlan.ok ? hoveredPlan.next.message : hoveredPlan.label : run.message}</span></div><div className="swap-status">{pendingOfferId ? '选择发光站位 · ESC 取消' : selectedSlot !== null ? '再选一个站位完成调整 · ESC 取消' : run.swapped ? <><LockKeyhole /> 旧乘客换位已用 · 新上客仍可调整</> : '拖拽人物安排站位 · 有效组合会亮起'}</div>
      </section>
      <aside className="arrival-panel">
        <div className={`arrival-heading ${loverResponse || firstPairLesson ? 'lover-response' : ''}`}><div><span>{loverResponse ? 'LOVER SIGNAL · RESPONSE' : firstPairLesson ? 'FIRST PAIR · GUIDED SHIFT' : doors === 'open' ? 'DOORS OPEN' : 'IN TRANSIT'}</span><h2>{loverResponse ? '有人回应了呼唤' : firstPairLesson ? firstPairActive ? '配对完成，可以上行' : '先让恋人成为邻座' : '谁要上楼？'}</h2></div><div className="arrival-count">{offers.length} 位</div></div>
        <p className="arrival-explainer">送达后领取基础奖励 · 途中收益与人物联动另算</p>
        <div className="passenger-list" key={run.floor} aria-label="候客乘客，可滚动查看">
          {offers.map((offer) => {
            const spec = PASSENGERS[offer.kind]; const brief = passengerBrief(offer, run.floor);
            const boarded = run.cabin.some((rider) => rider?.id === offer.id); const pending = pendingOfferId === offer.id;
            const full = !boarded && cabinFull; const tooHeavy = !boarded && weight + spec.weight > run.weightCap;
            const unavailable = full || tooHeavy; const isDragging = dragged?.type === 'offer' && dragged.id === offer.id;
            const partner = unavailable ? null : readyPartner(offer.kind, run.cabin, offer.id);
            return <button className={`passenger-card tone-${spec.tone} ${offer.calledByLover ? 'lover-called' : ''} ${firstPairLesson && offer.kind === 'lover' ? 'guided-lover' : ''} ${boarded ? 'boarded' : ''} ${pending ? 'pending' : ''} ${isDragging ? 'dragging' : ''}`} key={offer.id} onClick={() => toggleOffer(offer)} draggable={!locked && !unavailable} onDragStart={(event) => startDrag(event, { type: 'offer', id: offer.id })} onDragEnd={endDrag} disabled={locked || unavailable} aria-pressed={boarded || pending}>
              <span className="passenger-heading"><Portrait kind={offer.kind} /><span className="passenger-identity"><strong>{spec.name}</strong><span className="passenger-destination">前往 <b>{offer.destination} 层</b><span> · 还需 {brief.distance} 层</span></span></span></span>
              <span className="passenger-facts"><span>占载重 <b>{spec.weight}</b></span><span title="每层通常消耗 1 点；归零会提前离开，并增加 2 压力。">耐心 <b>{offer.patience} 点</b></span>{offer.fuse !== undefined && <span className="fact-danger">引信 <b>{offer.fuse} 格</b></span>}{spec.risk && <span className="fact-danger">{spec.risk.label}</span>}</span>
              <span className="arrival-reward"><span>到站基础奖励</span><span className="reward-coins"><Coins />金币 <b>+{brief.coins}</b></span><span className="reward-energy"><BatteryCharging />能源 <b>{brief.energy ? `+${brief.energy}` : '0'}</b></span></span>
              {brief.tip > 0 && <span className="passenger-tip">另有升级小费 +{brief.tip} 金币，不参与车费倍率。</span>}
              <span className="passenger-rules">{brief.rules.map((rule) => <span key={rule}>{rule}</span>)}</span>
              <span className="passenger-action"><span>{boarded ? '已上车 · 点击可撤回' : pending ? '已选中 · 请安排站位' : full ? '轿厢已满 · 暂不能上车' : tooHeavy ? '剩余载重不足' : '拖入空位，或点选安排'}</span>{partner ? <b>可联动 · {PASSENGERS[partner].name}</b> : firstPairLesson && offer.kind === 'lover' ? <b>教学配对</b> : offer.calledByLover ? <b>回应呼唤</b> : null}</span>
            </button>;
          })}
        </div>
        <button className="depart-button" onClick={() => { focusCabin(stageRef.current, window.matchMedia('(prefers-reduced-motion: reduce)').matches); depart(); }} disabled={locked}><span>{doors === 'open' ? '关门上行' : '正在上行'}</span><b>ENTER</b></button><p className={`panel-hint forecast-${forecastTone}`} aria-live="polite">{pendingOfferId ? '已选中乘客 · 请点电梯里的目标空位' : firstPairLesson && !firstPairActive ? '第一班 · 把两位恋人放进连线相连的站位' : departureForecast}</p>
      </aside>
    </section>
    <footer className="footer-line"><span>ELV–07 / v4.8</span><i /><span>THE CITY NEVER REALLY SLEEPS</span></footer>

    <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}><DialogContent className="story-dialog receipt-dialog">
      <p className="dialog-kicker">DECISION RECEIPT</p><DialogHeader><DialogTitle>这次，改变了什么？</DialogTitle><DialogDescription>{metricEvent?.label}。以下是实际变化，不是下一层预测。</DialogDescription></DialogHeader>
      <div className="receipt-sections">{metricEvent?.changes.map((change) => <section key={change.key} className={`receipt-section pulse-${change.tone}`}>
        <h3><span>{change.label}</span><b>{change.before} → {change.after}<em>{signedDelta(change.delta)}</em></b></h3>
        {change.sources.map((source, index) => <p key={`${index}-${source.label}`}><span>{source.label}</span><b>{signedDelta(source.amount)}</b></p>)}
        {change.capDelta !== 0 && <p><span>{change.label}上限</span><b>{signedDelta(change.capDelta)}</b></p>}
      </section>)}</div>
    </DialogContent></Dialog>
    <Dialog open={intro} onOpenChange={setIntro}><DialogContent className="story-dialog intro-dialog" showCloseButton={false}><p className="dialog-kicker">CAR № 07 · 00:17 AM</p><DialogHeader><DialogTitle>今晚，所有人<br />都想再上一层。</DialogTitle><DialogDescription>安排六个站位，让合适的人彼此相邻。在能源耗尽、压力失控或危险爆发前，抵达六十层。</DialogDescription></DialogHeader><div className="intro-rules"><span><b>01</b> 拖拽或点选</span><span><b>02</b> {guidedShift ? '先让恋人相邻' : '看连线配邻座'}</span><span><b>03</b> 关门上行</span></div><Button className="story-primary" onClick={() => setIntro(false)}>开始午夜班次 <ArrowUp /></Button><button className="story-link" onClick={() => { setIntro(false); setHelp(true); }}>先阅读值班手册</button></DialogContent></Dialog>
    <Dialog open={help} onOpenChange={setHelp}><DialogContent className="story-dialog manual-dialog"><p className="dialog-kicker">NIGHT OPERATOR&apos;S MANUAL</p><DialogHeader><DialogTitle>值班手册</DialogTitle><DialogDescription>每次上行都消耗能源，等待会消耗乘客耐心。普通乘坐不会直接增加压力，只有人物事件和耐心归零会加压。</DialogDescription></DialogHeader><div className="manual-grid"><div><b>安排站位</b><p>桌面端可把人物直接拖进空位；手机端点乘客，再点目标空位。</p></div><div><b>相邻关系</b><p>轿厢连线两端互为邻座；有效组合形成后连线会亮起。</p></div><div><b>午夜热区</b><p>车内至少4人、压力保持在5–9时，每两位乘客每层贡献1金币小费。</p></div><div><b>到站奖励</b><p>卡片中的金币与能源，送达后才领取；途中收益和人物联动另算。耐心每层通常消耗1点，归零会提前离开、失去到站奖励，并增加2压力。</p></div><div><b>一次换位</b><p>本层新上客可自由调整；牵动已在车内的旧乘客时，每层只能换位一次。</p></div><div><b>十层升级</b><p>每十层选择一项永久升级。撑到60层即完成班次。</p></div></div></DialogContent></Dialog>
    <Dialog open={pressureHelp} onOpenChange={setPressureHelp}><DialogContent className="story-dialog pressure-dialog"><p className="dialog-kicker">PRESSURE CONTROL</p><DialogHeader><DialogTitle>压力，也可以经营。</DialogTitle><DialogDescription>普通乘坐和电梯耗能都不会加压。压力达到 {run.stressCap} 时本局结束；但车内至少4人时，把压力维持在 {NIGHT_RUSH_MIN}–{NIGHT_RUSH_MAX}，每两位乘客每层会贡献1金币“午夜热区”小费。</DialogDescription></DialogHeader><div className="pressure-rule-grid"><section className="pressure-rise"><small>会增加压力</small><b>耐心归零</b><p>每位离开的乘客 +2</p><b>未受控制的小偷</b><p>每逢偶数层 +1</p><b>未被安抚的醉汉</b><p>每层 25% 概率 +2</p><b>被多人围住的名人</b><p>两名以上邻座时，偶数层 +1</p><b>检查员发现超载</b><p>总载重超过 8 时，偶数层 +1</p></section><section className="pressure-relief"><small>控制与获利</small><b>午夜热区</b><p>至少4人且压力5–9：每两人每层 +1金币</p><b>音乐家开始演奏</b><p>车内至少 4 人时，每层 −1压力</p><b>护士进行安抚</b><p>每逢偶数层 −1压力</p><em>先用风险人物进入热区，再用安抚人物避免越过9。随机结果会在关门前显示为范围。</em></section></div><div className={`pressure-now forecast-${rushGuaranteed ? 'rush' : pressurePreview.tone}`}><small>按你现在的站位</small><b>{pressurePreview.summary}{rushForecast}</b></div></DialogContent></Dialog>
    <Dialog open={archive} onOpenChange={setArchive}><DialogContent className="story-dialog archive-dialog"><p className="dialog-kicker">PASSENGER ARCHIVE</p><DialogHeader><DialogTitle>午夜乘客档案</DialogTitle><DialogDescription>最高抵达 {highest}F。更高楼层会出现更难处理的乘客。</DialogDescription></DialogHeader><div className="archive-grid">{PASSENGER_ORDER.map((kind) => { const open = unlocked.includes(kind); const spec = PASSENGERS[kind]; return <div className={`archive-item ${open ? '' : 'locked'}`} key={kind}>{open ? <Portrait kind={kind} /> : <LockKeyhole />}<span><b>{open ? spec.name : '未解锁'}</b><small>{open ? spec.short : '继续向上抵达新楼层'}</small></span></div>; })}</div></DialogContent></Dialog>
    <Dialog open={run.status === 'upgrade'}><DialogContent className={`story-dialog upgrade-dialog ${upgradeCrisis ? 'upgrade-crisis' : ''}`} showCloseButton={false}><p className="dialog-kicker">FLOOR {run.floor} · MAINTENANCE STOP</p><DialogHeader><DialogTitle>{upgradeCrisis ? '维修层危机：选择救援' : '选择一项轿厢升级'}</DialogTitle><DialogDescription>{upgradeCrisis ? upgradeCrisis === 'energy' ? '能源已经耗尽。救援升级会补足未来三层的基础行驶电量，给你一次真正的周转机会。' : '压力已经达到上限。选择标有“可挽救本班”的升级才能继续。' : '先看路线定位，再看本局的实际变化。生存、控场与高分没有永远正确的答案。'}</DialogDescription></DialogHeader><div className="upgrade-grid">{choices.map((key) => { const rescue = rescuesCrisis(key, upgradeCrisis); return <button className={rescue ? 'crisis-rescue' : ''} key={key} onClick={() => chooseUpgrade(key)}>{rescue && <span className="upgrade-rescue">{upgradeCrisis === 'energy' ? '3F RUNWAY' : 'EMERGENCY'} · 可挽救本班</span>}<Sparkles /><span className="upgrade-card-head"><small>{UPGRADES[key].label}</small><i className={`upgrade-strategy strategy-${UPGRADES[key].tone}`}>{UPGRADES[key].strategy}</i></span><b>{UPGRADES[key].name}</b><p>{UPGRADES[key].description}</p><em>{upgradeImpact(key, run)}</em></button>; })}</div></DialogContent></Dialog>
    <Dialog open={run.status === 'lost' || run.status === 'won'}><DialogContent className={`story-dialog result-dialog ${run.status === 'won' ? 'victory-dialog' : ''}`} showCloseButton={false}>{run.status === 'won' && <div className="victory-seal" aria-hidden="true"><span>60</span><small>TOP FLOOR</small></div>}<p className="dialog-kicker">{run.status === 'won' ? 'SHIFT COMPLETE · DAWN / 60F' : `SHIFT REPORT · ${String(run.floor).padStart(2, '0')}F`}</p><DialogHeader><DialogTitle>{run.status === 'won' ? '天亮以前，抵达顶层。' : '这趟电梯，停下了。'}</DialogTitle><DialogDescription>{run.message}</DialogDescription></DialogHeader>{run.status === 'won' && <p className="victory-note">{run.floor - 1} 次上行 · {upgradeCount} 次改装 · 午夜班次完成</p>}<div className="result-score"><span>本次收入 <b>{run.coins}</b></span><span>班次评级 <b className="result-grade">{rank.grade}</b><small>{rank.name}</small></span><span>最佳收入 <b>{Math.max(run.coins, bestCoins)}</b></span><span>最高楼层 <b>{Math.max(run.floor, highest)}</b></span></div><p className={`result-challenge ${run.status === 'lost' ? 'failure' : run.coins > runStartBest ? 'record' : ''}`}>{resultChallenge}</p><Button className="story-primary" onClick={reset}><RotateCcw /> {run.status === 'won' && rank.next ? `再开一班 · 冲击 ${rank.next.grade} 级` : run.status === 'won' ? '再开一班 · 刷新纪录' : '再值一次 · 改写结局'}</Button><button className="story-link" onClick={() => setArchive(true)}><BookOpen /> 查看乘客档案</button></DialogContent></Dialog>
  </main>;
}
