// Compact passenger cards: one ability line, relation chips and at most two tags.
// Full sentences stay in the rule sheet. Text is produced per locale here rather than
// through phrase translation, so numbers on the card can never go stale.
import { PASSENGERS, isDark, type PassengerKind } from './game-data';
import { riderConflictRules, riderProfile, type ConflictEffect } from './rider-profile';
import { hasNeighbour, neighbourCount, type Rider, type RunState } from './game-engine';
import { CHILD_CARE_BONUS, CHILD_CARE_WORK, COMMUTER_QUIET_BONUS, INSPECTION_BONUS, INSPECTION_WORK, REPAIR_DURATION, REPAIR_WORK, TOURIST_MEDIUM_BONUS } from './balance-v832';
import { RISK_PARTNERS } from './shift-rules';
import { DARK_LEGEND_RULES, LEGEND_RULES } from './legends';
import { DARK_RULES, MYSTERY_CLUES, MYSTERY_RULES, abyssTier, mysteryClue } from './dark-rules';
import type { GameLocale } from './i18n';

export type ChipTone = 'green' | 'red' | 'risk';
export type CardChip = { tone: ChipTone; kinds: PassengerKind[]; label: string; icon?: 'agitation' | 'energy' | 'coins' | 'mixed'; title: string };
export type CardSummary = { line: string; progress?: string; sealed?: boolean; chips: CardChip[] };

const EN_NAMES: Record<PassengerKind, string> = {
  parcel: 'Parcel', commuter: 'Commuter', tourist: 'Tourist', courier: 'Courier', mechanic: 'Mechanic', lover: 'Lover', musician: 'Musician',
  thief: 'Thief', cop: 'Officer', lawyer: 'Counsel', drunk: 'Drifter', nurse: 'Nurse', child: 'Child', ghost: 'Ghost', exorcist: 'Warden',
  coach: 'Coach', celebrity: 'Celebrity', inspector: 'Inspector', bomb: 'Bomb Carrier', mystery: 'Mystery', shifter: 'Shifter', mimic: 'Mimic',
  overtimer: 'Overtimer', voyeur: 'Voyeur', smuggler: 'Smuggler', scrapper: 'Scrapper', exlover: 'Ex', noisemaker: 'Noisemaker',
  robber: 'Robber', crookedcop: 'Crooked Cop', shyster: 'Shyster', brawler: 'Brawler', pusher: 'Pusher', creepychild: 'Uncanny Child',
  wraith: 'Wraith', summoner: 'Summoner', taskmaster: 'Taskmaster', scandal: 'Scandal', grafter: 'Grafter', madbomber: 'Mad Bomber',
  operator: 'Old Zhou', matchmaker: 'Matchmaker', don: 'The Don', matron: 'Matron', nightingale: 'Nightingale', medium: 'Medium', tycoon: 'Tycoon', stranger: 'Stranger in 13',
  nightoperator: 'Night Zhou', severer: 'Severer', kingpin: 'Kingpin', coldmatron: 'Cold Matron', banshee: 'Banshee', necromancer: 'Necromancer', highroller: 'High Roller', otherthirteen: 'Other Thirteen',
};
export const riderName = (kind: PassengerKind, locale: GameLocale) => (locale === 'zh' ? PASSENGERS[kind].name : EN_NAMES[kind]);
/** v9.17 display name for one rider: box size, the Bomber in disguise. Rarity shows as the gem and foil, not in the name. */
export function displayName(rider: Pick<Rider, 'kind' | 'big' | 'disguised'> & { contraband?: boolean }, locale: GameLocale) {
  const zh = locale === 'zh';
  if (rider.kind === 'parcel' && rider.contraband) return zh ? (rider.big ? '大黑箱' : '黑箱') : rider.big ? 'Black Crate' : 'Black Box';
  if (rider.kind === 'parcel') return zh ? (rider.big ? '大纸箱' : '纸箱') : rider.big ? 'Crate' : 'Parcel';
  if (rider.disguised) return zh ? '乔装的通勤者' : 'Disguised Commuter';
  return riderName(rider.kind, locale);
}

