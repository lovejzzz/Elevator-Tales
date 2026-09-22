import type { ChangelogEntry } from './changelog';

export const V9_ZH: ChangelogEntry = {
  version: '9.0', date: '2026-09-23', title: '传奇、配电箱，和永远不宽裕的夜班',
  summary: '全部 21 位乘客登场，8 位传奇乘客与信物，配电箱和途中补电，商店改为免费选能力；人物卡精简，新增楼区、故事与每日班次。',
  changes: [
    '21 位乘客全部登场：律师 16 层、检查员 21 层（合规印章 +12）、百变人 41 层。通勤者 6（低躁动到站 +3）、恋人 5、幽灵 3（行程 5–10）、教练邻座 +2、维修工检修省电 4 层；复制人固定复制正上方的车费。',
    '8 位传奇乘客：第 1 层偶尔在第 4 张卡位候客，坐到第 10 层商店、不耗电，下车留下永久信物；不载得 10 金币当班补贴。首局结束解锁 4 位，其余 4 位靠成就解锁。',
    '商店：每店免费选 1 项能力，可再花 40 金币加购 1 项，共 6 个安装位，重抽 10 金币。旧乘客每层可换位 2 次（滑轨并入基础）；扩容电池并入配电箱；延时保险取消；留座与改签合并为调度印章（每十层 2 次）。',
    '配电箱：蓄电 / 变压 / 电机三条线路各 3 级，价格 15 / 35 / 60 金币，每店升 1 级，每局最多 5 级。蓄电：上限 75/90/110、进店补电 10/15/20；变压：充电 1.75/1.5/1.25 金币/电；电机：41 层起 −1、31 层起 −1、全程再 −1。',
    '电量：商店充电 2 金币/电；途中补电 4 金币/电，每十层最多 20 电。运转 1（1–10 层）、3（11–30）、4（31–40）、5（41–45），46 层起每 7 层 +1，88 层起 13 封顶。',
    '躁动：6 人坐满每层 +1；低躁动和中躁动时每位到站 +1 小费；高躁动每层 20% 发生事故，一位乘客提前下车不付钱。',
    '能力：安全余量上限 +2、手动 −3 每店补满；隔音门让坏人链接不再产生躁动；绝缘衬层让红线不再额外耗电和扣金币；稳压模块需至少 5 人、每十层最多 5 次；礼宾 +1；小费盒 35%；并联回充 3 电；长途计价器 +4；混乘票 +6；谢幕礼 +8。',
    '新内容：每十层一个楼区（大堂、住宅、医院、夜店、写字楼、酒店、无名层），主题乘客出现概率 ×1.5；29 段乘客故事，首次送达解锁；每日班次（?daily，所有人同一套随机种子）；结算页可复制战绩和本局记录。',
    '界面：人物卡精简为名字、三个数字、一行能力和关系标签；电量栏显示到下个商店约剩多少电；配电箱面板；信物；修复 701–1100 宽度下“本次变化明细”遮挡上行按钮；手机候客同屏显示；开场说明只出现一次。',
  ],
  experiments: [
    '新建流派模拟器 scripts/balance-sim：协作、坏人、灵异节能、安静、热闹、电箱投资、均衡、新手 8 类机器人直接调用正式规则；约 25 轮调参。',
    '最终验收（全新种子 20260923，每类 300 局，共 3900 局）：5 种乘客流派中位 64–69 层（最弱 / 最强 89.9%）；各流派招牌能力为合理购物的 90–96%；95.2% 的局至少两次死里逃生，每 10 层约 2 次险情；进店富裕 7.6%，离店剩余金币中位 10；150 层存活 0%。',
    '能力价值（每项 600 对同种子）：16 项全部为正，+2.9 至 +10 层（v8.38 为 0 至 +31）。传奇（每位 480 对）：+4.9 至 +9.0 层，载上更好的比例 60–70%。',
    '修复：惯性飞轮会与老周重复节能；躁动预测漏算 v9 新来源（4000 次随机转移验证）；约 20 条英文显示旧数值，新增数字一致性检查。',
  ],
  watch: [
    '边缘未达标：最强机器人中位 88 层（目标 ≤ 85）；躁动死亡 19.9%（目标 ≥ 20%）；最弱传奇 +4.9（目标 ≥ +5）。',
    '机器人不是玩家：需要真人试玩，可用结算页“复制本局记录”反馈。',
    '传奇暂用字徽代替画像；旧界面文字仍部分依赖短语翻译。',
  ],
};

