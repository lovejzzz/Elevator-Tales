'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { ArrowUp, Layers, UserMinus, BatteryCharging, BookOpen, Check, Coins, Gauge, HelpCircle, LockKeyhole, RotateCcw, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ADJACENT, PASSENGER_ORDER, PASSENGERS, UPGRADES, type PassengerKind, type UpgradeKey } from '@/lib/game-data';
import { CHARGE_PRICE, INITIAL_ENERGY, ENERGY_CAPACITY, INSPECTOR_ENERGY_LIMIT, energyBreakdown, eventPressureMultiplier, riderAgitation, shiftOutlook, COOPERATION_RELIEF, cooperationRelief, chargeBattery, chargingPlan, cooperationBonus, dismissalCost, dismissRider, installedUpgradeSummary, agitationThreshold, crowdAgitation, difficultyTier, EMPTY_UPGRADES, failureLesson, hasNeighbour, initialRun, installUpgrade, leaveShop, makeOffers, neighbourCount, nextShopFloor, previewUpgrade, readyPartner, resolveFloor, shiftAgitation, unlockedAt, type Rider, type RunState, type UpgradeCrisis } from '@/lib/game-engine';
import { energyForecast, stressForecast } from '@/lib/game-forecast';
import { conflictingConnection, activeConnection, planPlacement, type PlacementResult } from '@/lib/game-interaction';
import { disposeGameAudio, playGameSound as playTone, playMetricSounds } from '@/lib/game-audio';
import { bondStatus } from '@/lib/rider-profile';
import { portraitAsset } from '@/lib/passenger-assets';
import { passengerBrief, passengerFace, SHARED_SAVING_RULE, type PassengerRuleBlock } from '@/lib/passenger-presentation';
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

// Explicit line breaks keep each rule readable even if a legacy span style
// changes its layout. Each line is also a complete, punctuated sentence.
function PassengerRuleBlocks({ rules }: { rules: PassengerRuleBlock[] }) {
  return <span className="passenger-rule-blocks">{rules.map(rule=><span key={rule.heading} className={`passenger-rule-block rule-${rule.tone}`}><b>{rule.heading}</b>{rule.lines.map(line=><span key={line}><br />{line}</span>)}{rule.note&&<span className="rule-note"><br />{rule.note}</span>}</span>)}</span>;
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
const shiftPhase = (floor: number) => floor <= 10 ? '午夜启程' : '无尽班次';

function Portrait({ kind, large = false }: { kind: PassengerKind; large?: boolean }) {
  const asset = portraitAsset(kind); const x = asset.cell % asset.columns; const y = Math.floor(asset.cell / asset.columns);
  return <span className={`portrait-window ${large ? 'portrait-large' : ''}`} aria-hidden="true"><span className="portrait-sheet" style={{ backgroundImage: `url(${asset.src})`, backgroundSize: `${asset.columns * 100}% ${asset.rows * 100}%`, backgroundPosition: `${asset.columns > 1 ? x * 100 / (asset.columns - 1) : 50}% ${asset.rows > 1 ? y * 100 / (asset.rows - 1) : 50}%` }} /></span>;
}

// One card face at every breakpoint: no separate mobile rulebook to drift.
function PassengerCardFace({ rider, run, action }: { rider: Rider; run: RunState; action: string }) {
  const brief=passengerBrief(rider,run.floor,run.cabin,cooperationBonus(run),cooperationRelief(run),eventPressureMultiplier(run));
  const face=passengerFace(rider,run);
  const agitationText=face.pressure.join('；').replace('自身躁动','自身');
  return <span className="unified-passenger-summary">
    <span className="card-head"><Portrait kind={rider.kind}/><span><strong>{PASSENGERS[rider.kind].name}</strong><span className="card-trip">还剩 {brief.distance} 站</span></span></span>
    <span className="card-values">
      <b className="card-fare" aria-label={brief.coins===null?'到站金币待揭晓':`到站金币 ${brief.coins}`} title="到站金币"><Coins aria-hidden="true" />{brief.coins===null?'?':brief.coins}</b>
      <span className="card-energy" aria-label={`每站耗电 ${brief.energy}`} title="每站耗电"><BatteryCharging aria-hidden="true" />{brief.energy}/站</span>
      <span className="card-agitation" aria-label={`躁动 ${agitationText}`} title="躁动"><Gauge aria-hidden="true" />{agitationText}</span>
    </span>
    {brief.tip>0&&<span className="card-tip" aria-label={`另有小费 ${brief.tip} 金币，不翻倍`}><Coins aria-hidden="true" />+{brief.tip} 小费（不翻倍）</span>}
    <span className="card-skills">{[...face.energy.slice(1),face.moneyNote,face.special].filter(Boolean).map(line=><span key={line}>{line}</span>)}</span>
    <span className="card-cooperation"><span>本人到站仍邻{brief.cooperation.partners.join('或')}</span><b aria-label={`协作奖励 ${cooperationBonus(run)} 金币${cooperationRelief(run)>0?`，减少 ${cooperationRelief(run)} 躁动`:''}`}><span><Coins aria-hidden="true" />+{cooperationBonus(run)}</span>{cooperationRelief(run)>0&&<span><Gauge aria-hidden="true" />−{cooperationRelief(run)}</span>}</b></span>
    <span className="card-conflict">{face.conflict.replace('挨','邻')} 躁动</span>
    <span className="card-action">{action}</span>
  </span>;
}

function riderState(cabin: Array<Rider | null>, slot: number, totalEnergy: number, bonus: number): { label: string; tone: 'active' | 'warn' | 'neutral' } | null {
  const rider = cabin[slot];
  if (!rider) return null;
  const bond = bondStatus(rider,cabin,slot);
  if (bond.conflict) return {label:'邻座冲突',tone:'warn'};
  if(rider.kind==='mystery')return {label:bond.supported?`协作到站 +${bonus}`:'车费待揭晓',tone:bond.supported?'active':'neutral'};
  if(rider.kind==='shifter')return {label:`耗电 ${bond.energy} · 躁动 +${bond.agitation}`,tone:'warn'};
  if(rider.kind==='mimic')return {label:`复制 ${bond.copies.length} 项`,tone:bond.copies.length?'active':'neutral'};
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
    case 'inspector': return totalEnergy <= INSPECTOR_ENERGY_LIMIT ? { label: `耗电${totalEnergy}≤${INSPECTOR_ENERGY_LIMIT} · 偶数层奖1币`, tone: 'active' } : { label: `耗电${totalEnergy}>${INSPECTOR_ENERGY_LIMIT} · 偶数层加躁`, tone: 'warn' };
    case 'musician': return cabin.filter(Boolean).length >= 4 ? { label: '正在演奏', tone: 'active' } : null;
    case 'nurse': return hasNeighbour(cabin, slot, ['drunk', 'child']) ? { label: '正在安抚', tone: 'active' } : null;
    default: return bond.supported ? {label:`协作到站 +${bonus}`,tone:'active'} : null;
  }
}