const t = (locale: GameLocale, zh: string, en: string) => (locale === 'zh' ? zh : en);

/** One short line: what this rider does for you, with live values. */
export function cardLine(rider: Rider, run: RunState, locale: GameLocale): { line: string; progress?: string; sealed?: boolean } {
  const L = (zh: string, en: string) => t(locale, zh, en);
  const profile = riderProfile(rider, run.cabin);
  switch (rider.kind) {
    case 'commuter': return { line: L(`低躁动到站 +${COMMUTER_QUIET_BONUS}币`, `+${COMMUTER_QUIET_BONUS} coins if calm on arrival`) };
    case 'tourist': return { line: L(`每位邻座 +2币 · 中躁动 +${TOURIST_MEDIUM_BONUS}币`, `+2 coins per neighbor · +${TOURIST_MEDIUM_BONUS} at medium`) };
    case 'courier': {
      if (!rider.parcelId) return { line: L('到站回 2 电', 'Returns 2 power on arrival') };
      // Amounts live in the value tags ("On arrival", "w/ box"); the line says only what he needs.
      return { line: L('纸箱在旁才付钱 · 回 2 电 · 空手可接炸弹', 'Pays only with his box beside him · 2 power · empty-handed takes bombs') };
    }
    case 'parcel': {
      if (rider.contraband) return { line: rider.big ? L('占同一列上下两格 · 挨着走私客送达（箱价×2）· 检查员会没收', 'Fills one column · delivered beside the Smuggler (value ×2) · an Inspector seizes it') : L('挨着走私客送达（箱价×2）· 检查员会没收，贪腐检查员放行', 'Delivered beside the Smuggler (value ×2) · an Inspector seizes it, a Grafter waves it through') };
      return { line: rider.big ? L('占同一列上下两格 · 挨着快递员送达', 'Fills one column · delivered beside a Courier') : L('挨着快递员送达 · 无主时到站开箱，内容未知', 'Delivered beside a Courier · unclaimed, opens on arrival: contents unknown') };
    }
    case 'mechanic': return rider.repairDone ? { line: L(`检修完成 · ${REPAIR_DURATION} 层省电`, `Repaired · ${REPAIR_DURATION} floors cheaper`) } : { line: L(`低躁动检修 → ${REPAIR_DURATION} 层运转 −1`, `Calm repair → motor −1 for ${REPAIR_DURATION}`), progress: `${rider.repairProgress ?? 0}/${REPAIR_WORK}` };
    case 'lover': return { line: L('恋人相邻：基价翻倍', 'Beside a Lover: fare ×2') };
    case 'musician': return { line: L('躁动拉向中档 · 中档 +2币/层', 'Pulls agitation to medium · +2 coins/floor there') };
    case 'thief': return { line: L('没人管：每层偷邻座 1–4 币 · +1 躁动 · 挨纸箱就偷走', 'Unguarded: steals 1–4 per neighbor a floor · +1 agitation · steals boxes') };
    case 'cop': return { line: L('管住小偷 · 锁住炸弹', 'Controls Thieves · locks Bombs') };
    case 'lawyer': return { line: L('管住小偷 · 红线少扣 2 币', 'Controls Thieves · red links −2 coin loss') };
    case 'drunk': return { line: L('高躁动到站：基价翻倍', 'Arrives at high agitation: fare ×2') };
    case 'nurse': return { line: L('抵消每位邻座自身躁动 1/层', 'Cancels 1 of each neighbor’s own agitation/floor') };
    case 'child': return (rider.careProgress ?? 0) >= CHILD_CARE_WORK ? { line: L(`已照顾好 · 到站 +${CHILD_CARE_BONUS}币`, `Cared for · +${CHILD_CARE_BONUS} coins on arrival`) } : { line: L(`有人照顾 ${CHILD_CARE_WORK} 层 → +${CHILD_CARE_BONUS}币`, `Cared for ${CHILD_CARE_WORK} floors → +${CHILD_CARE_BONUS} coins`), progress: `${rider.careProgress ?? 0}/${CHILD_CARE_WORK}` };
    case 'ghost': return { line: L('不耗电 · 没人管会延误邻座', 'No power · delays neighbors if uncontrolled') };
    case 'exorcist': return { line: L('管住幽灵 · 每只省 1 电/层', 'Controls Ghosts · −1 power each/floor') };
    case 'coach': return { line: L('邻座车费 +50%', 'Neighbors’ fare +50%') };
    case 'celebrity': return { line: L('恰好 1 位邻座 +2币/层', 'Exactly 1 neighbor: +2 coins/floor') };
    case 'inspector': return rider.complianceReady ? { line: L(`已盖章 · 到站 +${INSPECTION_BONUS}币`, `Stamped · +${INSPECTION_BONUS} coins on arrival`) } : { line: L(`连续不高躁动 → +${INSPECTION_BONUS}币`, `Stay below high → +${INSPECTION_BONUS} coins`), progress: `${rider.quietStreak ?? 0}/${INSPECTION_WORK}` };
    case 'bomb': return { line: L('归零会炸飞邻座 · 警察可锁', 'Blows out neighbors at zero · Officer locks'), progress: `⏱ ${rider.fuse ?? 0}` };
    // v9.19: a hidden identity, revealed one floor after boarding (the fare stays sealed until then).
    case 'mystery': return rider.revealed && rider.identity ? { line: L(`${MYSTERY_RULES[rider.identity].name} · ${MYSTERY_RULES[rider.identity].zh}`, `${MYSTERY_RULES[rider.identity].en} · ${MYSTERY_RULES[rider.identity].enLine}`) } : (() => { const clue = mysteryClue(rider); return { line: clue ? L(`线索：${MYSTERY_CLUES[clue].zh} · 上车后下一层揭晓 · 车费`, `Clue: ${MYSTERY_CLUES[clue].en} · revealed the floor after boarding · Fare`) : L('身份未知 · 上车后下一层揭晓 · 车费', 'Identity unknown · revealed the floor after boarding · Fare'), sealed: true }; })();
    case 'shifter': return { line: L('每层重抽属性', 'Rerolls every floor') };
    case 'mimic': { const slot = run.cabin.findIndex(r => r?.id === rider.id); const above = slot >= 3 ? run.cabin[slot - 3] : null; if (above?.kind === 'parcel') return { line: L('↑ 复制纸箱 · 下车打开', '↑ Copies the box · opens it when leaving') }; if (slot >= 0 && slot < 3) return { line: L(`上排没人可复制 · 本体车费 ${profile.fare}币`, `Top row: nothing above · own fare ${profile.fare} coins`) }; if (above && profile.hidden) return { line: L(`↑ 复制${riderName(above.kind, locale)}车费`, `↑ Copies ${riderName(above.kind, locale)}: fare`), sealed: true }; return { line: above ? L(`↑ 复制${riderName(above.kind, locale)}车费 ${profile.fare}币`, `↑ Copies ${riderName(above.kind, locale)}: fare ${profile.fare} coins`) : L('↑ 复制正上方的车费', '↑ Copies the fare above') }; }
    case 'operator': return { line: L('车内不满 6 人时运转 −1 电', 'Motor −1 unless the cabin is full') };
    case 'matchmaker': return { line: L(`恋人常来 · 邻座到站 +${LEGEND_RULES.matchmakerNeighbourCoins}币`, `More Lovers · neighbors +${LEGEND_RULES.matchmakerNeighbourCoins} coins`) };
    case 'don': return { line: L(`每层存 ${LEGEND_RULES.donStashPerFloor} 币 · +1 躁动 · 身边的小偷不躁动`, `Banks ${LEGEND_RULES.donStashPerFloor}/floor · +1 agitation · Thieves beside him stay calm`), progress: rider.stash ? L(`已存 ${rider.stash}币`, `${rider.stash} coins banked`) : undefined };
    case 'matron': return { line: L('全车 −1 躁动/层 · 安静多赚', 'Cabin −1 agitation/floor · calm pays') };
    case 'nightingale': return { line: L(`中躁动 +${LEGEND_RULES.nightingaleMediumCoins}币/层`, `+${LEGEND_RULES.nightingaleMediumCoins} coins/floor at medium`) };
    case 'medium': return { line: L('幽灵提前出现 · 身边幽灵受控', 'Ghosts come early · controls adjacent') };
    case 'tycoon': return { line: L(`预付 ${LEGEND_RULES.tycoonPrepay}币 · 安静送达再付 ${LEGEND_RULES.tycoonBalance}币 · 邻座超过1人 +1躁动`, `Prepays ${LEGEND_RULES.tycoonPrepay} coins · ${LEGEND_RULES.tycoonBalance} more if calm · 2+ neighbors: +1 agitation`) };
    case 'stranger': return { line: L('每层随机小惊喜', 'A small surprise every floor') };
    // v9.20 dark legends.
    case 'nightoperator': return { line: L(`运转 −${DARK_LEGEND_RULES.nightOperatorSaving}电（满员也算） · +${DARK_LEGEND_RULES.nightOperatorAgitation}躁动/层`, `Motor −${DARK_LEGEND_RULES.nightOperatorSaving} power (even when full) · +${DARK_LEGEND_RULES.nightOperatorAgitation} agitation/floor`) };
    case 'severer': return { line: L(`每条红线 +${DARK_LEGEND_RULES.severerPerRed}币/层 · 每条绿线 +${DARK_LEGEND_RULES.severerPerGreen}躁动/层`, `+${DARK_LEGEND_RULES.severerPerRed} coins per red link/floor · +${DARK_LEGEND_RULES.severerPerGreen} agitation per green link/floor`) };
    case 'kingpin': return { line: L(`每层存 ${DARK_LEGEND_RULES.kingpinStash}币 · +${DARK_LEGEND_RULES.kingpinAgitation}躁动/层 · 请离赔 ${DARK_LEGEND_RULES.kingpinDismissal}币`, `Banks ${DARK_LEGEND_RULES.kingpinStash}/floor · +${DARK_LEGEND_RULES.kingpinAgitation} agitation/floor · dismissal costs ${DARK_LEGEND_RULES.kingpinDismissal}`), progress: rider.stash ? L(`已存 ${rider.stash}币`, `${rider.stash} coins banked`) : undefined };
    case 'coldmatron': return { line: L(`全车 −${DARK_LEGEND_RULES.coldMatronCalm}躁动/层 · 她的药品每层耗 ${DARK_LEGEND_RULES.coldMatronPower} 电`, `Cabin −${DARK_LEGEND_RULES.coldMatronCalm} agitation/floor · her drugs use ${DARK_LEGEND_RULES.coldMatronPower} power/floor`) };
    case 'banshee': return { line: L(`+${DARK_LEGEND_RULES.bansheeAgitation}躁动/层 · 高躁动 +${DARK_LEGEND_RULES.bansheeHighCoins}币/层`, `+${DARK_LEGEND_RULES.bansheeAgitation} agitation/floor · +${DARK_LEGEND_RULES.bansheeHighCoins} coins/floor at high`) };
    case 'necromancer': return { line: L(`每位暗黑乘客 +${DARK_LEGEND_RULES.necromancerPerDark}币/层 · +${DARK_LEGEND_RULES.necromancerAgitation}躁动/层`, `+${DARK_LEGEND_RULES.necromancerPerDark} coins per dark rider/floor · +${DARK_LEGEND_RULES.necromancerAgitation} agitation/floor`) };
    case 'highroller': return { line: L('一路押注 · 只看到站那一层关门时的躁动', 'One long bet · only the agitation when the doors close before his stop counts') };
    case 'otherthirteen': return { line: L('每层一件随机的好事或坏事', 'Something good or bad every floor') };
    // v9.19 dark versions.
    case 'overtimer': return { line: L(`加班费 +${DARK_RULES.overtimePay}币/层 · 要跟邻座一起下车`, `Overtime +${DARK_RULES.overtimePay} coins/floor · gets off only with a neighbor`), progress: rider.stash ? L(`已攒 ${rider.stash}币`, `${rider.stash} coins banked`) : undefined };
    case 'voyeur': return { line: L(`偷拍普通邻座：+1躁动/层 · 每张 +${DARK_RULES.voyeurPhoto}币`, `Photographs normal neighbors: +1 agitation/floor · +${DARK_RULES.voyeurPhoto} coins each`), progress: rider.stash ? L(`照片 ${rider.stash}币`, `${rider.stash} coins of photos`) : undefined };
    case 'smuggler': return { line: L(`黑箱在旁才付钱 · 箱价×${DARK_RULES.smugglerBoxMultiplier} · 普通检查员会没收`, `Pays only with his black box · box ×${DARK_RULES.smugglerBoxMultiplier} · an Inspector seizes it`) };
    case 'scrapper': return { line: L(`每层卖零件 +${DARK_RULES.scrapperCoins}币 · 运转 +${DARK_RULES.scrapperMotor}电`, `Sells parts +${DARK_RULES.scrapperCoins} coins/floor · motor +${DARK_RULES.scrapperMotor} power`) };
    case 'exlover': return { line: L('两位怨偶相邻就吵 · 分开坐：基价×2', 'Two Exes side by side quarrel · apart: fare ×2') };
    case 'noisemaker': return { line: L(`躁动往上拉 +1/层 · 高躁动 +${DARK_RULES.noiseHighCoins}币/层 · 下车 −${DARK_RULES.troublemakerRelief}躁动`, `Pushes agitation up +1/floor · +${DARK_RULES.noiseHighCoins} coins/floor at high · −${DARK_RULES.troublemakerRelief} agitation when he leaves`) };
    case 'robber': return { line: L(`没人管：每层抢你的钱包、+1躁动 · 被管住：赏金 +${DARK_RULES.robberBounty}币`, `Unguarded: robs your wallet each floor, +1 agitation · held: bounty +${DARK_RULES.robberBounty} coins`) };
    case 'crookedcop': return { line: L(`管住身边坏人 · 全车 −1躁动/层 · 收保护费 ${DARK_RULES.crookedFee + 2 * abyssTier(run.floor + 1)}币/层`, `Holds bad riders beside him · cabin −1 agitation/floor · takes ${DARK_RULES.crookedFee + 2 * abyssTier(run.floor + 1)} coins/floor`) };
    case 'shyster': return { line: L(`每条红线 +${DARK_RULES.shysterPerRed}币/层（最多${DARK_RULES.shysterCap}）`, `+${DARK_RULES.shysterPerRed} coins per red link/floor (max ${DARK_RULES.shysterCap})`) };
    case 'brawler': return { line: L(`+1躁动/层，每位普通邻座再 +1 · 高躁动到站基价×3 · 下车 −${DARK_RULES.troublemakerRelief}躁动`, `+1 agitation/floor, +1 per normal neighbor · fare ×3 at high · −${DARK_RULES.troublemakerRelief} agitation when he leaves`) };
    case 'pusher': return { line: L(`邻座自身躁动 −${DARK_RULES.pusherCalm}/层 · 她下车后邻座戒断`, `Neighbors’ own agitation −${DARK_RULES.pusherCalm}/floor · withdrawal after she leaves`) };
    case 'creepychild': return { line: L(`每位普通邻座 +1躁动/层 · 独自到站 +${DARK_RULES.creepyAloneBonus}币`, `+1 agitation per normal neighbor/floor · alone on arrival +${DARK_RULES.creepyAloneBonus} coins`) };
    case 'wraith': return { line: L(`没人管：每层拖延邻座、吸 ${DARK_RULES.wraithDrain + abyssTier(run.floor + 1)}电 · 受控 +${DARK_RULES.wraithControlledCoins}币/层`, `Uncontrolled: delays a neighbor and drains ${DARK_RULES.wraithDrain + abyssTier(run.floor + 1)} power each floor · controlled +${DARK_RULES.wraithControlledCoins} coins/floor`) };
    case 'summoner': return { line: L(`管住幽灵 · 每${DARK_RULES.summonEvery}层召一只幽灵 · 身边幽灵车费×2`, `Controls Ghosts · summons one every ${DARK_RULES.summonEvery} floors · Ghosts beside him ×2`) };
    case 'taskmaster': return { line: L('邻座车费 +100% · 普通邻座各 +1躁动/层', 'Neighbors’ fare +100% · +1 agitation per normal neighbor/floor') };
    case 'scandal': return { line: L(`每位邻座 +${DARK_RULES.scandalPerNeighbour}币/层 · 检查员或黑警在旁：曝光归零`, `+${DARK_RULES.scandalPerNeighbour} coins per neighbor/floor · beside an Inspector or Crooked Cop: exposed, fare 0`), progress: rider.stash ? L(`热度 ${rider.stash}币`, `${rider.stash} coins of buzz`) : undefined };
    case 'grafter': return { line: L(`每位邻座收 ${DARK_RULES.grafterFee}币/层（车厢 +1躁动）· 放行黑箱`, `${DARK_RULES.grafterFee} coins per neighbor/floor (cabin +1 agitation) · lets black boxes through`) };
    case 'madbomber': return { line: L('普通警察锁不住 · 归零即失败 · 黑警或引线剪能对付', 'Officers cannot lock it · zero ends the shift · Crooked Cop or wire cutter'), progress: `⏱ ${rider.fuse ?? 0}` };
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
  robber: ['cop', 'crookedcop'], crookedcop: ['robber', 'thief', 'drunk', 'brawler', 'madbomber'], wraith: ['exorcist', 'summoner'], summoner: ['ghost', 'wraith'], madbomber: ['crookedcop'],
  smuggler: ['grafter'], scrapper: ['grafter'], brawler: ['crookedcop'],
};

export function cardChips(rider: Rider, run: RunState, locale: GameLocale): CardChip[] {
  const profile = riderProfile(rider, run.cabin);
  // v9.19.1: before midnight the dark riders do not exist yet, so ordinary cards do not name them.
  const met = (k: PassengerKind) => !isDark(k) || run.floor >= DARK_RULES.midnightFloor || run.cabin.some(r => r?.kind === k);
  const green = [...new Set([...(ABILITY_PARTNERS[rider.kind] ?? []), ...profile.bond.likes])].filter(met);
  const chips: CardChip[] = [];
  const names = (kinds: PassengerKind[]) => kinds.map(k => riderName(k, locale)).join(' / ');
  if (rider.kind === 'tourist' || rider.kind === 'coach' || rider.kind === 'nurse') chips.push({ tone: 'green', kinds: [], label: t(locale, '任何邻座', 'Any neighbor'), title: t(locale, '每位邻座都算', 'Every neighbor counts') });
  if (green.length) chips.push({ tone: 'green', kinds: green, label: names(green), title: t(locale, `与${names(green)}相邻有加成`, `Bonus beside ${names(green)}`) });
  const groups = new Map<ConflictEffect, PassengerKind[]>();
  for (const rule of riderConflictRules(rider, run.cabin)) if (met(rule.target)) groups.set(rule.effect, [...(groups.get(rule.effect) ?? []), rule.target]);
  for (const [effect, kinds] of groups) chips.push({ tone: 'red', kinds, label: names(kinds), icon: ICON[effect], title: `${names(kinds)}：${t(locale, ...ICON_TITLE[effect])}` });
  if (RISK_PARTNERS.includes(rider.kind)) chips.push({ tone: 'risk', kinds: RISK_PARTNERS, label: t(locale, '同伙', 'Crew'), title: t(locale, '与未受控的小偷/醉汉/炸弹客相邻：每人每层暂存 3 币（高躁动 4），每条链接 +1 躁动；送达才兑现', 'Beside an unguarded Thief/Drifter/Bomb: each banks 3/floor (4 at high), +1 agitation per link; paid only on delivery') });
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
