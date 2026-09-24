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

export const V96_ZH: ChangelogEntry = {
  version: '9.6', date: '2026-09-23', title: '电机不再每十层加电；夜深了，车厢会越来越躁',
  summary: '运转耗电改为 1–10 层 1 电、11 层起固定 2 电，不再上涨；41 层起“夜深人躁”逐渐加快；新增途中安抚，用金币压下躁动。',
  changes: [
    '运转：1–10 层每层 1 电，11 层起每层固定 2 电，永不再加（原来是 11–30 层 3 电、31–40 层 4 电、41–45 层 5 电，46 层起每 7 层 +1 到 13）。',
    '夜深人躁：41 层起每三层 +1 躁动，61 层起每两层，81 层起每层，101 层起每层 +2；已计入躁动预测，开场说明和值班手册写明时间表。护士、音乐家、乘客到站都能抵消。',
    '途中安抚：躁动到中档以上时，躁动栏出现“安抚 −1 · 8 币”；每十层最多 6 点。这一层可能躁动失控时，上行按钮上方也会给出需要的安抚量，并需要再按一次才冒险出发。',
    '侧栏的运转提示在 11 层后改为“运转固定 2 电”。',
  ],
  experiments: [
    '取消加电后先试了“什么都不补”：熟练玩法 50–90% 的局活过 150 层，无尽模式失去终点，所以用“夜深人躁”代替加电作为后期的时钟。比较了固定 2 电 / 固定 3 电、夜深人躁开始楼层（41/51/61）与加速间隔（15/20/30）、每层 +1 的硬墙版本、途中安抚价格与上限共约 20 组。',
    '最终验收（种子 999001，3900 局）：五种流派最弱 / 最强 98.1%，招牌能力 98–104%，死里逃生 97.6%，每 10 层险情 2.3 次，150 层存活 0%。熟练型（均衡）中位 102 层（p10 86，p90 108）。',
    '玩家水平（种子 4242，每类 300 局）：新手中位 26 → 41，休闲 29 → 44；电量死亡占比 60–69% → 21–33%；离店剩余金币仍约 1–2。',
    '已知代价（按方案 A 接受）：会算账的玩家后期明显变富——看净值上客中位 99 层、进店富裕 68.5%；均衡型进店富裕 83.4%、离店剩 162 金币；熟练型几乎都死于躁动（99%）。均衡型音乐家上车率 70%（界限 65%），因为音乐家能把躁动拉回中档。验收里这些目标暂列为失败，待下一步调整。',
    'verify：运转时间表、断电楼层、上行保护（含躁动）、夜深人躁时间表、安抚价格与每十层上限；9.3 试玩的 28 层在新规则下可以撑过，测试改用 12 金币的无解局面。',
  ],
  watch: [
    '熟练玩家后期太富：候选方案是后期车费略降，或让安抚价格随使用次数上升。',
    '需要真人试玩确认“夜深人躁”比加电更公平、也仍然紧张。',
    '音乐家上车率 70%，略超界限。',
  ],
};

export const V96_EN: ChangelogEntry = {
  version: '9.6', date: '2026-09-23', title: 'No more motor increases; the night grows restless instead',
  summary: 'The motor costs 1 per floor on 1–10F and a flat 2 from 11F, never rising; from 41F late-night unrest slowly speeds up; new in-transit calming spends coins on agitation.',
  changes: [
    'Motor: 1 per floor on floors 1–10, then a flat 2 per floor forever (before: 3 on 11–30, 4 on 31–40, 5 on 41–45, then +1 every 7 floors up to 13).',
    'Late-night unrest: from 41F +1 agitation every third floor, every second floor from 61F, every floor from 81F, +2 per floor from 101F. It is in the agitation forecast, and the intro and manual show the schedule. Nurses, Musicians and arrivals offset it.',
    'Calming: once agitation is medium or higher the agitation panel offers “Calm −1 · 8c”, up to 6 per ten floors. When this floor can boil over, the ascend button shows the calming needed and asks for a second press to risk it.',
    'The rail’s motor hint reads “Motor fixed at 2” from 11F.',
  ],
  experiments: [
    'First, removing the increase with nothing in its place: skilled play survived past 150F in 50–90% of runs, so the endless mode lost its end; late-night unrest replaces the motor as the late clock. About 20 variants compared: flat motor 2 vs 3, unrest start (41/51/61) and pace (15/20/30), a hard +1-per-floor wall, calming price and cap.',
    'Final acceptance (seed 999001, 3,900 runs): rider styles weakest / strongest 98.1%, signature abilities 98–104%, close calls 97.6%, 2.3 per ten floors, 0% alive at 150F. Optimizer median 102 (p10 86, p90 108).',
    'Player tiers (seed 4242, 300 runs each): novice median 26 → 41, casual 29 → 44; share of deaths from power 60–69% → 21–33%; coins left after shopping still about 1–2.',
    'Known cost (accepted with option A): players who do the maths grow rich late — net-reading median 99 with 68.5% affluent shops; the optimizer 83.4% affluent with 162 coins left; skilled runs nearly all end in agitation (99%). The optimizer boards Musicians 70% of the time (bound 65%) since they pull agitation back to medium. These acceptance targets are left failing pending the next adjustment.',
    'verify: motor schedule, power-out floor, ascend guard (now including agitation), unrest schedule, calming price and per-sector cap; the 9.3 playtest’s floor 28 survives under the new rules, so the test now uses an unwinnable 12-coin position.',
  ],
  watch: [
    'Skilled players are too rich late: candidates are slightly lower late fares or calming that gets pricier with use.',
    'Human playtests need to confirm late-night unrest feels fairer than the motor increases and still tense.',
    'Musicians boarded 70% of the time, just over the bound.',
  ],
};

export const V961_ZH: ChangelogEntry = {
  version: '9.6.1', date: '2026-09-23', title: '躁动从哪来，一眼看清',
  summary: '躁动栏直接列出下一站的躁动来源；“高危”写明代价；商店默认只充下一段需要的电，留钱安抚；躁动快失控时给出能撑过的请离/撤回+安抚方案。',
  changes: [
    '躁动来源：躁动栏在“下一站”下方列出来源，例如“高危乘客 ×2 +2 · 儿童无人照顾 +1 · 车厢拥挤 +1 · 到站舒缓 −1”。躁动不是只来自相邻的红线——高危乘客、无人照顾的儿童、未受控的小偷、坐满 6 人、音乐家节拍和夜深人躁都会加。',
    '高危：候客卡写明“高危：车费+2 躁动+1/层”，座位上的“高危”标签悬停也有说明。',
    '商店充电默认值改为“下一段约需电量”（按每层 4 位乘客估算），不再默认充满；想多充可以拖满。',
    '躁动保护：这一层可能失控且金币或安抚额度不够时，枚举撤回刚上车的乘客（免费）和请离旧乘客（付赔偿），给出最省钱的能撑过方案，可一键照做；没有方案时提示换座位的方向。',
  ],
  experiments: [
    '试玩记录（9.6，32 层，躁动失控）：截图中 6/8 → 下一站 +3，来源是两位高危乘客 +2、儿童无人照顾 +1、坐满 6 人 +1、驱魔师到站 −1，都与“相邻”无关。30 层商店把 121 金币里的 120 花在充电（90/90），31 层以 78 电、7 金币死于躁动——电够了，钱却不够安抚。',
    'verify 新增：用截图里的车厢复现，来源必须逐项列出，且最优方案是“撤回刚上车的儿童”（免费，同时去掉无人照顾 +1 和拥挤 +1）。',
    '规则与数值不变；商店默认充电只影响界面预选。',
  ],
  watch: [
    '看真人是否会用“安抚”和保护给出的方案；如果后期仍经常死于躁动，考虑让护士和音乐家更早出现。',
  ],
};

export const V961_EN: ChangelogEntry = {
  version: '9.6.1', date: '2026-09-23', title: 'See where agitation comes from',
  summary: 'The agitation panel lists the next floor’s sources; “High risk” states its cost; the shop defaults to the next sector’s power need to leave coins for calming; when agitation is about to boil over, the guard offers a withdraw/dismiss-and-calm plan that survives.',
  changes: [
    'Agitation sources: under “Next” the agitation panel lists its sources, e.g. “High-risk riders ×2 +2 · Child uncared for +1 · Cabin crowded +1 · Arrival relief −1”. Agitation does not only come from red links between neighbours: high-risk riders, uncared-for Children, uncontrolled Thieves, a full cabin of 6, the Musician’s beat and late-night unrest all add to it.',
    'High risk: offer cards read “High risk: fare +2, +1/floor”, and the seat tag explains itself on hover.',
    'Shop charging now defaults to the next sector’s estimated need (4 riders per floor) instead of full; drag to buy more.',
    'Agitation guard: when this floor can boil over and coins or calming allowance fall short, it tries withdrawing new riders (free) and dismissing earlier ones (paid) and shows the cheapest plan that survives, with one-tap “Do it”; with no plan it points at reseating.',
  ],
  experiments: [
    'Playtest record (9.6, 32F, agitation): the screenshot’s 6/8 → next +3 came from two high-risk riders +2, an uncared-for Child +1, a full cabin +1 and an arriving Warden −1, none of it about adjacency. At the 30F shop 120 of 121 coins went on charging (90/90); on 31F the run ended in agitation with 78 power and 7 coins: enough power, no money to calm.',
    'New verify check rebuilds the screenshot cabin: sources must be itemised and the best plan must be withdrawing the new Child (free, removing both the uncared +1 and the crowding +1).',
    'No rule or value changes; the shop default only changes the preselected amount.',
  ],
  watch: [
    'Watch whether players use calming and the guard’s plans; if late runs still end in agitation, consider Nurses and Musicians appearing earlier.',
  ],
};

