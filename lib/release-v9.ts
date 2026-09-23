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

export const V903_ZH: ChangelogEntry = {
  version: '9.0.3', date: '2026-09-23', title: '商店物品有了样子；绝缘衬层变成真正的选择',
  summary: '16 项能力和配电箱三条线路各有一张实物画像；绝缘衬层新增冲突小费；模拟器新增三种流派用于探索。',
  changes: [
    '商店图标：每项能力一个实物（服务铃、小费罐、飞轮、计价器、隔音门、打孔票……），配电箱三条线路分别是蓄电瓶、变压器和曳引机；本局能力清单也显示图标，未安装的为灰色。',
    '绝缘衬层：除原有效果外，每条红线每层付 1 金币“冲突小费”，每层最多 3。',
  ],
  experiments: [
    '能力价值（每项 600 对同种子，6 类机器人）：调整前 16 项为 +2.7 至 +8.1 层，绝缘衬层最低（+2.7）。冲突小费每条 1 金币：绝缘衬层 +5.6，居中；每条 2 金币（上限 4）为 +9.0，成为最强，未采用。',
    '新增三种探索流派（npm run balance:explore，每类 300 局）：快进快出（快递员、通勤者、维修工 + 谢幕礼、单站检票器、快速电梯）中位 64 层；豪赌（神秘人、百变人、复制人、炸弹客 + 绝缘衬层、长途计价器）65 → 67 层；混搭（三类乘客 + 混乘票、绝缘衬层、隔音门）59 → 60 层。原五种流派 57–64 层，全部在同一区间。',
    '平衡验收（3900 局）与 v9.0.2 相同：流派 91.3%、躁动死亡 23.1%、均衡型中位 86。验收机器人会避开红线，所以冲突小费不改变这些数字。',
    '图标由图像模型以传奇画像为色调参考生成，逐张检查无文字；两张透明底图已合成到同一深绿底。',
  ],
  watch: [
    '均衡型中位 86 层，仍略高于目标 85。',
    '所有带流派偏好的机器人都比“只看数值”的均衡型少约 20 层：说明坚持流派有代价，需要看真人试玩是否也这样感觉。',
  ],
};

export const V903_EN: ChangelogEntry = {
  version: '9.0.3', date: '2026-09-23', title: 'Shop items get a face; Insulation becomes a real choice',
  summary: 'Each of the 16 abilities and 3 power-box lines has a painted object icon; Insulation adds a friction tip; three new simulator styles explore other builds.',
  changes: [
    'Shop icons: one object per ability (service bell, tip jar, flywheel, fare meter, padded door, punch card…), and a battery crate, transformer and hoist motor for the power box; the ability list shows them too, greyed out when not installed.',
    'Insulation: in addition to its old effect, each red link pays a 1-coin “friction tip” per floor, at most 3.',
  ],
  experiments: [
    'Ability values (600 paired runs each, 6 bots): before the change all 16 were +2.7 to +8.1 floors, Insulation lowest (+2.7). A 1-coin friction tip lifts it to +5.6, mid-pack; 2 coins (cap 4) gives +9.0, the strongest, and was not used.',
    'Three new exploratory styles (npm run balance:explore, 300 runs each): Tempo (Couriers, Commuters, Mechanics + Curtain Call, Single Arrival, Express) median 64; Gamble (Mystery, Shifter, Mimic, Bomb + Insulation, Meter) 65 → 67; Mixed (all three categories + Mixed Ticket, Insulation, Soundproof) 59 → 60. The original five styles sit at 57–64, all in one band.',
    'Acceptance (3,900 runs) unchanged from v9.0.2: styles 91.3%, agitation deaths 23.1%, optimizer median 86. Acceptance bots avoid red links, so the friction tip does not move these numbers.',
    'Icons were generated by an image model using a legend portrait as the palette reference and checked one by one for text; two transparent images were composited onto the same dark green.',
  ],
  watch: [
    'Optimizer median 86, still just above the 85 target.',
    'Every style-committed bot reaches about 20 floors less than the numbers-only optimizer: sticking to a style has a cost; playtests should show whether it feels that way to people.',
  ],
};

