export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  summary: string;
  changes: string[];
  experiments: string[];
  watch: string[];
};

export const GAME_VERSION = '8.14';

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '8.14', date: '2026-09-03', title: '人物卡头部不再互相抢位',
    summary: '人物卡最上方重新严格区分“数值”和“能力”：三项数值保持短而稳定，完整条件留在下方规则区。',
    changes: [
      '躁动总览统一显示为简短的“自身 +0/+1”；音乐家、护士等较长的抵消规则只在能力区显示一次，不再侵入稀有度与路程标签。',
      '桌面卡头改用可收缩身份列和固定宽度数值列；英文长姓名使用更稳妥的字号，避免数值、姓名、材质标签和帮助按钮互相覆盖。',
      '手机卡的材质与数值区补充最小宽度约束，保持完整规则且不出现横向溢出。',
    ],
    experiments: [
      '在1280×720浏览器中检查三批中文候客卡和一批英文候客卡，覆盖长条件、材质标签与紧凑桌面栏；目视确认身份、数值、标签和规则区不再相叠。',
      '逐段审查桌面、短屏、手机与横屏媒体规则；完整规则、双语、构建与版本记录回归继续通过。本次未调整任何人物或资源数值。',
    ],
    watch: ['继续收集极窄桌面窗口与系统大字体设置下的卡面截图。'],
  },
  {
    version: '8.13', date: '2026-09-03', title: '本层决策一眼可见',
    summary: '候客、车内风险与十层商店获得更明确的即时反馈；本次只改善信息层级，不改变人物或生存数值。',
    changes: [
      '右侧已上车的候客卡改为灰色半透明；本层新上车人物在车厢内显示高亮金圈，旧乘客不会被误标。',
      '若按当前站位上行会让电量耗尽或躁动达到上限，左栏对应的下一站变化数字会变红并抖动；减少动态效果的系统设置下保留静态警示色。',
      '每个9、19、29层等商店前一层都会明确显示“下一站：商店”，并用高亮提示取代普通班次预告。',
      '玩家界面统一称为“商店”，商店说明与离开操作进一步精简。金币总额移到商店最上方并显著放大。',
    ],
    experiments: [
      '新增楼层9与39的商店预告回归，并继续验证下一站电量、躁动预测与实际结算一致。',
      '完整规则验证继续覆盖定向人物配对、随机状态跳转、堆叠、连接、双语与版本记录约束；本次未调整平衡参数。',
    ],
    watch: ['观察持续抖动是否足够醒目但不过度干扰，以及灰色候客卡在不同屏幕亮度下是否仍清楚可撤回。'],
  },
  {
    version: '8.12', date: '2026-09-03', title: '双资源夹击',
    summary: '躁动改成完全可追踪的人物风险，能源重新成为必须规划的生存资源；玩家要在充电、升级和高危高回报乘客之间持续取舍。',
    changes: [
      '躁动上限固定为6；移除拥挤、班次压力、空驶休整与高躁动倍率。躁动现在只来自卡片明示的人物自身、高危标记、人物事件和未被保护的红线。',
      '护士与音乐家每位每层抵消一名相邻乘客的1躁动，可堆叠但不产生负数；本层只要有人正常到站，总躁动最多降低1。舒缓系统改为上限+1并立即−2。',
      '高危乘客固定多+1躁动、到站多得8金币；30层起逐步出现，40层起每批至少1张，80层至少2张，120层起三张均为高危。',
      '初始电量48、容量60、每点充电1金币、推荐补至50电。玩家必须至少搭载一名乘客才能上行，不能用空载绕过人物风险。',
      '检查员改为每层检查总耗电；不超过4电每层+1金币，超过则每层+1躁动。高危卡增加铜红材质、火焰标签与车内标记。',
    ],
    experiments: [
      '先后筛选初始电量36–60、容量48–72、充电价1–2、躁动上限6–10，以及六组高危起点、保底间隔和爬升速度。',
      '最终独立留出测试共40,000局、1,050,768次楼层结算，电量与躁动预测误差均为0。',
      '均衡策略平均38.07层、中位43层；96.92%抵达10层、81.20%抵达20层、57.85%抵达40层、6.26%抵达60层。失败中28.66%为电量耗尽、70.89%为躁动失控，形成双资源威胁。',
      '忽略躁动与贪收益策略的中位数均为9层；限制载客并保守留电的策略中位49层，说明不存在靠单一高收益或满载策略稳定碾压的路径。',
    ],
    watch: ['真人是否会觉得30–40层的高危爬升过慢；高危+8金币是否足以诱惑玩家在低躁动时主动承险。'],
  },
  {
    version: '8.11', date: '2026-09-03', title: '维修工节能行完成本地化',
    summary: '最终线上检查发现维修工独有的紧凑能源行仍为中文；现已补齐，并把能源行加入全人物运行时翻译回归。',
    changes: [
      '维修工卡面的“每位每层节能2电、可叠加”现在完整显示为英文。',
      '21类人物的英文回归现在同时检查能源、收益、躁动与技能四类运行时行。',
      '教练仍保持通用说明，不点名神秘人；本次未改变任何玩法数值或材质分级。',
    ],
    experiments: [
      '普通与高躁动两种状态共检查21类人物的全部紧凑卡面字段，确认不再残留中文。',
      '完整规则验证继续覆盖52,920个定向配对/站位案例、48,000次随机状态跳转、60个连接案例、8类堆叠与768个交互案例。',
    ],
    watch: ['持续用线上实际候客组合验证新增动态文案。'],
  },
  {
    version: '8.10',
    date: '2026-09-03',
    title: '英文卡面规则完整可读',
    summary: '线上目视复测发现部分人物的紧凑规则仍混有中文；本次补齐全部21类人物的运行时卡面翻译，并把这些动态句式纳入自动回归。',
    changes: [
      '补齐小偷、警察、律师、醉汉、音乐家、护士、儿童、幽灵、驱魔师、教练、名人、检查员、炸弹客、神秘人、百变人与复制人的紧凑规则翻译。',
      '修复数值会变化的偶数层躁动、25%闹事、检查员阈值、炸弹引信和复制属性句式，避免运行时替换后残留中文。',
      '教练卡仍只写通用相邻加成规则，不为神秘人组合增加特例文案；隐藏车费结算逻辑保持不变。',
      '本次未改变任何人物数值、材质分级、出现概率、耗电、躁动、金币或升级效果。',
    ],
    experiments: [
      '新增21类人物在普通与高躁动两种状态下的运行时卡面翻译回归，覆盖静态规则与动态数值句式。',
      '线上目视复测确认英文候客卡不再中英混排，卡面正文无裁切，主操作按钮保持单行。',
      '完整规则验证继续覆盖52,920个定向人物配对/站位案例、48,000次随机状态跳转、60个连接案例、8类堆叠与768个交互案例。',
    ],
    watch: ['继续观察高规则密度人物在较窄桌面宽度下的阅读节奏。'],
  },
  {
    version: '8.9',
    date: '2026-09-03',
    title: '乘客卡获得价值材质',
    summary: '候客卡不再像同一批印刷品：出现稀有度与基础回报共同决定材质层级，高价值人物会在第一眼就显得不同，同时彻底避免规则被截断。',
    changes: [
      '新增常规、精良、稀有、传奇四档卡牌材质：常规为深色纸面，精良为拉丝铜，稀有为金箔漆面，传奇为克制的虹彩黑曜石。',
      '分级阈值固定为：出现权重≤4或基础车费≥30为传奇；权重≤6或车费≥20为稀有；权重≤8或车费≥14为精良；其余为常规。教练为稀有，百变人与炸弹客为传奇。',
      '神秘人只按公开出现权重分级，不读取隐藏车费，因此卡面不会泄露封存奖励。',
      '桌面候客区改为内容决定卡高；三张完整规则超过可用高度时只滚动右侧候客区，不再在卡片内部截掉文字。',
      '补齐教练与隐藏车费的结算回归：神秘人的封存基价仍会接受每位相邻教练50%的线性倍率，但不把特殊组合写进卡面。',
      '本次未改变任何实际人物、耗电、躁动、金币、出现概率或升级数值。',
    ],
    experiments: [
      '新增双教练夹住神秘人的结算回归：隐藏基础车费31经两位教练线性叠加后精确结算62金币，揭晓日志仍只在到站时出现。',
      '验证常规、精良、稀有、传奇四档代表人物，并确认分级函数不接收神秘人的隐藏参数。',
      '完整规则验证继续覆盖52,920个定向人物配对/站位案例、48,000次随机状态跳转、60个连接案例、8类堆叠与768个交互案例。',
    ],
    watch: [
      '材质现在表达“出现稀有度或基础回报”，不是无条件强度；继续观察玩家是否会把金卡误解成必选。',
      '右侧候客区只在长规则组合时出现内部滚动；继续观察是否需要更明显的末端渐隐提示。',
    ],
  },
  {
    version: '8.8',
    date: '2026-09-03',
    title: '候客卡只保留有用反馈',
    summary: '移除每张候客卡底部重复出现的操作说明，让空间留给人物规则；真正影响下一步操作的状态仍会即时显示。',
    changes: [
      '未选中且可正常上车的候客卡不再显示“拖入空位 / 点选上车”。',
      '“已选中 · 点空位”“点此撤回”“车厢已满”以及可立即形成联动的提示继续按状态显示。',
      '本次未改变人物、耗电、躁动、金币、难度段或升级的任何玩法数值。',
    ],
    experiments: [
      '中英文界面均检查默认候客卡、选中、已上车、满载与可联动状态，确认只有默认重复说明被移除。',
      '完整规则验证继续覆盖 52,920 个定向人物配对/站位案例、48,000 次随机状态跳转、60 个连接案例、8 类堆叠与 768 个交互案例。',
      '生产构建与 GitHub Pages 静态构建通过；候客卡渲染路径中不再包含被删除的中英文默认提示。',
    ],
    watch: [
      '规则较少的人物卡底部会自然留白；暂时保留这段呼吸空间，不再用通用说明填满。',
      '继续观察首次游玩的玩家是否能仅凭拖拽反馈和选中状态顺利完成上车操作。',
    ],
  },
  {
    version: '8.7',
    date: '2026-09-03',
    title: '午夜班次走向双语',
    summary: '游戏现在默认以完整英文呈现，同时保留一键切换的完整中文界面；玩法与平衡数值不变。',
    changes: [
      '默认语言改为英文；顶部新增“中文 / EN”切换按钮，选择中文后网址会保留 ?lang=zh，刷新后仍进入中文界面。',
      '英文覆盖开场、人物卡、车内状态、协作与冲突、值班手册、乘客档案、升级商店、结算、失败提示和完整更新记录。',
      '浏览器页面语言默认标记为 en，切换中文时同步改为 zh-CN，辅助技术可识别当前语言。',
      '本次未改变人物、耗电、躁动、金币、难度段或升级的任何玩法数值。',
    ],
    experiments: [
      '新增本地化覆盖校验，逐项检查人物、升级、规则、动态界面文案及版本记录，不允许默认英文界面残留未授权中文。',
      '完整规则验证继续覆盖 52,920 个定向人物配对/站位案例、48,000 次随机状态跳转、60 个连接案例、8 类堆叠与 768 个交互案例。',
      '生产构建与 GitHub Pages 静态构建均通过；默认静态 HTML 的 lang 为 en，并保留中文入口。',
    ],
    watch: [
      '继续观察英文长规则在 375×667 等短手机上的阅读密度；必要时只压缩措辞，不隐藏关键数值。',
      '新人物与新机制以后必须同时补齐中英文文案，避免两种语言的规则产生分叉。',
    ],
  },
  {
    version: '8.6',
    date: '2026-09-03',
    title: '把难度墙改成生存考题',
    summary: '保留高压段的压迫感，但让正确管理躁动的玩家有稳定穿越机会；同时收紧手机操作区与新手文案。',
    changes: [
      '17–19、27–29 等高压三层的班次躁动由每层 +5 调整为 +4；4–6 段仍为每层 +1，其他难度节奏不变。',
      '手机操作区移除重复的下一站预测、耗电公式与换位说明；关门上行按钮由 44 高提升至常态 74 高。',
      '需要选位置时才显示一行即时操作提示，不再持续占用游戏画面。',
      '新手班次改写为“用恋人观察绿色协作线”的示例，不再暗示恋人是唯一正确打法。',
      '候客列表补齐列表语义，并移除动态数字上无效的辅助属性；自动无障碍检查无违规项。',
    ],
    experiments: [
      '修正模拟器此前从不在补给站充电的问题，使电脑策略遵守游戏内“先留充电费”的决策提示。',
      '新参数运行 20,000 局、累计 370,594 次楼层结算；电量与躁动预测误差为 0。',
      '均衡策略 99.92% 抵达 10 层、44.58% 抵达 20 层、19.60% 抵达 30 层，最高 100 层；忽略躁动策略只有 2.66% 抵达 20 层，说明控躁决策具有决定性。',
      '在 1440×900、390×844 与 375×667 三种视口复测首屏、配对、结算反馈与十层商店；均无需页面滚动，商店主操作保持在首屏。',
    ],
    watch: [
      '均衡模拟的中位数仍为 19 层，符合“举步维艰”的目标，但真人是否觉得首个高压段过于陡峭仍需继续观察。',
      '短手机为保留完整人物规则会一次重点展示一张候客卡；继续观察横向切换是否足够自然。',
    ],
  },
  {
    version: '8.5',
    date: '2026-09-03',
    title: '版本记录进入游戏',
    summary: '版本号现在是入口，而不再只是页脚装饰；手机和桌面都能随时查看改动依据。',
    changes: [
      '顶部新增可点击版本按钮；桌面页脚版本号也可打开同一份更新记录。',
      '更新记录统一写明玩法变化、数值变化、测试规模、结论和待观察项。',
      '加入发布校验：版本号、游戏内记录和项目记录不一致时，测试会直接失败。',
    ],
    experiments: [
      '继承 v8.4 的 17,750 局流派测试与 1,083,654 次楼层结算结果。',
      '重新运行 52,920 个定向人物配对/站位案例与 48,000 次随机状态跳转，预测误差为 0。',
      '生产构建和版本入口自动校验通过。',
    ],
    watch: [
      '观察玩家是否会主动使用更新记录理解数值变化。',
      '以后每次发布必须先补齐本页记录，再提高版本号。',
    ],
  },
  {
    version: '8.4',
    date: '2026-09-03',
    title: '堆叠与流派成型',
    summary: '让重复人物和多条连接真正形成构筑，同时保留明确的物理上限。',
    changes: [
      '每条绿色协作线分别支付到站奖励；卡片直接显示“+3×2”一类当前结果。',
      '每条红色冲突线分别增加躁动；存在绿色协作时，该人物免除邻座冲突。',
      '每位维修工每层节能 2；受控幽灵、节能线路与维修工可以逐项相加。',
      '恋人与教练改为线性叠加；护士、音乐家、检查员等重复人物继续各自结算。',
    ],
    experiments: [
      '两轮共 17,750 局流派对照，覆盖维修工、恋人、教练、灵异、控躁和混合策略。',
      '累计 1,083,654 次楼层结算，能量与躁动预测误差为 0。',
      '21 种人物完成双绿线、双红线和绿线保护的定向检查；另验证 8 类特殊堆叠。',
    ],
    watch: [
      '纯堆叠构筑没有超过动态混合策略，但实战玩家可能比启发式策略更会集中资源。',
      '节能最多抵完人物耗电，不能抵消电梯运转，也不能形成倒充电。',
    ],
  },
  {
    version: '8.3',
    date: '2026-09-03',
    title: '维修工改为持续节能',
    summary: '移除“3 的倍数层”记忆负担，让维修工每站都能产生可预测价值。',
    changes: [
      '维修工从周期触发改为每层节能，单人机制更容易理解。',
      '躁动统一使用火焰图标，避免与计时器混淆。',
      '十层商店压缩信息密度，并把“继续上行”保留在一屏内。',
    ],
    experiments: [
      '验证维修工独处、搭载低耗电人物和搭载高耗电人物的边界。',
      '检查节能不会抵消电梯运转，也不会让电量反向增长。',
    ],
    watch: ['该版维修工仍为共享上限；v8.4 根据实玩反馈进一步改成可堆叠。'],
  },
  {
    version: '8.2',
    date: '2026-09-03',
    title: '躁动表达与商店可读性',
    summary: '把难以理解的耐心概念完全收束为金币、耗电、躁动三个核心值。',
    changes: [
      '人物卡片直接描述会增加或减少多少躁动。',
      '技能数值补齐对应图标，缩短重复文字。',
      '商店卡片重新压缩，保留购买判断所需的信息。',
    ],
    experiments: ['复查高躁动倍率、检查员耗电判定和商店离开条件。'],
    watch: ['继续观察小屏设备上长人物能力是否仍会换行。'],
  },
  {
    version: '8.1',
    date: '2026-09-03',
    title: '车内人物信息常驻',
    summary: '玩家不必依赖记忆或悬停，也能看见已经上车人物的关键参数。',
    changes: [
      '车内人物保留金钱、耗电、躁动和剩余站数。',
      '人物图片采用裁切而非拉伸，并强化已上车状态与连接线。',
    ],
    experiments: ['验证不同卡片宽度下姓名和三个核心值不被挤压。'],
    watch: ['持续控制卡片文字长度，避免状态变化造成布局跳动。'],
  },
  {
    version: '8.0',
    date: '2026-09-03',
    title: '人物卡片与档案修复',
    summary: '重组候客卡片信息层级，并修复乘客档案开局全部解锁的问题。',
    changes: [
      '核心参数移动到姓名旁，以更大的字号展示。',
      '修复长姓名和能力文字覆盖、截断问题。',
      '乘客档案只记录本机实际遇见过的人物。',
    ],
    experiments: ['验证旧存档、异常档案数据和重复人物不会错误解锁档案。'],
    watch: ['档案仍保存在当前设备，更换浏览器不会同步。'],
  },
];

