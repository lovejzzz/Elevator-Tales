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

export const V918_ZH: ChangelogEntry = {
  version: '9.18', date: '2026-09-23', title: '炸弹实时倒计时，后期压力改为躁动+电力，模拟器按真人校准',
  summary: '炸弹客改为实时秒数倒计时，车费 30，还有拆弹奖金；夜深人躁封顶从 +4 降到 +3，51 层起电机每 8 层多耗 1 电，后期死因不再几乎全是躁动；模拟器新增按真实试玩记录校准的“真人型”玩家。',
  changes: [
    '炸弹客实时倒计时：上车（放进电梯）后开始按真实秒数倒数，10 秒 + 每站 10 秒；高躁动时两倍速；归零立即失败，最后 10 秒每秒响一声并闪烁，爆炸时车厢震动。切到别的页面、进商店、打开帮助/档案/更新记录/已装能力、或正在选择纸箱能力时暂停；看人物卡时不暂停。相邻警察仍然锁住倒计时，空手快递员仍能带走炸弹。可以用网址参数调秒数：?bomb=6（每站 6 秒）、?bomb=15，?bomb=off 恢复按层计数。',
    '炸弹客奖励：车费 14 → 30；送达时每剩 3 秒多付 1 金币“拆弹奖金”。乔装的通勤者保留 30 车费。',
    '夜深人躁：封顶从每层 +4 改为 +3（41 层起每三层 +1，56 层起每两层，71 层起每层，86 层起 +2，101 层起 +3）。',
    '电机：51 层起每 8 层多耗 1 电（51 层 3 电、59 层 4 电……），原来 11 层以后固定 2 电；运转说明改为一句规则。',
  ],
  experiments: [
    '模拟器校准：从对话记录中取出 6 份真实试玩记录（15、29、32、32、44、71 层），对比与版本无关的习惯。真人平均每层 4.8 人、63% 楼层处在低躁动、27% 高躁动、出商店只剩约 2 金币（把钱全充成电）、配电箱先升蓄电；三次躁动死亡都发生在刚出商店、电量 56–80 却没钱安抚、车厢坐满时。新增“真人型”玩家：按卡面净值挑人、不带小偷和醉汉、坐满 6 人、不做下一层预判、不在途中花钱安抚、商店先充满再升蓄电。校准后 4.5 人 / 68% 低躁动 / 15% 高躁动 / 剩 13 金币；新版规则下中位 66 层（p10 39、p90 95）。样本少且多来自早期版本，npm run balance:calibrate 可随新记录重新校准。',
    '夜深人躁研究（两轮，共 15 组 × 7 类玩家 × 300 局）：按人数计算的夜深人躁会让熟练玩家夜里少载人而打满 150 层，只惩罚不懂的人，不采用；加入后期电机加耗最能分散死因。采用“封顶 +3 + 51 层起每 8 层 +1 电”：熟练型中位 105 → 100 层，死因 躁动/断电 从 98%/1% 变为 75%/24%，真人型不变（65 层）。',
    '炸弹研究（按层计数，模拟器没有真实时间）：车费 30 让炸弹客上车率 60% → 72%；高躁动两倍速让请离炸弹客 0.11 → 0.48 次/局、炸弹致死 23 → 57 局（每组 2,100 局）。实时倒计时对真人的压力模拟器测不出来，需要试玩确定秒数。',
    '验收（3,600 局）9.17.2 → 9.18：均衡型中位 116 → 100 层，死因 断电/躁动/炸弹 2.9/96.6/0.5% → 29.2/69.1/1.7%，离店金币中位 234 → 125，人物上车率全部回到 15–65% 区间；五种流派强弱比 99%。预告审计 11,103 次上行：没有一次断电是保护没提醒的。',
    'verify 新增 1 项（共 33 项）：发牌秒数 = 10 + 10 × 站数；扣时、警察锁住、归零失败；上行结算不再按层减倒计时；剩 9.5 秒送达得 3 金币拆弹奖金；“来不及”按每站 3 秒判断；商店里不计时。浏览器实测：计时每秒减少，打开帮助时暂停，归零后显示结束画面且只有一个对话框。',
  ],
  watch: ['实时炸弹的秒数：先试 ?bomb=6 / 10（默认）/ 15 几种，看哪种“刺激但不冤”。', '熟练玩家仍然能打到 100 层左右；按真人型看普通玩家约 66 层，需要更多现行版本的真实记录确认。', '离店金币仍高于目标，但真人本来就会把钱全换成电，这项目标可能要按真人型重新定。'],
};

export const V918_EN: ChangelogEntry = {
  version: '9.18', date: '2026-09-23', title: 'Real-time bomb timers, late pressure split between agitation and power, simulator calibrated to real players',
  summary: 'Bomb Carriers now count down in real seconds, pay 30 and add a defusal bonus; late-night unrest caps at +3 instead of +4 and the motor costs 1 more power every 8 floors from 51F, so late deaths are no longer almost all agitation; the simulator gains a “human” player calibrated to real playtest records.',
  changes: [
    'Real-time Bomber timer: once aboard, it counts real seconds, 10 plus 10 per stop, at double speed at high agitation; zero ends the run, the last ten seconds tick and flash, and an explosion shakes the cabin. It pauses on another tab, in a shop, in the help / archive / changelog / kit dialogs and while choosing a box ability, but not while reading rider cards. An adjacent Officer still locks it and an empty-handed Courier can still carry the bomb off. Tune it with the URL: ?bomb=6 (6 seconds a stop), ?bomb=15, or ?bomb=off for floor timers.',
    'Bomber reward: fare 14 → 30; on delivery each 3 seconds left pay 1 coin as a defusal bonus. The Disguised Commuter keeps the 30 fare.',
    'Late-night unrest caps at +3 per floor instead of +4 (every third floor from 41F, every second from 56F, every floor from 71F, +2 from 86F, +3 from 101F).',
    'Motor: from 51F it costs 1 more power every 8 floors (51F: 3, 59F: 4 …), instead of a flat 2 after 10F; the schedule is stated as one rule.',
  ],
  experiments: [
    'Simulator calibration: six real playtest records (15, 29, 32, 32, 44, 71F) taken from our conversation, compared on version-independent habits. Players seat 4.8 riders a floor, spend 63% of floors at low and 27% at high agitation, leave shops with about 2 coins (everything into power) and level storage first; all three agitation deaths came right after a shop, with 56–80 power, no coins for calming and a full cabin. A new “human” bot reads card values, skips Thieves and Drifters, fills six seats, does not preview the next floor, never buys calming in transit, and charges to the cap before storage. Calibrated: 4.5 riders, 68% low, 15% high, 13 coins kept; median 66F under the new rules (p10 39, p90 95). The sample is small and mostly from earlier versions; npm run balance:calibrate refits with new records.',
    'Night-unrest study (two rounds, 15 settings × 7 player types × 300 runs): unrest that follows the cabin let skilled players seat fewer riders at night and reach 150F, punishing only players who did not know, so it was dropped; late motor pressure spreads deaths best. Adopted: cap +3 plus +1 power every 8 floors from 51F. Skilled median 105 → 100F, deaths agitation / power 98% / 1% → 75% / 24%; the human bot is unchanged (65F).',
    'Bomb study (floor timers; the simulator has no real time): fare 30 lifts Bomber boarding 60% → 72%; double speed at high agitation raises Bomber dismissals 0.11 → 0.48 a run and bomb deaths 23 → 57 (per 2,100 runs). The pressure of a real-time timer on people cannot be simulated; the seconds need playtesting.',
    'Acceptance (3,600 runs) 9.17.2 → 9.18: balanced median 116 → 100F, deaths power / agitation / bomb 2.9 / 96.6 / 0.5% → 29.2 / 69.1 / 1.7%, median exit coins 234 → 125, every rider’s boarding rate back within 15–65%; style spread 99%. Forecast audit over 11,103 ascents: no power loss went unwarned.',
    'verify: one new check (33 in all): dealt seconds = 10 + 10 × stops; ticking, Officer lock and zero ending the run; settlement no longer counts floors; 9.5 seconds left pay a 3-coin defusal bonus; “too late” at 3 seconds a stop; no ticking in a shop. Browser: the timer drops each second, pauses with help open, and at zero the end screen shows as the only dialog.',
  ],
  watch: ['Real-time bomb seconds: try ?bomb=6 / 10 (default) / 15 and report which feels thrilling but fair.', 'Skilled players still reach about 100F; the human bot puts ordinary players near 66F, to be confirmed with more records on the current version.', 'Exit coins remain above target, but real players spend everything on power, so that target may need to be set on the human bot.'],
};

export const V9181_ZH: ChangelogEntry = {
  version: '9.18.1', date: '2026-09-23', title: '大纸箱整卡、小偷按人偷钱并有动画、开箱小票、结束动画',
  summary: '按试玩反馈修改：大纸箱是一整张跨两格的卡，没有中间接缝；小偷按邻座口袋偷不同的钱，每层有金币飞过去的动画；开出电或能力时小票照实显示；人物耗电带减号；“险！”改成红色“危！”；无解的补电按钮变灰；输的时候先播结束动画。',
  changes: [
    '大纸箱：换成一整个没有接缝的高包裹（普通、稀有、传奇三张新画），在车厢里画成一张跨上下两格的整卡，不再被切成上下两半拉伸；拖拽时影子是两格高，放置时整列一起高亮，松手飞进整列。',
    '小偷：每层按邻座口袋偷钱——名人 4，游客、神秘人、百变人 3，大多数人 2，维修工、护士、儿童、醉汉、驱魔师、检查员、小偷 1，幽灵偷不到；每笔钱都有一枚金币从被偷的人飞向小偷，小偷头上弹出“顺手牵羊 +N”。',
    '开箱小票：纸箱开出电时显示“+N 电”，开出能力时显示能力名，不再显示“+0 金币”。',
    '人物卡和座位上的耗电数字前加减号（−1、−2）。',
    '险情字幕从“险！”改为红色“危！”（英文 Danger!）。',
    '断电警告：钱或额度不够时“补电”按钮彻底变灰；无论怎么安排都会断电时，警告框文字居中。',
    '结束动画：断电时灯光闪烁熄灭、轿厢下坠；躁动失控时红光脉冲、车厢摇晃；炸弹爆炸时白光爆闪；约 1.7 秒后再弹出结算。',
    '修复：窄屏布局下稀有、传奇座位的闪卡层会把名字挤到下方（被数值栏挡住）。',
  ],
  experiments: [
    '试玩截图里炸弹客还显示“层数”，是因为页面仍是 v9.17.2 的缓存（实时倒计时在 v9.18 上线）；强制刷新即可看到读秒。',
    '新试玩记录（v9.17.2，49 层断电，全程收入 558）加入校准数据，现有 7 份：真人每层 4.9 人、61% 低躁动、29% 高躁动、出商店剩约 5 金币；真人型模拟玩家中位 72 层。',
    '验收（3,600 局）：均衡型中位 100 层，死因 断电/躁动/炸弹 28.5/69.5/2.0%，与 9.18 一致（小偷平均每位邻座仍约 2 金币）。',
    'verify 新增 1 项（共 34 项）：名人 4 + 幽灵 0 + 儿童 1 = 5 金币并记录每一笔；开出电的小票写电量、开出能力的小票写能力。浏览器实测：金币 +4、+3、+1 从三位邻座飞向小偷并弹出“顺手牵羊 +8”；传奇大纸箱整卡占满一列；无解时补电按钮灰色且文字居中；断电先播熄灯动画再弹结算。',
  ],
  watch: ['大纸箱整卡在各种屏幕宽度下的排版，需要在你的大屏上再看一眼。'],
};

export const V9181_EN: ChangelogEntry = {
  version: '9.18.1', date: '2026-09-23', title: 'One-piece crates, pocket-based pickpocketing with animation, box receipts, ending animations',
  summary: 'From playtest feedback: a crate is one card across two seats with no seam; the Thief steals by each neighbour’s pockets with coins flying every floor; receipts show power or abilities; rider power shows a minus sign; the close-call banner is a red “Danger!”; hopeless charge buttons turn grey; a lost run plays its ending first.',
  changes: [
    'Crates: redrawn as one tall seamless parcel (new common, rare and legendary art) and drawn as a single card spanning the upper and lower seat instead of two stretched halves; dragging shows a two-seat ghost, placing highlights the whole column, and it lands on the column.',
    'Thief: steals by pocket each floor — Celebrity 4; Tourist, Mystery, Shifter 3; most riders 2; Mechanic, Nurse, Child, Drifter, Warden, Inspector, Thief 1; nothing from a Ghost; each coin flies from the victim to the Thief, who shows “Pickpocket +N”.',
    'Box receipts: a box holding power shows “+N power”, one holding an ability shows its name, instead of “+0 coins”.',
    'Rider power on cards and seats carries a minus sign (−1, −2).',
    'The close-call banner is now a red “Danger!” instead of “Close call!”, in both languages.',
    'Power alert: a charge the wallet or cap cannot cover turns fully grey; when no arrangement survives, the alert text is centred.',
    'Endings: running out of power flickers the lights out and drops the car; an agitation loss pulses red and shakes; a bomb flashes white; the result card follows about 1.7 seconds later.',
    'Fix: in the narrow layout the foil on rare and legendary seats pushed the name down under the numbers.',
  ],
  experiments: [
    'The Bomber still counted floors in the screenshots because the page was a cached v9.17.2 (the real-time timer shipped in v9.18); a hard refresh shows seconds.',
    'The new record (v9.17.2, 49F, power, 558 earned) joins the calibration data, now 7 runs: 4.9 riders a floor, 61% low and 29% high agitation, about 5 coins kept after shops; the human bot’s median is 72F.',
    'Acceptance (3,600 runs): balanced median 100F, deaths power / agitation / bomb 28.5 / 69.5 / 2.0%, matching 9.18 (the Thief still averages about 2 coins a neighbour).',
    'verify: one new check (34 in all): Celebrity 4 + Ghost 0 + Child 1 = 5 coins with each theft recorded; power and ability receipts. Browser: coins +4, +3, +1 fly from three neighbours to the Thief and “Pickpocket +8” pops; a legendary crate fills its column as one card; a hopeless alert greys its button and centres its text; a power loss plays the lights-out ending before the result card.',
  ],
  watch: ['The crate card’s layout at every screen width, to be checked again on a large screen.'],
};

export const V9182_ZH: ChangelogEntry = {
  version: '9.18.2', date: '2026-09-24', title: '规则看得见：车费明细、偷钱连线、幽灵作祟、炸弹引线；受管小偷帮忙降躁动',
  summary: '人物详情列出到站收入的每一项；小偷的偷钱关系画成金色连线；幽灵作祟会预告并有动画；炸弹客头上是一颗带两位小数读秒和燃烧引线的炸弹；被警察或律师管住的小偷改为每层帮全车 −1 躁动。',
  changes: [
    '人物详情新增“到站收入怎么算”：基础车费、配对、邻座、倍率、小费、默契等逐项列出并合计，和结算用同一份计算。游客旁边有纸箱时写明“纸箱不算邻座”；纸箱不再和任何人连线（之前放在游客旁边会错误显示“联动已生效”）。',
    '小偷：没被管住时，他和每位邻座之间画金色虚线，标出这层能偷多少（🪙+4），盯上的纸箱标📦。被警察或律师管住时不再偷钱，改为每层帮全车 −1 躁动（到站 +5 保留），座位上写明“被管住 · 不偷钱 · 全车 −1躁动/层”。',
    '幽灵：没被镇压时座位写“下一层会拖延邻座 1 站”或“N 层会拖延邻座 1 站”；作祟那一层，一缕紫色幽魂带着“+1站”飞向被拖延的人，被拖延的座位闪紫光。',
    '炸弹客：座位上是一颗炸弹，电子屏显示两位小数的秒数，燃烧的引线随剩余时间变短并有火花，燃烧时发出滋滋声；最后 10 秒变红闪烁；警察锁住时变成静止的蓝色。顺利下车时播放一段专门的上扬和弦并弹出“拆弹成功！”，到站数字包含拆弹奖金。爆炸时白光、两道冲击波、多色火花和飞散碎片。',
    '“本次变化明细”里的到站乘客列表：纸箱开出电或能力时照实写出，不再是“+0 金币”。',
    '座位上的名字和“还剩 N 站”都居中对齐，“还剩 N 站”加了深色底。窄屏布局也会显示炸弹。',
  ],
  experiments: [
    '受管小偷降躁动（每组 7 类玩家 × 300 局）：每层 −0 / −1 / −2 时均衡型带小偷 38% / 43% / 45%，警察 22% / 23% / 24%，楼层与死因基本不变；取 −1。',
    '车费拆成明细后，用旧算法对照随机生成的 88,021 笔车费，差异 0。',
    '新试玩记录（v9.18，59 层躁动，全程收入 792）加入校准数据，现有 8 份；真人型模拟中位 72 层。',
    '试玩说明：截图里第 9 层两个小偷都挨着 4 号位的警察，被管住的小偷不偷、也不拿纸箱，所以箱子没被带走；这一点现在会在座位上写明。截图里开箱显示“+0 金币”、小偷“每位邻座 +2”是 v9.18 的旧版，v9.18.1 已修改。',
    'verify 新增 1 项（共 35 项）：偷钱连线金额（名人 4、幽灵 0、被管住不偷、纸箱📦）；纸箱不连线；明细合计等于车费且纸箱不算邻座；作祟记录；受管小偷 −1 躁动；炸弹客总秒数。浏览器实测：幽灵预告与紫色幽魂、拆弹成功动画、炸弹引线与读秒、名字与站数居中、游客明细“8 + 2×2 = 12”。',
  ],
  watch: ['警察+小偷降躁动是否会形成新打法；如果太弱，可以改为每层 −2（模拟里仍平衡）。'],
};

export const V9182_EN: ChangelogEntry = {
  version: '9.18.2', date: '2026-09-24', title: 'Rules you can see: fare lines, pickpocket links, haunting, a burning fuse; a held Thief calms the cabin',
  summary: 'The rider sheet itemises the arrival fare; the Thief’s pickpocketing is drawn as gold links; a Ghost announces and shows its haunting; the Bomber carries a bomb with a two-decimal readout and a burning fuse; a Thief held by an Officer or Lawyer now lowers the cabin’s agitation by 1 each floor.',
  changes: [
    'Rider sheet: “How the arrival fare adds up” lists base fare, pairing, neighbours, multipliers, tips and bonds with a total, from the same calculation settlement uses. A Tourist beside a box shows “Boxes are not neighbours”; a box no longer links to anyone (it used to show a false “link active” next to a Tourist).',
    'Thief: unheld, a gold dashed link runs to each neighbour with this floor’s take (🪙+4), and 📦 to a box he eyes. Held by an Officer or Lawyer he stops stealing and lowers the cabin’s agitation by 1 each floor (the +5 on arrival stays), and his seat says so.',
    'Ghost: unsubdued, its seat reads “Delays a neighbour 1 stop next floor” or “at NF”; when it strikes, a violet wisp carrying “+1 stop” drifts to the delayed rider, whose seat flashes violet.',
    'Bomber: the seat shows a bomb with a two-decimal seconds readout and a burning fuse that shortens with the time left, sparking and crackling; the last ten seconds flash red; an Officer’s lock turns it a still blue. A safe arrival plays its own rising chord and “Defused!”, and the arrival figure includes the defusal bonus. An explosion flashes white with two shockwaves, coloured sparks and flying debris.',
    'Decision receipt: arrivals list power or an ability for opened boxes instead of “+0 coins”.',
    'Seat names and “N stops left” are centred, the stops tag sits on a dark pill, and the compact layout shows the bomb.',
  ],
  experiments: [
    'Held-Thief calming (7 player types × 300 runs per setting): at −0 / −1 / −2 a floor the balanced bot boards Thieves 38% / 43% / 45% and Officers 22% / 23% / 24%, with floors and death causes about unchanged; −1 adopted.',
    'The itemised fare matches the previous calculation on 88,021 random fares, 0 differences.',
    'The new record (v9.18, 59F, agitation, 792 earned) joins the calibration data, now 8 runs; the human bot’s median is 72F.',
    'Playtest note: on floor 9 both Thieves sat beside the Officer in seat 4, so they were held and took neither coins nor the box; seats now say so. The “+0 coins” box and “+2 per neighbour” Thief in the screenshots were v9.18 and changed in v9.18.1.',
    'verify: one new check (35 in all): pickpocket link amounts (Celebrity 4, Ghost 0, none when held, 📦 for a box); boxes never link; fare lines sum to the fare and skip boxes; haunts recorded; held Thief −1 agitation; the Bomber’s total seconds. Browser: Ghost forecast and wisp, defusal animation, fuse and readout, centred names and stops, the Tourist’s “8 + 2×2 = 12”.',
  ],
  watch: ['Whether Officer + Thief calming becomes its own style; if too weak, −2 a floor also stayed balanced in simulation.'],
};

