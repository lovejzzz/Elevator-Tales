import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import {V831_PAIRS} from './i18n-v831';
import {V832_PAIRS} from './i18n-v832';
import {V835_PAIRS} from './i18n-v835';

export type GameLocale = 'en' | 'zh';

const exactPairs: Array<[string, string]> = [
  ...V831_PAIRS,
  ['每条实际默契的本人到站奖励额外 +2 金币，多位默契对象分别叠加。本局限装一次。', 'Each actual bond partner adds 2 coins to the rider’s arrival reward. Multiple partners stack. One installation per run.'],
  ['躁动上限 +1，并立即降低 2 躁动。本局限装一次；商店按点舒缓服务始终可用。', 'Agitation cap +1 and immediately reduce agitation by 2. One installation per run; pay-per-point soothing is always available at shops.'],
  ['此后新出现的乘客到站小费 +3，不参与车费倍率。本局限装一次。', 'Riders appearing after installation bring a 3-coin arrival tip, excluded from fare multipliers. One installation per run.'],
  ['小费盒', 'Tip Jar'], ['并联回充', 'Arrival Relay'], ['共乘票', 'Shared Ticket'], ['长途计价器', 'Long-Ride Meter'],
  ['到站机会', 'Arrival chances'], ['同时送达', 'Shared arrivals'], ['载客收入', 'Passenger income'], ['乘坐时长', 'Ride duration'],
  ['每位正常到站且有至少2位邻座的乘客，独立有50%概率额外支付4金币。同层下车者仍互算邻座；额外金币不参与倍率。本局限装一次。', 'Each normal arrival with at least 2 neighbors independently has a 50% chance to pay 4 extra coins. Simultaneous arrivals still count as neighbors. Extra coins are not multiplied. One installation per run.'],
  ['同层至少2位乘客正常到站，50%概率回充4电；每层只抽一次，不超过容量。请离不触发。本局限装一次。', 'When at least 2 riders arrive normally on the same floor, a 50% chance restores 4 power. One roll per floor, within capacity. Dismissals do not trigger it. One installation per run.'],
  ['关门时至少4位乘客，每次上行整车额外赚3金币；同层到站也算。不改变耗电或躁动。本局限装一次。', 'Depart with at least 4 riders to earn 3 extra coins per ascent for the whole cabin. Riders arriving that floor count. Power and agitation are unchanged. One installation per run.'],
  ['从每位乘客实际乘坐的第5次上行起，每次额外赚1金币，包括到站那次。幽灵造成的额外行程也算。本局限装一次。', 'From each rider’s fifth actual ascent, earn 1 extra coin per ascent, including arrival. Extra travel caused by Ghosts counts. One installation per run.'],
  ['每间店最多安装一项永久能力，已安装的本局不再出现。充电与舒缓服务可重复使用。', 'Install at most one permanent ability per shop. Installed abilities never reappear this run. Charging and soothing services remain repeatable.'],
  ['电量与躁动同时失控：使用充电与按点舒缓服务，两项都修复才能继续。', 'Power and agitation both need repair. Use charging and pay-per-point soothing; fix both to continue.'],
  ['躁动已达到或超过上限：使用按点舒缓服务，降到上限以下才能继续。', 'Agitation has reached or exceeded the cap. Use pay-per-point soothing to bring it below the cap before continuing.'],
  ['按点舒缓', 'Pay-per-point soothing'], ['商店舒缓', 'Shop soothing'],
  ['每点8金币 · 只降低已有躁动，不提升上限、不回充电量', '8 coins per point · lowers existing agitation only; no cap increase or power recovery'],
  ['可以保留已有躁动；不必清零。', 'You may keep some agitation; clearing it is optional.'],
  ['本店能力已选购，下次商店再选。维修服务仍然可用。', 'Ability chosen for this shop. Choose again at the next shop. Repair services remain available.'],
  ['本局所有永久能力均已安装。维修服务仍然可用。', 'All permanent abilities are installed this run. Repair services remain available.'],
  ['本店没有未安装的能力可选。维修服务仍然可用。', 'No uninstalled abilities are available in this shop. Repair services remain available.'],
  ['购买后不足以预留充电与必要舒缓费', 'This purchase leaves too little for charging and required soothing'],
  ['本局唯一 · 概率只在实际结算时抽取', 'One per run · chance rolls only at actual resolution'],
  ['本局唯一 · 只在实际上行时结算', 'One per run · resolves only on an actual ascent'],
  ['小费盒另算：到站时有至少2位邻座，50%概率再得4金币。上方车费不含这项概率奖励。', 'Tip Jar is separate: arrive with at least 2 neighbors for a 50% chance of 4 extra coins. The fare above excludes this chance reward.'],
  ['按当前站位计算，不含概率奖励；未来站位与属性变化会改变收益', 'At current seating, excluding chance rewards; future positions and traits alter the payout'],
  ['小费盒额外小费', 'Tip Jar bonus'],
  ['并联回充50%，不保证续航', 'Arrival Relay has a 50% chance; do not rely on it for power'],
  ['可能补电', 'possible recharge'], ['补电', 'recharge'],
  ['每点8金币，按需降低已有躁动。充电和舒缓不占本店能力名额。', 'Reduce existing agitation as needed for 8 coins per point. Charging and soothing do not use the shop’s ability choice.'],
  ['修复至上限以下 · ', 'Repair below the cap · '],
  ['安装时立即舒缓2点，本局唯一', 'Immediately relieved 2 agitation on installation; one per run'],
  ['商店舒缓 −2 躁动，支付 16 金币。', 'Shop soothing: −2 agitation for 16 coins.'],
  ['基价', 'Base fare'],
  ['只有列出的默契对象给到站奖励；人物能力产生的绿线另算。', 'Only the listed bond partners grant arrival bonuses; ability links are separate.'],
  ['喜欢热闹：躁动≥3且2+邻座，到站基价+100%', 'Likes a crowd: agitation ≥3 and 2+ neighbors give +100% base arrival fare'],
  ['未安抚时每层躁动+1；护士或音乐家安抚后，免除这项躁动并每层赚1金币。到站前关门时，若躁动至少3且有至少2位邻座，基价额外+100%；与教练等倍率相加，小费和默契奖励不翻倍。', 'Uncalmed: +1 agitation/floor. A Nurse or Musician prevents that agitation and grants 1 coin/floor. At departure before arrival, agitation of at least 3 and at least 2 neighbors add 100% base fare. Additive with Coach multipliers; tips and bond bonuses are not multiplied.'],
  ['到站前关门时：躁动至少3且有至少2位邻座，基价额外 +100%；与教练等倍率相加，小费和默契奖励不翻倍。', 'At departure before arrival: agitation ≥3 and at least 2 neighbors add 100% base fare. Additive with Coach multipliers; tips and bond bonuses are not multiplied.'],
  ['关门躁动≥3且2+邻座：基价 +100%', 'Departing at agitation ≥3 with 2+ neighbors: base fare +100%'],
  ['醉汉躁动加价', 'Drunk agitation premium'],
  ['躁动达标 · 基价+100%', 'Agitation met · base fare +100%'],
  ['压力回收', 'Pressure Reclaimer'], ['风险转续航', 'Risk into range'],
  ['乘客到站实际消除1躁动，回充1电；每层最多2电，不超过电量上限。零躁动、安抚、请离和商店维修不产电。', 'Each agitation point actually removed by arrivals restores 1 energy; up to 2 per floor, within capacity. Zero agitation, calming, dismissal and shop repairs generate no energy.'],
  ['到站实际消除1躁动 → 回充1电 · 每层最多2电 · 本局唯一', 'Actual arrival relief: 1 agitation → 1 energy · up to 2/floor · one per run'],
  ['维修工和受控幽灵的节能逐项相加，最多抵完人物耗电；运转仍耗1电。压力回收在到站舒缓后另算。', 'Mechanics and controlled ghosts stack savings up to passenger power cost. The motor still costs 1. Pressure Reclaimer recovery is separate, after arrival relief.'],
  ['只有列出的对象有这项到站奖励；能力绿线不一定有奖励。到站那一刻仍相邻才算。', 'Only the listed partners grant this arrival bonus. Ability links do not necessarily pay it. Partners must still be adjacent at arrival.'],
  ['恋人已配对：每条恋人连接每层 +2 金币，双方到站基价各 +100%。', 'Lovers linked: each Lover connection earns 2 coins per floor and adds 100% to each partner’s base arrival fare.'],
  ['基价；高危加价参与倍率，小费不参与', 'Base fare; high-risk premium is multiplied, tips are not'],
  ['按当前站位计算；未来站位与属性变化会改变收益', 'At current seating; future position and trait changes alter the payout'],
  ['按当前站位到站：', 'Arrival at current seating: '],
  ['。包括倍率、联动和小费，不包括途中收入；未来站位与属性变化会改变收益。', '. Includes multipliers, bonds and tips, not flow income. Future position and trait changes alter the payout.'],
  ['每次开门，都是新机会', 'Every door, a new possibility'], ['快速开门：开', 'Quick reveal: on'], ['快速开门：关', 'Quick reveal: off'],
  ['初次见面', 'FIRST ENCOUNTER'],
  ['绿线表示能力或默契，红线表示额外交易，不一定只有损失。只有卡片列出的默契对象，才给本人到站 +', 'Green links indicate abilities or bonds; red links add a trade-off, not necessarily just a loss. Only the bond partners listed on the card grant an own-arrival bonus of +'],
  [' 金币；双方分别判断。', ' coins; each rider is evaluated separately.'],
  ['高危乘客基价 +', 'High-risk base fare +'], ['，参与倍率，但每层多 +1 躁动。', ', affected by multipliers, but adds 1 agitation each floor.'],
  ['小偷每层改赚 +1', 'Thief now earns +1/floor'], ['小偷不加躁动', 'Thief adds no agitation'],
  // Passenger names.
  ['通勤者', 'Commuter'], ['游客', 'Tourist'], ['快递员', 'Courier'], ['维修工', 'Mechanic'],
  ['恋人', 'Lover'], ['音乐家', 'Musician'], ['小偷', 'Thief'], ['警察', 'Officer'],
  ['律师', 'Lawyer'], ['醉汉', 'Drunk'], ['护士', 'Nurse'], ['儿童', 'Child'],
  ['幽灵', 'Ghost'], ['驱魔师', 'Exorcist'], ['教练', 'Coach'], ['名人', 'Celebrity'],
  ['检查员', 'Inspector'], ['炸弹客', 'Bomb Carrier'], ['神秘人', 'Mystery'], ['百变人', 'Shifter'], ['复制人', 'Mimic'],

  // Compact candidate-card grammar.
  ['绿色邻座', 'GREEN NEIGHBORS'], ['红色邻座', 'RED NEIGHBORS'],
  ['任何邻座', 'Any neighbor'], ['任意人物', 'Any rider'], ['任意非教练', 'Any non-Coach'],
  ['到站 +2', 'Arrival +2'], ['节能 2/层', 'Save 2/floor'],
  ['单独时：25% 呼唤恋人', 'Alone: 25% chance to call a Lover'],
  ['每人 +1/层 · 基础车费 +100%', 'Each +1/floor · base fare +100%'],
  ['每人 +1/层', 'Each +1/floor'], ['每人 −2/层', 'Each −2/floor'], ['每人 −1/层', 'Each −1/floor'],
  ['未受控 +4/层', 'Uncontrolled +4/floor'], ['未受控 +1/层', 'Uncontrolled +1/floor'],
  ['途中 +1/层 · 到站 +5', 'Ride +1/floor · arrival +5'], ['收益 +1/层', 'Income +1/floor'],
  ['倒计时锁定', 'Timer locked'], ['不加躁动', 'No agitation'], ['未安抚 +1/层', 'Uncalmed +1/floor'], ['途中 +1/层', 'Ride +1/floor'],
  ['无人照顾 +1/层', 'Unattended +1/floor'], ['3的倍数层：随机邻座 +1站', 'Floors 3, 6, 9…: random neighbor +1 floor'],
  ['不再延误', 'No delay'], ['到站 +6', 'Arrival +6'], ['幽灵到站 +6', 'Ghost arrival +6'],
  ['基础车费 +50%/教练', 'Base fare +50%/Coach'], ['教练到站 +3/人', 'Coach arrival +3/person'],
  ['1位邻座 +3/层', '1 neighbor +3/floor'], ['2+邻座 +1/层', '2+ neighbors +1/floor'],
  ['总耗电≤4：+1/层', 'Total power ≤4: +1/floor'], ['总耗电>4：+1/层', 'Total power >4: +1/floor'],
  ['参数与邻座关系随机 · 车费到站揭晓', 'Random values and neighbors · fare revealed on arrival'],
  ['每层重抽三值与邻座关系', 'Reroll three values and neighbors each floor'],
  ['每位邻座复制1项 · 最多3项', 'Copy 1 field per neighbor · max 3'],
  ['/层', '/floor'], ['+1/层', '+1/floor'], ['额外 +1/层', 'Extra +1/floor'], ['−2/层', '−2/floor'],
  ['两人耗电 ×2', 'Both use ×2 power'], ['两人到站车费 ×2', 'Both arrival fares ×2'],
  ['每位邻座 −2躁动/层', 'Each neighbor −2 agitation/floor'], ['每位邻座 −1躁动/层', 'Each neighbor −1 agitation/floor'],
  ['可连绿线 · ', 'Green link · '],
  ['绿色有收益 · 红色有损失 · 每位邻座分别叠加', 'Green rewards · red costs · each neighbor stacks'],
  ['下一层：商店', 'Next floor: Shop'], ['邻座与叠加', 'Neighbors and stacking'],
  ['绿色收益 · 红色损失', 'Green rewards · red costs'],
  ['每层耗电', 'Power per floor'], ['每层自身躁动', 'Personal agitation per floor'],
  ['🔥 红线', '🔥 Red links'], ['红线', 'Red links'],
  ['只有标有 🔥 的红线增加躁动；⚡ 和 🪙 分别影响电量与金币。绿色协作不会消除红线。', 'Only red links marked 🔥 add agitation. ⚡ and 🪙 affect power and coins. Green cooperation does not remove red links.'],
  ['人物能力', 'Rider ability'],
  ['每条绿色连接逐条叠加，到站那一刻仍相邻才算。', 'Every green link stacks; only links still adjacent at the moment of arrival count.'],
  ['红线每层生效；多条逐条相加。同类倍率按基础值线性叠加。', 'Red links resolve every floor and stack individually. Multipliers of the same type add linearly from the base value.'],
  ['多条绿色连接逐条叠加；恋人、教练、途中收入等人物技能另外计算。', 'Green links stack individually; rider abilities such as Lover, Coach, and ride income resolve separately.'],
  ['绿色协作和红色冲突分别结算，互不抵消。', 'Green cooperation and red conflicts resolve separately; neither cancels the other.'],
  ['初始50电、容量60。抵达商店先补 5 电，再用金币充电或买升级。高危乘客多赚 8 金币，但每层多 +1 躁动。', 'Start with 50 power and a capacity of 60. Entering the Shop restores 5 power; then spend coins on charging or upgrades. High Risk riders earn 8 extra coins but add +1 agitation per floor.'],
  ['到站时仍相邻才生效；同层送达多位协作乘客，可分别舒缓。', 'Only riders still adjacent on arrival count. Multiple cooperative arrivals on the same floor each provide relief.'],
  ['没人看管：旁边没有警察或律师', 'Unwatched: no adjacent Officer or Lawyer'],
  ['每上 1 层，赚 4 金币。', 'Each ascent earns 4 coins.'], ['每上 1 层，躁动 +1。', 'Each ascent adds 1 agitation.'],
  ['途中：每层赚 1 金币，不再产生偷窃躁动。', 'During the ride: earn 1 coin per floor with no theft agitation.'],
  ['到站：受控奖励 +5 金币，协作奖励再 +3 金币。', 'On arrival: +5 controlled bonus and +3 cooperation bonus.'],
  ['警察能帮谁？', 'Who can the Officer help?'], ['律师能帮谁？', 'Who can the Lawyer help?'],
  ['旁边的小偷：每层收益从 4 降为 1 金币，不再产生偷窃躁动。', 'Adjacent Thief: income falls from 4 to 1 coin per floor, with no theft agitation.'],
  ['律师不能暂停炸弹倒计时。', 'A Lawyer cannot lock a Bomb timer.'],
  ['每层＝上行后立即结算 · 到站＝下车时结算 · 邻座逐人叠加', 'Per floor = paid after each ascent · Arrival = paid on exit · neighbors stack'],
  ['每上1层 +1躁动', 'Each ascent +1 agitation'], ['每上1层额外耗1电', 'Each ascent costs 1 extra power'],
  ['每上1层立即 −2', 'Each ascent immediately −2'], ['两人每层耗电 ×2', 'Both use ×2 power per floor'],
  ['每上1层立即 +1/人', 'Each ascent immediately +1/person'], ['到站基价 +100%/人', 'Arrival base fare +100%/person'],
  ['未受控：每上1层立即 +4', 'Uncontrolled: each ascent immediately +4'],
  ['未受控：每上1层 +1躁动', 'Uncontrolled: each ascent +1 agitation'],
  ['每上1层立即 +1', 'Each ascent immediately +1'], ['到站 +5', 'Arrival +5'],
  ['1位邻座：每上1层立即 +3', '1 neighbor: each ascent immediately +3'],
  ['2+邻座：每上1层 +1躁动', '2+ neighbors: each ascent +1 agitation'],
  ['总耗电≤4：每上1层立即 +1', 'Total power ≤4: each ascent immediately +1'],
  ['总耗电>4：每上1层 +1躁动', 'Total power >4: each ascent +1 agitation'],
  ['安排六个站位，连接绿色邻座，避开红色邻座。没有终点，越往上越难。送客赚取金币，每十层购买升级，挑战自己的最高楼层。', 'Arrange six positions, connect green neighbors, and avoid red neighbors. There is no final floor; the challenge keeps rising. Deliver riders for coins, buy upgrades every ten floors, and chase your highest floor.'],
  ['绿色邻座给收益，红色邻座给损失。每位邻座分别结算；本人到站时，每条仍连接的绿线额外 +', 'Green neighbors give rewards; red neighbors impose costs. Each neighbor resolves separately. On arrival, every green link still connected adds +'],

  // Passenger summaries and rules.
  ['所有相邻乘客：每层各抵消2躁动', 'All adjacent riders: each cancels 2 agitation per floor'],
  ['所有相邻乘客：每层各抵消1躁动', 'All adjacent riders: each cancels 1 agitation per floor'],
  ['每层耗2电；安抚相邻醉汉、儿童', 'Costs 2 power/floor; calms adjacent Drunks and Children'],
  ['每层耗1电；安抚相邻醉汉、儿童', 'Costs 1 power/floor; calms adjacent Drunks and Children'],
  ['稀有的短期控场核心：音乐向四周扩散，所有相邻乘客每层各抵消2点躁动，但自身每层耗2电。也能阻止相邻醉汉与儿童的负面效果；多位音乐家可逐人叠加。', 'A rare short-term control centerpiece. Music reaches every adjacent rider, canceling 2 agitation from each per floor, but the Musician costs 2 power per floor. It also prevents adjacent Drunk and Child penalties; multiple Musicians stack per rider.'],
  ['稳定的轻量照护：所有相邻乘客每层各抵消1点躁动，且自身每层只耗1电。也能阻止相邻醉汉与儿童的负面效果；多位护士可逐人叠加。', 'Steady lightweight care. Every adjacent rider cancels 1 agitation per floor, while the Nurse costs only 1 power. It also prevents adjacent Drunk and Child penalties; multiple Nurses stack per rider.'],
  ['短期高风险收益：未受控制时每层赚4金币并增加1躁动。相邻警察或律师后每层赚1金币且不再制造躁动，抵达再奖励5金币。', 'A short high-risk payoff. Uncontrolled, the Thief earns 4 coins and adds 1 agitation per floor. Next to an Officer or Lawyer, it earns 1 coin per floor, adds no agitation, and gains 5 coins on arrival.'],
  ['控制小偷，锁住炸弹倒计时', 'Controls Thieves and locks Bomb timers'],
  ['同时控制所有相邻小偷。与任意数量的炸弹客相邻期间，分别锁住他们的倒计时。', 'Controls every adjacent Thief at once. While adjacent to any number of Bomb Carriers, locks each of their timers.'],
  ['长线收益核心。非教练乘客抵达时，每位相邻教练都让其基础车费提高50%，线性叠加，小费不参与倍率；教练自己抵达时，每名仍在身旁的邻座额外支付3金币。', 'A long-term income centerpiece. When a non-Coach rider arrives, each adjacent Coach adds 50% to base fare; bonuses stack linearly and do not multiply tips. When the Coach arrives, each remaining neighbor adds 3 coins.'],
  ['所有相邻乘客：每人每层各抵消 2 点躁动；多人可叠加，不会降成负数。', 'All adjacent riders cancel 2 agitation each per floor. Multiple Musicians stack without reducing agitation below zero.'],
  ['自身每层耗2电；同时安抚相邻的醉汉和儿童，阻止其人物躁动。', 'Costs 2 power per floor. Also calms adjacent Drunks and Children, preventing their rider agitation.'],
  ['所有相邻乘客：每人每层各抵消 1 点躁动；多人可叠加，不会降成负数。', 'All adjacent riders cancel 1 agitation each per floor. Multiple Nurses stack without reducing agitation below zero.'],
  ['自身每层耗1电；同时安抚相邻的醉汉和儿童，阻止其人物躁动。', 'Costs 1 power per floor. Also calms adjacent Drunks and Children, preventing their rider agitation.'],
  ['任何相邻乘客：每站+1币，逐人叠加', 'Any adjacent rider: +1 coin/floor, stacking per rider'],
  ['基础车费18。任何相邻乘客都让游客每层多赚1金币，包括其他游客；不设人数上限，由站位决定最大3位。邻座变化时立即重新计算。', 'Base fare: 18. Any adjacent rider earns the Tourist +1 coin per floor, including other Tourists. There is no rules cap; cabin positions naturally allow up to three companions. The bonus updates immediately when neighbors change.'],
  ['任何相邻乘客：每层 +1 金币，逐人叠加。', 'Any adjacent rider: +1 coin per floor, stacking per rider.'],
  ['包括其他游客；不设人数上限，由站位决定最大旅伴数。邻座变化时立即重新计算。', 'Includes other Tourists. There is no rules cap; cabin positions determine the maximum companion count. The bonus updates immediately when neighbors change.'],
  ['包括其他游客；邻座变化即重算', 'Includes other Tourists; updates when neighbors change'],
  ['到站补充2电 · 短途周转', 'Recharge 2 power on arrival · quick turnover'],
  ['目的地很近；到站时为电梯补充2电（不超过电量上限），适合用短途周转换取续航。', 'A nearby destination. On arrival, recharge 2 power up to the cap, turning quick turnover into extra range.'],
  ['到站时补充2电，不超过电量上限。', 'Recharge 2 power on arrival, up to the power cap.'],
  ['到站补充2电（不超过上限）', 'Recharge 2 power on arrival (up to cap)'],
  ['到站补充2电', 'Recharge 2 power on arrival'],
  ['到站补充1电 · 短途周转', 'Recharge 1 power on arrival · quick turnover'],
  ['目的地很近；到站时为电梯补充1电（不超过电量上限），适合用短途周转换取续航。', 'A nearby destination. On arrival, recharge 1 power up to the cap, turning quick turnover into extra range.'],
  ['到站时补充1电，不超过电量上限。', 'Recharge 1 power on arrival, up to the power cap.'],
  ['短途周转，快速送达赚取金币并换取续航。', 'A short trip that pays quickly, frees a position, and extends the run.'],
  ['到站补充1电（不超过上限）', 'Recharge 1 power on arrival (up to cap)'],
  ['到站补充1电', 'Recharge 1 power on arrival'],
  ['每层抵消1名相邻乘客的1躁动', 'Cancels 1 agitation from one adjacent rider each floor'],
  ['可堆叠；安抚相邻醉汉、儿童', 'Stacks; also calms adjacent Drunks and Children'],
  ['每层 +1', '+1 each floor'],
  ['2+邻座：每层 +1', '2+ neighbors: +1 each floor'],
  ['总耗电≤4：每层+1币', 'Total power ≤4: +1 coin each floor'],
  ['总耗电>4：每层 +1', 'Total power >4: +1 agitation each floor'],
  ['抵消一名相邻乘客的1躁动', 'Cancels 1 agitation from one adjacent rider'],
  ['每层抵消一名相邻乘客的1点躁动；多位音乐家可逐个叠加，但不会把躁动降成负数。也能阻止相邻醉汉与儿童的负面效果。', 'Each floor, cancels 1 agitation from one adjacent rider. Multiple Musicians stack but never reduce agitation below zero. Also prevents adjacent Drunk and Child penalties.'],
  ['未控制 +3 金币/层 · 每层 +1 躁动', 'Uncontrolled: +3 coins/floor · +1 agitation/floor'],
  ['未受控制时每层赚3金币并增加1躁动。相邻警察或律师后每层赚1金币且不再制造躁动，抵达再奖励5金币。', 'Uncontrolled: earns 3 coins and adds 1 agitation each floor. Next to an Officer or Lawyer: earns 1 coin per floor, adds no agitation, and gains 5 coins on arrival.'],
  ['未安抚：每层躁动 +1', 'Uncalmed: +1 agitation each floor'],
  ['高额底价补偿风险。被音乐家或护士安抚时不再制造躁动，并且每层再赚1金币；否则每层增加1躁动。', 'A high base fare offsets the risk. Next to a Musician or Nurse, adds no agitation and earns 1 coin each floor; otherwise adds 1 agitation each floor.'],
  ['每层抵消一名相邻乘客的1点躁动；多位护士可逐个叠加，但不会把躁动降成负数。也能阻止相邻醉汉与儿童的负面效果。', 'Each floor, cancels 1 agitation from one adjacent rider. Multiple Nurses stack but never reduce agitation below zero. Also prevents adjacent Drunk and Child penalties.'],
  ['无照顾者：每层躁动 +1', 'Unattended: +1 agitation each floor'],
  ['没有恋人、音乐家或护士相邻时，每层躁动+1；有任意照顾者相邻时免除。', 'Without an adjacent Lover, Musician, or Nurse: +1 agitation each floor. Any adjacent caregiver prevents it.'],
  ['恰好 1 邻座 +3 金币/层 · 2+ 邻座每层+1躁动', 'Exactly 1 neighbor: +3 coins/floor · 2+ neighbors: +1 agitation/floor'],
  ['恰好一名邻座时每层赚3金币；两名以上邻座时每层增加1躁动。', 'With exactly one neighbor, earns 3 coins each floor. With two or more, adds 1 agitation each floor.'],
  ['总耗电≤4则+1币；超过则每层+1躁动', 'Total power ≤4: +1 coin; above 4: +1 agitation each floor'],
  ['每层检查整趟耗电：运转＋所有人物耗电−节能，总计不超过4电时奖励1金币，否则躁动+1。检查员本人也耗1电；稳压和节能能帮助通过检查。', 'Each floor, checks total power: motor + all riders − savings. At 4 or less, earn 1 coin; above 4, add 1 agitation. The Inspector also uses 1 power; Stabilizer and savings can help.'],
  ['总耗电尽量不超过4', 'Keep total power at 4 or less'],
  ['每级使每条协作连接的到站奖励再 +2 金币。多条连接与多级升级都逐项叠加。', 'Each level adds +2 coins to every cooperation-link arrival reward. Multiple links and levels stack.'],
  ['协作收益', 'Cooperation income'],
  ['躁动上限 +1，并立即降低 2 躁动。', 'Agitation cap +1 and immediately reduce agitation by 2.'],
  ['每层抵消一名相邻乘客的 1 点躁动；多人可叠加，不会降成负数。', 'Each floor, cancels 1 agitation from one adjacent rider. Multiple calmers stack but never reduce agitation below zero.'],
  ['同时安抚相邻的醉汉和儿童，阻止其人物躁动。', 'Also calms adjacent Drunks and Children, preventing their rider agitation.'],
  ['没有警察或律师邻座：每层 +3 金币、躁动 +1。', 'Without an adjacent Officer or Lawyer: +3 coins and +1 agitation each floor.'],
  ['没有音乐家或护士邻座：每层躁动 +1。', 'Without an adjacent Musician or Nurse: +1 agitation each floor.'],
  ['有音乐家或护士邻座：不再加压，每层 +1 金币。', 'With an adjacent Musician or Nurse: no agitation and +1 coin each floor.'],
  ['没有恋人、音乐家或护士邻座：每层躁动 +1。', 'Without an adjacent Lover, Musician, or Nurse: +1 agitation each floor.'],
  ['至少 2 位邻座：每层躁动 +1。没有邻座则无额外效果。', 'With at least 2 neighbors: +1 agitation each floor. No neighbors has no extra effect.'],
  ['每层：本次总耗电不超过4，金币 +1；超过则躁动 +1。', 'Each floor: total power at 4 or less grants +1 coin; above 4 adds +1 agitation.'],
  ['安静、可靠、准时付费', 'Quiet, reliable, and pays on time'],
  ['没有特殊能力。平稳而可靠，是填补空位的可靠选择。', 'No special ability. A dependable passenger for filling an open position.'],
  ['长途，但报酬丰厚', 'Long ride, high fare'],
  ['每站耗2电，抵达后提供较高车费。', 'Consumes 2 power per floor and pays a high fare on arrival.'],
  ['短途快速周转', 'Quick short-haul turnover'],
  ['目的地很近，适合迅速赚取车费并腾出座位。', 'A nearby destination makes this passenger good for quick cash and fast turnover.'],
  ['短途稳定，送达领取车费。', 'A stable short trip. Deliver to collect the fare.'],
  ['旅途较长，送达车费较高。', 'A longer trip with a higher arrival fare.'],
  ['短途周转，快速送达赚取金币。', 'A short trip that pays quickly and frees a position.'],
  ['每位每层节能2电 · 可叠加', 'Each saves 2 power/floor · stacks'],
  ['每位每层：节能2 · 可叠加', 'Each saves 2 power/floor · stacks'],
  ['每层节能2电 · 可堆叠', 'Saves 2 power/floor · stacks'],
  ['每层节能2 · 可堆叠', 'Saves 2 power/floor · stacks'],
  ['每位维修工每层抵消2点人物耗电，多位逐个叠加。维修工本人耗2电；节能最多抵完人物耗电，不能抵消电梯运转的1电，也不会倒充电。', 'Each Mechanic cancels 2 rider power per floor, stacking per Mechanic. A Mechanic costs 2 power. Savings can cancel rider power only, never the 1-power motor, and cannot generate power.'],
  ['每层节能2电，多位维修工逐个叠加。', 'Saves 2 power per floor; multiple Mechanics stack.'],
  ['本人耗2电；节能不能抵消电梯运转，也不会倒充电。', 'Costs 2 power. Savings cannot cancel the motor or generate power.'],
  ['维修工、受控幽灵和节能线路逐项相加；节能最多抵完人物耗电，不能抵运转1电。', 'Mechanics, controlled Ghosts, and Eco Circuit stack. Savings can cancel rider power only, never the 1-power motor.'],
  ['每位维修工每层抵消2点人物耗电，多位逐个叠加。维修工本人耗1电；节能总量最多抵完本层人物耗电，不能抵消电梯运转的1电，也不会倒充电。', 'Each Mechanic cancels 2 passenger power per floor, and multiple Mechanics stack. A Mechanic consumes 1 power. Savings can cancel passenger use only, never the elevator’s 1-power motor cost, and cannot generate power.'],
  ['每位维修工每层节能2电，多位逐个叠加。', 'Each Mechanic saves 2 passenger power per floor. Multiple Mechanics stack.'],
  ['维修工、受控幽灵和节能线路逐项相加；总节能最多抵完人物耗电，不能抵运转1电。', 'Mechanics, controlled Ghosts, and Eco Circuit stack. Savings can cancel passenger use, but never the 1-power motor cost.'],
  ['每位邻座恋人：每站+1币，到站基价+100%', 'Each adjacent Lover: +1 coin/floor, +100% base fare'],
  ['无恋人邻座：每站25%呼唤恋人', 'No adjacent Lover: 25% chance per floor to call another Lover'],
  ['每位恋人邻座：本人每层 +1 金币，到站基础车费 +100%；多位逐个叠加。', 'Each adjacent Lover grants this rider +1 coin per floor and +100% base arrival fare. Multiple Lovers stack.'],
  ['每位邻座恋人：每站+1币，到站基价+100%；多位逐个叠加。', 'Each adjacent Lover grants +1 coin per floor and +100% base fare. Multiple Lovers stack.'],
  ['没有恋人邻座：每层有 25% 概率呼唤另一位恋人候客。', 'With no adjacent Lover: 25% chance each floor to call another Lover into the next queue.'],
  ['车内 ≥4人：每层躁动 −1', '4+ riders: −1 agitation/floor'],
  ['车内≥4人：每站 −1', '4+ riders: −1 agitation/floor'],
  ['车内至少 4 人：每层躁动 −1。', 'With at least 4 riders: −1 agitation each floor.'],
  ['安抚相邻的醉汉和儿童，阻止其负面效果。', 'Calms adjacent Drunks and Children, preventing their negative effects.'],
  ['未控制 +3 金币/层 · 偶数层 +1 躁动', 'Uncontrolled: +3 coins/floor · +1 agitation on even floors'],
  ['无警察/律师：每站+3；有则+1，到站再+5', 'No Officer/Lawyer: +3 coins/floor; with one: +1 and +5 on arrival'],
  ['未控制 +4 金币/层 · 每层 +1 躁动', 'Uncontrolled: +4 coins/floor · +1 agitation/floor'],
  ['未受控制时每层赚4金币并增加1躁动。相邻警察或律师后每层赚1金币且不再制造躁动，抵达再奖励5金币。', 'Uncontrolled: earns 4 coins and adds 1 agitation each floor. Next to an Officer or Lawyer: earns 1 coin per floor, adds no agitation, and gains 5 coins on arrival.'],
  ['无警察/律师：每站+4；有则+1，到站再+5', 'No Officer/Lawyer: +4 coins/floor; with one: +1 and +5 on arrival'],
  ['没有警察或律师邻座：每层 +4 金币、躁动 +1。', 'Without an adjacent Officer or Lawyer: +4 coins and +1 agitation each floor.'],
  ['挨警察或律师免除', 'Prevented by an adjacent Officer or Lawyer'],
  ['没有警察或律师邻座：每层 +3 金币，偶数层躁动 +1。', 'Without an adjacent Officer or Lawyer: +3 coins per floor and +1 agitation on even floors.'],
  ['有警察或律师邻座：改为每层 +1 金币，不再加压，到站车费 +5。', 'With an adjacent Officer or Lawyer: +1 coin per floor, no theft agitation, and +5 arrival fare.'],
  ['控制小偷，延缓炸弹', 'Controls Thieves and slows bombs'],
  ['邻小偷：小偷每站改赚1币', 'Adjacent Thief: earns 1 coin/floor'],
  ['邻小偷：免偷窃躁动；邻炸弹：偶数层倒计时不减', 'Adjacent Thief: prevents theft agitation; adjacent Bomb Carrier: timer does not drop on even floors'],
  ['邻小偷：免偷窃躁动；邻炸弹：锁住倒计时', 'Adjacent Thief: prevents theft agitation; adjacent Bomb Carrier: locks its timer'],
  ['邻小偷：免偷窃躁动；不能暂停炸弹倒计时', 'Adjacent Thief: prevents theft agitation; cannot pause a Bomb Carrier timer'],
  ['控制相邻的小偷，消除其加压效果。', 'Controls adjacent Thieves and removes their agitation effect.'],
  ['与炸弹客相邻：到达偶数层时，炸弹倒计时不减少。', 'Adjacent Bomb Carrier: its timer does not drop on even floors.'],
  ['与炸弹客相邻期间：锁住炸弹倒计时。', 'While adjacent to a Bomb Carrier: lock its timer.'],
  ['控制小偷，每站耗1电', 'Controls Thieves; consumes 1 power/floor'],
  ['控制相邻的小偷，消除其加压效果。不能暂停炸弹倒计时。', 'Controls adjacent Thieves and removes their agitation. Cannot pause a Bomb Carrier timer.'],
  ['未安抚每层 25% 闹事 · 躁动 +2', 'Uncalmed: 25% chance/floor to cause +2 agitation'],
  ['挨护士或音乐家：每站+1', 'Adjacent Nurse or Musician: +1 coin/floor'],
  ['挨护士或音乐家免除', 'Prevented by an adjacent Nurse or Musician'],
  ['闹事时随机换位', 'Swaps with a random neighbor during an incident'],
  ['没有音乐家或护士邻座：每层 25% 概率闹事，躁动 +2，并随机与邻座换位。', 'Without an adjacent Musician or Nurse: 25% chance each floor to cause +2 agitation and swap with a random neighbor.'],
  ['有音乐家或护士邻座：不再闹事，每层 +1 金币。', 'With an adjacent Musician or Nurse: no incidents and +1 coin per floor.'],
  ['每逢偶数层：躁动 −1', 'Even floors: −1 agitation'],
  ['偶数层 −1', 'Even floors: −1 agitation'],
  ['安抚相邻醉汉、儿童', 'Calms adjacent Drunks and Children'],
  ['每逢偶数层，躁动 −1。', 'On every even floor: −1 agitation.'],
  ['无照顾者：偶数层躁动 +1', 'Unattended: +1 agitation on even floors'],
  ['挨恋人/护士/音乐家免除', 'Prevented by an adjacent Lover, Nurse, or Musician'],
  ['没有恋人、音乐家或护士邻座：偶数层躁动 +1。', 'Without an adjacent Lover, Musician, or Nurse: +1 agitation on even floors.'],
  ['与其中任一角色相邻，即可阻止这项躁动。', 'Adjacency to any of those roles prevents this agitation.'],
  ['不耗电，但会延误邻座', 'Uses no power, but delays neighbors'],
  ['没有驱魔师邻座：抵达 3、6、9… 层时，随机让一名邻座的目的地延后 1 层。', 'Without an adjacent Exorcist: on floors 3, 6, 9… delay one random neighbor by 1 floor.'],
  ['有驱魔师邻座：不再延误邻座；每位受控幽灵每层节能1电，到站车费 +6。', 'With an adjacent Exorcist: no delays; each controlled Ghost saves 1 power per floor and gains +6 arrival fare.'],
  ['相邻驱魔师时，不再延误邻座，每位受控幽灵每层抵消2点人物耗电且到站多得6金币；否则到3的倍数层时随机延误一位邻座1站。所有节能逐项相加，但电梯运转仍至少耗1电。', 'Next to an Exorcist, stops delaying neighbors; each controlled Ghost saves 2 rider power per floor and gains 6 arrival coins. Otherwise, on floors divisible by 3, delays one random neighbor by 1 floor. Savings stack, but the motor still costs at least 1 power.'],
  ['有驱魔师邻座：不再延误邻座；每位受控幽灵每层节能2电，到站车费 +6。', 'With an adjacent Exorcist: no delays; each controlled Ghost saves 2 power per floor and gains +6 arrival fare.'],
  ['每位受控幽灵每站节能2电', 'Each controlled Ghost saves 2 power/floor'],
  ['无驱魔师：3的倍数层随机延误邻座1站；邻驱魔师：不延误且每站节能2', 'No Exorcist: every third floor delays a random neighbor by 1; adjacent Exorcist: no delay and saves 2 power/floor'],
  ['邻幽灵：阻止延误，每站节能2', 'Adjacent Ghost: prevents delays and saves 2 power/floor'],
  ['控制每位相邻幽灵，分别阻止延误并使其每层抵消2点人物耗电、到站多得6金币。多位幽灵的效果逐个叠加；电梯运转仍至少耗1电。', 'Controls each adjacent Ghost, preventing its delay, saving 2 rider power per floor, and adding 6 arrival coins. Multiple Ghosts stack; the motor still costs at least 1 power.'],
  ['每位相邻幽灵分别受控：阻止延误、每层节能2电，幽灵到站车费 +6。', 'Each adjacent Ghost is controlled: no delay, saves 2 power per floor, and gains +6 arrival fare.'],
  ['每位受控幽灵每站节能1电', 'Each controlled Ghost saves 1 power/floor'],
  ['邻驱魔师：到站再+6币', 'Adjacent Exorcist: +6 coins on arrival'],
  ['无驱魔师：3的倍数层随机延误邻座1站；邻驱魔师：不延误且每站节能1', 'No Exorcist: every third floor delays a random neighbor by 1; adjacent Exorcist: no delay and saves 1 power/floor'],
  ['受控幽灵到站再+6币', 'Controlled Ghost: +6 coins on arrival'],
  ['邻幽灵：阻止延误，每站节能1', 'Adjacent Ghost: prevents delays and saves 1 power/floor'],
  ['每位相邻幽灵分别受控：阻止延误、每层节能1电，幽灵到站车费 +6。', 'Each adjacent Ghost is controlled: no delay, saves 1 power per floor, and gains +6 arrival fare.'],
  ['每位邻座教练使车费+50%', 'Each adjacent Coach adds +50% base fare'],
  ['每位相邻教练：基础车费+50%；本人到站每邻座+3币', 'Each adjacent Coach: +50% base fare; on the Coach’s arrival: +3 coins per neighbor'],
  ['非教练邻座到站时：每位相邻教练使基础车费 +50%，线性叠加。', 'When a non-Coach neighbor arrives, each adjacent Coach adds +50% base fare. Bonuses stack linearly.'],
  ['本人到站时，每位仍在身旁的邻座使车费 +3。', 'When the Coach arrives, each remaining neighbor adds +3 coins.'],
  ['恰好 1 邻座 +3 金币/层 · 2+ 邻座会加压', 'Exactly 1 neighbor: +3 coins/floor · 2+ causes agitation'],
  ['恰好1邻座：每站+3', 'Exactly 1 neighbor: +3 coins/floor'],
  ['恰好 1 位邻座：每层 +3 金币。', 'Exactly 1 neighbor: +3 coins per floor.'],
  ['至少 2 位邻座：偶数层躁动 +1。没有邻座则无额外效果。', 'At least 2 neighbors: +1 agitation on even floors. No neighbor gives no extra effect.'],
  ['偶数层：总耗电≤4则+1币，超过则躁动+1', 'Even floors: total power ≤4 gives +1 coin; otherwise +1 agitation'],
  ['总耗电≤4：偶数层+1币', 'Total power ≤4: +1 coin on even floors'],
  ['检查整趟耗电，含本人；扣除稳压和节能', 'Checks full-trip power including self, after Stabilizer and savings'],
  ['总耗电＝电梯运转＋所有人物耗电−节能。包括检查员本人；稳压模块和节能可帮助通过检查。', 'Total power = motor + all rider power − savings. The Inspector is included; Stabilizer and savings help pass inspection.'],
  ['炸弹倒计时归零：本局立即失败', 'Bomb timer reaches zero: the run ends immediately'],
  ['炸弹倒计时每上升一层减少 1；如果到站前归零，本局立即失败。到站当层归零则安全。', 'The bomb timer drops by 1 each floor. If it reaches zero before arrival, the run ends; reaching zero on the arrival floor is safe.'],
  ['有警察邻座：到达偶数层时，倒计时不减少。', 'With an adjacent Officer, the timer does not drop on even floors.'],
  ['有警察邻座：相邻期间倒计时锁定不减。', 'With an adjacent Officer, the timer stays locked while they remain adjacent.'],
  ['参数与关系随机 · 到站才揭晓车费', 'Random stats and links · fare revealed on arrival'],
  ['本次参数已固定；车费到站揭晓', 'Current stats are sealed; fare is revealed on arrival'],
  ['耗电、自身躁动、路程及协作/冲突对象每次出现时随机。', 'Power, personal agitation, trip length, and cooperation/conflict targets are randomized each appearance.'],
  ['车费已封存，到站才揭晓；请离不结算隐藏车费。', 'Fare is sealed until arrival. Dismissing the rider does not reveal or pay it.'],
  ['每到一层换属性 · 高额车费', 'Stats change every floor · high fare'],
  ['每站重抽三值和关系；基价28–48币', 'Rerolls all three stats and links each floor; base fare 28–48'],
  ['每到一层重新抽取耗电（1–2）、自身躁动（0–1）、车费（28–48）和联动偏好。', 'Every floor rerolls power (1–2), personal agitation (0–1), fare (28–48), and link preferences.'],
  ['目的地不延长。开门后先看新数值，再决定去留。', 'The destination does not move. Check the new stats when the doors open, then decide whether to keep the rider.'],
  ['每位邻座复制一项 · 随邻座改变', 'Copies one stat per neighbor · changes with neighbors'],
  ['每位邻座复制一项，随邻座变化', 'Copies one stat per neighbor and updates with them'],
  ['每位邻座复制一项：耗电、车费或躁动（含联动偏好），最多三项且不重复。', 'Copies one field from each neighbor: power, fare, or agitation (including link preferences), up to three unique fields.'],
  ['同一邻座组合不会重抽；邻座属性变化会同步。隐藏车费不会提前公开。', 'The same neighbor set does not reroll. Changes to neighbor stats update the copy. Hidden fares remain hidden.'],
  ['不复制技能、炸弹倒计时、路程；复制人互相连接时只取各自本体属性，避免递归。', 'Does not copy abilities, Bomb Carrier timers, or trip length. Linked Mimics use base stats to prevent recursion.'],

  // Upgrades.
  ['默契契约', 'Cooperation Pact'], ['协作控场', 'Cooperative control'],
  ['节能线路', 'Eco Circuit'], ['长期节能', 'Long-term savings'],
  ['舒缓系统', 'Calm System'], ['控场缓冲', 'Agitation buffer'],
  ['礼宾服务', 'Concierge Service'], ['收入投资', 'Income investment'],
  ['稳压模块', 'Stabilizer'], ['抵消耗电', 'Power savings'],
  ['快速电梯', 'Express Lift'], ['长途周转', 'Long-haul turnover'],
  ['躁动上限 +3，并立即降低 6 躁动。', 'Agitation cap +3 and immediately reduce agitation by 6.'],
  ['此后新乘客到站小费 +3，可叠加；不参与车费倍率。', 'New riders gain +3 arrival tip from now on. Stacks; tips are not multiplied.'],
  ['每站抵消1点人物耗电；不影响电梯运转1电。本局限装一次。', 'Cancel 1 passenger power each floor. Does not affect the 1-power motor cost. Limit one per run.'],
  ['此后新乘客原定路程至少 5 层时，目的地提前 1 层；每局限装一次。', 'New riders with an original trip of at least 5 floors arrive 1 floor earlier. Limit one per run.'],
  ['每级使每条协作连接的到站奖励再 +2 金币，并解锁协作送达舒缓。每位协作乘客送达都可舒缓，强度不随等级叠加；购买时不立即舒缓。', 'Each level adds +2 coins to every cooperation-link arrival reward and unlocks linked-arrival relief. Every cooperating rider can calm the cabin on arrival; relief does not scale with level and buying the upgrade gives no immediate relief.'],
  ['到4的倍数层抵消1点人物耗电。与维修工、受控幽灵的节能逐项相加；稳压先算，所有节能最多抵完人物耗电。电梯运转仍至少耗1电。限装一次。', 'On floors divisible by 4, cancel 1 passenger power. This stacks with Mechanics and controlled Ghosts after Stabilizer; total savings cannot exceed passenger use. The motor still costs at least 1 power. Limit one per run.'],

  // Archive descriptions and risk guides.
  ['独处时，每层有25%概率让下一批候选出现另一位恋人。回应者会带有专属标记。每位相邻恋人都让本人每层多赚1金币、到站基础车费增加100%；多条恋人连接线性叠加，小费不参与倍率。', 'When alone, there is a 25% chance each floor that another Lover joins the next candidates. Responders carry a special mark. Each adjacent Lover grants +1 coin per floor and +100% base arrival fare; multiple links stack linearly and tips are not multiplied.'],
  ['车内至少有4名乘客时，每层降低1点躁动；也能安抚醉汉与儿童。', 'With at least 4 riders aboard, reduce agitation by 1 each floor. Also calms adjacent Drunks and Children.'],
  ['未受控制时每层赚3金币、每两层增加1躁动。相邻警察或律师后每层赚1金币且不再制造躁动，抵达再奖励5金币。', 'While uncontrolled, earns 3 coins each floor and adds 1 agitation on even floors. Next to an Officer or Lawyer, earns 1 coin each floor, causes no theft agitation, and gains 5 coins on arrival.'],
  ['控制相邻小偷。与炸弹相邻时，炸弹每两层暂停一次倒计时。', 'Controls adjacent Thieves. An adjacent Bomb Carrier timer does not drop on even floors.'],
  ['控制相邻小偷，并让其抵达时获得额外车费；不能延缓炸弹。', 'Controls adjacent Thieves and grants them an arrival-fare bonus. Cannot slow bombs.'],
  ['高额底价补偿风险。被音乐家或护士安抚时每层再赚1金币；否则有25%概率增加2躁动并随机换位。', 'A high base fare offsets the risk. When calmed by a Musician or Nurse, earns 1 coin each floor; otherwise has a 25% chance to add 2 agitation and swap positions.'],
  ['每逢偶数层降低1点躁动，并安抚相邻的醉汉与儿童。', 'Reduces agitation by 1 on every even floor and calms adjacent Drunks and Children.'],
  ['没有恋人、音乐家或护士相邻时，每逢偶数层躁动+1；有任意照顾者相邻时免除。', 'Without an adjacent Lover, Musician, or Nurse, adds 1 agitation on even floors. Any adjacent caregiver prevents it.'],
  ['相邻驱魔师时，不再延误邻座，每位受控幽灵每层抵消1点人物耗电且到站多得6金币；否则到3的倍数层时随机延误一位邻座1站。所有节能逐项相加，但电梯运转仍至少耗1电。', 'Next to an Exorcist, stops delaying neighbors, saves 1 passenger power each floor, and gains 6 arrival coins. Otherwise, on floors divisible by 3, delays one random neighbor by 1 floor. Savings stack, but the motor still costs at least 1 power.'],
  ['控制每位相邻幽灵，分别阻止延误并使其每层抵消1点人物耗电、到站多得6金币。多位幽灵的效果逐个叠加；电梯运转仍至少耗1电。', 'Controls every adjacent Ghost, preventing delays while each saves 1 passenger power per floor and gains 6 arrival coins. Multiple Ghosts stack; the motor still costs at least 1 power.'],
  ['非教练乘客抵达时，每位相邻教练都让其基础车费提高50%，线性叠加，小费不参与倍率；教练自己抵达时，每名仍在身旁的邻座额外支付3金币。', 'When a non-Coach rider arrives, each adjacent Coach adds 50% to base fare; bonuses stack linearly and do not multiply tips. When the Coach arrives, each remaining neighbor adds 3 coins.'],
  ['恰好一名邻座时每层赚3金币；两名以上邻座时只在偶数层增加1躁动。', 'With exactly one neighbor, earns 3 coins each floor. With two or more, adds 1 agitation on even floors instead.'],
  ['偶数层检查整趟耗电：运转＋所有人物耗电−节能，总计不超过4电时奖励1金币，否则躁动+1。检查员本人也耗1电；稳压和节能能帮助通过检查。', 'On even floors, checks total power: motor + all riders − savings. At 4 or less, earn 1 coin; otherwise add 1 agitation. The Inspector consumes 1 power and savings can help pass.'],
  ['高额悬赏补偿整局失败风险。上车时获得3–6层倒计时；每上升一层减1，到站前归零会结束本局。与警察相邻时，偶数层暂停倒计时。', 'A high reward offsets run-ending risk. The bomb timer starts at 3–6 and drops by 1 each floor; zero before arrival ends the run. Next to an Officer, it does not drop on even floors.'],
  ['高额悬赏补偿整局失败风险。上车时获得3–6层倒计时；每上升一层减1，到站前归零会结束本局。与警察相邻期间，倒计时锁定不减。', 'A high reward offsets run-ending risk. The Bomb timer starts at 3–6 and drops by 1 each floor; zero before arrival ends the run. While adjacent to an Officer, the timer stays locked.'],
  ['炸弹倒计时归零 · 下一班让炸弹客与警察相邻，警察会在相邻期间锁住倒计时；来不及送达就拒载。', 'Bomb timer reached zero · Next shift, keep the Bomb Carrier beside an Officer to lock the timer; refuse the ride if delivery is impossible.'],
  ['每次出现随机人物耗电、自身躁动、路程与协作/冲突对象。车费在生成时封存，到站才揭晓；请离赔偿不透露隐藏车费。', 'Each appearance randomizes power, personal agitation, trip length, and cooperation/conflict targets. Fare is sealed until arrival; dismissal does not reveal it.'],
  ['每到一层重新抽取人物耗电、自身躁动、车费与协作/冲突关系；开门后先看新状态再决定去留。目的地不延长；耗电和躁动会随新属性立即变化。', 'Every floor rerolls power, personal agitation, fare, and cooperation/conflict targets. Review the new state before deciding whether to keep the rider. The destination never extends.'],
  ['随机分配人物耗电、车费、躁动（含联动偏好）三类属性，每位邻座复制一项，最多三项且不重复。相同邻座组合不会重新抽签；复制人的来源取本体，避免递归。隐藏车费仍然隐藏。不复制技能、炸弹倒计时或路程。', 'Randomly copies power, fare, or agitation/link preference from each neighbor, up to three unique fields. The same neighbor set does not reroll; Mimics use base values to avoid recursion. Hidden fares stay hidden. Abilities, Bomb Carrier timers, and trip length are never copied.'],
  ['风险交易', 'Risk trade'], ['条件风险', 'Conditional risk'], ['致命风险', 'Run-ending risk'],
  ['警察 / 律师邻座可控', 'Control with an adjacent Officer / Lawyer'], ['音乐家 / 护士邻座可安抚', 'Calm with an adjacent Musician / Nurse'],
  ['保持恰好 1 名邻座', 'Keep exactly 1 neighbor'], ['偶数层总耗电尽量不超过4', 'Keep total power at 4 or less on even floors'],
  ['与警察相邻：偶数层倒计时不减', 'Adjacent Officer: timer does not drop on even floors'], ['查看这一次的协作与冲突对象', 'Check this appearance’s cooperation and conflict targets'],
  ['与警察相邻：锁住倒计时', 'Adjacent Officer: locks the timer'], ['旁边的炸弹客：相邻期间锁住炸弹倒计时。', 'Adjacent Bomb Carrier: its timer stays locked while adjacent.'],
  ['每层查看新状态，留好请离赔偿', 'Review the new state each floor and reserve dismissal compensation'],
  ['每逢偶数层：本次总耗电不超过4，金币 +1；超过则躁动 +1。', 'On even floors: total power at 4 or less grants +1 coin; above 4 adds +1 agitation.'],

  // Core UI and help.
  ['请竖屏游玩', 'Please rotate to portrait'],
  ['这个横屏尺寸太矮，转回竖屏即可继续；本班进度保留。', 'This landscape viewport is too short. Rotate back to portrait to continue; your run is preserved.'],
  ['乘客档案', 'Passenger Archive'], ['玩法说明', 'How to Play'], ['关闭音乐', 'Mute music'], ['打开音乐', 'Enable music'], ['关闭音效', 'Mute effects'], ['打开音效', 'Enable effects'], ['关闭声音', 'Mute sound'], ['打开声音', 'Enable sound'],
  ['临时夜班', 'Temporary Shift'], ['无尽夜班', 'Endless Shift'], ['午夜启程', 'Midnight Departure'], ['无尽班次', 'Endless Shift'], ['电量', 'Power'], ['躁动', 'Agitation'], ['余额', 'Balance'],
  ['本次变化明细', 'Decision details'], ['电梯座舱', 'Elevator cabin'], ['绿实线协作 · 红虚线冲突', 'Solid green: cooperation · dashed red: conflict'],
  ['绿实线协作 · 红虚线显示代价', 'Solid green: cooperation · dashed red: cost'],
  ['绿线发奖励；红线图标直接显示每层代价。两者分别结算，多条都可叠加。', 'Green links pay rewards; red-link icons show their per-floor cost. They resolve independently, and multiple links stack.'],
  ['卡牌稀有度', 'Card rarity'], ['常规', 'Standard'], ['精良', 'Fine'], ['稀有', 'Rare'], ['传奇', 'Legendary'],
  ['门已开启。把候选人物直接拖进指定站位。', 'Doors open. Drag a candidate directly into a position.'],
  ['拖拽人物安排站位 · 有效组合会亮起', 'Drag riders into position · valid links will glow'],
  ['谁要上楼？', 'Who is going up?'], ['送达后领取基础奖励 · 途中收益与人物联动另算', 'Collect the base fare on arrival · floor income and links resolve separately'],
  ['关门上行', 'Ascend'], ['正在上行', 'Ascending'], ['人物/请离', 'Rider / Dismiss'],
  ['试着连出一条绿线', 'Create a green link'], ['绿色协作已生效', 'Green cooperation active'], ['有人回应了呼唤', 'Someone answered the call'],
  ['新手示例：让两位恋人成为邻座，观察绿色协作线', 'Tutorial example: place two Lovers together and watch the green cooperation line'],
  ['新手示例 · 让两位恋人成为邻座，观察绿色协作线', 'Tutorial · place two Lovers together and watch the green cooperation line'],
  ['每条绿线奖励都叠加；有绿线时免邻座冲突，人物技能另算。', 'Every green link stacks. Any green link blocks neighbor conflicts; rider abilities still resolve.'],
  ['每条绿线奖励都叠加；有绿线时免邻座冲突，人物技能另算', 'Every green link stacks. Any green link blocks neighbor conflicts; rider abilities still resolve'],
  ['每条绿线奖励都叠加；有绿线时免邻座冲突，人物技能另算；每位协作送达各舒缓一次。', 'Every green link stacks. Any green link blocks neighbor conflicts; each cooperative arrival also calms the cabin once.'],
  ['点此撤回', 'Click to undo'], ['已选中 · 点空位', 'Selected · choose a position'], ['车厢已满', 'Cabin full'],
  ['已上车', 'On board'], ['不可放置', 'Cannot place'], ['松手', 'Drop'], ['点击', 'Click'], ['联动', 'Link'], ['就位', 'Place'],
  ['选中人物 · 查看 / 请离', 'Select a rider · inspect / dismiss'], ['旧乘客换位已用 · 新上客仍可调整', 'Existing-rider move used · new riders may still move'],
  ['选择发光站位 · ESC 取消', 'Choose a glowing position · ESC to cancel'], ['再选一个站位完成调整 · ESC 取消', 'Choose another position to complete the move · ESC to cancel'],
  ['已选中乘客 · 请点电梯里的目标空位', 'Rider selected · choose an open cabin position'],
  ['今晚，所有人', 'Tonight, everyone'], ['都想再上一层。', 'wants one more floor.'],
  ['临时顶班。', 'A temporary assignment.'], ['这栋楼没有尽头。', 'This building has no end.'],
  ['今晚，你被临时派来这座古怪大楼开电梯。守住电量和躁动，安排每位乘客的位置。这里没有最后一层——活得越久，成绩越高。', "Tonight, you were sent to operate the elevator in this strange building. Keep power above zero, keep agitation below its limit, and place every rider carefully. There is no final floor—the longer you survive, the higher your score."],
  ['接客并安排站位', 'Board and place riders'], ['守住电量与躁动', 'Manage power and agitation'], ['尽可能生存下去', 'Survive as long as you can'],
  ['开始临时夜班', 'Start the Temporary Shift'],
  ['开始游戏', 'Start Game'],
  ['这是一次没有终点的临时夜班。守住电量与躁动，活得越久，楼层成绩越高。', 'This temporary night shift has no end. Protect your power and agitation limits; the longer you survive, the higher your floor score.'],
  ['安排六个站位，促成协作，避开冲突。没有终点，越往上越难。送客赚取金币，每十层购买升级，挑战自己的最高楼层。', 'Arrange six positions, build cooperation, and avoid conflict. There is no final floor—the higher you go, the harder it gets. Deliver riders for coins, buy upgrades every ten floors, and chase your personal best.'],
  ['选人安排站位', 'Choose riders and positions'], ['绿线协作 · 红线冲突', 'Green cooperation · red conflict'], ['权衡代价后上行', 'Weigh the cost, then ascend'],
  ['开始午夜班次', 'Start the Midnight Shift'], ['先阅读值班手册', 'Read the shift manual first'], ['值班手册', 'Shift Manual'],
  ['楼层就是成绩；金币是购买升级的预算。没有最后一层。', 'Your floor is your score. Coins fund upgrades. There is no final floor.'],
  ['拖拽安排', 'Arrange by drag'], ['还剩几站', 'Floors remaining'], ['三个值，六个站位', 'Three stats, six positions'], ['人数与躁动', 'Crowding and agitation'],
  ['人物直接影响躁动', 'Riders directly affect agitation'], ['十层补给', 'Supply every ten floors'], ['协作、冲突与堆叠', 'Cooperation, conflict, and stacking'],
  ['到层请离', 'Dismiss on a floor'], ['空驶休整', 'Empty-car rest'], ['先准备，再闯高压段', 'Prepare before pressure waves'], ['默契契约 · 协作送达', 'Cooperation Pact · linked arrivals'],
  ['人多、等得久，就会躁动。', 'Crowds and long waits raise agitation.'], ['会增加躁动', 'Raises agitation'], ['轿厢拥挤', 'Cabin crowding'], ['班次压力 · 提前准备', 'Shift pressure · prepare ahead'],
  ['人物事件', 'Rider events'], ['高躁动放大人物风险', 'High agitation amplifies rider risks'], ['可以主动缓解', 'Ways to reduce it'], ['给组合留空间', 'Leave room for a good formation'],
  ['快速送达', 'Deliver quickly'], ['安排安抚角色', 'Use calming riders'], ['购买舒缓系统', 'Buy Calm System'], ['按现在的站位', 'With the current formation'],
  ['把人物拖进站位，或先点乘客再点空位。连线两端互为邻座。旧乘客每层只能换位一次；新上客移到空位或与新上客互换不消耗次数。', 'Drag a rider into a position, or select a rider and then an open position. Linked positions are neighbors. Existing riders may move once per floor; moving or swapping newly boarded riders is free.'],
  ['每次关门上行算一站，人物身上的剩余站数会递减；幽灵可能延误邻座。', 'Each ascent counts as one floor and reduces every rider’s remaining trip. An uncontrolled Ghost may delay a neighbor.'],
  ['人物只看金钱、耗电和躁动；没有独立载重或耐心。人数由六个站位限制。金钱到站结算，途中收入另标。每站总耗电＝电梯运转1＋所有人物耗电−节能。卡片上的耗电是该人物每坐一站的成本，到站这一站也计费。', 'Riders have only three values: coins, power, and agitation. There is no separate weight or patience. Six positions limit capacity. Fare resolves on arrival; floor income is labeled separately. Total power per floor = 1 motor + all rider power − savings. The arrival floor still consumes power.'],
  ['3–4人不增加拥挤躁动；5人每站 +1，满6人 +2；最多2人时 −1。每位乘客到站再 −1。人物事件和长班疲劳另算。', 'Three or four riders add no crowding agitation. Five add +1 per floor, six add +2, and two or fewer give −1. Every normal arrival also gives −1. Rider events and shift fatigue resolve separately.'],
  ['卡片写明何时加减躁动。达到上限三分之二时，人物技能与邻座冲突造成的正向躁动翻倍；安抚、拥挤和班次压力不翻倍。按关门前的躁动判断，卡片显示已换算数值。', 'Cards state exactly when agitation changes. At two-thirds of the cap, positive agitation from rider abilities and neighbor conflicts doubles; relief, crowding, and shift pressure do not. Cards show the already-adjusted values before departure.'],
  ['开局3次；每送达1人恢复1次，最多3次。空车上行自动消耗1次，免除本层长班疲劳。用尽后仍能空驶，但不再免疲劳。接客、撤回、请离与购物都不恢复次数。', 'Begin with 3 rests. Each delivered rider restores 1, up to 3. An empty ascent automatically spends 1 to prevent that floor’s shift fatigue. Empty travel remains possible at zero rests but no longer avoids fatigue. Boarding, undoing, dismissing, and shopping restore nothing.'],
  ['5人每站 +1；满6人每站 +2。', 'Five riders add +1 agitation per floor; a full cabin of six adds +2.'],
  ['未受控小偷、无人照顾的儿童、醉汉、被围住的名人和耗电检查，会按卡片规则增加躁动。', 'Uncontrolled Thieves, unattended Children, Drunks, surrounded Celebrities, and failed Inspector checks add agitation as written on their cards.'],
  ['技能和邻座冲突的正向增量 ×2；安抚不变。卡片已显示当前倍率后的数值。', 'Positive agitation from abilities and neighbor conflicts doubles; relief is unchanged. Cards already show the current multiplier.'],
  ['3–4人不增加拥挤躁动；最多2人，每站 −1。人物事件和长班疲劳仍会结算。', 'Three or four riders add no crowding agitation; two or fewer reduce it by 1 per floor. Rider events and shift fatigue still resolve.'],
  ['每位正常到站的乘客 −1，并恢复1次空驶休整，最多3次。', 'Each normal arrival reduces agitation by 1 and restores one empty-car rest, up to 3.'],
  ['空车上行自动消耗1次，本层免长班疲劳，仍有宽松 −1。用尽后空驶也会疲劳。只在成功送达时恢复；接客、请离和商店不能刷新。', 'An empty ascent automatically spends one rest, avoids shift fatigue, and still gains uncrowded −1. At zero rests, empty travel takes fatigue. Only successful deliveries restore rests.'],
  ['至少4人时，每位音乐家每站 −1；每位护士每逢偶数层 −1。多人效果可以相加。', 'With at least four riders, each Musician gives −1 agitation per floor. Each Nurse gives −1 on even floors. Multiple riders stack.'],
  ['立即 −6 躁动，上限 +3。不再需要维持“热区”来赚小费。', 'Immediately reduce agitation by 6 and raise its cap by 3. No “hot zone” is required for tips.'],
  ['遇见过的乘客会录入档案。最高抵达 ', 'Riders you encounter enter the archive. Highest floor: '],
  ['每张卡本次限购一次；可以买多张，也可以攒钱离开。已安装的效果持续整班。', 'Each offered card can be bought once. Buy several or save your coins and leave. Installed effects last for the entire shift.'],
  ['电量与躁动同时失控：需要充电并购买舒缓系统，两项都修复才能继续。', 'Power and agitation have both failed. Recharge and buy Calm System; both must be repaired to continue.'],
  ['电量已耗尽：使用下方充电服务，将电量恢复到 0 以上才能继续。', 'Power is depleted. Use recharge service below and restore it above 0 to continue.'],
  ['躁动已超限：购买舒缓系统，将躁动降到上限以下才能继续。', 'Agitation is over the cap. Buy Calm System to bring it below the cap.'],
  ['若无力修复，本班将在这里结束。', 'If you cannot repair the elevator, the shift ends here.'],
  ['午夜乘客档案', 'Midnight Passenger Archive'], ['尚未遇见', 'Not encountered'], ['继续向上，等待相遇', 'Keep climbing to meet them'],
  ['这台电梯，升级了什么？', 'What has this elevator installed?'], ['未安装', 'Not installed'], ['返回本班', 'Return to shift'],
  ['这次，改变了什么？', 'What changed this time?'], ['补充说明', 'Additional notes'], ['返回安排', 'Return to arrangement'],
  ['本班失败', 'Shift Failed'], ['炸弹倒计时归零', 'Bomb timer reached zero'], ['电量耗尽 · 躁动失控', 'Power depleted · agitation out of control'], ['电量耗尽', 'Power depleted'], ['躁动失控', 'Agitation out of control'],
  ['本班抵达', 'Floor reached'], ['无尽纪录', 'Endless record'], ['累计赚取', 'Total earned'], ['本班支出', 'Spent this shift'], ['查看乘客档案', 'View Passenger Archive'],
  ['再开一班 · 挑战更高楼层', 'Start another shift · climb higher'],

  // Runtime status, forecasts, and interactions.
  ['不变', 'no change'], ['本层持平', 'No change this floor'], ['收支抵消', 'offset'], ['上限', 'cap'], ['下一站', 'Next floor'], ['下一层', 'Next floor'], ['本层', 'This floor'],
  ['空驶', 'Empty-car'], ['休整', 'rest'], ['开始', 'begins'],
  ['宽松 −1 · 休整 3→2，免疲劳', 'Uncrowded −1 · rest 3→2, fatigue avoided'],
  ['自身躁动', 'personal agitation'], ['邻座冲突', 'neighbor conflict'], ['已配对', 'Paired'], ['正在呼唤同伴', 'Calling a partner'],
  ['已受控制', 'Controlled'], ['未受控制', 'Uncontrolled'], ['正在控制', 'Controlling'], ['已被安抚', 'Calmed'], ['不稳定', 'Unstable'],
  ['有人照顾', 'Cared for'], ['无人照顾', 'Unattended'], ['已被镇压', 'Suppressed'], ['正在作祟', 'Haunting'], ['正在驱魔', 'Exorcising'],
  ['任何邻座 · +1币/层', 'Any neighbor · +1 coin/floor'], ['旅伴 ', 'Companions '],
  ['旅伴加成', 'Companion bonus'],
  ['游客旅伴', 'Tourist companions'],
  ['等待邻座', 'Waiting for a neighbor'], ['状态最佳', 'Ideal position'], ['被围住', 'Surrounded'], ['缺少关注', 'Needs attention'], ['正在演奏', 'Performing'], ['正在安抚', 'Calming'],
  ['每层抵消邻座1躁动', 'Cancels 1 adjacent agitation/floor'], ['高危', 'High Risk'], ['高危 +', 'High Risk +'], ['高危 +1', 'High Risk +1'], ['高危到站 +8币', 'High Risk arrival +8'],
  ['卡牌稀有度', 'Card rarity'], ['本层起，高危候客增加', 'High-risk candidates increase from this floor'],
  ['至少接一位乘客才能上行。', 'Board at least one rider to ascend.'], ['至少接一位乘客才能上行', 'Board at least one rider to ascend'], ['至少接1人', 'Board 1+ rider'],
  ['只计算人物', 'Riders only'], ['每位到站 −1 · 本层最多 −2', 'Each arrival −1 · at most −2 this floor'], ['每位到站：本层最多 −1', 'Any arrivals: at most −1 this floor'], ['再 +', 'Failure in +'], [' 失控', ''],
  ['车费待揭晓', 'Fare hidden'], ['到站金币', 'Arrival fare'], ['每站耗电', 'Power per floor'], ['自身', 'Self'], ['当前不能调整站位', 'Positions cannot be changed now'], ['请选择电梯里的站位', 'Choose a cabin position'], ['已在此处', 'Already here'],
  ['本层旧乘客换位已用', 'Existing-rider move already used this floor'], ['这里已经有人 · 请选空位', 'That position is occupied · choose an open one'],
  ['恋人配对', 'Lovers paired'], ['联动成立', 'Link activated'], ['站位已调整', 'Position changed'], ['乘客已就位', 'Rider placed'],
  ['恋人已配对：每层 +2 金币，到站车费翻倍。', 'Lovers paired: +2 coins per floor; arrival fare doubled.'],
  ['站位已调整 · 本层旧乘客换位已用。', 'Position changed · existing-rider move used for this floor.'], ['站位已调整 · 不消耗旧乘客换位。', 'Position changed · existing-rider move not consumed.'],
  ['已取消安排。', 'Arrangement cancelled.'], ['恋人的呼唤得到了回应。把两人安排在相邻站位。', 'A Lover answered the call. Place the two Lovers next to each other.'],
  ['电梯继续向上，新的面孔正在等候。', 'The elevator climbs on. New faces are waiting.'], ['百变人已变化，关门前查看新属性。', 'The Shifter has changed. Check the new stats before closing the doors.'],
  ['电量耗尽，轿厢停在了楼层之间。', 'Power ran out. The cabin stopped between floors.'], ['躁动突破上限，午夜班次失控。', 'Agitation crossed the limit. The midnight shift collapsed.'],
  ['炸弹倒计时归零：乘客未能及时到站。午夜班次戛然而止。', 'Bomb timer reached zero before the passenger arrived. The shift ended abruptly.'],
  ['下一层躁动不变 · 没有已知来源', 'Next floor: no agitation change · no known source'], ['休整用尽，空驶不免疲劳', 'No rests left; an empty car no longer prevents fatigue'],
  ['高躁动：人物引起的正向躁动 ×2', 'High agitation: positive rider agitation ×2'], ['人物正向躁动已按 ×2 计算', 'Positive rider agitation already calculated at ×2'],
  ['电梯运转', 'Elevator motor'], ['稳压模块抵消', 'Stabilizer'], ['节能少耗', 'Power savings'], ['宽松轿厢', 'Uncrowded cabin'], ['班次压力', 'Shift pressure'],
  ['快递员电池包', 'Courier battery pack'], ['快递补电', 'Courier recharge'], ['可能快递补电', 'possible Courier recharge'],
  ['红线躁动', 'Red-link agitation'], ['红线额外耗电', 'Red-link extra power'], ['红线金币损失', 'Red-link coin loss'], ['抵达商店补电', 'Shop-entry recharge'],
  ['乘客到站舒缓', 'Arrival relief'], ['商店充电', 'Shop charge'], ['补给站充电', 'Supply-station charge'], ['请离赔偿', 'Dismissal compensation'], ['电量上限截取', 'Power capped'], ['躁动下限修正', 'Agitation floor adjustment'],
  ['恋人连携', 'Lover link'], ['受控小偷', 'Controlled Thief'], ['小偷', 'Thief'], ['醉汉安抚', 'Calmed Drunk'],
  ['名人关注', 'Celebrity attention'], ['检查员合规奖励', 'Inspector compliance'], ['揭晓车费', ' revealed fare'],

  // Shop.
  ['先维修，再继续上行', 'Repair first, then continue'], ['把这一程收入，投进下一程。', 'Invest this ride in the next one.'], ['商店 · 紧急维修', 'Shop · Emergency repair'], ['紧急维修', 'Emergency repair'], ['商店', 'Shop'], ['补给站', 'Supply Station'],
  ['按需购卡，可买多张，也可离开。', 'Buy as many cards as needed, or leave.'], ['可用金币', 'Available coins'], ['累计收入', 'Total earned'], ['已花费', 'Spent'],
  ['充电或购买升级。每张卡限购一次。', 'Recharge or buy upgrades. Each card can be bought once.'], ['充电 ·', 'Recharge ·'], ['币 = 1电', ' coin = 1 power'], ['金币买1电', 'coin per power'], ['已达到62电参考线', '62-power reference reached'], ['购买并安装', 'Buy & install'],
  [' · 到下个商店至少需 ', ' · at least '], [' · 到下个补给站运转至少要 ', ' · motor to next supply stop costs at least '], [' 电，人物另计', ' power to the next shop, plus riders'], ['电参考线', '-power reference reached'],
  ['当前电量低于下一段运转参考；人物耗电与途中回充另计。再点一次确认冒险。', 'Power is below the next sector’s motor reference. Rider costs and power gained en route are separate. Click again to accept the risk.'], ['确认冒险离开', 'Confirm risky departure'], ['继续上行', 'Continue upward'],
  ['下一站：商店', 'Next: Shop'], ['十层商店', 'Shop every ten floors'], ['收入 ', 'Earned '], [' · 支出 ', ' · Spent '], ['三个值，六个站位', 'Three values, six positions'], ['躁动只来自人物', 'Agitation comes from riders'], ['安抚可以堆叠', 'Calming stacks'], ['十层补给', 'Supply every ten floors'], ['协作、冲突与堆叠', 'Cooperation, conflict, and stacks'],
  ['每一点躁动，都能在人物身上找到。', 'Every agitation point traces back to a rider.'], ['会增加躁动', 'Adds agitation'], ['人物自身', 'Rider values'], ['人物事件', 'Rider events'], ['红色冲突线', 'Red conflict links'], ['可以主动缓解', 'Ways to reduce it'], ['安抚邻座', 'Calm adjacent riders'], ['完成短程', 'Complete a trip'], ['购买舒缓系统', 'Buy Calm System'],
  ['人物卡明确显示每层 0、+1 或 +2；高危乘客固定再 +1。', 'Rider cards explicitly show 0, +1, or +2 per floor. High Risk adds another +1.'],
  ['未受控的小偷、儿童与醉汉，被围住的名人，以及高耗电时的检查员，会按卡片规则增加躁动。', 'Uncontrolled Thieves, Children and Drunks, surrounded Celebrities, and Inspectors under high power add agitation exactly as shown on their cards.'],
  ['每条红线每层 +1。若该人物同时拥有任意绿色协作线，其邻座冲突被免除。', 'Each red link adds +1 per floor. Any green cooperation link protects that rider from neighbor conflicts.'],
  ['每位护士或音乐家抵消一名相邻乘客的 1 躁动。多人可堆叠，但不会产生负数。', 'Each Nurse or Musician cancels 1 agitation from one adjacent rider. Multiple calmers stack but never create a negative value.'],
  ['安抚所有邻座', 'Calm every adjacent rider'],
  ['护士让所有相邻乘客每人减 1 躁动；音乐家每人减 2，但每层耗2电。多人与多个邻座都可叠加。', 'A Nurse reduces every adjacent rider by 1 agitation. A Musician reduces each by 2 but costs 2 power per floor. Multiple calmers and neighbors all stack.'],
  ['每位正常到站的乘客让本层躁动 −1，同层最多 −2。', 'Each rider who arrives normally reduces agitation by 1 that floor, capped at 2.'],
  ['护士让所有相邻乘客每人减 1 躁动；稀有音乐家每人减 2，但每层耗2电。多人效果分别叠加，不会降到 0 以下。', 'A Nurse reduces every adjacent rider by 1 agitation. A rare Musician reduces each by 2 but costs 2 power per floor. Multiple effects stack without reducing agitation below zero.'],
  ['只要本层有人正常到站，本层总躁动最多 −1；同层多人到站也只减 1。', 'If any rider arrives normally, total agitation falls by at most 1 that floor. Multiple arrivals still reduce only 1.'],
  ['购买时立即 −2 躁动，并将上限 +1。', 'Immediately reduce agitation by 2 and increase its cap by 1.'],
  ['人物只看金钱、耗电和躁动。每站耗电＝电梯运转1＋车内人物耗电−节能；到站这一站也计费。电量或躁动任一触底，本班都会结束。', 'Riders have only coins, power, and agitation. Power per floor = motor 1 + rider power − savings; the arrival floor also costs power. Running out of power or reaching the agitation cap ends the shift.'],
  ['人物只看金钱、耗电和躁动。每站耗电＝电梯运转1＋车内人物耗电＋红线耗电−节能；到站这一站也计费。电量或躁动任一触底，本班都会结束。', 'Riders have only coins, power, and agitation. Power per floor = motor 1 + rider power + red-link power − savings; the arrival floor also costs power. Running out of power or reaching the agitation cap ends the shift.'],
  ['卡片只显示 0、+1 或 +2；没有拥挤、楼层压力或隐藏倍率。只有标有 🔥 的红线每层 +1 躁动；每位正常到站乘客让本层总躁动最多 −1。', 'Cards show only 0, +1, or +2. There is no crowding, floor pressure, or hidden multiplier. Only red links marked 🔥 add 1 agitation per floor; any normal arrival reduces total agitation by at most 1 that floor.'],
  ['卡片只显示 0、+1 或 +2；没有拥挤、楼层压力或隐藏倍率。每条未被协作保护的红线每层 +1；每位正常到站乘客让本层总躁动最多 −1。', 'Cards show only 0, +1, or +2. There is no crowding, floor pressure, or hidden multiplier. Each unprotected red link adds +1 per floor; any normal arrival reduces total agitation by at most 1 that floor.'],
  ['每位护士或音乐家每层抵消一名相邻乘客的 1 躁动。多人效果会分别结算，但不会把躁动降到 0 以下。', 'Each Nurse or Musician cancels 1 agitation from one adjacent rider per floor. Multiple calmers resolve separately but never reduce agitation below zero.'],
  ['关门前先看左栏的下一站预测；达到 ', 'Before closing the doors, check the next-floor forecast on the left. At '],
  [' 就会失控。没有拥挤惩罚、楼层压力或隐藏倍率。', ', the shift loses control. There is no crowding penalty, floor pressure, or hidden multiplier.'],
  ['绿线奖励逐条叠加并免除冲突；护士、音乐家各抵消一名相邻乘客的 1 躁动。', 'Green-link rewards stack and protect against conflicts. Each Nurse or Musician cancels 1 agitation from one adjacent rider.'],
  ['。每十层可用金币充电或买升级；两者争用同一笔预算。高危乘客多赚 ', '. Every ten floors, spend coins on charging or upgrades; both compete for the same budget. High-risk riders earn '],
  [' 金币，但每层多 +1 躁动。', ' extra coins but add +1 agitation per floor.'],
  [' 金币，多条逐条叠加；有任意绿线时免除该人物全部邻座冲突。红线每层 +1 躁动。', ' coins. Multiple links stack; any green link protects the rider from all neighbor conflicts. Red links add +1 agitation per floor.'],
  ['当前电量连到下个补给站的基础运转都不够，人物还会额外耗电。再点一次确认带风险离开。', 'Current power cannot cover even the motor cost to the next supply stop, before rider power. Click again to leave at risk.'],
  ['已安装，可在升级清单中查看', 'Installed · view in the upgrade list'], ['购买后不足以预留完整充电费', 'This purchase leaves too little for the full charging reserve'],
  ['无力修复 · 结束本班', 'Cannot repair · end shift'], ['确认少电离开 · 自担风险', 'Leave underpowered · accept risk'], ['离开商店 · 继续上行', 'Leave shop · continue upward'],

  // Release archive headings.
  ['版本 v', 'Version v'], ['每次更新都记录玩法变化、数值依据、测试结论与仍需观察的问题。', 'Every release records gameplay changes, exact values, test findings, and remaining watch items.'],
  ['改进', 'Changes'], ['试验与结论', 'Tests & findings'], ['继续观察', 'Watch next'],
  ['把难度墙改成生存考题', 'Turn the difficulty wall into a survival test'], ['版本记录进入游戏', 'Release history enters the game'],
  ['堆叠与流派成型', 'Stacks and builds take shape'], ['维修工改为持续节能', 'Mechanic becomes a steady saver'],
  ['躁动表达与商店可读性', 'Clearer agitation and shop'], ['车内人物信息常驻', 'On-board stats stay visible'], ['人物卡片与档案修复', 'Passenger cards and archive repaired'],
];