export const V904_ZH: ChangelogEntry = {
  version: '9.0.4', date: '2026-09-23', title: '每个楼区一种灯光，电梯开始有动作',
  summary: '七个楼区各有自己的灯光和楼层数字颜色；上行时车厢按躁动抖动，电量告急时灯会闪；到站金币飞进钱包。',
  changes: [
    '楼区灯光：大堂黄铜、住宅玫瑰、医院冷青、夜店紫、写字楼日光灯绿、酒店红丝绒、无名层褪色灰；进入新楼区时颜色渐变，楼层数字跟着换色。',
    '上行抖动：车厢在运行时轻微晃动，躁动越高晃得越厉害（0.6–3.2 像素）。',
    '电量告急：下一站后最坏只剩 6 电以内时车厢灯偶尔闪烁；这一层可能断电时闪得更快，楼层数字也跟着闪。',
    '到站金币：每位到站乘客按车费飞出 2–6 枚金币落进钱包。',
    '动作细节：楼层数字像机械翻牌一样滚上来；新连上的绿线从一端画到另一端；车厢里的人物轻微呼吸。',
    '系统设置了“减少动态效果”时，以上动画全部关闭，只保留颜色变化。',
    '商店图标改为背景图渲染（与人物画像一致），修复 v9.0.3 引入的 3 条 lint 错误。',
  ],
  experiments: [
    '浏览器检查：七个楼区截图对比（住宅层初版与大堂太像，改为玫瑰色）；第 3–8 层连续上行，到站时出现 3 枚飞行金币且动画结束后全部清除。',
    '美术方向：生成同一组三位乘客、电梯厢和商店物品的两种候选风格（Art Deco 海报、黑色墨线漫画），与现状写实风格并排对比，等待选择；本版不替换人物画像。',
    '规则与数值不变；verify、类型检查和构建通过。',
  ],
  watch: [
    '人物画风待定；选定后统一重画约 50 张图。',
    '仪表化界面（电量做成电压表指针、金币做成收银机）等画风定下再做。',
  ],
};

export const V904_EN: ChangelogEntry = {
  version: '9.0.4', date: '2026-09-23', title: 'A light for every district, and a lift that moves',
  summary: 'Each of the seven districts has its own light and floor-number colour; the cabin shakes with agitation as it climbs, the lights flicker when power runs low, and arrival coins fly into the wallet.',
  changes: [
    'District light: brass Lobby, rose Residences, cold teal Hospital, violet Nightclub, fluorescent-green Offices, red-velvet Hotel, faded grey Nameless Floors; colours cross-fade on entering a district and the floor number follows.',
    'Ascent shake: the cabin trembles while moving, more as agitation rises (0.6–3.2 px).',
    'Low power: when the worst case leaves 6 power or less after the next floor, the lights flicker now and then; when this floor can run you out, they flicker faster and the floor number with them.',
    'Arrival coins: each arriving rider sends 2–6 coins, by fare, flying into the wallet.',
    'Details: the floor number rolls up like a mechanical counter; new green links draw from end to end; riders in the cabin breathe slightly.',
    'With “reduce motion” enabled all of the above animation is off; only the colours change.',
    'Shop icons now render as background images like the portraits, fixing 3 lint errors introduced in v9.0.3.',
  ],
  experiments: [
    'Browser checks: screenshots of all seven districts (the first Residences tint was too close to the Lobby and became rose); ascents from 3F to 8F showed 3 flying coins on arrival, all removed when finished.',
    'Art direction: the same three riders, cabin and shop item were generated in two candidate styles (Art Deco poster, noir ink graphic novel) and compared side by side with the current realism; awaiting a choice, no portraits replaced in this version.',
    'No rule or value changes; verify, type check and build pass.',
  ],
  watch: [
    'Character style to be chosen; about 50 images to redraw once it is.',
    'Diegetic gauges (a voltmeter needle for power, a cash register for coins) wait for the style decision.',
  ],
};

