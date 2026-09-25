'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { AlarmClock, ChevronsUp, ArrowUp, Layers, Package, PackageCheck, Pill, ShieldCheck, UserMinus, BatteryCharging, BookOpen, Check, Coins, Flame, HelpCircle, History, Info, LockKeyhole, Music2, RotateCcw, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ADJACENT, PASSENGER_ORDER, PASSENGERS, UPGRADES, isAnyLegend, isDarkLegend, isLegend, riderCardGrade, passengerCategory, type PassengerKind, type UpgradeKey } from '@/lib/game-data';
import { cardSummary, displayName, riderName, type CardChip } from '@/lib/card-summary';
import { KEEPSAKES_SEEN_KEY, LEGEND_UNLOCKS_KEY, drawLegend, LEGEND_UNLOCK_HINTS, loadKeepsakesSeen, loadUnlockedLegends, nextUnlocks, saveList } from '@/lib/legend-unlocks';
import { DARK_LEGEND_RULES, KEEPSAKES, type KeepsakeKey } from '@/lib/legends';
import { districtFor } from '@/lib/districts';
import { STORIES, STORIES_KEY } from '@/lib/stories';
import { dailyKey, dailySeed, stream } from '@/lib/seeded';
import { LEGEND_STARTERS } from '@/lib/legends';
import { DARK_LEGEND_KINDS, DARK_OF, LEGEND_KINDS, isDark, type DarkLegendKind, type LegendKind } from '@/lib/game-data';
import { SOOTHE_PRICE, abyssEventAt, affordableChargingPlan, availableShopCards, buyMarketItem, outburstChanceAt, emergencyRepairPlan, repairEmergency, dismissalsRemaining, energyBreakdown, purchaseRepairWarning } from '@/lib/game-engine';
import { HIGH_RISK_BONUS, greenLinks, outburstSlots, travelEnergyCost, eventPressureMultiplier, riderAgitation, shiftOutlook, cooperationRelief, chargeBattery, chargingPlan, cooperationBonus, dismissalCost, dismissRider, installedUpgradeSummary, agitationThreshold, difficultyTier, failureLesson, hasNeighbour, initialRun, installUpgrade, leaveShop, neighbourCount, nextShopFloor, previewUpgrade, readyPartner, resolveFloor, touristCompanionCount, type Rider, type RunState, type UpgradeCrisis } from '@/lib/game-engine';
import { energyForecast, sectorForecast, shopAgitationRoom, stressForecast } from '@/lib/game-forecast';
import { BOMB_RULES, bombSeconds, bombTick, tickBombs, pickpocketFrom, stealLink, isBigParcel, canReplaceWithBoxAbility, resolveBoxAbility, neighbours, parcelBeside, parcelLinks, thiefEyesParcel, unseatRider, boxIdOf, RETIRED_UPGRADES, SELL_REFUND, canSellUpgrade, sellUpgrade, calmPrice, buyCalm, overtimeCalmPrice, buyOvertimeCalm, calmAllowance, emergencyAllowance, emergencySectorLeft, emergencyCharge, boxOf, buyBoxLevel, canBuyBoxLevel, boxLevelPrice, boxTotalCap, BOX_LADDER, rerollShop, REROLL_PRICE, SHOP_PRICES } from '@/lib/game-engine';
import { emergencyUnitPrice, BOX_LINES, BOX_LINE_LABELS, BOX_MAX_LEVEL, boxTotal, chargeCost as boxChargeCost, chargeUnitPrice, EARLY_CHARGE, affordableUnits, type BoxLine } from '@/lib/power-box';
import { activeConnection, copyConnection, planPlacement, type PlacementResult } from '@/lib/game-interaction';
import * as QA_ENGINE from '@/lib/game-engine';
import { disposeGameAudio, playGameSound as playTone, playMetricSounds } from '@/lib/game-audio';
import { disposeGameMusic, musicSceneForView, setGameMusic, unlockGameMusic } from '@/lib/game-music';
import { bondStatus, conflictLinks, type ConflictEffect } from '@/lib/rider-profile';
import { frankBombSrc, portraitAsset, riderPortraitSrc, shopIcon } from '@/lib/passenger-assets';
import { addDiscoveredPassengers, sanitizeDiscoveredPassengers } from '@/lib/passenger-discovery';
import { passengerBrief, SHARED_SAVING_RULE, type PassengerRuleBlock } from '@/lib/passenger-presentation';
import { metricChanges, type MetricChange, type MetricKey } from '@/lib/metric-feedback';
import { CHANGELOG, CHANGELOG_EN, GAME_VERSION } from '@/lib/changelog';
import { localizeTree, translateGameText, type GameLocale } from '@/lib/i18n';
import { UPGRADE_SLOTS, riskPartnerships } from '@/lib/shift-rules';
import { LEVEL2_TEXT, boosted, flywheelAllowance, SHOP_TUNING } from '@/lib/shop-effects';
import { boardNet, netIncludesAgitation, pairedNet } from '@/lib/net-value';
import { chance, disposeSfx, playSfx, preloadSfx, randomPitch } from '@/lib/game-sfx';
import { motion, useReducedMotion } from 'motion/react';
import { CardShader } from '@/components/card-shader';
import { fuseState } from '@/lib/bomb-state';
import { beginPointerDrag } from '@/components/pointer-drag';
import { banner, bubble, burstAt, clearJuice, explode, flashClass, flyCoin, flyPortrait, openBoxFx, popText } from '@/components/juice';
import { BombTimer } from '@/components/bomb-timer';
import { Scramble } from '@/components/scramble';
import { quip } from '@/lib/quips';
import { calmRescuePlan, departureRisk, rescuePlan, sectorNeed, SECTOR_NEED_RIDERS } from '@/lib/departure-guard';
import { offerReveal } from '@/lib/offer-reveal';
import { shouldPreviewConnection } from '@/lib/connection-preview';
import { AgitationGauge } from '@/components/agitation-gauge';
import { PowerGauge, RegisterNumber } from '@/components/power-gauge';
import { cooperationLabel } from '@/lib/cooperation-label';
import { V9_AGITATION, agitationBand, musicBeatForAgitation, motorAdvanceNotice, motorScheduleText, nightUnrest, nightUnrestText, REPAIR_WORK, INSPECTION_WORK, INSPECTION_BONUS, CHILD_CARE_WORK, RESERVE_CELL_CHARGE } from '@/lib/balance-v832';
import { GHOST_CONTROL_KINDS, buyOvertimeCharge, overtimeChargeOffer, abilityLevel2Price, canRaiseAbility, raiseAbility, bombLocked, buyItem, itemUsable, thiefHeld, applyItem } from '@/lib/game-engine';
import { ABYSS_EVENTS, type AbyssEventKind, DARK_RULES, ITEMS, ITEM_SLOTS, MYSTERY_CLUES, MYSTERY_RULES, abyssStep, abyssTier, outburstChance, outburstIsPower, mysteryClue, corruptible, isBombKind, isCarrierKind, isSurvivor, type ItemKey } from '@/lib/dark-rules';
import { consumeReserveCell, dispatchRemaining, nextOfferBatch, retimeRider, oldMovesRemaining, reserveOffer, applyCalmCharge, startRun } from '@/lib/game-engine';