const CONNECTION_POINTS = [[47, 50], [150, 50], [253, 50], [47, 150], [150, 150], [253, 150]];

const rescuesCrisis = (key: UpgradeKey, run: RunState) => {
  const preview = previewUpgrade(run, key);
  return run.stress >= run.stressCap && preview.stress < preview.stressCap;
};

function upgradeImpact(key: UpgradeKey, run: RunState): string {
  const preview = previewUpgrade(run, key);
  switch (key) {
    case 'battery': return `协作到站 +${cooperationBonus(run)} → +${cooperationBonus(preview)} 金币；${run.upgrades.battery ? '舒缓仍为' : '另减'} ${cooperationRelief(preview)} 躁动，全车每层仅1次，不叠加。购买时不立即减躁动。`;
    case 'calm': return `躁动 ${run.stress}/${run.stressCap} → ${preview.stress}/${preview.stressCap}`;
    case 'reinforced': return '每站抵消1点人物耗电 · 本局唯一';
    case 'solar': return '4的倍数层抵消1点人物耗电 · 与其他节能共享每站1电上限';
    case 'concierge': return `新乘客到站小费 +${(run.upgrades.concierge + 1) * 3}`;
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
  const [inventoryOpen,setInventoryOpen]=useState(false);
  const [ejectArmed,setEjectArmed]=useState(false);
  const [leaveArmed,setLeaveArmed]=useState(false);
  const [intro, setIntro] = useState(true); const [help, setHelp] = useState(false); const [pressureHelp, setPressureHelp] = useState(false); const [archive, setArchive] = useState(false); const [sound, setSound] = useState(true);
  const [highest, setHighest] = useState(1); const [bestFloor, setBestFloor] = useState(1); const [runStartBest, setRunStartBest] = useState(1); const busyRef = useRef(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [metricEvent, setMetricEvent] = useState<MetricEvent | null>(null);
  const soundEnabled = useRef(true);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const metricEventId = useRef(0);
  const feedbackId = useRef(0); const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null); const journeyTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const locked = doors !== 'open' || run.status !== 'playing' || intro || help || pressureHelp || archive || receiptOpen || passengerDetails !== null || inventoryOpen;
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

  useEffect(() => { const frame=requestAnimationFrame(() => { const savedBest = Math.max(1, Number(localStorage.getItem('elevator-tales-endless-best-floor') || 1)); const savedHighest = Math.max(1, Number(localStorage.getItem('elevator-tales-highest') || 1)); const shouldGuide = savedBest <= 1 || new URLSearchParams(window.location.search).get('tutorial') === '1'; setHighest(savedHighest); setBestFloor(savedBest); setRunStartBest(savedBest); setGuidedShift(shouldGuide); setOffers(makeOffers(1, EMPTY_UPGRADES, shouldGuide)); });return()=>cancelAnimationFrame(frame); }, []);
  useEffect(() => { const frame=requestAnimationFrame(()=>{ if (run.floor > highest) { setHighest(run.floor); localStorage.setItem('elevator-tales-highest', String(run.floor)); } if (run.floor > bestFloor) { setBestFloor(run.floor); localStorage.setItem('elevator-tales-endless-best-floor', String(run.floor)); } });return()=>cancelAnimationFrame(frame); }, [run.floor, highest, bestFloor]);

  const power = energyBreakdown(run); const occupied = run.cabin.filter(Boolean).length; const cabinFull = occupied === run.cabin.length; const unlocked = unlockedAt(Math.max(run.floor, highest));
  const outlook = shiftOutlook(run.floor, occupied, run.restStops);
  const pressurePreview = useMemo(() => stressForecast(run), [run]); const energyPreview = useMemo(() => energyForecast(run), [run]);
  const forecastTone = energyPreview.danger ? 'danger' : pressurePreview.tone;
  const phase = shiftPhase(run.floor); const upgradeCount = Object.values(run.upgrades).reduce((sum, count) => sum + count, 0); const nextShop = nextShopFloor(run.floor); const agitated = run.stress >= agitationThreshold(run.stressCap);
  const loverResponse = offers.some((rider) => rider.calledByLover); const firstPairLesson = run.floor === 1 && guidedShift;
  const showSavingRule=run.upgrades.solar>0||[...offers,...run.cabin].some(r=>r&&['mechanic','ghost','exorcist'].includes(r.kind));
  const firstPairActive = run.cabin.some((rider, slot) => rider?.kind === 'lover' && hasNeighbour(run.cabin, slot, ['lover']));
  const upgradeCrisis: UpgradeCrisis = run.status === 'upgrade' ? run.energy <= 0 && run.stress >= run.stressCap ? 'both' : run.energy <= 0 ? 'energy' : run.stress >= run.stressCap ? 'stress' : null : null;

  const earningSummary = run.lastEarnings.sources.slice(0, 2).map((line) => `${line.label} +${line.amount}`).join(' · ') + (run.lastEarnings.sources.length > 2 ? ` · 另 ${run.lastEarnings.sources.length - 2} 项` : '');
  const pressureSummary = run.lastPressure.sources.slice(0, 2).map((line) => `${line.label} ${signedDelta(line.amount)}`).join(' · ') + (run.lastPressure.sources.length > 2 ? ` · 另 ${run.lastPressure.sources.length - 2} 项` : '');
  const energySummary = run.lastEnergy.sources.slice(0, 2).map((line) => `${line.label} ${signedDelta(line.amount)}`).join(' · ') + (run.lastEnergy.sources.length > 2 ? ` · 另 ${run.lastEnergy.sources.length - 2} 项` : '');
  const activeOfferId = pendingOfferId ?? (dragged?.type === 'offer' ? dragged.id : null);
  const activeRider = dragged?.type === 'slot' ? run.cabin[dragged.slot] : selectedSlot !== null ? run.cabin[selectedSlot] : offers.find((offer) => offer.id === activeOfferId);
  const placementPlans = activeRider ? run.cabin.map((_, slot) => planPlacement(run, activeRider, slot)) : [];
  const hoveredPlan = dragOverSlot !== null ? placementPlans[dragOverSlot] : null;

  const departureForecast = `下一站 · 电量 ${energyPreview.range} · 躁动 ${pressurePreview.range}${pressurePreview.details ? ` · ${pressurePreview.details}` : ''}`;

  const resultChallenge = failureLesson(run);
  const chargePlan=chargingPlan(run);
  const detailRider=passengerDetails ? run.cabin.find(r=>r?.id===passengerDetails.id) ?? offers.find(r=>r.id===passengerDetails.id) ?? passengerDetails : null;
  const detailBrief=detailRider ? passengerBrief(detailRider,run.floor,run.cabin,cooperationBonus(run),cooperationRelief(run),eventPressureMultiplier(run)) : null;
  const detailOnboard=detailRider ? run.cabin.some(r=>r?.id===detailRider.id) : false;
  const canDismiss=Boolean(detailRider&&detailOnboard&&detailRider.boardedAt<run.floor&&run.status==='playing'&&doors==='open');
  const penalty=detailRider?dismissalCost(run,detailRider):0;

  const reset = useCallback(() => { journeyTimers.current.forEach(clearTimeout); journeyTimers.current = []; if (feedbackTimer.current) clearTimeout(feedbackTimer.current); setFeedback(null); setMetricEvent(null); setReceiptOpen(false); setInventoryOpen(false); setPassengerDetails(null); setEjectArmed(false); setLeaveArmed(false); disposeGameAudio(); const fresh = initialRun(); setRunStartBest(bestFloor); setRun(fresh); setOffers(makeOffers(1, fresh.upgrades)); setGuidedShift(false); setSelectedSlot(null); setPendingOfferId(null); setDragged(null); setDragOverSlot(null); setDoors('open'); setIntro(false); busyRef.current = false; }, [bestFloor]);
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
    if (selectedSlot === null) { const rider = run.cabin[slot]; if (rider) { setSelectedSlot(slot); playTone(sound, 'select'); } return; }
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
    if (intro || help || pressureHelp || archive || receiptOpen || passengerDetails || inventoryOpen || event.repeat) return;
    if (event.key === 'Escape') { setPendingOfferId(null); setSelectedSlot(null); setDragged(null); setDragOverSlot(null); return; }
    if (event.key === 'Enter' && !(event.target instanceof HTMLElement && event.target.closest('button,input,textarea,select,[contenteditable="true"]'))) { event.preventDefault(); depart(); }
  }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [depart, intro, help, pressureHelp, archive, receiptOpen, passengerDetails, inventoryOpen]);
  const chooseUpgrade = (key: UpgradeKey) => {
    setLeaveArmed(false);
    const updated = installUpgrade(run, key); if (updated === run) return;
    reportMetrics(run, updated, `购买${UPGRADES[key].name}`);
    setRun(updated); flash({ tone: 'combo', label: `${UPGRADES[key].name} · 已购入`, slots: [] }); playTone(sound, 'upgrade');
  };

  const finishShopping = () => { if(!upgradeCrisis && run.energy < chargePlan.baseline && !leaveArmed) {setLeaveArmed(true);return;} setLeaveArmed(false); const next = leaveShop(run); if (next === run) return; setRun(next); if(next.status==='lost')playTone(sound,'danger'); if (next.status === 'playing') setOffers(makeOffers(next.floor, next.upgrades, false, Math.random, next.cabin)); };

  const recharge = (units:number) => {const next=chargeBattery(run,units);if(next===run)return;setLeaveArmed(false);reportMetrics(run,next,'补给站充电');setRun(next);playTone(sound,'upgrade');};
  const confirmDismiss = () => {
    if(!detailRider||!canDismiss)return;
    const updated=dismissRider(run,detailRider.id);if(updated===run)return;
    reportMetrics(run,updated,'请离赔偿');setRun(updated);setPassengerDetails(null);setEjectArmed(false);setSelectedSlot(null);setPendingOfferId(null);
    flash({tone:'place',label:`已请离 · 赔偿 ${penalty} 金币`,slots:[]});playTone(sound,'place');
  };

  return <main className={`game-shell ${cooperationRelief(run) ? 'has-contract' : ''} ${difficultyTier(run.floor) % 2 ? 'phase-dawn' : ''}`}>
    <div className="ambient-grain" />
    <div className="rotate-notice"><RotateCcw/><h2>请竖屏游玩</h2><p>这个横屏尺寸太矮，转回竖屏即可继续；本班进度保留。</p></div>
    <header className="brand-bar"><div><p className="eyebrow">A MIDNIGHT MANAGEMENT TALE</p><h1>Elevator Tales</h1></div><div className="brand-actions"><button className="icon-button" onClick={() => setHelp(true)} aria-label="玩法说明"><HelpCircle /></button><button className="icon-button" onClick={() => { soundEnabled.current = !sound; if (sound) disposeGameAudio(); setSound(!sound); }} aria-label={sound ? '关闭声音' : '打开声音'}>{sound ? <Volume2 /> : <VolumeX />}</button><button className="icon-button inventory-button" onClick={() => setInventoryOpen(true)} aria-label={`查看已装升级，共 ${upgradeCount} 次`}><Layers /><span>{upgradeCount}</span></button><button className="text-button" onClick={() => setArchive(true)}>乘客档案 <span>{String(unlocked.length).padStart(2, '0')} / {PASSENGER_ORDER.length}</span></button></div></header>
    <section className="game-grid">
      <aside className="status-rail">
        <div className="floor-plaque"><span>当前楼层 · BEST {bestFloor}</span><strong>{String(run.floor).padStart(2, '0')}</strong><small>{phase}</small><progress className="floor-progress" aria-label={`距离 ${nextShop} 层商店还有 ${nextShop - run.floor} 站`} max={10} value={run.floor % 10} /></div>
        <div data-metric="energy" className={`meter-card energy ${energyPreview.danger ? 'meter-danger' : ''}`} title={energyPreview.summary}><div><BatteryCharging aria-hidden="true" /><span className="rail-metric-name">电量</span><b><AnimatedNumber value={run.energy} /></b></div><MetricResponse metric="energy" event={metricEvent} /><div className="meter-track"><i style={{ width: `${Math.max(0, Math.min(100, run.energy / run.energyCap * 100))}%` }} /></div><span className="mobile-meter-cap">上限 {run.energyCap}</span><small className="rail-forecast"><span>下一站 <b>{energyPreview.range}</b></span><span>上限 {run.energyCap}</span></small>{run.lastEnergy.sources.length > 0 && <div className={`energy-receipt ${run.lastEnergy.delta > 0 ? 'gained' : run.lastEnergy.delta < 0 ? 'spent' : 'balanced'}`} key={run.floor} aria-live="polite" title={energySummary}><b>{run.lastEnergy.delta === 0 ? '本层持平' : `本层 ${signedDelta(run.lastEnergy.delta)}`}</b><span>{energySummary}</span></div>}</div>
        <div data-metric="stress" className={`meter-card pressure ${agitated || pressurePreview.tone === 'danger' ? 'meter-danger' : ''}`} title={pressurePreview.summary}>
          <div><Gauge aria-hidden="true" /><span className="meter-label"><span className="rail-metric-name">躁动</span><button className="meter-help" onClick={() => setPressureHelp(true)} aria-label="查看躁动规则"><HelpCircle /></button></span><b><AnimatedNumber value={run.stress} /></b></div>
          <MetricResponse metric="stress" event={metricEvent} /><div className="meter-track pressure-track"><span className="agitation-threshold" style={{ left: `${agitationThreshold(run.stressCap) / run.stressCap * 100}%` }} /><i style={{ width: `${Math.min(100, run.stress / run.stressCap * 100)}%` }} /></div>
          <span className="mobile-meter-cap">上限 {run.stressCap}</span><span className="mobile-agitation-state">{agitated ? '人物躁动 ×2' : `${agitationThreshold(run.stressCap)} 起人物躁动 ×2`}</span><small className="rail-forecast"><span>下一站 <b>{pressurePreview.range}</b></span><span>上限 {run.stressCap}</span></small><div className="agitation-state"><b>{agitated ? '人物正向躁动 ×2' : `${agitationThreshold(run.stressCap)} 起：人物正向躁动 ×2`}</b><span>{crowdAgitation(occupied) > 0 ? `拥挤 +${crowdAgitation(occupied)} / 站` : occupied <= 2 ? '宽松 −1 / 站' : `${occupied} 人：不拥挤`}{shiftAgitation(run.floor + 1, occupied, run.restStops) > 0 ? ` · 疲劳 +${shiftAgitation(run.floor + 1, occupied, run.restStops)}` : ''}</span></div>
          <button className={`rest-stops ${run.restStops === 0 ? 'rest-empty' : ''}`} onClick={() => setPressureHelp(true)} aria-label={`空驶休整剩余 ${run.restStops} 次，查看规则`}><span><span className="rest-label-prefix">空驶</span>休整</span><b><AnimatedNumber value={run.restStops} /> / 3</b></button>
        </div>
        <div data-metric="coins" className="score-card wallet-card"><Coins aria-hidden="true" /><span className="rail-metric-name">余额</span><strong><AnimatedNumber value={run.coins} /></strong><MetricResponse metric="coins" event={metricEvent} /><span className="mobile-shop-note">{nextShop - run.floor} 站到商店</span><small className="wallet-summary"><span>本班累计 {run.earned}</span><span>{nextShop - run.floor} 站后商店</span></small></div>

        {metricEvent && <button className="receipt-button" onClick={() => setReceiptOpen(true)}><BookOpen /> 本次变化明细 <span>↗</span></button>}
        <div className="event-log">{run.log.slice(0, 3).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div>
      </aside>
      <section className={`elevator-stage doors-${doors} ${activeRider ? 'is-placing' : ''} ${agitated ? 'cabin-agitated' : ''}`} aria-label="电梯座舱" aria-busy={doors !== 'open'}>
        <div className="elevator-image" /><div className="motion-lines" /><div className="floor-indicator"><ArrowUp /><b key={run.floor}>{String(run.floor).padStart(2, '0')}</b></div><div className="cabin-title"><span>CAR № 07</span><i /><span>{occupied} / 6 OCCUPIED</span></div>
        {outlook && <div className={`adjacency-key shift-outlook ${(run.floor+1)%10!==0 ? 'peak-outlook' : ''}`}><span>{outlook}</span><span className="connection-legend">绿实线协作 · 红虚线冲突</span></div>}
        {feedback && <output key={feedback.id} className={`cabin-feedback feedback-${feedback.tone}`}>
          <div className="feedback-label">{feedback.tone === 'error' ? <X /> : feedback.tone === 'combo' ? <Sparkles /> : <Check />}<b>{feedback.label}</b></div>
          {feedback.tone === 'arrival' && <div className="feedback-values">{Boolean(feedback.coins) && <span className="value-coins" aria-label={`金币增加 ${feedback.coins}`}><Coins aria-hidden="true" />+{feedback.coins}</span>}<span aria-label={`电量 ${signedDelta(feedback.energy ?? 0)}`} className={feedback.energy! > 0 ? 'value-gain' : feedback.energy! < 0 ? 'value-spent' : 'value-neutral'}><BatteryCharging aria-hidden="true" />{signedDelta(feedback.energy ?? 0)}</span><span aria-label={`躁动 ${signedDelta(feedback.pressure ?? 0)}`} className={feedback.pressure! > 0 ? 'value-danger' : feedback.pressure! < 0 ? 'value-gain' : 'value-neutral'}><Gauge aria-hidden="true" />{signedDelta(feedback.pressure ?? 0)}</span></div>}
          {feedback.tone === 'arrival' && <p className="feedback-cause">{earningSummary || energySummary}{pressureSummary ? ` · ${pressureSummary}` : ''}</p>}
        </output>}
        {doors === 'moving' && <div className="travel-caption"><ArrowUp />前往 {String(run.floor + 1).padStart(2, '0')}F</div>}
        <div className="standing-grid"><svg className="adjacency-map" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">{ADJACENT.map(([first, second]) => {
          const active = activeConnection(run.cabin, first, second); const conflict = conflictingConnection(run.cabin,first,second);
          const preview = hoveredPlan?.ok && hoveredPlan.changed && activeConnection(hoveredPlan.next.cabin, first, second);
          const [x1,y1]=CONNECTION_POINTS[first]; const [x2,y2]=CONNECTION_POINTS[second];
          return <g key={`${first}-${second}`} className={`connection-path ${active ? 'active' : ''} ${conflict?'conflict-link':''} ${preview ? 'preview-link' : ''}`}><line className="connection-underlay" x1={x1} y1={y1} x2={x2} y2={y2}/><line className="connection-core" x1={x1} y1={y1} x2={x2} y2={y2}/>{(active||conflict||preview)&&<circle className="connection-node" cx={(x1+x2)/2} cy={(y1+y2)/2} r="3"/>}</g>;
        })}</svg>{run.cabin.map((rider, index) => {
          const state = riderState(run.cabin, index, power.total, cooperationBonus(run)); const plan = placementPlans[index]; const synergy = plan?.ok && plan.changed && plan.tone === 'combo'; const agitation=riderAgitation(run,index);
          const target = dragOverSlot === index && Boolean(activeRider); const reaction = feedback?.slots.includes(index) ? feedback : null;
          return <button key={index} className={`standing-slot ${rider ? 'occupied' : ''} ${synergy ? 'synergy-target' : ''} ${plan ? plan.ok ? 'drop-valid' : 'drop-blocked' : ''} ${selectedSlot === index ? 'selected' : ''} ${target ? 'drag-target' : ''}`} onClick={() => clickSlot(index)} disabled={locked} draggable={Boolean(rider) && !locked && (!run.swapped || rider?.boardedAt === run.floor)} onDragStart={(event) => rider && startDrag(event, { type: 'slot', slot: index })} onDragEnd={endDrag} onMouseEnter={() => activeRider && window.matchMedia('(min-width: 701px) and (hover: hover)').matches && setDragOverSlot(index)} onMouseLeave={() => !dragged && setDragOverSlot(null)} onDragOver={(event) => { if (!locked && dragged) { event.preventDefault(); event.dataTransfer.dropEffect = plan?.ok ? 'move' : 'none'; setDragOverSlot(index); } }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOverSlot((current) => current === index ? null : current); }} onDrop={(event) => dropOnSlot(event, index)} aria-label={rider ? `${index + 1}号位，${PASSENGERS[rider.kind].name}${state ? `，${state.label}` : ''}` : `${index + 1}号空位${synergy ? '，可联动' : ''}`}>
            {rider ? <span className={`rider-visual ${rider.kind==='bomb'?'rider-bomb':''}`} key={rider.id}><span className="rider-name">{PASSENGERS[rider.kind].name}</span><span className="slot-destination">还剩 {Math.max(0, rider.destination - run.floor)} 站</span><span className="seat-art"><Portrait kind={rider.kind} large /></span>{state && rider.kind !== 'bomb' && <span className={`slot-state ${state.tone}`}>{state.label}</span>}{rider.fuse !== undefined && <span className="fuse">引信 {rider.fuse}</span>}<span className="rider-direct-pressure" aria-label={`躁动 ${agitation.low===agitation.high?signedDelta(agitation.low):`${agitation.low} 到 ${signedDelta(agitation.high)}`}`}><Gauge aria-hidden="true" />{agitation.low===agitation.high?signedDelta(agitation.low):`${agitation.low}～${signedDelta(agitation.high)}`}</span></span> : <><span className="slot-number">{String(index + 1).padStart(2, '0')}</span>{target && plan?.ok && activeRider && <span className="placement-ghost"><Portrait kind={activeRider.kind} large /></span>}</>}
            {reaction && <span key={reaction.id} className={`slot-reaction reaction-${reaction.tone}`} aria-hidden="true" />}
            {target && plan && <span className={`drop-caption ${plan.ok ? 'allowed' : 'blocked'}`}>{plan.ok ? `${dragged ? '松手' : '点击'} · ${synergy ? '联动' : '就位'}` : '不可放置'}</span>}
          </button>;
        })}</div>
        <button className="cabin-inspect-button" disabled={!activeRider || locked} onClick={() => {if(activeRider){setEjectArmed(false);setPassengerDetails(activeRider);}}}><BookOpen />{activeRider ? `查看${PASSENGERS[activeRider.kind].name} · 请离` : '选中人物 · 查看 / 请离'}</button>
        <div className="door door-left" /><div className="door door-right" />
        <div className={`cabin-message ${hoveredPlan && !hoveredPlan.ok ? 'message-error' : ''}`} aria-live="polite"><Sparkles /><span>{hoveredPlan ? hoveredPlan.ok ? hoveredPlan.next.message : hoveredPlan.label : run.message}</span></div><div className="swap-status">{pendingOfferId ? '选择发光站位 · ESC 取消' : selectedSlot !== null ? '再选一个站位完成调整 · ESC 取消' : run.swapped ? <><LockKeyhole /> 旧乘客换位已用 · 新上客仍可调整</> : '拖拽人物安排站位 · 有效组合会亮起'}</div>
      </section>
      <aside className="arrival-panel">
        <div className={`arrival-heading ${loverResponse || firstPairLesson ? 'lover-response' : ''}`}><div><span>{loverResponse ? 'LOVER SIGNAL · RESPONSE' : firstPairLesson ? 'FIRST PAIR · GUIDED SHIFT' : doors === 'open' ? 'DOORS OPEN' : 'IN TRANSIT'}</span><h2>{loverResponse ? '有人回应了呼唤' : firstPairLesson ? firstPairActive ? '配对完成，可以上行' : '先让恋人成为邻座' : '谁要上楼？'}</h2></div><div className="arrival-count">{offers.length} 位</div></div>
        <p className="arrival-explainer">送达后领取基础奖励 · 途中收益与人物联动另算</p>
        <div className="candidate-panel"><nav className="compact-candidate-tabs" aria-label="切换候客卡片">{offers.map((rider,index)=><button key={rider.id} onClick={()=>document.querySelectorAll('.passenger-item')[index]?.scrollIntoView({block:'nearest',inline:'start',behavior:'smooth'})}>{PASSENGERS[rider.kind].name}<span>查看第 {index+1} 位</span></button>)}</nav><div className="passenger-list" key={run.floor} aria-label="本层候客乘客">
          {offers.map((offer) => {
            const spec = PASSENGERS[offer.kind];
            const boarded = run.cabin.some((rider) => rider?.id === offer.id); const pending = pendingOfferId === offer.id;
            const full = !boarded && cabinFull;
            const unavailable = full; const isDragging = dragged?.type === 'offer' && dragged.id === offer.id;
            const partner = unavailable ? null : readyPartner(offer.kind, run.cabin, offer.id, offer);
            return <div className="passenger-item" key={offer.id}><button className={`passenger-card tone-${spec.tone} ${offer.calledByLover ? 'lover-called' : ''} ${firstPairLesson && offer.kind === 'lover' ? 'guided-lover' : ''} ${boarded ? 'boarded' : ''} ${pending ? 'pending' : ''} ${isDragging ? 'dragging' : ''}`} onClick={() => toggleOffer(offer)} draggable={!locked && !unavailable} onDragStart={(event) => startDrag(event, { type: 'offer', id: offer.id })} onDragEnd={endDrag} disabled={locked || unavailable} aria-pressed={boarded || pending}>
              {boarded && <span className="boarded-status" aria-hidden="true"><Check />已上车</span>}
              <PassengerCardFace rider={offer} run={run} action={boarded?'点此撤回':pending?'已选中 · 点空位':full?'车厢已满':partner?`上车可联动 · ${PASSENGERS[partner].name}`:'拖入空位 / 点选上车'}/>
            </button><button className="mobile-rule-button" onClick={() => {setEjectArmed(false);setPassengerDetails(offer);}} aria-label={`查看${spec.name}规则`}><HelpCircle /></button></div>;
          })}
        </div><div className="candidate-notes"><span>协作免邻座冲突，技能另算{cooperationRelief(run)>0?'；契约全车每站减躁1次。':'。'}</span>{showSavingRule&&<span>{SHARED_SAVING_RULE}</span>}</div></div>
        <div className="departure-controls">
          <button className="mobile-inspect-button" disabled={!activeRider || locked} onClick={() => {if(activeRider){setEjectArmed(false);setPassengerDetails(activeRider);}}} aria-label="查看选中人物规则"><BookOpen /><span>人物/请离</span></button>
          <button className="depart-button" onClick={depart} disabled={locked}><span>{doors === 'open' ? '关门上行' : '正在上行'}</span><b>ENTER</b><ArrowUp className="mobile-depart-arrow" /></button>
          <p className={`mobile-departure-note forecast-${forecastTone}`} aria-live="polite">{pendingOfferId ? `已选${activeRider ? PASSENGERS[activeRider.kind].name : '乘客'} · 点下方空位` : selectedSlot !== null ? '点另一站位换位 · 再点原位取消' : firstPairLesson && !firstPairActive ? '先选上方恋人，再点相邻的两个空位' : `下一站：电量 ${energyPreview.range} · 躁动 ${pressurePreview.range}`}</p>
          <p className={`panel-hint forecast-${forecastTone}`} aria-live="polite">{pendingOfferId ? '已选中乘客 · 请点电梯里的目标空位' : firstPairLesson && !firstPairActive ? '第一班 · 把两位恋人放进连线相连的站位' : departureForecast}</p>
          <p className="energy-equation" aria-live="polite">运转 {power.motor} ＋ 人物 {power.people} − 节能 {power.saved} ＝ <b>{power.total} 电/站</b></p>
          <p className="reseat-allowance" aria-live="polite">旧乘客换位 <b>{run.swapped?0:1}/1 次</b> · 新上客之间可自由调整</p>
        </div>
      </aside>
    </section>
    <footer className="footer-line"><span>ELV–07 / v7.6</span><i /><span>THE CITY NEVER REALLY SLEEPS</span></footer>


    <Dialog open={passengerDetails !== null} onOpenChange={(open) => {if(!open){setPassengerDetails(null);setEjectArmed(false);}}}><DialogContent className="story-dialog passenger-detail-dialog">
      {detailRider && detailBrief && <><p className="dialog-kicker">PASSENGER NOTES</p><DialogHeader><DialogTitle>{PASSENGERS[detailRider.kind].name}</DialogTitle><DialogDescription>还剩 {detailBrief.distance} 站 · 耗电 {detailBrief.energy} /站{detailRider.fuse !== undefined ? ` · 引信 ${detailRider.fuse}` : ''}</DialogDescription></DialogHeader>
        <div className="passenger-detail-reward">到站车费：{detailBrief.coins === null ? '？封存中，到站揭晓' : `+${detailBrief.coins} 金币`}{detailBrief.tip ? ` · 升级小费 +${detailBrief.tip}` : ''}</div>
        <div className="passenger-detail-rules"><PassengerRuleBlocks rules={detailBrief.cardRules} /><h3>补充说明</h3>{detailBrief.detailRules.map(rule=><p key={rule}>{rule}</p>)}</div>
        {canDismiss && <section className="dismiss-panel"><b>提前请离 · 赔偿 {penalty} 金币</b><p>不结算到站收益，也不获得送达舒缓。已赚取的途中收益保留。赔偿 = 4 + 剩余站数 ×2。</p>
          {ejectArmed && <p className="dismiss-confirm">确定让这位乘客在 {run.floor} 层下车？此操作不可撤回。</p>}
          <button className="dismiss-button" disabled={run.coins < penalty} onClick={()=>ejectArmed ? confirmDismiss() : setEjectArmed(true)}><UserMinus />{run.coins < penalty ? `金币不足 · 还差 ${penalty-run.coins}` : ejectArmed ? `确认请离 · 支付 ${penalty}` : '提前请离这位乘客'}</button>
        </section>}
        {detailOnboard && !canDismiss && <p className="detail-footnote">本层刚上车可直接点候客卡撤回；乘坐一站后才能付费请离。</p>}
        <Button className="story-primary" onClick={() => {setPassengerDetails(null);setEjectArmed(false);}}>返回安排</Button>
      </>}
    </DialogContent></Dialog>
    <Dialog open={inventoryOpen} onOpenChange={setInventoryOpen}><DialogContent className="story-dialog inventory-dialog">
      <p className="dialog-kicker">INSTALLED SYSTEMS · THIS SHIFT</p><DialogHeader><DialogTitle>这台电梯，升级了什么？</DialogTitle><DialogDescription>本班已安装 {upgradeCount} 次。以下是当前累计效果，不是下一次购买的预告。</DialogDescription></DialogHeader>
      <div className="inventory-summary"><span>电量上限 <b>{run.energyCap}</b></span><span>站位 <b>6 个</b></span><span>躁动上限 <b>{run.stressCap}</b></span></div>
      <div className="inventory-list">{(Object.keys(UPGRADES) as UpgradeKey[]).map(key=><section key={key} className={run.upgrades[key] ? 'installed' : 'not-installed'}><div><b>{UPGRADES[key].name}</b><span>{run.upgrades[key] ? `已装 ×${run.upgrades[key]}` : '未安装'}</span></div><p>{run.upgrades[key] ? installedUpgradeSummary(run,key) : UPGRADES[key].description}</p></section>)}</div>
      <Button className="story-primary" onClick={()=>setInventoryOpen(false)}>返回本班</Button>
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
      <div><b>拖拽安排</b><p>把人物拖进站位，或先点乘客再点空位。连线两端互为邻座。旧乘客每层只能换位一次；新上客移到空位或与新上客互换不消耗次数。</p></div>
      <div><b>还剩几站</b><p>每次关门上行算一站，人物身上的剩余站数会递减；幽灵可能延误邻座。</p></div>
      <div><b>三个值，六个站位</b><p>人物只看金钱、耗电和躁动；没有独立载重或耐心。人数由六个站位限制。金钱到站结算，途中收入另标。每站总耗电＝电梯运转1＋所有人物耗电−节能。卡片上的耗电是该人物每坐一站的成本，到站这一站也计费。</p></div><div><b>人数与躁动</b><p>3–4人不增加拥挤躁动；5人每站 +1，满6人 +2；最多2人时 −1。每位乘客到站再 −1。人物事件和长班疲劳另算。</p></div>
      <div><b>人物直接影响躁动</b><p>卡片写明何时加减躁动。达到上限三分之二时，人物技能与邻座冲突造成的正向躁动翻倍；安抚、拥挤和班次压力不翻倍。按关门前的躁动判断，卡片显示已换算数值。</p></div>
      <div><b>十层补给</b><p>充电每点{CHARGE_PRICE}金币，先留路费再买卡；右上角叠层图标可查看已装升级。</p></div><div><b>协作与冲突</b><p>每个人都有协作和冲突对象。本人到站时仍与任意协作对象相邻，额外 +{cooperationBonus(run)} 金币，每人只领一次。角色技能另算；没有协作邻座时，冲突邻座会在偶数层增加1躁动。绿线表示联动，红虚线表示冲突。</p></div><div><b>到层请离</b><p>选中车内人物，打开人物详情后请离。赔偿4+剩余站数×2金币，不结算到站奖励。本层刚上车仍可免费撤回。</p></div>
      <div><b>空驶休整</b><p>开局3次；每送达1人恢复1次，最多3次。空车上行自动消耗1次，免除本层长班疲劳。用尽后仍能空驶，但不再免疲劳。接客、撤回、请离与购物都不恢复次数。</p></div>
      <div><b>先准备，再闯高压段</b><p>初始{INITIAL_ENERGY}电、容量{ENERGY_CAPACITY}。大多数人物每站耗1电，游客、教练耗2电，幽灵不耗电；神秘人、百变人按当前属性耗1–2电。节能只抵消人物耗电，空驶仍耗1电。首10层不加班次压力；之后尾数1–3的楼层用于准备，4–6每站额外 +1 躁动，7–9高压三层每站额外 +5。整十层补给时撤去这部分压力，但不会自动清零躁动。51层起基础压力 +1，此后每40层再 +1。时段固定，不会因为你变强而临时加难。</p></div>
      <div><b>默契契约 · 协作送达</b><p>购买后，本层有乘客到站且仍挨着自己的协作对象，额外躁动 −{COOPERATION_RELIEF}。全车每层仅触发一次，送达多人或多次升级不叠加；请离不算送达，购买时也不立即舒缓。</p></div>
    </div></DialogContent></Dialog>
    <Dialog open={pressureHelp} onOpenChange={setPressureHelp}><DialogContent className="story-dialog pressure-dialog"><p className="dialog-kicker">CABIN AGITATION</p><DialogHeader><DialogTitle>人多、等得久，就会躁动。</DialogTitle><DialogDescription>躁动达到 {agitationThreshold(run.stressCap)}：人物造成的正向躁动翻倍；达到 {run.stressCap}：本班失控。音乐家、护士和快速送达能缓解。</DialogDescription></DialogHeader><div className="pressure-rule-grid">
      <section className="pressure-rise"><small>会增加躁动</small><b>轿厢拥挤</b><p>5人每站 +1；满6人每站 +2。</p><b>班次压力 · 提前准备</b><p>首10层不增加。之后每段尾数1–3与整十层只算基础压力，4–6再 +1，7–9再 +5。51层起基础 +1，此后每40层再 +1。空车且有休整次数时免除本层班次压力。下一站实际 +{shiftAgitation(run.floor + 1, occupied, run.restStops)}。</p><b>人物事件</b><p>未受控小偷、无人照顾的儿童、醉汉、被围住的名人和耗电检查，会按卡片规则增加躁动。</p><b>高躁动放大人物风险</b><p>技能和邻座冲突的正向增量 ×2；安抚不变。卡片已显示当前倍率后的数值。</p></section>
      <section className="pressure-relief"><small>可以主动缓解</small><b>给组合留空间</b><p>3–4人不增加拥挤躁动；最多2人，每站 −1。人物事件和长班疲劳仍会结算。</p><b>快速送达</b><p>每位正常到站的乘客 −1，并恢复1次空驶休整，最多3次。</p><b>空驶休整 · 还剩 {run.restStops} 次</b><p>空车上行自动消耗1次，本层免长班疲劳，仍有宽松 −1。用尽后空驶也会疲劳。只在成功送达时恢复；接客、请离和商店不能刷新。</p><b>安排安抚角色</b><p>至少4人时，每位音乐家每站 −1；每位护士每逢偶数层 −1。多人效果可以相加。</p><b>购买舒缓系统</b><p>立即 −6 躁动，上限 +3。不再需要维持“热区”来赚小费。</p></section>
    </div><div className={`pressure-now forecast-${pressurePreview.tone}`}><small>按现在的站位</small><b>{pressurePreview.summary}</b></div></DialogContent></Dialog>
    <Dialog open={archive} onOpenChange={setArchive}><DialogContent className="story-dialog archive-dialog"><p className="dialog-kicker">PASSENGER ARCHIVE</p><DialogHeader><DialogTitle>午夜乘客档案</DialogTitle><DialogDescription>最高抵达 {highest}F。更高楼层会出现更难处理的乘客。</DialogDescription></DialogHeader><div className="archive-grid">{PASSENGER_ORDER.map((kind) => { const open = unlocked.includes(kind); const spec = PASSENGERS[kind]; return <div className={`archive-item ${open ? '' : 'locked'}`} key={kind}>{open ? <Portrait kind={kind} /> : <LockKeyhole />}<span><b>{open ? spec.name : '未解锁'}</b><small>{open ? spec.short : '继续向上抵达新楼层'}</small></span></div>; })}</div></DialogContent></Dialog>
    <Dialog open={run.status === 'upgrade'}><DialogContent className={`story-dialog upgrade-dialog ${upgradeCrisis ? 'upgrade-crisis' : ''}`} showCloseButton={false}>
      <p className="dialog-kicker">FLOOR {run.floor} · MAINTENANCE SHOP</p><DialogHeader><DialogTitle><span className="desktop-shop-copy">{upgradeCrisis ? '先维修，再继续上行' : '把这一程收入，投进下一程。'}</span><span className="mobile-shop-copy">{run.floor} 层 · {upgradeCrisis ? '紧急维修' : '补给站'}</span></DialogTitle><DialogDescription><span className="desktop-shop-copy">每张卡本次限购一次；可以买多张，也可以攒钱离开。已安装的效果持续整班。</span><span className="mobile-shop-copy">按需购卡，可买多张，也可离开。</span></DialogDescription></DialogHeader>
      <div className="shop-wallet"><span aria-label={`可用金币 ${run.coins}`}><Coins aria-hidden="true" /><span className="sr-only">可用金币</span><b key={run.coins}>{run.coins}</b></span><span>累计收入 {run.earned} · 已花费 {run.earned - run.coins}</span></div>
      {upgradeCrisis && <p className="shop-warning">{upgradeCrisis === 'both' ? '电量与躁动同时失控：需要充电并购买舒缓系统，两项都修复才能继续。' : upgradeCrisis === 'energy' ? '电量已耗尽：使用下方充电服务，将电量恢复到 0 以上才能继续。' : '躁动已超限：购买舒缓系统，将躁动降到上限以下才能继续。'} 若无力修复，本班将在这里结束。</p>}
      <section className="recharge-panel"><div><b>充电 · {CHARGE_PRICE} 金币买1电</b><span>当前 {run.energy}/{run.energyCap} · 下段空驶要 {chargePlan.baseline} 电，载人另计</span></div><div className="recharge-actions"><button disabled={chargePlan.units===0||run.coins<chargePlan.cost} onClick={()=>recharge(chargePlan.units)}>{chargePlan.units ? `补至 ${chargePlan.target} 电 · ${chargePlan.cost} 金币` : '已达到62电参考线'}</button><button disabled={run.energy>=run.energyCap||run.coins<(run.energyCap-run.energy)*CHARGE_PRICE} onClick={()=>recharge(run.energyCap-run.energy)}>{run.energy>=run.energyCap?`已充满 ${run.energyCap} 电`:`充满 ${run.energyCap} · ${(run.energyCap-run.energy)*CHARGE_PRICE} 金币`}</button><button disabled={run.energy+10>run.energyCap||run.coins<10*CHARGE_PRICE} onClick={()=>recharge(10)}>+10 电 · {10*CHARGE_PRICE} 金币</button><button disabled={run.energy>=run.energyCap||run.coins<CHARGE_PRICE} onClick={()=>recharge(1)}>+1 电 · {CHARGE_PRICE} 金币</button></div><p>补至{chargePlan.target}需 {chargePlan.cost} 金币，余 {Math.max(0,run.coins-chargePlan.cost)} 可买卡。参考电量不保证续航，接谁会改变耗电。</p></section>
      <button className="shop-inventory-link" onClick={()=>setInventoryOpen(true)}><Layers />查看已装升级 · {upgradeCount} 次</button>
      <div className="upgrade-grid">{run.shop.map((card) => { const key = card.key; const affordable = run.coins >= card.price; const rescue = !card.purchased && rescuesCrisis(key, run); const eatsReserve = affordable && run.coins - card.price < chargingPlan(previewUpgrade(run,key)).cost; return <button key={key} className={`${rescue ? 'crisis-rescue' : ''} ${card.purchased ? 'shop-purchased' : ''}`} disabled={card.purchased || !affordable} onClick={() => chooseUpgrade(key)} aria-label={`${UPGRADES[key].name}，${card.price} 金币${card.purchased ? '，已购入' : !affordable ? '，金币不足' : ''}`}>
        <span className="upgrade-card-head"><small>{UPGRADES[key].label}</small><i className={`upgrade-strategy strategy-${UPGRADES[key].tone}`}>{UPGRADES[key].strategy}</i></span><b>{UPGRADES[key].name}</b><p>{UPGRADES[key].description}</p><em>{card.purchased ? '已安装，可在升级清单中查看' : upgradeImpact(key, run)}</em>{!card.purchased && eatsReserve && <span className="reserve-warning">购买后不足以预留完整充电费</span>}<span className="shop-price"><Coins aria-hidden="true" /><strong>{card.price}</strong><span>{card.purchased ? '✓ 已购入' : affordable ? '购买并安装' : `还差 ${card.price - run.coins}`}</span></span>
      </button>; })}</div>
      {metricEvent && <p className="shop-receipt" aria-live="polite">{metricEvent.label}{metricEvent.changes.map((change) => ` · ${change.label} ${signedDelta(change.delta)}${change.capDelta ? `（上限 ${signedDelta(change.capDelta)}）` : ''}`).join('')}</p>}
      {leaveArmed && <p className="shop-warning">当前电量连空驶到下个补给站都不够，节能不能抵消运转耗电。再点一次确认带风险离开。</p>}<Button className="story-primary" onClick={finishShopping}>{upgradeCrisis ? '无力修复 · 结束本班' : leaveArmed ? '确认少电离开 · 自担风险' : '离开商店 · 继续上行'}<ArrowUp /></Button>
    </DialogContent></Dialog>
    <Dialog open={run.status === 'lost'}><DialogContent className="story-dialog result-dialog failure-dialog" showCloseButton={false}><p className="dialog-kicker">ENDLESS SHIFT · {run.floor}F</p><DialogHeader><DialogTitle>本班失败</DialogTitle><DialogDescription className="failure-cause">{run.message.includes('引信') ? '炸弹引信归零' : run.energy<=0 && run.stress>=run.stressCap ? '电量耗尽 · 躁动失控' : run.energy<=0 ? '电量耗尽' : '躁动失控'}<span>{run.message}</span></DialogDescription></DialogHeader>{run.floor>runStartBest && <p className="result-record">这次抵达 {run.floor} 层，刷新了你的纪录。</p>}<div className="result-score"><span>本班抵达 <b>{run.floor} 层</b></span><span>无尽纪录 <b>{bestFloor} 层</b></span><span>累计赚取 <b>{run.earned}</b></span><span>本班支出 <b>{run.earned - run.coins}</b></span></div><p className="result-challenge failure">{resultChallenge}</p><p className="result-investment">{upgradeCount} 次升级 · 剩余 {run.coins} 金币。金币只在本班使用，下一班重新开始。</p><Button className="story-primary" onClick={reset}><RotateCcw /> 再开一班 · 挑战更高楼层</Button><button className="story-link" onClick={() => setArchive(true)}><BookOpen /> 查看乘客档案</button></DialogContent></Dialog>
  </main>;
}