export const V9183_ZH: ChangelogEntry = {
  version: '9.18.3', date: '2026-09-24', title: '看得清的连线、开箱动画、更干净的音效；好箱子送得更远',
  summary: '连线上的金额改到人物前面，带金币图标和“金币”单位；纸箱无论怎样打开都在原地播放开箱动画；车厢事故会显示是谁提前下车；商店不再一变化就改变大小；音效去掉了爆音和沙沙声。快递员的路程按箱子稀有度拉长，远路多付钱。',
  changes: [
    '连线标签：从被拉伸的图形文字改成人物上方的一层标签，不会被人物挡住；金额带金色金币图标，写成“+2 金币”；红线写成“−2 金币”“🔥 +1”等。',
    '小偷：不再和游客、检查员之间有“−2 金币”红线，连线上只显示他偷到的“+N 金币”；被警察管住时，把游客放到他旁边也不会再出现“−2”。游客的红线改为醉汉（🔥 +1）。座位上写“顺手牵羊 +N金币/层”，偷钱动画也写“+N 金币”。',
    '单位：人物卡上“送达 净+10 金币”“配快递员 +14 金币”；各人物能力行的金额都加上“币”（通勤者、游客、音乐家、儿童、名人、检查员、月老、教父、夜莺、大亨）；暂存写成“暂存 N 币”；红线写成“红线 −2金币”。',
    '开箱动画：纸箱被小孩拆开、到站无人认领、被复制人打开、被维修工拆成零件时，都在它原来的位置弹出纸箱、盖子飞起、火花，再浮出里面的东西（金币、电或能力）；被小偷带走时纸箱飞到小偷身上。到站卡片上“+4 电”不再把“电”挤到下一行。',
    '神秘人：不再显示“20–24”这样的车费档位，改成“车费”后面一串跳动的乱码，到站才揭晓；座位和卡面上的“?”也换成乱码。复制人复制神秘人时同样保密（之前会露出数字）。',
    '复制人：复制正上方乘客实际的车费，不再叠加自己的短途折扣。复制人在炸弹客下面时车费 30（之前 30 × 0.8 = 24，看起来像没复制）。',
    '快递员：箱子越好送得越远——普通 1–4 站，稀有 2–5 站，传奇 3–6 站，大纸箱再多 1 站（31 层、51 层后的路程加长照常叠加）；带着箱子送达时，路程超过 2 站的部分每站多付 3 金币，收入明细里写成“长途送货 N 站”。',
    '车厢事故：高躁动时 20% 的事故里提前下车的乘客，现在和到站乘客一样出现在原位，红色卡片写“提前下车 · 受不了混乱 · 未付车费”，座位闪红光；“本次变化明细”里单独一栏。',
    '进商店那一层不再闪红色“危！”（商店会补电和安抚）。',
    '商店：窗口固定大小，选能力、充电、升级配电箱都不会再改变窗口；选过的能力卡留在原位标“已装上”，不再消失让其他卡挤过来；所有按钮都有悬停上浮、发光和按下回弹；充电时电量框发光并飘出“+N 电”，升级配电箱时那一行跳动，安抚时躁动框发光。',
    '音效：去掉了原来 −18 dB 的压缩器（它会自动把声音再放大约 8 dB，连带放大了尖锐的起音和混响里的沙沙声），改成只在接近满幅时才压的限幅器，再加一道 11 kHz 低通；“收银”改回合成音（筹码堆叠的录音听起来像爆音，每层收入满 20 都会响，每位炸弹客到站都会触发）；其余录音音量减半；铃声去掉 9 kHz 以上的泛音；引线声改成柔和的中频噼啪；拆弹和弦去掉开头的噪声；新增开箱音效；同时超过 40 个声音时跳过装饰性的音效。',
  ],
  experiments: [
    '音效离线渲染（开发版里的 renderSfxOffline，用同一条混音链渲染后测峰值和相邻采样最大跳变）：设想中最吵的一层结束（关门、嗡鸣、3 次引线、开门、铃、拆弹、收银、10 声金币、开箱、纪录、盖章）峰值 0.76 → 0.32，最大跳变 0.84 → 0.17；单独“收银” 0.71 → 0.13，“金币” 0.44 → 0.19。',
    '快递员路程（6 类玩家 × 250 局 × 11 组）：只把路程拉长到 2–4/3–5/4–6 且不加钱，均衡型带快递员 41% → 16%，新手 48 → 33 层；1–3/2–4/3–5 加每站 2 金币为 42% / 41 层；采用 1–4/2–5/3–6 加每站 3 金币：37% / 41 层，均衡型 100 层不变。',
    '验收（14 组 × 300 局，同一种子，对照 v9.18.2）：均衡型中位 100 → 100 层，死因电量 / 躁动 / 炸弹 32.2 / 66.2 / 1.6% → 30.4 / 67.8 / 1.8%；新手 43 → 41；真人型 71 → 67；均衡型离店金币 226 → 206；上车率全部在 15–65%。预测审计 22,439 次上行：上行警告 12 次后来撑过去了（与之前相当）。',
    '新试玩记录（v9.18.2，81 层躁动，全程收入 1100）加入校准数据，现有 9 份（15–81 层）。',
    '试玩说明：记录里第 74 层炸弹客还剩 1 站、躁动 6（高躁动），下一层他不见了而金币没变——这是高躁动 20% 的车厢事故让他提前下车；以前只在一行文字里提到，现在会显示。第 76 层上车的炸弹客在第 77 层被请离（花 8 币）。',
    'verify 新增 1 项（共 36 项）：复制人照抄炸弹客 30；各稀有度路程范围；长途送货费（5 站付 3 站的钱，没箱子不付）；小孩开箱记录；事故记录。红线表改为 29 对（去掉小偷—游客、小偷—检查员，加游客—醉汉）。浏览器实测：连线标签在人物前、被管住的小偷旁放游客没有“−2”、三位邻座“+2/+2/+1 金币”、小孩开两个箱子的动画、复制人“+11 金币”一行、事故卡片、进商店不闪“危”、商店窗口 1229×787 全程不变、英文界面没有中文残留。',
  ],
  watch: ['快递员路程加长后上车率 37%（之前 42%），留意试玩里是否太少人带快递员。', '开箱动画和到站卡片同时出现时是否太挤。', '手机窄屏上横向连线标签会压到下面一排的数字栏上沿。'],
};

export const V9183_EN: ChangelogEntry = {
  version: '9.18.3', date: '2026-09-24', title: 'Readable links, box-opening animations, cleaner sound; better boxes travel farther',
  summary: 'Link amounts now sit above the riders with a gold coin and the word “coins”; every box that opens plays an animation where it sat; an incident shows who left early; the shop no longer changes size as you use it; sound effects lose their crackle and hiss. Couriers ride farther for better boxes and are paid for the extra stops.',
  changes: [
    'Link labels: a layer above the riders instead of stretched vector text, so riders never cover them; money shows a gold coin icon and reads “+2 coins”; red links read “−2 coins”, “🔥 +1” and so on.',
    'Thief: no more “−2 coins” red link with the Tourist or the Inspector, so a link shows only what he steals (“+N coins”); with an Officer holding him, seating a Tourist next to him no longer shows “−2”. The Tourist’s red link is now the Drifter (🔥 +1). His seat reads “Picking pockets +N coins/floor” and the pickpocket animation says “+N coins”.',
    'Units: card tags read “On arrival +10 coins” and “w/ Courier +14 coins”; ability lines name coins (Commuter, Tourist, Musician, Child, Celebrity, Inspector, Matchmaker, Don, Nightingale, Tycoon); banked coins read “Banked N coins”; red links “Red link −2 coins”.',
    'Box animation: when a Child opens a box, an unclaimed box reaches its floor, a Mimic opens his copy or a Mechanic strips one for parts, the box pops up where it sat, its lid flies off, sparks burst and the contents rise out (coins, power or an ability); a box a Thief takes flies to him. Exit receipts keep “+4 power” on one line.',
    'Mystery: no more fare band such as “20–24”; the card reads “Fare” followed by a flickering scramble until arrival, and the “?” on the seat and card scrambles too. A Mimic copying a Mystery stays sealed (it used to show the number).',
    'Mimic: copies the fare above exactly as that rider is paid, without its own short-trip discount. Under a Bomber a Mimic now gets 30 (it was 30 × 0.8 = 24, which looked like no copy).',
    'Courier: better boxes travel farther: common 1–4 stops, rare 2–5, legendary 3–6, a crate 1 more (the longer trips from floors 31 and 51 still add). Delivering his box, he pays 3 coins more per stop beyond 2, shown as “Long route: N stops” in the fare lines.',
    'Incidents: a rider who leaves early in a high-agitation incident (20%) now appears in place like an arrival, on a red card “Left early · Chaos · no fare”, and the seat flashes red; the decision receipt lists it separately.',
    'Arriving at a shop no longer flashes the red “Danger!” banner (the shop recharges and calms).',
    'Shop: a fixed-size window, so picking an ability, charging or upgrading the power box never resizes it; a chosen ability card stays in place marked “Installed” instead of vanishing and letting the others shift; every button lifts, glows and presses in; charging makes the power panel glow with “+N power”, a box upgrade bumps its row and calming glows the agitation panel.',
    'Sound: the −18 dB compressor is gone (it added about 8 dB of automatic make-up gain, lifting sharp attacks and the reverb’s hiss with it) in favour of a limiter that only acts near full scale, plus an 11 kHz low-pass. The cash register is synthesized again (the chip-stack recording read as crackle and played on every floor paying 20 or more, including every Bomber delivery); the other recordings play at about half their old level; bells drop partials above 9 kHz; the fuse is a soft mid-band crackle; the defusal chord opens without a noise burst; boxes have their own opening sound; past 40 simultaneous voices, decorative effects are skipped.',
  ],
  experiments: [
    'Offline sound renders (renderSfxOffline in development builds: the same mixing chain, measuring peak and the largest sample-to-sample jump): the loudest floor ending we could stage (doors, hum, three fuse crackles, ding, defusal, register, ten coins, box, record, stamp) peaked at 0.76 → 0.32 with the largest jump 0.84 → 0.17; the register alone 0.71 → 0.13, a coin 0.44 → 0.19.',
    'Courier routes (6 player types × 250 runs × 11 settings): lengthening trips to 2–4 / 3–5 / 4–6 with no extra pay cut the balanced bot’s Courier boarding from 41% to 16% and the novice from 48F to 33F; 1–3 / 2–4 / 3–5 with 2 coins a stop gave 42% / 41F; adopted 1–4 / 2–5 / 3–6 with 3 coins a stop: 37% / 41F, balanced still 100F.',
    'Acceptance (14 groups × 300 runs, same seeds, against v9.18.2): balanced median 100 → 100F; deaths power / agitation / bomb 32.2 / 66.2 / 1.6% → 30.4 / 67.8 / 1.8%; novice 43 → 41; human 71 → 67; balanced exit coins 226 → 206; all boarding rates within 15–65%. Forecast audit over 22,439 ascents: 12 guard warnings on floors that were survived (as before).',
    'The new record (v9.18.2, 81F, agitation, 1,100 earned) joins the calibration data, now 9 runs (15–81F).',
    'Playtest note: on floor 74 the Bomber had 1 stop left at agitation 6 (high) and was gone the next floor with no coins paid: the 20% high-agitation incident sent him off early. It was only mentioned in a text line before and is now shown. The Bomber boarded at 76F was dismissed at 77F (8 coins).',
    'verify: one new check (36 in all): a Mimic copies the Bomber’s 30; trip ranges per tier; the long-route fee (a 5-stop route pays for 3 stops, nothing without the box); Child box events; incident records. The red-link table is now 29 pairs (Thief with Tourist and with Inspector removed, Tourist with Drifter added). Browser: labels above riders; no “−2” beside a held Thief; “+2 / +2 / +1 coins” for three neighbours; a Child opening two boxes; a Mimic’s “+11 coins” on one line; the incident card; no “Danger!” on arriving at a shop; the shop window stays 1229×787 throughout; no Chinese left in English labels.',
  ],
  watch: ['Courier boarding is 37% with longer routes (42% before); watch whether playtesters skip Couriers.', 'Whether a box animation and an exit card together feel crowded.', 'On narrow phones a horizontal link label overlaps the top edge of the lower row’s number bar.'],
};

export const V9184_ZH: ChangelogEntry = {
  version: '9.18.4', date: '2026-09-24', title: '五局试玩打磨：调度印章能用了、放人提示、加急安抚',
  summary: '这一版来自五局完整的浏览器试玩：每局记下真实感受，改完再玩下一局。最大的修复是调度印章：从 v9.0 起它装上后没有任何按钮，现在可以留人和改路程。放人时，除了绿线，也会提醒同时产生的红线、没人照顾和被挤到的邻座。后期堆积的金币可以用来“加急安抚”，价格越买越贵。',
  changes: [
    '调度印章：候客卡下方有“留到下一批 · 调度剩 N 次”；左栏有“调度印章 · 本段还剩 N 次”和“提前1站 / 延后1站”（选中本层新上车的人）。每十层 2 次，与卡片说明一致；传奇不能保留。之前界面只给已经退役的“改签”“留座”显示按钮，调度印章装了等于没装。',
    '加急安抚：本段安抚额度（6 点）用完后，还可以继续花钱安抚，每点价格是安抚价的 2 倍、3 倍、4 倍……（90 层时 48、72、96 币）。商店的安抚栏、躁动栏和“躁动可能失控”警告里都能买，每进入新的十层重新计价。',
    '放人提示：放下或挪动乘客时，如果同时连上了红线，或者造成“儿童无人照顾”“醉汉未安抚”“小偷未受控”“名人被围”等躁动，提示会在后面写“注意：与醉汉红线 +1躁动/层；儿童无人照顾 +1躁动/层”，并且不播放连线成功的庆祝效果。快递员的纸箱还在候客里时不提示“在找纸箱”。大纸箱放进无人看管的小偷手边时，也会提示小偷会带走它。',
    '炸弹客：警察锁住时倒计时停住，但拆弹奖金照样随真实时间流失（之前一路被锁住的炸弹客，到站总能拿满额奖金）。',
    '出发确认：车上有炸弹客时，危险楼层的“再按一次确认上行”现在能确认（之前炸弹每 0.2 秒刷新一次局面，确认状态随之被清掉）；快递员已上车而他的纸箱还在候客里时，也会提醒并需要再按一次。',
    '躁动失控警告：写出这一层躁动的主要来源，只给车上真的能做到的建议（挪护士或恋人到儿童旁、让警察挨着小偷、撤回刚上车的人、加急安抚）；没有办法时直说。结束画面的建议按主要来源给（夜深人躁、儿童、醉汉、小偷、红线、急躁）。',
    '护士：座位写“安抚 N 人 · 各 −1躁动/层”；邻座都安静时写“邻座都安静 · 暂无可安抚”。卡片写“抵消每位邻座自身躁动 1/层”，说明里写明挡不住夜深人躁。',
    '座位文字：小偷没人可偷时写“没人可偷 · +1躁动/层”；在教父身边写“教父罩着 · 不躁动”；复制人在上排写“上排没人可复制 · 本体车费 N币”；幽灵在下一次作祟前下车时写“下车前不会作祟”。大亨卡片写明“邻座超过1人 +1躁动”，教父卡片写明“身边的小偷不躁动”。',
    '卡片数值：保密车费的乘客（神秘人、复制神秘人的复制人）净收益也显示乱码；乱码里去掉“*”；大纸箱在候客卡上的耗电显示 −2；价值标签放不下时换行，不再被截断。',
    '传奇到站：到站卡写“信物 · 红绳”（之前写“+0 金币”），账单写“信物「红绳」”。',
    '商店：能力位满时，能力卡写“能力位已满 · 先在下方卖出一项”；配电箱按钮写明“已达上限”“本店已升级”；充电按钮在电量满时写“电量已满”，未选目标时写“拖动滑块选择充到多少”；第 50、100、150 层进商店有里程碑提示和音效；进商店那一层不再在被遮住的钱包上弹“+N”。',
    '车厢反馈：检查员给快递员验货时，纸箱闪绿光并弹出“验货 · 快递员晚一站 · +5 金币”；宽屏下每层结算小窗改成一行放在楼层数字下方，不再盖住上排座位；电量 / 躁动警告放在右栏上行按钮上方，不再压住下排乘客；幽灵作祟和小偷偷钱的动画在开始时才测量位置，不会再飞到候客卡上。',
    '文字：急客楼层写“临近商店 · 急客时段”，离开商店写“商店已关门，继续上行。”（之前是“维修层”）；每日班次在标题上方写“每日班次 · 日期 · 今天所有人同一套乘客”；去掉复制人过时的“同一人物对固定”说明；英文界面句号后补空格，放人提示改为“Inspector takes seat 4.”。',
    '候客：通勤者的候客搭档加上游客和恋人，前期不再几乎每层都出现快递员。',
  ],
  experiments: [
    'AI 浏览器试玩 5 局（桌面 1280×820，中文，每层读局面后手动决定；第 5 局 70 层后用简单规则推进）：109 层躁动（大亨传奇）、98 层躁动（坐满 + 坏人）、96 层躁动（每日班次）、108 层躁动（媒人传奇、恋人路线）、89 层电量（老周传奇；推进规则强制出发、没用途中补电，是试玩方式的错）。每局笔记与修改记录在 docs/playtests/ai-playtest-notes.md。',
    '五局共同的结论：前 40 层很平稳；金币在后期没有出口（60 层 354–406，90 层 606–701）；配电箱在 50 层前就满级；91 层后夜深人躁远超安抚额度，100 层后的结局像是定好的。“加急安抚”是给金币的第一个出口，还需要真人试玩看它是否让后期变得太长。',
    '快递员频率（2 万批候客）：2–9 层有快递员的比例 63% → 44%（加游客）→ 再加恋人。',
    '验收（14 组 × 300 局，同一种子，对照 v9.18.3）：均衡型中位 100 → 100 层，死因电量 / 躁动 / 炸弹 30.4 / 67.8 / 1.8% → 29.6 / 68.7 / 1.7%；新手 41 → 34；真人型 67 → 68；均衡型离店金币 206 → 191；上车率全部在 15–65%。新手下降一部分是抽样波动，一部分来自通勤者搭档：同一种子各 600 局，通勤者搭档为原来 / 加游客 / 再加恋人时，新手 39 / 38 / 36 层，真人型 66 / 68 / 71 层，均衡型都是 100 层。模拟器不会使用加急安抚。',
    'verify 新增 2 项（共 38 项）：警察锁住时拆弹奖金照样流失（锁 12 秒后只剩 18 秒可计奖金，付 6 币而不是 10 币）；加急安抚价格 2×、3×，额度未用完时不能加急，钱不够不能买；放人提示（新红线、儿童无人照顾、名人被围、先放快递员不提示、大纸箱挨小偷提示）；调度次数。',
  ],
  watch: ['加急安抚会不会让熟练玩家的后期拖得太长（模拟器不会用它）。', '放人提示是否太长、太频繁。', '配电箱 5 级上限和 91 层后的电量需求（约 119 电，上限 90–110）仍然让后期像定好的结局。'],
};