export const V91_ZH: ChangelogEntry = {
  version: '9.1', date: '2026-09-23', title: 'Art Deco 海报画风',
  summary: '全部人物、传奇、商店物品和电梯厢换成 1930 年代 Art Deco 旅行海报风格；小尺寸下更容易认出每个人。',
  changes: [
    '画风：平涂色块、清晰剪影、深瓶绿底、黄铜与奶油色，每个人物一个点缀色；每人保留原来的标志道具（通勤者的报纸、快递员的包裹、小偷的怀表、护士的白帽……）。',
    '21 位乘客、8 位传奇（背后金色放射纹）、16 项能力和配电箱三条线路的图标、电梯厢背景全部重画，共 49 张。',
    '电梯厢保持原构图（中间开门、地面六个站位圆），调暗以让人物在前。',
    '每位人物改为单独图片，不再从六宫格大图里裁切；美术资源从约 16 MB 减到约 1.3 MB，首屏加载更快。',
    '修复 v9.0.4 的问题：车厢人物的“呼吸”动画覆盖了居中定位，导致座位画像偏移、只露出一部分。',
  ],
  experiments: [
    '风格选择：同一组三位乘客、电梯厢和商店物品画成三种风格，在 40 px 与 80 px 实际尺寸下对比后选定 Art Deco 海报。',
    '生成：图像模型以选定风格的样图为参考，逐张检查画风一致、无文字、道具与人物设定一致；电梯厢以旧图为构图参考。',
    '浏览器检查：桌面与手机车厢、候客卡、商店；规则与数值不变，verify、类型检查和构建通过。',
  ],
  watch: [
    '仪表化界面（电量做成电压表指针、金币做成收银机）是下一步。',
    '幽灵画像的背景比其他人稍亮，如在游戏里显得突兀再单独重画。',
  ],
};

export const V91_EN: ChangelogEntry = {
  version: '9.1', date: '2026-09-23', title: 'Art Deco poster style',
  summary: 'Every rider, legend, shop item and the cabin redrawn as 1930s Art Deco travel posters, easier to recognise at small sizes.',
  changes: [
    'Style: flat gouache shapes, clean silhouettes, deep bottle-green backdrop, brass and cream with one accent colour per character; everyone keeps their signature prop (the Commuter’s newspaper, the Courier’s parcel, the Thief’s pocket watch, the Nurse’s cap…).',
    'All 21 riders, 8 legends (with a gold sunburst behind them), the 16 ability and 3 power-box icons and the cabin background redrawn: 49 images.',
    'The cabin keeps its layout (open doors in the centre, six floor circles) and is dimmed so riders stay in front.',
    'Each character is now its own image instead of a crop from a six-portrait sheet; art weight drops from about 16 MB to about 1.3 MB for a faster first load.',
    'Fixed a v9.0.4 bug: the riders’ breathing animation overrode their centring, shifting seat portraits so only part showed.',
  ],
  experiments: [
    'Style choice: the same three riders, cabin and shop item were drawn in three styles and compared at the real 40 px and 80 px sizes; Art Deco poster was chosen.',
    'Generation: an image model used the chosen style samples as reference; each image was checked for style consistency, no text and props matching the character; the cabin used the old image as its layout reference.',
    'Browser checks: desktop and phone cabin, offer cards and shop; no rule or value changes; verify, type check and build pass.',
  ],
  watch: [
    'Diegetic gauges (a voltmeter needle for power, a cash register for coins) are next.',
    'The Ghost’s backdrop is slightly lighter than the others; redraw it if it stands out in play.',
  ],
};

