export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  summary: string;
  changes: string[];
  experiments: string[];
  watch: string[];
};

export const GAME_VERSION = '8.7';

export const CHANGELOG: ChangelogEntry[] = [
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