export const V9184_EN: ChangelogEntry = {
  version: '9.18.4', date: '2026-09-24', title: 'Polish from five playtests: Dispatch works, placement warnings, overtime calming',
  summary: 'This release comes from five complete browser playtests: after each run the honest impressions were written down and fixed before the next. The biggest fix is the Dispatch stamp, which had no buttons at all since v9.0 and now holds riders and changes trips. Placing a rider now also warns about a red link, an unattended rider or a crowded neighbour it creates. Coins piling up late can buy overtime calming at a rising price.',
  changes: [
    'Dispatch stamp: waiting cards show “Hold for the next batch · N dispatch left”; the left panel shows “Dispatch stamp · N left this sector” with “1 stop earlier / 1 stop later” for a rider who boarded this floor. Twice per ten floors as the card says; legends cannot be held. The UI used to show buttons only for the retired Rebook and Reservation abilities, so the stamp did nothing.',
    'Overtime calming: once the sector’s calming allowance (6 points) is spent, you can keep paying to calm, each point costing 2×, 3×, 4× … the calming price (48, 72, 96 coins at 90F). Available in the shop’s calm panel, the agitation panel and the “agitation can boil over” alert; the price resets each ten floors.',
    'Placement warnings: placing or moving a rider now appends “Heads-up: red link with the Drunk (+1 agitation/floor); Child uncared for +1 agitation/floor” when the move also draws a red link or leaves someone unattended, uncontrolled or crowded, and the link celebration does not play. A Courier whose box is still waiting is not nagged. A crate placed within an unguarded Thief’s reach is announced too.',
    'Bomber: an Officer’s lock stops the timer, but the defusal bonus keeps draining in real time (a Bomber locked all the way used to earn the full bonus).',
    'Departure confirmation: with a Bomber aboard, “press again to ascend” on a dangerous floor now confirms (the bomb refreshed the run every 0.2 s and cleared the confirmation); a Courier aboard whose box is still waiting also needs a second press.',
    'Agitation alert: names this floor’s main sources and only suggests moves this cabin allows (move a Nurse or Lover beside the Child, put an Officer beside the Thief, withdraw a new rider, overtime calming), or says plainly that nothing can help. The ending’s advice follows the main source (late-night unrest, Child, Drifter, Thief, red link, impatience).',
    'Nurse: her seat reads “Soothing N · −1 agitation each/floor”, or “Neighbors are calm · nothing to soothe”. The card reads “Cancels 1 of each neighbor’s own agitation/floor”, and the details say she cannot block late-night unrest.',
    'Seat labels: a Thief with nobody to rob reads “Nobody to rob · +1 agitation/floor”; beside the Don “Under the Don · calm”; a Mimic in the top row “Nothing above in the top row · own fare N”; a Ghost that leaves before its next haunting “Leaves before the next haunting”. The Tycoon card names “more than 1 neighbour: +1 agitation”, the Don card “a Thief beside him stays calm”.',
    'Card values: riders with a sealed fare (Mystery, a Mimic copying one) show a scrambled net value too; the scramble no longer uses “*”; a crate’s waiting card shows −2 power; value tags wrap instead of being cut off.',
    'Legend arrivals: the exit card reads “Keepsake · Red string” (it said “+0 coins”), the receipt “Keepsake “Red string””.',
    'Shop: with every ability slot full, ability cards read “Slots full · Sell one below first”; power-box buttons say “At max” or “Upgraded this shop”; the charge button reads “Power is full” or “Drag the slider to choose a target”; floors 50, 100 and 150 get a milestone line and sound; the floor you enter a shop no longer pops “+N” over the hidden wallet.',
    'Cabin feedback: an Inspector checking a Courier’s box flashes the box green with “Inspected · Courier one stop later · +5 coins”; on wide screens the per-floor result is one line under the floor number instead of covering the top row; power and agitation alerts sit above the ascend button instead of over the lower row; the Ghost’s haunting and the Thief’s coins measure positions when the animation starts, so they no longer fly to a waiting card.',
    'Text: rush floors read “Shop ahead · Rush arrivals” and leaving a shop “Shop closed. Up we go.” (was “maintenance”); the daily shift shows “Daily shift · date · everyone gets the same riders today”; the Mimic’s outdated “fixed pairing” note is gone; English sentences no longer run together, and placing reads “Inspector takes seat 4.”.',
    'Queue: the Commuter’s waiting partners now include the Tourist and the Lover, so a Courier no longer appears on almost every early floor.',
  ],
  experiments: [
    'AI browser playtests, 5 runs (desktop 1280×820, Chinese, every floor decided by reading the board; run 5 used a simple rule after 70F): 109F agitation (Tycoon legend), 98F agitation (full cabin + crime riders), 96F agitation (daily shift), 108F agitation (Matchmaker legend, lovers), 89F power (Operator legend; the rule forced departures and skipped in-transit charging, a playtest mistake). Notes and fixes per run are in docs/playtests/ai-playtest-notes.md.',
    'Shared conclusions: the first 40 floors are calm; coins have no late use (354–406 at 60F, 606–701 at 90F); the power box is maxed before 50F; after 91F late-night unrest far exceeds the calming allowance, so the ending past 100F feels decided. Overtime calming is a first outlet for coins; human playtests should show whether it drags the late game out.',
    'Courier frequency (20,000 batches): floors 2–9 with a Courier 63% → 44% (Tourist added) → Lover added as well.',
    'Acceptance (14 groups × 300 runs, same seeds, against v9.18.3): balanced median 100 → 100F; deaths power / agitation / bomb 30.4 / 67.8 / 1.8% → 29.6 / 68.7 / 1.7%; novice 41 → 34; human 67 → 68; balanced exit coins 206 → 191; all boarding rates within 15–65%. The novice drop is partly sampling noise and partly the Commuter partners: with the same seeds, 600 runs each, original / + Tourist / + Lover gave novice 39 / 38 / 36F and human 66 / 68 / 71F, balanced 100F throughout. The simulator never uses overtime calming.',
    'verify: 2 new checks (38 in all): a locked Bomber’s bonus drains (after 12 s locked only 18 s count, paying 6 not 10); overtime calming costs 2× then 3×, is unavailable while the allowance lasts and needs the coins; placement warnings (new red link, unattended Child, crowded Celebrity, no nag for a Courier placed first, crate beside a Thief); Dispatch uses.',
  ],
  watch: ['Whether overtime calming makes skilled late games too long (the simulator never uses it).', 'Whether placement warnings are too long or too frequent.', 'The 5-level power-box cap versus power needs after 91F (about 119, cap 90–110) still make the late game feel decided.'],
};

export const V9185_ZH: ChangelogEntry = {
  version: '9.18.5', date: '2026-09-24', title: '十局试玩收尾：英文界面、手机布局、充电优先、更多放人提示',
  summary: '第 6–10 局分别在英文界面、手机竖屏、每日班次和两局长局里试玩，这一版修掉了其中发现的问题：英文角色名统一、手机上名字不再断行、钱不够时商店先保证电量、升级配电箱前提醒先充电、车厢坐满和邻座被挤都会提示，结束建议写得更准。',
  changes: [
    '商店充电：默认充电目标先保证充到下一段所需的电量，安抚预留只从充完之后剩下的钱里扣（之前钱少时会默认充 0 电，钱又花在安抚上，带着很少的电离店）。',
    '商店配电箱：如果升级后剩下的钱不够充到下一段所需电量，配电箱区写“先充电：升级后只剩 X 币，充到下段约需的 N 电要 Y 币。”',
    '放人提示：放下第 6 位乘客导致车厢坐满时提示“注意：车厢坐满 +1躁动/层”；同一句提示重复时合并成“… ×2”。',
    '结束说明：断电时按真实上限写途中补电（蓄电满级时每十层 10 电），这一段已经用满时改为提醒离店前充够电；躁动失控时列出所有并列最大的来源（最多 3 个），并挑最能操作的一条给建议，新增快递员和大亨的建议。',
    '紧急维修：改为“最低抢救只降到上限以下1点；想再降，用下方的‘安抚’（正常价格，计入本段额度）”。之前写“不可继续购买舒缓”，会让人以为抢救后什么都做不了。',
    '调度印章：改路程后提示“调度完成：提前 1 站……”（之前沿用退役能力的“改签完成”）。',
    '英文界面：角色名统一为卡片上的 Drifter、Counsel、Warden（之前句子里还有 Drunk、Lawyer、Exorcist）；钱包标签改为“Coins”，不再截成“Balan”；±1 写“coin”；座位写“stops”；统一美式拼写 neighbor；顿号转成逗号；补齐“幽灵受控”“幽灵拖延邻座”“手动调节已使用”三句的英文。',
    '手机竖屏：座位上的名字不再断成两行；楼层地名牌移到电梯左上角，不再压在上排中间的名字后面；商店顶部“剩余电量”不换行；到站后自动滚回候客卡之前，先清掉还没消失的飘字，不再落到候客卡上。',
    '电脑商店：能力位已满时，“能力位已满”不再断行。',
    '同一层里相同的楼层提示（例如两只受控幽灵）合并成“… ×2”。',
  ],
  experiments: [
    'AI 浏览器试玩第 6–10 局：57 层电量（英文界面，谨慎规则）、48 层电量（手机 375×812，谨慎规则）、92 层电量（每日班次，与第 3 局同一套乘客）、106 层躁动（改进规则）、111 层躁动（灵媒 + 幽灵，80 层后手动；十局最高）。每局笔记和修改记录在 docs/playtests/ai-playtest-notes.md，文末有十局总结。',
    '实战验证 v9.18.4：调度印章两种用法（炸弹客提前 1 站送达、游客留到下一批）都正常；加急安抚在第 8、10 局触发，价格 40 → 60、48 → 52 → 78 → 104 币依次上涨；放人提示在实战里挡住了多次错误摆放（大亨嫌挤、名人被围、快递员争纸箱）。',
    '规则数值没有改动，模拟器验收沿用 v9.18.4 的结果（均衡型中位 100 层）。',
    'verify 新增 1 项（共 39 项）：车厢坐满提示；引擎里所有固定提示都必须有完整英文（扫描到 18 句）；合并后的提示带次数也能翻译；英文不再出现 Drunk / Lawyer / Exorcist / neighbour。浏览器实测：英文钱包标签宽 41.5 像素放得下；手机座位名字高 15 像素（单行）；商店“能力位已满”高 21 像素（单行）；钱少时配电箱区出现“先充电”提醒。',
  ],
  watch: ['谨慎型玩家只带估算为正的乘客时仍然很穷（第 6、7 局 30 层只有 50–60 金币）。', '配电箱 5 级上限和 91 层后的电量需求仍是后期最硬的墙。', '快递员在前期仍然常见，车上有通勤者时更常连着出现。'],
};

export const V9185_EN: ChangelogEntry = {
  version: '9.18.5', date: '2026-09-24', title: 'Finishing ten playtests: English text, phone layout, power first, more placement warnings',
  summary: 'Runs 6–10 were played in English, on a phone-sized screen, on the daily shift and in two long runs; this release fixes what they found: consistent English rider names, phone seat names on one line, the shop charging power first when coins are short, a reminder to charge before a power-box upgrade, warnings when the cabin fills or a neighbor gets crowded, and more accurate endings.',
  changes: [
    'Shop charging: the default target first covers the next sector’s power need; the calming reserve only holds back coins left after that (short of coins, it used to default to charging nothing, the coins went on calming, and the run left with little power).',
    'Shop power box: when an upgrade would leave too little to charge for the next sector, the box panel says “Charge first: after an upgrade you would have X coins, and charging to the next sector’s N power costs Y.”',
    'Placement warnings: seating a sixth rider so the cabin is full adds “Heads-up: Cabin full +1 agitation/floor”; a repeated warning is merged as “… ×2”.',
    'Endings: running out of power names the real in-transit cap (10 per ten floors with full Storage), or, if this sector’s allowance was already used, reminds you to leave shops with enough power; an agitation overload lists every source tied for the top (up to 3) and gives the most actionable advice, now including the Courier and the Tycoon.',
    'Emergency repair: now reads “the minimum rescue stops 1 below the cap; to go lower, use Calm below (normal price, counts toward this sector’s allowance)”, instead of “Further relief cannot be bought”, which made players give up.',
    'Dispatch stamp: changing a trip now says “Dispatched: one stop earlier …” instead of the retired ability’s “Rebooked”.',
    'English: rider names follow the cards (Drifter, Counsel, Warden) instead of also Drunk, Lawyer, Exorcist; the wallet label reads “Coins” instead of the cut-off “Balan”; ±1 reads “coin”; seats read “stops”; US spelling “neighbor”; the Chinese enumeration comma becomes “, ”; the Ghost-controlled, Ghost-delay and manual-relief notes are fully translated.',
    'Phone layout: seat names no longer break over two lines; the district plaque moves to the cabin’s top-left corner instead of sitting behind the top-middle name; the shop header’s power label stays on one line; floating pops are cleared before the page scrolls back to the waiting cards, so they no longer land on them.',
    'Desktop shop: “Slots full” no longer wraps.',
    'Repeated floor notes (two controlled Ghosts, for example) are merged as “… ×2”.',
  ],
  experiments: [
    'AI browser playtests 6–10: 57F power (English UI, cautious rule), 48F power (phone 375×812, cautious rule), 92F power (daily shift, same riders as run 3), 106F agitation (improved rule), 111F agitation (Medium + Ghosts, by hand after 80F; the best of the ten). Notes and fixes per run are in docs/playtests/ai-playtest-notes.md, with a ten-run summary at the end.',
    'v9.18.4 checked in play: both Dispatch uses (a Bomber delivered one stop early, a Tourist held for the next batch); overtime calming triggered in runs 8 and 10, rising 40 → 60 and 48 → 52 → 78 → 104 coins; placement warnings stopped several bad seats (a crowded Tycoon, a crowded Celebrity, Couriers fighting over a box).',
    'No rule values changed; simulator acceptance stands as in v9.18.4 (balanced median 100F).',
    'verify: 1 new check (39 in all): the cabin-full warning; every fixed engine message has full English (18 scanned); merged notes translate with their count; English no longer shows Drunk / Lawyer / Exorcist / neighbour. Browser: the English wallet label is 41.5 px and fits; phone seat names are 15 px tall (one line); the shop’s slots-full label is 21 px (one line); the “charge first” note appears when coins are short.',
  ],
  watch: ['Cautious players who only take positive estimates are still poor (runs 6 and 7: 50–60 coins at 30F).', 'The 5-level power-box cap versus power needs after 91F is still the hardest late wall.', 'Couriers remain common early, more so in a row when a Commuter is aboard.'],
};

