'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent } from 'react';
import { ChevronsUp, ArrowUp, Layers, UserMinus, BatteryCharging, BookOpen, Check, Coins, Flame, HelpCircle, History, Info, LockKeyhole, Music2, RotateCcw, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ADJACENT, PASSENGER_ORDER, PASSENGERS, UPGRADES, isLegend, passengerCardGrade, passengerCategory, type PassengerKind, type UpgradeKey } from '@/lib/game-data';
import { cardSummary, riderName, type CardChip } from '@/lib/card-summary';
import { KEEPSAKES_SEEN_KEY, LEGEND_UNLOCKS_KEY, LEGEND_UNLOCK_HINTS, loadKeepsakesSeen, loadUnlockedLegends, nextUnlocks, saveList } from '@/lib/legend-unlocks';
import { KEEPSAKES, type KeepsakeKey } from '@/lib/legends';
import { districtFor } from '@/lib/districts';
import { STORIES, STORIES_KEY } from '@/lib/stories';
import { dailyKey, dailySeed, stream } from '@/lib/seeded';
import { LEGEND_STARTERS } from '@/lib/legends';
import { LEGEND_KINDS, type LegendKind } from '@/lib/game-data';
import { availableShopCards, emergencyRepairPlan, repairEmergency, dismissalsRemaining, energyBreakdown, purchaseRepairWarning } from '@/lib/game-engine';
import { HIGH_RISK_BONUS, travelEnergyCost, eventPressureMultiplier, riderAgitation, shiftOutlook, cooperationRelief, chargeBattery, chargingPlan, cooperationBonus, dismissalCost, dismissRider, installedUpgradeSummary, agitationThreshold, difficultyTier, failureLesson, hasNeighbour, initialRun, installUpgrade, leaveShop, neighbourCount, nextShopFloor, previewUpgrade, readyPartner, resolveFloor, touristCompanionCount, type Rider, type RunState, type UpgradeCrisis } from '@/lib/game-engine';
import { energyForecast, sectorForecast, stressForecast } from '@/lib/game-forecast';
import { RETIRED_UPGRADES, emergencyAllowance, emergencySectorLeft, emergencyCharge, boxOf, buyBoxLevel, canBuyBoxLevel, boxLevelPrice, rerollShop, REROLL_PRICE, SHOP_PRICES } from '@/lib/game-engine';
import { emergencyUnitPrice, BOX_LINES, BOX_LINE_LABELS, BOX_MAX_LEVEL, BOX_TOTAL_CAP, boxTotal, chargeCost as boxChargeCost, chargeUnitPrice, affordableUnits, shopEntryCharge, type BoxLine } from '@/lib/power-box';
import { activeConnection, copyConnection, planPlacement, type PlacementResult } from '@/lib/game-interaction';
import { disposeGameAudio, playGameSound as playTone, playMetricSounds } from '@/lib/game-audio';
import { disposeGameMusic, musicSceneForView, setGameMusic, unlockGameMusic } from '@/lib/game-music';
import { bondStatus, conflictLinks, type ConflictEffect } from '@/lib/rider-profile';
import { portraitAsset, shopIcon } from '@/lib/passenger-assets';
import { addDiscoveredPassengers, sanitizeDiscoveredPassengers } from '@/lib/passenger-discovery';
import { passengerBrief, SHARED_SAVING_RULE, type PassengerRuleBlock } from '@/lib/passenger-presentation';
import { metricChanges, type MetricChange, type MetricKey } from '@/lib/metric-feedback';
import { CHANGELOG, CHANGELOG_EN, GAME_VERSION } from '@/lib/changelog';
import { localizeTree, translateGameText, type GameLocale } from '@/lib/i18n';
import { UPGRADE_SLOTS, riskPartnerships } from '@/lib/shift-rules';
import { flywheelAllowance } from '@/lib/shop-effects';
import { departureRisk, rescuePlan, sectorNeed, SECTOR_NEED_RIDERS } from '@/lib/departure-guard';
import { offerReveal } from '@/lib/offer-reveal';
import { shouldPreviewConnection } from '@/lib/connection-preview';
import { AgitationGauge } from '@/components/agitation-gauge';
import { PowerGauge, RegisterNumber } from '@/components/power-gauge';
import { cooperationLabel } from '@/lib/cooperation-label';
import { agitationBand, musicBeatForAgitation, motorAdvanceNotice, motorScheduleText, REPAIR_WORK, INSPECTION_WORK, INSPECTION_BONUS, CHILD_CARE_WORK, RESERVE_CELL_CHARGE } from '@/lib/balance-v832';
import { consumeReserveCell, nextOfferBatch, retimeRider, oldMovesRemaining, reserveOffer, applyCalmCharge, startRun } from '@/lib/game-engine';