export const V97_ZH: ChangelogEntry = {
  version: '9.7', date: '2026-09-23', title: '卖能力、商店重排、急躁与夜深人躁更讲理',
  summary: '商店可以卖掉能力、在店里安抚，布局重做；“高危”改名“急躁”且支持型人物不再急躁；修复凭空出现的“红线躁动”；检查员改为连续 3 层不在高躁动；电机重新设计；夜深人躁可以靠到站来应对。',
  changes: [
    '修复：躁动来源里的“红线躁动 +1”其实是车厢整体来源（拥挤、夜深人躁）被重复列出，总数一直是对的；现在红线、坏人链接、整车来源分开显示。',
    '“高危”改名“急躁”：候客卡写“急躁：车费+4，躁动+1/层”，护士相邻可以抵消。护士、检查员、警察、律师、维修工、快递员、驱魔师不会再出现急躁版本。',
    '人物卡：“单独带 亏 8 币”写明单位；如果乘客自己会加躁动，显示“（含躁动）”，悬停说明躁动按每点每层 3 币折算。',
    '检查员：改为连续 3 次关门时不在高躁动（低或中都算）即盖章，+12 不变；检查员本人不会急躁。',
    '商店：顶部显示电量、躁动、金币；左边是能力卡和“已装能力”6 个位置，每项可“卖出”退 15 金币；六格满时仍会出现 3 张能力卡，卖掉一项就能装；右边依次是配电箱、充电、安抚（新增：在商店里也能安抚，和途中共用每十层 6 点）。',
    '配电箱电机（运转已固定为 2）：1 级每三层运转 −1，2 级偶数层运转 −1，3 级“静音”：夜深人躁 −1。去掉 3 级“5 人以上 +1 躁动”的副作用。',
    '夜深人躁：有乘客在这一层到站时少 1（可以靠安排到站来应对）；升级间隔 15 层：41 层起每三层 +1，56 层起每两层，71 层起每层，86 层起每层 +2，101 层 +3，116 层 +4。',
    '安抚价格随夜深上涨：6 金币 + 每十层 2 金币（30 层 12 币，70 层 20 币）。',
  ],
  experiments: [
    '试玩记录（9.6.1，71 层，躁动失控）：70 层商店用掉最后的金币充电到 81/110，带着 9/10 躁动出门，下一层夜深人躁 +1 失控；侧栏同时显示的“红线 +1”是重复计数的显示错误。',
    '检查员盖章率（每类 150 局）：原规则（只算低躁动、2 层）休闲 12%、看净值 56%、均衡 37%；只放宽到中躁动（2 层）52% / 79% / 66%，偏容易；定为中躁动也算、连续 3 层：35% / 72% / 58%。',
    '夜深人躁方案（每类 200 局）：到站抵消整层（不管多少）会让熟练型 17–82% 的局活过 150 层；改为“到站少 1、每 15 层升级、最高 +4”，配合安抚随楼层涨价，所有档位 150 层存活 0%。',
    '最终验收（3900 局）：五种流派 99.0%，死里逃生 98.0%，150 层存活 0%；均衡型中位 114。玩家档位（每类 300 局）：新手中位 39，休闲 47，看净值 98。',
    '已知代价：熟练玩法后期仍然富裕（均衡型进店富裕 85.9%），均衡型教练上车率 67.8%（界限 65%）。',
    'verify 新增：卖出能力与满格商店、电机新规则、检查员 3 层、夜深人躁到站少 1、安抚涨价；原有测试按新规则更新。',
  ],
  watch: [
    '熟练玩家后期太富裕的问题仍在；可考虑让卖出、重抽等消耗更多金币，或后期车费略降。',
    '看真人是否会主动安排到站来躲夜深人躁。',
  ],
};

export const V97_EN: ChangelogEntry = {
  version: '9.7', date: '2026-09-23', title: 'Sell abilities, a rebuilt shop, fairer impatience and unrest',
  summary: 'Sell abilities and calm in the shop, with a redesigned layout; “High risk” becomes “Impatient” and support riders never roll it; a phantom “red-link agitation” fixed; the Inspector needs 3 floors below high; a new motor line; late-night unrest can be answered by arrivals.',
  changes: [
    'Fix: the “red-link agitation +1” shown in the agitation sources was cabin-wide sources (crowding, late-night unrest) listed twice; totals were always right. Red links, criminal links and cabin-wide sources are now listed separately.',
    '“High risk” is now “Impatient”: offer cards read “Impatient: fare +4, +1/floor”, and an adjacent Nurse offsets it. Nurses, Inspectors, Officers, Counsel, Mechanics, Couriers and Wardens never roll the impatient variant.',
    'Rider cards: “Alone −8 coins” states its unit; when the rider adds agitation it reads “(incl. agitation)” and the hover explains agitation is counted at 3 coins per point per floor.',
    'Inspector: stamped after 3 consecutive departures not at high agitation (low or medium both count), still +12; Inspectors are never impatient.',
    'Shop: power, agitation and coins across the top; on the left the ability cards and your 6 installed slots, each with “Sell” for 15 coins; with all six filled, 3 cards still appear and selling one lets you install; on the right the power box, charging and calming (new: calm in the shop too, sharing the 6-per-ten-floors allowance).',
    'Power-box motor (the motor is now a flat 2): level 1 saves 1 every third floor, level 2 on even floors, level 3 is a quiet motor cancelling 1 late-night unrest. The old level-3 “+1 agitation with 5+ riders” drawback is gone.',
    'Late-night unrest: 1 less on any floor where a rider gets off (plan arrivals to answer it); it steps up every 15 floors: +1 every third floor from 41F, every second floor from 56F, every floor from 71F, +2 per floor from 86F, +3 from 101F, +4 from 116F.',
    'Calming gets pricier with the night: 6 coins + 2 per ten floors (12 at 30F, 20 at 70F).',
  ],
  experiments: [
    'Playtest record (9.6.1, 71F, agitation): at the 70F shop the last coins went on charging to 81/110 and the run left at 9/10 agitation; one unrest on the next floor ended it. The “red link +1” shown alongside was the double-listing bug.',
    'Inspector stamp rate (150 runs per bot): old rule (low only, 2 floors) casual 12%, net-reading 56%, optimizer 37%; allowing medium (2 floors) 52% / 79% / 66%, too easy; medium allowed over 3 floors: 35% / 72% / 58%.',
    'Unrest designs (200 runs per bot): arrivals cancelling a whole floor let skilled bots survive past 150F in 17–82% of runs; “arrivals take 1 off, stepping up every 15 floors to +4” plus calming priced by depth gives 0% alive at 150F for every tier.',
    'Final acceptance (3,900 runs): styles 99.0%, close calls 98.0%, 0% alive at 150F; optimizer median 114. Player tiers (300 runs each): novice median 39, casual 47, net-reading 98.',
    'Known cost: skilled play is still rich late (optimizer 85.9% affluent shops); the optimizer boards Coaches 67.8% of the time (bound 65%).',
    'New verify checks: selling and full-kit shops, the motor line, the 3-floor Inspector, arrivals reducing unrest, depth-priced calming; existing tests updated to the new rules.',
  ],
  watch: [
    'Late wealth for skilled players remains; options include pricier sells/rerolls or slightly lower late fares.',
    'Watch whether people plan arrivals to dodge late-night unrest.',
  ],
};

export const V98_ZH: ChangelogEntry = {
  version: '9.8', date: '2026-09-23', title: '电梯活起来了：音效、动画和乘客的话',
  summary: '全新合成音效（电梯铃、开关门、马达、金币、连线、心跳……），上客飞入、连线火花、大额收入爆金、险情/新纪录/楼区大字幕，乘客上车和下车会说话；连送计数和“距纪录 N 层”。',
  changes: [
    '音效：新增一套合成音效（带混响）：到站电梯铃“叮—咚”、关门/开门滑动声、上行马达嗡鸣、金币落入钱包一枚一枚升调的叮当声、大额收入的收银机声、绿线连上的三和弦、红线的刺耳嗡声、险情心跳、躁动升到高档的低沉轰鸣、安抚的风声与铃声、商店盖章与卖出、新纪录号角、进入新楼区的扫音。静音开关同时关闭它们。',
    '动画：上客时人物画像从候客卡飞进座位；新连上绿线时迸出绿色火花、红线迸出红色火花；金币飞进钱包后钱包弹一下并飘出“+N”，一层收入 ≥ 20 时变成大字并爆出金色粒子。',
    '字幕：新纪录（“新纪录！第 N 层”，金色）、死里逃生（“险！电量只剩 N / 躁动 N/上限”，红色，车厢边缘闪红）、进入新楼区（楼区名 + 场景一句）。每层最多一条。',
    '车厢：躁动升入高档时车厢震一下；安抚时一圈蓝色涟漪。',
    '乘客的话：每位乘客和传奇都有上车、下车的台词（中英文），下车时说一句，上车时偶尔说一句。',
    '想再来一层：连续三层以上有人到站时显示“连送 ×N”；离个人最高纪录 10 层以内时，楼层数字下方显示“距纪录 N 层”；结算页楼层数字从 0 滚动到最终层数。',
    '系统设置“减少动态效果”时，飞入、火花、震动等位移动画关闭，字幕和气泡仍然显示。',
  ],
  experiments: [
    '浏览器检查：上客飞入、绿线火花、下车台词、金币飞入与“+15”、10→11 层的住宅层字幕、24→33 层途中的夜店层字幕与“险！躁动 7/8”；控制台无错误。',
    'verify 新增：所有乘客与传奇都有上车/下车台词（中英），无音频环境下音效不报错。规则与数值不变。',
  ],
  watch: [
    '音量和出现频率需要真人试玩判断：如果嫌吵，可以降低金币叮当或减少上车台词的概率（现在 35%）。',
  ],
};

export const V98_EN: ChangelogEntry = {
  version: '9.8', date: '2026-09-23', title: 'The lift comes alive: sound, motion and riders who talk',
  summary: 'New synthesized sound (lift bell, doors, motor, coins, links, heartbeat…), riders flying into seats, link sparks, big-payout bursts, close-call / new-record / district title banners, riders who speak when boarding and leaving, a delivery streak and “N floors to your record”.',
  changes: [
    'Sound: a new synthesized set with a little reverb — the lift’s two-tone arrival bell, sliding doors, the motor hum on the way up, coins landing in the wallet one by one in rising pitch, a cash-register ring for big payouts, a chord when a green link forms and a sour buzz for a red one, a heartbeat on close calls, a low rumble when agitation turns high, a whoosh-and-bell when calming, a stamp and a coin flick in the shop, a fanfare for a new record and a sweep into each new district. The mute switch silences all of it.',
    'Motion: a boarded rider’s portrait flies from the offer card into the seat; new green links throw green sparks, red links red ones; after the coins land the wallet bumps and a “+N” floats up, turning big with a gold burst when a floor pays 20 or more.',
    'Banners: New record (gold), Close call (“Close call! N power left / Agitation N/cap”, red, with the cabin edge flashing), and the name and scene of each new district. At most one per floor.',
    'Cabin: it shudders when agitation turns high and ripples blue when you calm it.',
    'Riders talk: every rider and legend has boarding and arrival lines in both languages; they speak when getting off and sometimes when boarding.',
    'One more floor: a “Streak ×N” pops after three or more floors in a row with arrivals; within 10 floors of your best, “N to record” sits under the floor number; the result screen counts the floor up from 0.',
    'With “reduce motion”, the fly-ins, sparks and shakes are off; banners and speech bubbles still appear.',
  ],
  experiments: [
    'Browser checks: fly-in on boarding, green link sparks, arrival lines, coins into the wallet with “+15”, the Residences banner at 10→11F, the Nightclub banner and “Close call! Agitation 7/8” on the way from 24F to 33F; no console errors.',
    'New verify checks: every rider and legend has boarding and arrival lines in both languages; sound effects do not throw without audio. No rule or value changes.',
  ],
  watch: [
    'Volume and frequency need a human ear: if it feels busy, soften the coin clinks or lower the boarding-line chance (35%).',
  ],
};