export const V92_ZH: ChangelogEntry = {
  version: '9.2', date: '2026-09-23', title: '仪表盘：电压表和收银机',
  summary: '电量改成黄铜电压表，余额改成收银机数字窗；界面和 Art Deco 电梯成为同一套东西。',
  changes: [
    '电量电压表：指针是当前电量，虚线指针是下一站最坏情况；表盘红区是“不够跑下一层”的电量，黄区是两倍以内；进入红区时指针会轻微颤动。原来的细电量条移除。',
    '收银机余额：侧栏和商店的金币改为逐位数字窗，前导零变暗；某一位变化时那一位像收银机一样翻上来。',
    '矮屏（高度 820 以内）的电压表自动变成扁平样式，并隐藏侧栏里重复的运转耗电说明和补电小字（上行按钮旁的补电提示仍在）；1024×768 下侧栏在紧急状态也不再溢出（此前正常状态就溢出 14 像素）。',
    '系统设置“减少动态效果”时，指针颤动和数字翻动关闭。',
  ],
  experiments: [
    '浏览器检查：1440×900、1366×768、1280×720、1024×768、768×1024、390×844，正常楼层与“这一层可能断电”两种状态；侧栏溢出全部为 0。',
    '规则与数值不变；verify、类型检查和构建通过。',
  ],
  watch: [
    '电压表的红 / 黄区按下一站最坏耗电划分，只是提示；真正的保护仍是上行确认。',
  ],
};

export const V92_EN: ChangelogEntry = {
  version: '9.2', date: '2026-09-23', title: 'Instrument panel: a voltmeter and a cash register',
  summary: 'Power becomes a brass voltmeter and the balance a cash register, so the interface belongs to the same Art Deco lift.',
  changes: [
    'Power voltmeter: the needle is current power, the dashed needle the worst case after the next floor; the red zone is power that would not cover the next floor, amber up to twice that; the needle trembles in the red. The thin power bar is gone.',
    'Cash-register balance: coins in the rail and the shop show one window per digit with dimmed leading zeros; a changed digit rolls up like a register.',
    'On short screens (height up to 820) the voltmeter flattens and the rail hides its duplicated motor note and charging fine print (the charge prompt by Ascend remains); at 1024×768 the rail no longer overflows even in an emergency (it overflowed 14 px on normal floors before).',
    'With “reduce motion” the needle tremble and digit roll are off.',
  ],
  experiments: [
    'Browser checks at 1440×900, 1366×768, 1280×720, 1024×768, 768×1024 and 390×844, on a normal floor and a “this floor can run you out” floor; rail overflow 0 everywhere.',
    'No rule or value changes; verify, type check and build pass.',
  ],
  watch: [
    'The voltmeter zones follow the next floor’s worst-case cost and are only a hint; the real safeguard remains the ascend confirmation.',
  ],
};

export const V921_ZH: ChangelogEntry = {
  version: '9.2.1', date: '2026-09-23', title: '修复：老玩家点“开始”没有反应',
  summary: '玩过的玩家打开游戏时，开场说明会卡在屏幕上，点“开始临时夜班”没有反应。',
  changes: [
    '开场说明改为读取本地记录之后才决定是否显示：新玩家照常看到并可点开始；玩过的玩家直接进入游戏，不再出现卡住的说明。',
  ],
  experiments: [
    '原因：页面先把说明打开，下一帧读到“已看过”再关闭；关闭发生在弹窗入场动画进行中，弹窗停在屏幕上但已不响应，点击“开始”不会改变任何状态。v9.0 引入“开场说明只出现一次”时就存在。',
    '浏览器复现与验证（真实点击）：老玩家存档打开后无弹窗、可上客并上行到 2 层；清空存档后说明出现、点开始关闭、刷新后不再出现。verify 新增一条检查防止回退。',
  ],
  watch: ['新玩家在第一帧里（说明出现之前）能看到候客卡片闪一下；不影响操作，如果明显再处理。'],
};

export const V921_EN: ChangelogEntry = {
  version: '9.2.1', date: '2026-09-23', title: 'Fix: Start did nothing for returning players',
  summary: 'For anyone who had played before, the intro could freeze on screen and “Start the Temporary Shift” did nothing.',
  changes: [
    'The intro now decides whether to show only after reading local storage: new players see it and can start as before; returning players go straight into the game with no frozen intro.',
  ],
  experiments: [
    'Cause: the page opened the intro and closed it one frame later on reading “already seen”; closing during the dialog’s entrance animation left it on screen but inert, so Start changed nothing. Present since v9.0 introduced the show-once intro.',
    'Reproduced and verified in the browser with real clicks: a returning save opens with no dialog and can board and ascend to 2F; a cleared save shows the intro, Start closes it and it stays closed on reload. A new verify check guards against regression.',
  ],
  watch: ['New players may glimpse the offer cards for one frame before the intro appears; harmless, revisit if noticeable.'],
};

