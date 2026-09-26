import { SYMBOLS, SYMBOL_KEYS, symbolTitle } from './symbols';
import { SYMBOL_SHAPE_RULE } from './rider-profile';
// v10 symbol links: English for the symbol names, their rule lines, the sheet heading and the rewritten keepsake/ability texts.
export const V10_PAIRS: Array<[string, string]> = [
  ...SYMBOL_KEYS.map(k => [SYMBOLS[k].zh, SYMBOLS[k].en] as [string, string]),
  ...SYMBOL_KEYS.map(k => [symbolTitle(k, true), symbolTitle(k, false)] as [string, string]),
  [SYMBOL_SHAPE_RULE, 'Matching and opposite symbols cancel one for one. A row of one symbol adds a level (+1), a 2×2 square two (+2), a full cabin four (+4).'],
  ['赚钱的符号（热闹、江湖）每级绿线每层多 +2 金币。本局限装一次。', 'Coin symbols (Lively, Street) pay 2 more coins per green-link level per floor. One per run.'],
  ['赚钱的符号（热闹、江湖）每级绿线每层 +2 金币；此后未配对恋人呼唤同伴的概率为35%。', 'Coin symbols (Lively, Street) pay 2 more coins per green-link level per floor; an unpaired Lover now calls a partner 35% of the time.'],
  ['符号绿线省电', 'Symbol links save power'],
  ["车费按路程：每坐一层 1 币 · 0 耗电 · 没人管：+1 躁动/层、每 3 层延误一位邻座", "Fare by distance: 1 coin a floor · no power · unheld: +1 agitation a floor, delays a neighbour every 3rd floor"],
  ["不耗电，车费按路程算：每坐一层 1 金币（路程 5–10 层）。相邻驱魔师、召魂人或灵媒时受控：不作祟、不延误邻座，每层抵消 1 点人物耗电，到站再多 2 金币。没人管时每层 +1 躁动，到 3 的倍数层随机延误一位邻座 1 站。", "Uses no power; his fare is by distance: 1 coin a floor (rides 5–10 floors). Beside a Warden, Summoner or the Medium he is held: no haunting, no delays, he offsets 1 rider power a floor and pays 2 more on arrival. Unheld, he adds 1 agitation a floor and on every floor that is a multiple of 3 delays a random neighbour by 1 stop."],
  ['幽灵作祟', 'Ghost haunting'],
  ['电量也在这一层用完：离店前要留够到下个商店的电。', 'Power ran out on the same floor: leave each shop with enough power to reach the next.'],
  ['传奇不用请离券：点开他的人物详情，「请离」就能免费让他下车。', 'Legends need no Exit Pass: open their rider details and Dismiss lets them off for free.'],
  ['黑老大不能用请离券：在人物详情里请离他，要付一笔赔偿。', 'The Kingpin cannot take an Exit Pass: dismissing him from his rider details costs compensation.'],
  ['大师音乐家演出', 'Master Musician performance'], ['大师音乐家', 'Master Musician'],
  ['所有音乐家升级为大师音乐家：车费翻倍，中躁动时每位演出 +6 金币/层（普通 +2），把躁动往中档拉最多 3 点（普通 2 点）；而且从第 1 层起就出现，出现次数翻倍。', 'Every Musician becomes a Master Musician: fare doubled, +6 coins a floor each at medium agitation (a Musician +2), pulls agitation up to 3 toward medium (2); they appear from floor 1, twice as often.'],
  ['怨偶吵架', 'Exes fighting'],
  ["控制小偷（和警察一样）", "Controls Thieves (like an Officer)"],
  ["控制相邻小偷，不再产生偷窃躁动，到站额外+5。不能暂停炸弹。", "Controls adjacent Thieves: no theft agitation, +5 on arrival. Cannot pause bombs."],
  ["两位怨偶相邻就吵（各 +1 躁动）；分开坐：基价×2", "Two Exes side by side fight (+1 agitation each); apart: fare ×2"],
  ["暗黑版恋人。两位怨偶相邻会吵架，各 +1 躁动/层（虽然符号相同）。另一位怨偶也在车上但不相邻时，到站基价 ×2。单独一人时会把前任叫来。和普通恋人的符号相反，挨着是红线。", "The Lover’s dark version. Two Exes side by side fight: +1 agitation each a floor (even though their symbols match). With the other Ex aboard but not beside him, his base fare is doubled on arrival. Alone, he calls the other one in. His symbols oppose an ordinary Lover’s, so sitting beside one makes red links."],
  ["暗黑版警察。身边的小偷、劫匪、醉汉、狂徒都被管住，炸弹客和疯炸客的倒计时也被锁住；在车上时全车每层 −1 躁动。代价是每层从你钱包收 3 金币保护费。", "The dark Officer. Holds adjacent Thieves, Robbers, Drifters and Brawlers, and locks the timers of Bomb Carriers and Mad Bombers; while aboard the whole cabin gets −1 agitation per floor. The price: 3 coins of protection money from your wallet each floor."],
  ["第1层上车、第10层下车，不耗电、不付车费。在车时恋人呼唤概率升至50%，她的每位邻座到站额外+3金币；车内每有一条红线，每层额外+1躁动。信物「红绳」：热闹和江湖每级绿线每层 +2 金币，此后恋人呼唤概率35%。", "Boards on floor 1 and leaves on floor 10; uses no power and pays no fare. While aboard, the Lover call chance rises to 50% and each of her neighbors earns 3 extra coins on arrival; each red link in the cabin adds 1 agitation per floor. Keepsake “Red String”: Lively and Street pay 2 more coins per green-link level per floor, and the Lover call chance stays at 35%."],
  ['空着的座位也在耗运转电：多带几位，让相同符号的人挨着坐，常常能赚回来。', 'Empty seats still cost motor power: take a few more riders and seat those who share a symbol together; it often pays back.'],
  ['新手示例 · 让两位恋人成为邻座：两人都有人间和安静，会连出绿线', 'Tutorial · seat the two Lovers side by side: both carry Hearth and Quiet, so a green line appears'],
  ['绿线：相同符号 · 红线：相反符号 · 紫箭头复制', 'Green: shared symbol · Red: opposite symbols · Purple arrow: copy'],
  ['卡面基价 + 每位邻座2金币；中躁动再加3金币。', 'Card base fare + 2 coins per neighbour; +3 more at medium agitation.'],
  ['邻座奖励和中躁动奖励直接相加，不参与基价倍率。', 'Neighbour and medium-agitation coins are added straight on and are not multiplied with the base fare.'],
  ['每条红线每层付 1 金币“冲突小费”（每层最多 3）；红线躁动仍然生效。', 'Each red link pays a 1-coin “conflict tip” per floor (at most 3); red-link agitation still applies.'],
];
/** “符号：热闹 · 人间” → “Symbols: Lively · Hearth”. */
export const symbolHeadingEn = (text: string) => text.replace(/^符号：/u, 'Symbols: ').replace(new RegExp(SYMBOL_KEYS.map(k => SYMBOLS[k].zh).join('|'), 'gu'), m => SYMBOLS[SYMBOL_KEYS.find(x => SYMBOLS[x].zh === m)!].en);