export const V99_ZH: ChangelogEntry = {
  version: '9.9', date: '2026-09-23', title: '人物卡有了材质',
  summary: '候客卡按稀有度换材质：普通哑光纸、精良银箔、稀有金箔全息、传奇流光；卡片发牌翻入、轻轻摇摆、跟着鼠标倾斜和反光。',
  changes: [
    '四种材质：普通——哑光纸纹和古铜细边；精良——银边，定时扫过一道银光；稀有——金边，彩虹全息随鼠标位置流动，并有星光闪烁；传奇——金色双线框、放射纹和缓慢流动的彩色光泽，外发光呼吸。',
    '名字旁的小菱形宝石标出稀有度（古铜 / 银 / 金 / 彩虹）。',
    '动作：新一层候客像发牌一样依次翻入（带纸牌声，传奇卡多一声闪光音）；静止时轻轻摇摆；鼠标悬停时卡片抬起、朝鼠标倾斜，全息和光泽跟着鼠标走。',
    '系统设置“减少动态效果”时只保留静态材质，不翻、不摇、不倾斜。',
  ],
  experiments: [
    '浏览器检查：15、45、52、63 层的普通 / 稀有卡与 1 层传奇卡截图；悬停倾斜与发牌动画生效，控制台无错误。规则与数值不变。',
  ],
  watch: [
    '精良卡（小偷、警察、护士、醉汉、儿童）出现较少，截图中未覆盖，需要试玩时看效果。',
  ],
};

export const V99_EN: ChangelogEntry = {
  version: '9.9', date: '2026-09-23', title: 'Rider cards get materials',
  summary: 'Offer cards change material with rarity — matte common, silver-foil fine, gold holographic rare, polychrome legendary — and are dealt in, sway gently, and tilt and catch the light toward the pointer.',
  changes: [
    'Four materials: common is matte paper grain with a bronze hairline; fine has a silver edge and a periodic silver sheen; rare has a gold edge, a rainbow hologram that follows the pointer and twinkling glints; legendary has a gold double frame, sunburst rays and a slow polychrome sheen with a breathing glow.',
    'A small diamond gem beside the name marks rarity (bronze / silver / gold / rainbow).',
    'Motion: each floor’s offers are dealt in one by one with a card snap (a shimmer for legendaries); at rest they sway slightly; on hover a card lifts, tilts toward the pointer, and its hologram and sheen follow.',
    'With “reduce motion” only the static materials remain: no dealing, swaying or tilting.',
  ],
  experiments: [
    'Browser checks: common and rare cards at 15F, 45F, 52F and 63F and a legendary card on 1F; hover tilt and dealing work, no console errors. No rule or value changes.',
  ],
  watch: [
    'Fine cards (Thief, Officer, Nurse, Drifter, Child) were not in the screenshots; check them in play.',
  ],
};

export const V991_ZH: ChangelogEntry = {
  version: '9.9.1', date: '2026-09-23', title: '动画收敛，修复翻牌闪黑',
  summary: '候客卡不再翻转（翻到侧面时会露出深色背面，看起来像闪黑），改为轻轻浮现；整体动效放慢放轻，材质保持华丽。',
  changes: [
    '修复：发牌时卡片翻过 90° 会露出深色背面，造成闪黑；改为淡入并上浮 10 像素。',
    '收敛：去掉卡片静止时的摇摆；鼠标倾斜角度减半；银光扫过、全息流动、传奇流光都放慢一倍以上；星光闪烁更稀疏，稀有卡只保留两颗；传奇外发光更柔和。',
    '收敛：上车台词概率 35% → 15%，下车每层只说一句；绿线/红线火花粒子减少约一半。',
  ],
  experiments: ['浏览器逐帧截图（0.15 / 0.25 / 0.35 秒）确认发牌过程无深色帧；verify、构建通过。规则与数值不变。'],
  watch: ['如果仍觉得热闹，下一步可以关掉静止状态下的全息流动，只在悬停时显示。'],
};

export const V991_EN: ChangelogEntry = {
  version: '9.9.1', date: '2026-09-23', title: 'Calmer motion, no black flash on the deal',
  summary: 'Offer cards no longer flip (edge-on they showed their dark back, which read as a black flash) and fade in instead; motion overall is slower and quieter while the materials stay ornate.',
  changes: [
    'Fix: dealing turned cards past 90°, briefly exposing the dark back; they now fade in and rise 10 px.',
    'Calmer: no idle sway; half the pointer tilt; silver sheen, hologram drift and legendary sheen all run at less than half speed; sparser glints, only two on rare cards; a softer legendary glow.',
    'Calmer: boarding lines 35% → 15%, one arrival line per floor; about half as many link sparks.',
  ],
  experiments: ['Frame captures at 0.15 / 0.25 / 0.35 s show no dark frames during the deal; verify and build pass. No rule or value changes.'],
  watch: ['If it still feels busy, the next step is showing the hologram drift only on hover.'],
};

export const V992_ZH: ChangelogEntry = {
  version: '9.9.2', date: '2026-09-23', title: '修复：鼠标移到卡片上闪黑',
  summary: '去掉卡片的 3D 倾斜和混合模式光泽层，悬停时也不再切换动画，避免浏览器重绘造成的闪黑。',
  changes: [
    '卡片悬停只轻轻上抬 2 像素，光泽跟着鼠标位置移动；不再做 3D 倾斜。',
    '全息与流光改为普通半透明叠加（不再用颜色减淡 / 柔光混合），稀有、传奇材质保留金边、放射纹和流光。',
    '悬停时材质动画只是暂停，不再移除或重启卡片动画。',
  ],
  experiments: ['浏览器中依次悬停四张卡（含传奇），每张连续截图 3 帧，卡片区域平均亮度 35–38，没有变暗的帧。规则与数值不变。'],
  watch: ['如果在别的浏览器上仍有闪烁，把具体浏览器告诉我。'],
};

export const V992_EN: ChangelogEntry = {
  version: '9.9.2', date: '2026-09-23', title: 'Fix: black flash when hovering a card',
  summary: 'Removed the cards’ 3D tilt and blend-mode foil layers, and hover no longer swaps animations, avoiding the browser repaint that flashed black.',
  changes: [
    'Hovering a card lifts it 2 px and moves its sheen with the pointer; no more 3D tilt.',
    'Hologram and sheen are plain translucent overlays (no colour-dodge / soft-light blending); rare and legendary keep their gold edges, rays and sheen.',
    'On hover the material animation just pauses instead of the card animation being removed or restarted.',
  ],
  experiments: ['Hovered four cards in turn (including a legendary), three frames each: average card brightness 35–38 with no darkened frame. No rule or value changes.'],
  watch: ['If another browser still flickers, report which one.'],
};

export const V910_ZH: ChangelogEntry = {
  version: '9.10', date: '2026-09-23', title: '弹簧动画与着色器箔面',
  summary: '候客卡、座位和特效改用 Motion 弹簧动画；稀有卡和传奇卡的箔面改用 WebGL 着色器绘制。',
  changes: [
    '动画：候客卡出场、悬停上抬、按下回弹，人物落座、画像飞入、“+N”弹出都改为弹簧物理，动作自然收住；动画进行中再次操作会平滑接上，不再跳变。',
    '稀有卡：着色器绘制彩虹全息，带细密蚀刻纹，鼠标所在处有柔和高光；不悬停时光泽缓慢游走。',
    '传奇卡：着色器绘制流动的彩色光泽、右上角金色放射纹和零星闪烁的星点。',
    '箔面画在文字下面，不再给文字染色；设备不支持 WebGL 时自动退回之前的 CSS 箔面。系统“减少动态效果”时不播放动画，箔面静止。',
  ],
  experiments: [
    '依赖：新增 motion 13.4.2（React 动画库）；着色器为自写 WebGL，只用一个共享上下文，逐卡复制到卡片自己的画布，避免多个 WebGL 上下文和混合模式重绘（9.9 闪黑的原因）。',
    '浏览器检查：传奇卡与三张稀有卡着色器生效；逐帧悬停亮度 29–31，无暗帧；上客飞入、落座、结算正常，控制台无错误。verify、构建通过；规则与数值不变。',
  ],
  watch: ['真实音效采样待下载确认后接入。', '低端设备上若卡顿，可降低着色器帧率（现在约 25 帧）。'],
};

export const V910_EN: ChangelogEntry = {
  version: '9.10', date: '2026-09-23', title: 'Spring motion and shader foil',
  summary: 'Offer cards, seats and effects now move on Motion springs; rare and legendary card foil is drawn with a WebGL shader.',
  changes: [
    'Motion: offer cards entering, lifting on hover and giving on press, riders settling into seats, portrait fly-ins and “+N” pops all use spring physics and come to rest naturally; interrupting an animation continues smoothly instead of jumping.',
    'Rare cards: a shader-drawn rainbow hologram with fine etched lines and a soft highlight under the pointer; at rest the sheen drifts slowly.',
    'Legendary cards: a shader-drawn flowing polychrome, gold sunburst rays from the top-right corner and a few twinkling stars.',
    'The foil sits under the text so it no longer tints it; without WebGL the previous CSS foil is used. With “reduce motion” nothing animates and the foil is still.',
  ],
  experiments: [
    'Dependency: motion 13.4.2 (React animation library). The shader is hand-written WebGL with one shared context copying into each card’s own canvas, avoiding multiple GL contexts and blend-mode repaints (the cause of the 9.9 black flash).',
    'Browser checks: shader active on a legendary and three rare cards; hover brightness steady at 29–31 with no dark frame; boarding fly-in, seating and settlement work with no console errors. verify and build pass; no rule or value changes.',
  ],
  watch: ['Real sound samples follow once the downloads are approved.', 'If low-end devices stutter, lower the shader frame rate (about 25 fps now).'],
};