export const V93_ZH: ChangelogEntry = {
  version: '9.3', date: '2026-09-23', title: '全面检查：更干净的界面',
  summary: '修掉放人时已就位人物也闪一下、车厢画像大小不一；把界面上重复和次要的文字拿掉。',
  changes: [
    '动画：新乘客连上绿线时，只有新放下的人有落位动画，已经坐好的邻座不再闪一下；新连线自己从一端画到另一端。',
    '车厢画像：状态文字（已配对、检修进度、暂存、炸弹倒计时）改为叠在画像底部，不再挤压画像，每个座位的人物一样大。手机上座位用人物画像做暗色底图。',
    '候客卡：人物画像放大到 76 像素、内容居中；去掉“初次见面”标签；“完整规则”改为右上角小图标。',
    '侧栏：躁动只保留表盘、状态和下一站（低 / 中 / 高分档、失控线和到站规则在问号说明里）；电量的运转耗电合成一行；途中补电的小字改为悬停提示。',
    '车厢：去掉装饰性的“CAR № 07 / 0/6 OCCUPIED”。',
    '说明与档案：躁动说明的按钮从“开始游戏”改为“知道了”；乘客档案整体滚动，传奇部分不再溢出窗口；未遇见的人物只显示锁和“？？？”。',
    '本班装备：只列已安装的能力，去掉无意义的“站位 6 个”；未安装时显示一行提示。',
  ],
  experiments: [
    '逐屏检查：开场、教学首层、选中、放置、到站、人物详情、躁动说明、更新记录、档案、传奇首层、商店、本班装备、上行保护、结算，桌面 1440×900 与手机 390×844 各一遍；英文界面扫描无遗留中文。',
    '规则与数值不变；verify（放置反馈测试改为只反馈新放下的座位）、类型检查和构建通过。',
  ],
  watch: [
    '手机上候客区和车厢仍需上下滚动；如果试玩觉得来回滚动麻烦，再考虑把候客改为横向滑动。',
  ],
};

export const V93_EN: ChangelogEntry = {
  version: '9.3', date: '2026-09-23', title: 'Full pass: a cleaner interface',
  summary: 'Fixed seated riders flashing when a neighbour is placed and uneven cabin portrait sizes; removed duplicated and secondary text across the interface.',
  changes: [
    'Animation: when a new rider forms a green link, only the new rider plays the settle animation; seated neighbours no longer flash, and the new link draws itself in.',
    'Cabin portraits: status text (paired, repair progress, banked coins, bomb timer) now overlays the bottom of the portrait instead of squeezing it, so every seat shows the same size. On phones each seat uses the portrait as a dimmed backdrop.',
    'Offer cards: portraits enlarged to 76 px with centred content; the “first encounter” tag is gone; Details is a small icon in the corner.',
    'Rail: agitation keeps only the dial, state and next floor (bands, loss line and arrival relief live behind the ? help); the motor note is one line; the charging fine print became a hover hint.',
    'Cabin: the decorative “CAR № 07 / 0/6 OCCUPIED” is gone.',
    'Help and archive: the agitation help button now says “Got it” instead of “Start game”; the archive scrolls as a whole so the legends no longer spill out; unmet riders show just a lock and “???”.',
    'Kit: lists only installed abilities and drops the meaningless “6 seats”; a single line when nothing is installed.',
  ],
  experiments: [
    'Screen-by-screen pass: intro, tutorial floor, selection, placement, arrival, rider details, agitation help, changelog, archive, legend floor, shop, kit, ascend guard and result, at 1440×900 and 390×844; English scan shows no leftover Chinese.',
    'No rule or value changes; verify (placement feedback test now expects only the placed seat), type check and build pass.',
  ],
  watch: [
    'On phones the offers and cabin still need vertical scrolling; if playtests find it tiresome, consider a horizontal offer strip.',
  ],
};

