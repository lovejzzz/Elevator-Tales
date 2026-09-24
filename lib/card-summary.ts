// Compact passenger cards: one ability line, relation chips and at most two tags.
// Full sentences stay in the rule sheet. Text is produced per locale here rather than
// through phrase translation, so numbers on the card can never go stale.
import { PASSENGERS, isLegend, passengerCategory, type PassengerKind } from './game-data';
import { riderConflictRules, riderProfile, type ConflictEffect } from './rider-profile';
import { hasNeighbour, neighbourCount, type Rider, type RunState } from './game-engine';
import { CHILD_CARE_BONUS, CHILD_CARE_WORK, COMMUTER_QUIET_BONUS, INSPECTION_BONUS, INSPECTION_WORK, REPAIR_DURATION, REPAIR_WORK, TOURIST_MEDIUM_BONUS } from './balance-v832';
import { RISK_PARTNERS } from './shift-rules';
import { LEGEND_RULES } from './legends';
import type { GameLocale } from './i18n';

export type ChipTone = 'green' | 'red' | 'risk';
export type CardChip = { tone: ChipTone; kinds: PassengerKind[]; label: string; icon?: 'agitation' | 'energy' | 'coins' | 'mixed'; title: string };
export type CardSummary = { line: string; progress?: string; chips: CardChip[] };

const EN_NAMES: Record<PassengerKind, string> = {
  parcel: 'Parcel', commuter: 'Commuter', tourist: 'Tourist', courier: 'Courier', mechanic: 'Mechanic', lover: 'Lover', musician: 'Musician',
  thief: 'Thief', cop: 'Officer', lawyer: 'Counsel', drunk: 'Drifter', nurse: 'Nurse', child: 'Child', ghost: 'Ghost', exorcist: 'Warden',
  coach: 'Coach', celebrity: 'Celebrity', inspector: 'Inspector', bomb: 'Bomb Carrier', mystery: 'Mystery', shifter: 'Shifter', mimic: 'Mimic',
  operator: 'Old Zhou', matchmaker: 'Matchmaker', don: 'The Don', matron: 'Matron', nightingale: 'Nightingale', medium: 'Medium', tycoon: 'Tycoon', stranger: 'Stranger in 13',
};
export const riderName = (kind: PassengerKind, locale: GameLocale) => (locale === 'zh' ? PASSENGERS[kind].name : EN_NAMES[kind]);
/** v9.17 display name for one rider: box size, the Bomber in disguise. Rarity shows as the gem and foil, not in the name. */
export function displayName(rider: Pick<Rider, 'kind' | 'big' | 'disguised'>, locale: GameLocale) {
  const zh = locale === 'zh';
  if (rider.kind === 'parcel') return zh ? (rider.big ? '大纸箱' : '纸箱') : rider.big ? 'Crate' : 'Parcel';
  if (rider.disguised) return zh ? '乔装的通勤者' : 'Disguised Commuter';
  return riderName(rider.kind, locale);
}

const t = (locale: GameLocale, zh: string, en: string) => (locale === 'zh' ? zh : en);