export const V911_ZH: ChangelogEntry = {
  version: '9.11', date: '2026-09-23', title: '真实录音音效',
  summary: '发牌、上客、金币、大额收入、卖出、安装能力、红线、结算计数改用真实录音；电梯铃、绿线和弦、安抚等仍用合成音。',
  changes: [
    '发牌：纸牌滑过桌面的声音；上客：纸牌落座；金币落袋：筹码一枚枚落下（连续时音调略升）；大额收入：一叠筹码加一声铃；卖出：拨弄筹码；安装能力：推牌加轻铃；新红线：短促错误音；结算楼层计数：机械滴答。',
    '每次播放随机选同类的不同录音、音高轻微浮动，重复也不会一模一样。',
    '音效在第一次需要时才加载（共约 136 KB）；加载失败时自动用原来的合成音。',
  ],
  experiments: [
    '素材：Kenney Casino Audio 1.1 与 Interface Sounds（kenney.nl，CC0 公有领域），经你确认后下载，选用 20 个文件转成单声道 64 kbps MP3，授权文件随附在 public/audio/sfx/。',
    '浏览器检查：开启音效后 20 个文件全部加载成功（HTTP 200），控制台无错误；verify 新增：映射的每个录音文件和授权文件都存在。规则与数值不变。',
  ],
  watch: ['音量平衡需要真人听：哪个声音太响或太多请告诉我。'],
};

export const V911_EN: ChangelogEntry = {
  version: '9.11', date: '2026-09-23', title: 'Recorded sound effects',
  summary: 'Dealing, boarding, coins, big payouts, selling, installing abilities, red links and the result count-up now use real recordings; the lift bell, link chord and calming stay synthesized.',
  changes: [
    'Dealing: cards sliding across the table; boarding: a card being placed; coins landing: chips dropping one by one (rising slightly along a chain); big payouts: a chip stack plus a bell; selling: chips being handled; installing: a card shove with a light bell; a new red link: a short error tone; the result count-up: a mechanical tick.',
    'Each play picks a random take of that sound with a slight pitch variation, so repeats never sound identical.',
    'Samples load on first use (about 136 KB in total); if loading fails, the previous synthesized sounds play instead.',
  ],
  experiments: [
    'Source: Kenney Casino Audio 1.1 and Interface Sounds (kenney.nl, CC0 public domain), downloaded with your approval; 20 files converted to mono 64 kbps MP3, licences included in public/audio/sfx/.',
    'Browser check: with sound on, all 20 files load (HTTP 200) with no console errors; new verify check that every mapped sample and both licences exist. No rule or value changes.',
  ],
  watch: ['Volume balance needs a human ear: tell me which sounds are too loud or too frequent.'],
};

export const V912_ZH: ChangelogEntry = {
  version: '9.12', date: '2026-09-23', title: '修复悬停闪黑；拖拽重做',
  summary: '真正找到并修掉了悬停闪黑的原因；拖拽改为自己实现的指针拖拽，画像跟手移动，放下时弹进座位或弹回原处。',
  changes: [
    '修复悬停闪黑：9.9.2 加的一条悬停规则会在每次悬停时重播卡片的淡入动画（从完全透明开始），看起来就是闪黑。现在悬停只改变阴影和边框，上抬由 Motion 负责。',
    '拖拽重做：不再使用浏览器自带的拖放（整张卡半透明截图、拖动时不断重绘）。按住卡片或座位上的人物拖动，一张带金边的画像跟着鼠标走，稍微倾斜；放到座位上时弹簧式落座，放到无效位置时弹回原处；原位置变暗提示正在拖。',
    '拖回候客区撤回、座位之间换位都用新的拖拽；触屏仍然是点选再点座位，不会影响页面滚动。',
    '放下后不再从候客卡重复播放一次“画像飞入”，过渡只有一次。',
    '拖动时的放置预览结果做了缓存，只在经过新座位时重新计算。',
  ],
  experiments: [
    '悬停录屏：修复前每次悬停卡片区域亮度从 33 骤降到 24–26（录屏逐帧检测到 3 次）；修复后 289 帧亮度稳定在 35–40，没有下降。',
    '拖拽：浏览器中用真实鼠标事件验证拖到座位、拖回候客区撤回、拖到别处；页面内 60 步拖动的帧间隔中位 16.7 毫秒（60 帧）。verify、构建通过；规则与数值不变。',
  ],
  watch: ['开发模式下经过座位时偶有 40 毫秒以上的帧，需在线上正式构建中复测。'],
};

export const V912_EN: ChangelogEntry = {
  version: '9.12', date: '2026-09-23', title: 'Hover flash fixed; dragging rebuilt',
  summary: 'The real cause of the hover black flash is fixed, and dragging is now a custom pointer drag: the portrait follows the pointer and springs into the seat or back to where it came from.',
  changes: [
    'Hover flash fixed: a hover rule added in 9.9.2 replayed the card’s fade-in (starting fully transparent) on every hover, which read as a black flash. Hover now only changes shadow and border; Motion handles the lift.',
    'Dragging rebuilt: no more native browser drag-and-drop (a translucent snapshot of the whole card and constant redraws). Press and drag a card or a seated rider and a gold-framed portrait follows the pointer, slightly tilted; dropped on a seat it springs in, dropped anywhere invalid it springs back; the source dims while dragging.',
    'Dragging back to the offers to withdraw and moving between seats use the new drag; touch keeps tap-then-seat so page scrolling is unaffected.',
    'After a drop the portrait no longer also flies in from the offer card, so there is a single transition.',
    'Placement previews during a drag are cached and only recomputed when the pointer reaches a new seat.',
  ],
  experiments: [
    'Hover recording: before the fix, card brightness dropped from 33 to 24–26 on each hover (3 dips detected frame by frame); after it, 289 frames stay steady at 35–40.',
    'Drag: real mouse events in the browser for drag to seat, drag back to withdraw and drag elsewhere; a 60-step in-page drag ran at a median 16.7 ms per frame (60 fps). verify and build pass; no rule or value changes.',
  ],
  watch: ['In development mode crossing seats occasionally took 40 ms+; recheck on the live production build.'],
};

export const V913_ZH: ChangelogEntry = {
  version: '9.13', date: '2026-09-23', title: '上车是“嵌进座位”；座位也有稀有度材质',
  summary: '人物上车时不再放礼花，改为画像轻轻落下、座位的金色边框收拢锁住；精良、稀有、传奇乘客在车厢里也保留各自的材质。',
  changes: [
    '上车动画：去掉座位上的光圈和火花，也去掉点选上车时从候客卡飞来的画像；人物从上方轻轻落进座位，座位金边从外向内收拢、锁紧后淡去（结成绿线时为绿边）。',
    '座位材质：精良——银边；稀有——金边加全息着色器；传奇——金色双线框、柔和呼吸的外发光和流光着色器；名字旁显示稀有度宝石。普通座位保持原样。',
  ],
  experiments: ['逐帧录屏确认上车只有“落下 + 边框锁住”一个过渡，没有滞后的飞入；传奇乘客座位显示双金框与着色器，控制台无错误。verify、构建通过；规则与数值不变。'],
  watch: ['座位着色器大部分被画像挡住，只在四周露出；如果想更明显，可以让画像边缘透出一点。'],
};

export const V913_EN: ChangelogEntry = {
  version: '9.13', date: '2026-09-23', title: 'Boarding locks into the seat; seats show rarity',
  summary: 'Boarding no longer bursts like confetti: the portrait settles down and the seat’s gold frame closes in and locks. Fine, rare and legendary riders keep their material in the cabin.',
  changes: [
    'Boarding: the seat glow ring and sparks are gone, as is the portrait flying in from the offer card on tap-to-place; the rider settles into the seat from just above while the seat’s gold frame closes inward, locks and fades (green when a link forms).',
    'Seat materials: fine — silver edge; rare — gold edge with the holographic shader; legendary — gold double frame, a soft breathing glow and the polychrome shader; a rarity gem sits beside the name. Common seats are unchanged.',
  ],
  experiments: ['Frame-by-frame recording shows a single transition on boarding (settle + frame lock) with no late fly-in; a legendary seat shows the double gold frame and shader with no console errors. verify and build pass; no rule or value changes.'],
  watch: ['The seat shader is mostly covered by the portrait and shows around it; if it should read more strongly, let the portrait edges fade into it.'],
};

export const V914_ZH: ChangelogEntry = {
  version: '9.14', date: '2026-09-23', title: '人物卡重排，文字不再被遮挡',
  summary: '候客卡改为“画像在左，名字和数字在右，能力和关系在下”的排版，内容从上往下排；四张卡时自动缩小画像和行距。',
  changes: [
    '修复：第 1 层有传奇时四张卡同屏，卡片高度不够，底部的关系标签和信物被裁掉（9.9 起卡片为了箔面效果会裁掉超出部分，加上内容垂直居中和放大的画像）。',
    '新排版：画像放在左侧，右边是名字、站数和车费/耗电/净值；能力一行和关系标签在下面全宽显示。四张卡时画像 48 像素、行距更紧，并隐藏“已选中”等状态小字。',
    '传奇卡的信物合并为一行“信物 · 名字：效果”，不再标签和说明各占一行。',
    '保险：如果某张卡仍然比格子高，候客列表会滚动，而不是藏住文字。',
  ],
  experiments: ['逐张测量卡内每个元素是否超出卡片边缘：1440×900、1440×800、1366×768、1280×720、1024×768、390×844，有传奇（四张）和无传奇（三张）两种情况，修改前四张卡时最多超出 58 像素，修改后全部为 0。规则与数值不变。'],
  watch: ['更矮的窗口（高度低于 720）如果出现滚动条，告诉我再压缩。'],
};