export const CHANGELOG_EN: ChangelogEntry[] = [
  {
    version: '8.14', date: '2026-09-03', title: 'Card headers stop competing for space',
    summary: 'The top of every rider card now strictly separates values from abilities: three short values stay stable while complete conditions remain in the rule area below.',
    changes: [
      'The agitation overview is always a compact “Self +0/+1.” Long cancellation rules for Musician, Nurse, and similar riders appear once in the ability area instead of invading trip and rarity badges.',
      'Desktop headers use a shrinkable identity column and a fixed-content value column. Long English names use a safer size so names, values, material badges, and help controls cannot overlap.',
      'Mobile rarity and value areas gain minimum-width constraints to prevent horizontal overflow while keeping full rules.',
    ],
    experiments: [
      'At 1280×720, browser-checked three Chinese candidate sets and one English set covering long conditions, material badges, and the compact desktop rail. Identity, values, badges, and rule rows no longer overlap visually.',
      'Reviewed desktop, short-screen, phone, and landscape media rules line by line. Full rules, localization, build, and release-history regressions pass. No rider or resource values changed.',
    ],
    watch: ['Keep collecting card screenshots from unusually narrow desktop windows and enlarged system text settings.'],
  },
  {
    version: '8.13', date: '2026-09-03', title: 'This-floor decisions read at a glance',
    summary: 'Candidates, cabin danger, and ten-floor shops now give clearer immediate feedback. This release changes information hierarchy only, not rider or survival values.',
    changes: [
      'A candidate card turns grey and translucent after boarding. Its cabin rider gains a bright gold ring for the current floor; existing riders are never marked as new.',
      'If the current arrangement would exhaust power or reach the agitation cap on the next ascent, the matching forecast number turns red and shakes. Reduced-motion settings keep the static warning color.',
      'Floors 9, 19, 29, and every later pre-shop floor clearly show “Next: Shop” with a highlighted notice instead of an ordinary shift forecast.',
      'Player-facing supply-stop labels are now simply “Shop.” Shop instructions and departure copy are shorter, and the total coin balance is larger at the very top.',
    ],
    experiments: [
      'Added shop-warning regressions for floors 9 and 39 while retaining exact next-floor power and agitation forecast checks.',
      'Full verification still covers targeted rider pairs, random transitions, stacks, links, localization, and release invariants. No balance parameter changed.',
    ],
    watch: ['Watch whether the continuous danger shake is salient without becoming distracting, and whether a dimmed candidate remains clearly undoable across display brightness levels.'],
  },
  {
    version: '8.12', date: '2026-09-03', title: 'Two-resource squeeze',
    summary: 'Agitation is now a fully traceable rider risk, while power again demands active survival planning. Every shift asks how much money to spend on charge, upgrades, and visibly dangerous high-reward riders.',
    changes: [
      'Agitation cap is 6. Removed crowding, shift pressure, empty-car rests, and the hidden high-agitation multiplier. Agitation now comes only from visible rider values, high-risk tags, rider events, and unprotected red links.',
      'Each Nurse or Musician cancels 1 agitation from one adjacent rider per floor. Multiple calmers stack but never go below zero. Any normal arrival reduces total agitation by at most 1 that floor. Calm System now gives cap +1 and immediate −2.',
      'High-risk riders add +1 agitation and +8 arrival coins. They begin ramping at floor 30; each offer set guarantees at least one from floor 40, two from floor 80, and all three from floor 120.',
      'Initial power is 48, capacity is 60, charging costs 1 coin per power, and the reference target is 50. At least one rider is required to ascend, so an empty car cannot bypass rider risk.',
      'Inspector now checks total power every floor: at 4 or less it earns +1 coin; above 4 it adds +1 agitation. High-risk cards receive a copper-red material, flame badge, and cabin marker.',
    ],
    experiments: [
      'Screened initial power 36–60, capacity 48–72, charging price 1–2, agitation caps 6–10, and six combinations of high-risk start, guarantee interval, and ramp speed.',
      'The independent holdout ran 40,000 games and 1,050,768 floor settlements with zero power or agitation forecast misses.',
      'Balanced play averaged floor 38.07 with median 43; 96.92% reached 10, 81.20% reached 20, 57.85% reached 40, and 6.26% reached 60. Of failures, 28.66% were power and 70.89% agitation, establishing a real two-resource squeeze.',
      'Agitation-blind and greedy play both had median floor 9. A conservative two-rider reserve strategy reached median 49, so neither full-cabin nor pure high-income play dominates.',
    ],
    watch: ['Watch whether the floor 30–40 risk ramp feels too slow in human play, and whether +8 coins is enough to tempt players into visible danger when agitation is low.'],
  },
  {
    version: '8.11', date: '2026-09-03', title: 'Mechanic savings reads fully in English',
    summary: 'The final production pass found the Mechanic’s compact power-savings line still in Chinese. It is now localized, and energy rows are included in the all-rider runtime regression.',
    changes: [
      'The Mechanic card now renders its stackable 2-power-per-floor saving fully in English.',
      'Runtime localization coverage for all 21 riders now checks power, income, agitation, and ability rows.',
      'Coach copy remains general and does not name Mystery. No gameplay value or material tier changed.',
    ],
    experiments: [
      'Checked every compact card field for all 21 riders at normal and high agitation, with no Chinese fragments remaining.',
      'Full verification still covers 52,920 targeted pair/position cases, 48,000 random transitions, 60 connection cases, 8 stacking families, and 768 interaction cases.',
    ],
    watch: ['Keep validating new dynamic copy against actual production candidate combinations.'],
  },
  {
    version: '8.10', date: '2026-09-03', title: 'Every English rider rule reads cleanly',
    summary: 'Production visual testing found Chinese fragments in several compact rider rules. All 21 runtime card faces are now fully localized, and those dynamic phrases are covered by regression tests.',
    changes: [
      'Completed compact-rule translations for Thief, Officer, Lawyer, Drunk, Musician, Nurse, Child, Ghost, Exorcist, Coach, Celebrity, Inspector, Bomb Carrier, Mystery, Shifter, and Mimic.',
      'Covered dynamic even-floor agitation, 25% incident, Inspector threshold, bomb fuse, and copied-stat phrases so runtime values cannot leave Chinese fragments behind.',
      'The Coach card still states only its general adjacency rule. It does not call out Mystery as a special case, and hidden-fare settlement is unchanged.',
      'No rider value, material tier, appearance weight, power, agitation, coin, or upgrade effect changed.',
    ],
    experiments: [
      'Added runtime-card localization checks for all 21 riders at both normal and high agitation, covering static rules and value-dependent phrases.',
      'Production visual testing confirmed fully English candidate cards, unclipped card copy, and a single-line primary action.',
      'Full verification still covers 52,920 targeted rider-pair and position cases, 48,000 random state transitions, 60 connection cases, 8 stacking families, and 768 interaction cases.',
    ],
    watch: ['Continue observing reading rhythm for rule-dense riders at narrower desktop widths.'],
  },
  {
    version: '8.9', date: '2026-09-03', title: 'Rider value becomes a physical material',
    summary: 'Candidate cards no longer look like one uniform print run. Appearance rarity and base reward now determine the material tier, while full rules can never be clipped inside a card.',
    changes: [
      'Added four card materials: Standard dark stock, Fine brushed copper, Rare gilt lacquer, and restrained Legendary iridescent obsidian.',
      'Tiers use fixed public values: appearance weight ≤4 or base fare ≥30 is Legendary; weight ≤6 or fare ≥20 is Rare; weight ≤8 or fare ≥14 is Fine; everything else is Standard. Coach is Rare; Shifter and Bomb Carrier are Legendary.',
      'Mystery uses public appearance weight only and never reads its hidden fare, so its material cannot leak the sealed reward.',
      'Desktop candidate cards now size to their complete rules. If three full cards exceed the available height, only the candidate rail scrolls; text is never clipped inside a card.',
      'Added a Coach-and-hidden-fare regression: sealed Mystery base fare still receives the linear 50% multiplier from every adjacent Coach, without adding special-case copy to the card.',
      'No rider, power, agitation, coin, appearance, or upgrade value changed in this release.',
    ],
    experiments: [
      'Added an exact two-Coach Mystery regression: a sealed base fare of 31 resolves to 62 coins, while the original value remains hidden until arrival.',
      'Verified representatives of all four material tiers and that the grading function accepts no hidden Mystery traits.',
      'Full verification still covers 52,920 targeted rider-pair and position cases, 48,000 random state transitions, 60 connection cases, 8 stacking families, and 768 interaction cases.',
    ],
    watch: [
      'Materials communicate appearance rarity or base reward, not unconditional strength. Watch whether players mistake a gilt card for an automatic pick.',
      'The candidate rail scrolls only for combinations of long rules; watch whether it needs a stronger end fade.',
    ],
  },
  {
    version: '8.8', date: '2026-09-03', title: 'Candidate cards keep only useful feedback',
    summary: 'Removed the repeated boarding instruction from every candidate card so rider rules have room to breathe. Contextual states that affect the next action remain visible.',
    changes: [
      'Available, unselected candidate cards no longer show “Drag to a position / click to board.”',
      'Selected, on-board, cabin-full, and immediate-link messages still appear when their state makes them useful.',
      'No rider, power, agitation, coin, difficulty-wave, or upgrade values changed in this release.',
    ],
    experiments: [
      'Checked default, selected, boarded, full-cabin, and link-ready cards in both English and Chinese; only the redundant default instruction is removed.',
      'Full rules verification still covers 52,920 targeted rider-pair and position cases, 48,000 random state transitions, 60 connection cases, 8 stacking families, and 768 interaction cases.',
      'Production and GitHub Pages static builds pass, and the candidate-card render path no longer contains the removed English or Chinese default message.',
    ],
    watch: [
      'Riders with short rules now retain deliberate breathing room at the bottom of the card instead of filling it with generic instructions.',
      'Keep watching whether first-time players can board smoothly from drag feedback and the selected state alone.',
    ],
  },
  {
    version: '8.7', date: '2026-09-03', title: 'The midnight shift goes bilingual',
    summary: 'The complete game now opens in English by default, with one-click access to the full Chinese interface. Gameplay and balance values are unchanged.',
    changes: [
      'English is now the default. A 中文 / EN switch appears in the header; Chinese mode keeps ?lang=zh in the URL and survives refreshes.',
      'English covers the intro, rider cards, cabin states, cooperation and conflict, shift manual, archive, upgrade shop, results, failures, and the full release archive.',
      'The document language defaults to en and changes to zh-CN with the interface, so assistive technology can identify the active language.',
      'No rider, power, agitation, coin, difficulty-wave, or upgrade values changed in this release.',
    ],
    experiments: [
      'Added localization coverage checks across riders, upgrades, rules, dynamic interface copy, and release notes; the default English interface may not contain unapproved Chinese text.',
      'Full rules verification still covers 52,920 targeted rider-pair and position cases, 48,000 random state transitions, 60 connection cases, 8 stacking families, and 768 interaction cases.',
      'Production and GitHub Pages static builds pass. The default static document declares lang=en and retains a direct Chinese entry point.',
    ],
    watch: [
      'Watch the density of long English rules on short 375×667 phones. If needed, shorten wording without hiding decision-critical values.',
      'Future riders and mechanics must ship with both English and Chinese copy so the two rulesets never drift.',
    ],
  },
  {
    version: '8.6', date: '2026-09-03', title: 'Turn the difficulty wall into a survival test',
    summary: 'The pressure wave stays threatening, but players who manage agitation correctly now have a reliable path through it. Mobile controls and tutorial copy are tighter too.',
    changes: [
      'Shift agitation on floors 17–19, 27–29, and later pressure waves drops from +5 to +4 per floor. The +1 rhythm on floors ending 4–6 is unchanged.',
      'Mobile controls remove repeated forecasts, power formulas, and move reminders. Close Doors & Ascend grows from 44 to 74 pixels tall.',
      'A one-line placement hint appears only when a position is required instead of occupying the screen continuously.',
      'The tutorial now uses Lovers as an example for reading a green link, not as the only correct strategy.',
      'Candidate lists gain proper list semantics; invalid accessibility attributes were removed from animated numbers.',
    ],
    experiments: [
      'Fixed the simulator so computer strategies recharge at supply stations and follow the in-game reserve guidance.',
      'Ran 20,000 games and 370,594 floor resolutions with zero power or agitation forecast errors.',
      'The balanced strategy reached floor 10 in 99.92% of runs, floor 20 in 44.58%, floor 30 in 19.60%, and peaked at 100. Ignoring agitation reached floor 20 only 2.66% of the time.',
      'Retested the opening screen, pairing, settlement feedback, and floor-10 shop at 1440×900, 390×844, and 375×667 without page scrolling.',
    ],
    watch: ['The balanced median remains floor 19, matching the hard-fought target; keep watching whether the first pressure wave feels too abrupt to human players.', 'Short phones focus on one candidate card at a time to preserve full rules; watch whether horizontal switching feels natural.'],
  },
  {
    version: '8.5', date: '2026-09-03', title: 'Release history enters the game',
    summary: 'The version number is now an entrance to release history rather than footer decoration.',
    changes: ['Added a clickable version button in the header and footer.', 'Release notes now record gameplay changes, exact values, test scale, findings, and watch items.', 'A release invariant fails verification when the visible version and repository history disagree.'],
    experiments: ['Inherited v8.4’s 17,750 build tests and 1,083,654 floor resolutions.', 'Reran 52,920 targeted rider-pair/position cases and 48,000 random transitions with zero forecast error.', 'Production build and release-entry checks passed.'],
    watch: ['Watch whether players use release notes to understand value changes.', 'Every public release must add its record before the version is raised.'],
  },
  {
    version: '8.4', date: '2026-09-03', title: 'Stacks and builds take shape',
    summary: 'Duplicate riders and multiple links now form real builds while respecting clear physical limits.',
    changes: ['Each green link pays its own arrival bonus; cards show current results such as +3×2.', 'Each red conflict link adds agitation. Any green cooperation link protects that rider from neighbor conflicts.', 'Each Mechanic saves 2 power per floor; controlled Ghosts, Eco Circuit, and Mechanics stack.', 'Lovers and Coaches stack linearly; Nurses, Musicians, Inspectors, and other duplicates resolve independently.'],
    experiments: ['Two rounds totaling 17,750 build comparisons covered Mechanic, Lover, Coach, occult, agitation-control, and mixed strategies.', '1,083,654 floor resolutions produced zero power or agitation forecast errors.', 'All 21 rider types passed double-green, double-red, and green-protection checks, plus 8 special stacking families.'],
    watch: ['Pure stacking builds did not outperform adaptive mixed play, but humans may concentrate resources better than the heuristic.', 'Savings can cancel passenger power only; they never cancel the motor or charge the battery.'],
  },
  {
    version: '8.3', date: '2026-09-03', title: 'Mechanic becomes a steady saver',
    summary: 'Removed the “multiple of three” memory burden so the Mechanic provides predictable value every floor.',
    changes: ['Mechanic changed from periodic activation to savings every floor.', 'Agitation now consistently uses a flame icon instead of a clock-like symbol.', 'The supply shop is denser and keeps Continue Upward within one screen.'],
    experiments: ['Verified a lone Mechanic with low- and high-power rider groups.', 'Checked that savings never cancel motor power or increase the battery.'],
    watch: ['This release still used a shared Mechanic cap; v8.4 made savings stack in response to play feedback.'],
  },
  {
    version: '8.2', date: '2026-09-03', title: 'Clearer agitation and shop',
    summary: 'The unclear patience concept is fully reduced to three core values: coins, power, and agitation.',
    changes: ['Rider cards state exactly when they raise or lower agitation.', 'Ability values include their matching icons and avoid duplicate labels.', 'Shop cards are compressed while preserving the information needed to buy.'],
    experiments: ['Rechecked high-agitation multipliers, Inspector power checks, and shop exit conditions.'],
    watch: ['Keep watching whether long rider abilities wrap on small screens.'],
  },
  {
    version: '8.1', date: '2026-09-03', title: 'On-board stats stay visible',
    summary: 'Players can see the essential values of riders already aboard without relying on memory or hover.',
    changes: ['On-board riders retain coins, power, agitation, and floors remaining.', 'Portraits crop instead of stretch; on-board states and connection lines are stronger.'],
    experiments: ['Verified that names and three core values remain intact across card widths.'],
    watch: ['Keep card copy concise so state changes do not cause layout jumps.'],
  },
  {
    version: '8.0', date: '2026-09-03', title: 'Passenger cards and archive repaired',
    summary: 'Rebuilt the candidate-card hierarchy and fixed the archive starting fully unlocked.',
    changes: ['Moved core stats beside the rider name and increased their type size.', 'Fixed long names and abilities overlapping or being cut off.', 'The archive records only riders actually encountered on this device.'],
    experiments: ['Verified old saves, malformed archive data, and duplicate riders cannot unlock the archive incorrectly.'],
    watch: ['Archive discovery remains local to this device and does not sync across browsers.'],
  },
];
