import { PASSENGERS, DARK_LEGEND_KINDS } from './game-data';
import { MYSTERY_CLUES } from './dark-rules';
// v9.20: English for the dark legends, the Mystery's clues and the new floor notes.
const DETAIL_EN: Record<string, [string, string]> = {
  nightoperator: ['Dark legend · motor −2 power; +2 agitation/floor', 'Old Zhou’s night shift. Boards after the 60F shop and leaves at the 70F shop; uses no power and pays no fare. While aboard the motor costs 2 less power every floor (even with a full cabin), but he has turned the lights off: +2 agitation per floor. On arrival he leaves one free power-box level.'],
  severer: ['Dark legend · +3 coins per red link/floor; +1 agitation per green link/floor', 'The Matchmaker’s night: she holds scissors now. Boards after the 60F shop and leaves at the 70F shop; uses no power and pays no fare. Each red link in the cabin pays you 3 coins per floor; each green link adds 1 agitation per floor. Pays 25 coins on arrival.'],
  kingpin: ['Dark legend · banks 8 coins/floor; +1 agitation/floor; dismissal costs 30', 'The Don’s night has no rules. Boards after the 60F shop and leaves at the 70F shop; uses no power and pays no fare. While aboard he banks 8 coins per floor, paid on arrival, and adds 1 agitation per floor. Putting him off early costs 30 coins and forfeits the bank.'],
  coldmatron: ['Dark legend · cabin −2 agitation/floor; +2 power/floor', 'The Matron’s night shift has only sedatives left. Boards after the 60F shop and leaves at the 70F shop; pays no fare. While aboard the whole cabin loses 2 agitation per floor, but her refrigerated drugs cost 2 more power per floor. On arrival your agitation cap rises by 2 for good.'],
  banshee: ['Dark legend · +1 agitation/floor; +10 coins/floor at high', 'The Nightingale’s song has become a wail. Boards after the 60F shop and leaves at the 70F shop; uses no power and pays no fare. +1 agitation per floor; at high agitation when the doors close she pays 10 coins per floor. Pays 15 coins on arrival.'],
  necromancer: ['Dark legend · +2 coins per dark rider/floor; +1 agitation/floor', 'The Medium no longer comforts the dead; she collects them. Boards after the 60F shop and leaves at the 70F shop; uses no power and pays no fare. +2 coins per floor for every dark rider aboard; +1 agitation per floor. Pays 20 coins on arrival.'],
  highroller: ['Dark legend · calm arrival pays 80; otherwise takes 25', 'The Tycoon put everything on the table. Boards after the 60F shop and leaves at the 70F shop; uses no power and pays no fare. On arrival, if the doors closed at low agitation he pays 80 coins; otherwise he takes 25 of yours (or all you have).'],
  otherthirteen: ['Dark legend · something good or bad every floor', 'The one in the mirror of room 13. Boards after the 60F shop and leaves at the 70F shop; uses no power and pays no fare. Every floor at random: +8 coins, +2 agitation, −2 power or nothing. Pays 0–40 coins at random on arrival.'],
};
const NAMES_EN: Record<string, string> = { nightoperator: 'Night Zhou', severer: 'Severer', kingpin: 'Kingpin', coldmatron: 'Cold Matron', banshee: 'Banshee', necromancer: 'Necromancer', highroller: 'High Roller', otherthirteen: 'Other Thirteen' };
export const V920_PAIRS: Array<[string, string]> = [
  ...DARK_LEGEND_KINDS.flatMap((k): Array<[string, string]> => [[PASSENGERS[k].name, NAMES_EN[k]], [PASSENGERS[k].short, DETAIL_EN[k][0]], [PASSENGERS[k].detail, DETAIL_EN[k][1]]]),
  ['暗黑传奇', 'Dark legend'],
  // Floor lines and receipts.
  ['夜班老周关灯省电', 'Night Zhou saves power in the dark'], ['冷面护士长冷藏药品', 'Cold Matron’s refrigerated drugs'], ['夜班老周关了灯', 'Night Zhou turned the lights off'],
  ['剪线婆剪断绿线', 'The Severer cuts green links'], ['黑老大的威压', 'The Kingpin’s menace'], ['冷面护士长打镇静剂', 'Cold Matron’s sedatives'],
  ['哭丧女哀嚎', 'The Banshee wails'], ['死灵师低语', 'The Necromancer whispers'], ['暗黑共鸣', 'Dark resonance'], ['另一个13号的馈赠', 'A gift from the Other Thirteen'],
  ['剪线婆收怨', 'The Severer collects grudges'], ['哭丧女的哀歌', 'The Banshee’s lament'], ['死灵师收魂', 'The Necromancer collects souls'],
  ['剪线婆的酬金', 'The Severer’s fee'], ['哭丧女的酬金', 'The Banshee’s fee'], ['死灵师的酬金', 'The Necromancer’s fee'], ['赌王赢了', 'The High Roller won'], ['赌王输了', 'The High Roller lost'],
  ['夜班老周留下一级免费配电箱升级', 'Night Zhou left a free power-box level'], ['冷面护士长留下病历：躁动上限 +2', 'The Cold Matron left her chart: agitation cap +2'],
  ['另一个13号：躁动 +2', 'Other Thirteen: agitation +2'],
  ['暗黑共鸣：全车都是黑夜里的人。', 'Dark resonance: everyone aboard belongs to the night.'],
  ['深渊躁动', 'Abyss unrest'], ['深渊加价', 'Abyss premium'], ['发作', ' lashes out'], ['暗黑版可能发作', 'Dark riders may lash out'], ['（每位 ', ' ('], ['%）', '% each)'],
  ['深渊里的暗黑版越来越极端：车费更高，但每层都可能发作 +3 躁动（卡上写着几率）。关门前看“失控几率”，赚够了就少带几位；照明弹和镇静剂能压住发作。', 'Deep in the abyss dark riders grow extreme: they pay more, but each floor they may lash out for +3 agitation (the odds are on their cards). Check the boil-over chance before closing the doors, carry fewer once you have earned enough; a Flare or a Sedative holds them off.'], ['每层随机一件好事或坏事', 'Something good or bad every floor'], ['等着有人吵架', 'Waiting for a quarrel'],
  [' 也可以卖掉一项能力、换上“安全余量”：躁动上限 +2，再用它的手动调节 −3。', ' Or sell an ability and take Safety Margin: agitation cap +2, then use its manual −3.'],
  [' 也可以免费装上“安全余量”：躁动上限 +2，再用它的手动调节 −3。', ' Or take Safety Margin for free: agitation cap +2, then use its manual −3.'],
  ['一路押注 · 只看到站那一层关门时的躁动', 'One long bet · only the agitation when the doors close before his stop counts'],
  ['深渊里每位暗黑乘客每层自己加躁动（80 层起 +1，每 5 层再 +1）：少带暗黑乘客，让药贩或好心人贴着他们，或点一颗照明弹撑过最紧的一层。', 'Deep in the abyss every dark rider adds agitation of his own each floor (+1 from 80F, +1 more every 5 floors): carry fewer dark riders, seat a Pusher or Good Samaritan beside them, or light a Flare for the tightest floor.'],
  ['深渊', 'The abyss'],
  // Mystery clues.
  ...Object.values(MYSTERY_CLUES).flatMap((c): Array<[string, string]> => [[`线索：${c.zh}`, `Clue: ${c.en}`], [`线索：${c.zh} · 上车后下一层揭晓`, `Clue: ${c.en} · revealed one floor after boarding`]]),
  ['线索', 'Clue'],
];