export const V914_EN: ChangelogEntry = {
  version: '9.14', date: '2026-09-23', title: 'Rider cards re-laid out; no more clipped text',
  summary: 'Offer cards now read portrait on the left, name and numbers on the right, ability and relations below, laid out from the top; with four cards the portrait and spacing shrink.',
  changes: [
    'Fix: with a legend on floor 1 there are four cards and not enough height, so the bottom relation tags and keepsake were cut off (since 9.9 cards clip overflow for the foil, combined with vertically centred content and a larger portrait).',
    'New layout: portrait on the left; name, stops and fare / power / net on the right; the ability line and relation tags run full width below. With four cards the portrait is 48 px, rows are tighter, and the small “selected” status text is hidden.',
    'A legend’s keepsake is a single line, “Keepsake · name: effect”, instead of a tag plus a separate description.',
    'Safety net: if a card is still taller than its slot, the offer list scrolls instead of hiding text.',
  ],
  experiments: ['Measured every element against its card’s edges at 1440×900, 1440×800, 1366×768, 1280×720, 1024×768 and 390×844, with a legend (four cards) and without (three): before, four-card layouts overflowed by up to 58 px; after, 0 everywhere. No rule or value changes.'],
  watch: ['If an even shorter window (under 720 px tall) shows a scrollbar, tell me and I will tighten further.'],
};

export const V9141_ZH: ChangelogEntry = {
  version: '9.14.1', date: '2026-09-23', title: '传奇信物说明更准确',
  summary: '传奇卡上的信物写明“送到 10 层得信物”；夜莺的黑胶唱片改为“音乐家提前出现（不必等到 16 层）”。',
  changes: [
    '传奇候客卡的信物一行改为“送到 10 层得信物 · 名字：效果”，说明信物要等传奇在 10 层商店下车后才生效。',
    '黑胶唱片：原来写“音乐家从第 1 层起出现”，但信物在 10 层才拿到，而音乐家平时 16 层才出现；改为“音乐家提前出现（不必等到 16 层）”。规则本身不变：拿到唱片后音乐家立即加入候客。',
  ],
  experiments: ['中英文数字一致性检查与 verify 通过；规则与数值不变。'],
  watch: ['其他信物如果也有容易误解的说法，请截图给我。'],
};

export const V9141_EN: ChangelogEntry = {
  version: '9.14.1', date: '2026-09-23', title: 'Clearer legend keepsakes',
  summary: 'Legend cards say “Deliver to 10F for keepsake”; the Nightingale’s Vinyl Record now reads “Musicians appear early (no need to wait for floor 16)”.',
  changes: [
    'A legend offer card’s keepsake line now reads “Deliver to 10F for keepsake · name: effect”, making clear the keepsake applies only after the legend gets off at the floor-10 shop.',
    'Vinyl Record: it said “Musicians from floor 1”, but the keepsake arrives at 10F and Musicians normally start at 16F; it now reads “Musicians appear early (no need to wait for floor 16)”. The rule is unchanged: Musicians join the offers as soon as you hold the record.',
  ],
  experiments: ['Number-parity check between Chinese and English and verify pass; no rule or value changes.'],
  watch: ['If another keepsake reads confusingly, send a screenshot.'],
};

export const V9142_ZH: ChangelogEntry = {
  version: '9.14.2', date: '2026-09-23', title: '人物卡的“赚/亏”按当前车厢计算',
  summary: '“单独带 赚/亏”改为“上车 赚/亏”：按现在车厢里的人计算这位乘客能带来多少金币；已上车的显示“在车上 赚/亏”。',
  changes: [
    '计算：到站车费，加上他和已上车乘客的配对、邻座加成（在最好的空位上），减去全程电费；再减去他让整车躁动变化的代价（每点每层 3 币）——所以护士旁边有儿童时会变成正数，被照顾的儿童也不再显示大亏。',
    '车厢为空时和原来的“单独带”数值一样；已上车的乘客显示他在当前座位上的价值；车厢满员时不显示。',
    '悬停说明同步更新。',
  ],
  experiments: ['verify 新增：空车厢时等于单独价值；已有恋人时第二位恋人价值明显更高；护士单独 −3、旁边有儿童 +11；儿童单独 −13、旁边有护士 +1。规则与数值不变。'],
  watch: ['数值是估算，不含概率奖励和未来的站位变化；看玩家是否更愿意尝试组合。'],
};

export const V9142_EN: ChangelogEntry = {
  version: '9.14.2', date: '2026-09-23', title: 'Card gain/loss now reflects the current cabin',
  summary: '“Alone ±N” becomes “Board ±N”: what this rider is worth given who is already aboard; riders already aboard read “Aboard ±N”.',
  changes: [
    'Computed as their arrival fare plus pairing and neighbour bonuses with riders already aboard (at the best empty seat), minus the trip’s power, minus the change they cause in the cabin’s agitation (3 coins per point per floor) — so a Nurse beside a Child turns positive and a cared-for Child no longer shows a big loss.',
    'With an empty cabin it matches the old “alone” value; riders aboard show their value in their current seat; it is hidden when the cabin is full.',
    'The hover explanation is updated to match.',
  ],
  experiments: ['New verify checks: empty cabin equals the alone value; a second Lover is worth clearly more beside the first; a Nurse is −3 alone and +11 beside a Child; a Child is −13 alone and +1 beside a Nurse. No rule or value changes.'],
  watch: ['It is an estimate without chance bonuses or future reseating; watch whether players try more combinations.'],
};

export const V9143_ZH: ChangelogEntry = {
  version: '9.14.3', date: '2026-09-23', title: '“送达净收益”与“配对后”双标签；传奇卡不再被裁',
  summary: '人物卡数字改为“送达 净+N”（到站时才结算，不是上车就给钱）；组合型乘客额外显示“配某人 +N”，不再让人因为一个负数就放弃组合；传奇卡按内容自动变高。',
  changes: [
    '措辞：“上车 赚/亏”改为“送达 净+N / 净−N”；会影响躁动的乘客前面有小火苗；悬停说明写明是送到站时的估算。',
    '配对潜力：如果旁边坐上他喜欢的搭档（恋人配恋人、护士配儿童、警察配小偷……），会多一个虚线标签“配恋人 +7”，显示配对后送达的净收益；搭档已经在车上时不显示（当前数值已包含），加成不到 3 币也不显示。',
    '修复：护士长等说明较长的传奇卡在四张同屏时底部被裁；候客列表改为每行至少容纳整张卡，多余高度再平均分配。',
  ],
  experiments: ['逐张测量 8 位传奇 × 4 种窗口尺寸：1366×768 及以上全部无裁切、无滚动；1280×720 时列表出现滚动条但文字不再被裁。verify 新增配对潜力检查（恋人、护士→儿童、搭档已在车上时隐藏、通勤者无提示）。规则与数值不变。'],
  watch: ['每张卡两个数字是否太多，需要试玩判断；如果嫌挤，可以只在悬停时显示“配对后”。'],
};

export const V9143_EN: ChangelogEntry = {
  version: '9.14.3', date: '2026-09-23', title: 'Net-on-delivery plus a paired value; legend cards no longer clipped',
  summary: 'The card number reads “On arrival +N” (settled on delivery, nothing paid on boarding); combination riders also show “w/ partner +N” so one negative number no longer talks players out of a combination; legend cards grow to fit.',
  changes: [
    'Wording: “Board ±N” becomes “On arrival +N / −N”; riders who affect agitation carry a small flame; the hover says it is an estimate at delivery.',
    'Pairing potential: if a partner they like sat beside them (Lover and Lover, Nurse and Child, Officer and Thief…), a dashed tag such as “w/ Lover +7” shows their net on delivery once paired; hidden when that partner is already aboard (the main value covers it) or when pairing adds under 3 coins.',
    'Fix: long legend cards such as the Matron were clipped at the bottom with four cards on screen; each row now fits its whole card and spare height is shared.',
  ],
  experiments: ['Measured all 8 legends at 4 window sizes: no clipping or scrolling at 1366×768 and above; at 1280×720 the list scrolls but no text is cut. New verify checks for pairing potential (Lover, Nurse → Child, hidden when the partner is aboard, none for the Commuter). No rule or value changes.'],
  watch: ['Two numbers per card may be busy; if so, show the paired value on hover only.'],
};

export const V915_ZH: ChangelogEntry = {
  version: '9.15', date: '2026-09-23', title: '炸弹锁定一眼可见；进入夜深前提醒留钱安抚',
  summary: '炸弹倒计时分三种状态显示（已锁住 / 倒计时 / 来不及）；商店在夜深人躁开始前提示建议留多少金币安抚，默认充电也会留出这笔钱。',
  changes: [
    '炸弹：警察在旁边时，倒计时标签变成蓝色带锁的“已锁住 · 5”；没人锁住时是红色“倒计时 5”；倒计时少于剩余站数时变成闪烁的“来不及！”，提醒让警察站到旁边或请离。',
    '商店：下一段有夜深人躁时，充电一栏显示“41–50 层夜深人躁约 +4 躁动 · 安抚 14 币/点 · 建议留 28 币”（约为躁动点数一半的安抚费用），充电量会让余额低于建议时再注明；默认充电量会先留出这笔钱，想多充仍可拖满。',
  ],
  experiments: [
    '试玩记录（9.14.3，44 层，躁动失控，全程收入 614）：前 30 层靠恋人、游客和夜莺打得很稳；40 层商店把 128 金币里的 126 花在充电（20 → 83），带着 2 金币进入 41 层的夜深人躁；41–43 层车厢一直坐满 6 人（每层拥挤 +1）并带两位神秘人，躁动 2 → 4 → 6 → 7 → 9 失控，死时还剩 56 电、40 金币。四个能力（计价器、稳压、并联、飞轮）都偏电量和收入，没有安全余量或隔音门。',
    'verify 新增：炸弹三种显示状态与结算一致（被锁住时倒计时不减）；浏览器中确认 40 层商店显示留钱提示。规则与数值不变。',
  ],
  watch: ['夜深之后仍然主要死于躁动，看留钱提示能否改变选择；如果不够，考虑在上车时提示“第 6 人会让车厢拥挤 +1”。'],
};