/** One short line: what this rider does for you, with live values. */
export function cardLine(rider: Rider, run: RunState, locale: GameLocale): { line: string; progress?: string } {
  const L = (zh: string, en: string) => t(locale, zh, en);
  const profile = riderProfile(rider, run.cabin);
  switch (rider.kind) {
    case 'commuter': return { line: L(`低躁动到站 +${COMMUTER_QUIET_BONUS}`, `+${COMMUTER_QUIET_BONUS} if calm on arrival`) };
    case 'tourist': return { line: L(`每位邻座 +2 · 中躁动 +${TOURIST_MEDIUM_BONUS}`, `+2 per neighbor · +${TOURIST_MEDIUM_BONUS} at medium`) };
    case 'courier': {
      if (!rider.parcelId) return { line: L('到站回 2 电', 'Returns 2 power on arrival') };
      // Amounts live in the value tags ("On arrival", "w/ box"); the line says only what he needs.
      return { line: L('纸箱在旁才付钱 · 回 2 电 · 空手可接炸弹', 'Pays only with his box beside him · 2 power · empty-handed takes bombs') };
    }
    case 'parcel': {
      return { line: rider.big ? L('占同一列上下两格 · 挨着快递员送达', 'Fills one column · delivered beside a Courier') : L('挨着快递员送达 · 无主时到站开箱，内容未知', 'Delivered beside a Courier · unclaimed, opens on arrival: contents unknown') };
    }
    case 'mechanic': return rider.repairDone ? { line: L(`检修完成 · ${REPAIR_DURATION} 层省电`, `Repaired · ${REPAIR_DURATION} floors cheaper`) } : { line: L(`低躁动检修 → ${REPAIR_DURATION} 层运转 −1`, `Calm repair → motor −1 for ${REPAIR_DURATION}`), progress: `${rider.repairProgress ?? 0}/${REPAIR_WORK}` };
    case 'lover': return { line: L('恋人相邻：基价翻倍', 'Beside a Lover: fare ×2') };
    case 'musician': return { line: L('躁动拉向中档 · 中档 +2/层', 'Pulls agitation to medium · +2/floor there') };
    case 'thief': return { line: L('没人管：每层偷邻座 1–4 币 · +1 躁动 · 挨纸箱就偷走', 'Unguarded: steals 1–4 per neighbour a floor · +1 agitation · steals boxes') };
    case 'cop': return { line: L('管住小偷 · 锁住炸弹', 'Controls Thieves · locks Bombs') };
    case 'lawyer': return { line: L('管住小偷 · 红线少扣 2 币', 'Controls Thieves · red links −2 coin loss') };
    case 'drunk': return { line: L('高躁动到站：基价翻倍', 'Arrives at high agitation: fare ×2') };
    case 'nurse': return { line: L('每位邻座 −1 躁动/层', '−1 agitation per neighbor/floor') };
    case 'child': return (rider.careProgress ?? 0) >= CHILD_CARE_WORK ? { line: L(`已照顾好 · 到站 +${CHILD_CARE_BONUS}`, `Cared for · +${CHILD_CARE_BONUS} on arrival`) } : { line: L(`有人照顾 ${CHILD_CARE_WORK} 层 → +${CHILD_CARE_BONUS}`, `Cared for ${CHILD_CARE_WORK} floors → +${CHILD_CARE_BONUS}`), progress: `${rider.careProgress ?? 0}/${CHILD_CARE_WORK}` };
    case 'ghost': return { line: L('不耗电 · 没人管会延误邻座', 'No power · delays neighbors if uncontrolled') };
    case 'exorcist': return { line: L('管住幽灵 · 每只省 1 电/层', 'Controls Ghosts · −1 power each/floor') };
    case 'coach': return { line: L('邻座车费 +50%', 'Neighbors’ fare +50%') };
    case 'celebrity': return { line: L('恰好 1 位邻座 +2/层', 'Exactly 1 neighbor: +2/floor') };
    case 'inspector': return rider.complianceReady ? { line: L(`已盖章 · 到站 +${INSPECTION_BONUS}`, `Stamped · +${INSPECTION_BONUS} on arrival`) } : { line: L(`连续不高躁动 → +${INSPECTION_BONUS}`, `Stay below high → +${INSPECTION_BONUS}`), progress: `${rider.quietStreak ?? 0}/${INSPECTION_WORK}` };
    case 'bomb': return { line: L('到站前归零即失败 · 警察可锁', 'Fails if it hits zero aboard · Officer locks'), progress: `⏱ ${rider.fuse ?? 0}` };
    case 'mystery': { const f = rider.traits?.fare ?? 16; const band = f <= 13 ? L('低档 8–13', 'low 8–13') : f <= 19 ? L('中档 14–19', 'mid 14–19') : L('高档 20–24', 'high 20–24'); return { line: L(`车费${band} · 到站揭晓`, `Fare ${band} · revealed on arrival`) }; }
    case 'shifter': return { line: L('每层重抽属性', 'Rerolls every floor') };
    case 'mimic': { const slot = run.cabin.findIndex(r => r?.id === rider.id); const above = slot >= 3 ? run.cabin[slot - 3] : null; if (above?.kind === 'parcel') return { line: L('↑ 复制纸箱 · 下车打开', '↑ Copies the box · opens it when leaving') }; return { line: above ? L(`↑ 复制${riderName(above.kind, locale)}车费 ${profile.fare}`, `↑ Copies ${riderName(above.kind, locale)}: fare ${profile.fare}`) : L('↑ 复制正上方的车费', '↑ Copies the fare above') }; }
    case 'operator': return { line: L('车内不满 6 人时运转 −1 电', 'Motor −1 unless the cabin is full') };
    case 'matchmaker': return { line: L(`恋人常来 · 邻座到站 +${LEGEND_RULES.matchmakerNeighbourCoins}`, `More Lovers · neighbors +${LEGEND_RULES.matchmakerNeighbourCoins}`) };
    case 'don': return { line: L(`每层存 ${LEGEND_RULES.donStashPerFloor} 币 · +1 躁动`, `Banks ${LEGEND_RULES.donStashPerFloor}/floor · +1 agitation`), progress: rider.stash ? `🪙 ${rider.stash}` : undefined };
    case 'matron': return { line: L('全车 −1 躁动/层 · 安静多赚', 'Cabin −1 agitation/floor · calm pays') };
    case 'nightingale': return { line: L(`中躁动 +${LEGEND_RULES.nightingaleMediumCoins}/层`, `+${LEGEND_RULES.nightingaleMediumCoins}/floor at medium`) };
    case 'medium': return { line: L('幽灵提前出现 · 身边幽灵受控', 'Ghosts come early · controls adjacent') };
    case 'tycoon': return { line: L(`预付 ${LEGEND_RULES.tycoonPrepay} · 安静送达再付 ${LEGEND_RULES.tycoonBalance}`, `Prepays ${LEGEND_RULES.tycoonPrepay} · ${LEGEND_RULES.tycoonBalance} more if calm`) };
    case 'stranger': return { line: L('每层随机小惊喜', 'A small surprise every floor') };
  }
}