export const V931_ZH: ChangelogEntry = {
  version: '9.3.1', date: '2026-09-23', title: '上行保护给出真实的出路',
  summary: '这一层补电不够时，保护会算出真正能撑过的请离/撤回+补电方案，或者直接说明这一层撑不过；老周满员不省电会显示在座位上。',
  changes: [
    '上行保护：补电额度或金币不够时，不再笼统建议“请离耗电的乘客”，而是枚举撤回新上车乘客（免费）和请离旧乘客（付赔偿）的组合，给出最省钱的能撑过方案（例如“能撑过：通勤者（请离 8 币），再补电 +2”），只需请离时可一键“照此安排”；没有任何组合能撑过时，明确显示“这一层无论怎么安排都会断电”。',
    '老周：卡片写明“车内不满 6 人时运转 −1 电”；满员时座位显示“满员 · 不省电”。',
  ],
  experiments: [
    '试玩记录（9.3，29 层，电量耗尽）：28 层电量 1、金币 16，下一层最坏耗 5 电，途中补电只买得起 4；旧保护建议请离，玩家付 16 币请离两人并换上一位恋人，仍然断电。逐一枚举后确认该层没有任何能撑过的安排——保护应当直说。verify 新增：该层必须判定无解；另一个“撤回新乘客再补电”的局面必须找到方案。',
    '同一记录：老周从 1 层坐到 10 层，但 2–9 层车厢一直满 6 人，他的运转 −1 从未生效。',
    '模拟器修正：v9.0.2 已从商店下架的应急电池，机器人仍在购买和使用；已移除。重跑验收（3900 局）几乎不变：均衡型中位 86，流派 91.3%，躁动死亡 22.7%；新的边缘项：均衡型幽灵上车率 66.2%（界限 65%）。',
    '新增“休闲”机器人（按卡面车费上客、像熟练者一样购物）：中位 28 层，与本次试玩 29 层吻合；新手 25，均衡 85。差距几乎全部来自上客选择：均衡型平均每层只带 3.55 人（休闲 4.27），偏好快递员、小偷、幽灵这类省电或途中赚钱的乘客。',
    '界面实验（未上线）：让休闲机器人改按“净值＝车费 − 全程耗电×充电价 − 全程躁动×3”上客，中位从 28 升到 49，p10 从 19 升到 46。',
  ],
  watch: [
    '是否在人物卡上显示“净值”——对新玩家帮助很大，但会降低难度，待决定。',
    '均衡型幽灵上车率 66.2%，略超 65% 界限。',
  ],
};

export const V931_EN: ChangelogEntry = {
  version: '9.3.1', date: '2026-09-23', title: 'The ascend guard offers a real way out',
  summary: 'When charging is not enough, the guard now finds a withdraw/dismiss-and-charge plan that actually survives, or says plainly that the floor cannot be survived; Old Zhou shows when a full cabin cancels his saving.',
  changes: [
    'Ascend guard: when coins or sector allowance fall short, it no longer just suggests dismissing a rider. It tries every combination of withdrawing new riders (free) and dismissing earlier ones (paid) and shows the cheapest plan that survives (e.g. “You can make it: Commuter (dismiss, 8c), then charge +2”), with a one-tap “Do it” when only dismissals are involved; when nothing survives it says “No arrangement survives this floor”.',
    'Old Zhou: his card says “Motor −1 unless the cabin is full”, and his seat shows “Full · no saving” when it is.',
  ],
  experiments: [
    'Playtest record (9.3, 29F, out of power): on 28F with 1 power and 16 coins, the next floor needed 5 in the worst case and in-transit charging could buy 4; the old guard suggested dismissing, the player paid 16 to dismiss two riders and boarded a Lover, and still ran out. Enumerating every option shows that floor had no surviving arrangement, so the guard should say so. New verify checks: that floor must be declared lost; a withdraw-then-charge position must find its plan.',
    'Same record: Old Zhou rode 1F–10F but the cabin held 6 riders on 2F–9F, so his −1 motor never applied.',
    'Simulator fix: bots were still buying and using the Reserve Cell that left the shop in v9.0.2; removed. Acceptance (3,900 runs) barely moves: optimizer median 86, styles 91.3%, agitation deaths 22.7%; new marginal item: the optimizer boards Ghosts 66.2% of the time (bound 65%).',
    'New “casual” bot (boards by printed fare, shops like the optimizer): median 28, matching this playtest’s 29; novice 25, optimizer 85. The gap is almost entirely seating: the optimizer carries 3.55 riders per floor (casual 4.27) and prefers power-light or earning riders such as Couriers, Thieves and Ghosts.',
    'Interface experiment (not shipped): the casual bot boarding by “net = fare − trip power × charge price − trip agitation × 3” rises from median 28 to 49 and p10 from 19 to 46.',
  ],
  watch: [
    'Whether to show a “net value” on rider cards: a big help to new players, but it lowers difficulty; awaiting a decision.',
    'The optimizer boards Ghosts 66.2% of the time, just over the 65% bound.',
  ],
};