export const V915_EN: ChangelogEntry = {
  version: '9.15', date: '2026-09-23', title: 'Bomb locks you can see; keep coins before the late night',
  summary: 'Bomb timers show three states (locked / counting / too late); before late-night unrest the shop suggests how many coins to keep for calming, and the default charge leaves them.',
  changes: [
    'Bomb: with an Officer beside them the timer tag turns blue with a padlock, “Locked · 5”; otherwise it is red, “Timer 5”; when the timer is shorter than the stops left it flashes “Too late!” so you move an Officer beside them or dismiss.',
    'Shop: when the next sector has late-night unrest, the charging step reads “Late-night unrest on 41–50F: about +4 · calming 14c each · keep 28 coins” (calming for about half the unrest), noting when the chosen charge leaves less; the default charge keeps that reserve, and you can still drag to full.',
  ],
  experiments: [
    'Playtest record (9.14.3, 44F, agitation, 614 earned): a steady first 30 floors on Lovers, Tourists and the Nightingale; at the 40F shop 126 of 128 coins went on charging (20 → 83), entering 41F’s late-night unrest with 2 coins; on 41–43F the cabin stayed at 6 (crowding +1 each floor) with two Mysteries, agitation went 2 → 4 → 6 → 7 → 9 and the run ended with 56 power and 40 coins left. All four abilities (Meter, Stabilizer, Relay, Flywheel) were power or income; no Safety Margin or Soundproof.',
    'New verify check: the three bomb states match settlement (a locked timer does not tick); the 40F shop shows the reserve hint in the browser. No rule or value changes.',
  ],
  watch: ['Late runs still end mostly in agitation; see whether the reserve hint changes choices, and if not, warn that a sixth rider adds crowding +1.'],
};

export const V916_ZH: ChangelogEntry = {
  version: '9.16', date: '2026-09-23', title: '快递员带着纸箱上车',
  summary: '快递员出现时多一张“纸箱”卡：纸箱占一个座位、每层耗1电、不付钱，必须挨着快递员；快递员只有带着纸箱才付钱。只上纸箱的话，到站开箱随机得到金币或电。',
  changes: [
    '新卡“纸箱”：快递员出现时紧跟在他后面发出。占一个座位、每层耗 1 电、不付车费；不算任何人的邻座（护士、教练、名人、游客、小费盒都不把它当人），但算在满员拥挤的 6 人里。',
    '相邻规则：快递员和纸箱都在车上时必须上下左右相邻，放到不相邻的位置会被拒绝（“纸箱必须挨着快递员”），换位同样检查。',
    '快递员：车费 3 → 8。纸箱在旁边时到站付车费并补 2 电；纸箱没上车或不在旁边时，每层 +1 躁动（“快递员在找纸箱”），到站不付钱、不补电、也没有小费和打卡计数。纸箱在他到站时一起离开，不算到站乘客。',
    '只上纸箱：到纸箱的目的地时开箱，50% 得 6 金币，50% 得 3 电（按商店基础电价两者等值）。',
    '每层最多一位快递员，所以普通楼层最多 4 张卡，第 1 层加上传奇最多 5 张。请离快递员时纸箱一起离开；快递员和纸箱都不能“留到下一批”，保留的乘客也不会替换掉快递员或纸箱。教学关的快递员不带纸箱。',
    '卡片：快递员显示“配纸箱 ±N”（两张卡合计的送达净收益，已减去纸箱电费）；纸箱在快递员已上车时显示补回他车费和躁动的价值，单独时显示开箱期望减电费。纸箱是普通卡，没有闪卡效果。',
  ],
  experiments: [
    '调参：快递员车费 {3, 6, 8, 10} × 无人认领纸箱 {6 币/3 电, 8/4, 10/6}，外加“没有纸箱”（旧规则），每组 10 种打法 × 300 局 = 3,000 局，共 39,000 局（seed 424242，150 层上限）。',
    '车费 3 时单独上纸箱是主流（熟练型遇到纸箱时 44–82% 只上纸箱），快递员几乎没人要（6–15%）；车费 8、纸箱 6 币/3 电时：快递员上车率 43%，带纸箱配对 42%，只上纸箱 21%，只上快递员 1%，选择最分散，采用这一组。10/8/4 只上纸箱升到 36%，纸箱上车率 86% 越界。',
    '验收（balance:accept，300 局 × 12 组 = 3,600 局，seed 999001）旧规则 → 新规则：均衡型中位 114 → 109 层；快递员上车率 80.5%（越界）→ 约 46%（区间内）；新手 39 → 41；电量致死 1.8% → 6.7%，躁动致死 97.6% → 92.7%；离店金币中位 215 → 187。五种流派强弱比 95.2%，不变。',
    '探索（300 局/打法）：休闲 41 → 53 层（会按卡面把快递员和纸箱一起上）、新手 35 → 41、看净值 98 → 98；熟练型变化在 ±4 层以内。',
    '联动检查：纸箱不是邻座（护士/教练/名人/游客/小费盒/幽灵延误不作用于它）；复制人正上方是纸箱时不复制；车厢事故不会选中纸箱；中转站、谢幕礼、单人小费、计价器、第五位打卡、到站舒缓只算真正到站的乘客；加固（≥5 人）和老周（未满员）按座位计算，纸箱算一个座位。',
    'verify 新增 1 项（共 29 项）：4,000 个发牌包里每层最多一位快递员且纸箱紧随其后、同目的地；配对到站 +8 币 +2 电且纸箱不算到站；没纸箱时 +1 躁动、到站 0 币无补电；无人认领开箱 6 币或 3 电；纸箱不算邻座；不相邻放置被拒绝；请离带走纸箱；两者都不能保留。浏览器中实测拒绝提示、配对到站和开箱 6 币。',
  ],
  watch: ['快递员上车率约 46%、纸箱单独 21%，看真实玩家是否更常只上纸箱；如果单独纸箱成了默认选择，下调开箱金额。', '新手和休闲玩家中位楼层上升（按卡面配对的短途两人组很稳），留意第一周难度是否偏低。'],
};

export const V916_EN: ChangelogEntry = {
  version: '9.16', date: '2026-09-23', title: 'The Courier brings a parcel',
  summary: 'A Courier now comes with an extra Parcel card: it takes a seat, uses 1 power per floor, pays nothing and must sit beside him; he only pays with it. Board the parcel alone and it opens on arrival for coins or power at random.',
  changes: [
    'New card, the Parcel: dealt right after its Courier. Takes a seat, uses 1 power per floor, pays no fare; it is nobody’s neighbour (Nurse, Coach, Celebrity, Tourist and the tip jar ignore it) but counts toward the six riders for crowding.',
    'Adjacency: with both aboard, the Courier and his parcel must sit next to each other (up, down, left or right); other seats are refused (“The parcel must sit beside its Courier”), including moves.',
    'Courier: fare 3 → 8. With his parcel beside him he pays and recharges 2 power on arrival; without it he adds +1 agitation per floor (“Courier looking for his parcel”) and pays nothing on arrival: no recharge, tips or punch card. The parcel leaves with him and is not an arrival.',
    'Parcel alone: opened at its floor for 6 coins (50%) or 3 power (50%), equal value at the base shop price.',
    'At most one Courier per floor, so at most 4 cards on a normal floor and 5 on floor 1 with a legend. A dismissed Courier takes his parcel; neither can be held for the next batch, and a held rider never replaces them. The tutorial Courier carries no parcel.',
    'Cards: the Courier shows “w/ Parcel ±N” (net for both cards on delivery, the parcel’s power included); the Parcel shows the value of restoring his fare and calm when he is aboard, otherwise its expected contents minus power. The Parcel is a plain card without foil.',
  ],
  experiments: [
    'Tuning: Courier fare {3, 6, 8, 10} × unclaimed parcel {6c/3p, 8/4, 10/6}, plus no parcel (old rules); 10 play styles × 300 runs per cell = 3,000 runs, 39,000 in all (seed 424242, 150F horizon).',
    'At fare 3 the parcel alone dominated (skilled styles took only the parcel on 44–82% of offers) and the Courier was rarely taken (6–15%). At fare 8 with 6c/3p: Courier boarded 43%, pair 42%, parcel alone 21%, Courier alone 1%, the widest spread, so it was adopted. 10/8/4 pushed parcel-alone to 36% and parcel boarding to 86%, out of band.',
    'Acceptance (balance:accept, 300 runs × 12 groups = 3,600 runs, seed 999001), old → new: balanced median 114 → 109F; Courier boarding 80.5% (out of band) → about 46% (in band); novice 39 → 41; power deaths 1.8% → 6.7%, agitation deaths 97.6% → 92.7%; median exit coins 215 → 187. Style spread 95.2%, unchanged.',
    'Exploration (300 runs per style): casual 41 → 53F (boards the pair as the card suggests), novice 35 → 41, net-reading 98 → 98; skilled styles within ±4 floors.',
    'Interactions: the parcel is no neighbour (Nurse / Coach / Celebrity / Tourist / tip jar / Ghost delay skip it); a Mimic with a parcel above copies nothing; incidents never pick it; relay, finale, single fare, meter, punch card and arrival relief count real arrivals only; Reinforced (5+) and the Operator (not full) count seats, and the parcel takes one.',
    'verify: one new check (29 in all): across 4,000 packets at most one Courier per floor with his parcel right after and the same destination; paired arrival +8 coins +2 power and the parcel is not an arrival; without it +1 agitation, 0 coins and no recharge; unclaimed opens for 6 coins or 3 power; not a neighbour; non-adjacent placement refused; dismissal takes the parcel; neither can be held. Browser: refusal message, paired delivery and a 6-coin opening confirmed.',
  ],
  watch: ['Courier boarding about 46% and parcel-alone 21%: watch whether real players take the parcel alone more often; if it becomes the default, lower the payout.', 'Novice and casual medians rose (the short paired trip is safe); watch whether the first week gets too easy.'],
};