const ICON_TITLE: Record<ConflictEffect, [string, string]> = {
  agitation: ['每层 +1 躁动', '+1 agitation per floor'],
  energy: ['每层额外耗 1 电', '+1 power per floor'],
  coins: ['每层损失 2 金币', '−2 coins per floor'],
  overload: ['两人耗电 ×2', 'Both use ×2 power'],
  gamble: ['两人耗电 ×2；到站基价额外 +100%', 'Both use ×2 power; +100% base fare on arrival'],
};
const ICON: Record<ConflictEffect, CardChip['icon']> = { agitation: 'agitation', energy: 'energy', coins: 'coins', overload: 'energy', gamble: 'mixed' };

/** Green partners: listed bonds plus the ability links a player can act on. */
const ABILITY_PARTNERS: Partial<Record<PassengerKind, PassengerKind[]>> = {
  lover: ['lover'], thief: ['cop', 'lawyer'], cop: ['thief', 'bomb'], lawyer: ['thief'], drunk: ['nurse'], child: ['lover', 'nurse'],
  ghost: ['exorcist'], exorcist: ['ghost'], bomb: ['cop'], musician: ['tourist'], medium: ['ghost'], matchmaker: ['lover'], don: ['thief'], matron: ['child', 'drunk'],
};

export function cardChips(rider: Rider, run: RunState, locale: GameLocale): CardChip[] {
  const profile = riderProfile(rider, run.cabin);
  const green = [...new Set([...(ABILITY_PARTNERS[rider.kind] ?? []), ...profile.bond.likes])];
  const chips: CardChip[] = [];
  const names = (kinds: PassengerKind[]) => kinds.map(k => riderName(k, locale)).join(' / ');
  if (rider.kind === 'tourist' || rider.kind === 'coach' || rider.kind === 'nurse') chips.push({ tone: 'green', kinds: [], label: t(locale, '任何邻座', 'Any neighbor'), title: t(locale, '每位邻座都算', 'Every neighbor counts') });
  if (green.length) chips.push({ tone: 'green', kinds: green, label: names(green), title: t(locale, `与${names(green)}相邻有加成`, `Bonus beside ${names(green)}`) });
  const groups = new Map<ConflictEffect, PassengerKind[]>();
  for (const rule of riderConflictRules(rider, run.cabin)) groups.set(rule.effect, [...(groups.get(rule.effect) ?? []), rule.target]);
  for (const [effect, kinds] of groups) chips.push({ tone: 'red', kinds, label: names(kinds), icon: ICON[effect], title: `${names(kinds)}：${t(locale, ...ICON_TITLE[effect])}` });
  if (passengerCategory(rider.kind) === 'bad' && !isLegend(rider.kind)) chips.push({ tone: 'risk', kinds: RISK_PARTNERS, label: t(locale, '同伙', 'Crew'), title: t(locale, '与未受控的小偷/醉汉/炸弹客相邻：每人每层暂存 3 币（高躁动 4），每条链接 +1 躁动；送达才兑现', 'Beside an unguarded Thief/Drifter/Bomb: each banks 3/floor (4 at high), +1 agitation per link; paid only on delivery') });
  return chips;
}

export function cardSummary(rider: Rider, run: RunState, locale: GameLocale): CardSummary {
  return { ...cardLine(rider, run, locale), chips: cardChips(rider, run, locale) };
}

/** Short live status for seated riders (cabin tiles). */
export function seatStatus(rider: Rider, run: RunState, slot: number, locale: GameLocale): { label: string; tone: 'active' | 'warn' | 'neutral' } | null {
  const L = (zh: string, en: string) => t(locale, zh, en);
  const cabin = run.cabin;
  switch (rider.kind) {
    case 'tourist': { const n = neighbourCount(cabin, slot) + Number(hasNeighbour(cabin, slot, ['nightingale'])); return n ? { label: L(`${n} 位邻座 · +${n * 2}`, `${n} neighbors · +${n * 2}`), tone: 'active' } : { label: L('等待邻座', 'Needs neighbors'), tone: 'neutral' }; }
    default: return null;
  }
}