export const V919_ZH: ChangelogEntry = {
  version: '9.19.0', date: '2026-09-24', title: '午夜之后：18 位暗黑版人物、同化、道具、两种炸弹',
  summary: '离开 60 层商店时午夜钟声响起，车厢变暗，之后的候客越来越多是“暗黑版”：同一批人物换了面目、属性和链接。后期的压力不再来自“夜深人躁”，而是来自这些人物自己的麻烦；钱有了去处：14 种道具、配电箱第 6 级以上、加急补电、能力 2 级。',
  changes: [
    '午夜钟声：离开 60 层商店时灯光熄灭、钟响三声，车厢换成暗色背景。暗黑版比例逐步上升：60–69 层上车的候客 35%，70–79 层 60%，80 层起 85%；钟声后的第一批至少有一位暗黑版。',
    '18 位暗黑版（新肖像、新属性、新链接）：加班魂（每层加班费 +2，到站要等邻座一起下，赖着不走 +1 躁动/层，过站 3 层不付钱离开）、偷拍客（偷拍普通邻座 +1 躁动，每张照片 +3 币）、走私客（黑箱在旁付车费 + 箱价×2；检查员没收得 15 币，贪腐检查员放行再 +8）、拆机人（+3 币/层，运转 +1 电）、怨偶（相邻吵架，分开坐基价×2）、噪音乐手（+1 躁动/层，高躁动 +4 币/层）、劫匪（没人管每层抢你 2 币 + 余额 3%，最多 10；被管住到站赏金 15）、黑警（管住身边所有坏人、全车 −1 躁动/层，每层收 3 币保护费）、讼棍（每条红线 +3 币/层，最多 9；让警察管不住劫匪）、狂徒（自己 +1、每位普通邻座再 +1 躁动；高躁动基价×3）、药贩（邻座自身躁动 −2/层；她下车后邻座戒断 2 层，每层 +1）、怪童（每位普通邻座 +1 躁动；独自到站 +10 币）、怨灵（没人管每层拖延邻座 1 站并吸 1 电；受控 +4 币/层）、召魂人（管住幽灵和怨灵，每到 3 的倍数层召一只幽灵进空座，身边受控幽灵车费×2）、监工（邻座车费 +100%，普通邻座各 +1 躁动/层）、丑闻明星（每位邻座 +2 币/层，偷拍客在旁再 +5；挨着检查员或黑警到站曝光，车费归零）、贪腐检查员（每位邻座收 2 币/层，车厢 +1 躁动）、疯炸客（车费 50，弗兰肯斯坦式怪炸弹，倒计时是炸弹客的 60%，普通警察锁不住）。',
    '同化：普通人连续 2 次出发都挨着至少 2 位暗黑版，就变成自己的暗黑版。正在同化时，暗黑邻座连出紫色虚线，座位冒出紫雾、肖像褪色，第 2 层边框跳动并写“下一层被同化成……”；变身时紫光一闪。护身符可以挡住，圣水可以净化（金光）。',
    '幸存者：60 层后把普通人平安送到站，额外 +5 币。深渊：80 层起每 20 层，暗黑版的麻烦加重一级（劫匪多抢、狂徒更疯、怨灵多吸电等）。',
    '去掉“夜深人躁”（后期每几层自动 +1 躁动的规则）。',
    '炸弹客改了：普通炸弹客倒计时归零会爆炸，把他和身边的乘客（传说人物除外）炸下车，都不付车费，你损失 20 币，本班继续。只有疯炸客的怪炸弹归零才结束本班；只有黑警（或便衣警察）能锁住它，或用引线剪当场拆掉（他下车并付车费）。',
    '神秘人改为“身份揭晓”：上车后下一层揭晓，四种身份——便衣警察（车费 8，管住小偷和劫匪、锁住炸弹）、逃犯（车费 20，+1 躁动/层）、富商（车费 25）、好心人（车费 8，每位邻座自身躁动 −1/层）。揭晓时翻牌并弹出“原来是……！”。',
    '道具（一次性，道具栏 4 格）：商店每次上架 3 种，同一种每买一次涨 50%，60 层后每层再贵 0.5%。应急电池 20（+15 电）、换位券 10、请离券 15、糖果 12（11 层起）、香薰 25（21 层起，−2 躁动）、延时引信 18（31 层起，炸弹 +20 秒）、圣水 60、手铐 30、护身符 25、闹钟 15、镇静剂 30（3 层不躁动）、封条 20、引线剪 45（以上 60 层起）、照明弹 120（80 层起，本层暗黑版不惹麻烦）。左栏点道具使用，需要目标时可用的座位发光。',
    '配电箱阶梯：80 层起可升第 6 级，110 层第 7 级，之后每 30 层一级；每级价格是上一级的 3 倍。',
    '加急补电：本段途中补电用完后，还能按每包 5 电购买，每电价格依次是途中补电价的 3、5、7……倍。',
    '能力 2 级：6 个能力位装满后，每店可把一项能力升到 2 级（效果 +50%），价格 60 起，每升一项多 30。可升的 13 项：默契契约、礼宾服务、稳压模块、小费盒、混乘票、长途计价器、绝缘衬层、单站检票器、惯性飞轮、隔音门、第五张票、调度印章、谢幕礼。',
    '谨慎玩家：20 层前商店充电打 85 折（2 → 1.7 币/电）；车上空 3 个座位以上、候客里有只亏 1–2 币的乘客时，提示“空着的座位也在耗运转电”。',
    '候客：51 层起通勤者和恋人的出现权重减半；车上已有快递员时，快递员的权重减半。坏人同伙的暂存逐层递增（3、4、5……）。',
    '美术：18 张暗黑版肖像、黑箱、弗兰肯斯坦炸弹、暗色车厢、14 个道具图标（AI 生成，与原肖像同一构图风格）；新增午夜钟声音效；乘客档案收录暗黑版和他们的故事。',
  ],
  experiments: [
    '模拟器验收 4,200 局（14 种机器人 × 300 局，种子 999001），与 v9.18.5 对比：均衡型中位 100 → 111 层（p10 93 → 89，p90 108 → 121）；死因 电量/躁动/炸弹 29.6/68.7/1.7% → 66.2/31.9/2.0%；离店剩余金币中位 92 → 36；新手型 34 → 49；真人型 68 → 64（p90 96 → 79）；协作型 103 → 135、安静秩序型 102 → 137（躁动墙拿掉后改由电量结束），坏人型 100 → 98，热闹型 93 → 99。',
    '拆开看：只加暗黑版 + 去掉夜深人躁（不开配电箱阶梯）时，均衡型仍是 99 层；阶梯从 60 层、价格×2 开放会到 117–119 层，所以改为 80 层起、价格×3。20 层前充电打 75 折时新手型从 34 升到 69，改为 85 折后是 49。加急补电第一版（2 倍起）让 7–12% 的协作/安静局活过 150 层，改为 3 倍起、每包 +2 倍后降到 0.5%。',
    '真人型 150 局专项：60 层后的躁动主要来自监工、狂徒、怪童；把监工和怪童改为只影响普通邻座、贪腐检查员改为全车 +1、戒断改为每层 +1、比例从 50/75/90% 降到 35/60/85% 后，p90 从 73 回到 81。',
    '模拟器机器人会用加急补电、升 2 级和新配电箱阶梯，会算暗黑版每层的收支，但不买道具。',
    'verify 40 项（新增 1 项，覆盖暗黑比例、同化与护身符、身份揭晓、幸存者奖励、劫匪/黑警/讼棍/加班魂/丑闻明星/走私客/药贩/召魂人/怨灵、照明弹、道具买用与涨价）；旧检查按新规则更新（普通炸弹爆炸不结束本班、配电箱阶梯、20 层前充电价）。浏览器实测：62 层同化紫线与变身、身份揭晓、普通炸弹爆炸（3 人下车 −20 币）、疯炸客结束本班、引线剪拆弹、召魂、药贩戒断、60 层商店道具与能力 2 级、午夜钟声与暗色车厢、英文界面无中文残留、手机 375 宽无横向滚动。',
  ],
  watch: [
    '去掉夜深人躁后，稳健打法能走到 130–140 层，终点改由电量决定；要看真人是不是也会走这么远。',
    '真人型 60 层后掉得比以前快（p90 96 → 79），午夜刚开始的几层可能对普通玩家偏难。',
    '讼棍（9%）、劫匪（10%）、拆机人（13%）机器人很少带；炸弹客上车率 65%，正好在上限。',
    '道具和身份揭晓还没有进模拟器；美术是 AI 生成，风格需要真人看一眼。',
  ],
};

export const V919_EN: ChangelogEntry = {
  version: '9.19.0', date: '2026-09-24', title: 'After midnight: 18 dark riders, corruption, items, two bombs',
  summary: 'Leaving the 60F shop rings the midnight bell: the cabin goes dark, and more and more waiting riders arrive as their dark versions, the same characters with new faces, rules and links. Late pressure no longer comes from late-night unrest but from these riders’ own trouble, and coins have somewhere to go: 14 items, power-box levels past five, overtime charging and level-2 abilities.',
  changes: [
    'Midnight bell: leaving the 60F shop dims the lights, a bell tolls three times and the cabin art turns dark. The dark share rises step by step: 35% of cards boarding at 60–69F, 60% at 70–79F, 85% from 80F; the first batch after the bell always has at least one.',
    '18 dark riders (new portraits, rules and links): Overtimer (+2 overtime per floor; at his stop he waits for a neighbor to leave, +1 agitation per extra floor, walks off unpaid 3 floors late), Voyeur (photographs normal neighbors: +1 agitation, +3 coins per photo), Smuggler (pays fare + box value ×2 with his black box beside him; an Inspector seizes it for 15, a Grafter waves it through for 8 more), Scrapper (+3 coins/floor, motor +1 power), Ex (fights beside the other Ex; seated apart, base fare ×2), Noisemaker (+1 agitation/floor; +4 coins/floor at high), Robber (unchecked, takes 2 coins + 3% of your wallet per floor, max 10; held, pays a 15 bounty), Crooked Cop (holds every bad rider beside him, cabin −1 agitation/floor, takes 3 coins protection per floor), Shyster (+3 coins per red link per floor, max 9; Officers cannot hold a Robber beside him), Brawler (+1 agitation, +1 more per normal neighbor; base fare ×3 at high), Pusher (neighbors’ own agitation −2/floor; when she leaves they go into withdrawal, +1 for 2 floors), Uncanny Child (+1 agitation per normal neighbor; +10 alone on arrival), Wraith (unchecked, delays a neighbor 1 stop and drains 1 power every floor; controlled, +4 coins/floor), Summoner (controls Ghosts and Wraiths, summons a Ghost into an empty seat every third floor, controlled Ghosts beside him pay ×2), Taskmaster (neighbors’ fares +100%, normal neighbors +1 agitation/floor each), Scandal (+2 coins per neighbor per floor, +5 more beside a Voyeur; exposed beside an Inspector or Crooked Cop, fare 0), Grafter (2 coins from each neighbor per floor, cabin +1 agitation), Mad Bomber (fare 50, a Frankenstein contraption at 60% of a Bomber’s timer that Officers cannot lock).',
    'Corruption: a normal rider beside two or more dark riders for 2 departures in a row turns into their own dark version. While it happens, dotted violet links run from the dark neighbors, violet mist rises around the seat and the portrait drains of colour; on the second floor the frame throbs and the seat says “Turns into … next floor”; the change itself flashes violet. An Amulet prevents it; Holy Water purifies (a golden flash).',
    'Survivors: delivering a normal rider after 60F pays +5. The abyss: from 80F and every 20 floors, dark riders’ trouble grows one step (the Robber takes more, the Brawler rages harder, the Wraith drains more …).',
    'Late-night unrest (the automatic +1 agitation every few floors) is gone.',
    'Bombers reworked: an ordinary Bomber reaching zero blows himself and his neighbors (legends excepted) out of the cabin without fares and costs you 20 coins; the shift goes on. Only the Mad Bomber’s contraption ends the shift; only a Crooked Cop (or an Undercover Officer) locks it, or a Wire Cutter defuses it on the spot (he gets off and pays).',
    'The Mystery now reveals an identity one floor after boarding: Undercover Officer (fare 8; holds Thieves and Robbers, locks bombs), Fugitive (fare 20; +1 agitation/floor), Magnate (fare 25) or Good Samaritan (fare 8; −1 of each neighbor’s own agitation per floor). The reveal flips the card and pops “A …!”.',
    'Items (single use, 4-slot bag): each shop stocks 3; each repeat purchase costs 50% more, and past 60F prices rise 0.5% per floor. Spare Cell 20 (+15 power), Swap Ticket 10, Exit Pass 15, Candy 12 (from 11F), Incense 25 (from 21F, −2 agitation), Longer Fuse 18 (from 31F, bomb +20 s), Holy Water 60, Handcuffs 30, Amulet 25, Alarm Clock 15, Sedative 30 (no own agitation for 3 floors), Seal 20, Wire Cutter 45 (all from 60F), Flare 120 (from 80F; no dark trouble this floor). Tap an item in the left rail; items that need a target light up the seats they can be used on.',
    'Power-box ladder: a sixth level from 80F, a seventh at 110F, then one every 30 floors; each costs three times the one before.',
    'Overtime charging: once a sector’s in-transit charging is spent, power is sold in packs of 5 at 3×, 5×, 7× … the in-transit price.',
    'Level-2 abilities: with all six slots full, each shop can raise one ability to level 2 (+50%), from 60 coins, +30 for each one raised. Raisable: Cooperation, Concierge, Stabilizer, Tip Jar, Mixed Ticket, Long-Ride Meter, Insulation, Single Arrival, Inertia Flywheel, Soundproof Door, Fifth Rider Bonus, Dispatch Stamp, Curtain Call.',
    'Cautious players: shop power is 15% cheaper up to 20F (2 → 1.7 coins); with three or more empty seats and a card that loses only a coin or two, the hint says empty seats still cost motor power.',
    'Waiting cards: from 51F Commuters and Lovers appear half as often; with a Courier aboard, Couriers appear half as often. A bad-rider crew banks more each floor it stays together (3, 4, 5 …).',
    'Art: 18 dark portraits, the black box, the Frankenstein bomb, the dark cabin and 14 item icons (AI-generated in the portraits’ composition and style); a midnight bell sound; the archive lists the dark riders and their stories.',
  ],
  experiments: [
    'Simulator acceptance, 4,200 runs (14 bots × 300, seed 999001), against v9.18.5: balanced median 100 → 111F (p10 93 → 89, p90 108 → 121); deaths power/agitation/bomb 29.6/68.7/1.7% → 66.2/31.9/2.0%; median coins leaving a shop 92 → 36; novice 34 → 49; human-like 68 → 64 (p90 96 → 79); Cooperation 103 → 135 and Quiet Order 102 → 137 (with the agitation wall gone, power ends them), Crime 100 → 98, Lively 93 → 99.',
    'Separating the effects: dark riders plus removing late-night unrest, without the box ladder, keep the balanced bot at 99F; a ladder from 60F at double price took it to 117–119F, so it now opens at 80F at triple price. A 25% early charging discount lifted the novice bot from 34 to 69F; at 15% it is 49F. The first overtime charging (from 2×) let 7–12% of Cooperation / Quiet runs pass 150F; from 3×, +2× per pack, it is 0.5%.',
    'Human-like bot study, 150 runs: after 60F agitation came mostly from the Taskmaster, Brawler and Uncanny Child; making the Taskmaster and Uncanny Child affect only normal neighbors, the Grafter a flat +1, withdrawal +1 a floor, and the dark share 35/60/85% instead of 50/75/90%, brought its p90 from 73 back to 81.',
    'The simulator bots use overtime charging, level 2 and the new box ladder and count dark riders’ per-floor money, but do not buy items.',
    'verify: 40 checks (1 new, covering the dark share, corruption and the Amulet, the Mystery reveal, the survivor bonus, the Robber / Crooked Cop / Shyster / Overtimer / Scandal / Smuggler / Pusher / Summoner / Wraith, the Flare, and buying, using and pricing items); older checks updated to the new rules (an ordinary blast does not end the shift, the box ladder, early charging). Browser: violet corruption links and the change at 62F, the Mystery reveal, an ordinary blast (3 blown out, −20 coins), the Mad Bomber ending a shift, the Wire Cutter, a summoned Ghost, withdrawal after the Pusher, items and level 2 in the 60F shop, the midnight bell and dark cabin, no Chinese left in the English UI, no sideways scroll on a 375-wide phone.',
  ],
  watch: [
    'Without late-night unrest steady play reaches 130–140F and power decides the end; do real players go that far too?',
    'The human-like bot falls faster after 60F (p90 96 → 79): the first floors after midnight may be too harsh for ordinary players.',
    'Bots rarely board the Shyster (9%), Robber (10%) or Scrapper (13%); the Bomber boards 65%, right at the limit.',
    'Items and Mystery identities are not in the simulator yet; the art is AI-generated and needs a human look.',
  ],
};

export const V9191_ZH: ChangelogEntry = {
  version: '9.19.1', date: '2026-09-24', title: '午夜试玩前六局：同化提示、手机上的午夜、暗黑版平衡、商店自救',
  summary: '在浏览器里以玩家身份试玩了 6 局“午夜之后”（桌面中文、英文、手机竖屏），每局玩完就改。这一版修掉了其中发现的问题：放人时会提示同化，手机上看得到午夜钟声和同化进度，劫匪和黑警收钱有动画，失控时商店先保住抢救费。另外按模拟器研究调整了几位暗黑版。',
  changes: [
    '同化：放人时，如果某位普通人会因此被两位以上暗黑版夹住，提示“X 会被同化成 Y（2层后）”；戴护身符的人写“护身符护着 · 不会被同化”；手机座位上加紫色小标“同化 1/2 / 2/2”。',
    '午夜钟声：推迟到商店关闭之后再响；手机上先把车厢滚到屏幕中间。所有横幅都限制在可见区域内。',
    '钱的动画：劫匪抢钱、黑警收保护费时，金币从钱包飞向他，并弹出红字；贪腐检查员、拆机人、讼棍、受控怨灵、噪音乐手的每层收入，从座位飞进钱包。',
    '商店危机：躁动失控时，默认充电会先留出最低抢救费；钱不够时，充电按钮写“先付最低抢救（N 币），再充电”。如果卖一项能力就付得起抢救，会提示“卖掉一项能力（退 15 币）就付得起”。',
    '结束说明：途中补电额度用完、钱还够买加急补电时，提示“断电警告里的加急补电能救这一层”。',
    '怨偶：车上只有一位怨偶时，每层有 15% 概率把另一位叫来（卡上一直这么写，之前没有实现）。',
    '狂徒、噪音乐手正常下车时，躁动额外 −2（“闹事的人下车了”），高躁动路线有了退出口；预测同步计入。',
    '电机第 3 级：原来的“静音：夜深人躁 −1”在删掉夜深人躁后没有作用，改为“每 3 层有 2 层运转 −1”。',
    '暗黑版数值：丑闻明星每位邻座每层 +2 → +1；讼棍去掉自身每层 +1 躁动，车费 10 → 12；拆机人每层 +3 → +4；偷拍客给丑闻明星的加成 +5 → +3；疯炸客路程 2–4 → 3–5 站，由炸弹客转变来的疯炸客也至少 3 站。',
    '文字：便衣警察写明“锁住炸弹客（锁不住疯炸客）”（v9.19.0 更新日志写成“黑警或便衣警察能锁住疯炸客”，是错的，以代码为准：只有黑警能锁）。炸弹说明写出是谁锁的（警察 / 黑警 / 便衣警察）。黑箱在候客和座位上叫“黑箱”，说明写走私客；走私客缺箱子时写“走私客在找黑箱”。80 层后黑警保护费、怨灵吸电、狂徒发狂按当前深渊等级显示。神秘人的车费写“揭晓身份时公开”。60 层前的普通卡片不再提到暗黑版。楼层消息不再重复人名（“教练急躁，躁动 +1”）。',
    '英文：“1 stop / 2 stops”单复数；楼层消息改为“Coach impatient, agitation +1”这样的格式；英文商店配电箱的名字和说明不再重叠。',
    '换座：每层 2 次老乘客换座，第一次换座后界面仍允许第二次（之前第一次后就不让拖了），剩余次数的两处显示统一。',
  ],
  experiments: [
    '浏览器试玩 6 局（每局笔记在 docs/playtests/midnight-playtest-notes.md）：117 层电量、98 层电量、109 层电量（英文）、129 层电量（手机）、117 层电量、130 层躁动。中段多由自动推进代打，60 层前后和午夜段主要逐层手动。',
    '暗黑版专项研究（新脚本 scripts/balance-sim/dark-report.mts，平衡型和真人型各 60 局）：调整前丑闻明星上车率 48%、平均到站 41.8 币；讼棍上车率 8%、每层自带 0.94 躁动；拆机人上车率 16%、每趟 8.6 币。调整后上车率分布在 15%–49%：丑闻明星 35% / 29.5 币，讼棍 32%，拆机人 25%。',
    '模拟器验收 4,200 局（种子 999001）：均衡型中位 111 → 115 层（p10 91，p90 124），主要来自电机第 3 级恢复作用；死因 电量/躁动/炸弹 67.9 / 29.9 / 2.2%；真人型 64 层（p90 83）；新手型 49 层；离店剩余金币中位 38。',
    'verify 41 项（新增 1 项：两次换座、同化提示、黑箱名称、60 层前不提暗黑版、怨偶呼唤、闹事的人下车及其预测）。',
  ],
  watch: ['稳健打法能走到 130 层以上，后期仍然是电量决定终点。', '劫匪上车率只有 11–15%（设计上是“坏”人物，但可能太不受欢迎）。', '传说人物大多只在前 10 层起作用，和午夜内容没有交集。'],
};