export const V917_ZH: ChangelogEntry = {
  version: '9.17', date: '2026-09-23', title: '快递员玩法：稀有纸箱、大纸箱、接炸弹，小偷改为偷邻座',
  summary: '纸箱分普通、稀有、传奇，偶尔是占一整列的大纸箱；纸箱可以交给别的空手快递员；小偷、小孩、检查员、维修工、复制人都会和纸箱互动；空手快递员能接过炸弹客的炸弹。小偷改为每层偷每位邻座。',
  changes: [
    '纸箱稀有度：快递员有 16% 带稀有箱、4% 带传奇箱，快递员的卡和箱子同一稀有度，各有新画。箱内价值：普通 6、稀有 12、传奇 24；大纸箱 16、30、60。无主开箱随机给这么多金币或一半的电；快递员带着送达时，车费 8 再加（价值 − 6）。',
    '大纸箱：15% 的快递员带大纸箱，占同一列上下两格（每格每层耗 1 电），上格显示箱子上半、下格显示下半；放好后不能挪，只能撤回重放；任一半挨着快递员都算送达。',
    '别人的纸箱也算：快递员的箱子没上车时，一个无主纸箱挨着他就算他的，他照常付钱。另一位空手快递员也挨着某个快递员的箱子时，两人各 +1 躁动，箱主照常付钱；两位空手快递员挨着同一个无主箱子，谁都不算。',
    '空手快递员接炸弹：空手快递员挨着炸弹客时算满意（不躁动）；他比炸弹客先下车，就带走炸弹、照常付钱，炸弹客变成“乔装的通勤者”（车费不变、没有倒计时，其余按通勤者）。倒计时不会因此暂停，来不及照样失败。',
    '小偷改版：没被警察或律师管住时，每层从每位邻座身上偷 2 金币（警察、律师、教父、传奇人物和纸箱除外），取代原来固定每层 +3；挨着纸箱时不躁动，下车时带走纸箱，给一半箱内金币作小费。',
    '其他人物和纸箱：小孩挨着纸箱时不躁动，下一层把箱子拆开（内容归你，快递员就没箱子了）；检查员验快递员的箱子一次，快递员晚一层到站、多付 5 金币；维修工把无主纸箱拆来当零件，检修立刻完成；复制人正下方挨着纸箱时，复制一个同样的箱子，下车打开。同一层的优先顺序：快递员送达 > 小偷带走 > 小孩拆开 > 维修工拆零件。',
    '卡面去掉重复信息：金额只在“送达 净±N / 配纸箱 ±N”标签里，说明行只写条件；稀有度用宝石和闪卡表示，名字里不再写；座位名按当前语言显示，不再中英文混排。',
  ],
  experiments: [
    '研究轮（上一轮讨论）：“别人的纸箱也算”单独几乎不触发（0–1%），因为快递员只坐 1–3 层；“不见纸箱不下车”能让只上快递员升到 7–10%，但不设上限时最长等 48 层、快递员相关的死亡翻倍，惩罚太重，不采用；“下一层送一个无主箱子”即使 100% 也没改变选择；“没箱子付半价”只让快递员变成便宜的凑数，不采用。',
    '本轮：12 组规则 × 10 种打法 × 300 局 = 36,000 局（seed 424242）。熟练型中位楼层在各组之间差 ±3 层以内；小偷每位邻座偷 1、2、3 币差别不大，取 2；箱子价值 ×1.4 时只上纸箱升到 50%，保持原值（只上纸箱约 26–31%，带快递员一起约 34–46%）。',
    '每种打法 300 局里的触发次数（熟练型）：快递员接炸弹 41–85 次，复制人复制纸箱 9–19，小孩拆箱 239–335，小偷带走纸箱 111–168，检查员验货 8–56，维修工拆零件 0–12，两个快递员争箱子 0–5；稀有/传奇箱被带上车 80–88%，大纸箱 37–55%。',
    '验收（balance:accept，每组 3,600 局，seed 999001）9.16 → 9.17：均衡型中位 109 → 115 层，离店金币中位 190 → 226，新手 41 → 42，五种流派强弱比 95.2% → 96.1%；通过/未通过的项目与 9.16 相同。',
    'verify 新增 1 项（共 30 项）：发牌时稀有度和大纸箱都会出现且快递员与箱子同级；大纸箱占整列、需要两个空位、不能挪、撤回和请离整箱移除；传奇大纸箱送达 8+54；稀有箱开箱 12；别人的纸箱也算；争箱子两人躁动、箱主照常付钱；小偷偷三位邻座 6 币、挨纸箱不躁动并带走得 3 币小费、被警察管住不偷；小孩拆箱；维修工拆零件立刻完成检修；检查员晚一层 +5；复制人复制传奇箱开出 24；空手快递员带走炸弹后炸弹客变乔装通勤者、车费 14，来不及仍会失败。浏览器中实测大纸箱只能放在相邻一列、两格显示上下半、传奇快递员送达显示 62，中英文界面都没有混排。',
  ],
  watch: ['稀有箱让熟练玩家更富、更长（均衡型 +6 层、离店金币 +36），如果试玩也觉得太宽裕，先下调稀有/传奇的价值。', '维修工拆零件和两个快递员争箱子在模拟里很少出现（模拟玩家只看两层，低估后续省电），需要实际试玩判断。', '只上快递员仍然少见，接炸弹是它主要的高风险用法，看真实玩家会不会去赌。'],
};

export const V917_EN: ChangelogEntry = {
  version: '9.17', date: '2026-09-23', title: 'Courier play: rare boxes, crates, bomb hand-offs; the Thief picks pockets',
  summary: 'Boxes come in common, rare and legendary, sometimes as a crate that fills a column; a box can go to another empty-handed Courier; the Thief, Child, Inspector, Mechanic and Mimic all handle boxes; an empty-handed Courier can carry off a Bomber’s bomb. The Thief now steals from every neighbour.',
  changes: [
    'Box rarity: 16% of Couriers bring a rare box and 4% a legendary one; the Courier’s card shares its rarity, each with new art. Contents: common 6, rare 12, legendary 24; crates 16, 30, 60. Unclaimed, a box opens for that many coins or half as much power at random; delivered, the Courier pays his fare of 8 plus (value − 6).',
    'Crates: 15% of Couriers bring a crate that fills the upper and lower seat of one column (1 power per seat per floor); the upper seat shows its top half and the lower seat its bottom half. A seated crate cannot move, only be withdrawn and placed again; either half touching the Courier counts.',
    'Someone else’s box counts: if a Courier’s own box never boarded, an unclaimed box touching him is his and he pays as usual. If another empty-handed Courier also touches a Courier’s box, both add +1 agitation and the owner still pays; two empty-handed Couriers touching one unclaimed box both go without.',
    'Bomb hand-off: an empty-handed Courier beside a Bomber is content (no agitation); if he leaves first he carries the bomb off and pays as usual, and the Bomber becomes a Disguised Commuter (same fare, no timer, otherwise a Commuter). The timer keeps running, so a late hand-off still ends the run.',
    'Thief rework: unless an Officer or Lawyer controls him, he steals 2 coins from each adjacent rider every floor (not Officers, Lawyers, the Don, legends or boxes), replacing the flat +3; beside a box he stays calm and takes it when he leaves, tipping half its coins.',
    'Other riders and boxes: a Child beside a box stays calm and opens it at the next floor (its contents are yours and its Courier loses it); an Inspector checks a Courier’s box once, so the Courier arrives a floor later and pays 5 coins more; a Mechanic uses an unclaimed box for parts and finishes his repair at once; a Mimic right below a box copies an identical one and opens it when leaving. Same-floor priority: Courier delivers > Thief takes > Child opens > Mechanic uses parts.',
    'Cards without repeats: amounts appear only in the “On arrival ±N / w/ box ±N” tags and the line states conditions; rarity shows as the gem and foil rather than in the name; seat names follow the chosen language, with no mixed Chinese and English.',
  ],
  experiments: [
    'Research round (previous discussion): “someone else’s box counts” alone almost never triggers (0–1%) because Couriers ride only 1–3 floors; “won’t leave without a box” raises Courier-alone boarding to 7–10% but, uncapped, one waited 48 floors and Courier-related deaths doubled; too punishing, so it is not used; a stray box on the next floor changed nothing even at 100%; half fare without a box only made him cheap filler and is not used.',
    'This round: 12 rule sets × 10 play styles × 300 runs = 36,000 runs (seed 424242). Skilled median floors stay within ±3 across sets; pickpocketing at 1, 2 or 3 coins per neighbour differs little, so 2; box values ×1.4 push box-alone to 50%, so values stay (box alone about 26–31%, with its Courier about 34–46%).',
    'Triggers per 300 runs per skilled style: bomb hand-off 41–85, Mimic copy 9–19, Child opens 239–335, Thief takes a box 111–168, Inspector checks 8–56, Mechanic parts 0–12, two Couriers disputing 0–5; rare/legendary boxes boarded 80–88%, crates 37–55%.',
    'Acceptance (balance:accept, 3,600 runs per group, seed 999001) 9.16 → 9.17: balanced median 109 → 115F, median exit coins 190 → 226, novice 41 → 42, style spread 95.2% → 96.1%; the same checks pass and fail as in 9.16.',
    'verify: one new check (30 in all): tiers and crates are dealt, Courier and box share a tier; a crate fills a column, needs both seats, cannot move, and leaves whole when withdrawn or dismissed; a legendary crate delivered pays 8+54; a rare box opens for 12; someone else’s box counts; a dispute agitates both and the owner still pays; a Thief takes 6 from three neighbours, stays calm beside a box and tips 3 for it, and takes nothing when controlled; a Child opens a box; a Mechanic’s parts finish his repair; an Inspector adds a floor and +5; a Mimic’s copy of a legendary box opens for 24; a bomb hand-off turns the Bomber into a Disguised Commuter at fare 14, and a late one still fails. Browser: a crate only fits an adjacent column and shows its two halves, a legendary Courier shows 62 on delivery, and neither language mixes in the other.',
  ],
  watch: ['Rare boxes make skilled runs richer and longer (balanced +6 floors, +36 exit coins); if playtests also feel too comfortable, lower rare and legendary values first.', 'Mechanic parts and Courier disputes are rare in simulation (bots look two floors ahead and undervalue later savings); judge them in play.', 'Courier-alone is still uncommon; the bomb hand-off is its main high-risk use, so watch whether real players take the gamble.'],
};