export const V94_ZH: ChangelogEntry = {
  version: '9.4', date: '2026-09-23', title: '人物卡显示“净值”（试用）',
  summary: '每张候客卡在数字行右侧显示净值：单独带这位乘客大约赚还是亏。',
  changes: [
    '净值＝车费 − 全程耗电 × 当前充电价 − 全程自身躁动 × 3（快递员加上到站回的 2 电）；不含邻座加成（恋人配对、游客邻座、教练等），所以绿色表示单独带也划算，红色表示要靠组合才值得。传奇不显示。',
    '悬停净值可看到计算方式。',
  ],
  experiments: [
    '模拟（每类 300 局，种子 777）：按卡面车费上客的“休闲”机器人中位 28 层、p10 19；改按净值上客后中位 49、p10 46。熟练型（均衡）85 不受影响。卡片和模拟器使用同一个计算函数（lib/net-value.ts）。',
    'verify 新增净值计算检查；规则与数值不变。',
  ],
  watch: [
    '试用：看真人玩家是否因为净值为负而完全不带恋人、游客等靠组合赚钱的乘客；如果是，考虑显示“配对后净值”。',
    '净值会让新手明显变强，需要试玩判断难度是否仍然合适。',
  ],
};

export const V94_EN: ChangelogEntry = {
  version: '9.4', date: '2026-09-23', title: 'Net value on rider cards (trial)',
  summary: 'Each offer card shows a net value at the end of its number row: roughly whether carrying this rider alone gains or loses coins.',
  changes: [
    'Net = fare − trip power × current charge price − trip agitation × 3 (Couriers add back their 2-power refund); neighbour bonuses (paired Lovers, Tourist neighbours, Coaches…) are left out, so green means worth carrying alone and red means it pays only in a combination. Legends show none.',
    'Hover the net value to see how it is computed.',
  ],
  experiments: [
    'Simulation (300 runs per bot, seed 777): the casual bot boarding by printed fare reaches median 28 (p10 19); boarding by net value, median 49 (p10 46). The optimizer stays at 85. Cards and simulator share one function (lib/net-value.ts).',
    'New verify check for the net computation; no rule or value changes.',
  ],
  watch: [
    'Trial: watch whether players stop carrying Lovers, Tourists and other combination riders because their net is negative; if so, consider showing a “paired” net.',
    'Net value makes new players noticeably stronger; playtests should confirm the difficulty still feels right.',
  ],
};