const phrasePairs: Array<[string, string]> = [
  ['充电每点', 'Recharge costs '], ['金币，先留路费再买卡；右上角叠层图标可查看已装升级。', ' coins per power. Reserve travel power before buying cards; use the Layers icon to review installed upgrades.'],
  ['绿线表示协作：本人到站时，每条仍连接的绿线额外 +', 'Green lines mean cooperation. On arrival, each connected green line grants +'],
  ['金币，多条逐条叠加。没有绿线保护时，每条红色冲突线会在偶数层增加1躁动。有任意绿线时免除该人物全部邻座冲突；人物技能另算。', ' coins and multiple lines stack. Without green protection, each red conflict adds 1 agitation on even floors. Any green line blocks that rider’s neighbor conflicts; abilities resolve separately.'],
  ['选中车内人物，打开人物详情后请离。赔偿4+剩余站数×2金币，不结算到站奖励。本层刚上车仍可免费撤回。', 'Select a rider aboard, open details, and dismiss them. Compensation is 4 + remaining floors ×2 coins; arrival rewards are lost. A rider boarded this floor can still be undone for free.'],
  ['初始', 'Start with '], ['电、容量', ' power, capacity '],
  ['。大多数人物每站耗1电，游客、教练耗2电，幽灵不耗电；神秘人、百变人按当前属性耗1–2电。节能只抵消人物耗电，空驶仍耗1电。首10层不加班次压力；之后尾数1–3的楼层用于准备，4–6每站额外 +1 躁动，7–9高压三层每站额外 +4。整十层补给时撤去这部分压力，但不会自动清零躁动。51层起基础压力 +1，此后每40层再 +1。时段固定，不会因为你变强而临时加难。', '. Most riders cost 1 power per floor; Tourists and Coaches cost 2, while Ghosts cost 0. Mystery and Shifter currently cost 1–2. Savings cancel rider power only, so an empty ascent still costs 1. Floors 1–10 add no shift pressure. Later, floors ending 1–3 are preparation, 4–6 add +1 agitation, and 7–9 add +4. Supply floors remove wave pressure but do not clear agitation. Base pressure rises by +1 from floor 51 and again every 40 floors.'],
  ['购买后，每位带着至少一条绿线到站的乘客都会使躁动 −', 'After purchase, every rider arriving with at least one green line reduces agitation by '],
  ['。同层送达多人可分别触发；契约等级只提高每条绿线的金币，不提高单次舒缓。请离不算送达，购买时也不立即舒缓。', '. Multiple riders arriving together trigger separately. Pact levels raise each line’s coins, not relief. Dismissal is not delivery, and buying gives no immediate relief.'],
  ['躁动达到 ', 'At agitation '], ['：人物造成的正向躁动翻倍；达到 ', ', positive rider agitation doubles. At '], ['：本班失控。音乐家、护士和快速送达能缓解。', ', the shift fails. Musicians, Nurses, and quick arrivals provide relief.'],
  ['首10层不增加。之后每段尾数1–3与整十层只算基础压力，4–6再 +1，7–9再 +4。51层起基础 +1，此后每40层再 +1。空车且有休整次数时免除本层班次压力。下一站实际 +', 'Floors 1–10 add none. Later, floors ending 1–3 and supply floors use base pressure, 4–6 add +1, and 7–9 add +4. Base pressure rises from floor 51 and every 40 floors. An empty car with a rest avoids shift fatigue. Actual next-floor rise: +'],
  ['下一站耗 ', 'Next floor costs '], ['下一层 ', 'Next floor '], [' 电＝运转 ', ' power = motor '], ['＋人物 ', '+ riders '], ['−节能 ', '− savings '],
  ['宽松 −1', 'Uncrowded −1'], ['，免疲劳', ', fatigue avoided'],
  ['查看已装升级，共 ', 'View installed upgrades: '], ['查看 v', 'View v'], [' 更新记录', ' release notes'], ['距离 ', ''], [' 层商店还有 ', ' floors to shop: '],
  ['当前楼层 · BEST ', 'CURRENT FLOOR · BEST '], ['上限 ', 'Cap '], ['下一站 ', 'Next '], [' 站到商店', ' floors to shop'], ['本班累计 ', 'Shift total '], [' 站后商店', ' floors to shop'],
  ['人物正向躁动 ×2', 'Positive rider agitation ×2'], [' 起：人物正向躁动 ×2', '+: positive rider agitation ×2'], [' 起人物躁动 ×2', '+: rider agitation ×2'],
  ['拥挤 +', 'Crowding +'], ['宽松 −1 / 站', 'Spacious −1/floor'], [' 人：不拥挤', ' riders: no crowding'], [' · 疲劳 +', ' · fatigue +'],
  ['空驶休整剩余 ', 'Empty-car rests remaining: '], [' 次，查看规则', ' · view rules'], ['前往 ', 'To '],
  ['金币增加 ', 'Coins gained '], ['电量 ', 'Power '], ['躁动 ', 'Agitation '], ['到站收益', 'arrival fare'], ['每站耗电', 'power/floor'], ['下一站躁动', 'next-floor agitation'],
  [' 号位，', ' position, '], ['号空位', ' empty position'], ['，可联动', ', link available'], ['还剩 ', ''], [' 站', ' floors'], ['炸弹倒计时 ', 'Bomb timer '],
  ['复制 ', 'Copied '], [' 项', ' fields'], ['激励 ', 'Coaching '], [' 人', ' riders'], ['协作到站 +', 'Linked arrival +'], ['耗电 ', 'Power '], [' · 躁动 +', ' · agitation +'],
  ['查看', 'View '], ['详情', ' details'], ['规则', ' rules'], ['查看第 ', 'View #'], [' 位', ''], ['上车可联动 · ', 'Board to link · '], ['已选', 'Selected '], [' · 点下方空位', ' · choose a position below'],
  ['到站每邻', 'Cooperates with '], ['每条协作连接奖励 ', 'Reward per cooperation link: '], [' 金币', ' coins'], ['，当前 ', '; '], [' 条生效', ' active'], ['；送达减少 ', '; arrival reduces '],
  ['小费（不翻倍）', ' tip (not multiplied)'], ['另有小费 ', 'Extra tip: '], ['到站金币待揭晓', 'Arrival fare hidden'], ['到站金币 ', 'Arrival fare '], ['每站躁动 +', 'Agitation/floor +'], ['自身 +', 'Self +'],
  ['查看选中人物规则', 'Inspect selected rider'], ['选中人物 · ', 'Selected rider · '], [' · 请离', ' · dismiss'],
  ['已选择', 'Selected '], ['，现在点一个空位。', '; now choose an open position.'], ['回到队伍中。', ' returned to the queue.'], ['下车', ' removed'], ['已站到 ', ' placed in '], ['号位。', ' position.'],
  [' 层 · 到站结算', 'F · arrival settlement'], ['F · 本层结算', 'F · floor settlement'], [' 本层结算', ' floor settlement'],
  ['位乘客抵达。门再次开启。', ' riders arrived. Doors open again.'], [' 位乘客抵达。门再次开启。', ' riders arrived. Doors open again.'],
  ['查看人物详情', 'View rider details'], ['切换候客卡片', 'Switch candidate card'], ['本层候客乘客', 'Candidates on this floor'],
  ['到站车费：', 'Arrival fare: '], ['？封存中，到站揭晓', '? sealed until arrival'], [' · 升级小费 +', ' · upgrade tip +'], ['提前请离 · 赔偿 ', 'Dismiss early · compensation '],
  ['确定让这位乘客在 ', 'Dismiss this rider on floor '], [' 层下车？此操作不可撤回。', '? This cannot be undone.'], ['金币不足 · 还差 ', 'Not enough coins · need '], ['确认请离 · 支付 ', 'Confirm dismissal · pay '],
  ['提前请离这位乘客', 'Dismiss this rider early'], ['本班已安装 ', 'Installed this shift: '], [' 次。以下是当前累计效果，不是下一次购买的预告。', ' upgrades. These are current cumulative effects, not purchase previews.'],
  ['电量上限 ', 'Power cap '], ['站位 ', 'Positions '], [' 个', ''], ['躁动上限 ', 'Agitation cap '], ['已装 ×', 'Installed ×'], ['上限', 'Cap'],
  ['。以下是实际变化，不是下一层预测。', '. These are actual changes, not a forecast.'], ['次升级 · 剩余 ', ' upgrades · '], ['金币。金币只在本班使用，下一班重新开始。', ' coins left. Coins reset at the start of the next shift.'],
  ['这次抵达 ', 'Reached floor '], [' 层，刷新了你的纪录。', ' · new personal record.'], [' 层', ''], ['初始', 'Start with '], ['电、容量', ' power, capacity '],
  ['躁动达到 ', 'At agitation '], ['：人物造成的正向躁动翻倍；达到 ', ': positive rider agitation doubles; at '], ['：本班失控。音乐家、护士和快速送达能缓解。', ': the shift is lost. Musicians, Nurses, and quick arrivals can reduce it.'],
  ['空驶休整 · 还剩 ', 'Empty-car rests · '], [' 次', ' left'], ['下一站实际 +', 'Actual next-floor rise +'],
  ['最高抵达 ', 'Highest floor: '], ['F。', 'F.'], [' FLOOR ', ' FLOOR '],
  ['当前 ', 'Current '], [' · 下段空驶要 ', ' · empty ride to next shop costs '], [' 电，载人另计', ' power, riders extra'], ['补至 ', 'Charge to '], ['补至', 'Charge to '], ['需 ', ' costs '], [' 金币，余 ', ' coins; balance '], [' 可买卡。参考电量不保证续航，接谁会改变耗电。', ' remains for cards. Reference power is not a guarantee; rider choices change consumption.'],
  ['已充满 ', 'Full at '], [' 电', ' power'], ['+10 电 · ', '+10 power · '], ['+1 电 · ', '+1 power · '], ['还差 ', 'Need '], ['，已购入', ', purchased'], ['✓ 已购入', '✓ Purchased'],
  ['确认请离', 'Confirm dismissal'], ['已请离 · 赔偿 ', 'Dismissed · compensation '], ['请离赔偿', 'Dismissal compensation'],
  ['协作：旁边有', 'Cooperation: adjacent to '], ['冲突：旁边有', 'Conflict: adjacent to '], ['每条连接 +', 'Each link +'], ['额外躁动 −', 'Agitation −'], ['另一位', 'another '],
  ['或', ' or '], ['/条', '/link'], ['/站', '/floor'], ['/ 站', '/floor'], ['金币', 'Coins'], ['耗电', 'Power'], ['躁动', 'Agitation'], ['到站', 'Arrival'], ['车费', 'fare'],
];