export const V9171_ZH: ChangelogEntry = {
  version: '9.17.1', date: '2026-09-23', title: '审计修复：商店前一层误报断电、炸弹标签、电量预告、英文界面漏翻',
  summary: '一次全面审计：上行保护在 9、19、29…层会把“到商店时电量为 0”误报成断电；炸弹标签不知道快递员会带走炸弹；电量预告漏算纸箱开出来的电；英文界面还有十几处中文。全部修复，规则和数值不变。',
  changes: [
    '上行保护：到达商店楼层（10、20、30…层）时电量正好为 0 本来就不算失败，但保护会报“这一层可能断电”并建议付费补电。现在和结算一致，只在真正会断电时提醒。',
    '炸弹标签：空手快递员拿着炸弹、会在倒计时归零前下车时，标签显示“快递员会带走 · N”，不再显示“来不及！”。',
    '电量预告：下一层可能开箱（无主纸箱到站、小孩拆箱、复制人下车）时，预告上限算上可能开出的电；最坏情况不变。',
    '英文界面漏翻：炸弹倒计时标签和说明、商店的选取/加购/充电记录、商店离开警告、“另 N 项”、“N 条红线”、“确认冒险上行”、“免费选取”、电量说明里的“运转固定 N 电”，以及“名字+到站”连成一个词（MechanicArrival）的问题。数值为 0 的变化统一显示“±0”，不再出现单独的“不变”。',
    '复制人卡：正上方是纸箱时写“↑ 复制纸箱 · 下车打开”，不再误写成“复制纸箱车费 10”。',
  ],
  experiments: [
    '预告与结算对照审计（新增 npm run balance:audit）：7 种打法各 50 局、30,205 次真实上行，逐层比较玩家看到的躁动预告、电量预告、上行保护、炸弹标签和实际结算。躁动预告 0 次偏差；修复前电量预告 604 次偏差（全部是纸箱开出的电）、上行保护在商店前一层误报 304 次、炸弹标签 3 次错误；修复后 23,913 次上行只剩 24 次“保护提醒了但活了下来”，全部是靠纸箱 50% 开出电才活下来，提醒是对的。',
    '英文界面实测：按英文逐层游玩到商店和结束画面，扫描所有文字和提示，发现并修复上述漏翻；中文界面只剩刻意保留的英文装饰标题。',
    'verify 新增 1 项（共 31 项）：商店楼层 0 电不算失败且保护不误报、其他楼层仍会报；炸弹“快递员会带走”状态和来不及的情况；电量预告包含纸箱开出的电；漏翻文案逐条检查。',
  ],
  watch: ['平衡目标仍有长期未达标的项：熟练玩家打得太久（均衡型中位 115 层，目标 55–85）、太富（离店金币中位 226）、几乎都死于躁动（92%）。这是整体节奏问题，不是这次修复的范围。'],
};

export const V9171_EN: ChangelogEntry = {
  version: '9.17.1', date: '2026-09-23', title: 'Audit fixes: false power alarm before shops, bomb label, power forecast, English leaks',
  summary: 'A full audit: on 9F, 19F, 29F… the ascend guard called arriving at a shop with 0 power a failure; the bomb label ignored a Courier carrying the bomb off; the power forecast left out power from opened boxes; and a dozen Chinese strings still reached the English interface. All fixed; rules and values unchanged.',
  changes: [
    'Ascend guard: arriving at a shop floor (10F, 20F, 30F…) with exactly 0 power has never been a loss, yet the guard warned “this floor may run out of power” and suggested paid charging. It now matches settlement and only warns when power really runs out.',
    'Bomb label: when an empty-handed Courier holds the bomb and gets off before the timer runs out, the tag reads “Courier takes it · N” instead of “Too late!”.',
    'Power forecast: when a box may open next floor (an unclaimed box arriving, a Child opening one, a Mimic getting off), the forecast’s upper bound includes the power it may pay; the worst case is unchanged.',
    'English leaks: bomb timer tags and tooltips, shop pick / add-on / charge records, the shop leave warning, “N more”, “N red links”, “Ascend anyway”, “Free pick”, “motor fixed at N” in the power tooltip, and names running into labels (“MechanicArrival”). A zero change now reads “±0” everywhere instead of a bare Chinese “no change”.',
    'Mimic card: under a box it reads “↑ Copies the box · opens it when leaving” instead of a misleading “copies Parcel fare 10”.',
  ],
  experiments: [
    'Forecast-versus-settlement audit (new npm run balance:audit): 7 play styles × 50 runs, 30,205 real ascents, comparing the agitation forecast, power forecast, ascend guard and bomb tag with what settlement did. Agitation forecast: 0 misses. Before the fix: 604 power forecast misses (all box power), 304 false guard alarms on the floor before a shop, 3 wrong bomb tags. After: across 23,913 ascents only 24 “guard warned but the run survived”, each saved by a box paying power on a 50% roll, where the warning is right.',
    'English interface played floor by floor through a shop and the end screen, scanning every text and tooltip; the leaks above were found and fixed. The Chinese interface only keeps its deliberate English decorative headings.',
    'verify: one new check (31 in all): a shop floor with 0 power is not a loss and not flagged, other floors still are; the bomb “Courier takes it” state and the too-late case; box power in the power forecast; each leaked string now translates.',
  ],
  watch: ['Long-standing balance targets are still unmet: skilled players last too long (balanced median 115F, target 55–85), get too rich (median 226 exit coins) and nearly all die of agitation (92%). This is overall pacing, outside this fix.'],
};

export const V9172_ZH: ChangelogEntry = {
  version: '9.17.2', date: '2026-09-23', title: '纸箱内容保密、随机，可能开出能力',
  summary: '纸箱里是什么，到站打开前都看不到；开出的金币或电是随机数，偶尔是一项能力，箱子越稀有越可能。安装位满时可以换下一项，换下的在下次进商店自动卖掉。',
  changes: [
    '内容保密：纸箱卡不再显示“送达 净±N”，座位写“无人认领 · 到站开箱，内容未知”，规则里也不再列出具体数额。快递员的“配纸箱 ±N”仍然显示，因为那是他的送货费，和箱子里的东西无关。',
    '随机内容：开箱时才决定。金币在该稀有度平均值的 0.5–1.5 倍之间随机（普通 3–9、稀有 6–18、传奇 12–36；大纸箱 8–24、15–45、30–90），一半机会换成一半数量的电。小孩拆箱、复制人的复制箱、小偷的小费（一半）也按同样方式随机。',
    '开出能力：普通 3%、稀有 10%、传奇 25%，大纸箱再 +5%。从还没装的能力里随机一项，立刻安装（效果和商店选的一样）。',
    '安装位已满时：弹出选择框，可以换下一项已装能力来装它，换下的能力会在下次进商店时自动卖掉（退 15 金币）；也可以放弃。安全余量在躁动接近上限时不能换下。同一层再开出能力就直接折成 15 金币。选择框出现时不能上行；这一层如果已经输了就不会弹出。',
    '已装能力的说明改用各能力自己的规则文字（修正稳压模块旧说明写成“至少3人”的问题，实际是至少 5 人）；英文界面的已装能力列表不再中英混排。',
  ],
  experiments: [
    '10 种打法 × 300 局 × 3 组（不出能力 / 当前概率 / 概率翻倍）= 9,000 局：熟练型中位楼层三组之间差 ≤ 3 层；当前概率下熟练型每局平均开出 0.36 项能力，其中 0.16 次遇到安装位已满要选择；翻倍时 0.64 项。保持当前概率，让能力是惊喜而不是常态。',
    '验收（3,600 局）：均衡型中位 116 层（9.17.1 为 115），离店金币中位 234（226），通过/未通过的项目不变。预告审计 12,268 次上行：没有一次断电是保护没提醒的。',
    '浏览器实测：纸箱卡没有数值标签、座位写“内容未知”；开出能力会直接安装；装满 6 项时弹出选择框，全英文，换下后提示“下次进商店卖掉”；本层失败时不弹出。',
    'verify 新增 1 项（共 32 项）：3,000 次开箱的金币都在 3–9 之间，能力出现次数 普通 < 稀有 < 传奇 < 传奇大纸箱；装满时能力进入待选；放弃保留原能力；替换后下次进商店卖出退 15 金币。',
  ],
  watch: ['能力大约每三局才开出一次，如果试玩觉得太少，可以把概率提高到翻倍那一档（模拟里对平衡没有明显影响）。'],
};

export const V9172_EN: ChangelogEntry = {
  version: '9.17.2', date: '2026-09-23', title: 'Box contents hidden, random, sometimes an ability',
  summary: 'What a box holds stays hidden until it opens; coins or power are rolled at random, and sometimes it is an ability, likelier for rarer boxes. With every slot full you can swap one out, and the one removed is sold at the next shop.',
  changes: [
    'Hidden contents: box cards no longer show “On arrival ±N”, the seat reads “Unclaimed · opens on arrival, contents unknown”, and the rules no longer list amounts. The Courier’s “w/ box ±N” stays, since it is his delivery fee, not the contents.',
    'Random contents, rolled on opening: coins between 0.5 and 1.5 times the tier’s average (common 3–9, rare 6–18, legendary 12–36; crates 8–24, 15–45, 30–90), or half as much power half the time. Child openings, the Mimic’s copy and the Thief’s tip (half) roll the same way.',
    'Abilities in boxes: common 3%, rare 10%, legendary 25%, crates +5%. A random ability not yet installed, installed at once with the same effect as a shop pick.',
    'With every slot full: a dialog lets you swap an installed ability out for it, the one removed being sold automatically at the next shop (15 coins back), or pass. Safety Margin cannot be removed while agitation is near the cap. A second ability found the same floor is sold at once for 15 coins. You cannot ascend while the dialog is open, and it does not appear once the run is lost.',
    'Installed-ability summaries now use each ability’s own rule text (fixing the Stabilizer line that still said “at least 3 riders”; the rule is 5), so the English kit list no longer mixes languages.',
  ],
  experiments: [
    '10 play styles × 300 runs × 3 settings (no abilities / current odds / doubled odds) = 9,000 runs: skilled median floors within 3 across settings; at current odds a skilled run finds 0.36 abilities on average, 0.16 of them with every slot full; doubled odds give 0.64. Current odds kept so an ability stays a surprise.',
    'Acceptance (3,600 runs): balanced median 116F (115 in 9.17.1), median exit coins 234 (226); the same checks pass and fail. Forecast audit over 12,268 ascents: no power loss went unwarned.',
    'Browser: box cards show no value tag and seats read “contents unknown”; found abilities install at once; with six installed the dialog appears in full English and a swap reports the sale at the next shop; it does not appear on a losing floor.',
    'verify: one new check (32 in all): 3,000 common rolls all fall within 3–9; abilities appear common < rare < legendary < legendary crate; a full kit makes the ability wait; passing keeps the old kit; swapping sells the removed ability on entering the next shop for 15 coins.',
  ],
  watch: ['An ability turns up about once every three runs; if playtests find that too rare, the doubled odds had no visible balance effect in simulation.'],
};
