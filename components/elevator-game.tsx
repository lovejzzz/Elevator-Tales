'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { ArrowUp, BatteryCharging, BookOpen, Check, Coins, Gauge, HelpCircle, LockKeyhole, RotateCcw, Sparkles, Volume2, VolumeX, Weight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ADJACENT, PASSENGER_ORDER, PASSENGERS, UPGRADES, type PassengerKind, type UpgradeKey } from '@/lib/game-data';
import { agitationThreshold, crowdAgitation, difficultyTier, EMPTY_UPGRADES, failureLesson, hasNeighbour, initialRun, installUpgrade, leaveShop, makeOffers, neighbourCount, nextShopFloor, previewUpgrade, readyPartner, resolveFloor, shiftAgitation, totalWeight, unlockedAt, type Rider, type RunState, type UpgradeCrisis } from '@/lib/game-engine';
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
const shiftPhase = (floor: number) => `无尽班次 · 难度 ${difficultyTier(floor) + 1}`;

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

const rescuesCrisis = (key: UpgradeKey, crisis: UpgradeCrisis) => crisis === 'both' ? ['battery', 'reinforced', 'calm'].includes(key) : crisis === 'energy' ? key === 'battery' || key === 'reinforced' : crisis === 'stress' && key === 'calm';

function upgradeImpact(key: UpgradeKey, run: RunState): string {
  const preview = previewUpgrade(run, key);
  switch (key) {
    case 'battery': return `能源 ${run.energy}/${run.energyCap} → ${preview.energy}/${preview.energyCap}`;
    case 'calm': return `躁动 ${run.stress}/${run.stressCap} → ${preview.stress}/${preview.stressCap}`;
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
  const [passengerDetails, setPassengerDetails] = useState<Rider | null>(null);
  const [intro, setIntro] = useState(true); const [help, setHelp] = useState(false); const [pressureHelp, setPressureHelp] = useState(false); const [archive, setArchive] = useState(false); const [sound, setSound] = useState(true);
  const [highest, setHighest] = useState(1); const [bestFloor, setBestFloor] = useState(1); const [runStartBest, setRunStartBest] = useState(1); const busyRef = useRef(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [metricEvent, setMetricEvent] = useState<MetricEvent | null>(null);
  const soundEnabled = useRef(true);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const metricEventId = useRef(0);
  const feedbackId = useRef(0); const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null); const journeyTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
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

  useEffect(() => { const savedBest = Math.max(1, Number(localStorage.getItem('elevator-tales-endless-best-floor') || 1)); const savedHighest = Math.max(1, Number(localStorage.getItem('elevator-tales-highest') || 1)); const shouldGuide = savedBest <= 1 || new URLSearchParams(window.location.search).get('tutorial') === '1'; setHighest(savedHighest); setBestFloor(savedBest); setRunStartBest(savedBest); setGuidedShift(shouldGuide); setOffers(makeOffers(1, EMPTY_UPGRADES, shouldGuide)); }, []);
  useEffect(() => { if (run.floor > highest) { setHighest(run.floor); localStorage.setItem('elevator-tales-highest', String(run.floor)); } if (run.floor > bestFloor) { setBestFloor(run.floor); localStorage.setItem('elevator-tales-endless-best-floor', String(run.floor)); } }, [run.floor, highest, bestFloor]);

  const weight = useMemo(() => totalWeight(run.cabin), [run.cabin]); const occupied = run.cabin.filter(Boolean).length; const cabinFull = occupied === run.cabin.length; const unlocked = unlockedAt(Math.max(run.floor, highest));
  const pressurePreview = useMemo(() => stressForecast(run, weight), [run, weight]); const energyPreview = useMemo(() => energyForecast(run, weight), [run, weight]);
  const forecastTone = energyPreview.danger ? 'danger' : pressurePreview.tone;
  const phase = shiftPhase(run.floor); const upgradeCount = Object.values(run.upgrades).reduce((sum, count) => sum + count, 0); const nextShop = nextShopFloor(run.floor); const agitated = run.stress >= agitationThreshold(run.stressCap);
  const loverResponse = offers.some((rider) => rider.calledByLover); const firstPairLesson = run.floor === 1 && guidedShift;
  const firstPairActive = run.cabin.some((rider, slot) => rider?.kind === 'lover' && hasNeighbour(run.cabin, slot, ['lover']));
  const upgradeCrisis: UpgradeCrisis = run.status === 'upgrade' ? run.energy <= 0 && run.stress >= run.stressCap ? 'both' : run.energy <= 0 ? 'energy' : run.stress >= run.stressCap ? 'stress' : null : null;

  const earningSummary = run.lastEarnings.sources.slice(0, 2).map((line) => `${line.label} +${line.amount}`).join(' · ') + (run.lastEarnings.sources.length > 2 ? ` · 另 ${run.lastEarnings.sources.length - 2} 项` : '');
  const pressureSummary = run.lastPressure.sources.slice(0, 2).map((line) => `${line.label} ${signedDelta(line.amount)}`).join(' · ') + (run.lastPressure.sources.length > 2 ? ` · 另 ${run.lastPressure.sources.length - 2} 项` : '');
  const energySummary = run.lastEnergy.sources.slice(0, 2).map((line) => `${line.label} ${signedDelta(line.amount)}`).join(' · ') + (run.lastEnergy.sources.length > 2 ? ` · 另 ${run.lastEnergy.sources.length - 2} 项` : '');
  const activeOfferId = pendingOfferId ?? (dragged?.type === 'offer' ? dragged.id : null);
  const activeRider = dragged?.type === 'slot' ? run.cabin[dragged.slot] : selectedSlot !== null ? run.cabin[selectedSlot] : offers.find((offer) => offer.id === activeOfferId);
  const placementPlans = activeRider ? run.cabin.map((_, slot) => planPlacement(run, activeRider, slot)) : [];
  const hoveredPlan = dragOverSlot !== null ? placementPlans[dragOverSlot] : null;

  const departureForecast = `下一站 · 能源 ${energyPreview.range} · 躁动 ${pressurePreview.range}${pressurePreview.details ? ` · ${pressurePreview.details}` : ''}`;

  const resultChallenge = failureLesson(run);

  const reset = useCallback(() => { journeyTimers.current.forEach(clearTimeout); journeyTimers.current = []; if (feedbackTimer.current) clearTimeout(feedbackTimer.current); setFeedback(null); setMetricEvent(null); setReceiptOpen(false); disposeGameAudio(); const fresh = initialRun(); setRunStartBest(bestFloor); setRun(fresh); setOffers(makeOffers(1, fresh.upgrades)); setGuidedShift(false); setSelectedSlot(null); setPendingOfferId(null); setDragged(null); setDragOverSlot(null); setDoors('open'); setIntro(false); busyRef.current = false; }, [bestFloor]);
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
        playTone(soundEnabled.current, resolved.status === 'lost' ? 'danger' : 'arrive');
      }, reduced ? 70 : 470),
      setTimeout(() => { setDoors('open'); busyRef.current = false; }, reduced ? 110 : 730),
    ];
  }, [locked, sound, run, flash, reportMetrics]);
  useEffect(() => { const onKey = (event: KeyboardEvent) => {
    if (intro || help || pressureHelp || archive || receiptOpen || passengerDetails || event.repeat) return;
    if (event.key === 'Escape') { setPendingOfferId(null); setSelectedSlot(null); setDragged(null); setDragOverSlot(null); return; }
    if (event.key === 'Enter' && !(event.target instanceof HTMLElement && event.target.closest('button,input,textarea,select,[contenteditable="true"]'))) { event.preventDefault(); depart(); }
  }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [depart, intro, help, pressureHelp, archive, receiptOpen, passengerDetails]);
  const chooseUpgrade = (key: UpgradeKey) => {
    const updated = installUpgrade(run, key); if (updated === run) return;
    reportMetrics(run, updated, `购买${UPGRADES[key].name}`);
    setRun(updated); flash({ tone: 'combo', label: `${UPGRADES[key].name} · 已购入`, slots: [] }); playTone(sound, 'upgrade');
  };

  const finishShopping = () => { const next = leaveShop(run); if (next === run) return; setRun(next); if (next.status === 'playing') setOffers(makeOffers(next.floor, next.upgrades, false, Math.random, next.cabin)); };

  return <main className={`game-shell ${difficultyTier(run.floor) % 2 ? 'phase-dawn' : ''}`}>
    <div className="ambient-grain" />
    <header className="brand-bar"><div><p className="eyebrow">A MIDNIGHT MANAGEMENT TALE</p><h1>Elevator Tales</h1></div><div className="brand-actions"><button className="icon-button" onClick={() => setHelp(true)} aria-label="玩法说明"><HelpCircle /></button><button className="icon-button" onClick={() => { soundEnabled.current = !sound; if (sound) disposeGameAudio(); setSound(!sound); }} aria-label={sound ? '关闭声音' : '打开声音'}>{sound ? <Volume2 /> : <VolumeX />}</button><button className="text-button" onClick={() => setArchive(true)}>乘客档案 <span>{String(unlocked.length).padStart(2, '0')} / 18</span></button></div></header>
    <section className="game-grid">
      <aside className="status-rail">
        <div className="floor-plaque"><span>当前楼层 · BEST {bestFloor}</span><strong>{String(run.floor).padStart(2, '0')}</strong><small>{phase}</small><progress className="floor-progress" aria-label={`距离 ${nextShop} 层商店还有 ${nextShop - run.floor} 站`} max={10} value={run.floor % 10} /></div>
        <div data-metric="energy" className={`meter-card energy ${energyPreview.danger ? 'meter-danger' : ''}`} title={energyPreview.summary}><div><BatteryCharging /><span>能源</span><b><AnimatedNumber value={run.energy} /></b></div><MetricResponse metric="energy" event={metricEvent} /><div className="meter-track"><i style={{ width: `${Math.max(0, Math.min(100, run.energy / run.energyCap * 100))}%` }} /></div><span className="mobile-meter-cap">上限 {run.energyCap}</span><small>NEXT {energyPreview.range} · {run.energyCap} MAX</small>{run.lastEnergy.sources.length > 0 && <div className={`energy-receipt ${run.lastEnergy.delta > 0 ? 'gained' : run.lastEnergy.delta < 0 ? 'spent' : 'balanced'}`} key={run.floor} aria-live="polite" title={energySummary}><b>{run.lastEnergy.delta === 0 ? '本层持平' : `本层 ${signedDelta(run.lastEnergy.delta)}`}</b><span>{energySummary}</span></div>}</div>
        <div data-metric="stress" className={`meter-card pressure ${agitated || pressurePreview.tone === 'danger' ? 'meter-danger' : ''}`} title={pressurePreview.summary}>
          <div><Gauge /><span className="meter-label">躁动<button className="meter-help" onClick={() => setPressureHelp(true)} aria-label="查看躁动规则"><HelpCircle /></button></span><b><AnimatedNumber value={run.stress} /></b></div>
          <MetricResponse metric="stress" event={metricEvent} /><div className="meter-track pressure-track"><span className="agitation-threshold" style={{ left: `${agitationThreshold(run.stressCap) / run.stressCap * 100}%` }} /><i style={{ width: `${Math.min(100, run.stress / run.stressCap * 100)}%` }} /></div>
          <span className="mobile-meter-cap">上限 {run.stressCap}</span><span className="mobile-agitation-state">{agitated ? '耐心每站 −2' : `${agitationThreshold(run.stressCap)} 起耐心 ×2`}</span><small>下站 {pressurePreview.range} · 上限 {run.stressCap}</small><div className="agitation-state"><b>{agitated ? '全员耐心每站 −2' : `${agitationThreshold(run.stressCap)} 起：耐心加速消耗`}</b><span>{crowdAgitation(occupied) > 0 ? `拥挤 +${crowdAgitation(occupied)} / 站` : occupied <= 2 ? '宽松 −1 / 站' : '3 人：不拥挤'}{shiftAgitation(run.floor + 1, occupied) > 0 ? ` · 疲劳 +${shiftAgitation(run.floor + 1, occupied)}` : ''}</span></div>
        </div>
        <div data-metric="weight" className={`load-card ${weight > 8 ? 'load-warn' : ''}`}><Weight /><span>载重</span><b><AnimatedNumber value={weight} /> / {run.weightCap}</b><MetricResponse metric="weight" event={metricEvent} /></div>
        <div data-metric="coins" className="score-card wallet-card"><Coins /><span>可用金币</span><strong><AnimatedNumber value={run.coins} /></strong><MetricResponse metric="coins" event={metricEvent} /><span className="mobile-shop-note">{nextShop - run.floor} 站到商店</span><small>本班累计赚取 {run.earned}<br />{nextShop} 层商店 · 还剩 {nextShop - run.floor} 站</small></div>

        {metricEvent && <button className="receipt-button" onClick={() => setReceiptOpen(true)}><BookOpen /> 本次变化明细 <span>↗</span></button>}
        <div className="event-log">{run.log.slice(0, 3).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div>
      </aside>
      <section className={`elevator-stage doors-${doors} ${activeRider ? 'is-placing' : ''} ${agitated ? 'cabin-agitated' : ''}`} aria-label="电梯座舱" aria-busy={doors !== 'open'}>
        <div className="elevator-image" /><div className="motion-lines" /><div className="floor-indicator"><ArrowUp /><b key={run.floor}>{String(run.floor).padStart(2, '0')}</b></div><div className="cabin-title"><span>CAR № 07</span><i /><span>{occupied} / 6 OCCUPIED</span></div>
        <div className="adjacency-key"><i />连线站位互为邻座</div>
        {feedback && <output key={feedback.id} className={`cabin-feedback feedback-${feedback.tone}`}>
          <div className="feedback-label">{feedback.tone === 'error' ? <X /> : feedback.tone === 'combo' ? <Sparkles /> : <Check />}<b>{feedback.label}</b></div>
          {feedback.tone === 'arrival' && <div className="feedback-values">{Boolean(feedback.coins) && <span className="value-coins"><Coins /><small>金币</small>+{feedback.coins}</span>}<span className={feedback.energy! > 0 ? 'value-gain' : feedback.energy! < 0 ? 'value-spent' : 'value-neutral'}><BatteryCharging /><small>能源</small>{signedDelta(feedback.energy ?? 0)}</span><span className={feedback.pressure! > 0 ? 'value-danger' : feedback.pressure! < 0 ? 'value-gain' : 'value-neutral'}><Gauge /><small>躁动</small>{signedDelta(feedback.pressure ?? 0)}</span></div>}
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
            {rider ? <span className="rider-visual" key={rider.id}><Portrait kind={rider.kind} large /><span className="slot-destination">还剩 {Math.max(0, rider.destination - run.floor)} 站</span>{state && rider.kind !== 'bomb' && <span className={`slot-state ${state.tone}`}>{state.label}</span>}<span className="rider-name">{PASSENGERS[rider.kind].name}</span><span className={`patience patience-${Math.min(3, rider.patience)}`} title={`剩余耐心 ${rider.patience}`}>{'◆'.repeat(Math.max(0, Math.min(5, rider.patience)))}</span>{rider.fuse !== undefined && <span className="fuse">引信 {rider.fuse}</span>}</span> : <><span className="slot-number">{String(index + 1).padStart(2, '0')}</span>{target && plan?.ok && activeRider && <span className="placement-ghost"><Portrait kind={activeRider.kind} large /></span>}</>}
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
        <div className="passenger-list" key={run.floor} aria-label="本层候客乘客">
          {offers.map((offer) => {
            const spec = PASSENGERS[offer.kind]; const brief = passengerBrief(offer, run.floor);
            const boarded = run.cabin.some((rider) => rider?.id === offer.id); const pending = pendingOfferId === offer.id;
            const full = !boarded && cabinFull; const tooHeavy = !boarded && weight + spec.weight > run.weightCap;
            const unavailable = full || tooHeavy; const isDragging = dragged?.type === 'offer' && dragged.id === offer.id;
            const partner = unavailable ? null : readyPartner(offer.kind, run.cabin, offer.id);
            return <div className="passenger-item" key={offer.id}><button className={`passenger-card tone-${spec.tone} ${offer.calledByLover ? 'lover-called' : ''} ${firstPairLesson && offer.kind === 'lover' ? 'guided-lover' : ''} ${boarded ? 'boarded' : ''} ${pending ? 'pending' : ''} ${isDragging ? 'dragging' : ''}`} onClick={() => toggleOffer(offer)} draggable={!locked && !unavailable} onDragStart={(event) => startDrag(event, { type: 'offer', id: offer.id })} onDragEnd={endDrag} disabled={locked || unavailable} aria-pressed={boarded || pending}>
              <span className="mobile-passenger-summary">
                <Portrait kind={offer.kind} /><strong>{spec.name}</strong><span className="mobile-trip">还剩 {brief.distance} 站</span>
                <span className="mobile-facts">载重 {spec.weight} · 耐心 {offer.patience}</span>
                <span className="mobile-reward"><span>到站金币 +{brief.coins + brief.tip}</span><span>能源 +{brief.energy}</span></span>
                <span className={`mobile-card-state ${offer.fuse !== undefined ? 'fact-danger' : ''}`}>{boarded ? '已上车 · 撤回' : pending ? '已选 · 点空位' : full ? '车厢已满' : tooHeavy ? '载重不足' : offer.fuse !== undefined ? `引信 ${offer.fuse} · 危险` : partner ? `联动 · ${PASSENGERS[partner].name}` : '点选上车'}</span>
              </span>
              <span className="passenger-heading"><Portrait kind={offer.kind} /><span className="passenger-identity"><strong>{spec.name}</strong><span className="passenger-destination"><b>还剩 {brief.distance} 站</b><span> · 送达后领取奖励</span></span></span></span>
              <span className="passenger-facts"><span>占载重 <b>{spec.weight}</b></span><span title="每站通常消耗 1 点，高躁动时消耗 2 点；归零提前离开，并增加 2 躁动。">耐心 <b>{offer.patience} 点</b></span>{offer.fuse !== undefined && <span className="fact-danger">引信 <b>{offer.fuse} 格</b></span>}{spec.risk && <span className="fact-danger">{spec.risk.label}</span>}</span>
              <span className="arrival-reward"><span>到站基础奖励</span><span className="reward-coins"><Coins />金币 <b>+{brief.coins}</b></span><span className="reward-energy"><BatteryCharging />能源 <b>{brief.energy ? `+${brief.energy}` : '0'}</b></span></span>
              {brief.tip > 0 && <span className="passenger-tip">另有升级小费 +{brief.tip} 金币，不参与车费倍率。</span>}
              <span className="passenger-rules">{brief.rules.map((rule) => <span key={rule}>{rule}</span>)}</span>
              <span className="passenger-action"><span>{boarded ? '已上车 · 点击可撤回' : pending ? '已选中 · 请安排站位' : full ? '轿厢已满 · 暂不能上车' : tooHeavy ? '剩余载重不足' : '拖入空位，或点选安排'}</span>{partner ? <b>可联动 · {PASSENGERS[partner].name}</b> : firstPairLesson && offer.kind === 'lover' ? <b>教学配对</b> : offer.calledByLover ? <b>回应呼唤</b> : null}</span>
            </button><button className="mobile-rule-button" onClick={() => setPassengerDetails(offer)} aria-label={`查看${spec.name}规则`}><HelpCircle /></button></div>;
          })}
        </div>
        <div className="departure-controls">
          <button className="mobile-inspect-button" disabled={!activeRider || locked} onClick={() => activeRider && setPassengerDetails(activeRider)} aria-label="查看选中人物规则"><BookOpen /><span>人物</span></button>
          <button className="depart-button" onClick={depart} disabled={locked}><span>{doors === 'open' ? '关门上行' : '正在上行'}</span><b>ENTER</b><ArrowUp className="mobile-depart-arrow" /></button>
          <p className={`mobile-departure-note forecast-${forecastTone}`} aria-live="polite">{pendingOfferId ? `已选${activeRider ? PASSENGERS[activeRider.kind].name : '乘客'} · 点下方空位` : selectedSlot !== null ? '点另一站位换位 · 再点原位取消' : firstPairLesson && !firstPairActive ? '先选上方恋人，再点相邻的两个空位' : `下一站：能源 ${energyPreview.range} · 躁动 ${pressurePreview.range}`}</p>
          <p className={`panel-hint forecast-${forecastTone}`} aria-live="polite">{pendingOfferId ? '已选中乘客 · 请点电梯里的目标空位' : firstPairLesson && !firstPairActive ? '第一班 · 把两位恋人放进连线相连的站位' : departureForecast}</p>
        </div>
      </aside>
    </section>
    <footer className="footer-line"><span>ELV–07 / v5.1</span><i /><span>THE CITY NEVER REALLY SLEEPS</span></footer>

    <Dialog open={passengerDetails !== null} onOpenChange={(open) => !open && setPassengerDetails(null)}><DialogContent className="story-dialog passenger-detail-dialog">
      {passengerDetails && <><p className="dialog-kicker">PASSENGER NOTES</p><DialogHeader><DialogTitle>{PASSENGERS[passengerDetails.kind].name}</DialogTitle><DialogDescription>还剩 {Math.max(0, passengerDetails.destination - run.floor)} 站 · 载重 {PASSENGERS[passengerDetails.kind].weight} · 耐心 {passengerDetails.patience}{passengerDetails.fuse !== undefined ? ` · 引信 ${passengerDetails.fuse}` : ''}</DialogDescription></DialogHeader>
        <div className="passenger-detail-reward">到站基础奖励：金币 +{passengerBrief(passengerDetails, run.floor).coins} · 能源 +{passengerBrief(passengerDetails, run.floor).energy}{passengerDetails.fareBonus ? ` · 另有小费 +${passengerDetails.fareBonus}` : ''}</div>
        <div className="passenger-detail-rules">{passengerBrief(passengerDetails, run.floor).rules.map((rule) => <p key={rule}>{rule}</p>)}</div>
        <Button className="story-primary" onClick={() => setPassengerDetails(null)}>返回安排</Button>
      </>}
    </DialogContent></Dialog>

    <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}><DialogContent className="story-dialog receipt-dialog">
      <p className="dialog-kicker">DECISION RECEIPT</p><DialogHeader><DialogTitle>这次，改变了什么？</DialogTitle><DialogDescription>{metricEvent?.label}。以下是实际变化，不是下一层预测。</DialogDescription></DialogHeader>
      <div className="receipt-sections">{metricEvent?.changes.map((change) => <section key={change.key} className={`receipt-section pulse-${change.tone}`}>
        <h3><span>{change.label}</span><b>{change.before} → {change.after}<em>{signedDelta(change.delta)}</em></b></h3>
        {change.sources.map((source, index) => <p key={`${index}-${source.label}`}><span>{source.label}</span><b>{signedDelta(source.amount)}</b></p>)}
        {change.capDelta !== 0 && <p><span>{change.label}上限</span><b>{signedDelta(change.capDelta)}</b></p>}
      </section>)}</div>
    </DialogContent></Dialog>
    <Dialog open={intro} onOpenChange={setIntro}><DialogContent className="story-dialog intro-dialog" showCloseButton={false}><p className="dialog-kicker">CAR № 07 · 00:17 AM</p><DialogHeader><DialogTitle>今晚，所有人<br />都想再上一层。</DialogTitle><DialogDescription>安排六个站位，让合适的人彼此相邻。没有终点，越往上越难。送客赚取金币，每十层购买升级，挑战自己的最高楼层。</DialogDescription></DialogHeader><div className="intro-rules"><span><b>01</b> 拖拽或点选</span><span><b>02</b> {guidedShift ? '先让恋人相邻' : '看连线配邻座'}</span><span><b>03</b> 关门上行</span></div><Button className="story-primary" onClick={() => setIntro(false)}>开始午夜班次 <ArrowUp /></Button><button className="story-link" onClick={() => { setIntro(false); setHelp(true); }}>先阅读值班手册</button></DialogContent></Dialog>
    <Dialog open={help} onOpenChange={setHelp}><DialogContent className="story-dialog manual-dialog"><p className="dialog-kicker">ENDLESS SHIFT MANUAL</p><DialogHeader><DialogTitle>值班手册</DialogTitle><DialogDescription>楼层就是成绩；金币是购买升级的预算。没有最后一层。</DialogDescription></DialogHeader><div className="manual-grid">
      <div><b>拖拽安排</b><p>把人物拖进站位，或先点乘客再点空位。连线两端互为邻座。</p></div>
      <div><b>还剩几站</b><p>每次关门上行算一站，人物身上的剩余站数会递减；幽灵可能延误邻座。</p></div>
      <div><b>躁动会传染</b><p>4–5人每站 +1，满6人 +2；最多2人时 −1。每位乘客到站再 −1。达到上限会结束本班。</p></div>
      <div><b>高躁动与耐心</b><p>躁动达到上限的三分之二时，每站耐心改为 −2。耐心归零提前离开，没有到站奖励，并额外 +2 躁动。</p></div>
      <div><b>十层商店</b><p>三张卡分别标价，每张本次限买一次。可以买多张，也可不买离开；购买扣除金币。后期与重复升级更贵。</p></div>
      <div><b>无尽难度</b><p>每过30层，基础行驶多耗1能源；有乘客时每站也多1长班疲劳。安排安抚、快速送达和升级，撑得更久。</p></div>
    </div></DialogContent></Dialog>
    <Dialog open={pressureHelp} onOpenChange={setPressureHelp}><DialogContent className="story-dialog pressure-dialog"><p className="dialog-kicker">CABIN AGITATION</p><DialogHeader><DialogTitle>人多、等得久，就会躁动。</DialogTitle><DialogDescription>躁动达到 {agitationThreshold(run.stressCap)}：全员耐心每站消耗2点；达到 {run.stressCap}：本班失控。音乐家、护士和快速送达能缓解。</DialogDescription></DialogHeader><div className="pressure-rule-grid">
      <section className="pressure-rise"><small>会增加躁动</small><b>轿厢拥挤</b><p>4–5人每站 +1；满6人每站 +2。</p><b>长班疲劳</b><p>每过30层，有乘客时每站多 +1；下一站 +{shiftAgitation(run.floor + 1, occupied)}。</p><b>人物事件</b><p>未受控小偷、醉汉、被围住的名人和超载检查，会按卡片规则增加躁动。</p><b>耐心归零</b><p>每位提前离开的乘客 +2。</p></section>
      <section className="pressure-relief"><small>可以主动缓解</small><b>少接一点</b><p>车内最多2人，每站 −1；3人没有拥挤增量。</p><b>快速送达</b><p>每位正常到站的乘客 −1。</p><b>安排安抚角色</b><p>至少4人时音乐家每站 −1；护士每逢偶数层 −1。</p><b>购买舒缓系统</b><p>立即 −6 躁动，上限 +3。不再需要维持“热区”来赚小费。</p></section>
    </div><div className={`pressure-now forecast-${pressurePreview.tone}`}><small>按现在的站位</small><b>{pressurePreview.summary}</b></div></DialogContent></Dialog>
    <Dialog open={archive} onOpenChange={setArchive}><DialogContent className="story-dialog archive-dialog"><p className="dialog-kicker">PASSENGER ARCHIVE</p><DialogHeader><DialogTitle>午夜乘客档案</DialogTitle><DialogDescription>最高抵达 {highest}F。更高楼层会出现更难处理的乘客。</DialogDescription></DialogHeader><div className="archive-grid">{PASSENGER_ORDER.map((kind) => { const open = unlocked.includes(kind); const spec = PASSENGERS[kind]; return <div className={`archive-item ${open ? '' : 'locked'}`} key={kind}>{open ? <Portrait kind={kind} /> : <LockKeyhole />}<span><b>{open ? spec.name : '未解锁'}</b><small>{open ? spec.short : '继续向上抵达新楼层'}</small></span></div>; })}</div></DialogContent></Dialog>
    <Dialog open={run.status === 'upgrade'}><DialogContent className={`story-dialog upgrade-dialog ${upgradeCrisis ? 'upgrade-crisis' : ''}`} showCloseButton={false}>
      <p className="dialog-kicker">FLOOR {run.floor} · MAINTENANCE SHOP</p><DialogHeader><DialogTitle><span className="desktop-shop-copy">{upgradeCrisis ? '先维修，再继续上行' : '把这一程收入，投进下一程。'}</span><span className="mobile-shop-copy">{run.floor} 层 · {upgradeCrisis ? '紧急维修' : '补给站'}</span></DialogTitle><DialogDescription><span className="desktop-shop-copy">每张卡本次限购一次；可以买多张，也可以攒钱离开。已安装的效果持续整班。</span><span className="mobile-shop-copy">按需购卡，可买多张，也可离开。</span></DialogDescription></DialogHeader>
      <div className="shop-wallet"><span><Coins />可用金币 <b key={run.coins}>{run.coins}</b></span><span>累计收入 {run.earned} · 已花费 {run.earned - run.coins}</span></div>
      {upgradeCrisis && <p className="shop-warning">{upgradeCrisis === 'both' ? '能源与躁动同时失控：需要购买回能卡和舒缓系统，两项都修复才能继续。' : upgradeCrisis === 'energy' ? '能源已耗尽：购买回能卡，将能源恢复到 0 以上才能继续。' : '躁动已超限：购买舒缓系统，将躁动降到上限以下才能继续。'} 若无力修复，本班将在这里结束。</p>}
      <div className="upgrade-grid">{run.shop.map((card) => { const key = card.key; const affordable = run.coins >= card.price; const rescue = rescuesCrisis(key, upgradeCrisis); return <button key={key} className={`${rescue ? 'crisis-rescue' : ''} ${card.purchased ? 'shop-purchased' : ''}`} disabled={card.purchased || !affordable} onClick={() => chooseUpgrade(key)} aria-label={`${UPGRADES[key].name}，${card.price} 金币${card.purchased ? '，已购入' : !affordable ? '，金币不足' : ''}`}>
        <span className="upgrade-card-head"><small>{UPGRADES[key].label}</small><i className={`upgrade-strategy strategy-${UPGRADES[key].tone}`}>{UPGRADES[key].strategy}</i></span><b>{UPGRADES[key].name}</b><p>{UPGRADES[key].description}</p><em>{card.purchased ? '本层已安装，下一家商店再见' : upgradeImpact(key, run)}</em><span className="shop-price"><Coins /><strong>{card.price}</strong><span>{card.purchased ? '✓ 已购入' : affordable ? '购买并安装' : `还差 ${card.price - run.coins} 金币`}</span></span>
      </button>; })}</div>
      {metricEvent && <p className="shop-receipt" aria-live="polite">{metricEvent.label}{metricEvent.changes.map((change) => ` · ${change.label} ${signedDelta(change.delta)}${change.capDelta ? `（上限 ${signedDelta(change.capDelta)}）` : ''}`).join('')}</p>}
      <Button className="story-primary" onClick={finishShopping}>{upgradeCrisis ? '无力修复 · 结束本班' : '离开商店 · 继续上行'}<ArrowUp /></Button>
    </DialogContent></Dialog>
    <Dialog open={run.status === 'lost'}><DialogContent className="story-dialog result-dialog" showCloseButton={false}><p className="dialog-kicker">ENDLESS SHIFT · {run.floor}F</p><DialogHeader><DialogTitle>{run.floor > runStartBest ? '新的高度，下一班再超越。' : '这趟电梯，停下了。'}</DialogTitle><DialogDescription>{run.message}</DialogDescription></DialogHeader><div className="result-score"><span>本班抵达 <b>{run.floor} 层</b></span><span>无尽纪录 <b>{bestFloor} 层</b></span><span>累计赚取 <b>{run.earned}</b></span><span>升级花费 <b>{run.earned - run.coins}</b></span></div><p className="result-challenge failure">{resultChallenge}</p><p className="result-investment">{upgradeCount} 次升级 · 剩余 {run.coins} 金币。金币只在本班使用，下一班重新开始。</p><Button className="story-primary" onClick={reset}><RotateCcw /> 再开一班 · 挑战更高楼层</Button><button className="story-link" onClick={() => setArchive(true)}><BookOpen /> 查看乘客档案</button></DialogContent></Dialog>
  </main>;
}