const exact = new Map([...exactPairs, ...V832_PAIRS, ...V835_PAIRS]);
const phrases = [...V835_PAIRS, ...V832_PAIRS, ...phrasePairs, ...exactPairs].sort((a, b) => b[0].length - a[0].length);

export function translateGameText(value: string, locale: GameLocale): string {
  if (locale === 'zh') return value;
  const normalizePunctuation = (text: string) => text.replaceAll('。', '.').replaceAll('；', ';').replaceAll('，', ',').replaceAll('：', ':');
  if (!/[\u3400-\u9fff]/u.test(value)) return normalizePunctuation(value);
  const leading = value.match(/^\s*/)?.[0] ?? '';
  const trailing = value.match(/\s*$/)?.[0] ?? '';
  const end = trailing.length ? value.length - trailing.length : value.length;
  const core = value.slice(leading.length, end);
  const direct = exact.get(core);
  if (direct) return `${leading}${direct}${trailing}`;
  let translated = value
    .replace(/^(.+?)已购入，花费 (\d+) 金币。$/u, '$1 purchased for $2 coins.')
    .replace(/ · 已购入$/u, ' · Purchased')
    .replace(/^使用应急电池 \+(\d+)电$/u, 'Use Reserve Cell +$1 power')
    .replace(/容量 (\d+) → (\d+)；仍需付费充电/gu, 'Capacity $1 → $2; charging still costs coins')
    .replace(/新乘客到站小费 \+(\d+)/gu, 'New riders: +$1 arrival tip')
    .replace(/充满 (\d+) · (\d+) 金币/gu, 'Fill to $1 · $2 coins')
    .replace(/维修工检修完成：后续(\d+)层运转少耗1电/gu, 'Mechanic repair complete: save 1 motor power for the next $1 floors')
    .replace(/到站 \+(\d+)金币\/人/gu, 'Arrival +$1 coins/person')
    .replace(/本人到站时 \+(\d+)金币\/人/gu, 'Own arrival +$1 coins/person')
    .replace(/低躁动到站 \+(\d+)金币/gu, 'Low-agitation arrival +$1 coins')
    .replace(/中躁动到站 \+(\d+)金币/gu, 'Medium-agitation arrival +$1 coins')
    .replace(/完成：后续(\d+)层运转少耗1电/gu, 'Complete: save 1 motor power for the next $1 floors')
    .replace(/低躁动检修 (\d+)\/(\d+)；完成后(\d+)层运转少耗1电；每人一次/gu, 'Low-agitation work $1/$2; save 1 motor power for $3 future floors on completion; once per rider')
    .replace(/连续低躁动(\d+)层：到站 \+(\d+)金币/gu, '$1 consecutive low-agitation floors: +$2 arrival coins')
    .replace(/累计被照顾(\d+)层：到站 \+(\d+)金币/gu, '$1 cared-for floors: +$2 arrival coins')
    .replace(/累计(\d+)层：到站 \+(\d+)金币/gu, '$1 accumulated floors: +$2 arrival coins')
    .replace(/达标：到站 \+(\d+)金币/gu, 'Complete: +$1 arrival coins')
    .replace(/商店舒缓 −(\d+) 躁动，支付 (\d+) 金币。/gu, 'Shop soothing: −$1 agitation for $2 coins.')
    .replace(/本人到站时 \+(\d+)\/人/gu, 'Own arrival +$1/person')
    .replace(/(.+?)到站时，每位仍相邻的协作对象额外赚 (\d+) 金币。/gu, '$1 arrival: each cooperation partner still adjacent earns $2 extra coins.')
    .replace(/契约生效：(.+?)协作到站，额外躁动 −(\d+)。/gu, 'Pact active: $1 cooperative arrival reduces agitation by $2.')
    .replace(/倒计时 (\d+) · 未到站归零失败/gu, 'Timer $1 · fails at zero if still aboard')
    .replace(/检修生效 · 余(\d+)层/gu, 'Repair active · $1 floors left')
    .replace(/倒计时 (\d+) · 归零失败/gu, 'Timer $1 · zero ends the run')
    .replace(/已复制 (\d+) 项/gu, 'Copied $1 fields')
    .replace(/到站 \+(\d+)\/邻座/gu, 'Arrival +$1/neighbor')
    .replace(/到站 −(\d+)躁动/gu, 'Arrival −$1 agitation')
    .replace(/本人到站时 \+(\d+)\/邻座/gu, 'Own arrival +$1/neighbor')
    .replace(/本人到站时 −(\d+)躁动/gu, 'Own arrival −$1 agitation')
    .replace(/本人到站 \+(\d+)\/人/gu, 'Own arrival +$1/person')
    .replace(/本人到站 −(\d+)\/人/gu, 'Own arrival −$1/person')
    .replace(/距商店 (\d+) 层/gu, 'Shop in $1 floors')
    .replace(/查看已装升级，共 (\d+) 次/gu, 'View installed upgrades: $1')
    .replace(/任何邻座 ×(\d+) · 到站\+(\d+)币/gu, 'Any neighbor ×$1 · +$2 arrival coins')
    .replace(/任何邻座 ×(\d+) · \+(\d+)币\/层/gu, 'Any neighbor ×$1 · +$2 coins/floor')
    .replace(/每邻(.+?)：每层 \+(\d+) 躁动/gu, 'Each adjacent $1: +$2 agitation/floor')
    .replace(/(\d+)号位/gu, '$1 position')
    .replace(/每邻(.+?)：偶数层 \+(\d+) 躁动/gu, 'Each adjacent $1: +$2 agitation on even floors')
    .replace(/2\+邻座：偶数层 \+(\d+)/gu, '2+ neighbors: +$1 agitation on even floors')
    .replace(/总耗电>(\d+)：偶数层 \+(\d+)/gu, 'Total power >$1: +$2 agitation on even floors')
    .replace(/每站25%概率 \+(\d+)/gu, '25% chance/floor: +$1 agitation')
    .replace(/邻(.+?)：🔥 每层 \+1 躁动/gu, 'Adjacent $1: 🔥 +1 agitation/floor')
    .replace(/邻(.+?)：⚡ 每层额外耗 1 电/gu, 'Adjacent $1: ⚡ +1 extra power/floor')
    .replace(/邻(.+?)：🪙 每层损失 2 金币/gu, 'Adjacent $1: 🪙 lose 2 coins/floor')
    .replace(/邻(.+?)：⚡ 两人耗电 ×2；🪙 两人到站车费 ×2/gu, 'Adjacent $1: ⚡ both riders power x2; 🪙 both arrival fares x2')
    .replace(/邻(.+?)：⚡ 两人耗电 ×2/gu, 'Adjacent $1: ⚡ both riders power x2')
    .replace(/旁边有(.+?)：🔥 每层 \+1 躁动/gu, 'Adjacent $1: 🔥 +1 agitation/floor')
    .replace(/旁边有(.+?)：⚡ 每层额外耗 1 电/gu, 'Adjacent $1: ⚡ +1 extra power/floor')
    .replace(/旁边有(.+?)：🪙 每层损失 2 金币/gu, 'Adjacent $1: 🪙 lose 2 coins/floor')
    .replace(/旁边有(.+?)：⚡ 两人耗电 ×2；🪙 两人到站车费 ×2/gu, 'Adjacent $1: ⚡ both riders power x2; 🪙 both arrival fares x2')
    .replace(/旁边有(.+?)：⚡ 两人耗电 ×2/gu, 'Adjacent $1: ⚡ both riders power x2')
    .replace(/偶数层 \+(\d+)/gu, 'Even floors: +$1 agitation')
    .replace(/炸弹倒计时 (\d+) 层：每上升一层 −1；到站前归零则失败/gu, 'Bomb timer $1 floors: −1 each floor; reaching zero before arrival ends the run')
    .replace(/复制(.+?)的耗电/gu, 'Copies $1 power')
    .replace(/复制(.+?)的金钱/gu, 'Copies $1 fare')
    .replace(/复制(.+?)的躁动\/关系/gu, 'Copies $1 agitation/links');
  for (const [source, target] of phrases) translated = translated.replaceAll(source, target);
  return normalizePunctuation(translated);
}

const translatedProps = ['aria-label', 'title', 'placeholder'] as const;

export function localizeTree(node: ReactNode, locale: GameLocale): ReactNode {
  if (locale === 'zh' || node === null || node === undefined || typeof node === 'boolean' || typeof node === 'number') return node;
  if (typeof node === 'string') return translateGameText(node, locale);
  if (Array.isArray(node)) return node.map((child) => localizeTree(child, locale));
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<Record<string, unknown>>;
  if (element.props['data-no-translate']) return element;
  const nextProps: Record<string, unknown> = {};
  for (const prop of translatedProps) {
    const value = element.props[prop];
    if (typeof value === 'string') nextProps[prop] = translateGameText(value, locale);
  }
  if ('children' in element.props) nextProps.children = Children.map(element.props.children as ReactNode, (child) => localizeTree(child, locale));
  return cloneElement(element, nextProps);
}

export const I18N_CORE_SAMPLES = exactPairs.map(([source]) => source);