export const V9191_EN: ChangelogEntry = {
  version: '9.19.1', date: '2026-09-24', title: 'First six midnight playtests: corruption warnings, midnight on phones, dark-rider balance, shop rescue',
  summary: 'Six “After midnight” runs played in the browser as a player (desktop Chinese, English, a phone-sized screen), fixing what each one found before the next: placements now warn about corruption, phones see the midnight bell and corruption progress, the Robber and Crooked Cop visibly take coins, and a shop in crisis keeps the rescue fee safe. A simulator study also rebalanced several dark riders.',
  changes: [
    'Corruption: a placement that leaves a normal rider beside two or more dark riders warns “X turns into Y in 2 floors”; an Amulet wearer reads “Amulet · cannot be corrupted”; phone seats show a violet “Turning 1/2 / 2/2” pill.',
    'Midnight bell: it rings after the shop has closed; on phones the cabin scrolls into view first. All banners stay inside the visible screen.',
    'Coin animations: the Robber’s take and the Crooked Cop’s protection money fly from the wallet to them with a red pop; the per-floor earnings of the Grafter, Scrapper, Shyster, a controlled Wraith and the Noisemaker fly from their seat to the wallet.',
    'Shop crisis: in an agitation crisis the default charge leaves the minimum-rescue fee; when coins fall short the charge button reads “Pay the minimum rescue (Nc) first”. If selling an ability would cover the rescue, the warning says so.',
    'Ending: when the in-transit allowance ran out but overtime charging was affordable, the ending names the power alert’s overtime charging.',
    'Ex: a lone Ex now calls the other one in, 15% a floor (the card always promised it; it never happened).',
    'A Brawler or Noisemaker getting off lowers agitation by 2 more (“the troublemaker got off”), so high-agitation play has a way down; the forecast includes it.',
    'Motor level 3: its “quiet: late-night unrest −1” did nothing once the unrest was removed; it now saves 1 on 2 floors in 3.',
    'Dark riders: Scandal +2 → +1 per neighbor a floor; Shyster no longer adds 1 agitation himself, fare 10 → 12; Scrapper +3 → +4 a floor; the Voyeur’s bonus to the Scandal +5 → +3; Mad Bomber trip 2–4 → 3–5 stops, and a Mad Bomber turned from a Bomber rides at least 3.',
    'Text: the Undercover Officer “locks Bomb Carriers (not the Mad Bomber)” (the v9.19.0 notes said a Crooked Cop or an Undercover Officer could lock the Mad Bomber; that was wrong, only a Crooked Cop can). Bomb captions name who locked the timer. A black box is called a black box in the queue and on its seat, and a Smuggler without one is “looking for his black box”. Past 80F the Crooked Cop’s fee, the Wraith’s drain and the Brawler’s rage show their current abyss values. The Mystery’s fare is “shown when he is revealed”. Before midnight ordinary cards no longer name dark riders. Floor summaries no longer repeat the rider’s name.',
    'English: “1 stop / 2 stops”; floor summaries read like “Coach impatient, agitation +1”; the power-box names in the English shop no longer overlap their descriptions.',
    'Seat moves: two old-rider moves per floor; the second is no longer blocked after the first, and both counters agree.',
  ],
  experiments: [
    'Six browser playtests (notes in docs/playtests/midnight-playtest-notes.md): 117F power, 98F power, 109F power (English), 129F power (phone), 117F power, 130F agitation. Mid-run floors were mostly auto-played; the floors around 60F and the midnight stretches were mostly played by hand.',
    'Dark-rider study (new script scripts/balance-sim/dark-report.mts, 60 balanced + 60 human-like runs): before tuning the Scandal boarded 48% and paid 41.8 on average; the Shyster boarded 8% and added 0.94 agitation a floor; the Scrapper boarded 16% for 8.6 a trip. After tuning boarding spans 15–49%: Scandal 35% / 29.5, Shyster 32%, Scrapper 25%.',
    'Simulator acceptance, 4,200 runs (seed 999001): balanced median 111 → 115F (p10 91, p90 124), mostly the restored motor level 3; deaths power/agitation/bomb 67.9 / 29.9 / 2.2%; human-like 64F (p90 83); novice 49F; median coins leaving a shop 38.',
    'verify: 41 checks (1 new: two seat moves, the corruption warning, black-box names, no dark names before midnight, the Ex’s call, the troublemaker relief and its forecast).',
  ],
  watch: ['Steady play still passes 130F; power still decides the end.', 'The Robber boards only 11–15% (a “bad” rider by design, but maybe too unwelcome).', 'Most legends only matter in the first ten floors and never meet the midnight cast.'],
};

export const V9192_ZH: ChangelogEntry = {
  version: '9.19.2', date: '2026-09-25', title: '午夜试玩后四局：配对提示、午夜道具货架、结束说明',
  summary: '十局午夜试玩的第 7–10 局（谨慎新手、全暗黑车厢、手机英文、逐层手动）。这一版让谨慎玩家更容易发现配对，60 层起的商店更容易买到对付暗黑版的道具，结束说明也会提醒加急补电。十局的完整笔记和总结在 docs/playtests/midnight-playtest-notes.md。',
  changes: [
    '配对提示：前 40 层，候客里如果有“单看亏、配对后赚”的人（例如两位恋人各写着 −3 / −7，但“配恋人 +9”），而且搭档就在候客或车上，提示直接点名：“两位恋人单看都亏，挨着坐就赚（卡上写着‘配恋人 +9’）：一起带上。”或“X 单看亏，和 Y 挨着坐就赚”。这条提示优先于普通的空座位提示。',
    '道具货架：从 60 层商店起，三件道具里至少两件是午夜道具（圣水、手铐、护身符、闹钟、镇静剂、封条、引线剪，80 层起还有照明弹）。之前 60 层常常只能买到前期的请离券、换位券。',
    '结束说明：带着钱断电时，除了“途中补电每十层最多 N 电”，还提醒“用完后断电警告里还有更贵的加急补电”。',
  ],
  experiments: [
    '浏览器试玩第 7–10 局：101 层躁动（前期扮演只拿正数的谨慎新手）、81 层躁动（午夜后尽量只带暗黑版）、106 层电量（手机英文）、81 层躁动（午夜后逐层手动到 72 层）。第 8、10 局的失败主要来自代打脚本的决策（不看躁动总量、在商店直接调用引擎充电，绕过了界面里“先留抢救费”的保护），不代表真人体验。',
    '十局结论：60–90 层用普通人加一两个暗黑版做组合是最好玩的一段；全暗黑车厢因为急躁、赖着不走、坐满会叠加躁动，不是一条独立的路；后期终点仍然主要是电量。',
    '规则数值未改，模拟器验收沿用 v9.19.1 的结果（均衡型中位 115 层）。verify 41 项（v9.19.1 的新检查里加了一条：60 层起货架至少两件午夜道具）。',
  ],
  watch: ['后期终点仍然主要是电量，100 层后能否有更多“人物带来的”压力。', '传说人物大多只在前 10 层起作用，和午夜内容没有交集。', '神秘人的逃犯身份在上车时看不出来，两位逃犯会让躁动一层跳 2。', '全暗黑车厢不是独立流派；如果想要“暗黑流”，需要给它明确的回报。'],
};

export const V9192_EN: ChangelogEntry = {
  version: '9.19.2', date: '2026-09-25', title: 'Last four midnight playtests: pair hints, a midnight item shelf, endings',
  summary: 'Runs 7–10 of the ten midnight playtests (a cautious beginner, an all-dark cabin, a phone in English, midnight played floor by floor). Cautious players now see pairs more easily, shops from 60F more often stock the tools against dark riders, and endings mention overtime charging. Full notes and a ten-run summary are in docs/playtests/midnight-playtest-notes.md.',
  changes: [
    'Pair hint: in the first 40 floors, when a waiting card loses money on its own but pays when paired (two Lovers at −3 / −7 that each say “w/ Lover +9”) and its partner is waiting or aboard, the hint names it: “Two Lovers lose on their own but earn side by side … take both.” or “X loses on its own but earns beside Y”. It takes priority over the empty-seat hint.',
    'Item shelf: from the 60F shop on, at least two of the three items are midnight tools (Holy Water, Handcuffs, Amulet, Alarm Clock, Sedative, Seal, Wire Cutter, and the Flare from 80F). The 60F shop used to offer only the early Exit Pass and Swap Ticket fairly often.',
    'Ending: running out of power with coins left now also says that after the in-transit allowance the power alert sells pricier overtime charging.',
  ],
  experiments: [
    'Browser playtests 7–10: 101F agitation (early floors as a cautious beginner who only takes positive cards), 81F agitation (only dark riders after midnight), 106F power (phone, English), 81F agitation (midnight by hand to 72F). Runs 8 and 10 were lost mostly to the auto-play script’s choices (it ignores total agitation and charges through the engine, bypassing the shop’s keep-the-rescue-fee guard), not to what a player would meet.',
    'Ten-run conclusions: 60–90F, combining normal riders with one or two dark riders, is the best stretch; an all-dark cabin stacks impatience, lingering and crowding and is not a strategy of its own; power still decides most endings.',
    'No rule values changed; simulator acceptance as in v9.19.1 (balanced median 115F). verify: 41 checks (one more assertion in the v9.19.1 check: from 60F at least two midnight items on the shelf).',
  ],
  watch: ['Power still decides most late endings; could more of the pressure after 100F come from riders?', 'Most legends only matter in the first ten floors and never meet the midnight cast.', 'A Fugitive cannot be seen on boarding; two of them add 2 agitation a floor at once.', 'An all-dark cabin is not a strategy of its own; a “dark build” would need a clear reward.'],
};

export const V920_ZH: ChangelogEntry = {
  version: '9.20.0', date: '2026-09-25', title: '深渊与暗黑传奇：100 层前的墙、传奇的午夜版、神秘人线索、隐藏的暗黑共鸣',
  summary: '这一版按玩家的四个要求改：争取没人能到 100 层；8 位传奇都有了暗黑版；神秘人卡上有线索可以猜；全暗黑车厢有一份不写在任何卡上的回报。先用模拟器调到熟练型几乎到不了 100 层，再在浏览器里玩了 10 局，边玩边改；完整笔记在 docs/playtests/v920-playtest-notes.md。',
  changes: [
    '深渊躁动：从 80 层起，每位暗黑版乘客每层自己 +1 躁动，每 5 层再 +1（85 层 +2、90 层 +3、95 层 +4）。护士、药贩、好心人贴着能抵消，照明弹和镇静剂能挡。每次加一级，前一层会弹出“深渊”横幅，排在“危！”之前。',
    '90 层起新卡全是暗黑版；没有暗黑版的人物（神秘人、百变人、复制人）从此不再出现。80 层起商店道具里一定有一枚照明弹。',
    '暗黑传奇：离开 60 层商店时，第四张卡是这一局传奇的暗黑版（没有传奇的局随机一位），60 层上车、70 层商店下车，不付车费。夜班老周：运转 −2 电（满员也算）、每层 +2 躁动，送达后免费配电箱升一级。剪线婆：每条红线每层 +3 币、每条绿线每层 +1 躁动，送达 +25。黑老大：每层存 8 币、+1 躁动，送达兑现，中途请离要赔 30 币。',
    '冷面护士长：全车每层 −2 躁动，自己每层耗 2 电，送达后躁动上限永久 +2。哭丧女：每层 +1 躁动，高躁动时每层 +10 币，送达 +15。死灵师：车上每位暗黑版每层 +2 币、每层 +1 躁动，送达 +20。赌王：到站那层关门时低躁动付 80，否则拿走你 25。另一个13号：每层随机 +8 币、+2 躁动、−2 电或无事，送达随机 0–40 币。',
    '暗黑传奇都有新画像、故事、台词、英文和档案页（档案新增“暗黑传奇 · n/8”）；卡上最后一行写“送到 70 层：……”，座位上显示各自的状态（收魂 +6币/层、押注中……）。',
    '神秘人线索：身份揭晓前，卡上有一条线索，每条都对得上两种身份：一直盯着车门（便衣/逃犯）、手里攥着一沓现金（逃犯/富商）、衣着考究，彬彬有礼（富商/好心人）、主动帮人按住电梯门（好心人/便衣）。同一位神秘人的线索不会变。',
    '隐藏的暗黑共鸣：车上至少 4 人、全是暗黑版或暗黑传奇时，躁动每层 −2，每人每层 +1 金币。规则和卡片上都不写；第一次触发时车厢闪紫光、弹出“暗黑共鸣”，档案里记下这个秘密。',
    '放人提示会说出新增的整车躁动（例如“注意：夜班老周关了灯 +2躁动/层”）；下车卡的负数显示为 −25（原来是 +-25）；传奇不再出“到站 0”；危机提示会提到安全余量；能力位满时，安全余量卡显示卖出后的效果（0/8 → 0/10）；结算说明遇到深渊会给专门建议；地区名从楼层显示器后面挪到车厢左上角。',
    '数值：劫匪车费 12→18，教练 8→7，炸弹客 30→26。',
  ],
  experiments: [
    '模拟器验收 4200 局：均衡型中位 115→91 层（p10 79，p90 125→96）；所有熟练型只有 0.6% 抵达 100 层，没有一局活过 150 层；合作型、安静秩序型从中位约 139 层降到 91 层；真人型中位 63 层（p90 81），新手 49 层。',
    '分步对照：只加 90 层起的深渊躁动，均衡型 101 层、p90 112；提前到 80 层，92 层、p90 109；改成每 5 层一级，91 层，但合作型 p90 仍有 109，因为熟练型只带神秘人、百变人、复制人躲过去；再加上 90 层起全是暗黑版，p90 94–97，抵达 100 层 0.5–0.6%。',
    '暗黑传奇上车率（均衡型，第四张卡）：黑老大 85%→67%（暂存 10→8，请离赔 30），冷面护士长 85%→30%（−3→−2，耗电改为她自己的），剪线婆 56%，哭丧女 50%，死灵师 41%，另一个13号 63%，夜班老周 38%，赌王 38%（机器人常输）。',
    'fuzz 测试第一次加入暗黑传奇（4000 个随机状态），抓到两个真 bug：夜班老周省电和飞轮节能重复计算；13号房客和另一个13号同车时预报少算。都已修好。',
    '浏览器试玩 10 局（中文 6 局、英文 2 局、手机 1 局，深渊里手动用道具 2 局）：91、93、86、89、93、91、61、91、83、93 层，没有一局到 100 层。第 9 局用了 QA 钩子凑暗黑车厢来检查横幅，不算自然局。',
    'verify：v9 检查 42 组，新增 v9.20 组（暗黑传奇的出现和回报、共鸣条件、线索、深渊躁动、照明弹货架、档案、放人提示）；三值 fuzz 4000 次，包含暗黑传奇。',
  ],
  watch: [
    '死因约 91% 是躁动（旧的验收目标“躁动 20–40%”仍标为不通过）。让人物决定深夜的结局是有意的，但要看玩家会不会觉得最后十层单调。',
    '深渊最后几层的选择偏少，主要靠照明弹、镇静剂、安全余量。',
    '暗黑共鸣和死灵师、讼棍叠在一起很赚（第 1 局 5 层 +88 币），作为隐藏流派先保留。',
    '85 层药贩下车（戒断）正好碰上深渊加一级，一层能跳 7 点躁动。',
    '劫匪上车率仍低于 15%；不宽裕的两项验收仍不通过；纸箱仍算作“至少一位乘客”。',
  ],
};

export const V920_EN: ChangelogEntry = {
  version: '9.20.0', date: '2026-09-25', title: 'The abyss and the dark legends: a wall before 100F, legends after midnight, Mystery clues, a hidden resonance',
  summary: 'Four requests from the player: as good as nobody should reach 100F; the eight legends get dark versions; the Mystery shows a clue you can guess from; an all-dark cabin earns a reward that no card mentions. Tuned first in the simulator until skilled bots almost never reach 100F, then ten browser playtests with fixes between runs; notes in docs/playtests/v920-playtest-notes.md.',
  changes: [
    'Abyss unrest: from 80F every dark rider adds +1 agitation of his own per floor, +1 more every 5 floors (+2 at 85F, +3 at 90F, +4 at 95F). A Nurse, Pusher or Good Samaritan beside him cancels it; a Flare or a Sedative blocks it. One floor before each step an “abyss” banner says so, ahead of the danger banner.',
    'From 90F every new card is a dark version; riders with no dark self (Mystery, Shifter, Mimic) stop appearing. From 80F every shop shelf has a Flare.',
    'Dark legends: leaving the 60F shop, the fourth card is the dark self of this shift’s legend (a random one when there was none); they board at 60F, leave at the 70F shop and pay no fare. Night Zhou: motor −2 power (even when full), +2 agitation/floor; leaves a free power-box level. Severer: +3 coins per red link/floor, +1 agitation per green link/floor; pays 25. Kingpin: banks 8 coins/floor, +1 agitation/floor, pays the bank on arrival; dismissing him costs 30.',
    'Cold Matron: cabin −2 agitation/floor, uses 2 power/floor herself; agitation cap +2 for good. Banshee: +1 agitation/floor, +10 coins/floor at high; pays 15. Necromancer: +2 coins per dark rider/floor, +1 agitation/floor; pays 20. High Roller: +80 if the doors close at low agitation before his stop, otherwise takes 25. Other Thirteen: each floor +8 coins, +2 agitation, −2 power or nothing; pays 0–40 at random.',
    'Every dark legend has a new portrait, story, lines, English text and an archive page (“Dark legends · n/8”); the card’s last line says “Deliver to 70F: …”, and each seat shows its state (Collecting souls +6 coins/floor, Betting …).',
    'Mystery clues: before the reveal the card shows one clue that fits two identities: Keeps watching the doors (Undercover/Fugitive), Clutching a wad of cash (Fugitive/Magnate), Well dressed and polite (Magnate/Good Samaritan), Holds the door for others (Good Samaritan/Undercover). A Mystery’s clue never changes.',
    'Hidden dark resonance: with at least 4 riders aboard, all dark versions or dark legends, agitation −2 and +1 coin each per floor. No rule or card mentions it; the first time, the cabin flashes violet with a “Dark resonance” banner and the archive records the secret.',
    'Placement notes now name new cabin-wide agitation (“Heads-up: Night Zhou turned the lights off +2 agitation/floor”); negative exit coins read −25 (was +-25); legends no longer print “arrives 0”; the shop crisis mentions Safety Margin; with full slots Safety Margin previews the result after a sale (0/8 → 0/10); endings give abyss-specific advice; the district name moved from behind the floor indicator to the cabin’s top-left corner.',
    'Values: Robber fare 12→18, Coach 8→7, Bomb Carrier 30→26.',
  ],
  experiments: [
    'Acceptance, 4,200 runs: balanced median 115→91F (p10 79, p90 125→96); only 0.6% of skilled runs reach 100F and none survive to 150F; Cooperation and Quiet from about 139F to 91F; human-like 63F (p90 81), novice 49F.',
    'Steps: abyss unrest from 90F alone gave balanced 101F (p90 112); from 80F 92F (p90 109); one step every 5 floors 91F, but Cooperation p90 stayed 109 because skilled bots dodged with Mysteries, Shifters and Mimics; adding “all dark from 90F” brought p90 to 94–97 and 100F reach to 0.5–0.6%.',
    'Dark legend boarding (balanced, fourth card): Kingpin 85%→67% (bank 10→8, dismissal 30), Cold Matron 85%→30% (−3→−2, power now her own), Severer 56%, Banshee 50%, Necromancer 41%, Other Thirteen 63%, Night Zhou 38%, High Roller 38% (bots often lose).',
    'The first fuzz run with dark legends (4,000 random states) caught two real bugs: Night Zhou’s saving and the flywheel counted twice; the forecast missed the Stranger and the Other Thirteen riding together. Both fixed.',
    'Ten browser playtests (6 Chinese, 2 English, 1 phone, 2 with items by hand in the abyss): 91, 93, 86, 89, 93, 91, 61, 91, 83 and 93F; none reached 100F. Run 9 used the QA hook to build a dark cabin for the banner check and does not count as a natural run.',
    'verify: 42 v9 check groups with a new v9.20 group (dark legend offers and rewards, resonance conditions, clues, abyss unrest, the Flare shelf, the archive, placement notes); the 4,000-state three-value fuzz now includes dark legends.',
  ],
  watch: [
    'About 91% of endings are agitation (the old “agitation 20–40%” target still fails). Late endings decided by riders is intended; watch whether the last ten floors feel monotonous.',
    'Few choices in the deepest floors beyond the Flare, Sedatives and Safety Margin.',
    'Dark resonance stacked with the Necromancer and Shysters pays a lot (run 1: +88 coins in 5 floors); kept as a hidden strategy for now.',
    'At 85F a Pusher leaving (withdrawal) can meet an abyss step: 7 agitation in one floor.',
    'Robber boarding still below 15%; the two “not affluent” checks still fail; a box still counts as “at least one rider”.',
  ],
};

