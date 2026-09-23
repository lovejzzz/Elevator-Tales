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

export const V901_ZH: ChangelogEntry = {
  version: '9.0.1', date: '2026-09-23', title: '传奇画像',
  summary: '8 位传奇乘客换上正式画像，替代临时字徽。',
  changes: [
    '老周、红娘、教父、护士长、夜莺、灵媒、大亨、13号房客各有一张独立画像（640×640，与现有乘客同一暗绿底、复古写实画风），传奇卡片加金色描边。',
    '规则、数值与平衡不变。',
  ],
  experiments: [
    '画像由图像模型以现有乘客图为风格参考生成，逐张人工检查：无文字、无水印、道具与人物设定一致（红线、怀表、呼叫铃、麦克风、火漆信、13 号钥匙）。',
    '类型检查、npm run verify、构建和浏览器卡片显示检查通过。',
  ],
  watch: [
    '沿用 v9.0 的边缘未达标项与真人试玩需求；旧界面文字仍部分依赖短语翻译。',
  ],
};

export const V901_EN: ChangelogEntry = {
  version: '9.0.1', date: '2026-09-23', title: 'Legend portraits',
  summary: 'The eight legendary riders now have proper portraits instead of placeholder monograms.',
  changes: [
    'Old Zhou, the Matchmaker, the Don, the Matron, the Nightingale, the Medium, the Tycoon and the Stranger in 13 each have their own portrait (640×640, same dark-green backdrop and period realism as the other riders); legend cards get a gold frame.',
    'No rule, value or balance changes.',
  ],
  experiments: [
    'Portraits were generated by an image model using the existing rider sheet as a style reference and checked one by one: no text or watermarks, props match each character (red thread, pocket watch, call bell, microphone, sealed letter, room-13 key).',
    'Type check, npm run verify, build and an in-browser card check pass.',
  ],
  watch: [
    'v9.0 marginal misses and the need for human playtests still stand; older interface text still partly relies on phrase translation.',
  ],
};

export const V902_ZH: ChangelogEntry = {
  version: '9.0.2', date: '2026-09-23', title: '不再带着钱断电；恋人少一点，商店清楚一点',
  summary: '可能断电的一层要按两次上行，并在按钮旁直接给出补电；恋人出现得更少；商店改成三步。',
  changes: [
    '上行保护：下一站最坏情况会断电时，第一次按“关门上行”不出发，按钮上方弹出“补电 +N”和“补足本段”，按钮变为“确认冒险上行”；再按一次才冒险出发。任何改动（上客、换位、补电）都会取消确认。',
    '补电提示移到上行按钮旁：两层内会断电时，桌面端在按钮上方显示补电按钮（手机端只在当层可能断电时显示）。',
    '恋人：恋人候客的同行者从“必定另一位恋人”改为恋人 / 游客 / 儿童三选一；独处恋人的呼唤概率 25% → 15%（红娘 50%、红绳 35% 不变）；住宅层（11–20 层）主题乘客从恋人、儿童改为儿童、维修工。11–20 层恋人占候客比例约 17–21% → 10–13%，21 层以后约 10–13%。',
    '商店改为三步：① 选 1 项能力（免费，之后可 40 金币加购），② 配电箱升 1 级，③ 充电。移除重复说明、英文小标题和通用的“本局限装一次”提示；桌面端一屏放下，不再滚动。',
    '商店充电区显示下一段需要多少电：例如“11–20 层约需 80 电（运转 30＋乘客约 50）· 还差 20，途中要补电”。',
    '应急电池（20 金币补 8 电）从商店下架，由途中补电取代；已有规则不变。',
  ],
  experiments: [
    '起因：真人试玩记录，14 层电量 8、需要 9，钱包 87 金币，没有使用途中补电而断电；补电按钮只在左侧电量栏。',
    '恋人比例：每档 20000 组候客抽样（有无独处恋人两种车厢）。',
    '平衡验收（同一套种子 20260923，每类 300 局，共 3900 局）：五种乘客流派最弱 / 最强 91.3%（v9.0 为 89.9%），协作流派中位 67 层不变；躁动死亡 23.1%（v9.0 为 19.9%，现达标）；均衡型中位 86 层（v9.0 为 88，目标 ≤ 85）；95.3% 的局至少两次死里逃生；进店富裕 9.1%；离店剩余金币中位 11。模拟器机器人本来就会途中补电，上行保护不改变这些数字。',
    'verify 新增：试玩中的致命楼层必须触发保护且补电后解除；上行按钮必须经过保护判断；下一段需电量；恋人同行者、呼唤概率和 11–20 层比例上限。',
  ],
  watch: [
    '均衡型中位 86 层，仍略高于目标 85。',
    '手机端能力卡说明仍较长；看试玩反馈再决定是否写短版说明。',
  ],
};

export const V902_EN: ChangelogEntry = {
  version: '9.0.2', date: '2026-09-23', title: 'No more dying with coins in your pocket; fewer Lovers, a clearer shop',
  summary: 'A floor that can run you out of power now takes two presses to ascend, with charging offered right beside the button. Fewer Lovers; a three-step shop.',
  changes: [
    'Ascend guard: when the worst case for the next floor runs out of power, the first press of Ascend does not leave. “Charge +N” and “Top up sector” appear above the button, which turns into “Confirm risky ascent”; a second press departs. Any change (boarding, moving, charging) cancels the confirmation.',
    'Charging moves next to Ascend: when power runs out within two floors, desktop shows the charge buttons above Ascend (phones only when this floor can run out).',
    'Lovers: a Lover card now brings a Lover, Tourist or Child instead of always another Lover; a lone Lover’s call drops from 25% to 15% (Matchmaker 50% and Red String 35% unchanged); the Residences (11–20F) now feature Children and Mechanics instead of Lovers and Children. Lover share of offers on 11–20F falls from about 17–21% to 10–13%, and to about 10–13% above 20F.',
    'The shop is three steps: ① pick 1 ability (free, then 40 coins for one more), ② upgrade the power box 1 level, ③ charge. Repeated explanations, English sub-labels and the generic once-per-run note are gone; desktop fits on one screen without scrolling.',
    'The charging step shows the next sector’s need, e.g. “Floors 11–20: about 80 power (motor 30 + riders ~50) · 20 short: charge on the way”.',
    'The Reserve Cell (20 coins for 8 power) is retired from the shop in favour of in-transit charging; no rule values change.',
  ],
  experiments: [
    'Trigger: a human playtest record died on 14F with 8 power, 9 needed and 87 coins, never using in-transit charging, whose buttons lived only in the left power panel.',
    'Lover share: 20,000 offer packets per floor band, with and without a lone Lover aboard.',
    'Balance acceptance (same seeds 20260923, 300 runs per bot, 3,900 runs): rider styles weakest / strongest 91.3% (v9.0: 89.9%), coop median unchanged at 67; agitation deaths 23.1% (v9.0: 19.9%, now within target); optimizer median 86 (v9.0: 88, target ≤ 85); 95.3% of runs survive at least two close calls; 9.1% affluent shops; median 11 coins left after shopping. Bots already charged in transit, so the guard does not change these numbers.',
    'New verify checks: the playtest’s fatal floor must arm the guard and clear after charging; Ascend must pass through the guard; next-sector need; Lover partners, call chance and an 11–20F share cap.',
  ],
  watch: [
    'Optimizer median 86, still just above the 85 target.',
    'Ability descriptions remain long on phones; shorter versions depend on playtest feedback.',
  ],
};
