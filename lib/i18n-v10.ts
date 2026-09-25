import { SYMBOLS, SYMBOL_GLYPH, SYMBOL_KEYS, symbolTitle } from './symbols';
import { SYMBOL_SHAPE_RULE } from './rider-profile';
// v10 symbol links: English for the symbol names, their rule lines, the sheet heading and the rewritten keepsake/ability texts.
export const V10_PAIRS: Array<[string, string]> = [
  ...SYMBOL_KEYS.map(k => [SYMBOLS[k].zh, SYMBOLS[k].en] as [string, string]),
  ...SYMBOL_KEYS.map(k => [symbolTitle(k, true), symbolTitle(k, false)] as [string, string]),
  [SYMBOL_SHAPE_RULE, 'Matching and opposite symbols cancel one for one. A row of one symbol adds a level (+1), a 2×2 square two (+2), a full cabin four (+4).'],
  ['赚钱的符号（🎉热闹、🎲江湖）每级绿线每层多 +2 金币。本局限装一次。', 'Coin symbols (🎉 Lively, 🎲 Street) pay 2 more coins per green-link level per floor. One per run.'],
  ['赚钱的符号（🎉热闹、🎲江湖）每级绿线每层 +2 金币；此后未配对恋人呼唤同伴的概率为35%。', 'Coin symbols (🎉 Lively, 🎲 Street) pay 2 more coins per green-link level per floor; an unpaired Lover now calls a partner 35% of the time.'],
  ['符号绿线省电', 'Symbol links save power'],
  ['新手示例 · 让两位恋人成为邻座：两人都有 🏠🤫，会连出绿线', 'Tutorial · seat the two Lovers side by side: both carry 🏠🤫, so a green line appears'],
  ['绿线：相同符号 · 红线：相反符号 · 紫箭头复制', 'Green: shared symbol · Red: opposite symbols · Purple arrow: copy'],
  ['卡面基价 + 每位邻座2金币；中躁动再加3金币。', 'Card base fare + 2 coins per neighbour; +3 more at medium agitation.'],
  ['邻座奖励和中躁动奖励直接相加，不参与基价倍率。', 'Neighbour and medium-agitation coins are added straight on and are not multiplied with the base fare.'],
  ['每条红线每层付 1 金币“冲突小费”（每层最多 3）；红线躁动仍然生效。', 'Each red link pays a 1-coin “conflict tip” per floor (at most 3); red-link agitation still applies.'],
];
/** “符号：🎉热闹 · 🏠人间” → “Symbols: 🎉 Lively · 🏠 Hearth”. */
export const symbolHeadingEn = (text: string) => text.replace(/^符号：/u, 'Symbols: ').replace(new RegExp(SYMBOL_KEYS.map(k => SYMBOL_GLYPH[k] + SYMBOLS[k].zh).join('|'), 'gu'), m => { const k = SYMBOL_KEYS.find(x => SYMBOL_GLYPH[x] + SYMBOLS[x].zh === m)!; return `${SYMBOL_GLYPH[k]} ${SYMBOLS[k].en}`; });