export const V9201_ZH: ChangelogEntry = {
  version: '9.20.1', date: '2026-09-25', title: '深渊变成赌局：人物越来越极端，失控概率明码标价',
  summary: 'v9.20.0 的深渊给每位暗黑版加固定躁动，结果九成的局都被慢慢耗到失控。这一版改成：深渊里的暗黑版越来越极端，车费越来越高，但每层都有几率发作。卡上写着几率，关门前告诉你这一层失控的概率。玩家为了钱去赌，最后多半是赌输了才结束。',
  changes: [
    '取消“深渊躁动”（每位暗黑版每层固定 +1/+2/+3…）。',
    '深渊从 80 层起、每 5 层加一级。深渊里上车的暗黑版车费每级 +50%（第 2 级 ×2）。',
    '发作：车上每位暗黑版每层有 8%×级数（最高 50%）的机会发作。狂徒、黑警、讼棍、怨偶、劫匪、药贩、怪童、监工、丑闻明星、疯炸客发作是 +3 躁动；拆机人、怨灵、加班魂、召魂人、走私客、贪腐检查员、噪音乐手、偷拍客发作是吸走 6 电。照明弹让这一层谁都不发作；被打了镇静剂的人不发作；护士、药贩挡不住。',
    '卡上和座位上写着几率：“发作 16% · +3躁”或“−6电”；深渊里的卡面车费已含加价。',
    '关门前算出这一层的真实失控概率（躁动到上限或断电），左侧写“失控 7%”。有 5% 以上的风险时，上行按钮要再按一次，提示写“赌一把？这一层有 7% 会失控”，列出会发作的人，并给出“安抚到稳”的按钮。原来的“一定会失控”的警告不变。',
    '发作时座位红色一震、弹出“发作！”；吸电写进本层说明。深渊每加一级，横幅写出新的加价和发作几率；失控时的结算说明给出深渊专门的建议。',
  ],
  experiments: [
    '模拟器验收 4200 局：熟练型死因从 电量 7.5% / 躁动 91.1% / 炸弹 1.4% 变为 33.1% / 66.2% / 0.7%；均衡型 48% 断电 / 51% 躁动，五个流派的合理购物版都在 44–53% 断电。均衡型中位 91→87 层（p90 94），抵达 100 层 0.4%，没有一局活过 150 层；真人型中位 63 层。',
    '偏爱普通人的合作型、安静秩序型仍有 76–87% 死于躁动。检查它们最后一层的来源，主要是“发作”（330/345 点），其次是急躁乘客：死因虽然还是躁动，但它们是赌输的。',
    '人物上车率检查第一次全部通过（劫匪回到 15% 以上）。',
    '调参过程：只有“加躁动”一种发作时，各型中位 84–86 层、躁动仍占约 95%；加入吸电型并把几率从 10% 降到 8%、吸电 5→6 后，得到上面的结果。',
    'fuzz 4000 个随机状态覆盖发作的上下限；新增检查：发作的人、照明弹和镇静剂、预报的确定最坏值、单人时失控概率等于他的发作几率、深渊卡的加价。浏览器里在 86–88 层检查了卡片、座位几率、“失控 7%”、赌一把确认和发作特效（中英文）。',
  ],
  watch: [
    '真人型机器人大多在 60 多层就结束，死因约 94% 是躁动，那是中段的拥挤、急躁、小偷，不是深渊，这次没有改。',
    '5% 就要求再按一次，深渊里会很频繁；要看玩家觉得刺激还是烦。',
    '纸箱仍算作“至少一位乘客”，车上只有一个纸箱也能上行。',
  ],
};

export const V9201_EN: ChangelogEntry = {
  version: '9.20.1', date: '2026-09-25', title: 'The abyss becomes a gamble: riders grow extreme, the odds are on the table',
  summary: 'In v9.20.0 the abyss taxed every dark rider a fixed amount of agitation, so nine runs in ten were slowly ground into a boil-over. Now dark riders in the abyss grow extreme: they pay more and more, but each floor they may lash out. Their odds are on their cards, and before the doors close the game tells you the chance this floor ends the run. Players take the money, roll the dice, and most runs end on a bet that went wrong.',
  changes: [
    'Removed the flat abyss unrest (+1/+2/+3… per dark rider per floor).',
    'The abyss steps up every 5 floors from 80F. Dark cards drawn there pay +50% of their base fare per step (×2 at step 2).',
    'Outbursts: each dark rider aboard lashes out 8% × step of floors (at most 50%). Brawler, Crooked Cop, Shyster, Ex, Robber, Pusher, Uncanny Child, Taskmaster, Scandal and Mad Bomber add +3 agitation; Scrapper, Wraith, Overtimer, Summoner, Smuggler, Grafter, Noisemaker and Voyeur drain 6 power. A Flare stops every outburst for a floor; a sedated rider never lashes out; Nurses and Pushers cannot hold it.',
    'Cards and seats show the odds (“Lashes out 16% · +3 agit.” or “−6 power”); card fares in the abyss include the premium.',
    'Before the doors close the game computes the real chance this ascent ends the run (agitation at the cap or power out) and shows “Boil-over 7%”. From 5% the ascend button asks for a second press: “Feeling lucky? 7% chance to boil over this floor”, with who may lash out and a “Calm to safe” button. The certain-loss warning is unchanged.',
    'An outburst jolts the seat red with “Lashes out!”; power drains appear in the floor notes. Each abyss step’s banner states the new premium and odds; the ending gives abyss-specific advice.',
  ],
  experiments: [
    'Acceptance, 4,200 runs: skilled endings went from 7.5% power / 91.1% agitation / 1.4% bomb to 33.1% / 66.2% / 0.7%; balanced 48% power / 51% agitation, and the five strategies with sensible shopping all 44–53% power. Balanced median 91→87F (p90 94), 100F reached in 0.4%, none survive to 150F; human-like 63F.',
    'Cooperation and Quiet, which prefer normal riders, still end 76–87% on agitation; their last floor is mostly outbursts (330 of 345 points), then impatient riders: the label is agitation, but they lost a bet.',
    'The rider adoption check passes for the first time (Robber back above 15%).',
    'Tuning path: with agitation-only outbursts every strategy sat at 84–86F with ~95% agitation; adding the power-draining riders and lowering the odds from 10% to 8% (drain 5→6) gave the numbers above.',
    'The 4,000-state fuzz covers the outburst bounds; new checks for who lashes out, Flare and Sedative, the certain worst case, one rider’s loss chance equalling his odds, and the abyss fare premium. Browser checks at 86–88F of cards, seat odds, “Boil-over 7%”, the gamble confirmation and the outburst effect, in Chinese and English.',
  ],
  watch: [
    'The human-like bot mostly ends in the 60s, about 94% on agitation from mid-game crowding, impatience and Thieves rather than the abyss; not changed here.',
    'A second press from 5% may come up very often in the abyss; watch whether it feels tense or tiresome.',
    'A box still counts as “at least one rider”.',
  ],
};

export const V9207_ZH: ChangelogEntry = {
  version: '9.20.7', date: '2026-09-25', title: '英文版第 26–30 局：中文模式也不混英文、另一个13号写清楚、30 轮试玩收尾',
  summary: '30 轮英文版试玩的最后 5 局：在中文模式下反向扫了一遍英文，写清了另一个13号的四种结果，并用谨慎打法亲手检验了深渊的难度。30 局的完整笔记在 docs/playtests/v920-english-rounds.md。',
  changes: [
    '中文模式不再夹英文：楼层牌“当前楼层 · BEST”改成“当前楼层 · 最高”；电梯上方的“DOORS OPEN / IN TRANSIT / FIRST LINK · GUIDED SHIFT / LOVER SIGNAL · RESPONSE”在中文模式下写“门已开 / 运行中 / 第一条连线 · 引导班次 / 恋人信号 · 回应”。英文模式不变。',
    '另一个13号：卡面写明四种结果——“每层随机一种：+8币、+2躁动、−2电或无事”。原来只写“每层一件随机的好事或坏事”，看不出值不值得带。',
  ],
  experiments: [
    '中文模式反向检查（第 26 局，1–89 层）：只找到上面几处英文装饰字；按键名 ENTER、ESC 和底部型号“ELV–07”保留。这几轮新加的文字在中文模式下都是中文。',
    '深渊难度的亲手检验（第 29 局）：从 79 层的认真玩家状态开始，只带不会失控的人、钱花在安抚上，走到了 100 层。躁动全程没超过 6/10，卡住我的是电量（90 层剩 7，99 层剩 3）。发作概率提高后，冒险打法很难过 100 层（模拟 0.3%），但谨慎打法仍能勉强到达。再收紧要动电梯运转耗电，玩家说过不要调，所以不改。',
    '英文版试玩第 26–30 局：89 层断电（中文模式检查）、81 层躁动（我写的谨慎脚本出错，不计入评价）、第 28 局另一个13号（到 65 层）、102 层躁动（第 29 局，亲手过 100 层）、91 层躁动（第 30 局，手机，全新一局，英文审计全程零中文）。',
    '30 局合计：笔记里记下的修改 73 处（其中漏翻或半中半英的句子二十多处，全部修好）；新手引导、商店、午夜、深渊、14 件道具、全部 8 位暗黑传奇都亲手玩过或逐屏看过。',
    '规则和数值没有变，沿用 v9.20.4 的验收（4200 局：熟练型 断电 50.3% / 躁动 49.0%，抵达 100 层 0.3%）。verify 全部通过。',
  ],
  watch: [
    '谨慎的玩家仍可能刚好撑到 100 层，拦住他们的只有电量。',
    '深渊的钱仍然偏多（“不宽裕”两项验收不通过），但在深渊里钱主要用来安抚和补电，有实际用途。',
    '新手（按票价挑人）中位约 33 层，多数断电。',
    '剪线婆、黑老大、另一个13号的上车率仍在 80% 以上。',
  ],
};

export const V9207_EN: ChangelogEntry = {
  version: '9.20.7', date: '2026-09-25', title: 'English playtests 26–30: no English in the Chinese interface, the Other Thirteen spelled out, 30 rounds done',
  summary: 'The last five of the 30 English playtests: a reverse scan for English in the Chinese interface, the Other Thirteen’s four outcomes written on his card, and a hand-played check of how hard the abyss is. Notes for all 30 rounds are in docs/playtests/v920-english-rounds.md.',
  changes: [
    'No English in the Chinese interface: the floor plaque’s “BEST” and the words above the cabin (“DOORS OPEN / IN TRANSIT / FIRST LINK · GUIDED SHIFT / LOVER SIGNAL · RESPONSE”) now read in Chinese in Chinese mode. The English interface is unchanged.',
    'Other Thirteen: his card lists the four outcomes, “Each floor, one at random: +8 coins, +2 agitation, −2 power or nothing”. It used to say only “Something good or bad every floor”, which gave no way to judge him.',
  ],
  experiments: [
    'Reverse check in Chinese mode (round 26, floors 1–89): only the decorative words above; the key names ENTER and ESC and the “ELV–07” footer stay. Every string added in these rounds is Chinese in Chinese mode.',
    'Hand-played abyss check (round 29): from a careful player’s 79F state, boarding only riders who could not boil over and spending coins on calming, I reached 100F. Agitation never went past 6/10; power was the wall (7 left at the 90F shop, 3 at 99F). With the higher outburst odds a risk-taking style rarely passes 100F (0.3% in the simulator), but careful play can still just make it. Tightening further would mean touching the lift’s own power, which the player asked me not to do, so it stays.',
    'English playtests 26–30: 89F power (Chinese-mode check), 81F agitation (my careful-player script misfired; not counted), round 28 the Other Thirteen (to 65F), 102F agitation (round 29, past 100F by hand), 91F agitation (round 30, phone, a fresh run with the English audit finding no Chinese at all).',
    'All 30 rounds: 73 fixes recorded in the notes (more than twenty of them untranslated or half-translated lines, all fixed); the guided shift, shops, midnight, the abyss, all 14 items and all 8 dark legends were played by hand or checked screen by screen.',
    'No rule or number changed; the v9.20.4 acceptance stands (4,200 runs: skilled 50.3% power / 49.0% agitation, 100F reached in 0.3%). verify passes.',
  ],
  watch: [
    'A careful player can still just reach 100F; only power stops them.',
    'The abyss still pays well (the “not affluent” checks fail), though there the coins go to calming and charging.',
    'Novices (picking by fare) reach a median of about 33F, mostly running out of power.',
    'The Severer, Kingpin and Other Thirteen are still boarded over 80% of the time.',
  ],
};

export const V9206_ZH: ChangelogEntry = {
  version: '9.20.6', date: '2026-09-25', title: '英文版第 21–25 局：道具逐个验过、圣水真的管用、座位上看得见道具',
  summary: '30 轮英文版试玩的第 21–25 局：14 件道具逐个用了一遍，三位没亲手玩过的暗黑传奇（哭丧女、死灵师、剪线婆）各走了一段，并系统检查了座位状态的英文。笔记在 docs/playtests/v920-english-rounds.md。',
  changes: [
    '圣水：被净化的人这一趟不会再被同化（和护身符一样）。原来旁边有两位暗黑版时，他两层后又会被同化回去，花 60 币可能白买（第 21 局）。',
    '座位角标：戴手铐、设了闹钟、不会被同化（护身符或圣水）、吃了镇静剂、贴了封条的人，座位右下角有小图标，悬停有说明。原来这些只写在状态行里，而手机和窄屏的座位太矮，状态行被隐藏。',
    '英文：走私客的座位标签补上黑箱版本（“No black box · +1 agitation per floor · pays nothing”等），原来显示成“没有black box · 每层+1Agitation · 不付钱”（第 23 局）。',
  ],
  experiments: [
    '道具专项（第 21、22 局）：圣水、手铐、护身符、闹钟、备用电池、封条、延时引信、糖果、香薰、引线剪、请离券、换位券，加上之前用过的照明弹和镇静剂，14 件道具的英文提示都通顺，选目标时只有合适的人会发光。',
    '暗黑传奇（第 23–25 局）：哭丧女在高躁动时每层 +10、送达 +15，但 67–69 层躁动一直在 9/10，赚的钱多半花在安抚上；死灵师送达 +20，每层按车上暗黑版人数收魂；剪线婆送达 +25，红线收益要靠玩家故意摆冲突。三位都成立，未改数值。',
    '座位状态英文检查：座位状态函数里 85 条中文标签逐条翻译，除走私客的黑箱版本外都有英文。',
    '模拟（150 局）：均衡型中位 88 层，真人型 77 层，和 v9.20.5 相同（圣水的改动对机器人几乎没有影响）。',
    'verify 全部通过；新增回归测试：圣水净化的人带有“不会被同化”。',
  ],
  watch: [
    '剪线婆、黑老大、另一个13号的上车率仍在 80% 以上：大多数时候是“白送一笔钱”的简单选择。',
    '座位角标只有 13px，在很小的手机上可能不够显眼。',
  ],
};

export const V9206_EN: ChangelogEntry = {
  version: '9.20.6', date: '2026-09-25', title: 'English playtests 21–25: every item checked, Holy Water that lasts, item badges on seats',
  summary: 'Playtests 21–25 of the 30 English rounds: all 14 items used one by one, three dark legends not yet played by hand (Banshee, Necromancer, Severer) ridden for a stretch each, and a systematic check of the English seat states. Notes in docs/playtests/v920-english-rounds.md.',
  changes: [
    'Holy Water: the purified rider cannot be corrupted again this trip (like the Amulet). With two dark riders beside him he used to turn back within two floors, so 60 coins could buy nothing (round 21).',
    'Seat badges: handcuffed, alarm set, protected from corruption (Amulet or Holy Water), sedated and sealed riders show a small icon in the seat corner, with a tooltip. These used to live only in the state line, which phone and narrow seats are too short to show.',
    'English: the Smuggler’s seat labels now have black-box versions (“No black box · +1 agitation per floor · pays nothing”, …); round 23 showed a half-translated line.',
  ],
  experiments: [
    'Item checks (rounds 21–22): Holy Water, Handcuffs, Amulet, Alarm Clock, Spare Cell, Seal, Longer Fuse, Candy, Incense, Wire Cutter, Exit Pass and Swap Ticket, plus the Flare and Sedative used earlier: all 14 items read well in English, and only valid riders light up as targets.',
    'Dark legends (rounds 23–25): the Banshee pays 10 a floor at high agitation and 15 on delivery, but agitation sat at 9/10 through 67–69F and calming ate most of it; the Necromancer pays 20 and collects per dark rider aboard; the Severer pays 25, and her red-link income needs the player to stage conflicts. All three hold up; numbers unchanged.',
    'Seat-state English check: all 85 Chinese labels in the seat-state function were translated one by one; only the Smuggler’s black-box versions were missing.',
    'Simulation (150 runs): balanced median 88F, human-like 77F, the same as v9.20.5 (the Holy Water change barely touches the bots).',
    'verify passes, with a new regression test: a rider purified with Holy Water is protected from corruption.',
  ],
  watch: [
    'The Severer, Kingpin and Other Thirteen are still boarded over 80% of the time: most of the time they are a simple bonus.',
    'Seat badges are 13px and may be easy to miss on very small phones.',
  ],
};

export const V9205_ZH: ChangelogEntry = {
  version: '9.20.5', date: '2026-09-25', title: '英文版第 16–20 局：商店更顺手、手机上的商店不再翻两屏、每日班次看得见',
  summary: '30 轮英文版试玩的第 16–20 局：平板新存档走了一遍引导局，亲手玩了夜班老周，看了手机上的商店和每日班次。这一版只改界面，规则和数值不变。笔记在 docs/playtests/v920-english-rounds.md。',
  changes: [
    '商店充电：目标充不起时，多一个“买得起的最多：充入 N 电”按钮，不用再去拖滑杆（第 18 局：60 层升了蓄电后只剩 50 币，充电按钮直接变灰）。',
    '商店充电：这一段需要的电超过电量上限、而蓄电还能升级时，提示“或者升级蓄电，提高上限”（第 18 局：40 层上限 60、这一段约需 70，只提示途中补电）。',
    '手机商店：三张能力卡改成横向滑动的一排，每张 84% 宽，露出下一张的一角；原来三张竖排，要往下翻两屏才到充电区（第 19 局）。',
    '每日班次：手机和窄屏上顶栏也显示“DAILY SHIFT · 日期”（第 20 局：窄屏隐藏了这行，玩的时候看不出是每日班次）。',
  ],
  experiments: [
    '英文版试玩第 16–20 局：90 层断电（平板，新存档，引导局到商店都看了一遍）、47 层断电（窄屏，两次开局都在中段断电，机器人的问题）、89 层断电（窄屏，59–70 层亲手玩夜班老周）、91 层躁动（手机，赌输了 30%）、每日班次 99 层断电（窄屏，结算页写着“今日最佳 99 层”）。',
    '引导局（平板）：两位恋人并排后出现绿色协作线、座位显示“Paired”、车费 5→11，底部说明配对规则；第一次配对很好懂。',
    '夜班老周：带上后下一层耗电 −4→−2，到店预计剩电 32→39；但每层 +1 躁动会打断维修工和检查员的低躁动条件，65–69 层躁动一直在 7/8。70 层商店显示“Wrench: free”。取舍成立，未改。',
    '规则和数值没有变，沿用 v9.20.4 的验收（4200 局：熟练型 断电 50.3% / 躁动 49.0%，抵达 100 层 0.3%）。',
    '试玩用的代打脚本：断电警告里有补电或加急补电按钮时先点；页面在隐藏窗格里重开后，快照不会被新局覆盖。',
  ],
  watch: [
    '能力说明偏长（20–40 个词），第一次进店的人要读很多；手机上改成横向滑动后好一些。',
    '教练和名人之间的赌局红线，一对每层多耗 4 电，中段电量紧时最容易把人拖死。',
    '暗黑传奇里剪线婆、黑老大、另一个13号的上车率仍在 80% 以上。',
  ],
};