type DragPayload = { type: 'offer'; id: string } | { type: 'slot'; slot: number };
type Feedback = { id: number; tone: 'place' | 'combo' | 'error' | 'arrival'; label: string; slots: number[]; coins?: number; energy?: number; pressure?: number };
const DISCOVERED_PASSENGERS_KEY = 'elevator-tales-discovered-passengers-v1';
const MUSIC_PREFERENCE_KEY = 'elevator-tales-music-enabled-v1';
const SOUND_PREFERENCE_KEY = 'elevator-tales-sound-enabled-v1';
function scrollMobileTarget(selector:string,block:ScrollLogicalPosition='nearest') {
  if(!window.matchMedia('(max-width:700px)').matches)return;
  document.querySelector(selector)?.scrollIntoView({block,behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
}

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
  return <span className="animated-number">{shown}</span>;
}

// Explicit line breaks keep each rule readable even if a legacy span style
// changes its layout. Each line is also a complete, punctuated sentence.
function PassengerRuleBlocks({ rules, locale }: { rules: PassengerRuleBlock[]; locale: GameLocale }) {
  return localizeTree(<span className="passenger-rule-blocks">{rules.map(rule=><span key={rule.heading} className={`passenger-rule-block rule-${rule.tone}`}><b>{rule.heading}</b>{rule.lines.map(line=><span key={line}><br />{line}</span>)}{rule.note&&<span className="rule-note"><br />{rule.note}</span>}</span>)}</span>, locale);
}

const signedDelta = (value: number) => value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '不变';
const compactDelta = (value: number) => value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '0';
const conflictGlyph=(effect:ConflictEffect)=>({agitation:'🔥 +1',energy:'⚡ +1',coins:'🪙 −2',overload:'⚡ ×2',gamble:'⚡×2 · 基价+100%'}[effect]);
type MetricEvent = { id: number; label: string; changes: MetricChange[] };

function MetricResponse({ metric, event, locale }: { metric: MetricKey; event: MetricEvent | null; locale: GameLocale }) {
  const change = event?.changes.find((item) => item.key === metric);
  return localizeTree(<output className="metric-response" aria-live="polite" aria-atomic="true">
    {change && <span key={event!.id} className={`metric-pulse pulse-${change.tone}`}>
      <span className="sr-only">{change.label} {signedDelta(change.delta)}</span>
    </span>}
    {change && <span key={`ring-${event!.id}`} className={`metric-ring pulse-${change.tone}`} aria-hidden="true" />}
  </output>, locale);
}
const shiftPhase = (floor: number) => floor <= 10 ? '临时夜班' : '无尽夜班';

function Portrait({ kind, large = false }: { kind: PassengerKind; large?: boolean }) {
  const asset = portraitAsset(kind); const x = asset.cell % asset.columns; const y = Math.floor(asset.cell / asset.columns);
  return <span className={`portrait-window ${large ? 'portrait-large' : ''} ${isLegend(kind) ? 'portrait-legend-art' : ''}`} aria-hidden="true"><span className="portrait-sheet" style={{ backgroundImage: `url(${asset.src})`, backgroundSize: `${asset.columns * 100}% ${asset.rows * 100}%`, backgroundPosition: `${asset.columns > 1 ? x * 100 / (asset.columns - 1) : 50}% ${asset.rows > 1 ? y * 100 / (asset.rows - 1) : 50}%` }} /></span>;
}

const KEEPSAKE_EN: Record<KeepsakeKey, [string, string]> = {
  wrench: ['Old Zhou’s Wrench', 'One free power-box level; every later level costs 5 coins less.'],
  redString: ['Red String', 'Each bond pays +2 on arrival; unpaired Lovers call a partner 35% of the time.'],
  pocketWatch: ['Pocket Watch', 'Criminal links bank 1 more coin per floor; their agitation is capped at 1 per floor.'],
  roundsLog: ['Rounds Log', 'Agitation cap +2; −3 agitation at every shop; +1 per arrival after calm departures.'],
  vinyl: ['Vinyl Record', 'Musicians from floor 1; at medium agitation Musicians earn +2 and each arrival tips +2.'],
  bell: ['Spirit Bell', 'Ghosts always count as controlled and pay +5 in total on arrival.'],
  stock: ['Share Certificate', 'At each shop, unspent coins earn 15% interest, up to +12.'],
};
const legendKeepsake = (kind: LegendKind): KeepsakeKey | null => ({ operator: 'wrench', matchmaker: 'redString', don: 'pocketWatch', matron: 'roundsLog', nightingale: 'vinyl', medium: 'bell', tycoon: 'stock', stranger: null } as Record<LegendKind, KeepsakeKey | null>)[kind];
const keepsakeLabel = (key: KeepsakeKey, locale: GameLocale) => locale === 'zh' ? KEEPSAKES[key].name : KEEPSAKE_EN[key][0];
const keepsakeText = (key: KeepsakeKey, locale: GameLocale) => locale === 'zh' ? KEEPSAKES[key].description : KEEPSAKE_EN[key][1];
function keepsakeName(kind: LegendKind, locale: GameLocale) { const key = legendKeepsake(kind); return key ? keepsakeLabel(key, locale) : locale === 'zh' ? '随机一件' : 'A random one'; }
function keepsakeTitle(kind: LegendKind, locale: GameLocale) { const key = legendKeepsake(kind); return key ? keepsakeText(key, locale) : locale === 'zh' ? '随机获得另一件传奇信物，再加 0–20 金币' : 'Another random keepsake plus 0–20 coins'; }

function ChipIcon({ icon }: { icon: CardChip['icon'] }) {
  if (icon === 'agitation') return <Flame aria-hidden="true" />;
  if (icon === 'energy') return <BatteryCharging aria-hidden="true" />;
  if (icon === 'coins') return <Coins aria-hidden="true" />;
  if (icon === 'mixed') return <Sparkles aria-hidden="true" />;
  return null;
}

// Compact card: name row, three numbers, one ability line, relation chips. Full rules live in the sheet.
export function PassengerCardFace({ rider, run, action, locale }: { rider: Rider; run: RunState; action?: string; locale: GameLocale }) {
  const brief=passengerBrief(rider,run.floor,run.cabin,cooperationBonus(run),cooperationRelief(run),eventPressureMultiplier(run),run.stress);
  const summary=cardSummary(rider,run,locale);
  const zh=locale==='zh';
  const legend=isLegend(rider.kind);
  return <span className="unified-passenger-summary compact-card" data-no-translate>
    <span className="cc-head"><Portrait kind={rider.kind}/><span className="cc-title"><strong>{riderName(rider.kind,locale)}</strong><span className="cc-sub">
      <span className="cc-trip">{zh?`${brief.distance} 站`:`${brief.distance} stops`}</span>
      {legend&&<span className="cc-tag cc-tag-legend">{zh?'传奇':'Legend'}</span>}
      {rider.volatile&&<span className="cc-tag cc-tag-risk"><Flame aria-hidden="true" />{zh?`高危 +${HIGH_RISK_BONUS}`:`High risk +${HIGH_RISK_BONUS}`}</span>}
      {rider.localFareRatio&&<span className="cc-tag">{zh?'短途':'Local'}</span>}
    </span></span></span>
    {legend ? <span className="cc-values cc-legend-values"><span>{zh?'不付车费 · 不耗电':'No fare · no power'}{rider.kind==='medium'?'':''}</span></span> : <span className="cc-values">
      <b className="cc-fare" aria-label={brief.coins===null?(zh?'车费到站揭晓':'Fare sealed'):`${zh?'车费':'Fare'} ${brief.coins}`}><Coins aria-hidden="true" />{brief.coins===null?'?':brief.coins}{brief.tip>0&&<small>+{brief.tip}</small>}</b>
      <span className="cc-energy" aria-label={`${zh?'每层耗电':'Power per floor'} ${brief.energy}`}><BatteryCharging aria-hidden="true" />{brief.energy}</span>
      {brief.agitation>0&&<span className="cc-agitation" aria-label={`${zh?'每层躁动':'Agitation per floor'} +${brief.agitation}`}><Flame aria-hidden="true" />+{brief.agitation}</span>}
    </span>}
    <span className="cc-line">{summary.line}{summary.progress&&<em>{summary.progress}</em>}</span>
    {legend&&<span className="cc-chips"><span className="cc-chip chip-keepsake" title={keepsakeTitle(rider.kind as LegendKind,locale)}>{zh?'信物 · ':'Keepsake · '}{keepsakeName(rider.kind as LegendKind,locale)}</span></span>}
    {summary.chips.length>0&&<span className="cc-chips">{summary.chips.map((chip,index)=><span key={index} className={`cc-chip chip-${chip.tone}`} title={chip.title}>{chip.tone==='green'?'+':chip.tone==='risk'?'⛓':''}<ChipIcon icon={chip.icon}/>{chip.label}</span>)}</span>}
    {action&&<span className="cc-action">{action}</span>}
  </span>;
}

function riderState(cabin: Array<Rider | null>, slot: number, bonus: number, agitation: number): { label: string; tone: 'active' | 'warn' | 'neutral' } | null {
  const rider = cabin[slot];
  if (!rider) return null;
  const bond = bondStatus(rider,cabin,slot);
  const conflicts=conflictLinks(cabin).filter(link=>link.first===slot||link.second===slot);
  if(rider.kind==='mimic')return {label:bond.copies.length?`↑ ${PASSENGERS[bond.copies[0].sourceKind].name} · ${bond.copies[0].field==='energy'?'耗电':'车费'}`:'↑ 等待正上方',tone:'neutral'};
  if (riskPartnerships(cabin).members.includes(slot)) return {label: `暂存+${agitationBand(agitation)==='high'?3:2}/层 · 链接加躁动`, tone:'warn'};
  if (conflicts.length) return {label:conflicts.length===1?`红线 ${conflictGlyph(conflicts[0].effect)}`:`${conflicts.length} 条红线`,tone:'warn'};
  if(rider.kind==='mystery')return {label:bond.supported?cooperationLabel(bond.supportCount,bonus):'车费待揭晓',tone:bond.supported?'active':'neutral'};
  if(rider.kind==='shifter')return {label:`耗电 ${bond.energy} · 躁动 +${bond.agitation}`,tone:'warn'};
  switch (rider.kind) {
    case 'tourist': { const count=touristCompanionCount(cabin,slot)+Number(hasNeighbour(cabin,slot,['nightingale'])); return count ? { label: `${count}位邻座 · 到站+${count*2}币`, tone: 'active' } : { label: '等待邻座 · 每位到站+2币', tone: 'neutral' }; }
    case 'operator': return cabin.filter(Boolean).length >= 6 ? { label: '满员 · 不省电', tone: 'warn' } : { label: '运转 −1 电', tone: 'active' };
    case 'courier': return { label: '到站补充2电', tone: 'active' };
    case 'lover': return hasNeighbour(cabin, slot, ['lover']) ? { label: '已配对', tone: 'active' } : { label: '正在呼唤同伴', tone: 'neutral' };
    case 'thief': return hasNeighbour(cabin, slot, ['cop', 'lawyer']) ? { label: '已受控制', tone: 'active' } : { label: '未受控制', tone: 'warn' };
    case 'cop': return hasNeighbour(cabin, slot, ['thief', 'bomb']) ? { label: '正在控制', tone: 'active' } : null;
    case 'lawyer': return { label: '红线损失抵消最多2币', tone: 'active' };
    case 'drunk': if (agitationBand(agitation)==='high') return { label: '高躁动 · 基价+100%', tone: 'active' }; return hasNeighbour(cabin, slot, ['nurse']) ? { label: '已被安抚', tone: 'active' } : { label: '未安抚 · 每层+1', tone: 'warn' };
    case 'child': return {label:`照顾 ${rider.careProgress??0}/${CHILD_CARE_WORK}${hasNeighbour(cabin,slot,['lover','nurse'])?' · 有人照顾':' · 无人照顾'}`,tone:hasNeighbour(cabin,slot,['lover','nurse'])?'active':'warn'};
    case 'ghost': return hasNeighbour(cabin, slot, ['exorcist']) ? { label: '已被镇压', tone: 'active' } : { label: '正在作祟', tone: 'warn' };
    case 'exorcist': return hasNeighbour(cabin, slot, ['ghost']) ? { label: '正在驱魔', tone: 'active' } : null;
    case 'coach': { const count = neighbourCount(cabin, slot); return count ? { label: `激励 ${count} 人`, tone: 'active' } : { label: '等待邻座', tone: 'neutral' }; }
    case 'celebrity': { const count = neighbourCount(cabin, slot); return count === 1 ? { label: '状态最佳', tone: 'active' } : count > 1 ? { label: '被围住', tone: 'warn' } : { label: '缺少关注', tone: 'neutral' }; }
    case 'inspector': return {label:rider.complianceReady?`签章 · 到站+${INSPECTION_BONUS}币`:`连续低躁动 ${rider.quietStreak??0}/${INSPECTION_WORK}`,tone:rider.complianceReady?'active':'neutral'};
    case 'mechanic': return {label:rider.repairDone?'检修完成':`低躁动检修 ${rider.repairProgress??0}/${REPAIR_WORK}`,tone:rider.repairDone?'active':'neutral'};
    case 'musician': { const beat=musicBeatForAgitation(agitation); return {label:`整车节拍 ${beat>0?'+'+beat:beat<0?'−'+Math.abs(beat):'0'}`,tone:'neutral'}; }
    case 'nurse': return neighbourCount(cabin, slot) ? { label: '每位邻座 −1躁动/层', tone: 'active' } : { label: '等待邻座', tone: 'neutral' };
    default: return bond.supported ? {label:cooperationLabel(bond.supportCount,bonus),tone:'active'} : null;
  }
}

const CONNECTION_POINTS = [[47, 50], [150, 50], [253, 50], [47, 150], [150, 150], [253, 150]];

const rescuesCrisis = (key: UpgradeKey, run: RunState) => {
  const preview = previewUpgrade(run, key);
  return run.stress >= run.stressCap && preview.stress < preview.stressCap;
};

const IMPACT_KEYS: UpgradeKey[] = ['battery', 'calm', 'capacity'];
/** Cabin lights start to flicker when the worst case leaves this little power after the next floor. */
const LOW_POWER_FLICKER = 6;
function upgradeImpact(key: UpgradeKey, run: RunState): string {
  const preview = previewUpgrade(run, key);
  switch (key) {
    case 'battery': return `每条协作连接 +${cooperationBonus(run)} → +${cooperationBonus(preview)} 金币。`;
    case 'calm': return `躁动 ${run.stress}/${run.stressCap} → ${preview.stress}/${preview.stressCap}`;
    case 'reinforced': return '每十层最多5次 · 关门至少5人：抵消1点人物耗电';
    case 'capacity': return `容量 ${run.energyCap} → ${preview.energyCap}；仍需付费充电`;
    case 'concierge': return '此后新乘客到站小费 +1';
    case 'express': return '车内乘客不变；可能合并或拆开同站到达';
    case 'tipjar': case 'relay': return '本局唯一 · 概率只在实际结算时抽取';
    case 'retime': return '上行前手动改签 · 每十层一次';
    case 'reservation': return '上行前手动留座 · 每十层一次';
    case 'rails': return '换位时生效 · 每层旧乘客可换位2次';
    case 'delay': return '多争取1站；仍需核对路程与倒计时';
    default: return '本局限装一次 · 按卡片条件触发';
  }
}

const MANUAL: Array<[string, string, string, string]> = [
  ['安排站位', '点乘客再点空位，或直接拖拽。连线两端互为邻座。旧乘客每层可换位 2 次；刚上车的乘客可免费移动或撤回。', 'Seating', 'Click a rider then a seat, or drag. Linked seats are neighbors. Riders already aboard can move twice per floor; new riders move or withdraw freely.'],
  ['三个数字', '每位乘客只看车费、每层耗电和躁动。每层耗电＝电梯运转＋乘客耗电＋红线额外耗电−节能。', 'Three numbers', 'Every rider has a fare, power per floor and agitation. Power per floor = motor + riders + red-link costs − savings.'],
  ['电量', '电量耗尽即结束。商店充电 2 金币/电；两次商店之间可以途中补电，4 金币/电，每十层最多 20 电。', 'Power', 'Run out and the shift ends. Shops charge 2 coins per power; between shops you can charge in transit at 4 coins, up to 20 per ten floors.'],
  ['躁动', '0–2 低、3–4 中、5 起高，到上限失控。低和中躁动时每位到站乘客多付 1 金币；高躁动每层 20% 可能出事故，一位乘客提前下车不付钱。', 'Agitation', 'Low 0–2, medium 3–4, high from 5; at the cap the shift is lost. Low and medium departures tip 1 coin per arrival; high departures risk a 20% incident where a rider leaves without paying.'],
  ['十层商店', '每店免费选 1 项能力，可再花 40 金币加购 1 项，共 6 个安装位。配电箱每店升 1 级（蓄电 / 变压 / 电机），一局最多 5 级。', 'Shops every ten floors', 'Pick 1 ability free and buy 1 more for 40 coins; 6 slots in all. Upgrade the power box once per shop (Storage / Transformer / Motor), 5 levels per run.'],
  ['传奇乘客', '第一层偶尔有一位传奇在等候。他们坐到第 10 层商店、不耗电，下车时留下一件永久信物。不载会得到 10 金币补贴。', 'Legends', 'A legend sometimes waits on floor 1. They ride to the floor-10 shop without using power and leave a permanent keepsake. Declining pays a 10-coin allowance.'],
  ['请离', '每十层最多请离 2 位，赔偿 4＋剩余站数×2 金币，不结算车费和暂存。传奇可免费请离，但拿不到信物。', 'Dismissal', 'Dismiss up to 2 riders per ten floors for 4 + 2 per remaining stop; no fare or bank is paid. Legends leave free but take their keepsake with them.'],
  ['邻座与叠加', '绿线是能力或默契，红线是代价（🔥躁动 ⚡耗电 🪙金币）。多条线逐条相加。', 'Neighbors', 'Green links are abilities or bonds; red links cost you (🔥 agitation ⚡ power 🪙 coins). Every link counts separately.'],
];
const PRESSURE_RISE: Array<[string, string, string, string]> = [
  ['乘客自身', '卡面上的躁动数字；高危乘客再 +1。没人管的小偷、没人照顾的儿童、未安抚的醉汉、被围住的名人也会加躁动。', 'Riders', 'The agitation number on the card; high-risk riders add 1 more. Unguarded Thieves, uncared-for Children, unsoothed Drifters and crowded Celebrities add agitation too.'],
  ['🔥 红线', '只有标 🔥 的红线加躁动。', '🔥 Red links', 'Only red links marked 🔥 add agitation.'],
  ['车厢坐满', '关门时 6 人全满，每层 +1。', 'Full cabin', 'Departing with all 6 seats taken adds 1 per floor.'],
];
const PRESSURE_RELIEF: Array<[string, string, string, string]> = [
  ['到站舒缓', '每位正常到站 −1，每层最多 −2。', 'Arrivals', 'Each normal arrival −1, at most −2 per floor.'],
  ['护士与音乐家', '护士让每位邻座 −1/层；音乐家把躁动拉向中档，中档时每层 +2 金币。', 'Nurse and Musician', 'A Nurse gives each neighbor −1 per floor; a Musician pulls agitation toward medium and earns 2 per floor there.'],
  ['每一档都有好处', '低：到站 +1 金币；中：到站 +1 金币；高：坏人链接多存 1 金币，醉汉车费翻倍——但有 20% 事故。', 'Every band pays', 'Low: +1 per arrival; medium: +1 per arrival; high: criminal links bank 1 more and Drifters pay double—with a 20% incident risk.'],
];

export default function ElevatorGame() {
  const [language, setLanguage] = useState<GameLocale>('en');
  const [run, setRun] = useState<RunState>(initialRun); const [offers, setOffers] = useState<Rider[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null); const [doors, setDoors] = useState<'open' | 'closing' | 'moving' | 'opening'>('open');
  const [fastReveal, setFastReveal] = useState(false);
  const [arriving, setArriving] = useState<NonNullable<RunState['lastArrivals']>>([]);
  const [offerDebuts, setOfferDebuts] = useState<string[]>([]);
  const discoveredRef = useRef<PassengerKind[]>([]);
  const revealedBatch = useRef('');
  const presentOffers = useCallback((next: Rider[], known = discoveredRef.current) => {
    setOfferDebuts(offerReveal(next, known).debutIds); setOffers(next);
  }, []);
  const [pendingOfferId, setPendingOfferId] = useState<string | null>(null);
  const [dragged, setDragged] = useState<DragPayload | null>(null); const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [guidedShift, setGuidedShift] = useState(false);
  const [passengerDetails, setPassengerDetails] = useState<Rider | null>(null);
  const [inventoryOpen,setInventoryOpen]=useState(false);
  const [changelogOpen,setChangelogOpen]=useState(false);
  const [ejectArmed,setEjectArmed]=useState(false);
  const [leaveArmed,setLeaveArmed]=useState(false);
  // Unknown until storage is read: opening first and closing a frame later left the dialog stuck mid-animation for returning players.
  const [introState, setIntroState] = useState<boolean | null>(null);
  const intro = introState === true;
  const setIntro = useCallback((open: boolean) => { setIntroState(open); if (!open) { try { localStorage.setItem('elevator-tales-intro-seen-v1', 'yes'); } catch { /* storage unavailable */ } } }, []); const [help, setHelp] = useState(false); const [pressureHelp, setPressureHelp] = useState(false); const [archive, setArchive] = useState(false); const [sound, setSound] = useState(false); const [music, setMusic] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [highest, setHighest] = useState(1); const [bestFloor, setBestFloor] = useState(1); const [runStartBest, setRunStartBest] = useState(1); const [discovered, setDiscovered] = useState<PassengerKind[]>([]); const busyRef = useRef(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [unlockedLegends, setUnlockedLegends] = useState<LegendKind[]>([]);
  const [keepsakesSeen, setKeepsakesSeen] = useState<KeepsakeKey[]>([]);
  const [runDelivered, setRunDelivered] = useState<Partial<Record<PassengerKind, number>>>({});
  const [newLegends, setNewLegends] = useState<LegendKind[]>([]);
  const [storiesUnlocked, setStoriesUnlocked] = useState<PassengerKind[]>([]);
  // Daily shift: per-floor seeded streams; everyone draws the same offers and shops that day.
  const [daily, setDaily] = useState<{ key: string; seed: number } | null>(null);
  const [dailyBest, setDailyBest] = useState(0);
  const recordRef = useRef<Array<Record<string, unknown>>>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const rngOf = useCallback((channel: string, floor: number) => daily ? stream(daily.seed, channel, floor) : Math.random, [daily]);
  const [metricEvent, setMetricEvent] = useState<MetricEvent | null>(null);
  const soundEnabled = useRef(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const metricEventId = useRef(0);
  const feedbackId = useRef(0); const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null); const journeyTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const locked = doors !== 'open' || run.status !== 'playing' || intro || help || pressureHelp || archive || receiptOpen || passengerDetails !== null || inventoryOpen || changelogOpen;
  const musicScene = useMemo(() => musicSceneForView({ intro, pressureHelp, changelogOpen, status: run.status, floor: run.floor }), [intro, pressureHelp, changelogOpen, run.status, run.floor]);
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
  useEffect(() => () => { journeyTimers.current.forEach(clearTimeout); if (feedbackTimer.current) clearTimeout(feedbackTimer.current); disposeGameAudio(); disposeGameMusic(); }, []);

  useEffect(() => { setFastReveal(localStorage.getItem('elevator-tales-fast-reveal-v1') === 'on'); let seen = false; try { seen = localStorage.getItem('elevator-tales-intro-seen-v1') === 'yes'; } catch { /* storage unavailable */ } setIntroState(current => current ?? !seen); }, []);
  useEffect(() => {
    const syncPreferences = () => {
      const nextMusic = localStorage.getItem(MUSIC_PREFERENCE_KEY) !== 'off';
      const nextSound = localStorage.getItem(SOUND_PREFERENCE_KEY) !== 'off';
      setMusic(nextMusic); setSound(nextSound); soundEnabled.current = nextSound;
      if (!nextMusic) disposeGameMusic();
      if (!nextSound) disposeGameAudio();
      setAudioReady(true);
    };
    syncPreferences();
    const syncStorage = (event: StorageEvent) => {
      if (event.storageArea === localStorage && [null, MUSIC_PREFERENCE_KEY, SOUND_PREFERENCE_KEY].includes(event.key)) syncPreferences();
    };
    window.addEventListener('storage', syncStorage);
    return () => window.removeEventListener('storage', syncStorage);
  }, []);
  useEffect(() => { if (audioReady) setGameMusic(music, musicScene); }, [audioReady, music, musicScene]);
  useEffect(() => {
    const unlock = () => unlockGameMusic();
    window.addEventListener('pointerdown', unlock, true); window.addEventListener('keydown', unlock, true);
    return () => { window.removeEventListener('pointerdown', unlock, true); window.removeEventListener('keydown', unlock, true); };
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const requested = new URLSearchParams(window.location.search).get('lang');
      if (requested === 'zh') setLanguage('zh');
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => { document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'; }, [language]);

  const toggleLanguage = () => {
    const next: GameLocale = language === 'en' ? 'zh' : 'en';
    setLanguage(next);
    const url = new URL(window.location.href);
    if (next === 'zh') url.searchParams.set('lang', 'zh'); else url.searchParams.delete('lang');
    window.history.replaceState({}, '', url);
  };

  const toggleMusic = () => {
    const next = !music; setMusic(next); localStorage.setItem(MUSIC_PREFERENCE_KEY, next ? 'on' : 'off');
    setGameMusic(next, musicScene); if (next) unlockGameMusic();
  };

  useEffect(() => { const frame=requestAnimationFrame(() => { const savedBest = Math.max(1, Number(localStorage.getItem('elevator-tales-endless-best-floor') || 1)); const savedHighest = Math.max(1, Number(localStorage.getItem('elevator-tales-highest') || 1)); const shouldGuide = savedBest <= 1 || new URLSearchParams(window.location.search).get('tutorial') === '1'; let savedDiscovered: PassengerKind[] = []; try { savedDiscovered=sanitizeDiscoveredPassengers(JSON.parse(localStorage.getItem(DISCOVERED_PASSENGERS_KEY) || '[]')); } catch {} setHighest(savedHighest); setBestFloor(savedBest); setRunStartBest(savedBest); setDiscovered(savedDiscovered); discoveredRef.current = savedDiscovered; setGuidedShift(shouldGuide); const legends = loadUnlockedLegends(savedBest > 1); setUnlockedLegends(legends); setKeepsakesSeen(loadKeepsakesSeen()); try { const saved = JSON.parse(localStorage.getItem(STORIES_KEY) ?? '[]'); if (Array.isArray(saved)) setStoriesUnlocked(saved.filter((k): k is PassengerKind => k in STORIES)); } catch { /* storage unavailable */ } const opening = startRun(shouldGuide, Math.random, legends);
      // Development-only QA shortcuts: ?qa=shop starts one ascent from the first shop; ?qa=low starts at 14F nearly out of power; ?qa=at&f=N starts on floor N.
      const qaMode = process.env.NODE_ENV !== 'production' ? new URLSearchParams(window.location.search).get('qa') : null;
      if (qaMode === 'shop' || qaMode === 'low' || qaMode === 'at') { const qaFloor = Math.max(2, Number(new URLSearchParams(window.location.search).get('f')) || 2); const qa = nextOfferBatch({ ...opening.state, ...(qaMode === 'low' ? { floor: 14, coins: 87, earned: 188, energy: 4 } : qaMode === 'at' ? { floor: qaFloor, coins: 60, earned: 60, energy: 60 } : { floor: 9, coins: 140, earned: 140, energy: 30 }), legendOffer: undefined, legendStatus: undefined }); setGuidedShift(false); setIntroState(false); setRun(qa.state); presentOffers(qa.offers, savedDiscovered); return; }
      if (new URLSearchParams(window.location.search).has('daily')) { const key = dailyKey(), seed = dailySeed(key); const d = startRun(false, stream(seed, 'offers', 1), LEGEND_STARTERS); setDaily({ key, seed }); setDailyBest(Number(localStorage.getItem(`elevator-tales-daily-best-${key}`) || 0)); setGuidedShift(false); setRun(d.state); presentOffers(d.offers, savedDiscovered); return; }
      setRun(opening.state); presentOffers(opening.offers, savedDiscovered); });return()=>cancelAnimationFrame(frame); }, []);
  useEffect(() => { const frame=requestAnimationFrame(()=>{ if (run.floor > highest) { setHighest(run.floor); localStorage.setItem('elevator-tales-highest', String(run.floor)); } if (run.floor > bestFloor) { setBestFloor(run.floor); localStorage.setItem('elevator-tales-endless-best-floor', String(run.floor)); } });return()=>cancelAnimationFrame(frame); }, [run.floor, highest, bestFloor]);
  useEffect(() => { const frame=requestAnimationFrame(()=>{ const visibleKinds=[...offers,...run.cabin.filter((rider): rider is Rider => Boolean(rider))].map(rider=>rider.kind); if(!visibleKinds.length)return; setDiscovered(current=>{ const next=addDiscoveredPassengers(current,visibleKinds); if(next.length===current.length)return current; localStorage.setItem(DISCOVERED_PASSENGERS_KEY,JSON.stringify(next)); discoveredRef.current = next; return next; }); }); return()=>cancelAnimationFrame(frame); }, [offers, run.cabin]);

  useEffect(() => {
    if (intro || run.status !== 'playing' || !offers.length) return;
    const batch = offers.map(r => r.id).join(':');
    if (revealedBatch.current === batch) return;
    revealedBatch.current = batch;
    if (fastReveal) return;
    const cue = offerDebuts.length ? 'debut' : offerReveal(offers, offers.map(r => r.kind)).cue;
    if (!cue) return;
    const timer = setTimeout(() => playTone(soundEnabled.current, cue), 360);
    return () => clearTimeout(timer);
  }, [offers, offerDebuts, intro, fastReveal, run.status]);

  const occupied = run.cabin.filter(Boolean).length; const cabinFull = occupied === run.cabin.length;
  const outlook = shiftOutlook(run.floor, occupied, run.restStops);
  const pressurePreview = useMemo(() => stressForecast(run), [run]); const energyPreview = useMemo(() => energyForecast(run), [run]);
  const energyFatal = run.energy + energyPreview.lowDelta <= 0;
  const sector = useMemo(() => sectorForecast(run), [run]);
  const risk = useMemo(() => departureRisk(run), [run]);
  // When charging alone is not enough, look for a real way out before suggesting anything (v9.3.1).
  const rescue = useMemo(() => (risk.fatal && risk.affordable < risk.need ? rescuePlan(run) : null), [run, risk]);
  // A floor that can end the run needs a second press; any change to the run disarms it.
  const [departArmedFor, setDepartArmedFor] = useState<RunState | null>(null);
  const departArmed = departArmedFor === run;
  const emergencyLeft = run.status === 'playing' ? emergencyAllowance(run) : 0;
  const emergencyPrice = emergencyUnitPrice(boxOf(run));
  const emergencyNeed = run.status === 'playing' ? Math.min(emergencyLeft, Math.max(0, 1 - sector.projected, energyFatal ? 1 - (run.energy + energyPreview.lowDelta) : 0)) : 0;
  const stressFatal = run.stress + pressurePreview.highDelta >= run.stressCap;
  const forecastTone = energyFatal || stressFatal ? 'danger' : pressurePreview.tone;
  const phase = shiftPhase(run.floor); const upgradeCount = Object.values(run.upgrades).reduce((sum, count) => sum + count, 0); const nextShop = nextShopFloor(run.floor); const nextIsShop = (run.floor + 1) % 10 === 0; const agitated = run.stress >= agitationThreshold(run.stressCap);
  const loverResponse = offers.some((rider) => rider.calledByLover); const firstPairLesson = run.floor === 1 && guidedShift;
  const showSavingRule=[...offers,...run.cabin].some(r=>r&&['mechanic','ghost','exorcist'].includes(r.kind));
  const firstPairActive = run.cabin.some((rider, slot) => rider?.kind === 'lover' && hasNeighbour(run.cabin, slot, ['lover']));
  const upgradeCrisis: UpgradeCrisis = run.status === 'upgrade' ? run.energy <= 0 && run.stress >= run.stressCap ? 'both' : run.energy <= 0 ? 'energy' : run.stress >= run.stressCap ? 'stress' : null : null;

  const earningSummary = run.lastEarnings.sources.slice(0, 2).map((line) => `${line.label} ${signedDelta(line.amount)}`).join(' · ') + (run.lastEarnings.sources.length > 2 ? ` · 另 ${run.lastEarnings.sources.length - 2} 项` : '');
  const pressureSummary = run.lastPressure.sources.slice(0, 2).map((line) => `${line.label} ${signedDelta(line.amount)}`).join(' · ') + (run.lastPressure.sources.length > 2 ? ` · 另 ${run.lastPressure.sources.length - 2} 项` : '');
  const energySummary = run.lastEnergy.sources.slice(0, 2).map((line) => `${line.label} ${signedDelta(line.amount)}`).join(' · ') + (run.lastEnergy.sources.length > 2 ? ` · 另 ${run.lastEnergy.sources.length - 2} 项` : '');
  const positiveEnergySummary = run.lastEnergy.sources.filter((line) => line.amount > 0).slice(0, 2).map((line) => `${line.label} +${line.amount}`).join(' · ');
  const activeOfferId = pendingOfferId ?? (dragged?.type === 'offer' ? dragged.id : null);
  const activeRider = dragged?.type === 'slot' ? run.cabin[dragged.slot] : selectedSlot !== null ? run.cabin[selectedSlot] : offers.find((offer) => offer.id === activeOfferId);
  const placementPlans = activeRider ? run.cabin.map((_, slot) => planPlacement(run, activeRider, slot)) : [];
  const hoveredPlan = dragOverSlot !== null ? placementPlans[dragOverSlot] : null;

  const departureForecast = `${nextIsShop ? '下一站：商店' : '下一站'} · 电量 ${energyPreview.range} · 躁动 ${pressurePreview.range}${pressurePreview.details ? ` · ${pressurePreview.details}` : ''}`;

  const resultChallenge = failureLesson(run);
  const chargePlan=chargingPlan(run);
  const need=sectorNeed(run);
  const [chargeChoice,setChargeChoice]=useState<{context:string;target:number}|null>(null);
  const chargeContext=`${run.floor}:${run.energy}:${run.energyCap}:${run.coins}`;
  const affordableChargeTarget=Math.min(run.energyCap,run.energy+affordableUnits(boxOf(run),Math.max(0,run.coins)));
  const chargeTarget=Math.max(run.energy,Math.min(run.energyCap,chargeChoice?.context===chargeContext?chargeChoice.target:affordableChargeTarget));
  const chargeUnits=Math.max(0,chargeTarget-run.energy),chargeCost=boxChargeCost(boxOf(run),chargeUnits);
  const seatEnergyCosts=energyBreakdown(run).riderCosts;
  const detailRider=passengerDetails ? run.cabin.find(r=>r?.id===passengerDetails.id) ?? offers.find(r=>r.id===passengerDetails.id) ?? passengerDetails : null;
  const detailBrief=detailRider ? passengerBrief(detailRider,run.floor,run.cabin,cooperationBonus(run),cooperationRelief(run),eventPressureMultiplier(run),run.stress) : null;
  const detailOnboard=detailRider ? run.cabin.some(r=>r?.id===detailRider.id) : false;
  const canDismiss=Boolean(detailRider&&detailOnboard&&detailRider.boardedAt<run.floor&&run.status==='playing'&&doors==='open');
  const penalty=detailRider?dismissalCost(run,detailRider):0;

  const reset = useCallback(() => { journeyTimers.current.forEach(clearTimeout); journeyTimers.current = []; if (feedbackTimer.current) clearTimeout(feedbackTimer.current); setFeedback(null); setArriving([]); setMetricEvent(null); setReceiptOpen(false); setInventoryOpen(false); setChangelogOpen(false); setPassengerDetails(null); setEjectArmed(false); setLeaveArmed(false); disposeGameAudio(); recordRef.current = []; setCopied(null); const opening = daily ? startRun(false, stream(daily.seed, 'offers', 1), LEGEND_STARTERS) : startRun(false, Math.random, unlockedLegends); setRunStartBest(bestFloor); setRun(opening.state); presentOffers(opening.offers); setRunDelivered({}); setNewLegends([]); setGuidedShift(false); setSelectedSlot(null); setPendingOfferId(null); setDragged(null); setDragOverSlot(null); setDoors('open'); setIntro(false); busyRef.current = false; }, [bestFloor, presentOffers, unlockedLegends, daily]);
  const switchMode = (toDaily: boolean) => { const url = new URL(window.location.href); if (toDaily) url.searchParams.set('daily', '1'); else url.searchParams.delete('daily'); window.location.assign(url.toString()); };
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
    scrollMobileTarget('.elevator-stage','center');
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
    if (!run.cabin.some(Boolean)) { flash({tone:'error',label:'至少接一位乘客才能上行',slots:[]}); playTone(sound,'danger'); return; }
    if (risk.fatal && !departArmed) { setDepartArmedFor(run); playTone(sound,'danger'); return; }
    const reduced = fastReveal || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    busyRef.current = true; setSelectedSlot(null); setPendingOfferId(null); setDragged(null); setDragOverSlot(null); setFeedback(null); setDoors('closing'); playTone(sound, 'depart');
    journeyTimers.current.forEach(clearTimeout);
    journeyTimers.current = [
      setTimeout(() => setDoors('moving'), reduced ? 30 : 250),
      setTimeout(() => {
        const resolved = resolveFloor(run, rngOf('resolve', run.floor), {}, rngOf('shop-draw', run.floor + 1)); let delivered = resolved;
        recordRef.current.push({ floor: run.floor, energy: run.energy, stress: run.stress, coins: run.coins, cabin: run.cabin.map(r => r ? [r.kind, r.destination - run.floor] : null), offers: offers.map(o => o.kind), arrivals: (resolved.lastArrivals ?? []).map(a => [a.kind, a.coins]), after: { energy: resolved.energy, stress: resolved.stress, coins: resolved.coins, status: resolved.status } });
        if (resolved.status === 'playing') { const batch=nextOfferBatch(resolved, rngOf('offers', resolved.floor)); delivered=batch.state; presentOffers(batch.offers); if (batch.offers.some((rider) => rider.calledByLover) && resolved.lastPressure.delta <= 0) delivered = { ...delivered, message: '恋人的呼唤得到了回应。把两人安排在相邻站位。' }; }
        const deliveredNow = { ...runDelivered }; for (const a of resolved.lastArrivals ?? []) deliveredNow[a.kind] = (deliveredNow[a.kind] ?? 0) + 1; setRunDelivered(deliveredNow);
        const newStories = (resolved.lastArrivals ?? []).map(a => a.kind).filter((k, i, all) => !storiesUnlocked.includes(k) && all.indexOf(k) === i);
        if (newStories.length) { const next = [...storiesUnlocked, ...newStories]; setStoriesUnlocked(next); saveList(STORIES_KEY, next); }
        const seen = [...new Set([...keepsakesSeen, ...(resolved.keepsakes ?? [])])]; if (seen.length !== keepsakesSeen.length) { setKeepsakesSeen(seen); saveList(KEEPSAKES_SEEN_KEY, seen); }
        if (resolved.status === 'lost' && daily && resolved.floor > dailyBest) { setDailyBest(resolved.floor); try { localStorage.setItem(`elevator-tales-daily-best-${daily.key}`, String(resolved.floor)); } catch { /* storage unavailable */ } }
        if (resolved.status === 'lost') { const unlocks = nextUnlocks(unlockedLegends, { floor: resolved.floor, delivered: deliveredNow, keepsakes: resolved.keepsakes ?? [] }, seen); const fresh = unlocks.filter(k => !unlockedLegends.includes(k)); if (fresh.length) { setUnlockedLegends(unlocks); saveList(LEGEND_UNLOCKS_KEY, unlocks); setNewLegends(fresh); } }
        setRun(delivered); setArriving(resolved.lastArrivals??[]); setDoors('opening');
        journeyTimers.current.push(setTimeout(()=>{setArriving([]);setDoors('open');busyRef.current=false;if(!document.querySelector('[role="dialog"]'))scrollMobileTarget('.candidate-panel','start');},resolved.lastArrivals?.length?(reduced?800:1600):(reduced?40:260)));
        reportMetrics(run, resolved, `${resolved.floor} 层 · 到站结算`);
        flash({ tone: 'arrival', label: `${String(resolved.floor).padStart(2, '0')}F · 本层结算`, slots: [], coins: resolved.lastEarnings.total, energy: resolved.lastEnergy.delta, pressure: resolved.lastPressure.delta });
        playTone(soundEnabled.current, resolved.status === 'lost' ? 'danger' : 'arrive');
      }, reduced ? 70 : 470),

    ];
  }, [locked, sound, run, flash, reportMetrics, fastReveal, presentOffers, runDelivered, keepsakesSeen, unlockedLegends, storiesUnlocked, rngOf, offers, daily, dailyBest, risk.fatal, departArmed]);
  // Arrival coins fly from each departing rider into the wallet. Purely decorative DOM, removed on finish.
  useEffect(() => {
    if (!arriving.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => {
      const wallet = document.querySelector('[data-metric="coins"]')?.getBoundingClientRect();
      if (!wallet || !wallet.width) return;
      document.querySelectorAll('.arrival-exit .arrival-payout').forEach((payout, index) => {
        const from = payout.getBoundingClientRect(); const coins = arriving[index]?.coins ?? 0; if (!from.width || coins <= 0) return;
        const x0 = from.left + from.width / 2, y0 = from.top + from.height / 2, dx = wallet.left + wallet.width / 2 - x0, dy = wallet.top + wallet.height / 2 - y0;
        const count = Math.min(6, Math.max(2, Math.ceil(coins / 4)));
        for (let k = 0; k < count; k++) {
          const coin = document.createElement('span'); coin.className = 'coin-flight'; coin.style.left = `${x0}px`; coin.style.top = `${y0}px`; document.body.appendChild(coin);
          const spread = (k - (count - 1) / 2) * 16;
          coin.animate([
            { transform: 'translate(-50%,-50%) scale(.5)', opacity: 0 },
            { transform: `translate(calc(-50% + ${dx * .25 + spread}px), calc(-50% + ${dy * .25 - 70}px)) scale(1)`, opacity: 1, offset: .35 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.45)`, opacity: .85 },
          ], { duration: 820, delay: k * 70, easing: 'cubic-bezier(.45,0,.3,1)', fill: 'forwards' }).onfinish = () => coin.remove();
        }
      });
    }, fastReveal ? 60 : 420);
    return () => { window.clearTimeout(timer); document.querySelectorAll('.coin-flight').forEach(coin => coin.remove()); };
  }, [arriving, fastReveal]);
  useEffect(() => { const onKey = (event: KeyboardEvent) => {
    if (intro || help || pressureHelp || archive || receiptOpen || passengerDetails || inventoryOpen || changelogOpen || event.repeat) return;
    if (event.key === 'Escape') { setPendingOfferId(null); setSelectedSlot(null); setDragged(null); setDragOverSlot(null); return; }
    if (event.key === 'Enter' && !(event.target instanceof HTMLElement && event.target.closest('button,input,textarea,select,[contenteditable="true"]'))) { event.preventDefault(); depart(); }
  }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [depart, intro, help, pressureHelp, archive, receiptOpen, passengerDetails, inventoryOpen, changelogOpen]);
  const chooseUpgrade = (key: UpgradeKey) => {
    setLeaveArmed(false);
    const updated = installUpgrade(run, key); if (updated === run) return;
    const extra = run.shopUpgradeBought;
    reportMetrics(run, updated, `${extra ? '加购' : '选取'}${UPGRADES[key].name}`);
    setRun(updated); flash({ tone: 'combo', label: `${UPGRADES[key].name} · ${extra ? '已加购' : '已选取'}`, slots: [] }); playTone(sound, 'upgrade');
  };

  const finishShopping = () => { if (upgradeCrisis) { const repaired = repairEmergency(run); if (repaired !== run) { setLeaveArmed(false); reportMetrics(run,repaired,'紧急维修'); setRun(repaired); return; } if (!leaveArmed) { setLeaveArmed(true); return; } } if(!upgradeCrisis && run.energy < chargePlan.baseline && !leaveArmed) {setLeaveArmed(true);return;} setLeaveArmed(false); const next = leaveShop(run); if (next === run) return; if(next.status==='lost'){const unlocks=nextUnlocks(unlockedLegends,{floor:next.floor,delivered:runDelivered,keepsakes:next.keepsakes??[]},keepsakesSeen);const fresh=unlocks.filter(k=>!unlockedLegends.includes(k));if(fresh.length){setUnlockedLegends(unlocks);saveList(LEGEND_UNLOCKS_KEY,unlocks);setNewLegends(fresh);}setRun(next);playTone(sound,'danger');} if (next.status === 'playing') {recordRef.current.push({ shop: run.floor, coins: run.coins, energy: run.energy, abilities: Object.entries(run.upgrades).filter(([,v])=>v).map(([k])=>k), box: boxOf(run), keepsakes: run.keepsakes ?? [] });const batch=nextOfferBatch(next, rngOf('offers', next.floor));setRun(batch.state);presentOffers(batch.offers);} };

  const emergency = (units:number) => {const next=emergencyCharge(run,units);if(next===run)return;reportMetrics(run,next,language==='zh'?'途中补电':'In-transit charging');setRun(next);playTone(sound,'upgrade');};
  const failureCause = run.message.includes('炸弹倒计时') ? 'bomb' : run.energy<=0 && run.stress>=run.stressCap ? 'both' : run.energy<=0 ? 'power' : 'agitation';
  const copyText = (text: string, label: string) => { try { void navigator.clipboard.writeText(text).then(()=>setCopied(label),()=>setCopied('manual:'+text)); } catch { setCopied('manual:'+text); } };
  const shareLine = () => language==='zh' ? `Elevator Tales ${daily?`每日班次 ${daily.key}`:'无尽夜班'}：到达 ${run.floor} 层（${({bomb:'炸弹倒计时归零',both:'电量与躁动同时失控',power:'电量耗尽',agitation:'躁动失控'} as Record<string,string>)[failureCause]}）` : `Elevator Tales ${daily?`daily shift ${daily.key}`:'endless shift'}: reached floor ${run.floor} (${({bomb:'bomb timer',both:'power and agitation',power:'out of power',agitation:'agitation'} as Record<string,string>)[failureCause]})`;
  const runRecordJson = () => JSON.stringify({ game: 'Elevator Tales', version: GAME_VERSION, daily: daily?.key ?? null, floor: run.floor, cause: failureCause, coins: run.coins, earned: run.earned, upgrades: Object.entries(run.upgrades).filter(([,v])=>v).map(([k])=>k), box: boxOf(run), keepsakes: run.keepsakes ?? [], legend: run.legendOffer ?? null, legendStatus: run.legendStatus ?? null, floors: recordRef.current }, null, 1);
  const recharge = (units:number) => {const next=chargeBattery(run,units);if(next===run)return;setLeaveArmed(false);reportMetrics(run,next,'商店充电');setRun(next);playTone(sound,'upgrade');};
  const confirmDismiss = () => {
    if(!detailRider||!canDismiss)return;
    const updated=dismissRider(run,detailRider.id);if(updated===run)return;
    reportMetrics(run,updated,'请离赔偿');setRun(updated);setPassengerDetails(null);setEjectArmed(false);setSelectedSlot(null);setPendingOfferId(null);
    flash({tone:'place',label:`已请离 · 赔偿 ${penalty} 金币`,slots:[]});playTone(sound,'place');
  };

  const content = <main className={`game-shell ${cooperationRelief(run) ? 'has-contract' : ''} ${difficultyTier(run.floor) % 2 ? 'phase-dawn' : ''}`}>
    <div className="ambient-grain" />
    <div className="rotate-notice"><RotateCcw/><h2>请竖屏游玩</h2><p>这个横屏尺寸太矮，转回竖屏即可继续；本班进度保留。</p></div>
    <header className="brand-bar"><div><p className="eyebrow">AN ENDLESS NIGHT SHIFT</p><h1>Elevator Tales</h1></div><div className="brand-actions"><button className="language-button" data-no-translate onClick={toggleLanguage} aria-label={language === 'en' ? 'Switch to Chinese' : '切换为英文'}>{language === 'en' ? '中文' : 'EN'}</button><button className="version-button" onClick={() => setChangelogOpen(true)} aria-label={`查看 v${GAME_VERSION} 更新记录`}><History /><span>v{GAME_VERSION}</span></button><button className="icon-button reveal-toggle" aria-label={fastReveal ? '快速开门：开' : '快速开门：关'} title={fastReveal ? '快速开门：开' : '快速开门：关'} aria-pressed={fastReveal} onClick={() => { const next = !fastReveal; setFastReveal(next); localStorage.setItem('elevator-tales-fast-reveal-v1', next ? 'on' : 'off'); }}><ChevronsUp /></button><button className="icon-button" onClick={() => setHelp(true)} aria-label="玩法说明"><HelpCircle /></button><button className={`icon-button music-button ${music ? '' : 'is-muted'}`} onClick={toggleMusic} aria-label={music ? '关闭音乐' : '打开音乐'} aria-pressed={!music} title={music ? '关闭音乐' : '打开音乐'}><Music2 /></button><button className="icon-button" onClick={() => { soundEnabled.current = !sound; if (sound) disposeGameAudio(); setSound(!sound); localStorage.setItem(SOUND_PREFERENCE_KEY, sound ? 'off' : 'on'); }} aria-label={sound ? '关闭音效' : '打开音效'} title={sound ? '关闭音效' : '打开音效'}>{sound ? <Volume2 /> : <VolumeX />}</button><button className="icon-button inventory-button" onClick={() => setInventoryOpen(true)} aria-label={`查看已装升级，共 ${upgradeCount} 次`}><Layers /><span>{upgradeCount}</span></button><button className="text-button" onClick={() => setArchive(true)}>乘客档案 <span>{String(discovered.filter(kind=>PASSENGER_ORDER.includes(kind)).length).padStart(2, '0')} / {PASSENGER_ORDER.length}</span></button></div></header>
    <section className="game-grid">
      <aside className="status-rail">
        <div className="floor-plaque"><span>当前楼层 · BEST {bestFloor}</span><strong>{String(run.floor).padStart(2, '0')}</strong><small>{phase}</small><span className="route-power">运转 {travelEnergyCost(run.floor+1)} 电 / 层</span><span className="route-notice">{motorAdvanceNotice(run.floor)}</span><progress className="floor-progress" aria-label={`距离 ${nextShop} 层商店还有 ${nextShop - run.floor} 站`} max={10} value={run.floor % 10} /></div>
        <div data-metric="energy" className={`meter-card energy ${energyFatal ? 'meter-danger' : ''}`} title={energyPreview.summary}><div><BatteryCharging aria-hidden="true" /><span className="rail-metric-name">电量</span><b><AnimatedNumber value={run.energy} /><span className="metric-cap">/{run.energyCap}</span></b></div><MetricResponse metric="energy" event={metricEvent} locale={language} /><PowerGauge value={run.energy} cap={run.energyCap} next={run.energy + energyPreview.lowDelta} danger={Math.max(1, -energyPreview.lowDelta)} locale={language} /><small className="rail-forecast"><span>下一站 <b className={energyFatal ? 'forecast-fatal' : ''}>{energyPreview.range}</b></span></small>
          {run.status==='playing'&&<p className={`sector-forecast ${sector.failFloor!==null?'is-danger':sector.projected<8?'is-warn':''}`} data-no-translate>{language==='zh'?(sector.failFloor!==null?`照现在：${sector.failFloor} 层断电`:`到 ${sector.shop} 层商店约剩 ${sector.projected} 电`):(sector.failFloor!==null?`At this rate: out of power at ${sector.failFloor}F`:`About ${sector.projected} power at the ${sector.shop}F shop`)}</p>}
          {run.status==='playing'&&(sector.failFloor!==null||sector.projected<12||energyFatal)&&<div className="emergency-charge" data-no-translate title={language==='zh'?`本段还可补 ${emergencySectorLeft(run)} 电 · 途中价 ${emergencyPrice} 币/电`:`${emergencySectorLeft(run)} left this sector · ${emergencyPrice} coins each`}>
            <button disabled={locked||emergencyLeft<=0||run.coins<emergencyPrice} onClick={()=>emergency(1)}>{language==='zh'?`途中补电 +1 · ${emergencyPrice}币`:`Charge +1 · ${emergencyPrice}c`}</button>
            {emergencyNeed>0&&<button className="is-urgent" disabled={locked||run.coins<emergencyNeed*emergencyPrice} onClick={()=>emergency(emergencyNeed)}>{language==='zh'?`补足 +${emergencyNeed} · ${emergencyNeed*emergencyPrice}币`:`Top up +${emergencyNeed} · ${emergencyNeed*emergencyPrice}c`}</button>}
          </div>}
          <p className="route-notice">运转 {travelEnergyCost(run.floor+1)} 电/层 · {nextIsShop ? (language==='zh'?`本次预测含到店补电 +${shopEntryCharge(boxOf(run))}`:`Forecast includes shop +${shopEntryCharge(boxOf(run))}`) : motorAdvanceNotice(run.floor)}</p></div>
        <div data-metric="stress" className={`meter-card pressure ${agitated || pressurePreview.tone === 'danger' ? 'meter-danger' : ''}`} title={pressurePreview.summary}>
          <div><Flame aria-hidden="true" /><span className="meter-label"><span className="rail-metric-name">躁动</span><button className="meter-help" onClick={() => setPressureHelp(true)} aria-label="查看躁动规则"><HelpCircle /></button></span><b><AnimatedNumber value={run.stress} /><span className="metric-cap">/{run.stressCap}</span></b></div>
          <MetricResponse metric="stress" event={metricEvent} locale={language} />
          <AgitationGauge value={run.stress} cap={run.stressCap} nextLow={run.stress+pressurePreview.lowDelta} nextHigh={run.stress+pressurePreview.highDelta} locale={language}/>
          <small className="rail-forecast"><span>下一站 <b className={stressFatal ? 'forecast-fatal' : ''}>{pressurePreview.range}</b></span></small>
        </div>
        <div data-metric="coins" className="score-card wallet-card"><Coins aria-hidden="true" /><span className="rail-metric-name">余额</span><strong><RegisterNumber value={run.coins} /></strong><MetricResponse metric="coins" event={metricEvent} locale={language} /><span className={`mobile-shop-note ${nextIsShop ? 'shop-next' : ''}`}>{nextIsShop ? '下一层：商店' : `距商店 ${nextShop - run.floor} 层`}</span><small className={`wallet-summary ${nextIsShop ? 'shop-next' : ''}`}>{nextIsShop ? '下一层：商店' : `距商店 ${nextShop - run.floor} 层`}</small></div>

        {(run.serviceTurns??0)>0&&<p className="service-status">{`检修生效 · 余${run.serviceTurns}层`}<br/>运转少耗1电/层</p>}
        <div className="run-tools">
        {run.calmCharge&&<button className="reserve-use" disabled={locked||run.stress<=0} onClick={()=>{const next=applyCalmCharge(run);setRun(next);reportMetrics(run,next,'手动调节');}}>{language==='zh'?'手动调节 −3躁动 · 每店补满':'Manual relief −3 · refills at shops'}</button>}
        {oldMovesRemaining(run)<2&&<p className="route-note">旧乘客换位剩余{oldMovesRemaining(run)}次</p>}
        {run.reservedRider&&<p className="route-note">已留座：{PASSENGERS[run.reservedRider.kind].name} · 下一批到来</p>}
        {run.reserveCell&&<button className="reserve-use" disabled={locked||run.energy>=run.energyCap} onClick={()=>{const next=consumeReserveCell(run);if(next!==run){setRun(next);reportMetrics(run,next,'使用应急电池');}}}><BatteryCharging aria-hidden="true"/>{`使用应急电池 +${Math.min(RESERVE_CELL_CHARGE,Math.max(0,run.energyCap-run.energy))}电`}</button>}
        {run.upgrades.buffer>0&&<p>{`飞轮本段可省 ${flywheelAllowance(run)}/4电 · 到商店重置`}</p>}
        {run.upgrades.punchcard>0&&<p>第五张票 {(run.punchCount??0)+1}/5 · 同层按1→6号位</p>}
        {run.upgrades.single>0&&<p>单人到站：整车+2币</p>}
        {run.upgrades.finale>0&&<p>至少2人到站，车内剩0–1人：+8币</p>}
        {run.upgrades.retime>0&&<div className="retime-controls"><p>改签 · 每十层一次</p>{[-1,1].map(delta=><button key={delta} disabled={locked||!activeRider||activeRider.boardedAt!==run.floor||!run.cabin.some(r=>r?.id===activeRider.id)||run.retimeUsedSector===Math.floor(run.floor/10)||(delta<0&&activeRider.destination<=run.floor+1)} onClick={()=>{if(activeRider){const next=retimeRider(run,activeRider.id,delta);setRun(next);}}}>{delta<0?'提前1站':'延后1站'}</button>)}</div>}
        </div>
        {metricEvent && <button className="receipt-button" onClick={() => setReceiptOpen(true)}><BookOpen /> 本次变化明细 <span>↗</span></button>}
        <div className="event-log">{run.log.slice(0, 3).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div>
      </aside>
      <section className={`elevator-stage doors-${doors} ${activeRider ? 'is-placing' : ''} ${agitated ? 'cabin-agitated' : ''} ${run.status==='playing'&&risk.fatal ? 'power-fatal' : run.status==='playing'&&run.energy + energyPreview.lowDelta <= LOW_POWER_FLICKER ? 'power-low' : ''}`} data-district={districtFor(run.floor).id} style={{ '--shake': (0.6 + 2.6 * Math.min(1, run.stress / Math.max(1, run.stressCap))).toFixed(2) } as CSSProperties} aria-label="电梯座舱" aria-busy={doors !== 'open'}>
        <div className="elevator-image" /><div className="district-light" aria-hidden="true" /><div className="cabin-flicker" aria-hidden="true" /><div className="motion-lines" /><div className="floor-indicator"><ArrowUp /><b key={run.floor}>{String(run.floor).padStart(2, '0')}</b></div><div className="district-tag" data-no-translate>{districtFor(run.floor).name[language==='zh'?0:1]}</div>
        {outlook && <div className={`adjacency-key shift-outlook ${nextIsShop ? 'shop-next-outlook' : 'peak-outlook'}`}><span>{outlook}</span><span className="connection-legend">绿线协作 · 红线代价 · 紫箭头复制</span></div>}
        {feedback && (feedback.tone!=='arrival'||arriving.length===0) && <output key={feedback.id} className={`cabin-feedback feedback-${feedback.tone}`}>
          <div className="feedback-label">{feedback.tone === 'error' ? <X /> : feedback.tone === 'combo' ? <Sparkles /> : <Check />}<b>{feedback.label}</b></div>
          {feedback.tone === 'arrival' && <div className="feedback-values">{Boolean(feedback.coins) && <span className="value-coins" aria-label={`金币增加 ${feedback.coins}`}><Coins aria-hidden="true" />{signedDelta(feedback.coins ?? 0)}</span>}<span aria-label={`电量 ${signedDelta(feedback.energy ?? 0)}`} className={feedback.energy! > 0 ? 'value-gain' : feedback.energy! < 0 ? 'value-spent' : 'value-neutral'}><BatteryCharging aria-hidden="true" />{signedDelta(feedback.energy ?? 0)}</span><span aria-label={`躁动 ${signedDelta(feedback.pressure ?? 0)}`} className={feedback.pressure! > 0 ? 'value-danger' : feedback.pressure! < 0 ? 'value-gain' : 'value-neutral'}><Flame aria-hidden="true" />{signedDelta(feedback.pressure ?? 0)}</span></div>}
          {feedback.tone === 'arrival' && <p className="feedback-cause">{[earningSummary,positiveEnergySummary||(!earningSummary?energySummary:''),pressureSummary].filter(Boolean).join(' · ')}</p>}
        </output>}
        {doors === 'moving' && <div className="travel-caption"><ArrowUp />前往 {String(run.floor + 1).padStart(2, '0')}F</div>}
        <div className="standing-grid"><svg className="adjacency-map" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">{ADJACENT.map(([first, second]) => {
          const previewing=Boolean(hoveredPlan?.ok&&hoveredPlan.changed);
          const active = activeConnection(run.cabin, first, second); const currentConflict=conflictLinks(run.cabin).find(link=>link.first===first&&link.second===second);
          const preview = previewing && activeConnection(hoveredPlan!.next.cabin, first, second);
          const previewConflict=previewing?conflictLinks(hoveredPlan!.next.cabin).find(link=>link.first===first&&link.second===second):undefined;
          const shownActive=previewing?preview:active;
          const shownCabin=previewing ? hoveredPlan!.next.cabin : run.cabin;
          const partnership = riskPartnerships(shownCabin).edges.some(([a,b])=>a===first&&b===second);
          const copy=copyConnection(shownCabin,first,second);
          const shownConflict=previewing?previewConflict:currentConflict;
          const previewEdge=shouldPreviewConnection(previewing,active,preview,currentConflict?.effect??null,previewConflict?.effect??null);
          const [x1,y1]=CONNECTION_POINTS[first]; const [x2,y2]=CONNECTION_POINTS[second];
          const cost=[partnership?'🔥 +1':'',shownConflict?conflictGlyph(shownConflict.effect):''].filter(Boolean).join(' · ');
          return <g key={`${first}-${second}`} className={`connection-path ${shownActive ? 'active' : ''} ${partnership ? 'partnership-link' : ''} ${copy?'copy-link':''} ${shownConflict?'conflict-link':''} ${previewEdge ? 'preview-link' : ''}`}><line className="connection-underlay" x1={x1} y1={y1} x2={x2} y2={y2}/><line className="connection-core" x1={x1} y1={y1} x2={x2} y2={y2}/>{(shownActive||shownConflict)&&!copy&&<circle className="connection-node" cx={(x1+x2)/2} cy={(y1+y2)/2} r="3"/>}{copy&&<path className="copy-direction" d={`M ${x1-5} 104 L ${x1} 96 L ${x1+5} 104`}/>} {cost&&<text className="connection-effect" x={(x1+x2)/2+(copy?12:0)} y={(y1+y2)/2-6} textAnchor={copy?'start':'middle'}>{cost}</text>}</g>;
        })}</svg>{run.cabin.map((rider, index) => {
          const state = riderState(run.cabin, index, cooperationBonus(run), run.stress); const plan = placementPlans[index]; const synergy = plan?.ok && plan.changed && plan.tone === 'combo'; const agitation=riderAgitation(run,index); const seatBrief=rider?{...passengerBrief(rider,run.floor,run.cabin,cooperationBonus(run),cooperationRelief(run),eventPressureMultiplier(run),run.stress),energy:seatEnergyCosts[index].total}:null;
          const target = dragOverSlot === index && Boolean(activeRider); const reaction = feedback?.slots.includes(index) ? feedback : null;
          const agitationValue=agitation.low===agitation.high?signedDelta(agitation.low):`${signedDelta(agitation.low)}～${signedDelta(agitation.high)}`;
          const compactAgitationValue=agitation.low===agitation.high?compactDelta(agitation.low):`${compactDelta(agitation.low)}～${compactDelta(agitation.high)}`;
          return <div key={index} className="standing-slot-wrap"><button disabled={locked} className={`standing-slot ${rider ? `category-${passengerCategory(rider.kind)}` : ''} ${rider ? 'occupied' : ''} ${rider?.boardedAt === run.floor ? 'newly-boarded' : ''} ${synergy ? 'synergy-target' : ''} ${plan ? plan.ok ? 'drop-valid' : 'drop-blocked' : ''} ${selectedSlot === index ? 'selected' : ''} ${target ? 'drag-target' : ''}`} onClick={() => clickSlot(index)} draggable={Boolean(rider) && !locked && (!run.swapped || rider?.boardedAt === run.floor)} onDragStart={(event) => rider && startDrag(event, { type: 'slot', slot: index })} onDragEnd={endDrag} onMouseEnter={() => activeRider && window.matchMedia('(min-width: 701px) and (hover: hover)').matches && setDragOverSlot(index)} onMouseLeave={() => !dragged && setDragOverSlot(null)} onDragOver={(event) => { if (!locked && dragged) { event.preventDefault(); event.dataTransfer.dropEffect = plan?.ok ? 'move' : 'none'; setDragOverSlot(index); } }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOverSlot((current) => current === index ? null : current); }} onDrop={(event) => dropOnSlot(event, index)} aria-label={rider ? `${index + 1}号位，${PASSENGERS[rider.kind].name}，到站收益${seatBrief?.expectedFare??'未知'}，每站耗电${seatBrief?.energy}，下一站躁动${agitationValue}${state ? `，${state.label}` : ''}` : `${index + 1}号空位${synergy ? '，可联动' : ''}`}>
            {rider && seatBrief ? <span className={`rider-visual ${rider.kind==='bomb'?'rider-bomb':''} ${rider.volatile?'rider-high-risk':''}`} key={rider.id}><span className="seat-heading"><span className="rider-name">{PASSENGERS[rider.kind].name}</span>{rider.volatile&&<span className="seat-risk-tag"><Flame aria-hidden="true" />高危</span>}</span><span className="slot-destination">还剩 {Math.max(0, rider.destination - run.floor)} 站</span><span className="seat-art"><Portrait kind={rider.kind} large />{(Boolean(rider.stash) || (state && rider.kind !== 'bomb') || rider.fuse !== undefined) && <span className="seat-overlay">{Boolean(rider.stash)&&<span className="seat-stash">暂存 {rider.stash}</span>}{state && rider.kind !== 'bomb' && <span className={`slot-state ${state.tone}`}>{state.label}</span>}{rider.fuse !== undefined && <span className="fuse">炸弹倒计时 {rider.fuse}</span>}</span>}</span><span className="seat-metrics"><span className="seat-fare" title="按当前站位、躁动和已完成进度计算；下一站到站含本次进度，不含概率奖励" aria-label={`到站收益 ${seatBrief.expectedFare??'未知'}`}><Coins aria-hidden="true" />{seatBrief.expectedFare??'?'}</span><span className="seat-energy" title="人物耗电含红线倍率；链接固定耗电与整车节能另计" aria-label={`每站耗电 ${seatBrief.energy}`}><BatteryCharging aria-hidden="true" />{seatBrief.energy}</span><span className="seat-agitation" title="下一站躁动" aria-label={`下一站躁动 ${agitationValue}`}><Flame aria-hidden="true" />{compactAgitationValue}</span></span></span> : <><span className="slot-number">{String(index + 1).padStart(2, '0')}</span>{target && plan?.ok && activeRider && <span className="placement-ghost"><Portrait kind={activeRider.kind} large /></span>}</>}
            {reaction && <span key={reaction.id} className={`slot-reaction reaction-${reaction.tone}`} aria-hidden="true" />}
            {target && plan && <span className={`drop-caption ${plan.ok ? 'allowed' : 'blocked'}`}>{plan.ok ? `${dragged ? '松手' : '点击'} · ${synergy ? '联动' : '就位'}` : '不可放置'}</span>}
          </button>{rider && <button className="seat-info-button" type="button" disabled={locked} draggable={false} onDragStart={(event)=>event.preventDefault()} onClick={()=>{setEjectArmed(false);setPassengerDetails(rider);}} aria-label={`查看${PASSENGERS[rider.kind].name}详情`} title="查看人物详情"><Info aria-hidden="true" /></button>}</div>;
        })}</div>
        <button className="cabin-inspect-button" disabled={!activeRider || locked} onClick={() => {if(activeRider){setEjectArmed(false);setPassengerDetails(activeRider);}}}><BookOpen />{activeRider ? `查看${PASSENGERS[activeRider.kind].name} · 请离` : '选中人物 · 查看 / 请离'}</button>
        <div className="door door-left" /><div className="door door-right" />
        {arriving.length>0&&<div className="standing-grid arrival-grid">{arriving.map(arrival=><div key={arrival.riderId} className="standing-slot-wrap" style={{gridColumn:arrival.slot%3+1,gridRow:Math.floor(arrival.slot/3)+1}}><div className={`arrival-exit ${fastReveal?'arrival-quick':''}`} role="status" aria-label={`${PASSENGERS[arrival.kind].name} 到站 +${arrival.coins} 金币`}><div className="arrival-portrait"><Portrait kind={arrival.kind} large /></div><span className="arrival-name">{PASSENGERS[arrival.kind].name}</span><span className="arrival-payout"><Coins aria-hidden="true"/>+{arrival.coins}<small>金币</small></span></div></div>)}</div>}
        <div className={`cabin-message ${hoveredPlan && !hoveredPlan.ok ? 'message-error' : ''}`} aria-live="polite"><Sparkles /><span>{hoveredPlan ? hoveredPlan.ok ? hoveredPlan.next.message : hoveredPlan.label : selectedSlot !== null && run.swapped ? '旧乘客换位已用 · 仅新上客可调整 · ESC 取消' : run.message}</span></div><div className="swap-status">{pendingOfferId ? '选择发光站位 · ESC 取消' : selectedSlot !== null ? run.swapped ? '旧乘客换位已用 · 仅新上客可调整 · ESC 取消' : '再选一个站位完成调整 · ESC 取消' : run.swapped ? <><LockKeyhole /> 旧乘客换位已用 · 新上客仍可调整</> : '拖拽人物安排站位 · 有效组合会亮起'}</div>
      </section>
      <aside className="arrival-panel">
        <div className={`arrival-heading ${loverResponse || firstPairLesson ? 'lover-response' : ''}`}><div><span>{loverResponse ? 'LOVER SIGNAL · RESPONSE' : firstPairLesson ? 'FIRST LINK · GUIDED SHIFT' : doors === 'open' ? 'DOORS OPEN' : 'IN TRANSIT'}</span><h2>{loverResponse ? '有人回应了呼唤' : firstPairLesson ? firstPairActive ? '绿色协作已生效' : '试着连出一条绿线' : '谁要上楼？'}</h2></div><div className="arrival-count">{offers.length} 位</div></div>
        <p className="arrival-explainer"><span>每次开门，都是新机会</span><span className="category-legend"><i className="category-good">好人</i><i className="category-bad">坏人</i><i className="category-special">特殊</i></span></p>
        <div className="candidate-panel"><div className={`passenger-list ${offers.length > 3 ? 'has-four' : ''} ${!intro && !fastReveal && run.status === 'playing' ? 'offer-revealing' : ''}`} key={run.floor} role="list" aria-label="本层候客乘客">
          {offers.map((offer, offerIndex) => {
            const spec = PASSENGERS[offer.kind];
            const currentRider=run.cabin.find((rider)=>rider?.id===offer.id);
            const displayedOffer=currentRider??(run.rebooked?.[offer.id]!==undefined?{...offer,destination:run.rebooked[offer.id]}:offer);
            const boarded = Boolean(currentRider); const pending = pendingOfferId === offer.id;
            const full = !boarded && cabinFull;
            const unavailable = full; const isDragging = dragged?.type === 'offer' && dragged.id === offer.id;
            const partner = unavailable ? null : readyPartner(offer.kind, run.cabin, offer.id, offer);
            const grade=passengerCardGrade(offer.kind);
            return <div className="passenger-item" style={{ animationDelay: `${offerIndex * 90}ms` }} role="listitem" key={offer.id}><button className={`passenger-card category-${passengerCategory(offer.kind)} kind-${offer.kind} grade-${grade} tone-${spec.tone} ${offer.volatile?'volatile':''} ${offer.calledByLover ? 'lover-called' : ''} ${firstPairLesson && offer.kind === 'lover' ? 'guided-lover' : ''} ${boarded ? 'boarded' : ''} ${pending ? 'pending' : ''} ${isDragging ? 'dragging' : ''}`} onClick={() => toggleOffer(offer)} aria-label={language==='zh'?`候选：${spec.name}，车费${displayedOffer.kind==='mystery'?'待揭晓':passengerBrief(displayedOffer,run.floor,run.cabin).coins}，每层耗电${passengerBrief(displayedOffer,run.floor,run.cabin).energy}，还剩${Math.max(0,displayedOffer.destination-run.floor)}站${boarded?'，已上车':''}`:`Candidate: ${riderName(offer.kind,'en')}, fare ${displayedOffer.kind==='mystery'?'sealed':passengerBrief(displayedOffer,run.floor,run.cabin).coins}, power ${passengerBrief(displayedOffer,run.floor,run.cabin).energy} per floor, ${Math.max(0,displayedOffer.destination-run.floor)} stops${boarded?', aboard':''}`} draggable={!locked && !unavailable} onDragStart={(event) => startDrag(event, { type: 'offer', id: offer.id })} onDragEnd={endDrag} disabled={locked || unavailable} aria-pressed={boarded || pending}>
              {boarded && <span className="boarded-status" aria-hidden="true"><Check />已上车</span>}
              <PassengerCardFace rider={displayedOffer} run={run} action={language==='zh'?(boarded?'已上车 · 再点撤回':pending?'已选中 · 点一个空位':full?'车厢已满':partner?`${offer.kind==='mimic'?'可复制':'可连绿线'} · ${PASSENGERS[partner].name}`:undefined):(boarded?'Aboard · click to withdraw':pending?'Selected · pick a seat':full?'Cabin full':partner?`${offer.kind==='mimic'?'Can copy':'Green link'} · ${riderName(partner,'en')}`:undefined)} locale={language}/>
            </button>{run.upgrades.reservation>0&&!boarded&&<button className="reservation-button" disabled={locked||Boolean(run.reservedRider)||run.reservationUsedSector===Math.floor(run.floor/10)||run.reservedIds?.includes(offer.id)} onClick={()=>{const next=reserveOffer(run,offers,offer.id);if(next!==run){setRun(next);setOffers(current=>current.filter(r=>r.id!==offer.id));setPendingOfferId(null);setDragged(null);}}}>{run.reservedIds?.includes(offer.id)?'已保留过 · 不可续订':'留到下一批 · 每十层一次'}</button>}<button className="mobile-rule-button" onClick={() => {setEjectArmed(false);setPassengerDetails(displayedOffer);}} aria-label={`查看${spec.name}规则`}><BookOpen /><span>{language === 'en' ? 'Details' : '完整规则'}</span></button></div>;
          })}
        </div><div className="candidate-notes"><span className="route-note">运转 {travelEnergyCost(run.floor+1)} 电/层 · 下段 {travelEnergyCost(nextShop+1)} 电/层</span><span>每层＝上行后立即结算 · 到站＝下车时结算 · 邻座逐人叠加</span>{run.upgrades.single>0&&<span>车费不含整车奖励：单人到站+2币</span>}{run.upgrades.crowd>0&&<span>车费不含整车奖励：三类齐全且有人到站+6币</span>}{showSavingRule&&<span>{SHARED_SAVING_RULE}</span>}</div></div>
        <div className="departure-controls">
          <button className="mobile-inspect-button" disabled={!activeRider || locked} onClick={() => {if(activeRider){setEjectArmed(false);setPassengerDetails(activeRider);}}} aria-label="查看选中人物规则"><BookOpen /><span>人物/请离</span></button>
          {run.status==='playing'&&doors==='open'&&occupied>0&&(risk.fatal||(sector.failFloor!==null&&sector.failFloor-run.floor<=2))&&<div className={`power-alert ${risk.fatal?'is-fatal':''} ${departArmed?'is-armed':''}`} role="alert" data-no-translate>
            <p><BatteryCharging aria-hidden="true"/>{risk.fatal?(language==='zh'?`这一层可能断电：电量 ${run.energy}，下一站 ${energyPreview.range}`:`This floor can run you out of power: ${run.energy} now, next ${energyPreview.range}`):(language==='zh'?`照现在 ${sector.failFloor} 层断电`:`At this rate: out of power at ${sector.failFloor}F`)}</p>
            <div className="power-alert-actions">
              {risk.fatal&&risk.need>0&&<button disabled={locked||risk.affordable<risk.need} onClick={()=>emergency(risk.need)}>{language==='zh'?`补电 +${risk.need} · ${risk.need*risk.unitPrice}币`:`Charge +${risk.need} · ${risk.need*risk.unitPrice}c`}</button>}
              {emergencyNeed>risk.need&&<button disabled={locked||risk.affordable<emergencyNeed} onClick={()=>emergency(emergencyNeed)}>{language==='zh'?`补足本段 +${emergencyNeed} · ${emergencyNeed*risk.unitPrice}币`:`Top up sector +${emergencyNeed} · ${emergencyNeed*risk.unitPrice}c`}</button>}
            </div>
            {risk.fatal&&risk.affordable<risk.need&&(rescue?<div className="power-alert-rescue"><small>{language==='zh'?`能撑过：${rescue.remove.map(r=>`${riderName(r.kind,'zh')}${r.paid?`（请离 ${r.paid} 币）`:'（撤回上车）'}`).join('、')}${rescue.charge?`，再补电 +${rescue.charge}`:''}。`:`You can make it: ${rescue.remove.map(r=>`${riderName(r.kind,'en')} ${r.paid?`(dismiss, ${r.paid}c)`:'(withdraw)'}`).join(', ')}${rescue.charge?`, then charge +${rescue.charge}`:''}.`}</small>{rescue.remove.every(r=>r.paid>0)&&<button disabled={locked} onClick={()=>{let next=run;for(const r of rescue.remove)next=dismissRider(next,r.id);if(rescue.charge)next=emergencyCharge(next,rescue.charge);if(next!==run){reportMetrics(run,next,language==='zh'?'请离并补电':'Dismiss and charge');setRun(next);playTone(sound,'upgrade');}}}>{language==='zh'?`照此安排 · ${rescue.cost}币`:`Do it · ${rescue.cost}c`}</button>}</div>:<small className="power-alert-doomed">{language==='zh'?'这一层无论怎么安排都会断电：补电额度或金币不够，请离也省不出来。':'No arrangement survives this floor: not enough coins or allowance, and dismissals cannot save enough.'}</small>)}
            {risk.fatal&&departArmed&&<small>{language==='zh'?'再按一次上行＝冒险出发。':'Press ascend again to risk it.'}</small>}
          </div>}
          <button className={`depart-button ${departArmed?'is-armed':''}`} onClick={depart} disabled={locked || occupied===0} aria-label={language==='zh'?`关门上行 · 下一站电量 ${energyPreview.range}，躁动 ${pressurePreview.range}`:`Close doors and ascend`}><span>{doors === 'open' ? occupied===0?'至少接1人':departArmed?'确认冒险上行':'关门上行' : '正在上行'}</span><b>ENTER</b><ArrowUp className="mobile-depart-arrow" /></button>
          {(pendingOfferId || selectedSlot !== null || firstPairLesson && !firstPairActive) && <p className={`mobile-departure-note forecast-${forecastTone}`} aria-live="polite">{pendingOfferId ? `已选${activeRider ? PASSENGERS[activeRider.kind].name : '乘客'} · 点下方空位` : selectedSlot !== null ? run.swapped ? '旧乘客换位已用 · 仅新上客可调整 · ESC 取消' : '点另一站位换位 · 再点原位取消' : '新手示例：让两位恋人成为邻座，观察绿色协作线'}</p>}
          <p className={`panel-hint forecast-${forecastTone}`} aria-live="polite">{pendingOfferId ? '已选中乘客 · 请点电梯里的目标空位' : firstPairLesson && !firstPairActive ? '新手示例 · 让两位恋人成为邻座，观察绿色协作线' : departureForecast}</p>
        </div>
      </aside>
    </section>
    <footer className="footer-line"><button onClick={() => setChangelogOpen(true)} aria-label={`查看 v${GAME_VERSION} 更新记录`}>ELV–07 / v{GAME_VERSION} · CHANGELOG</button><i /><span>THE CITY NEVER REALLY SLEEPS</span></footer>


    <Dialog open={passengerDetails !== null} onOpenChange={(open) => {if(!open){setPassengerDetails(null);setEjectArmed(false);}}}><DialogContent className="story-dialog passenger-detail-dialog">
      {detailRider && detailBrief && <><p className="dialog-kicker">PASSENGER NOTES</p><DialogHeader><DialogTitle>{PASSENGERS[detailRider.kind].name}</DialogTitle><DialogDescription>还剩 {detailBrief.distance} 站 · 耗电 {detailBrief.energy} /站{detailRider.fuse !== undefined ? ` · 炸弹倒计时 ${detailRider.fuse}` : ''}</DialogDescription></DialogHeader>
        <div className="passenger-detail-reward">基础车费：{detailBrief.coins === null ? '？封存中，到站揭晓' : `+${detailBrief.coins} 金币`}{detailBrief.tip ? ` · 升级小费 +${detailBrief.tip}` : ''}</div>
        {detailBrief.seated && <p className="detail-footnote">按当前站位到站：{detailBrief.expectedFare === null ? '？封存中，到站揭晓' : `+${detailBrief.expectedFare} 金币`}。包括倍率、联动和小费；下一站到站时包含本次工作进度。不含概率奖励；未来站位、躁动和进度变化会改变收益。</p>}
        {run.upgrades.tipjar>0&&<p className="detail-footnote">小费盒另算：到站时有至少2位邻座，35%概率再得4金币。上方车费不含这项概率奖励。</p>}
        {run.upgrades.meter>0&&<p className="detail-footnote">{UPGRADES.meter.description}</p>}
        <div className="passenger-detail-rules"><PassengerRuleBlocks rules={detailBrief.cardRules} locale={language} /><h3>补充说明</h3>{detailBrief.detailRules.map(rule=><p key={rule}>{rule}</p>)}</div>
        {canDismiss && <section className="dismiss-panel"><b>提前请离 · 赔偿 {penalty} 金币</b><p>不结算车费、暂存收益或到站舒缓。每十层最多请离2人，抵达商店恢复；不接候客不扣次数。赔偿 = 4 + 剩余站数 ×2。</p><p>本段请离剩余 {dismissalsRemaining(run)} 次{detailRider?.stash ? ` · 放弃暂存 ${detailRider.stash} 金币` : ''}</p>
          {ejectArmed && <p className="dismiss-confirm">确定让这位乘客在 {run.floor} 层下车？此操作不可撤回。</p>}
          <button className="dismiss-button" disabled={run.coins < penalty || dismissalsRemaining(run) === 0} onClick={()=>ejectArmed ? confirmDismiss() : setEjectArmed(true)}><UserMinus />{dismissalsRemaining(run) === 0 ? '本段请离次数已用完' : run.coins < penalty ? `金币不足 · 还差 ${penalty-run.coins}` : ejectArmed ? `确认请离 · 支付 ${penalty}` : '提前请离这位乘客'}</button>
        </section>}
        {detailOnboard && !canDismiss && <p className="detail-footnote">本层刚上车可直接点候客卡撤回；乘坐一站后才能付费请离。</p>}
        <Button className="story-primary" onClick={() => {setPassengerDetails(null);setEjectArmed(false);}}>返回安排</Button>
      </>}
    </DialogContent></Dialog>
    <Dialog open={inventoryOpen} onOpenChange={setInventoryOpen}><DialogContent className="story-dialog inventory-dialog">
      <p className="dialog-kicker">INSTALLED SYSTEMS · THIS SHIFT</p><DialogHeader><DialogTitle data-no-translate>{language==='zh'?'本班装备':'This shift’s kit'}</DialogTitle><DialogDescription data-no-translate>{upgradeCount ? (language==='zh'?`已安装 ${upgradeCount}/${UPGRADE_SLOTS} 项能力。`:`${upgradeCount}/${UPGRADE_SLOTS} abilities installed.`) : (language==='zh'?'还没有安装能力。':'No abilities installed yet.')}</DialogDescription></DialogHeader>
      <div className="inventory-summary" data-no-translate><span>{language==='zh'?'电量上限':'Power cap'} <b>{run.energyCap}</b></span><span>{language==='zh'?'躁动上限':'Agitation cap'} <b>{run.stressCap}</b></span>{BOX_LINES.map(line=><span key={line}>{language==='zh'?BOX_LINE_LABELS[line].name:({storage:'Storage',transformer:'Transformer',motor:'Motor'} as Record<BoxLine,string>)[line]} <b>{boxOf(run)[line]}/{BOX_MAX_LEVEL}</b></span>)}</div>
      {(run.keepsakes?.length??0)>0&&<p className="keepsake-row" data-no-translate>{language==='zh'?'信物：':'Keepsakes: '}{run.keepsakes!.map(k=><span key={k} className="keepsake-chip" title={keepsakeText(k,language)}>{keepsakeLabel(k,language)} · {keepsakeText(k,language)}</span>)}</p>}
      <div className="inventory-list">{(Object.keys(UPGRADES) as UpgradeKey[]).filter(key=>!RETIRED_UPGRADES.includes(key)&&run.upgrades[key]>0).map(key=><section key={key} className="installed"><div><span className="shop-icon inventory-icon" style={{backgroundImage:`url(${shopIcon(`ability-${key}`)})`}} aria-hidden="true" /><b>{UPGRADES[key].name}</b></div><p>{installedUpgradeSummary(run,key)}</p></section>)}</div>
      <Button className="story-primary" onClick={()=>setInventoryOpen(false)}>返回本班</Button>
    </DialogContent></Dialog>

    <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}><DialogContent className="story-dialog receipt-dialog">
      <p className="dialog-kicker">DECISION RECEIPT</p><DialogHeader><DialogTitle>这次，改变了什么？</DialogTitle><DialogDescription>{metricEvent?.label}。以下是实际变化，不是下一层预测。</DialogDescription></DialogHeader>
      <div className="receipt-sections">{Boolean(run.lastArrivals?.length)&&<section className="receipt-section"><h3>本层到站乘客</h3>{run.lastArrivals?.map(entry=><p key={entry.riderId}><span>{entry.slot+1}号位 · {PASSENGERS[entry.kind].name}</span><b>+{entry.coins} 金币</b></p>)}<p>个人收入含实际小费与个人升级奖励；整车奖励及扣款另计。</p></section>}{metricEvent?.changes.map((change) => <section key={change.key} className={`receipt-section pulse-${change.tone}`}>
        <h3><span>{change.label}</span><b>{change.before} → {change.after}<em>{signedDelta(change.delta)}</em></b></h3>
        {change.sources.map((source, index) => <p key={`${index}-${source.label}`}><span>{source.label}</span><b>{signedDelta(source.amount)}</b></p>)}
        {change.capDelta !== 0 && <p><span>{change.label}上限</span><b>{signedDelta(change.capDelta)}</b></p>}
      </section>)}</div>
    </DialogContent></Dialog>
    <Dialog open={intro} onOpenChange={setIntro}><DialogContent className="story-dialog intro-dialog" showCloseButton={false}><p className="dialog-kicker">TEMPORARY ASSIGNMENT · 00:17 AM</p><DialogHeader><DialogTitle>临时顶班。<br />这栋楼没有尽头。</DialogTitle><DialogDescription>今晚，你被临时派来这座古怪大楼开电梯。守住电量和躁动，安排每位乘客的位置。这里没有最后一层——活得越久，成绩越高。</DialogDescription></DialogHeader><p className="route-schedule">{motorScheduleText()}</p><div className="intro-rules"><span><b>01</b> 接客并安排站位</span><span><b>02</b> 守住电量与躁动</span><span><b>03</b> 尽可能生存下去</span></div><Button className="story-primary" onClick={() => setIntro(false)}>开始临时夜班 <ArrowUp /></Button><button className="story-link" onClick={() => { setIntro(false); setHelp(true); }}>先阅读值班手册</button>{!daily&&<button className="story-link" data-no-translate onClick={()=>switchMode(true)}>{language==='zh'?'或者：今天的每日班次（所有人同一套候客与商店）':'Or: today’s daily shift (everyone gets the same riders and shops)'}</button>}</DialogContent></Dialog>
    <Dialog open={help} onOpenChange={setHelp}><DialogContent className="story-dialog manual-dialog"><p className="dialog-kicker">ENDLESS SHIFT MANUAL</p><DialogHeader><DialogTitle>值班手册</DialogTitle><DialogDescription>这是一次没有终点的临时夜班。守住电量与躁动，活得越久，楼层成绩越高。</DialogDescription></DialogHeader><p className="route-schedule">{motorScheduleText()}</p><div className="manual-grid" data-no-translate>{MANUAL.map(([zhTitle,zhBody,enTitle,enBody])=><div key={zhTitle}><b>{language==='zh'?zhTitle:enTitle}</b><p>{language==='zh'?zhBody:enBody}</p></div>)}</div></DialogContent></Dialog>
    <Dialog open={pressureHelp} onOpenChange={setPressureHelp}><DialogContent className="story-dialog pressure-dialog"><p className="dialog-kicker">CABIN AGITATION</p><DialogHeader><DialogTitle>低、中、高：躁动是一种状态。</DialogTitle><DialogDescription>低0–2，中3–4，高5及以上；达到 {run.stressCap} 失控。人物按关门时的档位工作，躁动不兑换电量。虚线指针是下站预测，不是当前数值。</DialogDescription></DialogHeader><div className="pressure-rule-grid" data-no-translate>
      <section className="pressure-rise"><small>{language==='zh'?'会增加躁动':'Raises agitation'}</small>{PRESSURE_RISE.map(([zt,zb,et,eb])=><span key={zt}><b>{language==='zh'?zt:et}</b><p>{language==='zh'?zb:eb}</p></span>)}</section>
      <section className="pressure-relief"><small>{language==='zh'?'可以缓解 · 也有收益':'Relief · and upsides'}</small>{PRESSURE_RELIEF.map(([zt,zb,et,eb])=><span key={zt}><b>{language==='zh'?zt:et}</b><p>{language==='zh'?zb:eb}</p></span>)}</section>
    </div><div className="pressure-footer"><div className={`pressure-now forecast-${pressurePreview.tone}`}><small>按现在的站位</small><b>{pressurePreview.summary}</b></div><Button className="story-primary pressure-start-button" onClick={() => setPressureHelp(false)}>知道了</Button></div></DialogContent></Dialog>
    <Dialog open={archive} onOpenChange={setArchive}><DialogContent className="story-dialog archive-dialog"><p className="dialog-kicker">PASSENGER ARCHIVE</p><DialogHeader><DialogTitle>午夜乘客档案</DialogTitle><DialogDescription>{language==='zh'?`遇见过的乘客会录入档案；第一次把人送到站，就能读到他的故事。最高抵达 ${highest}F · 故事 ${storiesUnlocked.length}/${Object.keys(STORIES).length}。`:`Riders you meet join the archive; deliver someone once to read their story. Best floor ${highest}F · Stories ${storiesUnlocked.length}/${Object.keys(STORIES).length}.`}</DialogDescription></DialogHeader><div className="archive-grid">{PASSENGER_ORDER.map((kind) => { const open = discovered.includes(kind); const spec = PASSENGERS[kind]; return <div className={`archive-item ${open ? '' : 'locked'}`} key={kind}>{open ? <Portrait kind={kind} /> : <LockKeyhole />}<span><b>{open ? spec.name : '？？？'}</b>{open&&<small>{spec.short}</small>}{storiesUnlocked.includes(kind)&&<details className="archive-story" data-no-translate><summary>{language==='zh'?'读故事':'Read story'}</summary><p>{STORIES[kind][language==='zh'?0:1]}</p></details>}</span></div>; })}</div>
      <h3 className="archive-subhead" data-no-translate>{language==='zh'?`传奇乘客 · ${unlockedLegends.length}/${LEGEND_KINDS.length}`:`Legends · ${unlockedLegends.length}/${LEGEND_KINDS.length}`}</h3>
      <div className="archive-grid" data-no-translate>{LEGEND_KINDS.map(kind=>{const open=unlockedLegends.includes(kind);return <div className={`archive-item ${open?'':'locked'}`} key={kind}>{open?<Portrait kind={kind}/>:<LockKeyhole/>}<span><b>{open?riderName(kind,language):(language==='zh'?'未解锁':'Locked')}</b><small>{open?`${language==='zh'?'信物：':'Keepsake: '}${keepsakeName(kind,language)}`:(language==='zh'?LEGEND_UNLOCK_HINTS[kind][0]:LEGEND_UNLOCK_HINTS[kind][1])}</small>{storiesUnlocked.includes(kind)&&<details className="archive-story"><summary>{language==='zh'?'读故事':'Read story'}</summary><p>{STORIES[kind][language==='zh'?0:1]}</p></details>}</span></div>;})}</div>
    </DialogContent></Dialog>
    <Dialog open={changelogOpen} onOpenChange={setChangelogOpen}><DialogContent className="story-dialog changelog-dialog"><p className="dialog-kicker">SHIFT REVISION ARCHIVE</p><DialogHeader><DialogTitle>版本 v{GAME_VERSION}</DialogTitle><DialogDescription>每次更新都记录玩法变化、数值依据、测试结论与仍需观察的问题。</DialogDescription></DialogHeader><div className="changelog-list">{(language === 'en' ? CHANGELOG_EN : CHANGELOG).map((entry,index)=><article className={index===0?'current-release':''} key={entry.version}><header><div><span>VERSION {entry.version}</span><h3>{entry.title}</h3></div><time>{entry.date}</time></header><p>{entry.summary}</p><div className="changelog-columns changelog-player"><section><b>改进</b><ul>{entry.changes.map(item=><li key={item}>{item}</li>)}</ul></section></div><details className="changelog-dev"><summary>开发记录 · 试验与观察</summary><div className="changelog-columns"><section><b>试验与结论</b><ul>{entry.experiments.map(item=><li key={item}>{item}</li>)}</ul></section><section><b>继续观察</b><ul>{entry.watch.map(item=><li key={item}>{item}</li>)}</ul></section></div></details></article>)}</div></DialogContent></Dialog>
    <Dialog open={run.status === 'upgrade' && doors === 'open'}><DialogContent className={`story-dialog upgrade-dialog ${upgradeCrisis ? 'upgrade-crisis' : ''}`} showCloseButton={false}>
      <div className="shop-resources">
        <div className={`shop-power ${run.energy <= 0 ? 'shop-power-empty' : ''}`} aria-live="polite" aria-atomic="true">
          <span className="shop-resource-label"><BatteryCharging aria-hidden="true"/>{language === 'zh' ? '剩余电量' : 'Power left'}</span>
          <div className="shop-power-value"><b>{run.energy}</b><span>/{run.energyCap}</span></div>
        </div>
        <div className="shop-wallet"><span aria-label={`可用金币 ${run.coins}`}><Coins aria-hidden="true" /><span className="shop-balance-label">金币</span><b><RegisterNumber value={run.coins} /></b></span><span>收入 {run.earned} · 支出 {run.earned - run.coins}</span></div>
      </div>
      <div className="shop-scroll-body">
      <DialogHeader className="shop-head"><p className="dialog-kicker" data-no-translate>FLOOR {run.floor} · SHOP{districtFor(run.floor+1).from===run.floor+1?` · ${language==='zh'?'前方':'Ahead'}: ${districtFor(run.floor+1).name[language==='zh'?0:1]}`:''}</p><DialogTitle>{upgradeCrisis ? '商店 · 紧急维修' : '商店'}</DialogTitle><DialogDescription className="sr-only">{language==='zh'?'选能力、升级配电箱、充电，然后继续上行。':'Pick an ability, upgrade the power box, charge, then ascend.'}</DialogDescription></DialogHeader>
      {upgradeCrisis && <p className="shop-warning">{upgradeCrisis === 'both' ? '电量与躁动同时失控：底部最低抢救可恢复1电，并将躁动降至上限以下1点。' : upgradeCrisis === 'energy' ? '电量已耗尽：使用下方充电服务，将电量恢复到 0 以上才能继续。' : '躁动失控：底部最低抢救每点8金币，只降至上限以下1点，不可继续购买舒缓。'} 若无力修复，本班将在这里结束。</p>}
      <div className="shop-step-head" data-no-translate><h3><i>1</i>{language==='zh'?(run.shopUpgradeBought?`加购 1 项 · ${SHOP_PRICES.extraAbility} 金币（可跳过）`:'选 1 项能力 · 免费'):(run.shopUpgradeBought?`Buy 1 more · ${SHOP_PRICES.extraAbility} coins (optional)`:'Pick 1 ability · free')}</h3><span>
        {!run.shopUpgradeBought&&availableShopCards(run).length>0&&run.rerolledFloor!==run.floor&&<button className="shop-reroll" disabled={run.coins<REROLL_PRICE} onClick={()=>{const next=rerollShop(run, rngOf('shop', run.floor));if(next!==run){reportMetrics(run,next,language==='zh'?'重抽能力':'Reroll abilities');setRun(next);playTone(sound,'select');}}}><RotateCcw aria-hidden="true" />{language==='zh'?`重抽 · ${REROLL_PRICE}币`:`Reroll · ${REROLL_PRICE}c`}</button>}
        <button className="shop-inventory-link" onClick={()=>setInventoryOpen(true)}><Layers />{language==='zh'?`已装 ${upgradeCount}/${UPGRADE_SLOTS}`:`Installed ${upgradeCount}/${UPGRADE_SLOTS}`}</button></span></div>
      {!availableShopCards(run).length&&<p className="shop-receipt" role="status">{upgradeCount >= UPGRADE_SLOTS ? '六个安装位已满。本班保留当前能力，维修服务仍然可用。' : run.shopExtraBought?'本店已选取并加购能力，下次商店再选。':'本店没有未安装的能力可选。维修服务仍然可用。'}</p>}
      {(run.keepsakes?.length??0)>0&&<p className="keepsake-row" data-no-translate>{language==='zh'?'信物：':'Keepsakes: '}{run.keepsakes!.map(k=><span key={k} className="keepsake-chip" title={keepsakeText(k,language)}>{keepsakeLabel(k,language)}</span>)}</p>}
      <div className="shop-choice-row"><div className="upgrade-grid">{availableShopCards(run).map((card) => { const key = card.key; const affordable = run.coins >= card.price; const rescue = rescuesCrisis(key, run); const warning = card.price > 0 ? purchaseRepairWarning(run,key,card.price) : null; return <button key={key} className={rescue ? 'crisis-rescue' : ''} disabled={!affordable} onClick={() => chooseUpgrade(key)} aria-label={`${UPGRADES[key].name}，${card.price === 0 ? '免费选取' : `加购 ${card.price} 金币`}${!affordable ? '，金币不足' : ''}`}>
        <span className="shop-item-head"><span className="shop-icon" style={{backgroundImage:`url(${shopIcon(`ability-${key}`)})`}} aria-hidden="true" /><b>{UPGRADES[key].name}</b></span><p>{UPGRADES[key].description}</p>{IMPACT_KEYS.includes(key)&&<em>{upgradeImpact(key, run)}</em>}{warning && <span className="reserve-warning">{warning === 'crisis' ? '购买后不足以修复当前失控' : '购买后无法补至参考电量；参考线不是离店要求'}</span>}<span className="shop-price" data-no-translate>{card.price===0?<><Check aria-hidden="true" /><strong>{language==='zh'?'免费选取':'Free pick'}</strong></>:<><Coins aria-hidden="true" /><strong>{card.price}</strong><span>{affordable ? (language==='zh'?'加购':'Buy extra') : (language==='zh'?`还差 ${card.price - run.coins}`:`Need ${card.price - run.coins}`)}</span></>}</span>
      </button>; })}{!availableShopCards(run).length&&<section className="shop-installed-summary" role="status">
        <h3>{language==='zh'?(run.shopUpgradeBought?'本店选购完成':'已安装能力'):(run.shopUpgradeBought?'Upgrade installed':'Installed upgrades')}</h3>
        <p>{language==='zh'?'本班能力保留生效，仍可充电后离店。':'Your upgrades remain active. You can still charge before leaving.'}</p>
        <ul>{(Object.keys(UPGRADES) as UpgradeKey[]).filter(key=>run.upgrades[key]>0).map(key=><li key={key}><Check aria-hidden="true"/><span>{translateGameText(UPGRADES[key].name,language)}</span></li>)}</ul>
      </section>}</div>
      <div className="shop-service-column"><section className="recharge-panel box-panel">
        <div className="shop-step-head"><h3><i>2</i>{language==='zh'?`配电箱 · 升 1 级（可跳过）`:`Power box · 1 level (optional)`}</h3><span>{(run.freeBoxLevels??0)>0?(language==='zh'?'扳手：本次免费':'Wrench: free'):`${boxTotal(boxOf(run))}/${BOX_TOTAL_CAP}`}</span></div>
        {BOX_LINES.map((line:BoxLine)=>{const level=boxOf(run)[line];const price=boxLevelPrice(run,line);const can=canBuyBoxLevel(run,line);return <div key={line} className="box-line">
          <span className="box-line-name"><span className="shop-icon box-icon" style={{backgroundImage:`url(${shopIcon(`box-${line}`)})`}} aria-hidden="true" />{BOX_LINE_LABELS[line].name}<i className="box-pips" aria-label={`${level}/${BOX_MAX_LEVEL}`}>{Array.from({length:BOX_MAX_LEVEL},(_,i)=><b key={i} className={i<level?'on':''} />)}</i></span>
          <span className="box-line-next">{level<BOX_MAX_LEVEL?BOX_LINE_LABELS[line].levels[level]:(language==='zh'?'已满级':'Maxed')}</span>
          <button disabled={!can} onClick={()=>{const next=buyBoxLevel(run,line);if(next!==run){setLeaveArmed(false);reportMetrics(run,next,language==='zh'?'配电箱升级':'Power box upgrade');setRun(next);playTone(sound,'upgrade');}}}>{level>=BOX_MAX_LEVEL?(language==='zh'?'满级':'Max'):price===0?(language==='zh'?'免费升级':'Free'):`${price} ${language==='zh'?'金币':'coins'}`}</button>
        </div>;})}
      </section><section className="recharge-panel charge-slider-panel">
        <div className="shop-step-head"><h3><i>3</i>{language==='zh'?'充电至':'Charge to'} <output>{chargeTarget}/{run.energyCap}</output></h3><span>{chargeUnitPrice(boxOf(run))}{language==='zh'?' 币/电':' c/power'}</span></div>
        <p className={`sector-need ${need.total>chargeTarget?'is-short':''}`} data-no-translate>{language==='zh'?`${need.from}–${need.to} 层约需 ${need.total} 电`:`Floors ${need.from}–${need.to}: about ${need.total} power`}<small title={language==='zh'?`运转 ${need.motor}＋乘客约 ${need.riders}（按每层 ${SECTOR_NEED_RIDERS} 人）`:`Motor ${need.motor} + riders ~${need.riders} (${SECTOR_NEED_RIDERS} per floor)`}>{language==='zh'?`（运转 ${need.motor}＋乘客约 ${need.riders}）`:` (motor ${need.motor} + riders ~${need.riders})`}</small>{need.total>chargeTarget?(language==='zh'?` · 还差 ${need.total-chargeTarget}，途中要补电`:` · ${need.total-chargeTarget} short: charge on the way`):''}</p>
        <label className="charge-control"><span className="sr-only">{language==='zh'?'充电目标':'Charge target'}</span><Slider className="charge-slider" min={Math.min(run.energy,run.energyCap)} max={run.energyCap} step={1} value={[chargeTarget]} disabled={run.energy>=run.energyCap} onValueChange={value=>setChargeChoice({context:chargeContext,target:Array.isArray(value)?value[0]:value})}/></label>
        <div className="charge-scale"><span>{language==='zh'?'当前':'Now'} {run.energy}</span><span>{run.energyCap}</span></div>
        <button className="charge-confirm" disabled={!chargeUnits||run.coins<chargeCost} onClick={()=>recharge(chargeUnits)}>{language==='zh'?`充入 ${chargeUnits} 电 · ${chargeCost} 金币`:`Add ${chargeUnits} power · ${chargeCost} coins`}</button>
        <p aria-live="polite">{language==='zh'?(chargeCost>run.coins?`还差 ${chargeCost-run.coins} 金币；拖低目标即可少充。`:`充电后剩余 ${run.coins-chargeCost} 金币。`):(chargeCost>run.coins?`Need ${chargeCost-run.coins} more coins; lower the target to buy less.`:`${run.coins-chargeCost} coins left after charging.`)}</p>
      </section>
      {run.calmCharge&&<button className="reserve-use" disabled={run.stress<=0} onClick={()=>{const next=applyCalmCharge(run);setRun(next);reportMetrics(run,next,'手动调节');}}>{language==='zh'?'手动调节 −3躁动 · 每店补满':'Manual relief −3 · refills at shops'}</button>}

      </div></div>
      {metricEvent && <p className="shop-receipt" aria-live="polite">{metricEvent.label}{metricEvent.changes.map((change) => ` · ${change.label} ${signedDelta(change.delta)}${change.capDelta ? `（上限 ${signedDelta(change.capDelta)}）` : ''}`).join('')}</p>}
      </div>
      <div className="shop-footer">{leaveArmed && !upgradeCrisis && <p className="shop-warning">电量不够跑完下一段的运转；途中补电每十层有上限。再点一次确认离开。</p>}<Button className="story-primary" onClick={finishShopping}>{upgradeCrisis ? emergencyRepairPlan(run).affordable ? `最低抢救 · ${emergencyRepairPlan(run).cost} 金币` : leaveArmed ? '确认结束本班' : '无法支付抢救费 · 结束本班' : leaveArmed ? '确认冒险离开' : '继续上行'}<ArrowUp /></Button></div>
    </DialogContent></Dialog>
    <Dialog open={run.status === 'lost' && doors === 'open'}><DialogContent className="story-dialog result-dialog failure-dialog compact-result" showCloseButton={false}>
      <p className="dialog-kicker">{language==='zh'?'本班结束':'SHIFT ENDED'}</p>
      <DialogHeader><DialogTitle>{run.floor}<small>{language==='zh'?'层':'F'}</small></DialogTitle><DialogDescription className="failure-cause">{run.message.includes('炸弹倒计时') ? '炸弹倒计时归零' : run.energy<=0 && run.stress>=run.stressCap ? '电量耗尽 · 躁动失控' : run.energy<=0 ? '电量耗尽' : '躁动失控'}</DialogDescription></DialogHeader>
      <p className="compact-record">{run.floor>runStartBest ? (language==='zh'?'新纪录': 'NEW BEST') : (language==='zh'?`最高纪录 ${bestFloor} 层`:`Best: floor ${bestFloor}`)}</p>
      {daily&&<p className="compact-record" data-no-translate>{language==='zh'?`每日班次 ${daily.key} · 今日最佳 ${Math.max(dailyBest,run.floor)} 层`:`Daily shift ${daily.key} · today's best ${Math.max(dailyBest,run.floor)}F`}</p>}
      {newLegends.length>0&&<p className="compact-record legend-unlock" data-no-translate>{language==='zh'?`新传奇加入：${newLegends.map(k=>riderName(k,'zh')).join('、')}`:`New legends: ${newLegends.map(k=>riderName(k,'en')).join(', ')}`}</p>}
      <Button className="story-primary" onClick={reset}><RotateCcw />{language==='zh'?'再来一局':'Play again'}</Button>
      <details className="result-details"><summary>{language==='zh'?'本局详情':'Run details'}</summary><p>{resultChallenge}</p><dl>
        <div><dt>{language==='zh'?'收入 / 支出':'Earned / spent'}</dt><dd>{run.earned} / {run.earned-run.coins}</dd></div>
        <div><dt>{language==='zh'?'剩余金币':'Coins left'}</dt><dd>{run.coins}</dd></div>
        <div><dt>{language==='zh'?'已装升级':'Upgrades'}</dt><dd>{upgradeCount}</dd></div>
      </dl></details>
      <div className="result-share" data-no-translate>
        <button onClick={()=>copyText(shareLine(),'share')}>{copied==='share'?(language==='zh'?'已复制战绩':'Result copied'):(language==='zh'?'复制战绩':'Copy result')}</button>
        <button onClick={()=>copyText(runRecordJson(),'record')}>{copied==='record'?(language==='zh'?'已复制本局记录':'Run record copied'):(language==='zh'?'复制本局记录（试玩反馈用）':'Copy run record (for playtest feedback)')}</button>
        <button onClick={()=>switchMode(!daily)}>{daily?(language==='zh'?'回到普通夜班':'Back to the endless shift'):(language==='zh'?'试试今天的每日班次':'Try today’s daily shift')}</button>
      </div>
      {copied?.startsWith('manual:')&&<textarea className="copy-fallback" readOnly value={copied.slice(7)} onFocus={e=>e.currentTarget.select()} aria-label={language==='zh'?'手动复制':'Copy manually'} />}
      <button className="story-link" onClick={() => setArchive(true)}><BookOpen /> 查看乘客档案</button>
    </DialogContent></Dialog>
  </main>;
  return localizeTree(content, language);
}
