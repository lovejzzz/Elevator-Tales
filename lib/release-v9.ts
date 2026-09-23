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