export const V9205_EN: ChangelogEntry = {
  version: '9.20.5', date: '2026-09-25', title: 'English playtests 16–20: a friendlier shop, a phone shop without two screens of scrolling, a visible daily shift',
  summary: 'Playtests 16–20 of the 30 English rounds: a new-profile guided shift on a tablet, Night Zhou played by hand, and a look at the phone shop and the daily shift. This release changes only the interface; rules and numbers are unchanged. Notes in docs/playtests/v920-english-rounds.md.',
  changes: [
    'Shop charging: when the target is unaffordable, a second button offers “All you can afford: +N power”, so there is no need to drag the slider (round 18: after buying Storage at 60F only 50 coins were left and the charge button just greyed out).',
    'Shop charging: when the next sector needs more power than the cap and Storage can still be upgraded, the note adds “or raise the cap with Storage” (round 18: a 60 cap against a sector of about 70, and the note only mentioned in-transit charging).',
    'Phone shop: the three ability cards share one sideways-scrolling row, each 84% wide with the next one peeking in; stacked, they pushed charging two screens down (round 19).',
    'Daily shift: phones and narrow windows show “DAILY SHIFT · date” in the header too (round 20: that line was hidden, so nothing said this was the daily).',
  ],
  experiments: [
    'English playtests 16–20: 90F power (tablet, new profile, guided shift through the first shop), 47F power (narrow, both attempts ran dry mid-game, the bot’s fault), 89F power (narrow, Night Zhou by hand at 59–70F), 91F agitation (phone, lost a 30% bet), the daily shift 99F power (narrow; the end screen shows today’s best 99F).',
    'Guided shift (tablet): seating the two Lovers together draws the green cooperation line, the seats say “Paired”, the fare goes 5→11 and the footer explains the pairing; the first pair is easy to understand.',
    'Night Zhou: the next floor’s power went from −4 to −2 and the shop forecast from 32 to 39, but his +1 agitation a floor breaks the Mechanic’s and Inspector’s low-agitation streaks, and agitation sat at 7/8 through 65–69F. The 70F shop shows “Wrench: free”. A real trade-off; unchanged.',
    'No rule or number changed; the v9.20.4 acceptance stands (4,200 runs: skilled 50.3% power / 49.0% agitation, 100F reached in 0.3%).',
    'Playtest autopilot: it presses the alert’s charge or overtime-charge button first; a page restarted in a hidden pane no longer overwrites a deeper snapshot.',
  ],
  watch: [
    'Ability descriptions run 20–40 words, a lot to read on a first shop visit; the sideways row on phones helps.',
    'The Coach–Celebrity gamble link costs a pair 4 more power a floor and is the likeliest mid-game power trap.',
    'The Severer, Kingpin and Other Thirteen are still boarded over 80% of the time.',
  ],
};

export const V9204_ZH: ChangelogEntry = {
  version: '9.20.4', date: '2026-09-25', title: '英文版第 11–15 局：赌王真的在赌、深渊更难撑到 100 层、疯炸客显示秒数',
  summary: '30 轮英文版试玩的第 11–15 局。认真玩的深局里，我 5 局有 3 局过了 100 层（第 7、8、11 局）：深渊里钱多，安抚、照明弹、镇静剂能把每一次赌局都化解掉。这一版把深渊发作概率调高一点，把赌王从“白送 40 币”改成真正的赌局，并修掉这几局里发现的漏翻和误导。笔记在 docs/playtests/v920-english-rounds.md。',
  changes: [
    '深渊发作：每一级从 8% 提高到 10%（85 层 20%、90 层 30%、95 层 40%、100 层起 50% 封顶），发作的效果不变（+3 躁动或吸走 6 电）。',
    '赌王：改成 69 层关门那一刻的躁动每点付 8 币；躁动为 0 就一分没有。原来是“不是高躁动就 +40”，第 11 局我整段躁动 0–2，白拿 40。想多拿就得把躁动推高，同时冒失控的风险；70 层是商店，可以用“到店降躁动”补救。座位显示“押注中 · 按现在的躁动 +N币”。',
    '疯炸客的卡面显示倒计时秒数（原来显示旧的楼层引信“⏱ 5”，座位上却是秒）。',
    '讼棍卡面写明“身边的劫匪谁也管不住”（第 11 局：黑警就在旁边，劫匪还是抢了我的钱）。',
    '复制人的搭档提示不再算传奇和箱子（“可复制 · 赌王”其实只能复制到 0）。',
    '维修工英文“motor −1 for 4 floors”（原来少了 floors，和进度 0/2 连成“40/2”）。',
    '高躁动时躁动栏显示“事故 20%”，悬停说明这一层可能有一位乘客提前下车、不付车费（第 11 局：刚上车的偷拍客一站没坐就走了，出发前没有任何提醒）。',
    '平板：候客卡的标签可以在卡内折成两行（第 7 局改成不折行后，醉汉的“急躁”标签被卡片右边缘截断）。',
    '英文：合并计数的红线提示（“2 red links with the Celebrity (both use ×2 power)”）；两人同时发作的“吸走 6 电 ×2”；一层的几条消息用“ · ”连在一起时逐段翻译。',
  ],
  experiments: [
    '收紧深渊的三种办法，每种 200 局 × 3 种机器人（抵达 100 层）：原版 均衡 2.5% / 合作 4.0%；深渊加价减半 3.0% / 6.0%（大家少带暗黑版，反而更容易）；发作每级 10% 0.5% / 0.5%，中位 88→87 层，真人型不受影响；两者都用 1.0% / 4.0%。采用发作每级 10%。',
    '赌王新规则 150 局：上车率 97%→79%，平均拿到 28 币（机器人习惯把躁动压低）。',
    '模拟器验收 4200 局：熟练型死因 断电 50.3% / 躁动 49.0% / 炸弹 0.8%；抵达 100 层 1.0%→0.3%；均衡型中位 89→87 层（p90 94）；真人型 78 层（断电 49% / 躁动 48%）；新手 34 层；均衡型上车率全部在 16–61%。',
    '英文版试玩第 11–15 局：103 层躁动（窄屏，60–70、80–100 层亲手玩，第三次过 100 层）、80 层躁动（手机，亲手试新赌王：69 层停在 6 点，拿到 48 币）、88 层断电（手机，黑老大 70 层兑现 70 币）、98 层断电（窄屏，80–86 层亲手玩）、89 层断电（平板，逐帧截图检查界面）。',
    '试玩用的代打脚本也修了：进店先用手动调节和最低抢救，充电时留出抢救的钱；途中补电按最坏情况判断。',
    'verify 全部通过；赌王的测试改成新规则（躁动 0 不付、躁动 9 付 72）。',
  ],
  watch: [
    '深渊的钱仍然很多（进 90 层商店时合作型平均 240 币，真人型 440 币），“不宽裕”两项验收仍不通过。',
    '80–89 层保守打法下候客卡大多是 ±0，这 10 层比较平淡。',
    '窗格隐藏时浏览器试玩要靠替代方案，截图会让页面重新开局，要靠快照恢复。',
  ],
};

export const V9204_EN: ChangelogEntry = {
  version: '9.20.4', date: '2026-09-25', title: 'English playtests 11–15: a High Roller who really bets, a harder road to 100F, the Mad Bomber’s seconds',
  summary: 'Playtests 11–15 of the 30 English rounds. In careful deep runs I passed 100F three times in five (rounds 7, 8, 11): the abyss pays so well that calming, Flares and Sedatives defuse every bet. This release raises the abyss outburst odds a little, turns the High Roller from a free 40 coins into a real bet, and fixes the leaks and misleading hints found in these rounds. Notes in docs/playtests/v920-english-rounds.md.',
  changes: [
    'Abyss outbursts: 10% per step instead of 8% (20% at 85F, 30% at 90F, 40% at 95F, capped at 50% from 100F); the effect is unchanged (+3 agitation or 6 power drained).',
    'High Roller: pays 8 coins per point of agitation at the moment the doors close on 69F; nothing at 0. He used to pay 40 unless agitation was high, and in round 11 I kept agitation at 0–2 and collected 40 for free. Now a bigger payout means pushing agitation up and risking a boil-over; 70F is a shop, where “Calm it at the shop” can save you. His seat shows “Betting · +N coins at this agitation”.',
    'The Mad Bomber’s card shows his countdown in seconds (it showed the old floor fuse “⏱ 5” while his seat counted seconds).',
    'The Shyster’s card says a Robber beside him walks free (round 11: a Crooked Cop sat right there and the Robber still robbed me).',
    'The Mimic’s partner hint skips legends and boxes (“Can copy · High Roller” could only copy 0).',
    'Mechanic in English: “motor −1 for 4 floors” (the missing word ran into the 0/2 progress as “40/2”).',
    'At high agitation the agitation panel shows “Incident 20%”, with a tooltip: one rider may leave early this floor without paying (round 11: a Voyeur who had just boarded left before his first stop, with no warning).',
    'Tablets: card tags may wrap to two lines inside the card (after round 7 made them one line, the Drifter’s impatient tag ran past the card edge).',
    'English: merged red-link notes (“2 red links with the Celebrity (both use ×2 power)”); two riders draining power at once (“draining 6 power ×2”); a floor’s notes joined with “ · ” are translated part by part.',
  ],
  experiments: [
    'Three ways to tighten the abyss, 200 runs × 3 bots each (reaching 100F): current balanced 2.5% / cooperation 4.0%; half the abyss fare premium 3.0% / 6.0% (fewer dark riders boarded, so it got easier); outbursts 10% per step 0.5% / 0.5%, median 88→87F, human-like unaffected; both 1.0% / 4.0%. Chose 10% per step.',
    'New High Roller, 150 runs: boarded 97%→79%, paying 28 coins on average (the bots keep agitation low).',
    'Acceptance, 4,200 runs: skilled endings 50.3% power / 49.0% agitation / 0.8% bomb; 100F reached 1.0%→0.3%; balanced 89→87F (p90 94); human-like 78F (49% power / 48% agitation); novice 34F; every balanced boarding rate within 16–61%.',
    'English playtests 11–15: 103F agitation (narrow, hand-played 60–70F and 80–100F, the third run past 100F), 80F agitation (phone, tried the new High Roller: stopped at 6 on 69F for 48 coins), 88F power (phone, the Kingpin paid 70 at 70F), 98F power (narrow, hand-played 80–86F), 89F power (tablet, screenshots of every key screen).',
    'The playtest autopilot was fixed too: at a shop it uses the manual relief and the minimum rescue first and keeps the rescue money while charging; in-transit charging is judged against the worst case.',
    'verify passes; the High Roller test uses the new rule (nothing at 0, 72 at 9).',
  ],
  watch: [
    'The abyss still pays a lot (at the 90F shop cooperation bots hold 240 coins on average, human-like 440); both “not affluent” acceptance checks still fail.',
    'With careful play most cards at 80–89F are worth about ±0, so those ten floors feel flat.',
    'Browser playtests with the pane hidden need a workaround, and a screenshot restarts the page’s run, so snapshots are needed to restore it.',
  ],
};

export const V9203_ZH: ChangelogEntry = {
  version: '9.20.3', date: '2026-09-25', title: '英文版第 6–10 局：商店前的躁动不再误报、教练值得带、走私客有配对提示、漏翻清零',
  summary: '30 轮英文版试玩的第 6–10 局：手机 2 局、平板 2 局、窄屏 1 局，其中第 8 局从 60 层起亲手打到 112 层，第一次穿过 100 层。每局记笔记，玩完马上修，再用改后的数据跑模拟。最大的发现是商店前一层的躁动警告会误报“必输”：商店其实能把超上限的躁动救回来。完整笔记在 docs/playtests/v920-english-rounds.md。',
  changes: [
    '商店前一层的躁动：商店层是检查点，到店时躁动超上限，只要进店后用手动调节（到店补满）和紧急维修（8 币/点）降回上限以下就能继续。以前“这一层会失控”“赌一把 X%”、需要安抚的点数都把它当成当场输，第 8 局 109 层警告“必输”，其实只带加班魂上行、到店修一下就安全。现在这些判断都把商店能救回的量算进去，躁动栏会显示“到店要降躁动”。',
    '教练：车费 7→10；教练到站时每位邻座多付 3 币（原 2）。仍是每层 2 电。一个人出现时卡上不再是明显的亏本。',
    '走私客：卡上像快递员一样显示“配黑箱 +N 金币”（第 8 局：单独 −9，放上黑箱 +11，但卡上没写）；黑箱没上车的提示写走私客和黑箱，不再说“快递员的纸箱”。',
    '冷面护士长卡：数值行只写“不付车费”；效果行改成“全车 −2躁动/层 · 她的药品每层耗 1 电”（英文原来写“+1 power/floor”，读起来像给电）。',
    '途中补电：预报会在商店前断电时，按钮一次补到够撑到商店（钱不够就补能买的最多），不用再一下一下点“+1”；断电警告里也有“补足本段”。',
    '镇静剂说明写明“不会深渊发作”。',
    '疯炸客、炸弹客的座位说明按语言显示；实时倒计时里原来的“来不及！”改成“快上行！/Hurry!”（第 8 局 2.19 秒、1 站，按下上行后准时送到）。',
    '英文漏翻和半中半英：收据“1号位 · Lover”→“Seat 1 · Lover”；配电箱升级、老周免费升级、卖出能力、抢救钱不够的提示都有整句英文；商店收据写“Coins / Power / Agitation (cap +2)”，不再出现中文括号；列表里的“小偷急躁 +1”不再变成“ThiefImpatient +1”；残留的“High-risk”统一成卡上的“Impatient”；“1 coin left after charging”单复数。',
    '商店危机提示：只有这家店的免费能力还没选时，才建议“免费装上安全余量”（第 9 局：那张卡已经是灰的，提示还在推荐）。',
    '平板（701–1100px）：候客卡标题栏加宽，头像 56px，“Impatient: fare +4, +1/floor”“Lashes out 16% · −6 power”这类标签不再挤成竖条；长关系标签（黑警的“+Robber / Thief / Drifter / Brawler / Mad Bomber”）可以换行，候客卡这一排加高到 340px。',
    '新手引导（第 6 局，手机）：开场白的耗电规则换成一句“每十层有一家商店；关门前先看电量和躁动的预报”；“让两位恋人成为邻座”的示例提示在手机上移到候客卡上方。',
  ],
  experiments: [
    '教练四种改法各 150 局（真人型 / 均衡型 / 新手上车率）：原版 3% / 35% / 28%；改回 1 电 46% / 68% / 33%（均衡型超出 65% 的区间，太强）；每位邻座 +4 币 3% / 43% / 28%（真人型看不出来）；车费 10、邻座 +3 28% / 45% / 35%，中位楼层不变。采用最后一种；改完复测真人型 30%、均衡型 47%。',
    '模拟器验收 4200 局：熟练型死因 断电 53.2% / 躁动 46.0% / 炸弹 0.8%；真人型中位 76→78 层（断电 51% / 躁动 46%）；均衡型中位 88→89 层（p90 96），抵达 100 层 1.0%；新手 34 层。均衡型上车率全部在 15–61%（教练 35%→45%，贪腐检查员 15% 在下限上）。暗黑传奇：赌王 97%、另一个13号 86%、黑老大 84%、剪线婆 82%、夜班老周 68%、死灵师 62%、哭丧女 57%、冷面护士长 32%。',
    '英文版试玩第 6–10 局：59 层断电（手机，新存档）、101 层躁动（平板）、112 层躁动（窄屏，60 层起亲手玩，第一次过 100 层）、54 层躁动（手机，第一次开局在 22 层因 HMR 作废）、56 层断电（平板，机器人没理会补电警告）。',
    'verify 全部通过；新增回归测试：商店前一层躁动到上限但能在店里修回来时失控概率为 0，没钱修时仍是赌局，进店后紧急维修能让你继续。教练的两条车费测试改成新数值。',
  ],
  watch: [
    '新手中位约 33 层，主要断电：新手按票价挑人，而贵的人物大多 2 电。真人新存档第 6 局到了 59 层，继续看。',
    '暗黑共鸣加冷面护士长时，80–90 层躁动几乎一直是 0，深渊只剩电量压力（第 8 局）。',
    '100 层以后空车不能出发，而卡全是暗黑版，经常只能二选一地赌。',
    '第 8 局连点补电时电量栏闪过一次“−55/90”（实际 28），没能复现。',
    '监工的上车率 16%，接近 15% 的下限。',
  ],
};

export const V9203_EN: ChangelogEntry = {
  version: '9.20.3', date: '2026-09-25', title: 'English playtests 6–10: no false alarm before a shop, a Coach worth taking, the Smuggler’s pair hint, no more untranslated text',
  summary: 'Playtests 6–10 of the 30 English rounds: two on a phone, two on a tablet, one narrow. In round 8 I played by hand from 60F to 112F, the first run past 100F. Each round was noted, fixed straight away and re-simulated with the new data. The biggest find: the agitation warning on the floor before a shop called some ascents certain losses when the shop could have fixed them. Full notes in docs/playtests/v920-english-rounds.md.',
  changes: [
    'Agitation before a shop: a shop floor is a checkpoint. Arriving over the cap only ends the shift if you cannot get back under it in the shop, with the manual relief (refilled on arrival) and the emergency repair (8 coins a point). The “boils over this floor” warning, the “Feeling lucky? X%” gamble and the calm needed all used to count it as an instant loss. In round 8 at 109F the warning said the run was lost, when carrying just the Overtimer and repairing at the shop was safe. They now count what the shop can fix, and the agitation panel says “Calm it at the shop”.',
    'Coach: fare 7→10; each neighbor still beside him pays 3 on his arrival (was 2). Still 2 power a floor. His card no longer reads as a clear loss when he appears alone.',
    'Smuggler: his card shows “w/ Black Box +N coins” like the Courier’s crate (round 8: −9 alone, +11 with the box, and nothing said so); the missing-box alert names the Smuggler and his black box instead of “the Courier’s box”.',
    'Cold Matron card: the value line says only “No fare”; the effect line reads “Cabin −2 agitation/floor · her drugs use 1 power/floor” (it said “+1 power/floor”, which read like a gain).',
    'In-transit charging: when the forecast runs out before the shop, the button charges enough to reach it in one press (or as much as you can afford) instead of “+1” a press; the power alert offers “Top up sector” too.',
    'The Sedative says it also stops abyss outbursts.',
    'Bomb seats show their captions in the current language; with a real-time fuse, the old “Too late!” now reads “Hurry!” (round 8: 2.19 s and 1 stop, and pressing ascend still delivered him).',
    'English leaks and half-translated lines: the receipt’s arrival rows had a Chinese seat label and now read “Seat 1 · Lover”; the power-box upgrade, Night Zhou’s free level, selling an ability and the rescue shortfall have full English; the shop receipt writes “Coins / Power / Agitation (cap +2)” without Chinese brackets; “Thief impatient +1” no longer comes out as “ThiefImpatient +1” in lists; leftover “High-risk” wording now says “Impatient” like the cards; “1 coin left after charging”.',
    'Shop crisis hint: “take Safety Margin for free” only appears while this shop’s free pick is unused (round 9: the card was already greyed out).',
    'Tablets (701–1100px): a wider card title column and a 56px portrait keep tags such as “Impatient: fare +4, +1/floor” and “Lashes out 16% · −6 power” on one line; long relation chips (the Crooked Cop’s “+Robber / Thief / Drifter / Brawler / Mad Bomber”) wrap, and the waiting-card row is 340px tall.',
    'First run (round 6, phone): the intro’s motor schedule is replaced by one useful line, “There is a shop every ten floors; check the power and agitation forecast before the doors close”; the “seat two Lovers together” example sits above the waiting cards on phones.',
  ],
  experiments: [
    'Four Coach variants, 150 runs each (human-like / balanced / novice boarding): current 3% / 35% / 28%; back to 1 power 46% / 68% / 33% (balanced above the 65% band, too strong); +4 per neighbor 3% / 43% / 28% (invisible to human-like play); fare 10 and +3 per neighbor 28% / 45% / 35% with unchanged median floors. Chose the last; re-measured after the change at 30% human-like, 47% balanced.',
    'Acceptance, 4,200 runs: skilled endings 53.2% power / 46.0% agitation / 0.8% bomb; human-like median 76→78F (51% power / 46% agitation); balanced 88→89F (p90 96), 100F reached in 1.0%; novice 34F. Every balanced boarding rate is within 15–61% (Coach 35%→45%; the Grafter sits on the 15% floor). Dark legends: High Roller 97%, Other Thirteen 86%, Kingpin 84%, Severer 82%, Night Zhou 68%, Necromancer 62%, Banshee 57%, Cold Matron 32%.',
    'English playtests 6–10: 59F power (phone, new profile), 101F agitation (tablet), 112F agitation (narrow, hand-played from 60F, first run past 100F), 54F agitation (phone; the first attempt was lost to a hot reload at 22F), 56F power (tablet; the bot ignored the charge warning).',
    'verify passes, with a new regression test: at the cap before a shop the loss chance is 0 when the repair is affordable, still a gamble without the coins, and the shop repair lets you continue. The two Coach fare tests use the new values.',
  ],
  watch: [
    'Novice median is about 33F, mostly power: novices pick the priciest fares, and pricey riders mostly use 2 power. A real new profile reached 59F in round 6; keep watching.',
    'With dark resonance plus the Cold Matron, agitation stayed near 0 through 80–90F and the abyss only pressed on power (round 8).',
    'Past 100F an empty cabin cannot leave and every card is dark, so it is often a forced bet.',
    'Round 8 briefly showed “−55/90” power while charging quickly (really 28); not reproduced.',
    'The Taskmaster is boarded 16% of the time, near the 15% floor.',
  ],
};