type DragPayload = { type: 'offer'; id: string } | { type: 'slot'; slot: number };
type Feedback = { id: number; tone: 'place' | 'combo' | 'error' | 'arrival'; label: string; slots: number[]; coins?: number; energy?: number; pressure?: number };
const DISCOVERED_PASSENGERS_KEY = 'elevator-tales-discovered-passengers-v1';
const MUSIC_PREFERENCE_KEY = 'elevator-tales-music-enabled-v1';
const SOUND_PREFERENCE_KEY = 'elevator-tales-sound-enabled-v1';
function scrollMobileTarget(selector:string,block:ScrollLogicalPosition='nearest') {
  if(!window.matchMedia('(max-width:700px)').matches)return;
  document.querySelector(selector)?.scrollIntoView({block,behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
}

/** v9.9.2 card feel: the foil's light follows the pointer (pure DOM, no React state; no 3D tilt, which flashed black). */
function tiltCard(event: ReactPointerEvent<HTMLElement>) {
  if (event.pointerType !== 'mouse') return;
  const el = event.currentTarget, r = el.getBoundingClientRect(), x = (event.clientX - r.left) / r.width, y = (event.clientY - r.top) / r.height;
  el.style.setProperty('--mx', x.toFixed(3)); el.style.setProperty('--my', y.toFixed(3));
}
function untiltCard(event: ReactPointerEvent<HTMLElement>) {
  const el = event.currentTarget; el.style.removeProperty('--mx'); el.style.removeProperty('--my');
}

/** v9.8 end screen: the floor reached counts up with a soft tick. */
function CountUp({ value, sound }: { value: number; sound: boolean }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { const f = requestAnimationFrame(() => setShown(value)); return () => cancelAnimationFrame(f); }
    const start = performance.now(), duration = Math.min(1400, 500 + value * 12); let last = -1, frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration), next = Math.round(value * (1 - (1 - t) ** 3));
      if (next !== last && next % Math.max(1, Math.round(value / 18)) === 0) playSfx(sound, 'tick', { pitch: Math.min(12, next / Math.max(1, value) * 12) });
      last = next; setShown(next); if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [value, sound]);
  return <>{shown}</>;
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

// Language-neutral: a bare '不变' leaked into English in composed labels.
const signedDelta = (value: number) => value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '±0';
const compactDelta = (value: number) => value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '0';
const conflictGlyph=(effect:ConflictEffect)=>({agitation:'🔥 +1',energy:'⚡ +1',coins:'−2金币',overload:'⚡ ×2',gamble:'⚡×2 · 基价+100%'}[effect]);
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

function Portrait({ kind, large = false, rider }: { kind: PassengerKind; large?: boolean; rider?: Rider }) {
  const asset = portraitAsset(kind); const x = asset.cell % asset.columns; const y = Math.floor(asset.cell / asset.columns);
  // v9.17: box tiers and the disguised Bomber have their own art; a seated two-part box shows its upper or lower half.
  const src = rider ? riderPortraitSrc(rider) : asset.src, half = rider?.kind === 'parcel' && large ? rider.big : undefined;
  return <span className={`portrait-window ${large ? 'portrait-large' : ''} ${isLegend(kind) ? 'portrait-legend-art' : isDarkLegend(kind) ? 'portrait-legend-art portrait-dark-legend' : ''} ${half ? `portrait-half portrait-half-${half}` : ''}`} aria-hidden="true"><span className="portrait-sheet" style={{ backgroundImage: `url(${src})`, backgroundSize: half ? '100% 200%' : `${asset.columns * 100}% ${asset.rows * 100}%`, backgroundPosition: half ? `50% ${half === 'top' ? 0 : 100}%` : `${asset.columns > 1 ? x * 100 / (asset.columns - 1) : 50}% ${asset.rows > 1 ? y * 100 / (asset.rows - 1) : 50}%` }} /></span>;
}

/** v9.19.1: “2 stops” / “1 stop” as one string, so English gets the singular right. */
const stopsLeft = (n: number, locale: string) => locale === 'zh' ? `还剩 ${n} 站` : `${n} ${n === 1 ? 'stop' : 'stops'}`;
const KEEPSAKE_EN: Record<KeepsakeKey, [string, string]> = {
  wrench: ['Old Zhou’s Wrench', 'One free power-box level; every later level costs 5 coins less.'],
  redString: ['Red String', 'Each bond pays +2 on arrival; unpaired Lovers call a partner 35% of the time.'],
  pocketWatch: ['Pocket Watch', 'Criminal links bank 1 more coin per floor; their agitation is capped at 1 per floor.'],
  roundsLog: ['Rounds Log', 'Agitation cap +2; −3 agitation at every shop; +1 per arrival after calm departures.'],
  vinyl: ['Vinyl Record', 'Musicians appear early (no need to wait for floor 16); at medium agitation Musicians earn +2 and each arrival tips +2.'],
  bell: ['Spirit Bell', 'Ghosts always count as controlled and pay +5 in total on arrival.'],
  stock: ['Share Certificate', 'At each shop, unspent coins earn 15% interest, up to +12.'],
};
/** v9.20: set once the player has found the hidden dark resonance (the archive then lists it). */
const RESONANCE_KEY = 'elevator-tales-resonance-v1';
/** v9.20.2: the ascend button asks for a second press when an abyss floor has at least this chance to end the run
 * (at 5% it asked on about half of all abyss floors; the boil-over chip on the rail shows any chance from 1%). */
const GAMBLE_WARN = 0.2;
/** v9.20: what each dark legend leaves on reaching the 70F shop (the card's last line). */
const DARK_LEGEND_REWARD: Record<DarkLegendKind, [string, string]> = {
  nightoperator: [`一级免费配电箱升级`, `a free power-box level`],
  severer: [`+${DARK_LEGEND_RULES.severerPay} 金币`, `+${DARK_LEGEND_RULES.severerPay} coins`],
  kingpin: ['兑现他的暂存', 'his bank, paid out'],
  coldmatron: [`躁动上限永久 +${DARK_LEGEND_RULES.coldMatronCap}`, `agitation cap +${DARK_LEGEND_RULES.coldMatronCap} for good`],
  banshee: [`+${DARK_LEGEND_RULES.bansheePay} 金币`, `+${DARK_LEGEND_RULES.bansheePay} coins`],
  necromancer: [`+${DARK_LEGEND_RULES.necromancerPay} 金币`, `+${DARK_LEGEND_RULES.necromancerPay} coins`],
  highroller: [`到站那层关门时每点躁动 +${DARK_LEGEND_RULES.highRollerPerPoint} 金币`, `${DARK_LEGEND_RULES.highRollerPerPoint} coins per agitation point when the doors close before his stop`],
  otherthirteen: [`随机 0–${DARK_LEGEND_RULES.thirteenPayMax} 金币`, `0–${DARK_LEGEND_RULES.thirteenPayMax} coins at random`],
};
const resonanceFound = () => { try { return localStorage.getItem(RESONANCE_KEY) === '1'; } catch { return false; } };
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

// v9.21 the eve of the abyss: names and one-line rules of the four events announced at the 80F shop.
const ABYSS_EVENT_TEXT: Record<AbyssEventKind, { zh: [string, string]; en: [string, string] }> = {
  hush: { zh: ['静夜', '从这一层出发时，暗黑版都不惹麻烦'], en: ['Hush', 'No dark rider causes trouble on the ascent from this floor'] },
  surge: { zh: ['暗涌', `从这一层出发时，发作几率 ×${ABYSS_EVENTS.surgeMultiplier}`], en: ['Surge', `Outburst odds ×${ABYSS_EVENTS.surgeMultiplier} on the ascent from this floor`] },
  bounty: { zh: ['悬赏', `这一层有一位候客带着悬赏，送到多给 ${ABYSS_EVENTS.bountyCoins} 币`], en: ['Bounty', `One rider waiting here carries a bounty worth ${ABYSS_EVENTS.bountyCoins} more coins on arrival`] },
  market: { zh: ['夜市', '门外有个摊位，按商店价卖道具'], en: ['Night market', 'A stall outside the doors sells items at shop prices'] },
};
const abyssEventName = (kind: AbyssEventKind, locale: GameLocale) => ABYSS_EVENT_TEXT[kind][locale === 'zh' ? 'zh' : 'en'][0];
const abyssEventRule = (kind: AbyssEventKind, locale: GameLocale) => ABYSS_EVENT_TEXT[kind][locale === 'zh' ? 'zh' : 'en'][1];

// Compact card: name row, three numbers, one ability line, relation chips. Full rules live in the sheet.
export function PassengerCardFace({ rider, run, action, locale }: { rider: Rider; run: RunState; action?: string; locale: GameLocale }) {
  const brief=passengerBrief(rider,run.floor,run.cabin,cooperationBonus(run),cooperationRelief(run),eventPressureMultiplier(run),run.stress);
  const summary=cardSummary(rider,run,locale);
  const zh=locale==='zh';
  const legend=isAnyLegend(rider.kind), darkLegend=isDarkLegend(rider.kind);
  // v9.17.2: a box's contents stay hidden until it opens, so its card shows no value estimate.
  const board=rider.kind==='parcel'?null:boardNet(rider,run); const net=board?.value ?? null; const paired=pairedNet(rider,run);
  return <span className="unified-passenger-summary compact-card" data-no-translate>
    <span className="cc-head"><Portrait kind={rider.kind} rider={rider}/><span className="cc-title"><strong>{displayName(rider,locale)}<span className={`card-gem gem-${riderCardGrade(rider)}`} title={({standard:zh?'普通':'Common',fine:zh?'精良':'Fine',rare:zh?'稀有':'Rare',legendary:zh?'传奇':'Legendary'} as Record<string,string>)[riderCardGrade(rider)]} aria-hidden="true" /></strong><span className="cc-sub">
      <span className="cc-trip">{zh?`${brief.distance} 站`:`${brief.distance} ${brief.distance===1?'stop':'stops'}`}</span>
      {legend&&<span className={`cc-tag cc-tag-legend ${darkLegend?'cc-tag-dark-legend':''}`}>{darkLegend?(zh?'暗黑传奇':'Dark legend'):(zh?'传奇':'Legend')}</span>}
      {isDark(rider.kind)&&outburstChanceAt(run)>0&&<span className="cc-tag cc-tag-outburst" title={zh?`深渊里的暗黑版越来越极端：每层有 ${Math.round(outburstChanceAt(run)*100)}% 的机会发作（${outburstIsPower(rider.kind)?`吸走 ${DARK_RULES.outburstPower} 电`:`+${DARK_RULES.outburstAgitation} 躁动`}）；深渊里上车的暗黑版车费更高。照明弹、镇静剂能压住。`:`Deep in the abyss dark riders grow extreme: each floor a ${Math.round(outburstChanceAt(run)*100)}% chance to lash out (${outburstIsPower(rider.kind)?`draining ${DARK_RULES.outburstPower} power`:`+${DARK_RULES.outburstAgitation} agitation`}); dark cards drawn in the abyss pay more. A Flare or a Sedative holds it off.`}>{zh?`发作 ${Math.round(outburstChanceAt(run)*100)}% · ${outburstIsPower(rider.kind)?`−${DARK_RULES.outburstPower}电`:`+${DARK_RULES.outburstAgitation}躁`}`:`Lashes out ${Math.round(outburstChanceAt(run)*100)}% · ${outburstIsPower(rider.kind)?`−${DARK_RULES.outburstPower} power`:`+${DARK_RULES.outburstAgitation} agit.`}`}</span>}
      {Boolean(rider.bounty)&&<span className="cc-tag cc-tag-bounty" title={abyssEventRule('bounty',locale)}>{zh?`悬赏 +${rider.bounty}`:`Bounty +${rider.bounty}`}</span>}
      {rider.volatile&&<span className="cc-tag cc-tag-risk" title={zh?`急躁的乘客：车费多 ${HIGH_RISK_BONUS}，但在车上每层 +1 躁动；护士相邻可以抵消`:`Impatient rider: fare +${HIGH_RISK_BONUS}, but +1 agitation per floor aboard; an adjacent Nurse offsets it`}><Flame aria-hidden="true" />{zh?`急躁：车费+${HIGH_RISK_BONUS}，躁动+1/层`:`Impatient: fare +${HIGH_RISK_BONUS}, +1/floor`}</span>}
      {rider.localFareRatio&&<span className="cc-tag">{zh?'短途':'Local'}</span>}
    </span></span></span>
    {legend ? <span className="cc-values cc-legend-values"><span>{rider.kind==='coldmatron'?(zh?'不付车费':'No fare'):(zh?'不付车费 · 不耗电':'No fare · no power')}</span></span> : <span className="cc-values">
      <b className="cc-fare" aria-label={brief.coins===null?(zh?'车费封存':'Fare sealed'):`${zh?'车费':'Fare'} ${brief.coins}`}><Coins aria-hidden="true" />{brief.coins===null?<Scramble />:brief.coins}{brief.tip>0&&<small>+{brief.tip}</small>}</b>
      {(()=>{const energy=brief.energy*(rider.kind==='parcel'&&rider.big?2:1);return <span className="cc-energy" aria-label={`${zh?'每层耗电':'Power per floor'} ${energy}`}><BatteryCharging aria-hidden="true" />{energy>0?`−${energy}`:energy}</span>;})()}
      {brief.agitation>0&&<span className="cc-agitation" aria-label={`${zh?'每层躁动':'Agitation per floor'} +${brief.agitation}`}><Flame aria-hidden="true" />+{brief.agitation}</span>}
      {net!==null&&<span className={`cc-net ${net>0?'is-pos':net<0?'is-neg':''}`} title={zh?`送到站时的净收益估算（不是上车就给钱）：到站车费，加上和已上车乘客配对、邻座的加成，减去这一路的电费${netIncludesAgitation(rider,run)||rider.kind==='nurse'?'，再算上他让车厢躁动的变化（每点每层按 3 币）':''}。按现在车厢里的人和最好的空位计算。`:`Estimated net on delivery (nothing is paid on boarding): arrival fare plus pairing / neighbour bonuses with riders aboard, minus the power for the trip${netIncludesAgitation(rider,run)||rider.kind==='nurse'?', and the change in cabin agitation (3 coins per point per floor)':''}. Based on who is aboard now and the best empty seat.`}>{(netIncludesAgitation(rider,run)||rider.kind==='nurse')&&<Flame aria-hidden="true" className="cc-net-flame" />}{brief.coins===null?<>{zh?'送达 净 ':'On arrival '}<Scramble />{zh?' 金币':' coins'}</>:zh?`送达 净${net>0?'+':net<0?'−':'±'}${Math.abs(net)} 金币`:`On arrival ${net>0?'+':net<0?'−':'±'}${Math.abs(net)} ${Math.abs(net)===1?'coin':'coins'}`}</span>}{paired&&paired.value>0&&<span className={`cc-net cc-net-paired ${paired.value>0?'is-pos':paired.value<0?'is-neg':''}`} title={paired.partner==='parcel'?(rider.kind==='smuggler'?(zh?'带上他的黑箱、放在他旁边时，两张卡合计送达的净收益估算（已减去黑箱的电费）。':'Estimated net on delivery for the pair with his black box beside him (the box’s power included).'):(zh?'带上他的纸箱、放在他旁边时，两张卡合计送达的净收益估算（已减去纸箱的电费）。':'Estimated net on delivery for the pair with his parcel beside him (the parcel’s power included).')):zh?`如果旁边坐上一位${riderName(paired.partner,'zh')}，这位乘客送达时的净收益估算；配对的加成双方都算。`:`Estimated net on delivery if a ${riderName(paired.partner,'en')} sits beside them; the pairing bonus counts for both.`}>{(()=>{const partnerName=paired.partner==='parcel'?displayName({kind:'parcel',big:rider.parcelBig?'top':undefined,contraband:rider.kind==='smuggler'||undefined},locale):riderName(paired.partner,locale);return zh?`配${partnerName} ${paired.value>=0?'+':'−'}${Math.abs(paired.value)} 金币`:`w/ ${partnerName} ${paired.value>=0?'+':'−'}${Math.abs(paired.value)} ${Math.abs(paired.value)===1?'coin':'coins'}`;})()}</span>}
    </span>}
    <span className="cc-line">{summary.line}{summary.sealed&&<> <Scramble className="scramble-line" />{rider.kind==='mystery'?(zh?' · 揭晓身份时公开':' · shown when he is revealed'):(zh?' · 到站揭晓':' · revealed on arrival')}</>}{(()=>{const progress=isBombKind(rider.kind)&&rider.bombMs!==undefined?`⏱ ${Math.ceil(rider.bombMs/1000)}s`:summary.progress;/* v9.20.3: the Mad Bomber too (his card said “⏱ 5”, floors, while his seat counts seconds) */return progress&&<em>{progress}</em>;})()}</span>
    {darkLegend&&<span className="cc-keepsake-effect cc-dark-reward"><b>{zh?'送到 70 层：':'Deliver to 70F: '}</b>{DARK_LEGEND_REWARD[rider.kind as DarkLegendKind][zh?0:1]}</span>}
    {legend&&!darkLegend&&<span className="cc-keepsake-effect"><b>{zh?'送到 10 层得信物 · ':'Deliver to 10F for keepsake · '}{keepsakeName(rider.kind as LegendKind,locale)}{zh?'：':': '}</b>{keepsakeTitle(rider.kind as LegendKind,locale)}</span>}
    {summary.chips.length>0&&<span className="cc-chips">{summary.chips.map((chip,index)=><span key={index} className={`cc-chip chip-${chip.tone}`} title={chip.title}>{chip.tone==='green'?'+':chip.tone==='risk'?'⛓':''}<ChipIcon icon={chip.icon}/>{chip.label}</span>)}</span>}
    {action&&<span className="cc-action">{action}</span>}
  </span>;
}

function riderState(cabin: Array<Rider | null>, slot: number, bonus: number, agitation: number, floor = 0): { label: string; tone: 'active' | 'warn' | 'neutral' } | null {
  const rider = cabin[slot];
  if (!rider) return null;
  const bond = bondStatus(rider,cabin,slot);
  const conflicts=conflictLinks(cabin).filter(link=>link.first===slot||link.second===slot);
  // v9.19 corruption comes first: a normal rider surrounded by dark riders is about to turn.
  const darkBeside = neighbours(slot).filter(i => cabin[i] && isDark(cabin[i]!.kind)).length;
  if (rider.warded && darkBeside >= DARK_RULES.corruptionNeighbours) return { label: '护身符护着 · 不会被同化', tone: 'active' };
  if (corruptible(rider.kind) && !rider.warded && darkBeside >= DARK_RULES.corruptionNeighbours) {
    const step = (rider.corruption ?? 0) + 1;
    return step >= DARK_RULES.corruptionFloors ? { label: `下一层被同化成${PASSENGERS[DARK_OF[rider.kind]!].name}`, tone: 'warn' } : { label: `正在被同化 ${step}/${DARK_RULES.corruptionFloors}`, tone: 'warn' };
  }
  // v9.19 item and Pusher states that outrank the rider's own line.
  if ((rider.sedated ?? 0) > 0) return { label: `镇静剂 · 还剩 ${rider.sedated} 层不躁动`, tone: 'active' };
  if ((rider.withdrawal ?? 0) > 0) return { label: `戒断中 · 还剩 ${rider.withdrawal} 层 · +${DARK_RULES.withdrawal}躁动/层`, tone: 'warn' };
  // v9.17 boxes: who holds, eyes, opens or checks each box.
  if (rider.kind === 'parcel' || isCarrierKind(rider.kind) || rider.kind === 'thief' || rider.kind === 'mimic') {
    const links = parcelLinks(cabin), near = (kinds: PassengerKind[]) => links.boxes.find(b => b.slots.includes(slot))?.touching.some(i => kinds.includes(cabin[i]?.kind as PassengerKind));
    if (rider.kind === 'parcel') {
      const carrier = links.carrier.get(slot);
      if (rider.sealed) return { label: rider.contraband ? '黑箱 · 已贴封条' : '已贴封条', tone: 'active' };
      if (rider.contraband && near(['inspector'])) return { label: '检查员会没收黑箱', tone: 'warn' };
      if (rider.contraband && near(['grafter'])) return { label: '贪腐检查员放行 · 送达 +8币', tone: 'active' };
      if (rider.contraband && carrier !== undefined) return { label: '黑箱 · 跟走私客一起到站', tone: 'neutral' };
      if (links.eyed.has(slot)) return { label: `小偷盯上了 · 他下车就带走`, tone: 'warn' };
      if (near(['child'])) return { label: '小孩下一层就拆开', tone: 'warn' };
      if (carrier !== undefined) return { label: rider.inspected ? '已验货 · 跟快递员到站' : cabin[carrier]?.id === rider.ownerId ? '跟快递员一起到站' : '已交给旁边的快递员', tone: 'neutral' };
      if (near(['mechanic'])) return { label: '维修工会拆来当零件', tone: 'neutral' };
      return { label: '无人认领 · 到站开箱，内容未知', tone: 'active' };
    }
    if (isCarrierKind(rider.kind) && rider.parcelId) {
      const box = rider.kind === 'smuggler' ? '黑箱' : '纸箱';
      if (links.bombs.has(slot)) return { label: '拿着炸弹 · 先下车就带走', tone: 'active' };
      if (links.contested.has(slot)) return { label: `争${box} · +1躁动`, tone: 'warn' };
      if (!parcelBeside(cabin, slot, links)) return { label: `没有${box} · 每层+1躁动 · 不付钱`, tone: 'warn' };
      return { label: `${box}在旁`, tone: 'active' };
    }
    if (rider.kind === 'thief' && thiefEyesParcel(links, slot)) return { label: '盯上纸箱 · 不躁动 · 下车带走', tone: 'active' };
    if (rider.kind === 'mimic' && slot >= 3 && cabin[slot - 3]?.kind === 'parcel') return { label: '↑ 复制纸箱 · 下车打开', tone: 'active' };
  }
  if (rider.disguised) return { label: '乔装的炸弹客 · 没有倒计时', tone: 'neutral' };
  if(rider.kind==='mimic')return {label:bond.copies.length?`↑ ${PASSENGERS[bond.copies[0].sourceKind].name} · ${bond.copies[0].field==='energy'?'耗电':'车费'}`:slot<3?`上排没人可复制 · 本体车费 ${bond.fare}币`:'↑ 等待正上方',tone:'neutral'};
  if (riskPartnerships(cabin).members.includes(slot)) return {label: `暂存+${agitationBand(agitation)==='high'?3:2}币/层 · 链接加躁动`, tone:'warn'};
  if (conflicts.length) return {label:conflicts.length===1?`红线 ${conflictGlyph(conflicts[0].effect)}`:`${conflicts.length} 条红线`,tone:'warn'};
  if(rider.kind==='mystery')return rider.revealed&&rider.identity?{label:`${MYSTERY_RULES[rider.identity].name} · ${MYSTERY_RULES[rider.identity].zh}`,tone:rider.identity==='fugitive'?'warn':'active'}:{label:mysteryClue(rider)?`线索：${MYSTERY_CLUES[mysteryClue(rider)!].zh}`:'身份未知 · 下一层揭晓',tone:'neutral'};
  if(rider.kind==='shifter')return {label:`耗电 ${bond.energy} · 躁动 +${bond.agitation}`,tone:'warn'};
  switch (rider.kind) {
    case 'tourist': { const count=touristCompanionCount(cabin,slot)+Number(hasNeighbour(cabin,slot,['nightingale'])); return count ? { label: `${count}位邻座 · 到站+${count*2}币`, tone: 'active' } : { label: '等待邻座 · 每位到站+2币', tone: 'neutral' }; }
    case 'operator': return cabin.filter(Boolean).length >= 6 ? { label: '满员 · 不省电', tone: 'warn' } : { label: '运转 −1 电', tone: 'active' };
    // v9.20 dark legends.
    case 'nightoperator': return { label: `运转 −${DARK_LEGEND_RULES.nightOperatorSaving}电 · 关灯 +${DARK_LEGEND_RULES.nightOperatorAgitation}躁动/层`, tone: 'warn' };
    case 'severer': { const red = conflictLinks(cabin).length, green = greenLinks(cabin); const parts = [red ? `收怨 +${red * DARK_LEGEND_RULES.severerPerRed}币/层` : '', green ? `剪绿线 +${green * DARK_LEGEND_RULES.severerPerGreen}躁动/层` : ''].filter(Boolean); return { label: parts.length ? parts.join(' · ') : '等着有人吵架', tone: red ? 'active' : green ? 'warn' : 'neutral' }; }
    // The banked total is already on the card's stash badge and fare; the state says what it costs.
    case 'kingpin': return { label: `每层存 ${DARK_LEGEND_RULES.kingpinStash}币 · 请离赔 ${DARK_LEGEND_RULES.kingpinDismissal}币`, tone: 'warn' };
    case 'coldmatron': return { label: `镇静全车 −${DARK_LEGEND_RULES.coldMatronCalm}躁动/层`, tone: 'active' };
    case 'banshee': return agitationBand(agitation) === 'high' ? { label: `哀歌 +${DARK_LEGEND_RULES.bansheeHighCoins}币/层`, tone: 'active' } : { label: `等车厢乱起来 · +${DARK_LEGEND_RULES.bansheeAgitation}躁动/层`, tone: 'neutral' };
    case 'necromancer': { const night = cabin.filter(r => r && isDark(r.kind)).length; return { label: `收魂 +${night * DARK_LEGEND_RULES.necromancerPerDark}币/层 · +${DARK_LEGEND_RULES.necromancerAgitation}躁动/层`, tone: night ? 'active' : 'neutral' }; }
    case 'highroller': return { label: `押注中 · 按现在的躁动 +${DARK_LEGEND_RULES.highRollerPerPoint * agitation}币`, tone: agitation > 0 ? 'active' : 'neutral' };
    case 'otherthirteen': return { label: '每层随机一件好事或坏事', tone: 'neutral' };
    case 'courier': return { label: '到站补充2电', tone: 'active' };
    case 'lover': return hasNeighbour(cabin, slot, ['lover']) ? { label: '已配对', tone: 'active' } : { label: '正在呼唤同伴', tone: 'neutral' };
    case 'thief': {
      if (thiefHeld(cabin, slot)) return { label: rider.cuffed ? '戴着手铐 · 不偷钱 · 全车 −1躁动/层' : '被管住 · 不偷钱 · 全车 −1躁动/层', tone: 'active' };
      // v9.18.4: beside the Don a Thief works under his protection: no agitation, pockets picked as usual.
      const take = neighbours(slot).reduce((n, i) => n + pickpocketFrom(cabin[i]), 0), don = hasNeighbour(cabin, slot, ['don']);
      if (don) return { label: take ? `教父罩着 · 不躁动 · +${take}金币/层` : '教父罩着 · 不躁动', tone: 'active' };
      return take ? { label: `顺手牵羊 +${take}金币/层`, tone: 'warn' } : { label: '没人可偷 · +1躁动/层', tone: 'warn' };
    };
    case 'cop': return hasNeighbour(cabin, slot, ['thief', 'bomb', 'robber']) ? { label: '正在控制', tone: 'active' } : hasNeighbour(cabin, slot, ['madbomber']) ? { label: '锁不住疯炸客', tone: 'warn' } : null;
    case 'lawyer': return { label: '红线损失抵消最多2币', tone: 'active' };
    case 'drunk': if (agitationBand(agitation)==='high') return { label: '高躁动 · 基价+100%', tone: 'active' }; return hasNeighbour(cabin, slot, ['nurse']) ? { label: '已被安抚', tone: 'active' } : { label: '未安抚 · 每层+1', tone: 'warn' };
    case 'child': return {label:`照顾 ${rider.careProgress??0}/${CHILD_CARE_WORK}${hasNeighbour(cabin,slot,['lover','nurse'])?' · 有人照顾':' · 无人照顾'}`,tone:hasNeighbour(cabin,slot,['lover','nurse'])?'active':'warn'};
    case 'ghost': {
      if (hasNeighbour(cabin, slot, GHOST_CONTROL_KINDS)) return { label: hasNeighbour(cabin, slot, ['summoner']) ? '被召魂人看着 · 车费×2' : '已被镇压', tone: 'active' };
      // v9.18.2: every third floor an uncontrolled Ghost delays one neighbour by a stop; say when.
      const next = floor + 1, haunt = next + ((3 - (next % 3)) % 3);
      if (haunt > rider.destination) return { label: '下车前不会作祟', tone: 'neutral' };
      return { label: haunt === next ? '下一层会拖延邻座 1 站' : `${haunt}层会拖延邻座 1 站`, tone: 'warn' };
    }
    case 'exorcist': return hasNeighbour(cabin, slot, ['ghost', 'wraith']) ? { label: '正在驱魔', tone: 'active' } : null;
    case 'coach': { const count = neighbourCount(cabin, slot); return count ? { label: `激励 ${count} 人`, tone: 'active' } : { label: '等待邻座', tone: 'neutral' }; }
    case 'celebrity': { const count = neighbourCount(cabin, slot); return count === 1 ? { label: '状态最佳', tone: 'active' } : count > 1 ? { label: '被围住', tone: 'warn' } : { label: '缺少关注', tone: 'neutral' }; }
    case 'inspector': return {label:rider.complianceReady?`签章 · 到站+${INSPECTION_BONUS}币`:`连续不高躁动 ${rider.quietStreak??0}/${INSPECTION_WORK}`,tone:rider.complianceReady?'active':'neutral'};
    case 'mechanic': return {label:rider.repairDone?'检修完成':`低躁动检修 ${rider.repairProgress??0}/${REPAIR_WORK}`,tone:rider.repairDone?'active':'neutral'};
    case 'musician': { const beat=musicBeatForAgitation(agitation); return {label:`整车节拍 ${beat>0?'+'+beat:beat<0?'−'+Math.abs(beat):'0'}`,tone:'neutral'}; }
    case 'nurse': {
      // v9.18.4: the Nurse only cancels her neighbours' own agitation (and cares for a Child); say how many she is actually treating.
      const without = cabin.map((r, i) => (i === slot ? null : r));
      const treated = neighbours(slot).filter(i => cabin[i] && riderAgitation({ cabin: without, floor, stress: agitation } as RunState, i).low > 0).length;
      return treated ? { label: `安抚 ${treated} 人 · 各 −1躁动/层`, tone: 'active' } : neighbourCount(cabin, slot) ? { label: '邻座都安静 · 暂无可安抚', tone: 'neutral' } : { label: '等待邻座', tone: 'neutral' };
    }
    // v9.19 dark versions.
    case 'overtimer': return floor >= rider.destination && !rider.alarm ? { label: '赖着不走 · +1躁动/层 · 等邻座一起下', tone: 'warn' } : { label: rider.alarm ? '上了闹钟 · 到站就下' : `加班费 +${DARK_RULES.overtimePay}币/层 · 要跟邻座一起下`, tone: 'neutral' };
    case 'voyeur': { const targets = neighbours(slot).filter(i => cabin[i] && isSurvivor(cabin[i]!.kind)).length; return targets ? { label: `正在偷拍 · +${DARK_RULES.voyeurPhoto}币/层 · +1躁动`, tone: 'warn' } : { label: '没有可拍的人 · 安静', tone: 'neutral' }; }
    case 'scrapper': return { label: `拆零件 +${DARK_RULES.scrapperCoins + (hasNeighbour(cabin, slot, ['grafter']) ? DARK_RULES.fenceCoins : 0)}币/层 · 运转+1电`, tone: 'warn' };
    case 'exlover': return hasNeighbour(cabin, slot, ['exlover']) ? { label: '和前任挨着 · 在吵架', tone: 'warn' } : cabin.some((r, i) => r?.kind === 'exlover' && i !== slot) ? { label: '分开坐 · 基价×2', tone: 'active' } : { label: '在等前任', tone: 'neutral' };
    case 'noisemaker': return agitationBand(agitation) === 'high' ? { label: `高躁动 · +${DARK_RULES.noiseHighCoins}币/层`, tone: 'active' } : { label: '起哄 · +1躁动/层', tone: 'warn' };
    case 'robber': return thiefHeld(cabin, slot) ? { label: `${rider.cuffed ? '戴着手铐' : '被管住'} · 到站赏金+${DARK_RULES.robberBounty}币`, tone: 'active' } : { label: hasNeighbour(cabin, slot, ['shyster']) ? '讼棍护着 · 抢你的钱包' : '抢你的钱包 · +1躁动/层', tone: 'warn' };
    case 'crookedcop': return { label: `收保护费 ${DARK_RULES.crookedFee + 2 * abyssTier(floor + 1)}币/层 · 全车−1躁动`, tone: 'neutral' };
    case 'shyster': { const red = conflictLinks(cabin).length; return red ? { label: `打官司 +${Math.min(DARK_RULES.shysterCap, red * DARK_RULES.shysterPerRed)}币/层`, tone: 'active' } : { label: '等人吵架', tone: 'neutral' }; }
    case 'brawler': { if (hasNeighbour(cabin, slot, ['crookedcop'])) return { label: '被黑警按住', tone: 'active' }; const normals = neighbours(slot).filter(i => cabin[i] && isSurvivor(cabin[i]!.kind)).length; return agitationBand(agitation) === 'high' ? { label: '高躁动 · 基价×3', tone: 'active' } : { label: `发狂 +${DARK_RULES.brawlerSelf + abyssTier(floor + 1) + normals}躁动/层`, tone: 'warn' }; }
    case 'pusher': {
      const without = cabin.map((r, i) => (i === slot ? null : r));
      const treated = neighbours(slot).filter(i => cabin[i] && riderAgitation({ cabin: without, floor, stress: agitation } as RunState, i).low > 0).length;
      return treated ? { label: `给 ${treated} 人下药 · 各 −${DARK_RULES.pusherCalm}躁动/层`, tone: 'active' } : { label: neighbourCount(cabin, slot) ? '邻座都安静' : '等待邻座', tone: 'neutral' };
    }
    case 'creepychild': { const n = neighbours(slot).filter(i => cabin[i] && isSurvivor(cabin[i]!.kind)).length; if (!n && neighbourCount(cabin, slot)) return { label: '身边都是暗黑版 · 不吓人', tone: 'neutral' }; return n ? { label: `吓到 ${n} 人 · +${n}躁动/层`, tone: 'warn' } : { label: `独处 · 到站+${DARK_RULES.creepyAloneBonus}币`, tone: 'active' }; }
    case 'wraith': return hasNeighbour(cabin, slot, GHOST_CONTROL_KINDS) ? { label: `受控 · +${DARK_RULES.wraithControlledCoins}币/层`, tone: 'active' } : { label: `每层拖延邻座 · 吸${DARK_RULES.wraithDrain + abyssTier(floor + 1)}电`, tone: 'warn' };
    case 'summoner': { const next = floor + 1, at = next + ((DARK_RULES.summonEvery - (next % DARK_RULES.summonEvery)) % DARK_RULES.summonEvery); return { label: at === next ? '下一层召来一只幽灵' : `${at}层召来一只幽灵`, tone: 'neutral' }; }
    case 'taskmaster': { const n = neighbourCount(cabin, slot), normal = neighbours(slot).filter(i => cabin[i] && isSurvivor(cabin[i]!.kind)).length; return n ? { label: normal ? `催逼 ${n} 人 · 车费+100% · +${normal}躁动/层` : `催逼 ${n} 人 · 车费+100%`, tone: normal ? 'warn' : 'active' } : { label: '等待邻座', tone: 'neutral' }; }
    case 'scandal': { if (hasNeighbour(cabin, slot, ['inspector', 'crookedcop'])) return { label: '身边有执法者 · 会被曝光', tone: 'warn' }; const n = neighbourCount(cabin, slot); return { label: `热度 +${n * DARK_RULES.scandalPerNeighbour + (hasNeighbour(cabin, slot, ['voyeur']) ? DARK_RULES.scandalVoyeur : 0)}币/层`, tone: n ? 'active' : 'neutral' }; }
    case 'grafter': { const n = neighbourCount(cabin, slot); return n ? { label: `收检查费 +${n * DARK_RULES.grafterFee}币/层 · 车厢+1躁动`, tone: 'warn' } : { label: '等待邻座', tone: 'neutral' }; }
    case 'madbomber': return bombLocked(cabin, slot) ? { label: '黑警锁住了怪炸弹', tone: 'active' } : null;
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
  // v9.20: with every slot full the card still shows what it would do once a slot is sold (it read “2/8 → 2/8”).
  const preview = previewUpgrade({ ...run, upgrades: Object.fromEntries(Object.keys(run.upgrades).map(k => [k, k === key ? run.upgrades[k as UpgradeKey] : 0])) as RunState['upgrades'] }, key);
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
    case 'dispatch': return '候客卡下方“留到下一批”，或选中新上车的人在左栏改路程 · 每十层 2 次';
    case 'rails': return '换位时生效 · 每层旧乘客可换位2次';
    case 'delay': return '多争取1站；仍需核对路程与倒计时';
    default: return '本局限装一次 · 按卡片条件触发';
  }
}

const MANUAL: Array<[string, string, string, string]> = [
  ['安排站位', '点乘客再点空位，或直接拖拽。连线两端互为邻座。旧乘客每层可换位 2 次；刚上车的乘客可免费移动或撤回。', 'Seating', 'Click a rider then a seat, or drag. Linked seats are neighbors. Riders already aboard can move twice per floor; new riders move or withdraw freely.'],
  ['三个数字', '每位乘客只看车费、每层耗电和躁动。每层耗电＝电梯运转＋乘客耗电＋红线额外耗电−节能。', 'Three numbers', 'Every rider has a fare, power per floor and agitation. Power per floor = motor + riders + red-link costs − savings.'],
  ['电量', '电量耗尽即结束。商店充电 2 金币/电；两次商店之间可以途中补电，4 金币/电，每十层最多 20 电。坐满 6 人时风扇每层多耗 1 电。', 'Power', 'Run out and the shift ends. Shops charge 2 coins per power; between shops you can charge in transit at 4 coins, up to 20 per ten floors. With all 6 seats taken the fans cost 1 more power per floor.'],
  ['躁动', '0–2 低、3–4 中、5 起高，到上限失控。低和中躁动时每位到站乘客多付 1 金币；高躁动每层 20% 可能出事故，一位乘客提前下车不付钱。', 'Agitation', 'Low 0–2, medium 3–4, high from 5; at the cap the shift is lost. Low and medium departures tip 1 coin per arrival; high departures risk a 20% incident where a rider leaves without paying.'],
  ['十层商店', '每店免费选 1 项能力，可再花 40 金币加购 1 项，共 6 个安装位。配电箱每店升 1 级（蓄电 / 变压 / 电机），80 层前最多 5 级，之后每 30 层多开 1 级、价格翻三倍。', 'Shops every ten floors', 'Pick 1 ability free and buy 1 more for 40 coins; 6 slots in all. Upgrade the power box once per shop (Storage / Transformer / Motor): 5 levels before 80F, then one more every 30 floors at three times the price.'],
  ['传奇乘客', '第一层偶尔有一位传奇在等候。他们坐到第 10 层商店、不耗电，下车时留下一件永久信物。不载会得到 10 金币补贴。离开 60 层商店时，这位传奇的暗黑版会回来，坐到 70 层，各有一份代价和回报。', 'Legends', 'A legend sometimes waits on floor 1. They ride to the floor-10 shop without using power and leave a permanent keepsake. Declining pays a 10-coin allowance. Leaving the 60F shop, that legend’s dark self comes back and rides to 70F, each with its own price and reward.'],
  ['午夜与深渊', '离开 60 层商店后午夜钟声响起，越来越多的乘客以暗黑版出现，规则和链接都变了。80 层起是深渊：每 5 层加一级，暗黑版越来越极端——车费更高，但每层有几率发作（+3 躁动或吸电，卡上写着几率）。关门前会显示这一层的失控几率。80 层商店会公布 81–89 层里的四个特殊楼层：静夜（暗黑版不惹麻烦）、暗涌（发作几率翻倍）、悬赏（一位乘客送到 +20 币）、夜市（门外能买道具），可以提前计划。', 'Midnight and the abyss', 'After the 60F shop the midnight bell rings and more and more riders arrive as their dark versions, with new rules and links. From 80F the abyss deepens every 5 floors: dark riders grow extreme—they pay more but may lash out each floor (+3 agitation or a power drain; the odds are on their cards). Before the doors close you see the chance this floor ends the run. The 80F shop announces four special floors among 81–89: Hush (no dark trouble), Surge (outburst odds doubled), Bounty (one rider pays 20 more on arrival) and Night market (buy items outside the doors), so you can plan ahead.'],
  ['道具', '商店里的一次性道具放进 4 格道具栏，同一种每买一次涨价。60 层起有对付暗黑版的道具，80 层起一定有照明弹（这一层所有暗黑版都不惹麻烦）。', 'Items', 'Shops sell single-use items for a 4-slot bag; each repeat costs more. From 60F there are tools against dark riders, and from 80F there is always a Flare (no dark rider causes trouble that floor).'],
  ['请离', '每十层最多请离 2 位，赔偿 4＋剩余站数×2 金币，不结算车费和暂存。传奇可免费请离，但拿不到信物。', 'Dismissal', 'Dismiss up to 2 riders per ten floors for 4 + 2 per remaining stop; no fare or bank is paid. Legends leave free but take their keepsake with them.'],
  ['邻座与叠加', '绿线是能力或默契，红线是代价（🔥躁动 ⚡耗电 🪙金币）。多条线逐条相加。', 'Neighbors', 'Green links are abilities or bonds; red links cost you (🔥 agitation ⚡ power 🪙 coins). Every link counts separately.'],
];
const PRESSURE_RISE: Array<[string, string, string, string]> = [
  ['乘客自身', '卡面上的躁动数字；急躁的乘客再 +1。没人管的小偷、没人照顾的儿童、未安抚的醉汉、被围住的名人也会加躁动。', 'Riders', 'The agitation number on the card; high-risk riders add 1 more. Unguarded Thieves, uncared-for Children, unsoothed Drifters and crowded Celebrities add agitation too.'],
  ['🔥 红线', '只有标 🔥 的红线加躁动。', '🔥 Red links', 'Only red links marked 🔥 add agitation.'],
  ['深渊发作', '80 层起，暗黑版每层可能发作：一部分 +3 躁动，一部分吸电。照明弹和镇静剂能压住，护士挡不住。', 'Abyss outbursts', 'From 80F dark riders may lash out each floor: some add 3 agitation, some drain power. A Flare or a Sedative holds them off; a Nurse cannot.'],
];
const PRESSURE_RELIEF: Array<[string, string, string, string]> = [
  ['到站舒缓', '每位正常到站 −1，每层最多 −2。', 'Arrivals', 'Each normal arrival −1, at most −2 per floor.'],
  ['护士与音乐家', '护士抵消每位邻座自身的躁动（每人每层最多 1 点），挡不住深渊发作；音乐家把躁动拉向中档，中档时每层 +2 金币。', 'Nurse and Musician', 'A Nurse cancels up to 1 of each neighbor’s own agitation per floor but not abyss outbursts; a Musician pulls agitation toward medium and earns 2 per floor there.'],
  ['每一档都有好处', '低：到站 +1 金币；中：到站 +1 金币；高：坏人链接多存 1 金币，醉汉车费翻倍——但有 20% 事故。', 'Every band pays', 'Low: +1 per arrival; medium: +1 per arrival; high: criminal links bank 1 more and Drifters pay double—with a 20% incident risk.'],
];

// v9.18 real-time Bomber timer: ?bomb=N sets the seconds per stop (e.g. ?bomb=6 or ?bomb=15), ?bomb=off counts floors.
if (typeof window !== 'undefined') {
  const bombParam = new URLSearchParams(window.location.search).get('bomb');
  if (bombParam === 'off') BOMB_RULES.realtime = false;
  else if (bombParam && Number(bombParam) > 0) BOMB_RULES.secondsPerStop = Number(bombParam);
}

export default function ElevatorGame() {
  const reduceMotion = useReducedMotion() ?? false;
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
  const [rawItemAim,setItemAim]=useState<ItemKey|null>(null);
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
  // v9.9 deal sounds: one card snap per offer, a shimmer for a legendary card.
  useEffect(() => { offers.forEach((offer, i) => { playSfx(sound, 'deal', { delay: .35 + i * .11, pitch: i * 2 }); if (riderCardGrade(offer) === 'legendary') playSfx(sound, 'shimmer', { delay: .5 + i * .11 }); }); }, [offers]); // eslint-disable-line react-hooks/exhaustive-deps
  const soundEnabled = useRef(false);
  const statusRef = useRef(run.status);
  useEffect(() => { statusRef.current = run.status; }, [run.status]);
  // v9.8 juice bookkeeping: where a placement flew from, the delivery streak and whether this run's record was announced.
  const placingFrom = useRef<{ el: Element | null; kind: PassengerKind } | null>(null);
  const streakRef = useRef(0);
  const recordAnnounced = useRef(false);
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
  useEffect(() => () => { journeyTimers.current.forEach(clearTimeout); if (feedbackTimer.current) clearTimeout(feedbackTimer.current); disposeGameAudio(); disposeSfx(); clearJuice(); disposeGameMusic(); }, []);

  useEffect(() => { setFastReveal(localStorage.getItem('elevator-tales-fast-reveal-v1') === 'on'); let seen = false; try { seen = localStorage.getItem('elevator-tales-intro-seen-v1') === 'yes'; } catch { /* storage unavailable */ } setIntroState(current => current ?? !seen); }, []);
  useEffect(() => {
    const syncPreferences = () => {
      const nextMusic = localStorage.getItem(MUSIC_PREFERENCE_KEY) !== 'off';
      const nextSound = localStorage.getItem(SOUND_PREFERENCE_KEY) !== 'off';
      setMusic(nextMusic); setSound(nextSound); soundEnabled.current = nextSound;
      if (!nextMusic) disposeGameMusic();
      if (!nextSound) { disposeGameAudio(); disposeSfx(); }
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

  useEffect(() => { const frame=requestAnimationFrame(() => { const savedBest = Math.max(1, Number(localStorage.getItem('elevator-tales-endless-best-floor') || 1)); const savedHighest = Math.max(1, Number(localStorage.getItem('elevator-tales-highest') || 1)); const shouldGuide = savedBest <= 1 || new URLSearchParams(window.location.search).get('tutorial') === '1'; let savedDiscovered: PassengerKind[] = []; try { savedDiscovered=sanitizeDiscoveredPassengers(JSON.parse(localStorage.getItem(DISCOVERED_PASSENGERS_KEY) || '[]')); } catch {} setHighest(savedHighest); setBestFloor(savedBest); setRunStartBest(savedBest); setDiscovered(savedDiscovered); discoveredRef.current = savedDiscovered; setGuidedShift(shouldGuide); const legends = loadUnlockedLegends(savedBest > 1); setUnlockedLegends(legends); setKeepsakesSeen(loadKeepsakesSeen()); try { const saved = JSON.parse(localStorage.getItem(STORIES_KEY) ?? '[]'); if (Array.isArray(saved)) setStoriesUnlocked(saved.filter((k): k is PassengerKind => k in STORIES)); } catch { /* storage unavailable */ } const opening = startRun(shouldGuide, Math.random, shouldGuide ? [] : drawLegend(legends));
      // Development-only QA shortcuts: ?qa=shop starts one ascent from the first shop; ?qa=low starts at 14F nearly out of power; ?qa=at&f=N starts on floor N.
      const qaMode = process.env.NODE_ENV !== 'production' ? new URLSearchParams(window.location.search).get('qa') : null;
      if (qaMode === 'shop' || qaMode === 'low' || qaMode === 'at' || qaMode === 'full') { const qaFloor = Math.max(2, Number(new URLSearchParams(window.location.search).get('f')) || 2); const qa = nextOfferBatch({ ...opening.state, ...(qaMode === 'full' ? { floor: 69, coins: 160, earned: 900, energy: 40, stress: 6, upgrades: { ...opening.state.upgrades, calm: 1, reinforced: 1, tipjar: 1, crowd: 1, buffer: 1, punchcard: 1 }, stressCap: opening.state.stressCap + 2, calmCharge: true } : qaMode === 'low' ? { floor: 14, coins: 87, earned: 188, energy: 4 } : qaMode === 'at' ? { floor: qaFloor, coins: 60, earned: 60, energy: 60 } : { floor: 9, coins: 140, earned: 140, energy: 30 }), legendOffer: undefined, legendStatus: undefined }); setGuidedShift(false); setIntroState(false); setRun(qa.state); presentOffers(qa.offers, savedDiscovered); return; }
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
  const sector = useMemo(() => sectorForecast(run), [run]);
  const risk = useMemo(() => departureRisk(run), [run]);
  // Same rule as settlement: 0 power on arrival at a shop floor is safe.
  const energyFatal = risk.fatal;
  // When charging alone is not enough, look for a real way out before suggesting anything (v9.3.1).
  const rescue = useMemo(() => (risk.fatal && risk.affordable < risk.need ? rescuePlan(run) : null), [run, risk]);
  // A floor that can end the run needs a second press; any change to the run disarms it.
  // Armed for this exact arrangement, not this object: a running bomb timer replaces the run every 200 ms (v9.18.4).
  // v9.18.4: a Courier aboard whose own box is still waiting on the offer list (its placement failed or was skipped).
  // v9.19 cautious-player hint: three or more empty seats while a card that only loses a little waits in the queue.
  const cautiousHint = run.status === 'playing' && run.floor <= 40 && run.cabin.filter(r => !r).length >= 3 && offers.some(o => o.kind !== 'parcel' && !run.cabin.some(r => r?.id === o.id) && (() => { const v = boardNet(o, run)?.value; return v !== undefined && v !== null && v < 0 && v >= -2; })());
  // v9.19.1: the cautious player's real miss was a pair (two Lovers at −3 / −7 that pay +9 / +5 together); name it.
  const pairHint = run.status === 'playing' && run.floor <= 40 && run.cabin.filter(r => !r).length >= 2 ? offers.flatMap(o => { if (o.kind === 'parcel' || run.cabin.some(r => r?.id === o.id)) return []; const now = boardNet(o, run)?.value ?? 0, p = pairedNet(o, run); return p && now < 0 && p.value > 0 && (offers.some(x => x.id !== o.id && x.kind === p.partner) || run.cabin.some(r => r?.kind === p.partner)) ? [{ o, p }] : []; })[0] ?? null : null;
  const strandedCourier = run.status === 'playing' ? run.cabin.find(r => isCarrierKind(r?.kind) && r.parcelId && offers.some(o => o.id === r.parcelId) && !run.cabin.some(c => c && (c.id === r.parcelId || c.boxId === r.parcelId))) ?? null : null;
  const departSig = `${run.floor}|${run.cabin.map(r => r?.id ?? '-').join(',')}|${run.energy}|${run.stress}|${run.coins}`;
  const [departArmedFor, setDepartArmedFor] = useState<string | null>(null);
  // v9.18.3: the ability cards drawn at this shop visit stay on screen after one is chosen or bought (no reflow).
  const [shopKeys, setShopKeys] = useState<{ sig: string; keys: UpgradeKey[] }>({ sig: '', keys: [] });
  const shopSig = run.status === 'upgrade' && run.shop.length ? `${run.floor}:${run.shop.map(c => c.key).join(',')}` : null;
  if (shopSig && shopSig !== shopKeys.sig) setShopKeys({ sig: shopSig, keys: run.shop.map(c => c.key) });
  const shownShopKeys = shopKeys.sig.startsWith(`${run.floor}:`) ? shopKeys.keys : run.shop.map(c => c.key);
  const departArmed = departArmedFor === departSig;
  const emergencyLeft = run.status === 'playing' ? emergencyAllowance(run) : 0;
  const emergencyPrice = emergencyUnitPrice(boxOf(run));
  // v9.20.3 (English playtest 8): "out at 89F" used to offer +1 a click; offer what it takes to reach the shop instead.
  const sectorShort = useMemo(() => { if (run.status !== 'playing' || sector.failFloor === null) return 0; for (let k = 1; k <= emergencyLeft; k++) if (sectorForecast({ ...run, energy: run.energy + k }).failFloor === null) return k; return emergencyLeft; }, [run, sector.failFloor, emergencyLeft]);
  const emergencyNeed = run.status === 'playing' ? Math.min(emergencyLeft, Math.max(0, 1 - sector.projected, risk.need, sectorShort)) : 0;
  // v9.20.1: “fatal” means certain to be possible without abyss outbursts; outbursts are a priced gamble.
  // v9.20.3: before a shop, arriving at the cap is survivable when the shop's relief and repair can bring it back under.
  const shopRoom = shopAgitationRoom(run), stressLimit = run.stressCap + shopRoom;
  const stressFatal = run.stress + (pressurePreview.certainHighDelta ?? pressurePreview.highDelta) >= stressLimit;
  const shopFixNeeded = !stressFatal && shopRoom > 0 && run.stress + pressurePreview.highDelta >= run.stressCap;
  const gambleChance = stressFatal ? 0 : pressurePreview.lossChance ?? 0;
  const gamble = run.status === 'playing' && gambleChance >= GAMBLE_WARN;
  const gambleCalm = gamble ? Math.max(1, run.stress + pressurePreview.highDelta - stressLimit + 1) : 0;
  // v9.6 in-transit calming: coins lower agitation before departure, capped per ten floors.
  const calmLeft = calmAllowance(run);
  const calmNeed = stressFatal ? Math.max(1, run.stress + (pressurePreview.certainHighDelta ?? pressurePreview.highDelta) - stressLimit + 1) : 0;
  // v9.18.4: past the allowance, extra calming costs 2×, 3×, … (a late-game coin sink).
  const overtimePrice = overtimeCalmPrice(run);
  const overtimeOk = overtimePrice !== null && run.coins >= overtimePrice;
  // v9.18.4: the doomed-floor advice names where this floor's agitation comes from and only suggests moves this cabin allows.
  const stressAdvice = (() => {
    const zh = language === 'zh', has = (k: PassengerKind) => run.cabin.some(r => r?.kind === k);
    const top = (pressurePreview.sources ?? []).filter(x => x.amount > 0).sort((x, y) => y.amount - x.amount).slice(0, 3).map(x => `${translateGameText(x.label, language)} +${x.amount}`).join(zh ? '、' : ', ');
    const tips: string[] = [];
    if (has('child') && (has('nurse') || has('lover'))) tips.push(zh ? '把护士或恋人挪到儿童旁边' : 'seat a Nurse or Lover beside the Child');
    if (has('thief') && (has('cop') || has('lawyer'))) tips.push(zh ? '让警察或律师挨着小偷' : 'put an Officer or Lawyer beside the Thief');
    if (has('drunk') && has('nurse')) tips.push(zh ? '让护士挨着醉汉' : 'seat the Nurse beside the Drifter');
    if (has('pusher') && run.cabin.some(r => r && corruptible(r.kind))) tips.push(zh ? '让药贩挨着躁动的人' : 'seat the Pusher beside the agitators');
    if (has('crookedcop') && (has('robber') || has('brawler'))) tips.push(zh ? '让黑警挨着劫匪或狂徒' : 'put the Crooked Cop beside the Robber or Brawler');
    if ((run.items ?? []).includes('aroma')) tips.push(zh ? '用香薰（−2）' : 'use Incense (−2)');
    if ((run.items ?? []).includes('sedative')) tips.push(zh ? '给最躁的人用镇静剂' : 'sedate the worst agitator');
    if (run.cabin.some(r => r && r.boardedAt === run.floor)) tips.push(zh ? '撤回刚上车、会加躁动的乘客' : 'withdraw a new rider who adds agitation');
    // v9.20.2 (English playtest 2): a dark legend whose cabin line adds agitation can be put off (free except the Kingpin).
    const loud = run.cabin.find(r => r && ['nightoperator', 'kingpin', 'banshee', 'necromancer', 'severer'].includes(r.kind) && r.boardedAt < run.floor);
    if (loud) { const alone = run.cabin.filter(Boolean).length === 1, fee = dismissalCost(run, loud); tips.push(zh ? `请离${riderName(loud.kind, 'zh')}（${fee ? `赔 ${fee} 币` : '免费'}${alone ? '；车上至少要留一人，先接一位新乘客' : ''}）` : `dismiss ${riderName(loud.kind, 'en')} (${fee ? `${fee} coins` : 'free'}${alone ? '; someone must stay aboard, so board a new rider first' : ''})`); }
    const source = top ? (zh ? `躁动主要来自：${top}。` : `Agitation comes from: ${top}. `) : '';
    if (overtimeOk) tips.push(zh ? `加急安抚（这一点 ${overtimePrice} 币，之后更贵）` : `buy overtime calming (${overtimePrice} coins now, more after)`);
    return source + (tips.length ? (zh ? `可以试试：${tips.join('；')}；否则这一层会失控。` : `Try: ${tips.join('; ')}; otherwise it boils over this floor.`) : (zh ? '车上没有能马上降下来的办法，这一层会失控。' : 'Nothing aboard can bring it down in time; it boils over this floor.'));
  })();
  const calmRescue = useMemo(() => (stressFatal && calmLeft < calmNeed ? calmRescuePlan(run) : null), [run, stressFatal, calmLeft, calmNeed]);
  const overtimeCalm = () => { const next = buyOvertimeCalm(run); if (next === run) return; reportMetrics(run, next, language === 'zh' ? '加急安抚' : 'Overtime calming'); setRun(next); playSfx(sound, 'calm'); flashClass(document.querySelector('.elevator-stage'), 'cabin-calm', 900); burstAt(document.querySelector('[data-metric="stress"]'), 'blue', 12, 60); };
  const calm = (units: number) => { const next = buyCalm(run, units); if (next === run) return; reportMetrics(run, next, language === 'zh' ? '途中安抚' : 'Calming'); setRun(next); playSfx(sound, 'calm'); flashClass(document.querySelector('.elevator-stage'), 'cabin-calm', 900); burstAt(document.querySelector('[data-metric="stress"]'), 'blue', 12, 60); };
  const forecastTone = energyFatal || stressFatal ? 'danger' : pressurePreview.tone;
  const phase = shiftPhase(run.floor); const upgradeCount = Object.values(run.upgrades).filter(Boolean).length; const nextShop = nextShopFloor(run.floor); const nextIsShop = (run.floor + 1) % 10 === 0; const agitated = run.stress >= agitationThreshold(run.stressCap);
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
  // Cached: recomputing six placement previews on every render made dragging hitch as the pointer crossed seats.
  const placementPlans = useMemo(() => (activeRider ? run.cabin.map((_, slot) => planPlacement(run, activeRider, slot)) : []), [run, activeRider]);
  const hoveredPlan = dragOverSlot !== null ? placementPlans[dragOverSlot] : null;

  const departureForecast = `${nextIsShop ? '下一站：商店' : '下一站'} · 电量 ${energyPreview.range} · 躁动 ${pressurePreview.range}${pressurePreview.details ? ` · ${pressurePreview.details}` : ''}`;

  const resultChallenge = failureLesson(run);
  const chargePlan=chargingPlan(run);
  const need=sectorNeed(run);
  // v9.15: before late-night unrest, suggest keeping coins for calming (about half the coming unrest points).
  const unrestAhead=run.status==='upgrade'?Array.from({length:10},(_,i)=>nightUnrest(run.floor+1+i)).reduce((a,b)=>a+b,0):0;
  const calmReserve=unrestAhead?calmPrice(run.floor+1)*Math.ceil(unrestAhead/2):0;
  const [chargeChoice,setChargeChoice]=useState<{context:string;target:number}|null>(null);
  const chargeContext=`${run.floor}:${run.energy}:${run.energyCap}:${run.coins}`;
  // v9.6.1: default to the next sector's estimated need, not the cap, so coins remain for calming; drag to buy more.
  // v9.18.4: power first. The calming reserve only holds back coins left over after charging to the next sector's need;
  // a short-of-coins playtest defaulted to charging 0, spent the coins on calming and ran dry.
  const needCharge=boxChargeCost(boxOf(run),Math.max(0,Math.min(run.energyCap,need.total)-run.energy),run.floor);
  const heldForCalm=Math.min(calmReserve,Math.max(0,run.coins-needCharge));
  // v9.19.1: in an agitation crisis the minimum rescue comes first; charging may not spend the coins it needs.
  const repairReserve=upgradeCrisis==='stress'?emergencyRepairPlan(run).cost:0;
  const affordableChargeTarget=Math.min(run.energyCap,run.energy+affordableUnits(boxOf(run),Math.max(0,run.coins-heldForCalm-repairReserve),run.floor),Math.max(run.energy,need.total));
  const chargeTarget=Math.max(run.energy,Math.min(run.energyCap,chargeChoice?.context===chargeContext?chargeChoice.target:affordableChargeTarget));
  const chargeUnits=Math.max(0,chargeTarget-run.energy),chargeCost=boxChargeCost(boxOf(run),chargeUnits,run.floor);
  const seatEnergyCosts=energyBreakdown(run).riderCosts;
  const detailRider=passengerDetails ? run.cabin.find(r=>r?.id===passengerDetails.id) ?? offers.find(r=>r.id===passengerDetails.id) ?? passengerDetails : null;
  const detailBrief=detailRider ? passengerBrief(detailRider,run.floor,run.cabin,cooperationBonus(run),cooperationRelief(run),eventPressureMultiplier(run),run.stress) : null;
  const detailOnboard=detailRider ? run.cabin.some(r=>r?.id===detailRider.id) : false;
  const canDismiss=Boolean(detailRider&&detailOnboard&&detailRider.boardedAt<run.floor&&run.status==='playing'&&doors==='open');
  const penalty=detailRider?dismissalCost(run,detailRider):0;

  const reset = useCallback(() => { clearJuice(); streakRef.current = 0; recordAnnounced.current = false; journeyTimers.current.forEach(clearTimeout); journeyTimers.current = []; if (feedbackTimer.current) clearTimeout(feedbackTimer.current); setFeedback(null); setArriving([]); setMetricEvent(null); setReceiptOpen(false); setInventoryOpen(false); setChangelogOpen(false); setPassengerDetails(null); setEjectArmed(false); setLeaveArmed(false); disposeGameAudio(); recordRef.current = []; setCopied(null); const opening = daily ? startRun(false, stream(daily.seed, 'offers', 1), LEGEND_STARTERS) : startRun(false, Math.random, drawLegend(unlockedLegends)); setRunStartBest(bestFloor); setRun(opening.state); presentOffers(opening.offers); setRunDelivered({}); setNewLegends([]); setGuidedShift(false); setSelectedSlot(null); setPendingOfferId(null); setDragged(null); setDragOverSlot(null); setDoors('open'); setIntro(false); busyRef.current = false; }, [bestFloor, presentOffers, unlockedLegends, daily]);
  const switchMode = (toDaily: boolean) => { const url = new URL(window.location.href); if (toDaily) url.searchParams.set('daily', '1'); else url.searchParams.delete('daily'); window.location.assign(url.toString()); };
  const commitPlacement = (result: PlacementResult) => {
    if (result.ok && result.changed) reportMetrics(run, result.next, result.label);
    if (result.ok && result.changed) {
      const from = placingFrom.current; placingFrom.current = null;
      const target = result.slots[result.slots.length - 1];
      const slotEl = typeof target === 'number' ? document.querySelectorAll('.standing-slot')[target] ?? null : null;
      if (from?.el) { playSfx(soundEnabled.current, 'board', { pitch: randomPitch() }); if (chance(.15)) window.setTimeout(() => bubble(slotEl, quip(from.kind, 'board', language === 'zh')), 380); }
      if (result.tone === 'combo') { playSfx(soundEnabled.current, 'link', { delay: .12, pitch: Math.min(7, conflictLinks(result.next.cabin).length) }); }
      if (conflictLinks(result.next.cabin).length > conflictLinks(run.cabin).length) { playSfx(soundEnabled.current, 'conflict', { delay: .1 }); }
    }
    setRun(result.next);
    if (!result.ok || result.changed) { flash({ tone: result.tone, label: result.label, slots: result.slots }); playTone(sound, result.ok ? result.tone === 'combo' ? 'combo' : 'place' : 'danger'); }
    if (result.ok) { setPendingOfferId(null); setSelectedSlot(null); setDragOverSlot(null); }
  };
  // A rider who boarded from this floor's offers can be dragged back onto the offer list to withdraw them.
  const draggedReturnable = dragged?.type === 'slot' && Number.isInteger(dragged.slot) && Boolean(run.cabin[dragged.slot!] && offers.some(o => o.id === boxIdOf(run.cabin[dragged.slot!]!)));
  const dropOnOffers = (event: DragEvent) => {
    event.preventDefault();
    let payload = dragged;
    try { payload = JSON.parse(event.dataTransfer.getData('application/elevator-tales')) as DragPayload; } catch { /* state fallback */ }
    const rider = payload?.type === 'slot' && Number.isInteger(payload.slot) ? run.cabin[payload.slot!] : null;
    const offer = rider ? offers.find(o => o.id === boxIdOf(rider)) : undefined;
    if (offer && !locked) toggleOffer(offer);
    endDrag();
  };
  const toggleOffer = (offer: Rider) => {
    if (locked) return;
    const existing = run.cabin.findIndex((rider) => rider?.id === offer.id);
    if (existing >= 0) { const next = { ...run, cabin: unseatRider(run.cabin, offer.id), message: `${PASSENGERS[offer.kind].name}回到队伍中。` }; reportMetrics(run, next, `${PASSENGERS[offer.kind].name}下车`); setRun(next); setPendingOfferId(null); playTone(sound, 'select'); return; }
    if (pendingOfferId === offer.id) { setPendingOfferId(null); setRun((current) => ({ ...current, message: '已取消安排。' })); return; }
    setPendingOfferId(offer.id); setItemAim(null); setSelectedSlot(null); setDragOverSlot(null); setFeedback(null);
    setRun((current) => ({ ...current, message: `已选择${PASSENGERS[offer.kind].name}，现在点一个空位。` })); playTone(sound, 'select');
    scrollMobileTarget('.elevator-stage','center');
  };
  // v9.19 item bag: items without a target work at once; the others arm the bag, and the next seat click picks the target.
  const itemReady = (key: ItemKey) => ITEMS[key].target === 'none' ? itemUsable(run, key) : run.cabin.some(r => itemUsable(run, key, r));
  // An armed item only stays armed while it can still be used (a new run, a shop or a spent item disarms it).
  const itemAim = rawItemAim && itemReady(rawItemAim) ? rawItemAim : null;
  const applyBagItem = (key: ItemKey, targetId?: string) => {
    const next = applyItem(run, key, targetId); setItemAim(null); if (next === run) return;
    const zh = language === 'zh', slot = targetId ? run.cabin.findIndex(r => r?.id === targetId) : -1;
    reportMetrics(run, next, zh ? `使用${ITEMS[key].name}` : `Used ${ITEMS[key].en}`); setRun(next); playSfx(sound, key === 'cutter' ? 'defuse' : 'shimmer');
    const anchor = slot >= 0 ? document.querySelectorAll('.standing-slot')[slot] ?? null : document.querySelector('.elevator-stage');
    burstAt(anchor, key === 'flare' ? 'gold' : 'green', 16, 80); popText(anchor, zh ? ITEMS[key].name : ITEMS[key].en, 'green', true);
    if (key === 'flare') flashClass(document.querySelector('.elevator-stage'), 'is-flared', 1600);
  };
  const pickItem = (key: ItemKey) => {
    if (locked) return;
    if (itemAim === key) { setItemAim(null); return; }
    if (ITEMS[key].target === 'none') { applyBagItem(key); return; }
    setItemAim(key); setPendingOfferId(null); setSelectedSlot(null); playTone(sound, 'select');
  };
  const clickSlot = (slot: number) => {
    if (locked) return;
    if (itemAim) { const target = run.cabin[slot]; if (target && itemUsable(run, itemAim, target)) applyBagItem(itemAim, target.id); else setItemAim(null); return; }
    if (pendingOfferId) {
      const offer = offers.find((candidate) => candidate.id === pendingOfferId);
      if (!offer) { setPendingOfferId(null); return; }
      placingFrom.current = { el: document.querySelector(`[data-offer-id="${offer.id}"] .portrait-window`), kind: offer.kind };
      commitPlacement(planPlacement(run, offer, slot)); return;
    }
    if (selectedSlot === null) { const rider = run.cabin[slot]; if (rider) { setSelectedSlot(slot); playTone(sound, 'select'); } return; }
    if (selectedSlot === slot) { setSelectedSlot(null); return; }
    const rider = run.cabin[selectedSlot];
    if (rider) commitPlacement(planPlacement(run, rider, slot));
  };

  const endDrag = () => { setDragged(null); setDragOverSlot(null); };
  // v9.12 pointer drag (replaces native drag-and-drop): the ghost is plain DOM; React only hears target changes.
  const pointerDrag = (event: ReactPointerEvent<HTMLElement>, payload: DragPayload, rider: Rider) => {
    const source = event.currentTarget.querySelector<HTMLElement>('.portrait-window') ?? event.currentTarget;
    beginPointerDrag(event.nativeEvent, {
      source, imageSrc: riderPortraitSrc(rider), tall: isBigParcel(rider),
      onStart: () => { setPendingOfferId(null); setSelectedSlot(null); setFeedback(null); setDragged(payload); playTone(sound, 'select'); },
      onTarget: (target) => setDragOverSlot(target && 'slot' in target ? target.slot : null),
      onDrop: (target) => {
        if (!target) return false;
        if ('slot' in target) { placingFrom.current = null; const result = planPlacement(run, rider, target.slot); commitPlacement(result); return result.ok && result.changed; }
        const offer = payload.type === 'slot' ? offers.find(o => o.id === boxIdOf(rider)) : undefined;
        if (offer) { toggleOffer(offer); return true; }
        return false;
      },
      onEnd: endDrag,
    });
  };
  const dropOnSlot = (event: DragEvent, target: number) => {
    event.preventDefault();
    if (locked) return;
    let payload = dragged;
    try { payload = JSON.parse(event.dataTransfer.getData('application/elevator-tales')) as DragPayload; } catch { /* state fallback */ }
    if (!payload || typeof payload !== 'object') { endDrag(); return; }
    const rider = payload.type === 'offer' ? offers.find((candidate) => candidate.id === payload.id) : payload.type === 'slot' && Number.isInteger(payload.slot) ? run.cabin[payload.slot] : null;
    if (rider && payload.type === 'offer') placingFrom.current = { el: document.querySelector(`[data-offer-id="${rider.id}"] .portrait-window`), kind: rider.kind };
    if (rider) commitPlacement(planPlacement(run, rider, target));
    endDrag();
  };
  // v9.8 juice after each floor: bell, speech, streak, and at most one banner (record > close call > district > unrest rumble).
  const celebrateFloor = (before: RunState, after: RunState) => {
    const on = soundEnabled.current, zh = language === 'zh', stage = document.querySelector('.elevator-stage');
    // v9.19.1: arriving at a shop, the shop covers the cabin; seat pops would float over it, so only sounds play.
    const shopping = after.status === 'upgrade';
    // v9.18.2 defusal: a Bomber who makes it off rings a brighter chord than an ordinary arrival.
    (after.lastArrivals ?? []).filter(a => isBombKind(a.kind)).forEach(a => {
      const seat = document.querySelectorAll('.standing-slot')[a.slot] ?? null;
      playSfx(on, 'defuse'); if (shopping) return; burstAt(seat, 'green', 22, 110);
      window.setTimeout(() => popText(seat, zh ? '拆弹成功！' : 'Defused!', 'green', true), 150);
    });
    // v9.18.2 haunting: a wisp drifts from the Ghost to the rider it delayed, who flashes violet.
    (after.lastHaunts ?? []).forEach((h, k) => {
      const seats = document.querySelectorAll('.standing-slot');
      flyCoin(seats[h.ghost] ?? null, seats[h.victim] ?? null, zh ? '+1站' : '+1 stop', .1 + k * .2, 'ghost');
      window.setTimeout(() => flashClass(seats[h.victim] ?? null, 'is-haunted', 1300), 700 + k * 200);
    });
    // v9.18.1 pickpocketing: every coin hops from the victim to the Thief, then the Thief shows his take.
    (after.lastThefts ?? []).forEach((theft, t) => {
      const seats = document.querySelectorAll('.standing-slot'), thiefSeat = seats[theft.thief] ?? null;
      theft.victims.forEach((v, i) => flyCoin(seats[v.slot] ?? null, thiefSeat, `+${v.coins}`, .15 + t * .2 + i * .12));
      window.setTimeout(() => { popText(thiefSeat, zh ? `顺手牵羊 +${theft.victims.reduce((n, v) => n + v.coins, 0)} 金币` : `Pickpocket +${theft.victims.reduce((n, v) => n + v.coins, 0)} coins`, 'gold'); playSfx(on, 'clink'); }, 800 + t * 200);
    });
    // v9.19.1 wallet flows: the Robber and the Crooked Cop take coins out of the wallet; the dark riders who earn per
    // floor (Grafter, Scrapper, Shyster, a controlled Wraith, the Noisemaker) send theirs in.
    if (!shopping) {
      const FLOWS: Record<string, PassengerKind> = { 劫匪抢走: 'robber', 黑警保护费: 'crookedcop', 贪腐检查员收检查费: 'grafter', 拆机人卖零件: 'scrapper', 讼棍打官司: 'shyster', '怨灵受控：供奉': 'wraith', 噪音乐手演出: 'noisemaker' };
      const wallet = document.querySelector('[data-metric="coins"]'), seats = document.querySelectorAll('.standing-slot');
      let k = 0;
      for (const src of after.lastEarnings.sources) {
        const kind = FLOWS[src.label]; if (!kind || !src.amount) continue;
        const slots = before.cabin.flatMap((r, i) => r?.kind === kind ? [i] : []);
        slots.forEach(i => { const seat = seats[i] ?? null, each = Math.round(src.amount / slots.length); if (src.amount < 0) flyCoin(wallet, seat, `${each}`, .2 + k * .15); else flyCoin(seat, wallet, `+${each}`, .2 + k * .15); k++; });
        if (src.amount < 0 && slots.length) window.setTimeout(() => { popText(seats[slots[0]] ?? null, zh ? (kind === 'robber' ? `抢走 ${-src.amount} 币` : `保护费 ${-src.amount} 币`) : (kind === 'robber' ? `Robbed ${-src.amount}` : `Protection ${-src.amount}`), 'red'); playSfx(on, 'clink'); }, 900);
      }
    }
    // v9.18.3 boxes: every box opened (or used, or taken) plays where it sat, with what was inside.
    (after.lastBoxEvents ?? []).forEach((ev, k) => {
      const seats = document.querySelectorAll('.standing-slot'), seat = seats[ev.slot] ?? null, delay = .15 + k * .25;
      const src = riderPortraitSrc({ kind: 'parcel', big: ev.big ? 'top' : undefined, tier: ev.tier === 'common' ? undefined : ev.tier });
      if (ev.by === 'inspect') { window.setTimeout(() => { popText(seat, zh ? `验货 · 快递员晚一站 · +${ev.coins ?? 0} 金币` : `Checked · Courier 1 stop later · +${ev.coins ?? 0} coins`, 'green'); flashClass(seat, 'is-inspected', 900); playSfx(on, 'stamp'); }, delay * 1000); return; }
      if (ev.by === 'thief') { window.setTimeout(() => { flyPortrait(seat, seats[ev.thief ?? ev.slot] ?? null, src); popText(seats[ev.thief ?? ev.slot] ?? null, zh ? '带走纸箱' : 'Took the box', 'gold'); }, delay * 1000); return; }
      // An unclaimed box that reached its floor already shows its contents on the exit card.
      const label = ev.by === 'arrival' ? '' : ev.by === 'mechanic' ? (zh ? '拆成零件 · 检修完成' : 'Parts · repair done') : ev.ability ? `${zh ? '能力：' : 'Ability: '}${translateGameText(UPGRADES[ev.ability].name, language)}` : ev.power ? (zh ? `+${ev.power} 电` : `+${ev.power} power`) : (zh ? `+${ev.coins ?? 0} 金币` : `+${ev.coins ?? 0} coins`);
      const who = ev.by === 'child' ? (zh ? '小孩拆开了纸箱' : 'The Child opened it') : ev.by === 'mimic' ? (zh ? '复制人打开复制箱' : 'The Mimic’s copy') : '';
      openBoxFx(seat, src, label, ev.by === 'mechanic' || ev.power ? 'blue' : ev.ability ? 'green' : 'gold', delay);
      playSfx(on, 'boxOpen', { delay: delay + .3, pitch: k * 2 });
      if (who) window.setTimeout(() => bubble(seat, who, 1400), delay * 1000);
    });
    // v9.19 Mystery reveal: the card flips over and names who he really was.
    after.cabin.forEach((r, slot) => {
      if (shopping || r?.kind !== 'mystery' || !r.revealed || !r.identity || !before.cabin.some(b => b?.id === r.id && !b.revealed)) return;
      const seat = document.querySelectorAll('.standing-slot')[slot] ?? null, id = MYSTERY_RULES[r.identity];
      window.setTimeout(() => { flashClass(seat, 'is-revealed', 1200); popText(seat, zh ? `原来是${id.name}！` : `A ${id.en}!`, r.identity === 'fugitive' ? 'red' : 'gold', true); playSfx(on, 'shimmer'); }, 450);
    });
    // v9.20 hidden dark resonance: nothing on any card mentions it; the first time a player finds it, the cabin says so.
    if (!shopping && after.lastEarnings.sources.some(l => l.label === '暗黑共鸣')) {
      let found = false; try { found = localStorage.getItem(RESONANCE_KEY) === '1'; localStorage.setItem(RESONANCE_KEY, '1'); } catch { /* storage unavailable */ }
      const seats = document.querySelectorAll('.standing-slot');
      window.setTimeout(() => { seats.forEach(seat => flashClass(seat, 'is-resonant', 1400)); if (!found) { banner(stage, zh ? '暗黑共鸣' : 'Dark resonance', zh ? '全车都是黑夜里的人：躁动 −2，每人每层 +1 金币' : 'Everyone aboard belongs to the night: −2 agitation, +1 coin each per floor', 'midnight', 3400); playSfx(on, 'bell'); } }, 1250);
    }
    // v9.18.3 incident: the rider who left without paying gets a red flash where they sat (the exit card says why).
    if (after.lastIncident) { const seat = document.querySelectorAll('.standing-slot')[after.lastIncident.slot] ?? null; window.setTimeout(() => { flashClass(seat, 'is-incident', 1400); playSfx(on, 'conflict'); }, 250); }
    if (after.status !== 'lost') { playSfx(on, 'doorOpen', { delay: .05 }); playSfx(on, 'ding', { delay: .12 }); }
    if (after.status === 'upgrade' && after.floor % 50 === 0) playSfx(on, 'record', { delay: .4 });
    const arrivals = after.lastArrivals ?? [];
    streakRef.current = arrivals.length ? streakRef.current + 1 : 0;
    window.setTimeout(() => {
      document.querySelectorAll('.arrival-exit').forEach((el, i) => { if (i < 1 && arrivals[i]) bubble(el, quip(arrivals[i].kind, 'arrive', zh), 1500); });
      if (streakRef.current >= 3) popText(document.querySelector('.floor-indicator'), zh ? `连送 ×${streakRef.current}` : `Streak ×${streakRef.current}`, 'green');
    }, 140);
    if (after.status === 'lost') return;
    const bandUp = agitationBand(after.stress) === 'high' && agitationBand(before.stress) !== 'high';
    if (after.floor > runStartBest && runStartBest > 1 && !recordAnnounced.current) {
      recordAnnounced.current = true;
      window.setTimeout(() => { banner(stage, zh ? '新纪录！' : 'New record!', zh ? `第 ${after.floor} 层` : `Floor ${after.floor}`, 'gold'); playSfx(on, 'record'); burstAt(document.querySelector('.floor-indicator'), 'gold', 22, 110); }, 260);
    } else if (after.status === 'playing' && abyssEventAt(after, after.floor)) {
      // v9.21 the eve of the abyss: arriving on an announced floor, say what it holds.
      const kind = abyssEventAt(after, after.floor)!, loc: GameLocale = zh ? 'zh' : 'en';
      window.setTimeout(() => { banner(stage, `${after.floor}F · ${abyssEventName(kind, loc)}`, abyssEventRule(kind, loc), kind === 'surge' ? 'red' : 'midnight', 2200); }, 260);
    } else if (after.status === 'playing' && abyssStep(after.floor + 1) > abyssStep(after.floor)) {
      // v9.20: one floor before the abyss unrest steps up, say so (it is the late game's main pressure); it outranks
      // the danger banner, which repeats every floor while the cabin stays near a limit.
      const u = abyssStep(after.floor + 1), p = Math.round(outburstChance(after.floor + 1) * 100), fare = Math.round(u * DARK_RULES.extremeFarePerStep * 100);
      window.setTimeout(() => { banner(stage, zh ? `深渊 · 第 ${u} 级` : `The abyss · step ${u}`, zh ? `暗黑版更极端了：新上车的车费 +${fare}%，每位每层 ${p}% 会发作（+${DARK_RULES.outburstAgitation}躁动或吸电 ${DARK_RULES.outburstPower}）` : `Dark riders grow extreme: new ones pay +${fare}%, each lashes out ${p}% of floors (+${DARK_RULES.outburstAgitation} agitation or −${DARK_RULES.outburstPower} power)`, 'midnight', 3000); playSfx(on, 'bell'); flashClass(stage, 'midnight-strike', 1600); }, 260);
    } else if (after.status === 'playing' && (after.energy <= 3 || after.stress >= after.stressCap - 1) && !(before.energy <= 3 || before.stress >= before.stressCap - 1)) {
      // v9.20.2 (English playtest 4): only on entering danger; it used to repeat on every floor spent there.
      // v9.18.3: never on arriving at a shop (the shop refills and calms; the warning flashed over the shop screen).
      window.setTimeout(() => { banner(stage, zh ? '危！' : 'Danger!', after.energy <= 3 ? (zh ? `电量只剩 ${after.energy}` : `${after.energy} power left`) : (zh ? `躁动 ${after.stress}/${after.stressCap}` : `Agitation ${after.stress}/${after.stressCap}`), 'red', 1600); playSfx(on, 'heartbeat'); flashClass(stage, 'cabin-closecall', 1400); }, 260);
    } else if (districtFor(after.floor).from === after.floor && after.floor > 1) {
      const d = districtFor(after.floor);
      window.setTimeout(() => { banner(stage, d.name[zh ? 0 : 1], d.scene[zh ? 0 : 1], 'district', 2600); playSfx(on, 'district'); }, 260);
    }
    if (bandUp) { playSfx(on, 'rumble', { delay: .2 }); flashClass(stage, 'cabin-rumble', 900); }
  };
  // Development-only QA hook: read or replace the run, and present offers (used for browser checks of exact cabins).
  useEffect(() => { if (process.env.NODE_ENV === 'production') return; (window as unknown as { __elevatorQa?: unknown }).__elevatorQa = { run, setRun, presentOffers, offers, engine: QA_ENGINE, planPlacement }; }, [run, presentOffers, offers]);
  // v9.19 midnight events, each played once per new record (a floor settlement, a real-time blast or an item):
  // a Bomber's blast, corruption (violet) or purification (gold), and the Summoner's ghosts.
  const seenEvents = useRef({ blast: run.lastBlast, corruption: run.lastCorruption, summons: run.lastSummons, outbursts: run.lastOutbursts });
  useEffect(() => {
    const seen = seenEvents.current, on = soundEnabled.current, zh = language === 'zh', stage = document.querySelector('.elevator-stage'), seats = () => document.querySelectorAll('.standing-slot');
    // The shop covers the cabin on a shop floor: record the events but skip the seat effects.
    if (run.status === 'upgrade') { seenEvents.current = { blast: run.lastBlast, corruption: run.lastCorruption, summons: run.lastSummons, outbursts: run.lastOutbursts }; return; }
    // v9.20.1: a dark rider lashing out in the abyss: a red jolt on his seat.
    if (run.lastOutbursts?.length && seen.outbursts !== run.lastOutbursts) run.lastOutbursts.forEach((slot, k) => window.setTimeout(() => { const seat = seats()[slot] ?? null; flashClass(seat, 'is-outburst', 900); popText(seat, zh ? '发作！' : 'Lashes out!', 'red', true); playSfx(on, 'conflict'); }, 200 + k * 260));
    if (run.lastBlast && seen.blast !== run.lastBlast) {
      const b = run.lastBlast, bomberSeat = seats()[b.bomber] ?? stage;
      playSfx(on, 'explosion'); explode(bomberSeat); flashClass(stage, 'is-shaking', 900);
      b.slots.filter(i => i !== b.bomber).forEach(i => flashClass(seats()[i] ?? null, 'is-blasted', 1500));
      banner(stage, zh ? '炸了！' : 'BOOM!', zh ? `${b.slots.length} 人被炸下车 · 损失 ${b.coins} 金币` : `${b.slots.length} blown out · −${b.coins} coins`, 'red', 1900);
      if (b.coins) window.setTimeout(() => popText(document.querySelector('[data-metric="coins"]'), `−${b.coins}`, 'red', true), 500);
    }
    if (run.lastCorruption?.length && seen.corruption !== run.lastCorruption) run.lastCorruption.forEach((c, k) => {
      const seat = seats()[c.slot] ?? null, purified = !isDark(c.to);
      window.setTimeout(() => {
        flashClass(seat, purified ? 'is-purified' : 'is-corrupted', 1800); burstAt(seat, purified ? 'gold' : 'violet', 20, 90);
        popText(seat, purified ? (zh ? `净化 · 变回${riderName(c.to, 'zh')}` : `Purified · ${riderName(c.to, 'en')} again`) : (zh ? `被同化 · ${riderName(c.to, 'zh')}` : `Corrupted · now ${riderName(c.to, 'en')}`), purified ? 'gold' : 'violet', true);
        playSfx(on, purified ? 'calm' : 'rumble');
      }, 350 + k * 380);
    });
    if (run.lastSummons?.length && seen.summons !== run.lastSummons) run.lastSummons.forEach((slot, k) => {
      const seat = seats()[slot] ?? null, from = seats()[run.cabin.findIndex(r => r?.kind === 'summoner')] ?? null;
      if (from) flyCoin(from, seat, zh ? '召魂' : 'Summon', .3 + k * .3, 'ghost');
      window.setTimeout(() => { flashClass(seat, 'is-summoned', 1500); popText(seat, zh ? '幽灵被召来了' : 'A Ghost is summoned', 'violet'); playSfx(on, 'shimmer'); }, 900 + k * 300);
    });
    seenEvents.current = { blast: run.lastBlast, corruption: run.lastCorruption, summons: run.lastSummons, outbursts: run.lastOutbursts };
  }, [run.lastBlast, run.lastCorruption, run.lastSummons, run.lastOutbursts, run.cabin, run.status, language]);
  const celebrateRef = useRef(celebrateFloor);
  useEffect(() => { celebrateRef.current = celebrateFloor; });
  // Bookkeeping for a lost run (daily best, legend unlocks), shared by ascents and the real-time bomb timer.
  const settleLossRef = useRef<(lost: RunState, delivered: Partial<Record<PassengerKind, number>>, seen: KeepsakeKey[]) => void>(() => {});
  useEffect(() => {
    settleLossRef.current = (lost, delivered, seen) => {
      if (daily && lost.floor > dailyBest) { setDailyBest(lost.floor); try { localStorage.setItem(`elevator-tales-daily-best-${daily.key}`, String(lost.floor)); } catch { /* storage unavailable */ } }
      const unlocks = nextUnlocks(unlockedLegends, { floor: lost.floor, delivered, keepsakes: lost.keepsakes ?? [] }, seen); const fresh = unlocks.filter(k => !unlockedLegends.includes(k));
      if (fresh.length) { setUnlockedLegends(unlocks); saveList(LEGEND_UNLOCKS_KEY, unlocks); setNewLegends(fresh); }
    };
  });
  // v9.18 real-time Bomber timer: counts down while the doors are open and nothing pauses play (another tab, a shop,
  // a menu or the ability swap). Reading a rider card does not pause it.
  const bombAboard = BOMB_RULES.realtime && run.status === 'playing' && doors === 'open' && run.cabin.some(r => isBombKind(r?.kind) && r!.bombMs !== undefined);
  const bombPaused = intro || help || pressureHelp || archive || changelogOpen || inventoryOpen || receiptOpen || Boolean(run.pendingAbility);
  const lastBombSecond = useRef<number | null>(null);
  useEffect(() => {
    if (!bombAboard || bombPaused) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now(), ms = document.hidden ? 0 : now - last; last = now;
      setRun(current => tickBombs(current, ms));
    }, 200);
    return () => window.clearInterval(id);
  }, [bombAboard, bombPaused]);
  // Last ten seconds tick audibly; an explosion ends the run like a failed ascent.
  const lowestBombMs = run.cabin.reduce((min, r, i) => (isBombKind(r?.kind) && r!.bombMs !== undefined && !bombLocked(run.cabin, i) ? Math.min(min, r!.bombMs!) : min), Infinity);
  useEffect(() => {
    if (!Number.isFinite(lowestBombMs) || run.status !== 'playing') { lastBombSecond.current = null; return; }
    const second = Math.ceil(lowestBombMs / 1000);
    if (second <= 10 && second !== lastBombSecond.current) playSfx(soundEnabled.current, 'tick', { pitch: 10 - second });
    lastBombSecond.current = second;
  }, [lowestBombMs, run.status]);
  // The fuse crackles while a Bomber's timer runs.
  const bombBurning = bombAboard && !bombPaused && run.cabin.some((r, i) => isBombKind(r?.kind) && !bombLocked(run.cabin, i));
  useEffect(() => {
    if (!bombBurning) return;
    const id = window.setInterval(() => playSfx(soundEnabled.current, 'sizzle', { pitch: randomPitch(1) }), 420);
    return () => window.clearInterval(id);
  }, [bombBurning]);
  const explodedRef = useRef<RunState | null>(null);
  useEffect(() => {
    if (run.status !== 'lost' || explodedRef.current === run || !run.message.startsWith('炸弹倒计时归零') || busyRef.current) return;
    explodedRef.current = run;
    recordRef.current.push({ floor: run.floor, energy: run.energy, stress: run.stress, coins: run.coins, cabin: run.cabin.map(r => r ? [r.kind, r.destination - run.floor] : null), offers: offers.map(o => o.kind), arrivals: [], after: { energy: run.energy, stress: run.stress, coins: run.coins, status: 'lost' }, exploded: true });
    settleLossRef.current(run, runDelivered, keepsakesSeen);
    playSfx(soundEnabled.current, 'explosion');
    const stage = document.querySelector('.elevator-stage'), bombSeat = [...document.querySelectorAll('.standing-slot')].find(el => el.querySelector('.bomb-timer')) ?? stage;
    explode(bombSeat); flashClass(stage, 'is-shaking', 900);
    banner(stage, language === 'zh' ? '炸了！' : 'BOOM!', language === 'zh' ? '疯炸客的怪炸弹炸了' : 'The Mad Bomber’s contraption went off', 'red', 1600);
  }, [run, offers, runDelivered, keepsakesSeen, language]);
  const depart = useCallback(() => {
    if (locked || busyRef.current || run.pendingAbility) return;
    if (!run.cabin.some(Boolean)) { flash({tone:'error',label:'至少接一位乘客才能上行',slots:[]}); playTone(sound,'danger'); return; }
    if ((risk.fatal || stressFatal || gamble || strandedCourier) && !departArmed) { setDepartArmedFor(departSig); playTone(sound,'danger'); return; }
    const reduced = fastReveal || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    busyRef.current = true; setItemAim(null); setSelectedSlot(null); setPendingOfferId(null); setDragged(null); setDragOverSlot(null); setFeedback(null); setDoors('closing'); playTone(sound, 'depart'); playSfx(sound, 'doorClose'); playSfx(sound, 'hum', { delay: .3 });
    journeyTimers.current.forEach(clearTimeout);
    journeyTimers.current = [
      setTimeout(() => setDoors('moving'), reduced ? 30 : 250),
      setTimeout(() => {
        const resolved = resolveFloor(run, rngOf('resolve', run.floor), {}, rngOf('shop-draw', run.floor + 1)); let delivered = resolved;
        recordRef.current.push({ floor: run.floor, energy: run.energy, stress: run.stress, coins: run.coins, cabin: run.cabin.map(r => r ? [r.kind, r.destination - run.floor] : null), offers: offers.map(o => o.kind), arrivals: (resolved.lastArrivals ?? []).map(a => [a.kind, a.coins]), after: { energy: resolved.energy, stress: resolved.stress, coins: resolved.coins, status: resolved.status } });
        if (resolved.status === 'playing') { const batch=nextOfferBatch(resolved, rngOf('offers', resolved.floor)); delivered=batch.state; presentOffers(batch.offers); if (batch.offers.some((rider) => rider.calledByLover && rider.kind === 'lover') && resolved.lastPressure.delta <= 0) delivered = { ...delivered, message: '恋人的呼唤得到了回应。把两人安排在相邻站位。' }; else if (batch.offers.some((rider) => rider.calledByLover && rider.kind === 'exlover')) delivered = { ...delivered, message: '怨偶把前任叫来了：两人分开坐基价 ×2，挨着就吵。' }; }
        const deliveredNow = { ...runDelivered }; for (const a of resolved.lastArrivals ?? []) deliveredNow[a.kind] = (deliveredNow[a.kind] ?? 0) + 1; setRunDelivered(deliveredNow);
        const newStories = (resolved.lastArrivals ?? []).map(a => a.kind).filter((k, i, all) => !storiesUnlocked.includes(k) && all.indexOf(k) === i);
        if (newStories.length) { const next = [...storiesUnlocked, ...newStories]; setStoriesUnlocked(next); saveList(STORIES_KEY, next); }
        const seen = [...new Set([...keepsakesSeen, ...(resolved.keepsakes ?? [])])]; if (seen.length !== keepsakesSeen.length) { setKeepsakesSeen(seen); saveList(KEEPSAKES_SEEN_KEY, seen); }
        if (resolved.status === 'lost') settleLossRef.current(resolved, deliveredNow, seen);
        const exits=[...(resolved.lastArrivals??[]),...(resolved.lastIncident?[{...resolved.lastIncident,coins:0,incident:true}]:[])];
        setRun(delivered); setArriving(exits); setDoors('opening');
        journeyTimers.current.push(setTimeout(()=>{setArriving([]);setDoors('open');busyRef.current=false;if(!document.querySelector('[role="dialog"]')){if(window.matchMedia('(max-width:700px)').matches)clearJuice();scrollMobileTarget('.candidate-panel','start');}},exits.length?(reduced?800:1600):(reduced?40:260)));
        reportMetrics(run, resolved, `${resolved.floor} 层 · 到站结算`);
        flash({ tone: 'arrival', label: `${String(resolved.floor).padStart(2, '0')}F · 本层结算`, slots: [], coins: resolved.lastEarnings.total, energy: resolved.lastEnergy.delta, pressure: resolved.lastPressure.delta });
        playTone(soundEnabled.current, resolved.status === 'lost' ? 'danger' : 'arrive');
        celebrateRef.current(run, resolved);
      }, reduced ? 70 : 470),

    ];
  }, [locked, sound, run, flash, reportMetrics, fastReveal, presentOffers, runDelivered, keepsakesSeen, storiesUnlocked, rngOf, offers, risk.fatal, stressFatal, gamble, departArmed, departSig, strandedCourier]);
  // Arrival coins fly from each departing rider into the wallet. Purely decorative DOM, removed on finish.
  useEffect(() => {
    if (!arriving.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => {
      const wallet = document.querySelector('[data-metric="coins"]')?.getBoundingClientRect();
      if (!wallet || !wallet.width) return;
      let landed = 0; const total = arriving.reduce((sum, a) => sum + Math.max(0, a.coins), 0);
      const walletEl = document.querySelector('[data-metric="coins"]');
      // On a shop floor the shop covers the wallet; its own register counts the coins up instead (v9.18.4).
      if (statusRef.current !== 'upgrade') window.setTimeout(() => { flashClass(walletEl, 'wallet-bump', 600); popText(walletEl, `+${total}`, 'gold', total >= 20); if (total >= 20) { playSfx(soundEnabled.current, 'register'); burstAt(walletEl, 'gold', 18, 80); } }, 900);
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
          ], { duration: 820, delay: k * 70, easing: 'cubic-bezier(.45,0,.3,1)', fill: 'forwards' }).onfinish = () => { coin.remove(); playSfx(soundEnabled.current, 'clink', { pitch: Math.min(12, landed++) }); };
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
    playSfx(sound, 'stamp'); burstAt(document.querySelector(`.upgrade-grid button[data-key="${key}"]`), 'gold', 14, 70);
    const extra = run.shopUpgradeBought;
    reportMetrics(run, updated, `${extra ? '加购' : '选取'}${UPGRADES[key].name}`);
    setRun(updated); flash({ tone: 'combo', label: `${UPGRADES[key].name} · ${extra ? '已加购' : '已选取'}`, slots: [] }); playTone(sound, 'upgrade');
  };

  // v9.19 midnight bell: leaving the 60F shop, the lights fail, the cabin turns dark and the dark riders arrive.
  const ringMidnight = () => {
    const stage = document.querySelector('.elevator-stage'), zh = language === 'zh', on = soundEnabled.current;
    // Phones: the shop left the page at the waiting cards; bring the cabin into view so the bell is seen.
    scrollMobileTarget('.elevator-stage', 'center');
    window.setTimeout(() => { flashClass(stage, 'midnight-strike', 2400); banner(stage, zh ? '午夜钟声' : 'Midnight', zh ? '灯光一暗，上车的人都换了面目' : 'The lights dip; the riders are not who they were', 'midnight', 3200); playSfx(on, 'bell'); playSfx(on, 'rumble', { delay: .5 }); }, window.matchMedia('(max-width:700px)').matches ? 620 : 420);
  };
  const finishShopping = () => { if (upgradeCrisis) { const repaired = repairEmergency(run); if (repaired !== run) { setLeaveArmed(false); reportMetrics(run,repaired,'紧急维修'); setRun(repaired); return; } if (!leaveArmed) { setLeaveArmed(true); return; } } if(!upgradeCrisis && run.energy < chargePlan.baseline && !leaveArmed) {setLeaveArmed(true);return;} setLeaveArmed(false); const next = leaveShop(run); if (next === run) return; if(next.status==='lost'){const unlocks=nextUnlocks(unlockedLegends,{floor:next.floor,delivered:runDelivered,keepsakes:next.keepsakes??[]},keepsakesSeen);const fresh=unlocks.filter(k=>!unlockedLegends.includes(k));if(fresh.length){setUnlockedLegends(unlocks);saveList(LEGEND_UNLOCKS_KEY,unlocks);setNewLegends(fresh);}setRun(next);playTone(sound,'danger');} if (next.status === 'playing') {recordRef.current.push({ shop: run.floor, coins: run.coins, energy: run.energy, abilities: Object.entries(run.upgrades).filter(([,v])=>v).map(([k])=>k), box: boxOf(run), keepsakes: run.keepsakes ?? [] });const batch=nextOfferBatch(next, rngOf('offers', next.floor));setRun(batch.state);presentOffers(batch.offers);if(run.floor===DARK_RULES.midnightFloor)ringMidnight();} };

  const overtimeCharge = overtimeChargeOffer(run);
  const emergency = (units:number) => {const next=emergencyCharge(run,units);if(next===run)return;reportMetrics(run,next,language==='zh'?'途中补电':'In-transit charging');setRun(next);playTone(sound,'upgrade');};
  const failureCause = run.message.includes('炸弹倒计时') ? 'bomb' : run.energy<=0 && run.stress>=run.stressCap ? 'both' : run.energy<=0 ? 'power' : 'agitation';
  // v9.18.1 ending: before the result card, the cabin plays how the shift ended (power dies, a riot, or the bomb).
  const [endingShownFor, setEndingShownFor] = useState<RunState | null>(null);
  useEffect(() => {
    if (run.status !== 'lost' || doors !== 'open') return;
    const stage = document.querySelector('.elevator-stage'), cls = `ending-${failureCause === 'both' ? 'power' : failureCause}`;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    stage?.classList.add(cls);
    if (failureCause !== 'bomb') playSfx(soundEnabled.current, failureCause === 'agitation' ? 'rumble' : 'hum');
    const t = window.setTimeout(() => setEndingShownFor(run), reduced ? 250 : 1700);
    return () => { window.clearTimeout(t); stage?.classList.remove(cls); };
  }, [run, doors, failureCause]);
  const copyText = (text: string, label: string) => { try { void navigator.clipboard.writeText(text).then(()=>setCopied(label),()=>setCopied('manual:'+text)); } catch { setCopied('manual:'+text); } };
  const shareLine = () => language==='zh' ? `Elevator Tales ${daily?`每日班次 ${daily.key}`:'无尽夜班'}：到达 ${run.floor} 层（${({bomb:'炸弹倒计时归零',both:'电量与躁动同时失控',power:'电量耗尽',agitation:'躁动失控'} as Record<string,string>)[failureCause]}）` : `Elevator Tales ${daily?`daily shift ${daily.key}`:'endless shift'}: reached floor ${run.floor} (${({bomb:'bomb timer',both:'power and agitation',power:'out of power',agitation:'agitation'} as Record<string,string>)[failureCause]})`;
  const runRecordJson = () => JSON.stringify({ game: 'Elevator Tales', version: GAME_VERSION, daily: daily?.key ?? null, floor: run.floor, cause: failureCause, coins: run.coins, earned: run.earned, upgrades: Object.entries(run.upgrades).filter(([,v])=>v).map(([k])=>k), box: boxOf(run), keepsakes: run.keepsakes ?? [], legend: run.legendOffer ?? null, legendStatus: run.legendStatus ?? null, floors: recordRef.current }, null, 1);
  const recharge = (units:number) => {const next=chargeBattery(run,units);if(next===run)return;setLeaveArmed(false);reportMetrics(run,next,'商店充电');setRun(next);playTone(sound,'upgrade');
    // v9.18.3 shop feedback: the power panel glows and shows what was added.
    const panel=document.querySelector('.upgrade-dialog .shop-power');flashClass(panel,'is-charged',700);burstAt(panel,'blue',14,70);popText(panel,language==='zh'?`+${next.energy-run.energy} 电`:`+${next.energy-run.energy} power`,'blue');playSfx(sound,'calm');};
  const confirmDismiss = () => {
    if(!detailRider||!canDismiss)return;
    const updated=dismissRider(run,detailRider.id);if(updated===run)return;
    reportMetrics(run,updated,'请离赔偿');setRun(updated);setPassengerDetails(null);setEjectArmed(false);setSelectedSlot(null);setPendingOfferId(null);
    flash({tone:'place',label:`已请离 · 赔偿 ${penalty} 金币`,slots:[]});playTone(sound,'place');
  };

  // v9.18.3: one pass over the adjacent pairs feeds both the link lines (SVG) and their labels (an HTML layer above
  // the seats, so labels are never stretched by the SVG's aspect ratio or hidden behind a portrait).
  const linkPreviewing=Boolean(hoveredPlan?.ok&&hoveredPlan.changed);
  const linkCabin=linkPreviewing?hoveredPlan!.next.cabin:run.cabin;
  const edgeView=ADJACENT.map(([first,second])=>{
    const active=activeConnection(run.cabin,first,second); const currentConflict=conflictLinks(run.cabin).find(link=>link.first===first&&link.second===second);
    const preview=linkPreviewing&&activeConnection(linkCabin,first,second);
    const previewConflict=linkPreviewing?conflictLinks(linkCabin).find(link=>link.first===first&&link.second===second):undefined;
    // v9.19 corruption link: violet from a dark rider to the normal rider he is turning (two or more dark neighbours).
    const turning=(i:number,j:number)=>{const r=linkCabin[i],d=linkCabin[j];return Boolean(r&&d&&isDark(d.kind)&&corruptible(r.kind)&&!r.warded&&neighbours(i).filter(k=>linkCabin[k]&&isDark(linkCabin[k]!.kind)).length>=DARK_RULES.corruptionNeighbours);};
    const corrupt=turning(first,second)||turning(second,first);
    return { first, second, corrupt, shownActive: linkPreviewing?preview:active, steal: stealLink(linkCabin,first,second), partnership: riskPartnerships(linkCabin).edges.some(([a,b])=>a===first&&b===second), copy: copyConnection(linkCabin,first,second), shownConflict: linkPreviewing?previewConflict:currentConflict, previewEdge: shouldPreviewConnection(linkPreviewing,active,preview,currentConflict?.effect??null,previewConflict?.effect??null) };
  });
  const zhUI=language==='zh';
  const coinWord=zhUI?'金币':'coins';
  const conflictLabel=(effect:ConflictEffect)=>({
    agitation:<span className="ll-part ll-agitation"><Flame aria-hidden="true"/>+1</span>,
    energy:<span className="ll-part ll-energy"><BatteryCharging aria-hidden="true"/>−1</span>,
    coins:<span className="ll-part ll-loss"><Coins aria-hidden="true"/>−2 {coinWord}</span>,
    overload:<span className="ll-part ll-energy"><BatteryCharging aria-hidden="true"/>×2</span>,
    gamble:<span className="ll-part ll-energy"><BatteryCharging aria-hidden="true"/>×2 · {zhUI?'基价+100%':'base +100%'}</span>,
  }[effect]);
  const linkLabels=edgeView.flatMap(e=>{
    const parts=[e.partnership&&<span key="p" className="ll-part ll-agitation"><Flame aria-hidden="true"/>+1</span>, e.shownConflict&&<span key="c">{conflictLabel(e.shownConflict.effect)}</span>, e.steal==='box'?<span key="s" className="ll-part ll-steal"><Package aria-hidden="true"/>{zhUI?'偷纸箱':'takes box'}</span>:e.steal?<span key="s" className="ll-part ll-steal"><Coins aria-hidden="true"/>+{e.steal} {coinWord}</span>:null].filter(Boolean);
    if(!parts.length)return [];
    const [x1,y1]=CONNECTION_POINTS[e.first],[x2,y2]=CONNECTION_POINTS[e.second];
    return [<span key={`${e.first}-${e.second}`} className={`link-label ${e.steal?'is-steal':''} ${x1===x2?'is-vertical':''}`} style={{left:`${(x1+x2)/6}%`,top:`${(y1+y2)/4}%`}}>{parts}</span>];
  });
  const content = <main className={`game-shell ${cooperationRelief(run) ? 'has-contract' : ''} ${difficultyTier(run.floor) % 2 ? 'phase-dawn' : ''}`}>
    <div className="ambient-grain" />
    <div className="rotate-notice"><RotateCcw/><h2>请竖屏游玩</h2><p>这个横屏尺寸太矮，转回竖屏即可继续；本班进度保留。</p></div>
    <header className="brand-bar"><div><p className={`eyebrow ${daily?'eyebrow-daily':''}`} data-no-translate>{daily?(language==="zh"?`每日班次 · ${daily.key} · 今天所有人同一套乘客`:`DAILY SHIFT · ${daily.key} · same riders for everyone today`):"AN ENDLESS NIGHT SHIFT"}</p><h1>Elevator Tales</h1></div><div className="brand-actions"><button className="language-button" data-no-translate onClick={toggleLanguage} aria-label={language === 'en' ? 'Switch to Chinese' : '切换为英文'}>{language === 'en' ? '中文' : 'EN'}</button><button className="version-button" onClick={() => setChangelogOpen(true)} aria-label={`查看 v${GAME_VERSION} 更新记录`}><History /><span>v{GAME_VERSION}</span></button><button className="icon-button reveal-toggle" aria-label={fastReveal ? '快速开门：开' : '快速开门：关'} title={fastReveal ? '快速开门：开' : '快速开门：关'} aria-pressed={fastReveal} onClick={() => { const next = !fastReveal; setFastReveal(next); localStorage.setItem('elevator-tales-fast-reveal-v1', next ? 'on' : 'off'); }}><ChevronsUp /></button><button className="icon-button" onClick={() => setHelp(true)} aria-label="玩法说明"><HelpCircle /></button><button className={`icon-button music-button ${music ? '' : 'is-muted'}`} onClick={toggleMusic} aria-label={music ? '关闭音乐' : '打开音乐'} aria-pressed={!music} title={music ? '关闭音乐' : '打开音乐'}><Music2 /></button><button className="icon-button" onClick={() => { soundEnabled.current = !sound; if (sound) disposeGameAudio(); else preloadSfx(); setSound(!sound); localStorage.setItem(SOUND_PREFERENCE_KEY, sound ? 'off' : 'on'); }} aria-label={sound ? '关闭音效' : '打开音效'} title={sound ? '关闭音效' : '打开音效'}>{sound ? <Volume2 /> : <VolumeX />}</button><button className="icon-button inventory-button" onClick={() => setInventoryOpen(true)} aria-label={`查看已装升级，共 ${upgradeCount} 次`}><Layers /><span>{upgradeCount}</span></button><button className="text-button" onClick={() => setArchive(true)}>乘客档案 <span>{String(discovered.filter(kind=>PASSENGER_ORDER.includes(kind)).length).padStart(2, '0')} / {PASSENGER_ORDER.length}</span></button></div></header>
    <section className="game-grid">
      <aside className="status-rail">
        <div className="floor-plaque"><span data-no-translate>{language==='zh'?`当前楼层 · 最高 ${bestFloor}`:`CURRENT FLOOR · BEST ${bestFloor}`}</span><strong>{String(run.floor).padStart(2, '0')}</strong><small>{phase}</small><span className="route-power">运转 {travelEnergyCost(run.floor+1)} 电 / 层</span><span className="route-notice">{motorAdvanceNotice(run.floor)}</span><progress className="floor-progress" aria-label={`距离 ${nextShop} 层商店还有 ${nextShop - run.floor} 站`} max={10} value={run.floor % 10} /></div>
        <div data-metric="energy" className={`meter-card energy ${energyFatal ? 'meter-danger' : ''}`} title={`${energyPreview.summary} · ${language==='zh'?`运转 ${travelEnergyCost(run.floor+1)} 电/层`:`motor ${travelEnergyCost(run.floor+1)}/floor`}${nextIsShop?'':` · ${motorAdvanceNotice(run.floor)}`}`}><div><BatteryCharging aria-hidden="true" /><span className="rail-metric-name">电量</span><b><AnimatedNumber value={run.energy} /><span className="metric-cap">/{run.energyCap}</span></b></div><MetricResponse metric="energy" event={metricEvent} locale={language} /><PowerGauge value={run.energy} cap={run.energyCap} next={run.energy + energyPreview.lowDelta} danger={Math.max(1, -energyPreview.lowDelta)} locale={language} /><small className="rail-forecast rail-power-line" data-no-translate><span>{language==='zh'?'下一站':'Next'} <b className={energyFatal ? 'forecast-fatal' : ''}>{language==='zh'?energyPreview.range:translateGameText(energyPreview.range,'en')}</b></span>{run.status==='playing'&&<span className={`sector-forecast ${sector.failFloor!==null?'is-danger':sector.projected<8?'is-warn':''}`}>{language==='zh'?(sector.failFloor!==null?`${sector.failFloor} 层断电`:`到店剩 ${sector.projected}`):(sector.failFloor!==null?`out at ${sector.failFloor}F`:`${sector.projected} at shop`)}</span>}</small>
          {run.status==='playing'&&(sector.failFloor!==null||sector.projected<12||energyFatal)&&<div className="emergency-charge" data-no-translate title={language==='zh'?`本段还可补 ${emergencySectorLeft(run)} 电 · 途中价 ${emergencyPrice} 币/电`:`${emergencySectorLeft(run)} left this sector · ${emergencyPrice} coins each`}>
            {(()=>{const units=emergencyNeed>0?Math.max(1,Math.min(emergencyNeed,Math.floor(run.coins/emergencyPrice))):1;return <button className={emergencyNeed>0?'is-urgent':''} disabled={locked||emergencyLeft<units||run.coins<units*emergencyPrice} onClick={()=>emergency(units)}>{language==='zh'?`补电 +${units} · ${units*emergencyPrice}币`:`Charge +${units} · ${units*emergencyPrice}c`}</button>;})()}
          </div>}
</div>
        <div data-metric="stress" className={`meter-card pressure ${agitated || pressurePreview.tone === 'danger' ? 'meter-danger' : ''}`} title={pressurePreview.summary}>
          <div><Flame aria-hidden="true" /><span className="meter-label"><span className="rail-metric-name">躁动</span><button className="meter-help" onClick={() => setPressureHelp(true)} aria-label="查看躁动规则"><HelpCircle /></button></span><b><AnimatedNumber value={run.stress} /><span className="metric-cap">/{run.stressCap}</span></b></div>
          <MetricResponse metric="stress" event={metricEvent} locale={language} />
          <AgitationGauge value={run.stress} cap={run.stressCap} nextLow={run.stress+pressurePreview.lowDelta} nextHigh={run.stress+pressurePreview.highDelta} locale={language}/>
          <small className="rail-forecast"><span>下一站 <b className={stressFatal ? 'forecast-fatal' : ''}>{pressurePreview.range}</b></span>{Math.round(gambleChance*100)>0&&<span className="rail-gamble" data-no-translate>{language==='zh'?`失控 ${Math.round(gambleChance*100)}%`:`Boil-over ${Math.round(gambleChance*100)}%`}</span>}{run.status==='playing'&&agitationBand(run.stress)==='high'&&run.cabin.some(r=>r&&!isAnyLegend(r.kind)&&r.kind!=='parcel')&&<span className="rail-incident" data-no-translate title={language==='zh'?`高躁动出发：这一层有 ${Math.round(V9_AGITATION.incidentChance*100)}% 会有一位乘客受不了、提前下车，不付车费。`:`Leaving at high agitation: a ${Math.round(V9_AGITATION.incidentChance*100)}% chance this floor that one rider has had enough and leaves early without paying.`}>{language==='zh'?`事故 ${Math.round(V9_AGITATION.incidentChance*100)}%`:`Incident ${Math.round(V9_AGITATION.incidentChance*100)}%`}</span>}{shopFixNeeded&&<span className="rail-shop-fix" data-no-translate title={language==='zh'?`到商店时躁动可能到上限：商店里先用手动调节，再用紧急维修（${SOOTHE_PRICE}币/点）降到上限以下，才能继续上行。`:`You may reach the shop at the agitation cap: use the manual relief there, then the emergency repair (${SOOTHE_PRICE}c a point) to get back under it before leaving.`}>{language==='zh'?'到店要降躁动':'Calm it at the shop'}</span>}</small>
          {(pressurePreview.sources?.length??0)>0&&<div className="agitation-sources" data-no-translate>{pressurePreview.sources!.slice(0,5).map(src=><span key={src.label} className={src.amount>0?'is-up':'is-down'}>{translateGameText(src.label,language)}{src.count>1?` ×${src.count}`:''} {src.amount>0?'+':''}{src.amount}</span>)}</div>}
          {run.status==='playing'&&calmLeft>0&&(stressFatal||agitationBand(run.stress)!=='low')&&(()=>{const units=Math.min(calmLeft,Math.max(1,calmNeed));return <div className="emergency-charge calm-charge" data-no-translate title={language==='zh'?`本段还可安抚 ${calmLeft} 点 · ${calmPrice(run.floor)} 币/点`:`${calmLeft} left this sector · ${calmPrice(run.floor)} coins each`}><button className={stressFatal?'is-urgent':''} disabled={locked} onClick={()=>calm(units)}>{language==='zh'?`安抚 −${units} · ${units*calmPrice(run.floor)}币`:`Calm −${units} · ${units*calmPrice(run.floor)}c`}</button></div>;})()}
          {run.status==='playing'&&calmLeft<1&&overtimePrice!==null&&(stressFatal||agitationBand(run.stress)!=='low')&&<div className="emergency-charge calm-charge" data-no-translate title={language==='zh'?'本段安抚额度已用完 · 加急安抚每点更贵':'Calming allowance spent · each overtime point costs more'}><button className={stressFatal?'is-urgent':''} disabled={locked||!overtimeOk} onClick={overtimeCalm}>{language==='zh'?`加急安抚 −1 · ${overtimePrice}币`:`Overtime calm −1 · ${overtimePrice}c`}</button></div>}
        </div>
        <div data-metric="coins" className="score-card wallet-card"><Coins aria-hidden="true" /><span className="rail-metric-name">余额</span><strong><RegisterNumber value={run.coins} /></strong><MetricResponse metric="coins" event={metricEvent} locale={language} /><span className={`mobile-shop-note ${nextIsShop ? 'shop-next' : ''}`}>{nextIsShop ? '下一层：商店' : `距商店 ${nextShop - run.floor} 层`}</span><small className={`wallet-summary ${nextIsShop ? 'shop-next' : ''}`}>{nextIsShop ? '下一层：商店' : `距商店 ${nextShop - run.floor} 层`}</small></div>

        {((run.serviceTurns??0)>0||run.upgrades.buffer>0||run.upgrades.punchcard>0)&&<div className="rail-chips" data-no-translate>{(run.serviceTurns??0)>0&&<span title={language==='zh'?'检修生效：运转少耗 1 电/层':'Repair: motor −1 per floor'}>{language==='zh'?`检修 −1 · 余${run.serviceTurns}层`:`Repair −1 · ${run.serviceTurns} left`}</span>}{run.upgrades.buffer>0&&<span title={language==='zh'?'惯性飞轮本段还能省的电，到商店重置':'Flywheel saving left this sector'}>{language==='zh'?`飞轮 ${flywheelAllowance(run)}/${boosted(run,'buffer',SHOP_TUNING.bufferFlywheelSectorCap)}`:`Flywheel ${flywheelAllowance(run)}/${boosted(run,'buffer',SHOP_TUNING.bufferFlywheelSectorCap)}`}</span>}{run.upgrades.punchcard>0&&<span title={language==='zh'?'每送达第 5 位乘客额外得其基价':'Every 5th delivery pays its base fare again'}>{language==='zh'?`第五张票 ${(run.punchCount??0)+1}/5`:`Fifth ticket ${(run.punchCount??0)+1}/5`}</span>}</div>}
        <div className="run-tools">
        {run.abyssEvents&&run.floor>=ABYSS_EVENTS.shopFloor&&run.floor<=ABYSS_EVENTS.to&&<div className="abyss-schedule" data-no-translate><span className="abyss-schedule-label">{language==='zh'?'深渊前夜':'Eve of the abyss'}</span><div className="abyss-schedule-list">{run.abyssEvents.map(e=><span key={e.floor} className={`abyss-event abyss-${e.kind} ${e.floor===run.floor?'is-now':e.floor<run.floor?'is-past':''}`} title={abyssEventRule(e.kind,language)}>{e.floor}F {abyssEventName(e.kind,language)}</span>)}</div>{(()=>{const now=abyssEventAt(run,run.floor);return now&&run.status==='playing'?<p className="abyss-event-now">{language==='zh'?`本层 · ${abyssEventName(now,'zh')}：${abyssEventRule(now,'zh')}`:`This floor · ${abyssEventName(now,'en')}: ${abyssEventRule(now,'en')}`}</p>:null;})()}</div>}
        {run.status==='playing'&&run.marketFloor===run.floor&&run.marketStock&&<div className="night-market" data-no-translate><span className="item-bag-label">{language==='zh'?`夜市 · 道具 ${run.items?.length??0}/${ITEM_SLOTS}`:`Night market · items ${run.items?.length??0}/${ITEM_SLOTS}`}</span><div className="night-market-stall">{run.marketStock.map((card,i)=><button key={`${card.key}-${i}`} disabled={locked||card.sold||run.coins<card.price||(run.items?.length??0)>=ITEM_SLOTS} onClick={()=>{const next=buyMarketItem(run,i);if(next!==run){reportMetrics(run,next,language==='zh'?'夜市':'Night market');setRun(next);playTone(sound,'upgrade');}}} title={language==='zh'?`${ITEMS[card.key].name}：${ITEMS[card.key].zh}`:`${ITEMS[card.key].en}: ${ITEMS[card.key].enText}`}><span className="item-icon" style={{backgroundImage:`url(${shopIcon(`item-${card.key}`)})`}} aria-hidden="true" /><span className="item-name">{language==='zh'?ITEMS[card.key].name:ITEMS[card.key].en}</span><b>{card.sold?(language==='zh'?'已买':'Sold'):`${card.price}${language==='zh'?' 币':'c'}`}</b></button>)}</div></div>}
        {(run.items?.length??0)>0&&<div className="item-bag" data-no-translate><span className="item-bag-label">{language==='zh'?`道具 ${run.items!.length}/${ITEM_SLOTS}`:`Items ${run.items!.length}/${ITEM_SLOTS}`}</span><div className="item-bag-slots">{run.items!.map((key,i)=><button key={`${key}-${i}`} data-item={key} className={`item-chip ${itemAim===key?'is-aiming':''}`} disabled={locked||run.status!=='playing'||!itemReady(key)} onClick={()=>pickItem(key)} title={language==='zh'?`${ITEMS[key].name}：${ITEMS[key].zh}`:`${ITEMS[key].en}: ${ITEMS[key].enText}`}><span className="item-icon" style={{backgroundImage:`url(${shopIcon(`item-${key}`)})`}} aria-hidden="true" /><span className="item-name">{language==='zh'?ITEMS[key].name:ITEMS[key].en}</span></button>)}</div>{itemAim&&<p className="item-aim-hint">{language==='zh'?`${ITEMS[itemAim].name}：点一位发光的乘客（${ITEMS[itemAim].zh}）`:`${ITEMS[itemAim].en}: tap a glowing rider (${ITEMS[itemAim].enText})`}<button type="button" onClick={()=>setItemAim(null)}>{language==='zh'?'取消':'Cancel'}</button></p>}</div>}
        {run.calmCharge&&<button className="reserve-use" disabled={locked||run.stress<=0} onClick={()=>{const next=applyCalmCharge(run);setRun(next);reportMetrics(run,next,'手动调节');}}>{language==='zh'?'手动调节 −3躁动 · 每店补满':'Manual relief −3 · refills at shops'}</button>}
        {oldMovesRemaining(run)<2&&<p className="route-note">旧乘客换位剩余{oldMovesRemaining(run)}次</p>}
        {run.reservedRider&&<p className="route-note">已留座：{PASSENGERS[run.reservedRider.kind].name} · 下一批到来</p>}
        {run.reserveCell&&<button className="reserve-use" disabled={locked||run.energy>=run.energyCap} onClick={()=>{const next=consumeReserveCell(run);if(next!==run){setRun(next);reportMetrics(run,next,'使用应急电池');}}}><BatteryCharging aria-hidden="true"/>{`使用应急电池 +${Math.min(RESERVE_CELL_CHARGE,Math.max(0,run.energyCap-run.energy))}电`}</button>}
        {(run.upgrades.retime>0||run.upgrades.dispatch>0)&&<div className="retime-controls"><p>{run.upgrades.dispatch>0?`调度印章 · 本段还剩 ${dispatchRemaining(run)} 次 · 选中本层新上车的人改路程`:'改签 · 每十层一次'}</p>{[-1,1].map(delta=><button key={delta} disabled={locked||!activeRider||activeRider.boardedAt!==run.floor||!run.cabin.some(r=>r?.id===activeRider.id)||(run.upgrades.dispatch>0?dispatchRemaining(run)<1:run.retimeUsedSector===Math.floor(run.floor/10))||(delta<0&&activeRider.destination<=run.floor+1)} onClick={()=>{if(activeRider){const next=retimeRider(run,activeRider.id,delta);setRun(next);}}}>{delta<0?'提前1站':'延后1站'}</button>)}</div>}
        </div>
        {metricEvent && <button className="receipt-button" onClick={() => setReceiptOpen(true)}><BookOpen /> 本次变化明细 <span>↗</span></button>}
        <div className="event-log">{run.log.slice(0, 3).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div>
      </aside>
      <section className={`elevator-stage doors-${doors} ${run.floor > DARK_RULES.midnightFloor || (run.floor === DARK_RULES.midnightFloor && run.status === 'playing') ? 'is-midnight' : ''} ${activeRider ? 'is-placing' : ''} ${agitated ? 'cabin-agitated' : ''} ${run.status==='playing'&&risk.fatal ? 'power-fatal' : run.status==='playing'&&run.energy + energyPreview.lowDelta <= LOW_POWER_FLICKER ? 'power-low' : ''}`} data-district={districtFor(run.floor).id} style={{ '--shake': (0.6 + 2.6 * Math.min(1, run.stress / Math.max(1, run.stressCap))).toFixed(2) } as CSSProperties} aria-label="电梯座舱" aria-busy={doors !== 'open'}>
        <div className="elevator-image" /><div className="district-light" aria-hidden="true" /><div className="cabin-flicker" aria-hidden="true" /><div className="motion-lines" /><div className="floor-indicator"><ArrowUp /><b key={run.floor}>{String(run.floor).padStart(2, '0')}</b></div>{run.status==='playing'&&bestFloor>run.floor&&bestFloor-run.floor<=10&&<div className="record-gap" data-no-translate>{language==='zh'?`距纪录 ${bestFloor-run.floor} 层`:`${bestFloor-run.floor} to record`}</div>}<div className="district-tag" data-no-translate>{districtFor(run.floor).name[language==='zh'?0:1]}</div>
        {outlook && <div className={`adjacency-key shift-outlook ${nextIsShop ? 'shop-next-outlook' : 'peak-outlook'}`}><span>{outlook}</span><span className="connection-legend">绿线协作 · 红线代价 · 紫箭头复制</span></div>}
        {feedback && (feedback.tone!=='arrival'||arriving.length===0) && <output key={feedback.id} className={`cabin-feedback feedback-${feedback.tone}`}>
          <div className="feedback-label">{feedback.tone === 'error' ? <X /> : feedback.tone === 'combo' ? <Sparkles /> : <Check />}<b>{feedback.label}</b></div>
          {feedback.tone === 'arrival' && <div className="feedback-values">{Boolean(feedback.coins) && <span className="value-coins" aria-label={`金币增加 ${feedback.coins}`}><Coins aria-hidden="true" />{signedDelta(feedback.coins ?? 0)}</span>}<span aria-label={`电量 ${signedDelta(feedback.energy ?? 0)}`} className={feedback.energy! > 0 ? 'value-gain' : feedback.energy! < 0 ? 'value-spent' : 'value-neutral'}><BatteryCharging aria-hidden="true" />{signedDelta(feedback.energy ?? 0)}</span><span aria-label={`躁动 ${signedDelta(feedback.pressure ?? 0)}`} className={feedback.pressure! > 0 ? 'value-danger' : feedback.pressure! < 0 ? 'value-gain' : 'value-neutral'}><Flame aria-hidden="true" />{signedDelta(feedback.pressure ?? 0)}</span></div>}
          {feedback.tone === 'arrival' && <p className="feedback-cause">{[earningSummary,positiveEnergySummary||(!earningSummary?energySummary:''),pressureSummary].filter(Boolean).join(' · ')}</p>}
        </output>}
        {doors === 'moving' && <div className="travel-caption"><ArrowUp />前往 {String(run.floor + 1).padStart(2, '0')}F</div>}
        <div className="standing-grid"><svg className="adjacency-map" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">{edgeView.map(({ first, second, corrupt, shownActive, steal, partnership, copy, shownConflict, previewEdge }) => {
          const [x1,y1]=CONNECTION_POINTS[first]; const [x2,y2]=CONNECTION_POINTS[second];
          return <g key={`${first}-${second}`} className={`connection-path ${corrupt ? 'corrupt-link' : ''} ${shownActive ? 'active' : ''} ${steal ? 'steal-link' : ''} ${partnership ? 'partnership-link' : ''} ${copy?'copy-link':''} ${shownConflict?'conflict-link':''} ${previewEdge ? 'preview-link' : ''}`}><line className="connection-underlay" x1={x1} y1={y1} x2={x2} y2={y2}/><line className="connection-core" x1={x1} y1={y1} x2={x2} y2={y2}/>{(shownActive||shownConflict||steal)&&!copy&&<circle className="connection-node" cx={(x1+x2)/2} cy={(y1+y2)/2} r="3"/>}{copy&&<path className="copy-direction" d={`M ${x1-5} 104 L ${x1} 96 L ${x1+5} 104`}/>}</g>;
        })}</svg>{run.cabin.map((rider, index) => {
          const state = riderState(run.cabin, index, cooperationBonus(run), run.stress, run.floor); const plan = placementPlans[index]; const synergy = plan?.ok && plan.changed && plan.tone === 'combo'; const agitation=riderAgitation(run,index); const seatBrief=rider?{...passengerBrief(rider,run.floor,run.cabin,cooperationBonus(run),cooperationRelief(run),eventPressureMultiplier(run),run.stress),energy:seatEnergyCosts[index].total}:null;
          const target = Boolean(activeRider) && (dragOverSlot === index || (isBigParcel(activeRider) && dragOverSlot !== null && dragOverSlot % 3 === index % 3)); const reaction = feedback?.slots.includes(index) ? feedback : null;
          const agitationValue=agitation.low===agitation.high?signedDelta(agitation.low):`${signedDelta(agitation.low)}～${signedDelta(agitation.high)}`;
          const compactAgitationValue=agitation.low===agitation.high?compactDelta(agitation.low):`${compactDelta(agitation.low)}～${compactDelta(agitation.high)}`;
          // v9.19 corruption on show: a normal rider surrounded by dark riders is wreathed in violet mist that thickens each floor.
          const corruptStep = rider && corruptible(rider.kind) && !rider.warded && neighbours(index).filter(i => run.cabin[i] && isDark(run.cabin[i]!.kind)).length >= DARK_RULES.corruptionNeighbours ? (rider.corruption ?? 0) + 1 : 0;
          return <div key={index} className="standing-slot-wrap"><button disabled={locked} className={`standing-slot ${rider && (isDark(rider.kind) || rider.contraband) ? 'seat-dark' : ''} ${corruptStep ? `seat-corrupting corrupt-step-${Math.min(corruptStep, DARK_RULES.corruptionFloors)}` : ''} ${rider?.warded ? 'seat-warded' : ''} ${itemAim ? rider && itemUsable(run, itemAim, rider) ? 'item-target' : 'item-dim' : ''} ${rider?.big ? 'seat-crate' : ''} ${rider ? `category-${passengerCategory(rider.kind)} seat-grade-${riderCardGrade(rider)}` : ''} ${rider ? 'occupied' : ''} ${rider?.boardedAt === run.floor ? 'newly-boarded' : ''} ${synergy ? 'synergy-target' : ''} ${plan ? plan.ok ? 'drop-valid' : 'drop-blocked' : ''} ${selectedSlot === index ? 'selected' : ''} ${target ? 'drag-target' : ''}`} onClick={() => clickSlot(index)} draggable={false} onPointerDown={(event) => { if (rider && !locked && (!run.swapped || rider.boardedAt === run.floor)) pointerDrag(event, { type: 'slot', slot: index }, rider); }} onMouseEnter={() => activeRider && window.matchMedia('(min-width: 701px) and (hover: hover)').matches && setDragOverSlot(index)} onMouseLeave={() => !dragged && setDragOverSlot(null)} onDragOver={(event) => { if (!locked && dragged) { event.preventDefault(); event.dataTransfer.dropEffect = plan?.ok ? 'move' : 'none'; setDragOverSlot(index); } }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOverSlot((current) => current === index ? null : current); }} onDrop={(event) => dropOnSlot(event, index)} aria-label={rider ? `${index + 1}号位，${PASSENGERS[rider.kind].name}，到站收益${seatBrief?.expectedFare??'未知'}，每站耗电${seatBrief?.energy}，下一站躁动${agitationValue}${state ? `，${state.label}` : ''}` : `${index + 1}号空位${synergy ? '，可联动' : ''}`}>
            {rider?.big ? <span className="crate-half" aria-hidden="true" /> : rider && seatBrief ? <motion.span className={`rider-visual ${isBombKind(rider.kind)?'rider-bomb':''} ${rider.volatile?'rider-high-risk':''}`} key={rider.id} initial={reduceMotion ? false : { opacity: 0, scale: 1.04, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 520, damping: 34 }}>{(riderCardGrade(rider)==='rare'||riderCardGrade(rider)==='legendary')&&<CardShader legendary={riderCardGrade(rider)==='legendary'} />}<span className="seat-heading"><span className="rider-name" data-no-translate>{displayName(rider,language)}{riderCardGrade(rider)!=='standard'&&<span className={`card-gem gem-${riderCardGrade(rider)}`} aria-hidden="true" />}</span>{rider.volatile&&<span className="seat-risk-tag" title="急躁的乘客：车费更高，但在车上每层 +1 躁动；护士相邻可以抵消"><Flame aria-hidden="true" />急躁</span>}{isDark(rider.kind)&&outburstChanceAt(run)>0&&<span className="seat-risk-tag seat-outburst-tag" data-no-translate title={language==='zh'?`深渊：每层 ${Math.round(outburstChanceAt(run)*100)}% 发作（${outburstIsPower(rider.kind)?`吸电 ${DARK_RULES.outburstPower}`:`+${DARK_RULES.outburstAgitation} 躁动`}）；照明弹、镇静剂能压住`:`Abyss: ${Math.round(outburstChanceAt(run)*100)}% a floor to lash out (${outburstIsPower(rider.kind)?`−${DARK_RULES.outburstPower} power`:`+${DARK_RULES.outburstAgitation} agitation`}); a Flare or a Sedative holds it off`}>{(rider.sedated??0)>0||run.flareFloor===run.floor?(language==='zh'?'压住了':'Held'):`${Math.round(outburstChanceAt(run)*100)}%`}</span>}</span><span className="slot-destination">{stopsLeft(Math.max(0, rider.destination - run.floor), language)}</span>{corruptStep>0&&<span className="seat-corrupt-pill" data-no-translate>{language==='zh'?`同化 ${Math.min(corruptStep, DARK_RULES.corruptionFloors)}/${DARK_RULES.corruptionFloors}`:`Turning ${Math.min(corruptStep, DARK_RULES.corruptionFloors)}/${DARK_RULES.corruptionFloors}`}</span>}<span className="seat-art"><Portrait kind={rider.kind} rider={rider} large />{(rider.cuffed||rider.alarm||rider.warded||rider.sealed||(rider.sedated??0)>0)&&(()=>{/* v9.20.6 (English playtest 21): item effects on a seat were only in the state line, which short phone seats hide. */const zh=language==='zh';const names=[rider.sealed&&(zh?'贴了封条':'Sealed'),rider.cuffed&&(zh?'手铐':'Handcuffs'),rider.alarm&&(zh?'闹钟':'Alarm Clock'),rider.warded&&(zh?'不会被同化':'Protected from corruption'),(rider.sedated??0)>0&&(zh?`镇静剂 · ${rider.sedated} 层`:`Sedative · ${rider.sedated} floors`)].filter(Boolean).join(' · ');return <span className="seat-item-badges" title={names} aria-label={names}>{rider.sealed&&<PackageCheck aria-hidden="true"/>}{rider.cuffed&&<LockKeyhole aria-hidden="true"/>}{rider.alarm&&<AlarmClock aria-hidden="true"/>}{rider.warded&&<ShieldCheck aria-hidden="true"/>}{(rider.sedated??0)>0&&<Pill aria-hidden="true"/>}</span>;})()}{corruptStep>0&&<span className="corruption-mist" aria-hidden="true"><i /><i /><i /></span>}{(Boolean(rider.stash) || (state && !isBombKind(rider.kind)) || rider.fuse !== undefined) && <span className="seat-overlay">{Boolean(rider.stash)&&<span className="seat-stash">{`暂存 ${rider.stash} 币`}</span>}{state && !isBombKind(rider.kind) && <span className={`slot-state ${state.tone}`}>{state.label}</span>}{rider.fuse !== undefined && (()=>{const fs=fuseState(run.cabin,index,run.floor,run.stress);
            // v9.18.2 real-time Bomber: the bomb with its readout and burning fuse, plus a one-line caption for its state.
            if (rider.bombMs!==undefined&&fs) { const total=rider.bombMsTotal??bombSeconds(Math.max(1,rider.destination-rider.boardedAt))*1000; return <span className="bomb-seat"><BombTimer ms={rider.bombMs} total={total} running={bombAboard&&!bombPaused&&fs!=='locked'} speed={bombTick(run.stress)} state={fs as 'live'|'late'|'locked'|'carried'} frank={rider.kind==='madbomber'?frankBombSrc():undefined} /><span className={`bomb-caption bomb-caption-${fs}`}>{(()=>{const zh=language==='zh',left=Math.max(0,rider.destination-run.floor);return fs==='locked'?(rider.kind==='madbomber'?(zh?'黑警锁住了怪炸弹':'The Crooked Cop holds his contraption'):hasNeighbour(run.cabin,index,['cop'])?(zh?'警察锁住了倒计时':'The Officer locked the timer'):hasNeighbour(run.cabin,index,['crookedcop'])?(zh?'黑警锁住了倒计时':'The Crooked Cop locked the timer'):(zh?'便衣警察锁住了倒计时':'A plainclothes officer locked the timer')):fs==='carried'?(zh?'快递员会带走炸弹':'The Courier will carry it off'):fs==='late'?(zh?'快上行！':'Hurry!'):(zh?`还剩 ${left} 站`:`${left} ${left===1?'stop':'stops'} left`);})()}</span></span>; }const fuseText=rider.bombMs!==undefined?`${Math.ceil(rider.bombMs/1000)}秒`:rider.fuse;const critical=rider.bombMs!==undefined&&rider.bombMs<=10000&&fs!=='locked';const locked=fs==='locked'||fs==='carried';const left=Math.max(0,rider.destination-run.floor);const late=fs==='late';return <span className={`fuse ${critical?'fuse-critical':''} ${locked?'fuse-locked':late?'fuse-late':'fuse-live'}`} title={fs==='carried'?'空手的快递员拿着炸弹，他会在倒计时归零前下车并把炸弹带走':locked?'警察在旁边：倒计时暂停，不会减少':late?`倒计时 ${fuseText}，但还有 ${left} 站：到站前会爆炸，让警察站到旁边或请离`:`每层减 1；还有 ${left} 站，能按时送达`}>{fs==='carried'?<><LockKeyhole aria-hidden="true" />快递员会带走 · {fuseText}</>:locked?<><LockKeyhole aria-hidden="true" />已锁住 · {fuseText}</>:late?<><Flame aria-hidden="true" />来不及！倒计时 {fuseText}</>:<>倒计时 {fuseText}</>}</span>;})()}</span>}</span><span className="seat-metrics"><span className="seat-fare" title="按当前站位、躁动和已完成进度计算；下一站到站含本次进度，不含概率奖励" aria-label={`到站收益 ${seatBrief.expectedFare??'未知'}`}><Coins aria-hidden="true" />{seatBrief.expectedFare??<Scramble />}</span><span className="seat-energy" title="人物耗电含红线倍率；链接固定耗电与整车节能另计" aria-label={`每站耗电 ${seatBrief.energy}`}><BatteryCharging aria-hidden="true" />{seatBrief.energy>0?`−${seatBrief.energy}`:seatBrief.energy}</span><span className="seat-agitation" title="下一站躁动" aria-label={`下一站躁动 ${agitationValue}`}><Flame aria-hidden="true" />{compactAgitationValue}</span></span></motion.span> : <><span className="slot-number">{String(index + 1).padStart(2, '0')}</span>{target && plan?.ok && activeRider && <span className="placement-ghost"><Portrait kind={activeRider.kind} large /></span>}</>}
            {reaction && <span key={reaction.id} className={`slot-reaction reaction-${reaction.tone}`} aria-hidden="true" />}
            {target && plan && <span className={`drop-caption ${plan.ok ? 'allowed' : 'blocked'}`}>{plan.ok ? `${dragged ? '松手' : '点击'} · ${synergy ? '联动' : '就位'}` : '不可放置'}</span>}
          </button>{rider && !rider.big && <button className="seat-info-button" type="button" disabled={locked} draggable={false} onDragStart={(event)=>event.preventDefault()} onClick={()=>{setEjectArmed(false);setPassengerDetails(rider);}} aria-label={`查看${PASSENGERS[rider.kind].name}详情`} title="查看人物详情"><Info aria-hidden="true" /></button>}</div>;
        })}</div>
        <button className="cabin-inspect-button" disabled={!activeRider || locked} onClick={() => {if(activeRider){setEjectArmed(false);setPassengerDetails(activeRider);}}}><BookOpen />{activeRider ? `查看${PASSENGERS[activeRider.kind].name} · 请离` : '选中人物 · 查看 / 请离'}</button>
        <div className="door door-left" /><div className="door door-right" />
        {/* v9.18.1: a crate is one card across the upper and lower seat of its column, drawn over the two seats. */}
        <div className="standing-grid crate-grid">{run.cabin.map((r, i) => {
          if (r?.big !== 'top') return null;
          const state = riderState(run.cabin, i, cooperationBonus(run), run.stress, run.floor);
          return <div key={r.id} className={`standing-slot occupied crate-card category-good seat-grade-${riderCardGrade(r)}`} style={{ gridColumn: i % 3 + 1, gridRow: '1 / span 2' }}>
            <span className="rider-visual">
              {(riderCardGrade(r) === 'rare' || riderCardGrade(r) === 'legendary') && <CardShader legendary={riderCardGrade(r) === 'legendary'} />}
              <span className="seat-heading"><span className="rider-name" data-no-translate>{displayName(r, language)}{riderCardGrade(r) !== 'standard' && <span className={`card-gem gem-${riderCardGrade(r)}`} />}</span></span>
              <span className="slot-destination">{stopsLeft(Math.max(0, r.destination - run.floor), language)}</span>
              <span className="seat-art crate-art"><span className="crate-image" style={{ backgroundImage: `url(${riderPortraitSrc(r)})` }} />{state && <span className="seat-overlay"><span className={`slot-state ${state.tone}`}>{state.label}</span></span>}</span>
              <span className="seat-metrics"><span className="seat-fare"><Coins aria-hidden="true" />0</span><span className="seat-energy"><BatteryCharging aria-hidden="true" />−2</span><span className="seat-agitation"><Flame aria-hidden="true" />0</span></span>
            </span>
            <button className="seat-info-button crate-info" type="button" disabled={locked} onClick={() => { setEjectArmed(false); setPassengerDetails(r); }} aria-label={language === 'zh' ? `查看${displayName(r, 'zh')}详情` : `View ${displayName(r, 'en')} details`}><Info aria-hidden="true" /></button>
          </div>;
        })}</div>
        {linkLabels.length>0&&<div className="standing-grid link-label-layer" data-no-translate aria-hidden="true">{linkLabels}</div>}
        {arriving.length>0&&<div className="standing-grid arrival-grid">{arriving.map(arrival=><div key={arrival.riderId} className="standing-slot-wrap" style={{gridColumn:arrival.slot%3+1,gridRow:Math.floor(arrival.slot/3)+1}}>{arrival.incident
          ? <output className={`arrival-exit arrival-incident ${fastReveal?'arrival-quick':''}`} aria-label={zhUI?`${riderName(arrival.kind,'zh')} 受不了混乱，提前下车，未付车费`:`${riderName(arrival.kind,'en')} left early in the chaos without paying`} data-no-translate><div className="arrival-portrait"><Portrait kind={arrival.kind} large /></div><span className="arrival-name">{riderName(arrival.kind,language)}</span><span className="arrival-payout-incident"><Flame aria-hidden="true"/>{zhUI?'提前下车':'Left early'}<small>{zhUI?'受不了混乱 · 未付车费':'Chaos · no fare'}</small></span></output>
          : <div className={`arrival-exit ${fastReveal?'arrival-quick':''}`} role="status" aria-label={`${PASSENGERS[arrival.kind].name} 到站 ${arrival.keepsake?`信物 ${KEEPSAKES[arrival.keepsake].name}`:arrival.ability?UPGRADES[arrival.ability].name:arrival.power?`+${arrival.power} 电`:`${arrival.coins<0?'−'+(-arrival.coins):'+'+arrival.coins} 金币`}`}><div className="arrival-portrait"><Portrait kind={arrival.kind} large /></div><span className="arrival-name">{PASSENGERS[arrival.kind].name}</span><span className="arrival-payout">{arrival.keepsake?<><Sparkles aria-hidden="true"/><small>{zhUI?`信物 · ${keepsakeLabel(arrival.keepsake,'zh')}`:`Keepsake · ${keepsakeLabel(arrival.keepsake,'en')}`}{arrival.coins>0?` · +${arrival.coins}`:''}</small></>:arrival.ability?<><Sparkles aria-hidden="true"/><small>{UPGRADES[arrival.ability].name}</small></>:arrival.power?<><BatteryCharging aria-hidden="true"/>+{arrival.power}<small>电</small></>:<><Coins aria-hidden="true"/>{arrival.coins<0?`−${-arrival.coins}`:`+${arrival.coins}`}<small>金币</small></>}</span></div>}</div>)}</div>}
        <div className={`cabin-message ${hoveredPlan && !hoveredPlan.ok ? 'message-error' : ''}`} aria-live="polite"><Sparkles /><span>{hoveredPlan ? hoveredPlan.ok ? hoveredPlan.next.message : hoveredPlan.label : selectedSlot !== null && run.swapped ? '旧乘客换位已用 · 仅新上客可调整 · ESC 取消' : run.message}</span></div><div className="swap-status">{pendingOfferId ? '选择发光站位 · ESC 取消' : selectedSlot !== null ? run.swapped ? '旧乘客换位已用 · 仅新上客可调整 · ESC 取消' : '再选一个站位完成调整 · ESC 取消' : run.swapped ? <><LockKeyhole /> 旧乘客换位已用 · 新上客仍可调整</> : '拖拽人物安排站位 · 有效组合会亮起'}</div>
      </section>
      <aside className="arrival-panel">
        <div className={`arrival-heading ${loverResponse || firstPairLesson ? 'lover-response' : ''}`}><div><span data-no-translate>{language==='zh'?(loverResponse ? '恋人信号 · 回应' : firstPairLesson ? '第一条连线 · 引导班次' : doors === 'open' ? '门已开' : '运行中'):(loverResponse ? 'LOVER SIGNAL · RESPONSE' : firstPairLesson ? 'FIRST LINK · GUIDED SHIFT' : doors === 'open' ? 'DOORS OPEN' : 'IN TRANSIT')}</span><h2>{loverResponse ? '有人回应了呼唤' : firstPairLesson ? firstPairActive ? '绿色协作已生效' : '试着连出一条绿线' : '谁要上楼？'}</h2></div><div className="arrival-count">{offers.length} 位</div></div>
        <p className="arrival-explainer"><span>每次开门，都是新机会</span><span className="category-legend"><i className="category-good">好人</i><i className="category-bad">坏人</i><i className="category-special">特殊</i></span></p>
        <div className={`candidate-panel ${draggedReturnable ? 'drop-return' : ''}`} onDragOver={(event)=>{ if (draggedReturnable) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } }} onDrop={dropOnOffers} data-return-label={language==='zh'?'拖回这里撤回':'Drop here to withdraw'}>{firstPairLesson && !firstPairActive && <p className="mobile-lesson-banner" aria-live="polite">新手示例：让两位恋人成为邻座，观察绿色协作线</p>}<div className={`passenger-list ${offers.length > 3 ? 'has-four' : ''} ${!intro && !fastReveal && run.status === 'playing' ? 'offer-revealing' : ''}`} key={run.floor} role="list" aria-label="本层候客乘客">
          {offers.map((offer, offerIndex) => {
            const spec = PASSENGERS[offer.kind];
            const currentRider=run.cabin.find((rider)=>rider?.id===offer.id);
            const displayedOffer=currentRider??(run.rebooked?.[offer.id]!==undefined?{...offer,destination:run.rebooked[offer.id]}:offer);
            const boarded = Boolean(currentRider); const pending = pendingOfferId === offer.id;
            const full = !boarded && cabinFull;
            const unavailable = full; const isDragging = dragged?.type === 'offer' && dragged.id === offer.id;
            const partner = unavailable ? null : readyPartner(offer.kind, run.cabin, offer.id, offer);
            const grade=riderCardGrade(offer);
            return <motion.div className="passenger-item" role="listitem" key={offer.id} initial={reduceMotion ? false : { opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 30, delay: offerIndex * .08 }} whileHover={reduceMotion || boarded || full ? undefined : { y: -3, transition: { type: 'spring', stiffness: 500, damping: 26 } }} whileTap={reduceMotion ? undefined : { scale: .985 }}><button data-offer-id={offer.id} onPointerMove={tiltCard} onPointerLeave={untiltCard} className={`passenger-card category-${passengerCategory(offer.kind)} kind-${offer.kind} grade-${grade} tone-${spec.tone} ${isDark(offer.kind)||offer.contraband?'card-dark':''} ${offer.volatile?'volatile':''} ${offer.calledByLover ? 'lover-called' : ''} ${firstPairLesson && offer.kind === 'lover' ? 'guided-lover' : ''} ${boarded ? 'boarded' : ''} ${pending ? 'pending' : ''} ${isDragging ? 'dragging' : ''}`} onClick={() => toggleOffer(offer)} aria-label={language==='zh'?`候选：${spec.name}，车费${displayedOffer.kind==='mystery'?'待揭晓':passengerBrief(displayedOffer,run.floor,run.cabin).coins}，每层耗电${passengerBrief(displayedOffer,run.floor,run.cabin).energy}，还剩${Math.max(0,displayedOffer.destination-run.floor)}站${boarded?'，已上车':''}`:`Candidate: ${riderName(offer.kind,'en')}, fare ${displayedOffer.kind==='mystery'?'sealed':passengerBrief(displayedOffer,run.floor,run.cabin).coins}, power ${passengerBrief(displayedOffer,run.floor,run.cabin).energy} per floor, ${Math.max(0,displayedOffer.destination-run.floor)} stops${boarded?', aboard':''}`} draggable={false} onPointerDown={(event) => { if (!locked && !unavailable && !boarded) pointerDrag(event, { type: 'offer', id: offer.id }, offer); }} disabled={locked || unavailable} aria-pressed={boarded || pending}>
              <span className="card-foil" aria-hidden="true" /><span className="card-glints" aria-hidden="true"><i /><i /><i /><i /></span>{(grade==='rare'||grade==='legendary')&&<CardShader legendary={grade==='legendary'} />}
              {boarded && <span className="boarded-status" aria-hidden="true"><Check />已上车</span>}
              <PassengerCardFace rider={displayedOffer} run={run} action={language==='zh'?(boarded?'已上车 · 再点撤回':pending?'已选中 · 点一个空位':full?'车厢已满':partner?`${offer.kind==='mimic'?'可复制':'可连绿线'} · ${PASSENGERS[partner].name}`:undefined):(boarded?'Aboard · click to withdraw':pending?'Selected · pick a seat':full?'Cabin full':partner?`${offer.kind==='mimic'?'Can copy':'Green link'} · ${riderName(partner,'en')}`:undefined)} locale={language}/>
            </button>{(run.upgrades.reservation>0||run.upgrades.dispatch>0)&&!boarded&&!isAnyLegend(offer.kind)&&<button className="reservation-button" disabled={locked||offer.kind==='parcel'||Boolean(offer.parcelId)||Boolean(run.reservedRider)||(run.upgrades.dispatch>0?dispatchRemaining(run)<1:run.reservationUsedSector===Math.floor(run.floor/10))||run.reservedIds?.includes(offer.id)} onClick={()=>{const next=reserveOffer(run,offers,offer.id);if(next!==run){setRun(next);setOffers(current=>current.filter(r=>r.id!==offer.id));setPendingOfferId(null);setDragged(null);}}}>{run.reservedIds?.includes(offer.id)?'已保留过 · 不可续订':run.upgrades.dispatch>0?`留到下一批 · 调度剩 ${dispatchRemaining(run)} 次`:'留到下一批 · 每十层一次'}</button>}<button className="mobile-rule-button" onClick={() => {setEjectArmed(false);setPassengerDetails(displayedOffer);}} aria-label={`查看${spec.name}规则`}><BookOpen /><span>{language === 'en' ? 'Details' : '完整规则'}</span></button></motion.div>;
          })}
        </div><div className="candidate-notes"><span className="route-note">运转 {travelEnergyCost(run.floor+1)} 电/层 · 下段 {travelEnergyCost(nextShop+1)} 电/层</span><span>每层＝上行后立即结算 · 到站＝下车时结算 · 邻座逐人叠加</span>{run.upgrades.single>0&&<span>车费不含整车奖励：单人到站+2币</span>}{run.upgrades.crowd>0&&<span>车费不含整车奖励：三类齐全且有人到站+6币</span>}{showSavingRule&&<span>{SHARED_SAVING_RULE}</span>}</div></div>
        <div className="departure-controls">
          <button className="mobile-inspect-button" disabled={!activeRider || locked} onClick={() => {if(activeRider){setEjectArmed(false);setPassengerDetails(activeRider);}}} aria-label="查看选中人物规则"><BookOpen /><span>人物/请离</span></button>
          {run.status==='playing'&&doors==='open'&&strandedCourier&&!stressFatal&&!risk.fatal&&<div className={`power-alert ${departArmed?'is-armed':''}`} role="alert" data-no-translate>
            <p><Package aria-hidden="true"/>{strandedCourier.kind==='smuggler'?(language==='zh'?'走私客的黑箱还没上车':'The Smuggler’s black box is not aboard'):(language==='zh'?'快递员的纸箱还没上车':'The Courier’s box is not aboard')}</p>
            <small>{(()=>{const smuggler=strandedCourier.kind==='smuggler',zhBox=smuggler?'黑箱':'纸箱',enBox=smuggler?'black box':'box';return language==='zh'?`没有${zhBox}，他每层 +1 躁动，到站也不付钱。把${zhBox}放在他上下左右任一格；再按一次上行＝不带${zhBox}出发。`:`Without it he adds +1 agitation a floor and pays nothing. Seat the ${enBox} right beside him; press ascend again to leave without it.`;})()}</small>
          </div>}
          {run.status==='playing'&&doors==='open'&&occupied>0&&gamble&&!risk.fatal&&<div className={`power-alert is-gamble ${departArmed?'is-armed':''}`} role="alert" data-no-translate>
            <p><Flame aria-hidden="true"/>{language==='zh'?`赌一把？这一层有 ${Math.round(gambleChance*100)}% 会失控`:`Feeling lucky? ${Math.round(gambleChance*100)}% chance to boil over this floor`}</p>
            {(()=>{const slots=outburstSlots(run),drains=slots.filter(i=>outburstIsPower(run.cabin[i]!.kind)).length,rage=slots.length-drains,p=Math.round(outburstChanceAt(run)*100);return <small>{language==='zh'?`${slots.length===1?`${riderName(run.cabin[slots[0]]!.kind,'zh')}可能发作（${p}%）：${drains?`吸电 −${DARK_RULES.outburstPower}`:`+${DARK_RULES.outburstAgitation}躁动`}`:`${slots.length} 位暗黑版可能发作（各 ${p}%）：${[rage?`${rage} 位 +${DARK_RULES.outburstAgitation}躁动`:'',drains?`${drains} 位吸电 −${DARK_RULES.outburstPower}`:''].filter(Boolean).join('，')}`}。请离几位、点照明弹或打镇静剂都能降低风险。`:`${slots.length===1?`The ${riderName(run.cabin[slots[0]]!.kind,'en')} may lash out (${p}%): ${drains?`−${DARK_RULES.outburstPower} power`:`+${DARK_RULES.outburstAgitation} agitation`}`:`${slots.length} dark riders may lash out (${p}% each): ${[rage?`${rage===1?'one':rage} for +${DARK_RULES.outburstAgitation} agitation`:'',drains?`${drains===1?'one':drains} draining ${DARK_RULES.outburstPower} power`:''].filter(Boolean).join(', ')}`}. ${slots.length===1?'Dismissing him':'Dismissing some'}, a Flare or a Sedative lowers the risk.`}</small>;})()}
            <div className="power-alert-actions">{calmLeft>=gambleCalm&&<button disabled={locked} onClick={()=>calm(gambleCalm)}>{language==='zh'?`安抚到稳 −${gambleCalm} · ${gambleCalm*calmPrice(run.floor)}币`:`Calm to safe −${gambleCalm} · ${gambleCalm*calmPrice(run.floor)}c`}</button>}</div>
            {departArmed&&<small>{language==='zh'?'再按一次上行＝赌这一把。':'Press ascend again to take the bet.'}</small>}
          </div>}
          {run.status==='playing'&&doors==='open'&&occupied>0&&stressFatal&&!risk.fatal&&<div className={`power-alert is-fatal ${departArmed?'is-armed':''}`} role="alert" data-no-translate>
            <p><Flame aria-hidden="true"/>{language==='zh'?`这一层躁动可能失控：现在 ${run.stress}/${run.stressCap}，下一站 ${pressurePreview.range}`:`Agitation can boil over this floor: ${run.stress}/${run.stressCap} now, next ${translateGameText(pressurePreview.range,'en')}`}</p>
            <div className="power-alert-actions">{calmLeft>=calmNeed&&<button disabled={locked} onClick={()=>calm(calmNeed)}>{language==='zh'?`安抚 −${calmNeed} · ${calmNeed*calmPrice(run.floor)}币`:`Calm −${calmNeed} · ${calmNeed*calmPrice(run.floor)}c`}</button>}{calmLeft<1&&overtimeOk&&<button disabled={locked} onClick={overtimeCalm}>{language==='zh'?`加急安抚 −1 · ${overtimePrice}币`:`Overtime calm −1 · ${overtimePrice}c`}</button>}</div>
            {calmLeft<calmNeed&&(calmRescue?<div className="power-alert-rescue"><small>{language==='zh'?`能撑过：${calmRescue.remove.map(r=>`${riderName(r.kind,'zh')}${r.paid?`（请离 ${r.paid} 币）`:'（撤回上车）'}`).join('、')}${calmRescue.calm?`，再安抚 −${calmRescue.calm}`:''}。`:`You can make it: ${calmRescue.remove.map(r=>`${riderName(r.kind,'en')} ${r.paid?`(dismiss, ${r.paid}c)`:'(withdraw)'}`).join(', ')}${calmRescue.calm?`, then calm −${calmRescue.calm}`:''}.`}</small>{calmRescue.remove.every(r=>r.paid>0)&&<button disabled={locked} onClick={()=>{let next=run;for(const r of calmRescue.remove)next=dismissRider(next,r.id);if(calmRescue.calm)next=buyCalm(next,calmRescue.calm);if(next!==run){reportMetrics(run,next,language==='zh'?'请离并安抚':'Dismiss and calm');setRun(next);playTone(sound,'upgrade');}}}>{language==='zh'?`照此安排 · ${calmRescue.cost}币`:`Do it · ${calmRescue.cost}c`}</button>}</div>:<small className="power-alert-doomed">{stressAdvice}</small>)}
            {departArmed&&<small>{language==='zh'?'再按一次上行＝冒险出发。':'Press ascend again to risk it.'}</small>}
          </div>}
          {run.status==='playing'&&doors==='open'&&occupied>0&&(risk.fatal||(sector.failFloor!==null&&sector.failFloor-run.floor<=2))&&<div className={`power-alert ${risk.fatal?'is-fatal':''} ${risk.fatal&&risk.affordable<risk.need&&!rescue?'is-hopeless':''} ${departArmed?'is-armed':''}`} role="alert" data-no-translate>
            <p><BatteryCharging aria-hidden="true"/>{risk.fatal?(language==='zh'?`这一层可能断电：电量 ${run.energy}，下一站 ${energyPreview.range}`:`This floor can run you out of power: ${run.energy} now, next ${translateGameText(energyPreview.range,'en')}`):(language==='zh'?`照现在 ${sector.failFloor} 层断电`:`At this rate: out of power at ${sector.failFloor}F`)}</p>
            <div className="power-alert-actions">
              {risk.fatal&&risk.need>0&&<button disabled={locked||risk.affordable<risk.need} onClick={()=>emergency(risk.need)}>{language==='zh'?`补电 +${risk.need} · ${risk.need*risk.unitPrice}币`:`Charge +${risk.need} · ${risk.need*risk.unitPrice}c`}</button>}
              {emergencySectorLeft(run)<=0&&overtimeCharge&&<button className="is-overtime" disabled={locked||run.coins<overtimeCharge.price} onClick={()=>{const next=buyOvertimeCharge(run);if(next!==run){reportMetrics(run,next,language==='zh'?'加急补电':'Overtime charging');setRun(next);playTone(sound,'upgrade');}}} title={language==='zh'?'本段途中补电已用完：加急补电每包更贵':'This sector’s in-transit charging is spent: each overtime pack costs more'}>{language==='zh'?`加急补电 +${overtimeCharge.units} · ${overtimeCharge.price}币`:`Overtime charge +${overtimeCharge.units} · ${overtimeCharge.price}c`}</button>}
              {emergencyNeed>risk.need&&<button disabled={locked||risk.affordable<emergencyNeed} onClick={()=>emergency(emergencyNeed)}>{language==='zh'?`补足本段 +${emergencyNeed} · ${emergencyNeed*risk.unitPrice}币`:`Top up sector +${emergencyNeed} · ${emergencyNeed*risk.unitPrice}c`}</button>}
            </div>
            {risk.fatal&&risk.affordable<risk.need&&(rescue?<div className="power-alert-rescue"><small>{language==='zh'?`能撑过：${rescue.remove.map(r=>`${riderName(r.kind,'zh')}${r.paid?`（请离 ${r.paid} 币）`:'（撤回上车）'}`).join('、')}${rescue.charge?`，再补电 +${rescue.charge}`:''}。`:`You can make it: ${rescue.remove.map(r=>`${riderName(r.kind,'en')} ${r.paid?`(dismiss, ${r.paid}c)`:'(withdraw)'}`).join(', ')}${rescue.charge?`, then charge +${rescue.charge}`:''}.`}</small>{rescue.remove.every(r=>r.paid>0)&&<button disabled={locked} onClick={()=>{let next=run;for(const r of rescue.remove)next=dismissRider(next,r.id);if(rescue.charge)next=emergencyCharge(next,rescue.charge);if(next!==run){reportMetrics(run,next,language==='zh'?'请离并补电':'Dismiss and charge');setRun(next);playTone(sound,'upgrade');}}}>{language==='zh'?`照此安排 · ${rescue.cost}币`:`Do it · ${rescue.cost}c`}</button>}</div>:(emergencySectorLeft(run)<=0&&overtimeCharge&&run.coins>=overtimeCharge.price?<small>{language==='zh'?'本段补电额度已用完：用上面的加急补电，每包更贵。':'This sector’s allowance is spent: use overtime charging above; each pack costs more.'}</small>:<small className="power-alert-doomed">{language==='zh'?'这一层无论怎么安排都会断电：补电额度或金币不够，请离也省不出来。':'No arrangement survives this floor: not enough coins or allowance, and dismissals cannot save enough.'}</small>))}
            {risk.fatal&&departArmed&&<small>{language==='zh'?'再按一次上行＝冒险出发。':'Press ascend again to risk it.'}</small>}
          </div>}
          <button className={`depart-button ${departArmed?'is-armed':''}`} onClick={depart} disabled={locked || occupied===0} aria-label={language==='zh'?`关门上行 · 下一站电量 ${energyPreview.range}，躁动 ${pressurePreview.range}`:`Close doors and ascend`}><span>{doors === 'open' ? occupied===0?'至少接1人':departArmed?'确认冒险上行':'关门上行' : '正在上行'}</span><b>ENTER</b><ArrowUp className="mobile-depart-arrow" /></button>
          {(pendingOfferId || selectedSlot !== null || firstPairLesson && !firstPairActive) && <p className={`mobile-departure-note forecast-${forecastTone}`} aria-live="polite">{pendingOfferId ? `已选${activeRider ? PASSENGERS[activeRider.kind].name : '乘客'} · 点下方空位` : selectedSlot !== null ? run.swapped ? '旧乘客换位已用 · 仅新上客可调整 · ESC 取消' : '点另一站位换位 · 再点原位取消' : '新手示例：让两位恋人成为邻座，观察绿色协作线'}</p>}
          <p className={`panel-hint forecast-${forecastTone}`} aria-live="polite">{pendingOfferId ? '已选中乘客 · 请点电梯里的目标空位' : firstPairLesson && !firstPairActive ? '新手示例 · 让两位恋人成为邻座，观察绿色协作线' : pairHint ? pairHint.p.partner === pairHint.o.kind ? `两位${PASSENGERS[pairHint.o.kind].name}单看都亏，挨着坐就赚（卡上写着“配${PASSENGERS[pairHint.o.kind].name} +${pairHint.p.value}”）：一起带上。` : `${PASSENGERS[pairHint.o.kind].name}单看亏，和${pairHint.p.partner === 'parcel' ? '纸箱' : PASSENGERS[pairHint.p.partner].name}挨着坐就赚（卡上写着“配${pairHint.p.partner === 'parcel' ? '纸箱' : PASSENGERS[pairHint.p.partner].name} +${pairHint.p.value}”）：一起带上。` : cautiousHint ? '空着的座位也在耗运转电：小亏几币的乘客带上，到站舒缓和邻座联动常常能赚回来。' : departureForecast}</p>
        </div>
      </aside>
    </section>
    <footer className="footer-line"><button onClick={() => setChangelogOpen(true)} aria-label={`查看 v${GAME_VERSION} 更新记录`}>ELV–07 / v{GAME_VERSION} · CHANGELOG</button><i /><span>THE CITY NEVER REALLY SLEEPS</span></footer>


    <Dialog open={passengerDetails !== null} onOpenChange={(open) => {if(!open){setPassengerDetails(null);setEjectArmed(false);}}}><DialogContent className="story-dialog passenger-detail-dialog">
      {detailRider && detailBrief && <><p className="dialog-kicker">PASSENGER NOTES</p><DialogHeader><DialogTitle>{PASSENGERS[detailRider.kind].name}</DialogTitle><DialogDescription>{stopsLeft(detailBrief.distance, language)} · 耗电 {detailBrief.energy} /站{detailRider.fuse !== undefined ? ` · 炸弹倒计时 ${detailRider.fuse}` : ''}</DialogDescription></DialogHeader>
        <div className="passenger-detail-reward">基础车费：{detailBrief.coins === null ? (detailRider?.kind === 'mystery' ? '？封存中，揭晓身份时公开' : '？封存中，到站揭晓') : `+${detailBrief.coins} 金币`}{detailBrief.tip ? ` · 升级小费 +${detailBrief.tip}` : ''}</div>
        {detailBrief.seated && detailBrief.fareLines && <div className="fare-lines"><p className="fare-lines-title">到站收入怎么算</p>{detailBrief.fareLines.map((line, i) => <p key={i} className="fare-line"><span>{line.label}</span><b>{line.amount >= 0 ? `+${line.amount}` : `−${Math.abs(line.amount)}`}</b></p>)}<p className="fare-line fare-total"><span>合计</span><b>{detailBrief.fareLines.reduce((n, l) => n + l.amount, 0)} 金币</b></p></div>}
        {detailBrief.seated && <p className="detail-footnote">按当前站位到站：{detailBrief.expectedFare === null ? (detailRider?.kind === 'mystery' ? '？封存中，揭晓身份时公开' : '？封存中，到站揭晓') : `+${detailBrief.expectedFare} 金币`}。包括倍率、联动和小费；下一站到站时包含本次工作进度。不含概率奖励；未来站位、躁动和进度变化会改变收益。</p>}
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
    {/* v9.17.2: an ability found in a box while every slot is full: swap one out (sold at the next shop) or pass. */}
    <Dialog open={Boolean(run.pendingAbility)&&run.status!=='lost'} onOpenChange={()=>{}}><DialogContent className="story-dialog inventory-dialog box-ability-dialog" showCloseButton={false}>
      {run.pendingAbility&&<><p className="dialog-kicker">FOUND IN A BOX</p><DialogHeader><DialogTitle><span data-no-translate>{language==='zh'?'纸箱里是一项能力：':'A box held an ability: '}</span>{UPGRADES[run.pendingAbility].name}</DialogTitle><DialogDescription>{UPGRADES[run.pendingAbility].description}</DialogDescription></DialogHeader>
      <p className="box-ability-hint" data-no-translate>{language==='zh'?`安装位已满。换下一项来装它，换下的能力会在下次进商店时自动卖掉（退 ${SELL_REFUND} 金币）；或者放弃这个能力。`:`Every slot is full. Swap one out for it; the one you remove is sold automatically at the next shop (${SELL_REFUND} coins back). Or pass on this ability.`}</p>
      <div className="inventory-list">{(Object.keys(UPGRADES) as UpgradeKey[]).filter(key=>!RETIRED_UPGRADES.includes(key)&&run.upgrades[key]>0).map(key=>{const ok=canReplaceWithBoxAbility(run,key);return <section key={key} className="installed"><div><span className="shop-icon inventory-icon" style={{backgroundImage:`url(${shopIcon(`ability-${key}`)})`}} aria-hidden="true" /><b>{UPGRADES[key].name}</b></div><p>{installedUpgradeSummary(run,key)}</p><Button variant="outline" disabled={!ok} onClick={()=>setRun(current=>resolveBoxAbility(current,key))}><span data-no-translate>{ok?(language==='zh'?'换下这一项':'Swap this out'):(language==='zh'?'躁动太高，不能换下':'Agitation too high to remove')}</span></Button></section>;})}</div>
      <Button className="story-primary" onClick={()=>setRun(current=>resolveBoxAbility(current,null))}><span data-no-translate>{language==='zh'?'放弃这个能力':'Pass on this ability'}</span></Button></>}
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
      <div className="receipt-sections">{Boolean(run.lastArrivals?.length)&&<section className="receipt-section"><h3>本层到站乘客</h3>{run.lastArrivals?.map(entry=><p key={entry.riderId}><span>{zhUI?`${entry.slot+1}号位 · ${PASSENGERS[entry.kind].name}`:`Seat ${entry.slot+1} · ${riderName(entry.kind,'en')}`}</span><b>{entry.keepsake?(zhUI?`信物「${keepsakeLabel(entry.keepsake,'zh')}」${entry.coins>0?` · +${entry.coins} 金币`:''}`:`Keepsake “${keepsakeLabel(entry.keepsake,'en')}”${entry.coins>0?` · +${entry.coins} coins`:''}`):entry.ability?(zhUI?`能力「${UPGRADES[entry.ability].name}」`:`Ability “${translateGameText(UPGRADES[entry.ability].name,'en')}”`):entry.power?(zhUI?`+${entry.power} 电`:`+${entry.power} power`):(zhUI?`+${entry.coins} 金币`:`+${entry.coins} ${entry.coins===1?'coin':'coins'}`)}</b></p>)}<p>个人收入含实际小费与个人升级奖励；整车奖励及扣款另计。</p></section>}{run.lastIncident&&<section className="receipt-section pulse-danger" data-no-translate><h3>{zhUI?'车厢事故':'Incident'}</h3><p><span>{zhUI?`${run.lastIncident.slot+1}号位 · ${riderName(run.lastIncident.kind,'zh')}`:`Seat ${run.lastIncident.slot+1} · ${riderName(run.lastIncident.kind,'en')}`}</span><b>{zhUI?'受不了混乱，提前下车 · 未付车费':'Left early in the chaos · no fare'}</b></p></section>}{metricEvent?.changes.map((change) => <section key={change.key} className={`receipt-section pulse-${change.tone}`}>
        <h3><span>{change.label}</span><b>{change.before} → {change.after}<em>{signedDelta(change.delta)}</em></b></h3>
        {change.sources.map((source, index) => <p key={`${index}-${source.label}`}><span>{source.label}</span><b>{signedDelta(source.amount)}</b></p>)}
        {change.capDelta !== 0 && <p><span>{change.label}上限</span><b>{signedDelta(change.capDelta)}</b></p>}
      </section>)}</div>
    </DialogContent></Dialog>
    <Dialog open={intro} onOpenChange={setIntro}><DialogContent className="story-dialog intro-dialog" showCloseButton={false}><p className="dialog-kicker">TEMPORARY ASSIGNMENT · 00:17 AM</p><DialogHeader><DialogTitle>临时顶班。<br />这栋楼没有尽头。</DialogTitle><DialogDescription>今晚，你被临时派来这座古怪大楼开电梯。守住电量和躁动，安排每位乘客的位置。这里没有最后一层——活得越久，成绩越高。</DialogDescription></DialogHeader><p className="route-schedule">每十层有一家商店；关门前先看电量和躁动的预报。</p><div className="intro-rules"><span><b>01</b> 接客并安排站位</span><span><b>02</b> 守住电量与躁动</span><span><b>03</b> 尽可能生存下去</span></div><Button className="story-primary" onClick={() => setIntro(false)}>开始临时夜班 <ArrowUp /></Button><button className="story-link" onClick={() => { setIntro(false); setHelp(true); }}>先阅读值班手册</button>{!daily&&<button className="story-link" data-no-translate onClick={()=>switchMode(true)}>{language==='zh'?'或者：今天的每日班次（所有人同一套候客与商店）':'Or: today’s daily shift (everyone gets the same riders and shops)'}</button>}</DialogContent></Dialog>
    <Dialog open={help} onOpenChange={setHelp}><DialogContent className="story-dialog manual-dialog"><p className="dialog-kicker">ENDLESS SHIFT MANUAL</p><DialogHeader><DialogTitle>值班手册</DialogTitle><DialogDescription>这是一次没有终点的临时夜班。守住电量与躁动，活得越久，楼层成绩越高。</DialogDescription></DialogHeader><p className="route-schedule">{motorScheduleText()}{nightUnrestText()&&<><br />{nightUnrestText()}</>}</p><div className="manual-grid" data-no-translate>{MANUAL.map(([zhTitle,zhBody,enTitle,enBody])=><div key={zhTitle}><b>{language==='zh'?zhTitle:enTitle}</b><p>{language==='zh'?zhBody:enBody}</p></div>)}</div></DialogContent></Dialog>
    <Dialog open={pressureHelp} onOpenChange={setPressureHelp}><DialogContent className="story-dialog pressure-dialog"><p className="dialog-kicker">CABIN AGITATION</p><DialogHeader><DialogTitle>低、中、高：躁动是一种状态。</DialogTitle><DialogDescription>低0–2，中3–4，高5及以上；达到 {run.stressCap} 失控。人物按关门时的档位工作，躁动不兑换电量。虚线指针是下站预测，不是当前数值。</DialogDescription></DialogHeader><div className="pressure-rule-grid" data-no-translate>
      <section className="pressure-rise"><small>{language==='zh'?'会增加躁动':'Raises agitation'}</small>{PRESSURE_RISE.map(([zt,zb,et,eb])=><span key={zt}><b>{language==='zh'?zt:et}</b><p>{language==='zh'?zb:eb}</p></span>)}</section>
      <section className="pressure-relief"><small>{language==='zh'?'可以缓解 · 也有收益':'Relief · and upsides'}</small>{PRESSURE_RELIEF.map(([zt,zb,et,eb])=><span key={zt}><b>{language==='zh'?zt:et}</b><p>{language==='zh'?zb:eb}</p></span>)}</section>
    </div><div className="pressure-footer"><div className={`pressure-now forecast-${pressurePreview.tone}`}><small>按现在的站位</small><b>{pressurePreview.summary}</b></div><Button className="story-primary pressure-start-button" onClick={() => setPressureHelp(false)}>知道了</Button></div></DialogContent></Dialog>
    <Dialog open={archive} onOpenChange={setArchive}><DialogContent className="story-dialog archive-dialog"><p className="dialog-kicker">PASSENGER ARCHIVE</p><DialogHeader><DialogTitle>午夜乘客档案</DialogTitle><DialogDescription>{language==='zh'?`遇见过的乘客会录入档案；第一次把人送到站，就能读到他的故事。最高抵达 ${highest}F · 故事 ${storiesUnlocked.length}/${Object.keys(STORIES).length}。`:`Riders you meet join the archive; deliver someone once to read their story. Best floor ${highest}F · Stories ${storiesUnlocked.length}/${Object.keys(STORIES).length}.`}</DialogDescription></DialogHeader><div className="archive-grid">{PASSENGER_ORDER.map((kind) => { const open = discovered.includes(kind); const spec = PASSENGERS[kind]; return <div className={`archive-item ${open ? '' : 'locked'}`} key={kind}>{open ? <Portrait kind={kind} /> : <LockKeyhole />}<span><b>{open ? spec.name : '？？？'}</b>{open&&<small>{spec.short}</small>}{storiesUnlocked.includes(kind)&&<details className="archive-story" data-no-translate><summary>{language==='zh'?'读故事':'Read story'}</summary><p>{STORIES[kind][language==='zh'?0:1]}</p></details>}</span></div>; })}</div>
      <h3 className="archive-subhead" data-no-translate>{language==='zh'?`传奇乘客 · ${unlockedLegends.length}/${LEGEND_KINDS.length}`:`Legends · ${unlockedLegends.length}/${LEGEND_KINDS.length}`}</h3>
      <div className="archive-grid" data-no-translate>{LEGEND_KINDS.map(kind=>{const open=unlockedLegends.includes(kind);return <div className={`archive-item ${open?'':'locked'}`} key={kind}>{open?<Portrait kind={kind}/>:<LockKeyhole/>}<span><b>{open?riderName(kind,language):(language==='zh'?'未解锁':'Locked')}</b><small>{open?`${language==='zh'?'信物：':'Keepsake: '}${keepsakeName(kind,language)}`:(language==='zh'?LEGEND_UNLOCK_HINTS[kind][0]:LEGEND_UNLOCK_HINTS[kind][1])}</small>{storiesUnlocked.includes(kind)&&<details className="archive-story"><summary>{language==='zh'?'读故事':'Read story'}</summary><p>{STORIES[kind][language==='zh'?0:1]}</p></details>}</span></div>;})}</div>
      {/* v9.20: the dark legends are met after midnight; the hidden resonance appears here only once found. */}
      <h3 className="archive-subhead" data-no-translate>{language==='zh'?`暗黑传奇 · ${DARK_LEGEND_KINDS.filter(k=>discovered.includes(k)).length}/${DARK_LEGEND_KINDS.length}`:`Dark legends · ${DARK_LEGEND_KINDS.filter(k=>discovered.includes(k)).length}/${DARK_LEGEND_KINDS.length}`}</h3>
      <div className="archive-grid" data-no-translate>{DARK_LEGEND_KINDS.map(kind=>{const open=discovered.includes(kind);return <div className={`archive-item ${open?'':'locked'}`} key={kind}>{open?<Portrait kind={kind}/>:<LockKeyhole/>}<span><b>{open?riderName(kind,language):'？？？'}</b><small>{open?translateGameText(PASSENGERS[kind].short,language):(language==='zh'?'午夜之后才会出现':'Appears only after midnight')}</small>{storiesUnlocked.includes(kind)&&<details className="archive-story"><summary>{language==='zh'?'读故事':'Read story'}</summary><p>{STORIES[kind][language==='zh'?0:1]}</p></details>}</span></div>;})}</div>
      {resonanceFound()&&<p className="archive-secret" data-no-translate>{language==='zh'?'已发现的秘密：暗黑共鸣——车上至少 4 人、全是暗黑版或暗黑传奇时，躁动每层 −2，每人每层 +1 金币。':'Secret found: Dark resonance — with at least 4 riders aboard, all dark versions or dark legends, agitation −2 and +1 coin each per floor.'}</p>}
    </DialogContent></Dialog>
    <Dialog open={changelogOpen} onOpenChange={setChangelogOpen}><DialogContent className="story-dialog changelog-dialog"><p className="dialog-kicker">SHIFT REVISION ARCHIVE</p><DialogHeader><DialogTitle>版本 v{GAME_VERSION}</DialogTitle><DialogDescription>每次更新都记录玩法变化、数值依据、测试结论与仍需观察的问题。</DialogDescription></DialogHeader><div className="changelog-list">{(language === 'en' ? CHANGELOG_EN : CHANGELOG).map((entry,index)=><article className={index===0?'current-release':''} key={entry.version}><header><div><span>VERSION {entry.version}</span><h3>{entry.title}</h3></div><time>{entry.date}</time></header><p>{entry.summary}</p><div className="changelog-columns changelog-player"><section><b>改进</b><ul>{entry.changes.map(item=><li key={item}>{item}</li>)}</ul></section></div><details className="changelog-dev"><summary>开发记录 · 试验与观察</summary><div className="changelog-columns"><section><b>试验与结论</b><ul>{entry.experiments.map(item=><li key={item}>{item}</li>)}</ul></section><section><b>继续观察</b><ul>{entry.watch.map(item=><li key={item}>{item}</li>)}</ul></section></div></details></article>)}</div></DialogContent></Dialog>
    <Dialog open={run.status === 'upgrade' && doors === 'open'}><DialogContent className={`story-dialog upgrade-dialog ${upgradeCrisis ? 'upgrade-crisis' : ''}`} showCloseButton={false}>
      <div className="shop-resources">
        <div className={`shop-power ${run.energy <= 0 ? 'shop-power-empty' : ''}`} aria-live="polite" aria-atomic="true">
          <span className="shop-resource-label"><BatteryCharging aria-hidden="true"/>{language === 'zh' ? '剩余电量' : 'Power left'}</span>
          <div className="shop-power-value"><b>{run.energy}</b><span>/{run.energyCap}</span></div>
        </div>
        <div className={`shop-agitation ${run.stress>=run.stressCap-2?'is-high':''}`} data-no-translate><span className="shop-resource-label"><Flame aria-hidden="true"/>{language==='zh'?'躁动':'Agitation'}</span><div className="shop-power-value"><b>{run.stress}</b><span>/{run.stressCap}</span></div></div>
        <div className="shop-wallet"><span aria-label={`可用金币 ${run.coins}`}><Coins aria-hidden="true" /><span className="shop-balance-label">金币</span><b><RegisterNumber value={run.coins} /></b></span><span>收入 {run.earned} · 支出 {run.earned - run.coins}</span></div>
      </div>
      <div className="shop-scroll-body">
      <DialogHeader className="shop-head"><p className="dialog-kicker" data-no-translate>FLOOR {run.floor} · SHOP{districtFor(run.floor+1).from===run.floor+1?` · ${language==='zh'?'前方':'Ahead'}: ${districtFor(run.floor+1).name[language==='zh'?0:1]}`:''}</p><DialogTitle>{upgradeCrisis ? '商店 · 紧急维修' : '商店'}</DialogTitle>{run.floor%50===0&&!upgradeCrisis&&<p className="shop-milestone" data-no-translate>{language==='zh'?`第 ${run.floor} 层！这趟夜班已经开到了第 ${run.floor} 层。`:`Floor ${run.floor}! This night shift has reached floor ${run.floor}.`}</p>}<DialogDescription className="sr-only">{language==='zh'?'选能力、升级配电箱、充电，然后继续上行。':'Pick an ability, upgrade the power box, charge, then ascend.'}</DialogDescription></DialogHeader>
      {run.floor===ABYSS_EVENTS.shopFloor&&run.abyssEvents&&<div className="shop-abyss-schedule" data-no-translate><b>{language==='zh'?'深渊前夜 · 下面十层的安排':'Eve of the abyss · the next ten floors'}</b><ul>{run.abyssEvents.map(e=><li key={e.floor} className={`abyss-${e.kind}`}><span>{e.floor}F {abyssEventName(e.kind,language)}</span>{abyssEventRule(e.kind,language)}</li>)}</ul></div>}
      {upgradeCrisis && <p className="shop-warning" data-no-translate>{(()=>{const zh=language==='zh',plan=emergencyRepairPlan(run);
        // v9.20.3 (English playtest 9): each sentence written per language (the appended ones came out half Chinese), and
        // Safety Margin is only suggested while this shop's free pick is still unused.
        const base=upgradeCrisis==='both'?(zh?'电量与躁动同时失控：底部最低抢救可恢复1电，并将躁动降至上限以下1点。':'Both resources are critical: the minimum rescue below restores 1 power and puts agitation 1 below its cap.'):upgradeCrisis==='energy'?(zh?'电量已耗尽：使用下方充电服务，将电量恢复到 0 以上才能继续。':'Power is depleted. Use the charging below to get it above 0 before you continue.'):(zh?'躁动失控：底部最低抢救每点8金币，只降到上限以下1点；想再降，用下方的“安抚”（正常价格，计入本段额度）。':'Agitation is critical: the minimum rescue below costs 8 coins a point and stops 1 below the cap; to go lower, use Calm below (normal price, counts toward this sector’s allowance).');
        const sell=!plan.affordable&&upgradeCount>0&&run.coins+SELL_REFUND>=plan.cost?(zh?` 金币不够抢救：卖掉一项能力（退 ${SELL_REFUND} 币）就付得起。`:` Not enough coins for the rescue: selling an ability (+${SELL_REFUND} coins) covers it.`):'';
        const margin=upgradeCrisis!=='energy'&&!run.upgrades.calm&&!run.shopUpgradeBought&&run.shop.some(card=>card.key==='calm'&&!card.purchased)?(upgradeCount>=UPGRADE_SLOTS?(zh?' 也可以卖掉一项能力、换上“安全余量”：躁动上限 +2，再用它的手动调节 −3。':' Or sell an ability and take Safety Margin: agitation cap +2, then use its manual −3.'):(zh?' 也可以免费装上“安全余量”：躁动上限 +2，再用它的手动调节 −3。':' Or take Safety Margin for free: agitation cap +2, then use its manual −3.')):'';
        return `${base}${sell}${margin}${zh?' 若无力修复，本班将在这里结束。':' If you cannot repair the elevator, the shift ends here.'}`;})()}</p>}
      <div className="shop-step-head" data-no-translate><h3><i>1</i>{language==='zh'?(run.shopUpgradeBought?`加购 1 项 · ${SHOP_PRICES.extraAbility} 金币（可跳过）`:'选 1 项能力 · 免费'):(run.shopUpgradeBought?`Buy 1 more · ${SHOP_PRICES.extraAbility} coins (optional)`:'Pick 1 ability · free')}</h3><span>
        {!run.shopUpgradeBought&&availableShopCards(run).length>0&&run.rerolledFloor!==run.floor&&<button className="shop-reroll" disabled={run.coins<REROLL_PRICE} onClick={()=>{const next=rerollShop(run, rngOf('shop', run.floor));if(next!==run){reportMetrics(run,next,language==='zh'?'重抽能力':'Reroll abilities');setRun(next);playTone(sound,'select');}}}><RotateCcw aria-hidden="true" />{language==='zh'?`重抽 · ${REROLL_PRICE}币`:`Reroll · ${REROLL_PRICE}c`}</button>}
</span></div>
      {!availableShopCards(run).length&&!shownShopKeys.length&&<p className="shop-receipt" role="status" data-no-translate>{run.shopExtraBought?(language==='zh'?'本店已选取并加购能力，下次商店再选。':'Ability taken and extra bought; more at the next shop.'):(language==='zh'?'本店没有可选的能力。':'No abilities to choose here.')}</p>}
      {availableShopCards(run).length>0&&upgradeCount>=UPGRADE_SLOTS&&<p className="shop-receipt shop-full-hint" role="status" data-no-translate>{language==='zh'?`六个安装位已满：在下方卖掉一项（退 ${SELL_REFUND} 金币）才能装新能力。`:`All six slots are full: sell one below (refund ${SELL_REFUND}) to install a new ability.`}</p>}
      {(run.keepsakes?.length??0)>0&&<p className="keepsake-row" data-no-translate>{language==='zh'?'信物：':'Keepsakes: '}{run.keepsakes!.map(k=><span key={k} className="keepsake-chip keepsake-full"><b>{keepsakeLabel(k,language)}</b>{keepsakeText(k,language)}</span>)}</p>}
      <div className="shop-choice-row"><div className="shop-main-column"><div className="upgrade-grid">{shownShopKeys.map((key) => { const card = availableShopCards(run).find(c => c.key === key);
        // v9.18.3: a chosen card stays in its place (marked), so picking one never reflows the shop.
        if (!card) { const taken = run.upgrades[key] > 0; return <button key={key} data-key={key} className={taken ? 'shop-purchased' : 'shop-soldout'} disabled aria-label={`${UPGRADES[key].name}，${taken ? '已选取' : '本店已选完'}`}>
          <span className="shop-item-head"><span className="shop-icon" style={{backgroundImage:`url(${shopIcon(`ability-${key}`)})`}} aria-hidden="true" /><b>{UPGRADES[key].name}</b></span><p>{UPGRADES[key].description}</p><span className="shop-price" data-no-translate>{taken?<><Check aria-hidden="true" /><strong>{language==='zh'?'已装上':'Installed'}</strong></>:<><LockKeyhole aria-hidden="true" /><strong>{language==='zh'?'本店已选完':'Shop done'}</strong></>}</span>
        </button>; }
        const affordable = run.coins >= card.price; const rescue = rescuesCrisis(key, run); const warning = card.price > 0 ? purchaseRepairWarning(run,key,card.price) : null; const slotsFull = upgradeCount >= UPGRADE_SLOTS; return <button key={key} data-key={key} className={rescue ? 'crisis-rescue' : ''} disabled={!affordable || slotsFull} onClick={() => chooseUpgrade(key)} aria-label={`${UPGRADES[key].name}，${slotsFull ? '能力位已满，先卖出一项' : card.price === 0 ? '免费选取' : `加购 ${card.price} 金币`}${!affordable && !slotsFull ? '，金币不足' : ''}`}>
        <span className="shop-item-head"><span className="shop-icon" style={{backgroundImage:`url(${shopIcon(`ability-${key}`)})`}} aria-hidden="true" /><b>{UPGRADES[key].name}</b></span><p>{UPGRADES[key].description}</p>{IMPACT_KEYS.includes(key)&&<em>{upgradeImpact(key, run)}</em>}{warning && <span className="reserve-warning">{warning === 'crisis' ? '购买后不足以修复当前失控' : '购买后无法补至参考电量；参考线不是离店要求'}</span>}<span className={`shop-price ${slotsFull?'is-slots-full':''}`} data-no-translate>{slotsFull?<><LockKeyhole aria-hidden="true" /><strong>{language==='zh'?'能力位已满':'Slots full'}</strong><span>{language==='zh'?'先在下方卖出一项':'Sell one below first'}</span></>:card.price===0?<><Check aria-hidden="true" /><strong>{language==='zh'?'免费选取':'Free pick'}</strong></>:<><Coins aria-hidden="true" /><strong>{card.price}</strong><span>{affordable ? (language==='zh'?'加购':'Buy extra') : (language==='zh'?`还差 ${card.price - run.coins}`:`Need ${card.price - run.coins}`)}</span></>}</span>
      </button>; })}</div>
      <section className="shop-slots" data-no-translate><div className="shop-slots-head"><b>{language==='zh'?`已装能力 ${upgradeCount}/${UPGRADE_SLOTS}`:`Installed ${upgradeCount}/${UPGRADE_SLOTS}`}</b><span>{upgradeCount>=UPGRADE_SLOTS?(language==='zh'?`装满后每店可把一项能力升到 2 级（效果 +50%）· 卖出退 ${SELL_REFUND}`:`Full: raise one ability to level 2 per shop (+50%) · sell for ${SELL_REFUND}`):language==='zh'?`卖出退 ${SELL_REFUND} 金币`:`Sell for ${SELL_REFUND}`}</span></div>
        <div className="shop-slot-grid">{Array.from({length:UPGRADE_SLOTS},(_,i)=>{const key=(Object.keys(UPGRADES) as UpgradeKey[]).filter(k=>run.upgrades[k]>0)[i];return key?<div key={key} className="shop-slot" title={translateGameText(UPGRADES[key].description,language)}><span className="shop-icon" style={{backgroundImage:`url(${shopIcon(`ability-${key}`)})`}} aria-hidden="true" /><span className="shop-slot-name">{translateGameText(UPGRADES[key].name,language)}{run.upgrades[key]>=2&&<i className="ability-level">{language==='zh'?' 2级':' Lv2'}</i>}</span>{upgradeCount>=UPGRADE_SLOTS&&run.upgrades[key]===1&&LEVEL2_TEXT[key]&&<button className="ability-raise" disabled={!canRaiseAbility(run,key)} title={LEVEL2_TEXT[key]![language==='zh'?0:1]} onClick={(event)=>{const next=raiseAbility(run,key);if(next!==run){reportMetrics(run,next,language==='zh'?'能力升级':'Ability raised');setRun(next);playSfx(sound,'record');burstAt(event.currentTarget,'gold',16,70);}}}>{language==='zh'?`升2级 · ${abilityLevel2Price(run)}币`:`Lv2 · ${abilityLevel2Price(run)}c`}</button>}<button disabled={!canSellUpgrade(run,key)} title={!canSellUpgrade(run,key)&&key==='calm'?(language==='zh'?'躁动太高：卖掉安全余量会让躁动上限低于当前值':'Agitation too high: selling it would drop the cap below your agitation'):undefined} onClick={(event)=>{const next=sellUpgrade(run,key);if(next!==run){reportMetrics(run,next,language==='zh'?'卖出能力':'Sold ability');setRun(next);playSfx(sound,'sell');popText(event.currentTarget,`+${SELL_REFUND}`,'gold');}}}>{language==='zh'?'卖出':'Sell'}</button></div>:<div key={`empty-${i}`} className="shop-slot is-empty">{language==='zh'?'空位':'Empty'}</div>;})}</div>
      </section></div>
      <div className="shop-service-column"><section className="recharge-panel box-panel">
        <div className="shop-step-head"><h3><i>2</i>{language==='zh'?`配电箱 · 升 1 级（可跳过）`:`Power box · 1 level (optional)`}</h3><span>{(run.freeBoxLevels??0)>0?(language==='zh'?'扳手：本次免费':'Wrench: free'):`${boxTotal(boxOf(run))}/${boxTotalCap(run.floor)}`}</span></div>
        {BOX_LINES.map((line:BoxLine)=>{const level=boxOf(run)[line];const price=boxLevelPrice(run,line);const can=canBuyBoxLevel(run,line);return <div key={line} className="box-line">
          <span className="box-line-name"><span className="shop-icon box-icon" style={{backgroundImage:`url(${shopIcon(`box-${line}`)})`}} aria-hidden="true" />{BOX_LINE_LABELS[line].name}<i className="box-pips" aria-label={`${level}/${BOX_MAX_LEVEL}`}>{Array.from({length:BOX_MAX_LEVEL},(_,i)=><b key={i} className={i<level?'on':''} />)}</i></span>
          <span className="box-line-next">{level<BOX_MAX_LEVEL?BOX_LINE_LABELS[line].levels[level]:(language==='zh'?'已满级':'Maxed')}</span>
          <button disabled={!can} onClick={(event)=>{const next=buyBoxLevel(run,line);if(next!==run){setLeaveArmed(false);reportMetrics(run,next,language==='zh'?'配电箱升级':'Power box upgrade');setRun(next);playTone(sound,'upgrade');playSfx(sound,'stamp');const row=event.currentTarget.closest('.box-line');flashClass(row,'is-bumped',500);burstAt(row?.querySelector('.box-icon')??null,'gold',12,55);}}}>{level>=BOX_MAX_LEVEL?(language==='zh'?'满级':'Max'):boxTotal(boxOf(run))>=boxTotalCap(run.floor)?(language==='zh'?(boxTotalCap(run.floor)<BOX_MAX_LEVEL*3?`已达上限 · ${boxTotalCap(run.floor+30)>boxTotalCap(run.floor)?`${Math.ceil((run.floor+1-BOX_LADDER.from)/BOX_LADDER.every)*BOX_LADDER.every+BOX_LADDER.from}层再开一级`:''}`:'已达上限'):(boxTotalCap(run.floor)<BOX_MAX_LEVEL*3?`Box full · next level at ${Math.ceil((run.floor+1-BOX_LADDER.from)/BOX_LADDER.every)*BOX_LADDER.every+BOX_LADDER.from}F`:'Box full')):!can&&run.boxBoughtFloor===run.floor&&!(run.freeBoxLevels??0)?(language==='zh'?'本店已升级':'Done here'):price===0?(language==='zh'?'免费升级':'Free'):`${price} ${language==='zh'?'金币':'coins'}`}</button>
        </div>;})}
        {(()=>{
          // v9.18.4: buying a level first can leave too little to charge for the next sector (a playtest ran dry this way).
          const needUnits=Math.max(0,Math.min(run.energyCap,need.total)-run.energy),needCost=boxChargeCost(boxOf(run),needUnits,run.floor);
          const cheapest=Math.min(...BOX_LINES.filter(l=>canBuyBoxLevel(run,l)).map(l=>boxLevelPrice(run,l)));
          if(!Number.isFinite(cheapest)||cheapest<=0||needUnits<=0||run.coins-cheapest>=needCost)return null;
          return <p className="box-charge-warning" data-no-translate>{language==='zh'?`先充电：升级后只剩 ${run.coins-cheapest} 币，充到下段约需的 ${need.total} 电要 ${needCost} 币。`:`Charge first: after an upgrade you would have ${run.coins-cheapest} coins, and charging to the next sector’s ${need.total} power costs ${needCost}.`}</p>;
        })()}
      </section><section className="recharge-panel charge-slider-panel">
        <div className="shop-step-head"><h3><i>3</i>{language==='zh'?'充电至':'Charge to'} <output>{chargeTarget}/{run.energyCap}</output></h3><span>{chargeUnitPrice(boxOf(run),run.floor)}{language==='zh'?' 币/电':' c/power'}{run.floor<=EARLY_CHARGE.until&&(language==='zh'?` · ${EARLY_CHARGE.until} 层前 ${EARLY_CHARGE.factor*10} 折`:` · ${Math.round((1-EARLY_CHARGE.factor)*100)}% off until ${EARLY_CHARGE.until}F`)}</span></div>
        <p className={`sector-need ${need.total>chargeTarget?'is-short':''}`} data-no-translate>{language==='zh'?`${need.from}–${need.to} 层约需 ${need.total} 电`:`Floors ${need.from}–${need.to}: about ${need.total} power`}<small title={language==='zh'?`运转 ${need.motor}＋乘客约 ${need.riders}（按每层 ${SECTOR_NEED_RIDERS} 人）`:`Motor ${need.motor} + riders ~${need.riders} (${SECTOR_NEED_RIDERS} per floor)`}>{language==='zh'?`（运转 ${need.motor}＋乘客约 ${need.riders}）`:` (motor ${need.motor} + riders ~${need.riders})`}</small>{need.total>chargeTarget?(language==='zh'?` · 还差 ${need.total-chargeTarget}，途中要补电`:` · ${need.total-chargeTarget} short: charge on the way`):''}{need.total>run.energyCap&&canBuyBoxLevel(run,'storage')?(language==='zh'?' · 或者升级蓄电，提高上限':' · or raise the cap with Storage'):''}</p>
        {unrestAhead>0&&<p className="calm-reserve-hint" data-no-translate>{language==='zh'?`${need.from}–${need.to} 层夜深人躁约 +${unrestAhead} 躁动 · 安抚 ${calmPrice(run.floor+1)} 币/点 · 建议留 ${calmReserve} 币${run.coins-chargeCost<calmReserve?'（按现在的充电量不够）':''}`:`Late-night unrest on ${need.from}–${need.to}F: about +${unrestAhead} · calming ${calmPrice(run.floor+1)}c each · keep ${calmReserve} coins${run.coins-chargeCost<calmReserve?' (not enough at this charge)':''}`}</p>}
        <label className="charge-control"><span className="sr-only">{language==='zh'?'充电目标':'Charge target'}</span><Slider className="charge-slider" min={Math.min(run.energy,run.energyCap)} max={run.energyCap} step={1} value={[chargeTarget]} disabled={run.energy>=run.energyCap} onValueChange={value=>setChargeChoice({context:chargeContext,target:Array.isArray(value)?value[0]:value})}/></label>
        <div className="charge-scale"><span>{language==='zh'?'当前':'Now'} {run.energy}</span><span>{run.energyCap}</span></div>
        <button className="charge-confirm" disabled={!chargeUnits||run.coins-repairReserve<chargeCost} onClick={()=>recharge(chargeUnits)}>{chargeUnits>0&&repairReserve>0&&run.coins-repairReserve<chargeCost?(language==='zh'?`先付最低抢救（${repairReserve} 币），再充电`:`Pay the minimum rescue (${repairReserve}c) first`):!chargeUnits?(run.energy>=run.energyCap?(language==='zh'?'电量已满':'Power is full'):(language==='zh'?'拖动滑块选择充到多少':'Drag the slider to choose a target')):language==='zh'?`充入 ${chargeUnits} 电 · ${chargeCost} 金币`:`Add ${chargeUnits} power · ${chargeCost} coins`}</button>
        {(()=>{/* v9.20.4 (English playtest 18): an unaffordable target only said “lower the target”; offer what the coins buy (the slider is fiddly on phones). */const spend=run.coins-repairReserve;if(!chargeUnits||spend>=chargeCost||spend<=0)return null;const plan=affordableChargingPlan({...run,coins:spend});const units=Math.min(chargeUnits,plan.units);if(units<1)return null;const cost=boxChargeCost(boxOf(run),units,run.floor);return <button className="charge-confirm charge-affordable" onClick={()=>recharge(units)}>{language==='zh'?`买得起的最多：充入 ${units} 电 · ${cost} 金币`:`All you can afford: +${units} power · ${cost} coins`}</button>;})()}
        <p aria-live="polite">{language==='zh'?(chargeCost>run.coins?`还差 ${chargeCost-run.coins} 金币；拖低目标即可少充。`:`充电后剩余 ${run.coins-chargeCost} 金币。`):(chargeCost>run.coins?`Need ${chargeCost-run.coins} more coins; lower the target to buy less.`:`${run.coins-chargeCost} ${run.coins-chargeCost===1?'coin':'coins'} left after charging.`)}</p>
      </section>
      {(run.stress>0||run.calmCharge)&&<section className="recharge-panel calm-panel" data-no-translate><div className="shop-step-head"><h3><i>4</i>{language==='zh'?'安抚':'Calm'}</h3><span>{calmAllowance(run)<1&&overtimePrice!==null?(language==='zh'?`本段额度已用完 · 加急 ${overtimePrice} 币/点，每次更贵`:`Allowance spent · overtime ${overtimePrice}c a point, rising`):language==='zh'?`本段还可 ${calmAllowance(run)} 点 · ${calmPrice(run.floor)} 币/点`:`${calmAllowance(run)} left · ${calmPrice(run.floor)}c each`}</span></div>
        <div className="calm-actions"><button disabled={calmAllowance(run)<1} onClick={()=>{const next=buyCalm(run,1);if(next!==run){reportMetrics(run,next,language==='zh'?'安抚':'Calm');setRun(next);playTone(sound,'upgrade');playSfx(sound,'calm');const panel=document.querySelector('.upgrade-dialog .shop-agitation');flashClass(panel,'is-calmed',700);popText(panel,'−1','blue');}}}>{language==='zh'?`安抚 −1 · ${calmPrice(run.floor)}币`:`Calm −1 · ${calmPrice(run.floor)}c`}</button>{calmAllowance(run)<1&&overtimePrice!==null&&<button disabled={!overtimeOk} onClick={()=>{const next=buyOvertimeCalm(run);if(next!==run){reportMetrics(run,next,language==='zh'?'加急安抚':'Overtime calming');setRun(next);playTone(sound,'upgrade');playSfx(sound,'calm');const panel=document.querySelector('.upgrade-dialog .shop-agitation');flashClass(panel,'is-calmed',700);popText(panel,'−1','blue');}}}>{language==='zh'?`加急安抚 −1 · ${overtimePrice}币`:`Overtime calm −1 · ${overtimePrice}c`}</button>}{run.calmCharge&&<button disabled={run.stress<=0} onClick={()=>{const next=applyCalmCharge(run);setRun(next);reportMetrics(run,next,'手动调节');}}>{language==='zh'?'手动调节 −3（每店补满）':'Manual relief −3 (refills at shops)'}</button>}</div>
      </section>}
      {(run.itemStock?.length??0)>0&&<section className="recharge-panel item-shop" data-no-translate><div className="shop-step-head"><h3><i>{run.stress>0||run.calmCharge?5:4}</i>{language==='zh'?'道具 · 一次性':'Items · single use'}</h3><span>{language==='zh'?`道具栏 ${run.items?.length??0}/${ITEM_SLOTS} · 同一种每买一次涨价`:`Bag ${run.items?.length??0}/${ITEM_SLOTS} · each repeat costs more`}</span></div>
        <div className="item-stock">{run.itemStock!.map((card,i)=>{const full=(run.items?.length??0)>=ITEM_SLOTS;return <button key={card.key} className={`item-card ${card.sold?'is-sold':''}`} disabled={card.sold||full||run.coins<card.price} onClick={()=>{const next=buyItem(run,i);if(next!==run){reportMetrics(run,next,language==='zh'?`买下${ITEMS[card.key].name}`:`Bought ${ITEMS[card.key].en}`);setRun(next);playSfx(sound,'register');}}}><span className="shop-icon item-icon" style={{backgroundImage:`url(${shopIcon(`item-${card.key}`)})`}} aria-hidden="true" /><span className="item-card-text"><b>{language==='zh'?ITEMS[card.key].name:ITEMS[card.key].en}</b><small>{language==='zh'?ITEMS[card.key].zh:ITEMS[card.key].enText}</small></span><span className="item-price">{card.sold?(language==='zh'?'已买':'Bought'):full?(language==='zh'?'道具栏满':'Bag full'):language==='zh'?`${card.price} 币`:`${card.price}c`}</span></button>;})}</div>
      </section>}

      </div></div>
      {metricEvent && <p className="shop-receipt" aria-live="polite">{metricEvent.label}{metricEvent.changes.map((change) => ` · ${language==='zh'?change.label:({coins:'Coins',energy:'Power',stress:'Agitation'} as Record<string,string>)[change.key]??change.label} ${signedDelta(change.delta)}${change.capDelta ? (language==='zh'?`（上限 ${signedDelta(change.capDelta)}）`:` (cap ${signedDelta(change.capDelta)})`) : ''}`).join('')}</p>}
      </div>
      <div className="shop-footer">{leaveArmed && !upgradeCrisis && <p className="shop-warning">电量不够跑完下一段的运转；途中补电每十层有上限。再点一次确认离开。</p>}<Button className="story-primary" onClick={finishShopping}>{upgradeCrisis ? emergencyRepairPlan(run).affordable ? `最低抢救 · ${emergencyRepairPlan(run).cost} 金币` : leaveArmed ? '确认结束本班' : '无法支付抢救费 · 结束本班' : leaveArmed ? '确认冒险离开' : '继续上行'}<ArrowUp /></Button></div>
    </DialogContent></Dialog>
    <Dialog open={run.status === 'lost' && doors === 'open' && endingShownFor === run}><DialogContent className="story-dialog result-dialog failure-dialog compact-result" showCloseButton={false}>
      <p className="dialog-kicker">{language==='zh'?'本班结束':'SHIFT ENDED'}</p>
      <DialogHeader><DialogTitle><CountUp value={run.floor} sound={sound} /><small>{language==='zh'?'层':'F'}</small></DialogTitle><DialogDescription className="failure-cause">{run.message.includes('炸弹倒计时') ? '疯炸客的怪炸弹炸了' : run.energy<=0 && run.stress>=run.stressCap ? '电量耗尽 · 躁动失控' : run.energy<=0 ? '电量耗尽' : '躁动失控'}</DialogDescription></DialogHeader>
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