export const V9_EN: ChangelogEntry = {
  version: '9.0', date: '2026-09-23', title: 'Legends, the power box, and a shift that never feels rich',
  summary: 'All 21 riders, eight legendary riders with keepsakes, the power box and in-transit charging, and free ability picks. Simpler cards, districts, stories and a daily shift.',
  changes: [
    'All 21 riders: Counsel from 16F, Inspector from 21F (stamp +12), Shifter from 41F. Commuter 6 (+3 calm), Lover 5, Ghost 3 (trips 5–10), Coach neighbors +2, Mechanic repair saves power for 4 floors; the Mimic always copies the fare above.',
    'Eight legends: sometimes waiting as a fourth card on floor 1, riding to the floor-10 shop without power and leaving a permanent keepsake; declining pays a 10-coin allowance. Four unlock after your first shift, four through achievements.',
    'Shops: pick 1 ability free and buy 1 more for 40 coins; 6 slots; reroll for 10. Riders aboard can move twice per floor (Rails folded in); Capacity moved into the power box; Longer Fuse retired; Reservation and Rebooking merged into Dispatch (twice per ten floors).',
    'Power box: Storage / Transformer / Motor, 3 levels each at 15 / 35 / 60 coins, one level per shop, five per run. Storage: cap 75/90/110 and 10/15/20 free power at shops; Transformer: charging 1.75/1.5/1.25; Motor: −1 from 41F, −1 from 31F, a further −1 everywhere.',
    'Power: shop charging 2 coins; in-transit charging 4 coins, up to 20 per ten floors. Motor 1 (1–10F), 3 (11–30), 4 (31–40), 5 (41–45), then +1 every 7 floors from 46F to 13 at 88F.',
    'Agitation: a full cabin of 6 adds 1 per floor; low and medium departures tip +1 per arrival; high departures risk a 20% incident where a rider leaves without paying.',
    'Abilities: Safety Margin cap +2 with a −3 relief refilled at shops; Soundproof stops criminal-link agitation; Insulation removes red-link power and coin costs; Stabilizer needs 5 riders, 5 times per ten floors; Concierge +1; Tip Jar 35%; Relay 3 power; Meter +4; Mixed Ticket +6; Curtain Call +8.',
    'New content: a district every ten floors (Lobby, Residences, Hospital, Nightclub, Offices, Hotel, Nameless Floors) drawing its themed riders at 1.5×; 29 rider stories unlocked on first delivery; a daily shift (?daily, one seed for everyone); copy your result and run record from the end screen.',
    'Interface: cards reduced to name, three numbers, one ability line and relation chips; the power panel shows power expected at the next shop; power box panel; keepsakes; fixed the receipt button covering Ascend at 701–1100px; phones show every candidate at once; the intro appears only once.',
  ],
  experiments: [
    'New archetype simulator scripts/balance-sim: coop, crime, occult, quiet, lively, power-box investor, balanced and novice bots on the production rules; about 25 tuning rounds.',
    'Final acceptance (fresh seeds 20260923, 300 runs per bot, 3,900 runs): five rider styles with medians 64–69 (weakest / strongest 89.9%); each style’s signature abilities reach 90–96% of generic shopping; 95.2% of runs survive at least two close calls, about 2 per ten floors; 7.6% affluent shop visits, median 10 coins left after shopping; 0% alive at 150F.',
    'Ability values (600 paired runs each): all 16 positive, +2.9 to +10 floors (v8.38: 0 to +31). Legends (480 pairs each): +4.9 to +9.0 floors; boarding beats declining in 60–70% of seeds.',
    'Fixes: the flywheel could stack with Old Zhou’s saving; the agitation forecast missed new v9 sources (checked over 4,000 random transitions); about 20 English texts showed old numbers, now guarded by a number-parity check.',
  ],
  watch: [
    'Marginal misses: optimizer median 88 (target ≤ 85); agitation deaths 19.9% (target ≥ 20%); weakest legend +4.9 (target ≥ +5).',
    'Bots are not players: human playtests are needed; use “Copy run record” on the end screen.',
    'Legends use monograms until portraits exist; older interface text still partly relies on phrase translation.',
  ],
};
