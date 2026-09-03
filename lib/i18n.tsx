import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

export type GameLocale = 'en' | 'zh';

const exactPairs: Array<[string, string]> = [
  // Passenger names.
  ['通勤者', 'Commuter'], ['游客', 'Tourist'], ['快递员', 'Courier'], ['维修工', 'Mechanic'],
  ['恋人', 'Lover'], ['音乐家', 'Musician'], ['小偷', 'Thief'], ['警察', 'Officer'],
  ['律师', 'Lawyer'], ['醉汉', 'Drunk'], ['护士', 'Nurse'], ['儿童', 'Child'],
  ['幽灵', 'Ghost'], ['驱魔师', 'Exorcist'], ['教练', 'Coach'], ['名人', 'Celebrity'],
  ['检查员', 'Inspector'], ['炸弹客', 'Bomb Carrier'], ['神秘人', 'Mystery'], ['百变人', 'Shifter'], ['复制人', 'Mimic'],

  // Passenger summaries and rules.
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
  ['每位维修工每层抵消2点人物耗电，多位逐个叠加。维修工本人耗1电；节能总量最多抵完本层人物耗电，不能抵消电梯运转的1电，也不会倒充电。', 'Each Mechanic cancels 2 passenger power per floor, and multiple Mechanics stack. A Mechanic consumes 1 power. Savings can cancel passenger use only, never the elevator’s 1-power motor cost, and cannot generate power.'],
  ['每位维修工每层节能2电，多位逐个叠加。', 'Each Mechanic saves 2 passenger power per floor. Multiple Mechanics stack.'],
  ['维修工、受控幽灵和节能线路逐项相加；总节能最多抵完人物耗电，不能抵运转1电。', 'Mechanics, controlled Ghosts, and Eco Circuit stack. Savings can cancel passenger use, but never the 1-power motor cost.'],
  ['每位邻座恋人：每站+1币，到站基价+100%', 'Each adjacent Lover: +1 coin/floor, +100% base fare'],
  ['无恋人邻座：每站25%呼唤恋人', 'No adjacent Lover: 25% chance per floor to call another Lover'],
  ['每位恋人邻座：本人每层 +1 金币，到站基础车费 +100%；多位逐个叠加。', 'Each adjacent Lover grants this rider +1 coin per floor and +100% base arrival fare. Multiple Lovers stack.'],
  ['每位邻座恋人：每站+1币，到站基价+100%；多位逐个叠加。', 'Each adjacent Lover grants +1 coin per floor and +100% base fare. Multiple Lovers stack.'],
  ['没有恋人邻座：每层有 25% 概率呼唤另一位恋人候客。', 'With no adjacent Lover: 25% chance each floor to call another Lover into the next queue.'],
  ['车内 ≥4人：每层躁动 −1', '4+ riders: −1 agitation/floor'],
  ['车内至少 4 人：每层躁动 −1。', 'With at least 4 riders: −1 agitation each floor.'],
  ['安抚相邻的醉汉和儿童，阻止其负面效果。', 'Calms adjacent Drunks and Children, preventing their negative effects.'],
  ['未控制 +3 金币/层 · 偶数层 +1 躁动', 'Uncontrolled: +3 coins/floor · +1 agitation on even floors'],
  ['没有警察或律师邻座：每层 +3 金币，偶数层躁动 +1。', 'Without an adjacent Officer or Lawyer: +3 coins per floor and +1 agitation on even floors.'],
  ['有警察或律师邻座：改为每层 +1 金币，不再加压，到站车费 +5。', 'With an adjacent Officer or Lawyer: +1 coin per floor, no theft agitation, and +5 arrival fare.'],
  ['控制小偷，延缓炸弹', 'Controls Thieves and slows bombs'],
  ['控制相邻的小偷，消除其加压效果。', 'Controls adjacent Thieves and removes their agitation effect.'],
  ['与炸弹客相邻：偶数层暂停引信倒计时。', 'Adjacent Bomb Carrier: the fuse does not tick down on even floors.'],
  ['控制小偷，每站耗1电', 'Controls Thieves; consumes 1 power/floor'],
  ['控制相邻的小偷，消除其加压效果。不能暂停炸弹引信。', 'Controls adjacent Thieves and removes their agitation. Cannot pause a bomb fuse.'],
  ['未安抚每层 25% 闹事 · 躁动 +2', 'Uncalmed: 25% chance/floor to cause +2 agitation'],
  ['没有音乐家或护士邻座：每层 25% 概率闹事，躁动 +2，并随机与邻座换位。', 'Without an adjacent Musician or Nurse: 25% chance each floor to cause +2 agitation and swap with a random neighbor.'],
  ['有音乐家或护士邻座：不再闹事，每层 +1 金币。', 'With an adjacent Musician or Nurse: no incidents and +1 coin per floor.'],
  ['每逢偶数层：躁动 −1', 'Even floors: −1 agitation'],
  ['每逢偶数层，躁动 −1。', 'On every even floor: −1 agitation.'],
  ['无照顾者：偶数层躁动 +1', 'Unattended: +1 agitation on even floors'],
  ['没有恋人、音乐家或护士邻座：偶数层躁动 +1。', 'Without an adjacent Lover, Musician, or Nurse: +1 agitation on even floors.'],
  ['与其中任一角色相邻，即可阻止这项躁动。', 'Adjacency to any of those roles prevents this agitation.'],
  ['不耗电，但会延误邻座', 'Uses no power, but delays neighbors'],
  ['没有驱魔师邻座：抵达 3、6、9… 层时，随机让一名邻座的目的地延后 1 层。', 'Without an adjacent Exorcist: on floors 3, 6, 9… delay one random neighbor by 1 floor.'],
  ['有驱魔师邻座：不再延误邻座；每位受控幽灵每层节能1电，到站车费 +6。', 'With an adjacent Exorcist: no delays; each controlled Ghost saves 1 power per floor and gains +6 arrival fare.'],
  ['每位受控幽灵每站节能1电', 'Each controlled Ghost saves 1 power/floor'],
  ['每位相邻幽灵分别受控：阻止延误、每层节能1电，幽灵到站车费 +6。', 'Each adjacent Ghost is controlled: no delay, saves 1 power per floor, and gains +6 arrival fare.'],
  ['每位邻座教练使车费+50%', 'Each adjacent Coach adds +50% base fare'],
  ['非教练邻座到站时：每位相邻教练使基础车费 +50%，线性叠加。', 'When a non-Coach neighbor arrives, each adjacent Coach adds +50% base fare. Bonuses stack linearly.'],
  ['本人到站时，每位仍在身旁的邻座使车费 +3。', 'When the Coach arrives, each remaining neighbor adds +3 coins.'],
  ['恰好 1 邻座 +3 金币/层 · 2+ 邻座会加压', 'Exactly 1 neighbor: +3 coins/floor · 2+ causes agitation'],
  ['恰好 1 位邻座：每层 +3 金币。', 'Exactly 1 neighbor: +3 coins per floor.'],
  ['至少 2 位邻座：偶数层躁动 +1。没有邻座则无额外效果。', 'At least 2 neighbors: +1 agitation on even floors. No neighbor gives no extra effect.'],
  ['偶数层：总耗电≤4则+1币，超过则躁动+1', 'Even floors: total power ≤4 gives +1 coin; otherwise +1 agitation'],
  ['总耗电＝电梯运转＋所有人物耗电−节能。包括检查员本人；稳压模块和节能可帮助通过检查。', 'Total power = motor + all rider power − savings. The Inspector is included; Stabilizer and savings help pass inspection.'],
  ['引信归零则本局立即结束', 'Fuse reaches zero: the run ends immediately'],
  ['引信每层减少 1 格；到站前归零，本局立即结束。到站当层归零则安全。', 'The fuse drops by 1 each floor. Reaching zero before arrival ends the run; reaching zero on the arrival floor is safe.'],
  ['有警察邻座：偶数层暂停倒计时。', 'With an adjacent Officer: the fuse pauses on even floors.'],
  ['参数与关系随机 · 到站才揭晓车费', 'Random stats and links · fare revealed on arrival'],
  ['耗电、自身躁动、路程及协作/冲突对象每次出现时随机。', 'Power, personal agitation, trip length, and cooperation/conflict targets are randomized each appearance.'],
  ['车费已封存，到站才揭晓；请离不结算隐藏车费。', 'Fare is sealed until arrival. Dismissing the rider does not reveal or pay it.'],
  ['每到一层换属性 · 高额车费', 'Stats change every floor · high fare'],
  ['每到一层重新抽取耗电（1–2）、自身躁动（0–1）、车费（28–48）和联动偏好。', 'Every floor rerolls power (1–2), personal agitation (0–1), fare (28–48), and link preferences.'],
  ['目的地不延长。开门后先看新数值，再决定去留。', 'The destination does not move. Check the new stats when the doors open, then decide whether to keep the rider.'],
  ['每位邻座复制一项 · 随邻座改变', 'Copies one stat per neighbor · changes with neighbors'],
  ['每位邻座复制一项：耗电、车费或躁动（含联动偏好），最多三项且不重复。', 'Copies one field from each neighbor: power, fare, or agitation (including link preferences), up to three unique fields.'],
  ['同一邻座组合不会重抽；邻座属性变化会同步。隐藏车费不会提前公开。', 'The same neighbor set does not reroll. Changes to neighbor stats update the copy. Hidden fares remain hidden.'],
  ['不复制技能、引信、路程；复制人互相连接时只取各自本体属性，避免递归。', 'Does not copy abilities, fuse, or trip length. Linked Mimics use base stats to prevent recursion.'],

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
  ['控制相邻小偷。与炸弹相邻时，炸弹每两层暂停一次倒计时。', 'Controls adjacent Thieves. An adjacent Bomb Carrier pauses its fuse on even floors.'],
  ['控制相邻小偷，并让其抵达时获得额外车费；不能延缓炸弹。', 'Controls adjacent Thieves and grants them an arrival-fare bonus. Cannot slow bombs.'],
  ['高额底价补偿风险。被音乐家或护士安抚时每层再赚1金币；否则有25%概率增加2躁动并随机换位。', 'A high base fare offsets the risk. When calmed by a Musician or Nurse, earns 1 coin each floor; otherwise has a 25% chance to add 2 agitation and swap positions.'],
  ['每逢偶数层降低1点躁动，并安抚相邻的醉汉与儿童。', 'Reduces agitation by 1 on every even floor and calms adjacent Drunks and Children.'],
  ['没有恋人、音乐家或护士相邻时，每逢偶数层躁动+1；有任意照顾者相邻时免除。', 'Without an adjacent Lover, Musician, or Nurse, adds 1 agitation on even floors. Any adjacent caregiver prevents it.'],
  ['相邻驱魔师时，不再延误邻座，每位受控幽灵每层抵消1点人物耗电且到站多得6金币；否则到3的倍数层时随机延误一位邻座1站。所有节能逐项相加，但电梯运转仍至少耗1电。', 'Next to an Exorcist, stops delaying neighbors, saves 1 passenger power each floor, and gains 6 arrival coins. Otherwise, on floors divisible by 3, delays one random neighbor by 1 floor. Savings stack, but the motor still costs at least 1 power.'],
  ['控制每位相邻幽灵，分别阻止延误并使其每层抵消1点人物耗电、到站多得6金币。多位幽灵的效果逐个叠加；电梯运转仍至少耗1电。', 'Controls every adjacent Ghost, preventing delays while each saves 1 passenger power per floor and gains 6 arrival coins. Multiple Ghosts stack; the motor still costs at least 1 power.'],
  ['非教练乘客抵达时，每位相邻教练都让其基础车费提高50%，线性叠加，小费不参与倍率；教练自己抵达时，每名仍在身旁的邻座额外支付3金币。', 'When a non-Coach rider arrives, each adjacent Coach adds 50% to base fare; bonuses stack linearly and do not multiply tips. When the Coach arrives, each remaining neighbor adds 3 coins.'],
  ['恰好一名邻座时每层赚3金币；两名以上邻座时只在偶数层增加1躁动。', 'With exactly one neighbor, earns 3 coins each floor. With two or more, adds 1 agitation on even floors instead.'],
  ['偶数层检查整趟耗电：运转＋所有人物耗电−节能，总计不超过4电时奖励1金币，否则躁动+1。检查员本人也耗1电；稳压和节能能帮助通过检查。', 'On even floors, checks total power: motor + all riders − savings. At 4 or less, earn 1 coin; otherwise add 1 agitation. The Inspector consumes 1 power and savings can help pass.'],
  ['高额悬赏补偿整局失败风险。上车时获得3–6格引信；到站前归零会结束本局，警察可让倒计时每两层暂停一次。', 'A high reward offsets run-ending risk. The fuse starts at 3–6; reaching zero before arrival ends the run. An adjacent Officer pauses it on even floors.'],
  ['每次出现随机人物耗电、自身躁动、路程与协作/冲突对象。车费在生成时封存，到站才揭晓；请离赔偿不透露隐藏车费。', 'Each appearance randomizes power, personal agitation, trip length, and cooperation/conflict targets. Fare is sealed until arrival; dismissal does not reveal it.'],
  ['每到一层重新抽取人物耗电、自身躁动、车费与协作/冲突关系；开门后先看新状态再决定去留。目的地不延长；耗电和躁动会随新属性立即变化。', 'Every floor rerolls power, personal agitation, fare, and cooperation/conflict targets. Review the new state before deciding whether to keep the rider. The destination never extends.'],
  ['随机分配人物耗电、车费、躁动（含联动偏好）三类属性，每位邻座复制一项，最多三项且不重复。相同邻座组合不会重新抽签；复制人的来源取本体，避免递归。隐藏车费仍然隐藏。不复制技能、引信或路程。', 'Randomly copies power, fare, or agitation/link preference from each neighbor, up to three unique fields. The same neighbor set does not reroll; Mimics use base values to avoid recursion. Hidden fares stay hidden. Abilities, fuse, and trip length are never copied.'],
  ['风险交易', 'Risk trade'], ['条件风险', 'Conditional risk'], ['致命风险', 'Run-ending risk'],
  ['警察 / 律师邻座可控', 'Control with an adjacent Officer / Lawyer'], ['音乐家 / 护士邻座可安抚', 'Calm with an adjacent Musician / Nurse'],
  ['保持恰好 1 名邻座', 'Keep exactly 1 neighbor'], ['偶数层总耗电尽量不超过4', 'Keep total power at 4 or less on even floors'],
  ['警察邻座可延缓引信', 'An adjacent Officer slows the fuse'], ['查看这一次的协作与冲突对象', 'Check this appearance’s cooperation and conflict targets'],
  ['每层查看新状态，留好请离赔偿', 'Review the new state each floor and reserve dismissal compensation'],
  ['每逢偶数层：本次总耗电不超过4，金币 +1；超过则躁动 +1。', 'On even floors: total power at 4 or less grants +1 coin; above 4 adds +1 agitation.'],

  // Core UI and help.
  ['请竖屏游玩', 'Please rotate to portrait'],
  ['这个横屏尺寸太矮，转回竖屏即可继续；本班进度保留。', 'This landscape viewport is too short. Rotate back to portrait to continue; your run is preserved.'],
  ['乘客档案', 'Passenger Archive'], ['玩法说明', 'How to Play'], ['关闭声音', 'Mute sound'], ['打开声音', 'Enable sound'],
  ['午夜启程', 'Midnight Departure'], ['无尽班次', 'Endless Shift'], ['电量', 'Power'], ['躁动', 'Agitation'], ['余额', 'Balance'],
  ['本次变化明细', 'Decision details'], ['电梯座舱', 'Elevator cabin'], ['绿实线协作 · 红虚线冲突', 'Solid green: cooperation · dashed red: conflict'],
  ['门已开启。把候选人物直接拖进指定站位。', 'Doors open. Drag a candidate directly into a position.'],
  ['拖拽人物安排站位 · 有效组合会亮起', 'Drag riders into position · valid links will glow'],
  ['谁要上楼？', 'Who is going up?'], ['送达后领取基础奖励 · 途中收益与人物联动另算', 'Collect the base fare on arrival · floor income and links resolve separately'],
  ['关门上行', 'Close Doors & Ascend'], ['正在上行', 'Ascending'], ['人物/请离', 'Rider / Dismiss'],
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
  ['本班失败', 'Shift Failed'], ['炸弹引信归零', 'Bomb fuse expired'], ['电量耗尽 · 躁动失控', 'Power depleted · agitation out of control'], ['电量耗尽', 'Power depleted'], ['躁动失控', 'Agitation out of control'],
  ['本班抵达', 'Floor reached'], ['无尽纪录', 'Endless record'], ['累计赚取', 'Total earned'], ['本班支出', 'Spent this shift'], ['查看乘客档案', 'View Passenger Archive'],
  ['再开一班 · 挑战更高楼层', 'Start another shift · climb higher'],

  // Runtime status, forecasts, and interactions.
  ['不变', 'no change'], ['本层持平', 'No change this floor'], ['收支抵消', 'offset'], ['上限', 'cap'], ['下一站', 'Next floor'], ['下一层', 'Next floor'], ['本层', 'This floor'],
  ['空驶', 'Empty-car'], ['休整', 'rest'], ['开始', 'begins'],
  ['宽松 −1 · 休整 3→2，免疲劳', 'Uncrowded −1 · rest 3→2, fatigue avoided'],
  ['自身躁动', 'personal agitation'], ['邻座冲突', 'neighbor conflict'], ['已配对', 'Paired'], ['正在呼唤同伴', 'Calling a partner'],
  ['已受控制', 'Controlled'], ['未受控制', 'Uncontrolled'], ['正在控制', 'Controlling'], ['已被安抚', 'Calmed'], ['不稳定', 'Unstable'],
  ['有人照顾', 'Cared for'], ['无人照顾', 'Unattended'], ['已被镇压', 'Suppressed'], ['正在作祟', 'Haunting'], ['正在驱魔', 'Exorcising'],
  ['等待邻座', 'Waiting for a neighbor'], ['状态最佳', 'Ideal position'], ['被围住', 'Surrounded'], ['缺少关注', 'Needs attention'], ['正在演奏', 'Performing'], ['正在安抚', 'Calming'],
  ['车费待揭晓', 'Fare hidden'], ['到站金币', 'Arrival fare'], ['每站耗电', 'Power per floor'], ['自身', 'Self'], ['当前不能调整站位', 'Positions cannot be changed now'], ['请选择电梯里的站位', 'Choose a cabin position'], ['已在此处', 'Already here'],
  ['本层旧乘客换位已用', 'Existing-rider move already used this floor'], ['这里已经有人 · 请选空位', 'That position is occupied · choose an open one'],
  ['恋人配对', 'Lovers paired'], ['联动成立', 'Link activated'], ['站位已调整', 'Position changed'], ['乘客已就位', 'Rider placed'],
  ['恋人已配对：每层 +2 金币，到站车费翻倍。', 'Lovers paired: +2 coins per floor; arrival fare doubled.'],
  ['站位已调整 · 本层旧乘客换位已用。', 'Position changed · existing-rider move used for this floor.'], ['站位已调整 · 不消耗旧乘客换位。', 'Position changed · existing-rider move not consumed.'],
  ['已取消安排。', 'Arrangement cancelled.'], ['恋人的呼唤得到了回应。把两人安排在相邻站位。', 'A Lover answered the call. Place the two Lovers next to each other.'],
  ['电梯继续向上，新的面孔正在等候。', 'The elevator climbs on. New faces are waiting.'], ['百变人已变化，关门前查看新属性。', 'The Shifter has changed. Check the new stats before closing the doors.'],
  ['电量耗尽，轿厢停在了楼层之间。', 'Power ran out. The cabin stopped between floors.'], ['躁动突破上限，午夜班次失控。', 'Agitation crossed the limit. The midnight shift collapsed.'],
  ['引信熄灭前没能抵达。午夜班次戛然而止。', 'The Bomb Carrier failed to arrive before the fuse expired. The shift ended abruptly.'],
  ['下一层躁动不变 · 没有已知来源', 'Next floor: no agitation change · no known source'], ['休整用尽，空驶不免疲劳', 'No rests left; an empty car no longer prevents fatigue'],
  ['高躁动：人物引起的正向躁动 ×2', 'High agitation: positive rider agitation ×2'], ['人物正向躁动已按 ×2 计算', 'Positive rider agitation already calculated at ×2'],
  ['电梯运转', 'Elevator motor'], ['稳压模块抵消', 'Stabilizer'], ['节能少耗', 'Power savings'], ['宽松轿厢', 'Uncrowded cabin'], ['班次压力', 'Shift pressure'],
  ['乘客到站舒缓', 'Arrival relief'], ['补给站充电', 'Supply-station charge'], ['请离赔偿', 'Dismissal compensation'], ['电量上限截取', 'Power capped'], ['躁动下限修正', 'Agitation floor adjustment'],

  // Shop.
  ['先维修，再继续上行', 'Repair first, then continue'], ['把这一程收入，投进下一程。', 'Invest this ride in the next one.'], ['紧急维修', 'Emergency repair'], ['补给站', 'Supply Station'],
  ['按需购卡，可买多张，也可离开。', 'Buy as many cards as needed, or leave.'], ['可用金币', 'Available coins'], ['累计收入', 'Total earned'], ['已花费', 'Spent'],
  ['充电 ·', 'Recharge ·'], ['金币买1电', 'coin per power'], ['已达到62电参考线', '62-power reference reached'], ['购买并安装', 'Buy & install'],
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
  [' 号位，', ' position, '], ['号空位', ' empty position'], ['，可联动', ', link available'], ['还剩 ', ''], [' 站', ' floors'], ['引信 ', 'Fuse '],
  ['复制 ', 'Copied '], [' 项', ' fields'], ['激励 ', 'Coaching '], [' 人', ' riders'], ['协作到站 +', 'Linked arrival +'], ['耗电 ', 'Power '], [' · 躁动 +', ' · agitation +'],
  ['查看', 'View '], ['详情', ' details'], ['规则', ' rules'], ['查看第 ', 'View #'], [' 位', ''], ['上车可联动 · ', 'Board to link · '], ['已选', 'Selected '], [' · 点下方空位', ' · choose a position below'],
  ['到站每邻', 'Cooperates with '], ['每条协作连接奖励 ', 'Reward per cooperation link: '], [' 金币', ' coins'], ['，当前 ', '; '], [' 条生效', ' active'], ['；送达减少 ', '; arrival reduces '],
  ['小费（不翻倍）', ' tip (not multiplied)'], ['另有小费 ', 'Extra tip: '], ['到站金币待揭晓', 'Arrival fare hidden'], ['到站金币 ', 'Arrival fare '], ['每站躁动 +', 'Agitation/floor +'], ['自身 +', 'Self +'],
  ['查看选中人物规则', 'Inspect selected rider'], ['选中人物 · ', 'Selected rider · '], [' · 请离', ' · dismiss'],
  ['已选择', 'Selected '], ['，现在点一个空位。', '; now choose an open position.'], ['回到队伍中。', ' returned to the queue.'], ['下车', ' removed'],
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
  ['当前 ', 'Current '], [' · 下段空驶要 ', ' · empty ride to next shop costs '], [' 电，载人另计', ' power, riders extra'], ['补至 ', 'Charge to '], ['需 ', ' costs '], [' 金币，余 ', ' coins; '], [' 可买卡。参考电量不保证续航，接谁会改变耗电。', ' remains for cards. Reference power is not a guarantee; rider choices change consumption.'],
  ['已充满 ', 'Full at '], [' 电', ' power'], ['+10 电 · ', '+10 power · '], ['+1 电 · ', '+1 power · '], ['还差 ', 'Need '], ['，已购入', ', purchased'], ['✓ 已购入', '✓ Purchased'],
  ['确认请离', 'Confirm dismissal'], ['已请离 · 赔偿 ', 'Dismissed · compensation '], ['请离赔偿', 'Dismissal compensation'],
  ['协作：旁边有', 'Cooperation: adjacent to '], ['冲突：旁边有', 'Conflict: adjacent to '], ['每条连接 +', 'Each link +'], ['额外躁动 −', 'Agitation −'], ['另一位', 'another '],
  ['或', ' or '], ['/条', '/link'], ['/站', '/floor'], ['/ 站', '/floor'], ['金币', 'Coins'], ['耗电', 'Power'], ['躁动', 'Agitation'], ['到站', 'Arrival'], ['车费', 'fare'],
];

const exact = new Map(exactPairs);
const phrases = [...phrasePairs, ...exactPairs].sort((a, b) => b[0].length - a[0].length);

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
    .replace(/查看已装升级，共 (\d+) 次/gu, 'View installed upgrades: $1')
    .replace(/每邻(.+?)：偶数层 \+(\d+) 躁动/gu, 'Each adjacent $1: +$2 agitation on even floors');
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