export const V95_ZH: ChangelogEntry = {
  version: '9.5', date: '2026-09-23', title: '更清楚的侧栏、拖回撤销、传奇轮换',
  summary: '侧栏精简；刚上车的乘客可以拖回候客区撤销；传奇不再连着重复；信物效果直接写出来；“净值”改成“单独 赚/亏”。',
  changes: [
    '侧栏：电量只剩表盘、一行“下一站 −3 · 到店剩 45 / 15 层断电”和需要时一个补电按钮；运转耗电移到悬停提示；检修、飞轮、第五张票改为小标签；单站检票器、谢幕礼的静态说明从侧栏移除（仍在能力说明里）。',
    '撤销：本层刚上车的乘客可以直接拖回右侧候客区撤回（拖动时候客区出现“拖回这里撤回”），和点候客卡撤回效果相同。',
    '传奇轮换：改为“洗牌袋”——已解锁的传奇每一轮各出现一次、顺序随机，也不会连续两局相同。此前是每局独立随机，四选一时连续遇到同一位的概率不低。',
    '信物：商店里的信物直接显示效果（例如“老周的扳手：配电箱免费升 1 级，此后每级便宜 5 金币”）；传奇候客卡下方也写出信物效果，不再依赖悬停。',
    '人物卡：“净 −7”改为“单独 亏 7 / 单独 赚 5 / 单独 持平”，意思是单独带这位乘客大约赚还是亏（不含配对、邻座加成）。',
  ],
  experiments: [
    '传奇随机性检查：引擎 4000 次抽样四位传奇各约 25%；线上连续刷新 12 次为老周 5、大亨 3、月老 2、护士长 2——是随机的，但重复感强，所以改为洗牌袋；verify 新增 40 次抽取的轮换检查。',
    '拖回撤销在浏览器中验证：拖动已上车乘客到候客区后车厢清空、提示“回到队伍中”。',
    '电量规则研究（未上线，见下方观察）：固定运转耗电后，熟练玩法会一直活下去；加入“夜深人躁”（41 层起每三层+1 躁动，逐渐加快）后熟练型中位约 85，但熟练玩家会明显变富。规则本版不变。',
  ],
  watch: [
    '取消“每十层加电”需要选择方向：见本版说明里的两个方案。',
  ],
};

export const V95_EN: ChangelogEntry = {
  version: '9.5', date: '2026-09-23', title: 'A cleaner rail, drag back to withdraw, legend rotation',
  summary: 'A simpler rail; riders who just boarded can be dragged back to the offers; legends no longer repeat back to back; keepsake effects are spelled out; the net value reads “alone: gain/lose”.',
  changes: [
    'Rail: power keeps its dial, one line “Next −3 · 45 at shop / out at 15F” and a single charge button when needed; the motor cost moves to the hover hint; repair, flywheel and fifth-ticket status become small tags; static notes for Single Arrival and Curtain Call leave the rail (they remain in the ability text).',
    'Withdraw: a rider who boarded on this floor can be dragged back onto the offer list (it shows “Drop here to withdraw” while dragging), the same as clicking their offer card.',
    'Legend rotation: a shuffle bag now shows each unlocked legend once per cycle in random order and never the same one twice in a row. Before, each run drew independently, so with four legends repeats were common.',
    'Keepsakes: the shop shows each keepsake’s effect in full (e.g. “Old Zhou’s Wrench: one free power-box level; every later level costs 5 coins less”), and a legend’s offer card states its keepsake effect instead of relying on hover.',
    'Rider cards: “Net −7” now reads “Alone −7 / Alone +5 / Alone ±0”: roughly what carrying this rider alone gains or loses, before pairing and neighbour bonuses.',
  ],
  experiments: [
    'Legend randomness: 4,000 engine draws give each of the four starters about 25%; 12 live reloads gave Old Zhou 5, Tycoon 3, Matchmaker 2, Matron 2. Random, but repetitive, hence the shuffle bag; a new verify check draws 40 times.',
    'Drag-back verified in the browser: dropping a boarded rider on the offers empties the seat with “returned to the queue”.',
    'Power-rule research (not shipped, see watch): a flat motor lets skilled play survive indefinitely; adding late-night unrest (from 41F, +1 agitation every third floor, speeding up) brings the optimizer back to a median of about 85, but skilled players become noticeably rich. Rules are unchanged in this version.',
  ],
  watch: [
    'Removing the per-sector motor increase needs a direction choice; see the two options in this release’s notes.',
  ],
};