export const V9202_ZH: ChangelogEntry = {
  version: '9.20.2', date: '2026-09-25', title: '人物耗电各不相同，死因一半一半；英文版前 5 轮试玩',
  summary: '按玩家要求：死因要断电和躁动大约一半一半，而且要从人物出发、不动电梯本身的耗电。人物耗电不再都是 1：带设备、排场大的人更耗电，车费相应提高；车厢挤满不再加躁动，改成风扇耗电。模拟器里熟练型和真人型都变成约一半一半，所有人物都有人用。同时开始 30 轮英文版试玩，这一版包含前 5 轮的修改；笔记在 docs/playtests/v920-english-rounds.md。',
  changes: [
    '人物耗电：音乐家、名人、教练、炸弹客、神秘人、加班魂、召魂人、监工、狂徒、贪腐检查员、噪音乐手、丑闻明星每层 2 电，疯炸客 3 电，其余仍是 1 电（幽灵、怨灵 0）。电梯运转耗电不变。',
    '车费跟着补：名人 12→18、音乐家 6→9、噪音乐手 6→12、丑闻明星 14→22、偷拍客 8→12、贪腐检查员 8→16、加班魂 6→8。',
    '车厢挤满：坐满 6 人不再每层 +1 躁动，改成风扇每层 +1 电（放人提示和电量明细里会写）。',
    '暗黑传奇：冷面护士长自己每层耗 1 电；赌王改为“到站那层不是高躁动付 40，高躁动拿走 40”（原来要低躁动才赢，几乎没人带）；夜班老周每层 +1 躁动（原 +2）；黑老大每层存 7（原 8）；另一个13号到站随机 0–25（原 0–40）。',
    '深渊赌局：失控概率 20% 以上才要求再按一次上行（原来 5%，深渊里一半楼层都要按两次）；只剩一人会发作时直接点名。',
    '英文版：预报区间和所有“支付”消息补上英文；“1 stop”单复数；赌王座位状态跟新规则；躁动标签可以换行；“危！”横幅只在刚进入危险时弹，不再每层重复；车上有会加躁动的暗黑传奇时，建议里会提“请离他”。',
    '说明书：玩法说明新增“午夜与深渊”“道具”，传奇段加上暗黑传奇，电量段加上风扇；躁动规则删掉已不存在的“夜深人躁”，新增深渊发作。',
    '平板（701–1100px）：改成两列，上行按钮在电梯下方；候客卡改成可以左右滑动的一排；名字不再截断，顶栏不再折行。',
    '配对提示只在配对后真的赚钱时显示。',
  ],
  experiments: [
    '模拟器验收 4200 局：熟练型死因 断电 51.7% / 躁动 47.6% / 炸弹 0.7%（v9.20.1 为 33.1 / 66.2 / 0.7）；真人型 断电 53% / 躁动 44%（原 4 / 94），中位 63→76 层；均衡型中位 87→88 层（p90 95），抵达 100 层 0.9%；新手 49→34 层（下限 25）。验收里的死因目标改成“电量、躁动各 35–65%”。',
    '拥挤的代价比较（每种 120 局）：只 +1 躁动时真人型 断电:躁动 = 15:99；+1 躁动 +1 电 40:76（新手掉到 32 层）；只 +1 电 63:53（真人型中位 77）；只 +2 电 86:34（真人型掉到 49 层）。采用只 +1 电。',
    '所有普通人物的上车率都在 17–62%，这是第一次没有越界的人物。曾经太低的：偷拍客 5%→39%、丑闻明星 2%→24%、噪音乐手 6%→21%、贪腐检查员 10%→17%。暗黑传奇：冷面护士长 5%→34%、赌王 0%→92%、夜班老周 21%→74%。',
    '英文版试玩 5 轮：99 层断电、68 层躁动、102 层躁动（连赌 35–69% 都没输）、95 层躁动（输了 32% 的赌局）、83 层躁动；窄屏 3 轮、平板 1 轮。英文审计记录画面上出现的所有中文，5 轮里只抓到上面这些漏翻。',
    'verify 全部通过（测试随人物耗电和车费更新：教练、炸弹客、名人的数值，坐满的检查改为风扇耗电）。',
  ],
  watch: [
    '暗黑传奇里赌王 92%、另一个13号 89%、黑老大 85% 仍然很好拿。',
    '偏爱普通人的合作型、安静秩序型仍有约 70% 死于躁动（多数是赌输）。',
    '60–80 层经常缺电，要看真人会不会觉得太紧。',
    '手机布局座位只显示三个数字，暗黑传奇的状态要点 ⓘ 才看得到。',
  ],
};

export const V9202_EN: ChangelogEntry = {
  version: '9.20.2', date: '2026-09-25', title: 'Riders use different power; endings split about half and half; first five English playtests',
  summary: 'The player asked for endings split roughly half power, half agitation, driven by the riders and without touching the lift’s own power. Riders no longer all use 1 power: those with gear or an entourage use more and pay more, and a packed cabin now costs fan power instead of agitation. In the simulator both skilled and human-like players now end about half and half, and every rider gets boarded. The first 5 of 30 English playtests are in this release; notes in docs/playtests/v920-english-rounds.md.',
  changes: [
    'Rider power: Musician, Celebrity, Coach, Bomb Carrier, Mystery, Overtimer, Summoner, Taskmaster, Brawler, Grafter, Noisemaker and Scandal use 2 power per floor, the Mad Bomber 3; everyone else still 1 (Ghost and Wraith 0). The lift’s motor power is unchanged.',
    'Fares follow: Celebrity 12→18, Musician 6→9, Noisemaker 6→12, Scandal 14→22, Voyeur 8→12, Grafter 8→16, Overtimer 6→8.',
    'Full cabin: all 6 seats taken no longer adds 1 agitation per floor; the fans cost 1 more power per floor instead (shown in placement notes and the power details).',
    'Dark legends: the Cold Matron uses 1 power per floor; the High Roller pays 40 unless agitation is high on arrival, then takes 40 (he used to need low agitation and was almost never boarded); Night Zhou +1 agitation per floor (was +2); the Kingpin banks 7 (was 8); the Other Thirteen pays 0–25 (was 0–40).',
    'Abyss gamble: the ascend button asks twice only from a 20% chance to end the run (5% asked on half of all abyss floors); with one rider left who may lash out, the warning names him.',
    'English: forecast ranges and every “paid” message translated; “1 stop”; the High Roller’s seat state matches his rule; agitation chips wrap; the danger banner shows only on entering danger instead of every floor; with a loud dark legend aboard the advice suggests dismissing him.',
    'Manual: new “Midnight and the abyss” and “Items” sections, dark legends in the legend section, fans in the power section; the agitation rules drop the removed late-night unrest and add abyss outbursts.',
    'Tablets (701–1100px): two columns with the ascend button under the cabin; waiting cards in a sideways-scrolling row; names no longer clipped; the header stays on one line.',
    'A pairing hint only appears when the pair actually earns.',
  ],
  experiments: [
    'Acceptance, 4,200 runs: skilled endings 51.7% power / 47.6% agitation / 0.7% bomb (v9.20.1: 33.1 / 66.2 / 0.7); human-like 53% power / 44% agitation (was 4 / 94), median 63→76F; balanced 87→88F (p90 95), 100F reached in 0.9%; novice 49→34F (floor 25). The acceptance death target is now “power and agitation each 35–65%”.',
    'Crowding cost compared (120 runs each): +1 agitation gave human-like power:agitation 15:99; +1 agitation +1 power 40:76 (novice fell to 32F); +1 power only 63:53 (human-like median 77); +2 power only 86:34 (human-like fell to 49F). Chose +1 power only.',
    'Every ordinary rider is boarded 17–62% of the time, the first time none is out of range. Previously too low: Voyeur 5%→39%, Scandal 2%→24%, Noisemaker 6%→21%, Grafter 10%→17%. Dark legends: Cold Matron 5%→34%, High Roller 0%→92%, Night Zhou 21%→74%.',
    'Five English playtests: 99F power, 68F agitation, 102F agitation (won bets at 35–69%), 95F agitation (lost a 32% bet), 83F agitation; three narrow, one tablet. An English audit logs every Chinese character that reaches the screen; the leaks above were all it found.',
    'verify passes (tests updated for the new power and fares of the Coach, Bomb Carrier and Celebrity, and for fan power instead of crowding agitation).',
  ],
  watch: [
    'Among dark legends the High Roller (92%), Other Thirteen (89%) and Kingpin (85%) are still easy picks.',
    'Cooperation and Quiet, which prefer normal riders, still end about 70% on agitation (mostly lost bets).',
    'Power is often short at 60–80F; watch whether real players find it too tight.',
    'Phone seats show only three numbers; a dark legend’s state needs the ⓘ.',
  ],
};

export const V9210_ZH: ChangelogEntry = {
  version: '9.21.0', date: '2026-09-25', title: '深渊前夜：80–89 层有了四个特殊楼层',
  summary: '以前 80–89 层保守打法下候客卡大多是 ±0，十层几乎没什么事。现在 80 层商店会公布接下来 81–89 层里的四个特殊楼层（静夜、暗涌、悬赏、夜市），每局位置随机、四种各一个，可以提前计划：在哪一层冒险、在哪一层带暗黑版、钱留到哪里花。电梯本身的耗电没有改。',
  changes: [
    '80 层商店顶部显示“深渊前夜 · 下面十层的安排”：81–89 层中随机四层，静夜、暗涌、悬赏、夜市各一个。81–89 层时，侧栏也有这张日程，已过的划掉，当前层高亮，并写着这一层的规则；到达这些楼层时有横幅提醒。',
    '静夜：从这一层出发时，暗黑版都不惹麻烦——不会发作，卡上的发作几率也不显示（和照明弹一样）。',
    '暗涌：从这一层出发时，发作几率 ×2（封顶 50%，例如 85 层 20%→40%）。出发前的“失控几率”和赌局提醒都按翻倍后的几率算。',
    '悬赏：这一层有一位候客带着悬赏（优先选暗黑版，没有就选一位普通乘客；不会是箱子或传奇），卡上标着“悬赏 +20”，送到多给 20 币，车费明细里单列一行。',
    '夜市：门外有个摊位，按商店价卖三件道具（和商店的道具一样抽取，已经买过的不再出现），只在这一层能买，出发后收摊。',
    '修正：照明弹生效的那一层，卡上仍然显示“发作 20%”，现在和静夜一样不显示。',
    '说明书“午夜与深渊”一节写了四种特殊楼层。',
  ],
  experiments: [
    '80–88 层逐层统计，200 局 × 3 种机器人（改前 → 改后）：均衡型“这一层什么都没发生”22%→14%，有风险的楼层 42%→37%，39% 的楼层碰上特殊楼层；合作型“什么都没发生”13%→8%。中位楼层 87→88，到 90 层 34%→37%，到 100 层 0.5%→0.5%。机器人不会按日程提前计划，只在夜市有余钱（买完还剩 ≥40 币）时买照明弹或镇静剂，失控几率 ≥20% 时用掉。',
    '模拟器验收 4200 局：熟练型死因 断电 52.4% / 躁动 46.7% / 炸弹 0.9%（v9.20.4 是 50.3 / 49.0 / 0.8）；抵达 100 层 0.3%→0.6%（目标 ≤5%）；均衡型中位 87 层（p10–p90 80–94）；真人型 78 层；新手 34 层；均衡型上车率全部在 16–61%。“不宽裕”两项仍不通过（进店钱够 66.4%，离店中位 28 币），和以前一样。',
    '浏览器试玩（英文窄屏、中文手机）：79 层走过 80 层商店，日程是 83 暗涌、85 静夜、86 悬赏、87 夜市。83 层卡上显示 20%（翻倍）；85 层卡上的几率标签消失；86 层带上悬赏的推搡者，座位车费 34 = 7 + 7 + 20；87 层夜市花 136 币买照明弹，道具栏 1/4，按钮变成“已买”；88 层摊位收起，日程四项都划掉。英文模式从 80 层跑到 92 层，界面里没有中文。',
    '试玩中修掉的问题：夜市购买记录在英文模式下是“Night market买下Flare”（补了翻译）；中文规则里连着两个冒号（“夜市：门外有摊位：…”）；悬赏说明写“一位暗黑版”，但也可能是普通乘客；手机上商店日程的长句换行后跑到楼层名下面（改成两栏对齐）。',
    'verify 新增一组 v9.21 测试（日程只在 80 层商店生成、四种各一、都在 81–89 层；静夜无发作；暗涌几率翻倍；悬赏只一张卡、只在那一层；夜市能买、离开后不能买、英文翻译），v9 检查从 42 项变成 43 项，全部通过；预测上界的随机测试也加入了静夜和暗涌。',
  ],
  watch: [
    '特殊楼层让深渊稍微容易了一点（到 100 层 0.3%→0.6%），主要来自静夜和悬赏。仍在“几乎没人到 100 层”的范围内，要看真人会不会按日程计划得更好。',
    '暗涌如果排在 81 层，刚出商店就是翻倍几率，可能让人觉得不公平；也许该在商店里就提醒“下一层是暗涌”。',
    '夜市的道具按商店价卖，钱多的深渊里基本都会买，暂时没加价。',
  ],
};

export const V9210_EN: ChangelogEntry = {
  version: '9.21.0', date: '2026-09-25', title: 'The eve of the abyss: four special floors between 80 and 89',
  summary: 'With careful play, most cards at 80–89F used to be worth about ±0 and those ten floors were flat. Now the 80F shop announces four special floors among 81–89F: Hush, Surge, Bounty and Night market. Each run places them at random, one of each, so you can plan where to take risks, when to board dark riders and where to spend your coins. The lift’s own power use is unchanged.',
  changes: [
    'The 80F shop opens with “Eve of the abyss · the next ten floors”: four random floors among 81–89F, one each of Hush, Surge, Bounty and Night market. On 81–89F the side panel keeps the schedule, with past floors struck out, the current floor highlighted and its rule written out; a banner announces each special floor on arrival.',
    'Hush: no dark rider causes trouble on the ascent from this floor. They do not lash out, and their cards hide the odds (as with a Flare).',
    'Surge: outburst odds ×2 on the ascent from this floor, capped at 50% (at 85F, 20%→40%). The boil-over chance shown before the doors close and the gamble warning use the doubled odds.',
    'Bounty: one rider waiting on this floor carries a bounty. A dark rider is chosen first, otherwise a normal one, never a parcel or a legend. The card is tagged “Bounty +20”, the rider pays 20 more coins on arrival, and the fare breakdown shows it as its own line.',
    'Night market: a stall outside the doors sells three items at shop prices. They are drawn like the shop’s items, and anything already bought is left out. It is open only on that floor and closes when you leave.',
    'Fix: on a Flare floor the cards still showed “Lashes out 20%”; like on a Hush floor, they now hide the odds.',
    'The manual’s “Midnight and the abyss” section describes the four special floors.',
  ],
  experiments: [
    'Floor-by-floor stats for 80–88F, 200 runs × 3 bots (before → after):',
    '• Balanced bot: floors where nothing happened fell from 22% to 14%, and floors with any risk from 42% to 37%. 39% of floors were special.',
    '• Cooperation bot: nothing happened on 13%→8% of floors.',
    '• Median floor 87→88; reaching 90F 34%→37%; reaching 100F 0.5%→0.5%.',
    '• The bots do not plan around the schedule. At a market they buy a Flare or a Sedative only if at least 40 coins are left afterwards, and use it when the boil-over chance is 20% or more.',
    'Acceptance, 4,200 runs:',
    '• Skilled endings: 52.4% power, 46.7% agitation, 0.9% bomb (v9.20.4: 50.3 / 49.0 / 0.8).',
    '• 100F reached in 0.6% of runs, up from 0.3% (the target is at most 5%).',
    '• Balanced median 87F (p10–p90 80–94); human-like 78F; novice 34F.',
    '• Every balanced boarding rate is within 16–61%.',
    '• Both “not affluent” checks still fail, as before: coins cover the shop plan 66.4% of the time, and the median left after a shop is 28.',
    'Browser playtest (narrow window in English, phone in Chinese), from 79F through the 80F shop. The schedule was 83F Surge, 85F Hush, 86F Bounty, 87F Night market.',
    '• 83F: cards showed the doubled 20%.',
    '• 85F: the odds tags disappeared.',
    '• 86F: I seated a Pusher with a bounty; his seat fare was 34 = 7 + 7 + 20.',
    '• 87F: I bought a Flare for 136 coins; the bag showed 1/4 and the button read “Sold”.',
    '• 88F: the stall had closed and all four schedule entries were struck out.',
    '• An English run from 80F to 92F showed no Chinese in the interface.',
    'Fixed during the playtest:',
    '• In English, the market purchase log line was left half in Chinese; it is now translated.',
    '• The Chinese rule had two colons in a row.',
    '• The bounty text said “a dark rider”, though it can be a normal one.',
    '• On phones, long lines in the shop’s schedule wrapped under the floor names; the list now uses two aligned columns.',
    'verify: a new v9.21 group raises the v9 checks from 42 to 43, all passing. It tests that:',
    '• the schedule is made only at the 80F shop, with one of each kind, all within 81–89F;',
    '• Hush stops outbursts and Surge doubles the odds;',
    '• the bounty goes to one card, on its own floor only;',
    '• the market sells only on its floor, and its English text is correct.',
    'The forecast-bound fuzz test now includes Hush and Surge floors.',
  ],
  watch: [
    'The special floors make the abyss slightly easier: 100F reached in 0.3%→0.6% of runs, mostly from Hush and Bounty. That is still within “almost nobody reaches 100F”. Watch whether real players plan around the schedule better than the bots.',
    'A Surge on 81F doubles the odds right after the shop, which may feel unfair; the shop could warn that the next floor is a Surge.',
    'Night market items sell at shop prices. With so many coins in the abyss they are nearly always bought, but there is no markup yet.',
  ],
};
