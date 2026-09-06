# Elevator Tales Changelog

Every public update must add a new entry here and in `lib/changelog.ts`. Record the player-visible change, exact balance parameters, experiment size, conclusion, and remaining questions. The current version is **v8.35**. Publication status is tracked separately from the source version.

## v8.35 — 2026-09-06 — Clear decisions, intact combinations / 把决定讲清楚，把组合留下来

- 桌面三张候客并排，完整列出关系对象与效果；出场解锁节奏不变。左侧取消滚动和外侧变化数字，保留卡内动画和受静音控制的音效。
- 充电滑杆默认50电，已有更高电量不放电；2金币/电不变，明确支付与余额。取消日常舒缓，只允许已失控商店按8金币/点抢救至上限以下1点。
- 游客基价8、每邻座2、中躁动3、每位名人协作1（升级3）全部保留。明确本人收款、同层互算、先离开不再算；教练只放大基价。
- 2166游客组合与1053抢救边界检查；28局合成策略抽样中2局超过60层，不是人类胜率或流派平衡认证。关注有钱无电、满载续航与中高躁动的可控性。
- Three desktop offers expose all relationships. Instrument-local feedback, a50-power default charging slider at2 coins/power, and emergency-only agitation rescue at8 coins/point to1 below cap. Tourist/Celebrity/Coach combinations remain intact.2166 Tourist cases,1053 emergency cases,28 synthetic policy samples (2 above60); not human balance certification. Watch power planning and smaller-screen readability.

## v8.34 — 2026-09-05 — Power before purchases / 先看电量，再做投资

- 剩余电量移到商店顶部左侧，与金币并列固定显示，不随商品滚走；当前电量48px，窄屏/矮窗36px，上限20px/18px。耗尽状态用暖红色，充电和容量变化直接显示真实值。
- Power and coins stay above the scrolling purchases. Power48px or36px on narrow/short windows; capacity20px/18px. Depleted power uses warm red. Charge/capacity changes show current values immediately.
- 强制静音12个夹具：中英×1440×900、390×844、320×740×26/0电；数字边界与字号、实际+1电/−2币、滚动后固定位置均通过。12 injected, forced-muted fixtures validate number bounds, real charging and fixed positioning; not games.
- 充电2币/电、抵达最多补5电及所有玩法数值不变。Charging2 coins/power, entry up to5 and all gameplay values unchanged. Watch extremely short-window space; next-shop motor references exclude rider costs.

## v8.33 — 2026-09-05 — Three offers at a glance / 三位候客，同时看清

- 桌面取消卡内和候客列表滚动、重复跳转导航。高窗口右侧三张等高卡，短桌面/平板横排三卡；正文14px。主卡保留关键参数、能力摘要、工作状态和关系对象；简单关系保留效果，复杂关系通过完整规则查看。已上车候客仍使用当前行程；类别颜色、稀有度材质不变。
- Desktop offers no longer scroll internally or as a list. Tall windows stack three equal cards on the right; short desktops/tablets show three columns. 14px ability/link text, current boarded state, full Details, category colors and rarity materials remain. Complex relationships are explicit summaries, not clipped rules.
- 隔离强制静音浏览器的56个候客夹具：19人物，中文/英文，1728×900、1440×900、1280×720、1024×768；核对三卡文字边界、页面无滚动、规则入口。手机保留原横向浏览，不宣称手机整页无滚动。
- 56 forced-muted UI fixtures cover 19 roles in Chinese/English at four desktop/tablet sizes. Check all three card/text bounds, no page scrolling and Details reachability. Phones retain existing browsing. These are UI fixtures, not games.
- 恋人召唤现在成功时恰好补1位，另两位为能互动的非恋人。全车25%判定、普通未触发候客、新手首包、基价3、每位恋人邻座+100%基价均不变；商店与结算不变。
- Successful calls now supply exactly one Lover and two interacting non-Lovers. Keep the cabin-wide 25% roll, normal no-call offers, tutorial packet, base fare3 and +100% base per Lover neighbor. Shop and settlement unchanged.
- 修改前后各240000候客包（3楼层×4车厢×20000）：成功召唤恰好1恋人且其余两位能互动，1位/2位未配对同种子结果一致，无人/已配对不召唤。第5层未配对时2+恋人包41.36%→15.945%，恋人卡占比34.58%→24.24%；无人/已配对样本不变。
- Before/after240000 packets each: calls always yield one Lover plus an interacting pair; one/two unpaired give identical seeded results. No unpaired means no call. Floor5 unpaired: 2+ Lover packets41.36%→15.945%; Lover card share34.58%→24.24%. No-Lover/paired samples unchanged.
- Watch / 后续：复杂关系摘要会不会要求玩家过于频繁打开规则；观察恋人补位的吸引力。普通候客仍可出现多位恋人，候客包测试不代表整局强弱或胜率。

## v8.32 — 2026-09-05 — Manage a state

### Release decision / 版本决策

- 躁动分档，人物在不同状态下工作；复制人与具体来源固定配对。保留条件性强大、真实代价和转型空间，不展示流派配方。
- Fixed agitation bands, state-dependent work and stable Mimic pairs. Preserve conditional power, real costs and room to pivot without displaying build recipes.
- 最终规则40条轨迹（四模型各10）、1339上行、3719动作逐状态重放；3/40超60、0超80、0到100截尾。规划/风险中位44/40.5，均送达19人物；坏人暂存20/148币、醉汉加价10/150币。即时经营/探索缺同等三层推演，其中位19不证明经营玩法弱。不是人类胜率、时长或绝对平衡证明。
- Final integration: 40 trajectories (ten each for four models), 1339 ascents, 3719 exactly replayed actions; 3/40 above60, none above80 or censored at100. Planning/risk medians44/40.5, all19 roles delivered by both, bank20/148 and Drunk premiums10/150 coins. Immediate merchant/explorer models lack equivalent three-floor imagination; their median19 does not prove weak economic builds. Not human rates, duration or absolute balance proof.
- 稳压/快线/扩容供给37/33/28次，买后前缀预算+2可支付2/6/10处。全部18处买/不买、同等规划控制器、最多20层对照共36分支完整重放，非独立游戏。三项都有较好兑现和错误时机的反例；扩容一处实际充至70。保留45/45/35固定价格；现金差还含后续布局、升级与未到站乘客，不等于能力直接收益。
- Stabilizer/Express/Capacity appeared37/33/28 times;2/6/10 windows could fund purchase and visible commitment+2. All18 windows receive buy/skip comparisons under the same planner for up to20 floors:36 exactly replayed branches, not independent games. Each has useful and poor timing witnesses; Capacity actually reaches70 power in one. Retain fixed45/45/35 prices. Cash differences also reflect later seating, upgrades and unpaid riders, not direct card income alone.
- 接受熟练玩家突破60，不设强制失败。模型符合预声明长尾门槛，不是真人频率；继续观察低采用人物发现、后期投资/续航、25–40分钟真人节奏。详细判断见 `docs/design/2026-09-05-v832-release-decision.md`。以下为按发生时点保留的候选研究历史，“未发布/待验证”描述当时状态，不覆盖本节结论。
- Allow expert breakthroughs beyond60 without forced failure. Model tails meet predeclared checks, not human rates; watch low-adoption discovery, late investment/power and human25–40-minute pacing. See `docs/design/2026-09-05-v832-release-decision.md`. The candidate research history below retains its original context: unreleased/unverified statements describe those stages, not the decision above.

### Candidate research history / 候选研究历史

- 修正复制人抽取的意外关联：旧哈希直接取奇偶，使不同复制人的来源结果只能整套相同或整套相反；现增加位混合，仍以具体复制人/来源和固定种子决定，不因挪动、换列、预览重抽。无运行时抽签或缓存，人物属性/价格不变。旧候选具体抽取可能改变，历史实玩仍绑定旧源码，不冒充新版轨迹。
- Fix unintended Mimic draw coupling: raw hash parity restricted different Mimics to identical or inverted source maps. Add bit mixing while keeping exact Mimic/source identity and seed fixed across moves, columns and previews; no runtime RNG/cache, rider attribute or price change. Concrete old-candidate draws may change; historical playtests remain bound to their old source, not relabeled as new trajectories.
- 两组64×128人物对（人工身份/实际生成身份）：各从2模式、2016/2016完全相同或相反，改为64模式、0/2016完全关联；耗电占49.98%/50.21%。固定样本不是游戏局数或独立性证明；新回归旧实现先失败，修复通过，原2000移动/1000重建/128来源/100预览仍过。
- Two64×128 matrices (structured/actually generated identities): each changes from2 patterns and2016/2016 perfectly same/inverse pairs to64 patterns and0/2016; energy fractions49.98%/50.21%. Fixed samples, not games or independence proof. New regression fails before the fix; all2000 moves/1000 reconstructions/128 sources/100 previews still pass afterward.

- R05自限不接幽灵，冻结公开UI66上行，67层断电：电−6、躁动5/8、29币；61上客59送达、16人物、收入671支出642。65层10币请离维修换快递多活一层；22次有空位全拒，最长54–58五次（45–48不是连续四次，47接儿童）。837源码始末匹配，独立强制静音浏览器关闭。28.25研究分钟不是真人节奏或全面平衡验收。
- Frozen public-UI R05 voluntarily excludes Ghosts:66 ascents, power death at67 with−6 power, agitation5/8 and29 coins;61 boarded,59 delivered,16 roles,671 income/642 spending. A10-coin Mechanic dismissal for Courier at65 buys one floor.22 free-seat refusals, longest54–58 (not45–48: a Child boards at47).837 sources match; owned forced-muted browser closed.28.25 research minutes are not human pacing or overall balance acceptance.
- R05的53–60层固定公开供给对照：8个写定方案、18并联分支叶、91引擎上行，非游戏局数/隐藏种子重放。主动快递/教练/音乐家在并联落空/成功均到60层，电0/4、92币、躁动2；原路线同电、88币、躁动3，但留有3站报价18的名人。只等待音乐家70币；保留名人加快递即使一次合法换位仍可能59断电。保留人物、概率、固定价格、运转参数，不把更多现金当全面统治。四个主动/原路线分支纳入Lab44。
- Fixed observed offers53–60:8 authored plans,18 relay branch leaves,91 engine ascents; not games or private-seed replay. Courier/Coach/Musician reaches60 on relay miss/hit with0/4 power,92 coins, agitation2; observed route has equal power,88 coins, agitation3 plus an unpaid Celebrity (three stops,18 quote). Waiting for Musician earns70; keeping Celebrity plus Courier can die59 even with one legal reseat. Retain rider/probability/price/motor parameters; higher cash is not universal dominance. Four active/control outcomes enter Lab44.
- 当前仍为未发布候选：继续综合审查长期经济、投资/续航、早期承诺后的选择密度与低采用人物自然机会。各成熟路线要有条件性高光、代价和转向，不拉齐平均层数、不向玩家展示流派名。长局罕见与25–40分钟真人节奏未验收。
- Still unreleased: review long-term economy, investment/sustain, choice density after early commitments and natural opportunities for low-adoption roles. Mature strategies need conditional highlights, costs and pivots, not equal mean floors or player-facing build names. Rare long runs and human25–40-minute pacing remain unaccepted.

- 英文购买反馈、缺电维修失败、双重失控建议补全；长英文重开按钮可换行，失败结算网格不再横向撑开。独立强制静音18个商店注入场景验证最低抢救、购买风险、确认撤销与两次结束；宽度修正再验中英文×三尺寸6例。0上行，不是实玩或平衡样本。
- Complete English purchase feedback, failed power repair and dual-failure advice; wrap the restart label without expanding the result grid.18 forced-muted injected shop cases cover rescue, purchase risk, confirmation reset and two-click ending;6 follow-up language/size cases check result width. Zero ascents, not games or balance samples.
- R04音乐家7张/6楼层，2225布局、8022短程引擎上行；找到73层缓冲解法，18层拒选来自缺电。7次商店/52预算方案显示30/40可投资、50/60/70续航更紧。不改参数或固定价格；预算估算不含未来收入/随机回充/幽灵延误，不能当胜率。
- R04:7 Musician cards across6 floors,2225 layouts and8022 short engine ascents; a buffer exists at73, while18 lacks boarding power.7 shops/52 budgets show investment room at30/40 and power pressure at50/60/70. No rider or price changes; estimates exclude future income/random relay/Ghost delays and are not win rates.

- 紧急商店与购买风险警告统一14px。低电量离店不再写“无法抵达”，明确运转参考不含人物耗电和途中回充；躁动达到或超过上限都需维修。仅双语文案/字号，规则与价格不变。
- Emergency-shop and purchase-risk warnings use14px. Low-power departure describes a motor reference, excluding rider costs and power gained en route, not certain failure; agitation at or above the cap needs repair. Bilingual text/font changes only; rules and prices unchanged.

- 独立强制静音UI验证中英文×1440/1280/1024/390/320宽度10个首层布局，舒缓说明14px且位于面板内、无遮挡；0上行，不算新实玩。增加垂直围观临界失败/去掉名人的单层安全反例、34金币基价叠加与双语建议回归。
- Forced-muted UI QA checks ten first-floor layouts (Chinese/English ×1440/1280/1024/390/320);14px relief text stays inside its card without occlusion. Zero ascents, not a new playthrough. Regressions cover fatal vertical crowding/one-step safety without the Celebrity,34-coin additive base fare and bilingual advice.

- R04后修正：躁动面板按完整内容撑高，防止到站舒缓说明被金币卡遮挡；长侧栏可滚动。教练—名人到站改写为双方基价额外+100%，非完整车费翻倍。死亡提示区分护士邻座护理/音乐家整车节拍，名人围观提示减少邻座；达到上限即失控。仅改布局/双语文案，数值不变。
- After R04: let agitation content size its panel instead of overflowing under the wallet; long rails scroll. Coach–Celebrity arrival text specifies +100% own base fare, not doubling total fare. Failure advice distinguishes adjacent Nurse care from whole-cabin Musician rhythm, and suggests fewer neighbors for Celebrity crowding. Reaching the limit ends the run. Layout/bilingual wording only; no balance changes.
- R04冻结公开UI实玩73上行，74层因漏算名人垂直邻座而躁动8→9死亡；上车预告准确，不是经济耗尽。87实际载客、82送达、1付费请离、1当层撤回、全部19人物送达。837源码始末一致，独立强制静音浏览器已关闭。79研究分钟不是人类时长；50/60/70不装第四能力、音乐家58首次采用待研究，不据此宣称多样性和>60罕见达标。
- Frozen R04:73 ascents, loss at74 from overlooked Celebrity vertical adjacency (agitation8→9). The boarding forecast was correct; not economic exhaustion.87 committed riders,82 delivered,one paid dismissal,one new-board withdrawal; all19 roles delivered. All837 sources matched; owned forced-muted browser closed.79 research minutes are not human duration. Fourth-upgrade skips at50/60/70 and Musician first adoption at58 remain open; not overall diversity or rare >60 acceptance.

- 候客新增游客→音乐家/复制人、教练→神秘人三个入口，遵守原解锁/风险/三卡规则；前15层、人物参数、商店价格不变，无资源自适应或安全保底。用搭档扩大可发现机会，不显示流派配方。
- Add Tourist→Musician/Mimic and Coach→Mystery packet routes, preserving unlocks, risk and three-card rules. Floors1–15, rider parameters and shop prices stay unchanged; no resource adaptation or safety guarantee. Expand discovery through partners without naming builds.
- 400+400纯候客序列共48000批：解锁前十层未见音乐家148→110/400、复制人139→127、神秘人137→124；另24000重复基线不增样本。16次开发轨迹，两方案各8条、各2条超60、均在100前结束；复制人采用4→7、音乐家2→2、神秘人0→1。采用后8条982动作重放一致，Lab43。不是人类胜率或全面平衡验收。
- 400+400 offer-only sequences, 48,000 packets: unseen within ten unlock floors falls148→110/400 for Musician,139→127 for Mimic,137→124 for Mystery. A24,000-packet baseline replay adds no independent samples. Sixteen development trajectories: each eight-run variant has two above60 and none censored at100; adoption Mimic4→7, Musician2→2, Mystery0→1. All eight adopted trajectories replay982 matching actions; Lab43. Not human win rates or overall balance acceptance.

- 固定红线关系在双方卡片/详情中显示，修复检查员卡漏写幽灵耗电冲突；保留解锁隐藏，不改变结算。324对固定有向人物组合与真实引擎代价一致；不按模板推测神秘人的随机关系，非浏览器视觉验收。
- Fixed red links are disclosed on both cards/details, fixing the missing Inspector–Ghost power conflict. Unlock visibility and settlement remain unchanged. All 324 ordered fixed-role comparisons match engine costs. Random Mystery preferences are not inferred from defaults; not visual browser acceptance.
- 维修工320局面×三行动=960次固定引擎执行，非游戏局数：3躁动、三站高危维修工与两站醉汉组合安全送达、相同耗电、收入16→30；7躁动高危版本立即失控。不删、不盲目增强，实际遇见频率仍待检验；Player Lab 42项通过。
- Mechanic: 320 states × three actions = 960 fixed engine executions, not games. At agitation 3 a three-stop high-risk Mechanic with a two-stop Drunk delivers safely with equal power and income 16→30; at agitation 7 high-risk loses immediately. Retain without a blanket buff; natural opportunity frequency remains open. Player Lab passes 42 checks.

- 商店内容独立滚动，离店按钮与警告单独占位，不再覆盖应急电池等购买控件。到站舒缓说明14px且增强对比；修复英文备用电池按钮中文单位。规则/价格未变。两次独立强制静音F1→10烟测各9上行，桌面/390px/320px控件可达，鼠标购买、充电、离店与英文电池使用成功；非完整局或节奏验收。
- Shop content now scrolls separately from departure controls/warnings, preventing purchase overlap. Arrival-relief guidance is 14px with stronger contrast; fix the English reserve button unit. Rules/prices unchanged. Two independent forced-muted F1→10 smokes each made nine ascents; desktop/390px/320px controls were reachable, with successful mouse purchase, charging, exit and English reserve use. Not complete games or pacing acceptance.
- R03冻结实玩90上行到F91，94成功上客、93送达、0请离、4备用电池、全部19人物采用。浏览器丢失，技术中断，未观察到死亡；不是完整局。25次有空位全拒，不能据此宣称多样性已平衡。835源码文件始末匹配，研究墙钟75.40分钟不是人类时长。
- Frozen R03:90 ascents to F91,94 boarded/93 delivered,no dismissals,four reserve cells,all19 roles used. Browser loss caused technical interruption, not observed death or a complete game. Twenty-five free-seat departures boarded nobody; diversity is not accepted. All835 source files matched;75.40 research minutes are not human duration.

- 运转更新为1–10层1电、11–30层2电、31–40层3电、41–50层4电、51–60层5电、61层起6电封顶；商店价格不变，没有强制终点。仪表与商店预告下一档，开局／手册显示全曲线。下方旧4电封顶说明为前一候选历史。
- Motor is now 1 on floors 1–10, 2 on 11–30, 3 on 31–40, 4 on 41–50, 5 on 51–60 and capped at 6 from 61. Shop prices stay fixed; no forced end. Instruments and shops show the next tier; introduction/manual show the schedule. Older capped-at-4 text below describes the previous candidate.
- 高区144次执行含32条旧基线5365动作复现。开发>60为9/32→4/32，120存活截尾6→0；新种子>60为9/40→4/40、120截尾1→0。新种子四组中位层51.5→49、39→39、56→51.5、35→35。不是人类胜率；余币断电、续航角色依赖、公平预告与25–40分钟节奏仍待验收。未发布。
- 144 motor-study executions include 32 exact old baselines / 5365 actions. Above60: 9/32→4/32 in development, 9/40→4/40 on unused seeds; alive-at-120 censoring 6→0 and 1→0. Four unused-seed medians: 51.5→49, 39→39, 56→51.5, 35→35. Not human win rates; cash-rich power failures, sustain dependence, fair advance notice and human pacing remain open. Not released.
- 研究器41项回归：planning-v2排除文案对想象随机种子的干扰；adaptive购物按最近20次公开机会估算未来30次回报，不能预支概率收入。48条购物对照发现无礼宾／稳压的120存活组合，也有120→22的失败反例；中档礼宾34次出现0购买，未采用。研究模型名称不进入游戏。
- 41 Lab regressions: planning-v2 excludes prose from model RNG. Adaptive shopping estimates 30 future ascents from up to 20 observed opportunities without financing obligations using chance income. 48 shopping comparisons found a 120-censored portfolio without Concierge/Stabilizer and a 120→22 failure counterexample. Medium-band Concierge appeared34/bought0 and is not adopted. Research policy names never enter play.

### English

- Bomb Carrier base fare20→14; timer3–6, trip2–6, Officer control, high-risk+4 and bank2/high-band3 unchanged. Reduce unconditional payout, retain partnerships. Commuter remains2–5 stations; reject the all-short2–3 variant.
- 124 role-factorial executions:64 development,40 new-seed baseline/combined checks,20 post-hoc Bomb-only decompositions. Short Commuter+Bomb14 changed planning median47→84.5 and risk-window39→37. Bomb14 alone kept medians47/39, early deaths3/20, above60 at7/20; F120 censoring4→2, but a109-floor energy death retained564 coins. Risk-window Bomb uptake18/34→14/33 and bank148→155 reflect unequal exposure/duration, not human win rates. Adopt only Bomb14 as a local role correction, not final balance acceptance.
- Frozen UI R02 reached its predeclared F100 cap alive after99 ascents:118 deliveries,377 coins,5 power,8/9 agitation before shopping;0 paid dismissals,1 Mimic audition withdrawal,5 reserve cells. Verified forced-muted browser closed afterward. Research time69.66 minutes is not human duration.

- Fare multipliers now use only the rider’s own base fare: Coach bonuses add to Lover pairing rather than multiplying pairing or Officer/Exorcist control rewards again. Coach still earns 3 per neighbor; other additive rewards remain outside multipliers. Cards and English copy agree.
- 140 development executions: 80 fare, 40 journey and 20 Ghost-cap trajectories. Twenty baselines reproduce 3093 prior actions, not new independent samples. Base-only multipliers still yield 5/20 above 60 and 2/20 alive-censored at 120. Reject Coach attendance 3→1, added high-zone journeys and one saving per Exorcist; none jointly solved long tails and diversity. These samples do not establish human win rates.

- New-beat holdout: 40 previously unused seed trajectories, twenty each for planning/risk-window policies. Median observed floor 46.5/40.5; above 60 in 6/20 and 3/20; alive-censored at 120 in 2/20 and 1/20. Planning tails retain 581 and 367 coins. Late economy and rare-long-run targets remain unaccepted; not human win rates.

- Musician beat strength increases from at most 1 to at most 2: low departure agitation rises toward 3, high falls toward 4, medium stays unchanged. Other agitation and arrival relief still follow. Music: 512 constructed states × 3 variants; Tourist medium payouts 82→96/128, quiet-work income falls in 13/128, double-Drunk failures 96→84/128. Twenty development treatments versus twenty rerun baselines: planning median 47.5 unchanged, risk-window median 39→46.5, above-60 runs 2/20→1/20. Adopt for clearer timing and real tradeoffs, not full balance acceptance.

- Shop cards now retain their full conditions and rewards at every viewport size, with a vertical mobile reading layout. Complete English repair messages, uncalmed Drunk state, full/further charging and Capacity/Concierge/Pact/Express previews.
- Two separate silent UI smoke sessions: 14 ascents from 1→15 exposed hidden mobile upgrade descriptions and untranslated text; one automated move and one boarding did not apply and are not counted as success or death. Added action postconditions, then ran a separate keyboard-driven 1→10 smoke. Full English shop rules were visible at 320px and 1440px; Calm purchase, affordable +2 charging and exit succeeded. Browser process mute was verified on blank pages before navigation, both preferences stayed off, and owned browsers were closed. Not complete playthroughs or human pacing acceptance.

- Inspector no longer creates extra red links with Tourist, Lover, Musician or Nurse. Conflicts with Thief, Drunk, Celebrity, Ghost and Mystery remain. Static red pairs 34→30: remove one agitation and three coin conflicts. Inspector remains 1 power, base fare 8, and +8 after two consecutive low departures; no reward buff.
- Role-opportunity audit replayed 20 existing trajectories and 2461 actions. Among 64 rejected Inspectors, removing four legacy conflicts raised budget-feasible cases only 11→12, not a complete explanation of low adoption. Twenty matched relationship-treatment runs changed Inspector adoption 9→10 and planning/risk-window median observed floor 39→47.5 and 40.5→39. Adopted for clearer role identity, not certified superiority; energy and work windows remain open. The implemented default reproduces all 2297 treatment actions and state hashes.

Local development candidate: fixed agitation bands, state-dependent work and stable Mimic pairs. Balance and interface verification are ongoing; not released.

- Fixed agitation bands: low 0–2, medium 3–4, high 5+. Base loss threshold 6→8; the Calm upgrade changes only the cap. A needle shows current state and dashed marks show the next-floor forecast, with exact values retained.
- Remove Pressure Reclaimer: agitation cannot become power. Candidate motor schedule: 1 on floors 1–10, 2 on 11–30, 3 on 31–60 and a capped 4 from 61. No forced death at floor 60.
- Mechanic power 2→1, fare 4→6. Two low-agitation departures complete one repair, saving 1 motor power on the next 3 ascents. Medium/high pauses progress. Once per rider; additional completions extend duration up to 6, never strength.
- Musician power 2→1. One cabin beat moves agitation toward medium by up to 2, never crossing the nearest band edge. Does not stack, care for neighbors or stop risk links. Nurses retain neighbor care.
- Commuter low-band arrival +2 coins; Tourist medium +3. Inspector stamps after two consecutive low departures, retaining an +8 arrival bonus. Child earns +6 after two cared-for ascents. These bonuses are not multiplied. Drunk high-band +100% base fare no longer requires two neighbors.
- Reduce ordinary base fares: Commuter 7→5, Tourist 10→8, Courier 6→3, Lover 5→3, Coach 10→8. Retain state, work and link rewards. Arrival relief remains capped at 2, preserving exit windows for simultaneous risky deliveries.
- Uncontrolled risk links still add 1 agitation per edge. Each member banks 2 coins per ascent, or 3 at high agitation, once regardless of degree. Control or separation stops links; delivery pays and dismissal forfeits.
- Mimic copies base fare or power only from immediately above in the same column. Each specific Mimic/source pair has a stable draw across moves, columns, previews and other neighbors. An empty source disables copying. Hidden fares stay hidden; abilities are not copied.
- Active roster 21→19: Lawyer and Shifter temporarily retired, retaining definitions and art. Coach/Inspector join at 26, Celebrity/Bomb/Mystery at 31, Mimic at 36. Courier and Mechanic use standard card materials.
- Capacity upgrade: 35 coins for +10 capacity, no free power, replacing Reclaimer. Reserve Cell: 20 coins, carry one outside permanent slots, use after leaving the shop for up to 8 power. Four permanent slots, one purchase per shop, no installed repeats. Charging 2/power and soothing 8/point remain fixed.
- A full-width mobile instrument panel retains exact forecasts, band ranges and visible labels; small-screen controls no longer overflow. Cards have an explicit Details action. Mimics use upward purple arrows; risk links show agitation costs directly.
- Cabin rider power includes red-link multipliers; flat link costs and cabin-wide savings remain separate. Three offer navigation controls stay visible on desktop. Boarded offers use the current rider journey. Bombs explicitly allow arrival on the expiry floor.
- Affordable one-click charging and exact coin deficits. Purchase warnings distinguish an unaffordable current emergency from missing a suggested charge target, which is not required to leave. Fix English repair duration and shop-exit text.
- Music mute now pauses immediately without waiting for background animation. Late play callbacks cannot revive muted or replaced tracks. Read preferences before starting audio and synchronize same-origin tabs. QA additionally requires a browser process launched with forced audio mute.
- Portable Player Lab: seven public-information policies with independently selectable shopping behavior, including investment constrained by visible rider obligations plus a two-power buffer. Prefix-safe sector budgets, reserve cells, work progress, action replay and source manifests; thirty-five regressions. Research policy names never appear in the game.

- Twenty new development trajectories separate rider-budgeted shopping from departure decisions, compared with 30 existing baselines. With the same planning departures, failures before 30 fell from 7/10 to 1/10 versus motor-only investment, and median observed floor rose 28→39; the 119 energy death with 494 coins persists. No game balance changes or balance acceptance. An internal diversity agreement preserves conditional power and audits universal choices and missed role opportunities.

- Mimic: 2000 legal moves, 1000 relocations/reconstructions, 128 new sources and 100 pure previews. Sixteen rule groups cover 12000 encounter packets, 20000 mixed transitions and 1024 upgrade combinations, plus 4000 resource forecast checks. Fake audio tests cover stalled frames, late play, replacement and disposal without speaker playback.
- Sixty matched development runs (3 variants × 2 policies × 10) retained lower base fares with arrival relief capped at 2. A subsequent 64-run independent-seed sample included 5/20 planning runs above 60 and one risk-window run censored alive at 120 out of 20; four other policies had six runs each. None are human win rates.
- Frozen-candidate UI R01: floors 1→100, 99 ascents, 115 deliveries; income 1607, spending 1184, balance 423. The observation cap was chosen at floor 80; alive at 100 is right-censored, not a win or death. Research/tool time is not human play time. Switches were recorded off, but a later audible incident prevents claiming verified silence throughout.
- Thirty matched development runs with invest-first behavior exposed an energy death at 119 with 494 coins. A further 120 economic-factorial executions (4 variants × 3 policies × 10) include 30 exact baseline replays, not new independent evidence. Reducing Concierge 2→1 and Tip Jar 4→3 still left that run alive at 120 with 240 coins. Reducing Thief travel 3→2 and Celebrity travel 2→1 lowered invest-first mean floor 40.5→28, with all ten ending before 40. Neither simple reduction is adopted; shipped defaults remain unchanged.

- Late cash accumulation versus early investment risk remains unresolved; not released. R01 first encountered a Mimic at 66, motivating separate introduction research. Forced-muted browser launch and full mobile shop rules were checked; new Musician copy and the complete candidate still need silent playtesting. Human 25–40-minute pacing is not calibrated.

### 中文

- 炸弹客基价20→14；倒计时3–6、路程2–6、警察锁定、高危+4、暂存2/高档3不变。减少无条件回报，保留配合兑现。通勤者仍2–5站，拒绝全员2–3站实验。
- 角色分项124次执行：64次开发、40次新种子基线/组合复核、20次事后炸弹单项分解。短途通勤+炸弹14使规划组中位47→84.5、危险组39→37。仅炸弹14保留中位47/39、早死3/20、超过60为7/20；120截尾4→2，但109层断电仍余564币。危险组炸弹采用18/34→14/33，暂存148→155，曝光与路程不同，不是人类胜率。只采用炸弹14作为本地角色修正，整体平衡尚未验收。
- R02按开局前声明的F100上限截尾，99上行后存活：118送达、377币、5电、8/9躁动，尚未购物；0付费请离、1次复制人试摆撤回、5次应急电池。独立浏览器进程强制静音已核验且结束关闭；研究69.66分钟不是人类时长。

- 修正车费倍率：教练等倍率只计算本体基价，与恋人配对等倍率相加，不再重复放大配对或警察/驱魔师控制奖励。教练自身每位邻座+3币不变，其余加成仍在倍率外；卡片与英文说明同步。
- 新增140次开发执行：80条车费、40条路程、20条幽灵节能上限轨迹。其中20条基线3093动作重现旧样本，不计新增独立证据。仅基价倍率方案仍5/20超过60、2/20在120存活截尾。未采用教练自身3→1、全员高区加长路程、每驱魔师节能上限；未共同解决长局与多样性，不当成人类胜率。

- 修复小屏商店隐藏能力正文的问题：所有尺寸均显示触发条件与实际收益，手机卡片改为纵向阅读布局。补齐英文检修完成、醉汉未安抚、充满电、继续充电、容量/礼宾/契约/快速电梯预览。
- 新增两段独立无声UI烟测：F1→15的14次上行发现手机能力正文隐藏与英文残留；一次自动换位和一次上车未生效，未记成成功或死亡。测试入口新增操作后置检查，并以键盘执行独立F1→10烟测；320px及1440px英文商店正文可见，购买舒缓、按余额补2电、离店完成。浏览器从空白页核验--mute-audio及双开关off，结束关闭；不是完整实玩局或人类节奏验收。

- 检查员不再与游客、恋人、音乐家、护士产生额外红线；保留与小偷、醉汉、名人、幽灵和神秘人的冲突。静态红线34→30，减少1种躁动冲突和3种金币冲突；检查员仍耗1电、基价8、连续低躁动2层到站+8，未提高奖励。
- 人物机会审查重放20条旧轨迹、2461个动作：64次拒绝检查员中，移除4条旧冲突仅使预算内可行局面11→12，不能解决全部冷门原因。另跑20条同种子关系处理组，检查员采用9→10，规划/危险窗口中位观察层39→47.5、40.5→39；不是优劣定论。采纳为定位简化，仍需研究续航与工作窗口；落地后2297个动作逐状态重放一致。

本地开发候选：躁动分档，人物在不同状态下工作；复制人与具体来源固定配对。数值与界面仍在验证，尚未发布。

- 躁动固定分为低0–2、中3–4、高5及以上；基础失控上限6→8。舒缓升级仅改变上限，不移动分档。指针显示当前状态，虚线表示下站预测，保留精确数值。
- 移除压力回收，躁动不兑换能量。运转候选曲线为1–10层1电、11–30层2电、31–60层3电、61层起4电封顶；不设置60层强制失败。
- 维修工耗电2→1、基价4→6：累计两次低躁动关门完成一次检修，后续3层运转少耗1电。中/高暂停但保留进度；每人一次，多位延长到最多6层，不叠强度。
- 采用新节拍后，未参与调参的40条种子轨迹：规划/危险窗口各20，中位观察层46.5/40.5，超过60为6/20与3/20，120层存活截尾2/20与1/20。规划长局余581和367币，晚期经济与稀少长局目标仍未达标；不是人类胜率。
- 音乐家耗电2→1；节拍由最多1点改为最多2点：按关门状态，低档向3提高、高档向4降低，中档不变。全舱一份，不叠加，不照护邻座、不停止坏人链接；其他躁动与到站舒缓仍正常结算。
- 音乐家512个人工构造局面×3方案：游客中档兑现82→96/128，安静工作13/128局面收入反降，双醉汉失控96→84/128。另20条开发处理轨迹与20条重跑基线比较：规划中位47.5不变，危险窗口39→46.5；超过60层2/20→1/20。采用最多2点节拍以改善可经营的窗口，不把局面覆盖当真实出现率，也不宣称多样性全部达标。
- 通勤者低档到站额外+2币；游客中档+3；检查员连续两次低档取得保留签章，到站+8；儿童累计照顾两次到站+6。状态奖励不参与倍率。醉汉高档基价+100%，移除2邻座门槛。
- 降低常规基础车费：通勤7→5、游客10→8、快递6→3、恋人5→3、教练10→8；保留所有状态、工作与连接奖励。到站舒缓仍最多2点，为同时送达的危险组合留下退出窗口。
- 未受控坏人链接仍每边+1躁动；成员每层暂存2币，高档改为3币，多邻座不重复积存。控制或拆分停止链接，已存奖励送达兑现、请离放弃。
- 复制人只随机复制同列正上方乘客的基础车费或耗电。同一复制人与同一具体来源固定抽取；挪动、换列、预览、其他邻座变化不重抽。空位失效，隐藏车费不揭晓，不复制技能。
- 活跃人物池21→19，暂退律师与百变人，保留历史定义和美术。教练/检查员26层、名人/炸弹/神秘人31层、复制人36层加入。快递员和维修工改用常规材质。
- 商店新增容量升级35币：上限+10，不赠电；替代回收。常驻应急电池20币，最多携带1份，不占安装位；离店后主动补8电，不超过容量。永久能力仍4位、每店1项、已购不重出；充电2币/电、舒缓8币/点不涨价。
- 手机仪表改为整行布局，保留低/中/高范围、精确预报与可见标签；小屏操作栏不再溢出。人物卡有明确完整规则入口；复制用紫色向上箭头，危险链接直接显示躁动代价。
- 车内人物耗电显示红线倍率后的数值；固定链接费用和整车节能另列。桌面始终保留三张候客的定位入口；已上车候客卡读取车内当前剩余路程。炸弹写明同层到站安全，未到站归零才失败。
- 商店新增按余额一次补电，缺钱显示准确缺额；购买后不能抢救当前失控与达不到参考电量分别提示，不把参考线当成离店要求。修正英文检修余时和离店提示。
- 关闭音乐立即静音并暂停，不等待后台渐弱动画；延迟播放回调不能恢复已关闭或替换的音轨。先读取偏好再启动音频，同源标签页同步开关。测试入口额外要求浏览器进程强制静音。
- Player Lab随仓库运行：七种公开信息策略，购物方式可独立切换；新增按当前乘客用电预算加2电余量决定投资。区间用电前缀预算、应急电池、状态进度、逐动作重放与源码清单；35项回归。研究策略名称不进入游戏。

- 新增20条当前乘客用电约束投资轨迹，与已有30条开发基线比较。相同规划关门方式下，相比只留运转预算，30层前结束7/10→1/10、中位观察层28→39；119层断电余494币仍存在。未改游戏数值，不能据此验收平衡。新增内部多样性验收约定：保留条件性强势，检查必选骨架与低采用人物的具体机会。

- 复制人专项：2000次合法移动、1000次换列/重建、128个新来源、100次纯预览。新版16组规则回归覆盖12000批候客、20000次混合结算、1024升级组合，另有4000次资源预报检查。音频用模拟对象检验冻结动画、延迟播放、切换及销毁，不试听。
- 60次同源开发对照（3参数×2策略×10）保留降低基价、到站最多舒缓2点方案。随后64次独立种子样本：规划20次中5次超过60，危险窗口20次中1次到120存活截尾；另四种策略各6次。这些都不是人类胜率。
- 冻结候选真实界面R01：1→100层、99次上行，115人送达；收入1607、支出1184、余额423。观察上限在80层才设定，100层仍存活，属于右截尾，不是胜利或死亡。工具研究时长不代表人类时长。开关记录为关闭，但后续用户反馈出声，故不声称全程实际无声。
- 新增先投资策略后的30次同种子开发比较出现119层断电、仍余494币的轨迹。随后120次经济分项运行（4方案×3策略×10），其中30条基线逐动作重现旧批次，不计新增独立证据。只降礼宾2→1和小费盒4→3，该长局仍到120存活且余240；只降小偷3→2、名人2→1的途中收入，投资策略均值40.5→28且全在40层前结束。两类简单削弱均暂不采用，默认数值保持不变。

- 后期金币积累、前期投资风险与长期回报仍未平衡，尚未发布。R01首次复制人66层偏晚；人物引入需独立研究。强制静音启动链和商店移动端全文已实测；新音乐家文案与完整候选仍需静音实玩复核。25–40分钟的人类体验尚未校准。

## v8.31 — 2026-09-05 — Paid on delivery

Gradual introductions, linked encounter packets and banked risk rewards. Income, range, dismissals and four installation slots now compete. Local overhaul candidate.

- Good, Bad and Special cards use green, red and gold. Category is not safety or power. Material grain, double edges and foil distinguish grade. Specials get short reveal cues; mute and quick reveal are respected. Sound mute persists across reloads.
- Start with 5 roles. Thief/Officer at 6; Drunk/Nurse/Child at 11; Musician/Lawyer at 16; Ghost/Exorcist at 21; Coach/Inspector at 31; Mystery at 36; Celebrity/Bomb at 41; Shifter/Mimic at 46. Packets include a relationship. From 21, 30% try a conflict partner. No resource-based rescue draws.
- High risk starts at 17. The final 3 floors before maintenance have at least one high-risk offer; every packet retains an ordinary offer, though its role may be dangerous. High-risk premium 8→4 and is no longer multiplied; random high-risk chance caps at 55%.
- Base fares: Tourist 18→10, Mechanic 7→4, Lover 6→5, Musician 14→6, Officer 8→6, Lawyer 10→6, Drunk 14→10, Nurse 8→5, Ghost 8→4, Exorcist 9→5, Coach 20→10, Celebrity 18→12, Inspector 12→8, Bomb 26→20. Mystery range 8–40→8–24; Shifter 28–48→16–28. Others unchanged.
- Tourists earn 2 per neighbor on delivery, not 1 per floor; not multiplied. Lovers retain +100% base fare per Lover neighbor but lose travel income. Base bond bonus 3→1; pact still adds 2. Uncontrolled Thief travel income 4→3. Controlled Thieves and calmed Drunks lose travel income. Celebrity income 3→2.
- Adjacent uncontrolled Thieves, Drunks and Bomb Carriers each bank 2 coins per ascent, once per member regardless of degree. Each link adds 1 agitation beyond care. Delivery pays; dismissal forfeits. Control or calming the relevant rider stops its links without losing existing savings. Drunk appetite still adds 100% base fare at agitation ≥3 with 2+ neighbors.
- A Lawyer prevents up to 2 red-link coin loss per floor cabin-wide; does not stack. Each controlled Ghost saves 1 power instead of 2 and receives 2 extra arrival coins instead of 6. Mechanics still save 2 passenger power; motor costs cannot be offset. Inspector now checks net rider and red-link power ≤3, excluding the motor: +1 coin if compliant, otherwise +1 agitation, so route scaling cannot make compliance impossible.
- Motor: 1 power through 20, 2 on 21–30, then +1 per ten floors. Initial 50, capacity 60 and shop recharge 5 are unchanged. Schedule is announced at start and current/next sector costs are visible; no performance-based scaling.
- Up to 2 paid dismissals per sector, restored at shops. Compensation remains 4 + 2×remaining floors. Declining an offer uses no allowance. Dismissals never grant fares, banked rewards, relief or recovery.
- Choose at most 4 permanent abilities from 10; one per shop, no replacements or repeat installed offers. Concierge tip 3→2. Stabilizer requires 3+ riders. Shared Ticket pays 3 only with 4+ riders and an arrival. Long-Ride Meter pays 4 per rider after 5+ actual ascents on delivery. Tip Jar and Relay remain 50% chances for 4 coins and 4 power respectively.
- Fixed prices: Pact/Reclaimer/Tip Jar/Relay 30; Calm 35; Concierge/Shared Ticket 40; Stabilizer/Express 45; Meter 25. Charging 2/power and soothing 8/point. No price scaling. Affordable emergency repair is the primary action; ending when unaffordable needs confirmation. Negative income feedback uses a single correct sign.

### Experiments

- 19 new regression groups cover 12000 packets, 12000 mixed settlements and 1024 upgrade combinations. Existing 4000 forecast cases remain; version-specific expected values are updated deliberately.
- Development samples exposed snowballing from easier combinations and the need for sector energy budgeting. Synthetic outcomes are not human win rates. Final holdout and UI records are documented in the local acceptance report.

### Watch

- Human difficulty and 25–40 minute duration are not yet calibrated. Watch energy-heavy failures, early slot lock-in, natural risk payouts and usable role opportunities. The old fourth game is alive-censored at floor 277, not a death.

### 中文

人物逐步加入，候客成组产生关系；危险协作可以暂存收益。收入、续航、请离和四个安装位一起形成经营取舍。此版为本地大改候选。

- 人物分为好人（绿）、坏人（红）、特殊（金）。类别不代表安全或强弱；稀有度以纹理、双边框和反光材质区分。特殊人物有短揭晓音型，静音和快速开门均受尊重；音效静音现在跨刷新保留。
- 开局5种人物；6层加入小偷/警察，11层醉汉/护士/儿童，16层音乐家/律师，21层幽灵/驱魔师，31层教练/检查员，36层神秘人，41层名人/炸弹客，46层百变人/复制人。每批至少一组关系；21层后30%尝试冲突关系，不保证安全。供给不读取金币或危急状态。
- 17层起可能高危，17–19等维修前3层至少一位高危；每批始终至少一位非高危，但其自身可能有风险。高危加价8→4，改为不参与倍率。机会概率上限55%，不再把后期变成三张全高危。
- 车费：游客18→10、维修工7→4、恋人6→5、音乐家14→6、警察8→6、律师10→6、醉汉14→10、护士8→5、幽灵8→4、驱魔师9→5、教练20→10、名人18→12、检查员12→8、炸弹26→20。神秘人8–40→8–24，百变人28–48→16–28。其他基价不变。
- 游客每邻座每层+1改为到站每邻座+2，不参与倍率；恋人保留每邻座基价+100%，取消途中收入。默契基础奖励3→1，契约仍额外+2。未受控小偷每层4→3；受控小偷和被安抚醉汉取消途中收入。名人每层3→2。
- 小偷、醉汉、炸弹客的未受控相邻关系：每位成员每次上行暂存2币（多邻座不重复），每条链接额外+1躁动，护理不抵消这条额外压力。送达兑现，请离放弃；控制小偷/炸弹或安抚醉汉停止链接，但已存收益保留。醉汉的躁动≥3且2+邻座基价+100%仍保留。
- 律师在车内时，整车每层红线金币损失最多抵消2币，多位不叠加。受控幽灵每层节能2→1、到站额外6→2；维修工仍抵消2点人物耗电，不能抵消运转。检查员改查人物与红线的净耗电≤3，不含运转；合格每层+1币，否则+1躁动，避免后期自动失效。
- 前20层运转仍1电，21–30层2电，此后每十层+1；初始50电、容量60和商店补5电不变。规则开局公开，界面显示本段/下段运转，预报包含实际耗电。不是按玩家表现动态加难。
- 每十层最多请离2位，进店恢复；赔偿仍4+剩余站数×2，拒绝候客不消耗次数。请离不领取车费、暂存收益、到站舒缓或回充。
- 10项永久能力中本局最多装4项，每店仍最多买1项，不能拆换；已装不重复。礼宾小费3→2；稳压须至少3人；共乘票改为4+人且有人到站时整车+3；长途计价改为坐满5次上行到站+4/人。小费盒50%额外4币、并联50%回4电不变。
- 所有价格固定，不按楼层涨价：契约/回收/小费盒/并联30、舒缓35、礼宾/共乘40、稳压/快速45、长途25；充电2币/电，舒缓8币/点。紧急维修主按钮在付得起时执行最低抢救，付不起结束需再次确认。修复负收入反馈的“+-”显示。

- 新版19项专项回归覆盖12000批候客、12000次混合结算及1024种升级持有组合；原有4000次资源预报回归保留，旧版固定数值断言按新设计更新。
- 多轮开发实验发现：单改收入并改善组合供给会放大滚雪球；增加可见区间用电预算后，规划策略能保留少量长跑。开发样本用于调试，不当真人胜率；最终独立种子与界面记录见本地验收报告。

- 尚未完成真人难度与25–40分钟时长校准。重点观察能源死亡是否过于单一、四个安装位是否太早锁定、危险协作能否自然兑现，以及新人物出现后是否有真正可用的机会。旧版第四局在277层存活截尾，不记成死亡。


## v8.30 — 2026-09-04 — A choice at every shop

- The permanent pool grows from 6 to 10 abilities, each installable once per run. At most one permanent purchase per shop. Offers, crisis handling, previews and purchases exclude installed abilities; depleted pools stay depleted. Unpurchased abilities may return.
- Pay-per-point soothing is always available: 8 coins remove 1 existing agitation, without increasing the cap, generating power or using the ability choice. Charging remains 2 coins per power. Calm System costs 35, adds 1 cap and immediately removes 2 agitation, once per run.
- Tip Jar costs 30: each normal arrival with at least 2 neighbors independently has a 50% chance of 4 extra coins, not multiplied. Simultaneous arrivals remain neighbors. Arrival Relay costs 30: at least 2 arrivals give one 50% roll for 4 power per floor, within capacity.
- Shared Ticket costs 40: depart with at least 4 riders for 3 extra cabin-wide coins per ascent. Long-Ride Meter costs 25: each rider earns 1 extra coin from their fifth actual ascent, including arrival and delayed travel. Reseating does not reset duration.
- Permanent prices no longer rise with floor or previous installations. Fixed prices: Pact 30, Reclaimer 30, Calm 35, Concierge 40, Stabilizer 45, Express 45, Tip Jar 30, Relay 30, Shared Ticket 40, Meter 25. Concierge previously started at 50 and Express at 65.
- Rolls occur only at actual resolution. Displayed fares exclude chance bonuses, receipts itemize them, and power forecasts show a range with worst-case warnings. Shop category labels are removed; no build names or combination discoveries are shown.
- Dangerous-passenger links have an experimental entry point only; normal play does not enable it. Fixed and random bonus income are compared. Calming does not remove link pressure; control or separation breaks the link.

Experiments:

- 4,096 ownership/crisis combinations verify unique offers and depleted pools. 12,000 new mixed resolutions plus 14,000 existing cases give 26,000 resource-forecast checks.
- 320,000 fixed-opportunity sequences compare payout distributions. Probabilities are experimental values, not required numbers. Equal expected rewards do not imply equal repayment rates or fun.
- Final 900 heuristic runs: solo mean 74.71 floors; four-rider neutral 72.43, income-focused 68.33, sustain-focused 73.47 and timing-focused 71.90. These do not establish dense-play superiority or completed balance.
- Final 63,000 synthetic linked-passenger trips cover care, high-risk riders, Drunk and shop stacking. One added agitation allows a longer response window than two. In 100 naturally acquired runs, the fixed +2 coins/member, +1 agitation candidate was active for only 12 floors; overall means cannot establish its balance.

Watch: Probabilities and prices still need human playtests: late-purchase payback, shared-arrival planning, helpers leaving first, and whether a random bonus is more replayable than an equal-mean fixed bonus. Experimental policy labels never appear in the game.

## v8.29 — 2026-09-04 — Another side to agitation

- Drunk: at departure before arrival, agitation ≥3 and at least 2 neighbors add +100% base fare. Additive with Coach multipliers; the +8 high-risk base premium participates, tips and bond bonuses do not. Existing uncalmed +1 agitation/floor remains. Conditions use one shared departure snapshot before arrival relief.
- Eco Circuit becomes Pressure Reclaimer, first-shop price 55→30. Each agitation point actually removed by normal arrivals restores 1 energy, up to 2/floor within capacity. Zero agitation, calming, boarding, reseating, dismissal and shop repairs generate no energy. This is post-arrival recovery, not a reduction in the Inspector’s operating-power check; one installation per run.
- Cooperation Pact first-shop price 60→30, still +2 per actual arrival bond per level. Later floor/installation price increases are unchanged.
- Forced-risk offers cap at 2; one draw remains in the complete unlocked pool. No safety guarantee. The 25% solo-Lover call uses a non-forced slot and never marks a different character.
- Cabin fare totals and arrival resolution share one calculator, including multipliers, bonds, tips and agitation premium. Waiting cards label base fare; hidden fares and hidden copied fares remain sealed.
- Ability links no longer promise a universal +3 arrival bonus. Actual bond targets carry the bonus. Officer/Counsel cards identify the Thief as the recipient of their controlled income; care links and actual-relief receipts are clearer.
- Offer reveal: 0/90/180ms stagger and 240ms/card; first-encounter and legendary-grade cues are quieter. One first-encounter marker per kind per batch, no reroll/reordering/hidden-fare peeking. Quick reveal and reduced-motion support; mobile cards can scroll when long.
- No named strategies, discovery achievements, strategy-unlock rewards or build archive. Only rules and factual resource feedback.
- Verification: 18 appetite configurations / 864 fixed states; 10000 new + 4000 existing randomized forecast checks; 20000 offer batches with 0 false Lover markers. Floor-120 support appeared in 503/4000 test batches.
- Final candidate: 900 heuristic runs (300/policy), mean floor 68.35 solo, 59.94 up-to-four with reseating, 71.94 up-to-four with reseating/dismissal. Prior prototype results retained separately. These are regression observations, not optimal policies, proof of balanced builds, human enjoyment, or measured 10–20 minute sessions.
- Separate risk-link research: 1687 active-link layouts × 6 parameter configurations = 10122 one-floor evaluations. **Not implemented in production rules.** Detailed philosophy, caveats and reproducible scripts are documented in `docs/design/2026-09-04-quiet-discovery.md`.
- Watch: whether players maintain useful agitation and adapt after arrivals; dense-cabin viability, reveal pacing, comprehension and actual session length. Avoid solving new problems by adding named build checklists or universally beneficial upgrades.

## v8.28 — 2026-09-04 — Tourists explicitly accept any neighbor

- Changed the Tourist card’s green target from “Any rider” to “Any neighbor,” expressing the rule through the player’s placement action.
- The in-cabin state now reads “Any neighbor ×count · +coins/floor”; with no neighbor it shows “Any neighbor · +1 coin/floor.”
- Detail copy now says “Any adjacent rider,” consistently in English and Chinese.
- This makes clear that the green line from a Lover is the Tourist’s one-way companion benefit; the Lover is still unpaired.
- Tourist income, Lover pairing, green-link resolution, and all balance values are unchanged.
- Added Tourist-card and dynamic-localization regressions, then reran the complete gameplay, music, localization, changelog, and production-build checks.
- Watch item: if players still mistake the companion line for a Lover pairing, add a dedicated companion icon rather than more text.

## v8.27 — 2026-09-04 — Wistful Static enters floors 01–10

- Replaced the complete floors 01–10 track with the player-supplied Wistful Static. Theme, Shop, death, and every track from floor 11 onward remain unchanged.
- Preserved the supplied 48 kHz stereo lossless WAV master. The web version is a 128 kbps MP3 calibrated to −18.0 LUFS with a −5.65 dBTP true peak.
- Gave the replacement a new asset URL so returning browsers cannot keep serving the previous track from cache.
- Floors 1–10 still share one loop and switch at floor 11; the post-120 shuffle automatically uses Wistful Static too.
- Confirmed identical SHA-256 hashes for the supplied source and project master, then verified the 183.912-second web encode and all 15 music assets.
- Added a routing regression that pins floors 1 and 10 to Wistful Static and floor 11 to the next track.
- Watch item: perceived loudness and mood continuity between the replacement, the theme, and floors 11–20; tune transitions instead of shortening the track if needed.

## v8.26 — 2026-09-04 — Drag previews show only real links

- Fixed the drag state applying its preview style to the whole adjacency map. Empty edges no longer form a green dashed grid across all six positions.
- Only green or red relationships newly created or changed by the prospective placement receive the animated preview style.
- Existing unchanged relationships retain their normal settled style, making the result of the current move distinct from the cabin's prior links.
- Neighbor detection, stacking, resource resolution, and all balance values are unchanged; this release corrects visual feedback only.
- Added edge-level regressions for empty, new, changed, and unchanged green/red relationships, then reran the complete gameplay, localization, music, changelog, and production-build checks.
- Watch item: multi-link reseats, where several relationships may change at once, should still make new and existing links immediately distinguishable.

## v8.25 — 2026-09-04 — Cabin cards stop colliding

- Rebuilt cabin rider cards as five bounded rows: name, floors remaining, portrait, current state, and the three-value strip.
- Restricted the portrait to the card's remaining middle space so it cannot push status or values outside their rows.
- Reduced the bottom strip to icons plus compact values such as `14`, `2`, and `0`; full coin, power, and agitation meanings remain in tooltips and accessible labels.
- Removed the gold portrait circle from riders boarded on the current floor. The gold card border and subtle glow now communicate that state alone.
- Long names and two-line states stay inside the card instead of colliding with the detail button or metric strip.
- No rider values, resource resolution, offer weights, or difficulty curves changed.
- Added layout-source regressions and reran the complete gameplay, localization, music, changelog, and production-build checks.
- Watch item: the densest long-name, Bomb-timer, and High-Risk combination; shorten state copy before reducing portrait size again.

## v8.24 — 2026-09-04 — Temporary cover, no end in sight

- The player is now the temporary elevator operator sent to cover tonight's shift in a strange building with no final floor.
- Rewrote the opening around one survival premise: keep power above zero, keep agitation below its limit, and survive for as long as possible.
- Reduced the three-step briefing to “Board and place riders,” “Manage power and agitation,” and “Survive as long as you can.”
- Updated the phase labels and manual summary to use the same Temporary Shift / Endless Shift framing in English and Chinese.
- Opening Agitation help or the changelog now switches to `theme.mp3`; closing either restores the current floor track.
- Added a prominent Start Game button beside the current-formation forecast, keeping the action visible without scrolling.
- Fixed English leaks in the Shop manual copy, neighbor/arrival rules in rider details, Agitation help, and accessibility labels.
- Kept one primary start action and introduced no additional pre-game step.
- No rider values, resource resolution, offer weights, or difficulty curves changed.
- Expanded localization regression coverage from 1,281 to 1,595 samples by rendering full detail-card rules for all 21 riders. Browser-audited the intro, main screen, manual, Agitation help, rider details, archive, upgrades, and changelog; only the intentional Chinese language-switch label remains Chinese.
- Verified the narrative hierarchy, English and Chinese localization, and production build.
- Added music-scene regressions for the intro, Agitation help, changelog, floor restoration, Shop, and failure tracks.
- Watch item: whether the strange-building premise creates curiosity without implying a finite story ending; future narrative should emerge through riders and floor events rather than a longer opening.

## v8.23 — 2026-09-04 — Rider cards say only three things

- Rebuilt all 21 candidate cards around three sections only: Self, Green Neighbors, and Red Neighbors.
- The header now shows arrival fare, power per floor, and non-zero agitation only. `+0` agitation is hidden.
- Removed restated conditions such as “Prevented by…” and competing placement terms such as “Cooperates with…”.
- The universal green arrival reward appears once beside the Green Neighbors heading. Identical red-cost targets share one row.
- Money timing is explicit everywhere: “Each ascent immediately…” means the Balance changes after every floor; “Own arrival…” resolves only when that rider exits.
- A controlled rider now says “No agitation” instead of showing a context-free zero.
- Phones show one full candidate card at a time with named tabs instead of squeezing three cards into narrow columns.
- Power and Agitation now use current/cap notation such as `50/60` and `0/6`. Balance shows only floors remaining to the Shop, not shift-total income.
- No rider values, offer weights, resolution order, or stacking formulas changed.
- Generated and audited all 21 compact cards, with focused Officer, Thief, and Musician regressions. Red targets do not repeat and the compact data contains no competing cooperation/conflict/adjacency wording.
- Browser-tested English and Chinese at 1440×900 desktop and 390×844 phone sizes. Card bodies had no horizontal or vertical clipping, and the phone page had no horizontal overflow.
- Watch item: whether first-time players can distinguish per-floor money from arrival money without opening details; if not, shorten individual self abilities before adding another card section.

## v8.22 — 2026-09-04 — Every neighbor becomes part of the build

- Adjacency abilities now explicitly affect every adjacent rider and stack linearly, with no hidden single-target cap.
- Musician is now a rare short-term control centerpiece: appearance weight 7→4, fare 8→14, trip 4–8→2–5, power 1→2, and every adjacent rider cancels 2 agitation per floor.
- Nurse is now common lightweight control: fare 9→8, appearance weight 7→8, power 1, and every adjacent rider cancels 1 agitation per floor.
- Coach power changes 2→1 while fare 20, trip 3–6, and all linear neighbor bonuses remain. Thief trip changes 3–7→2–6 while its uncontrolled +4 coins/+1 agitation per floor remains.
- Each normal arrival reduces agitation by 1 that floor, capped at 2, rewarding multi-rider turnover without unlimited clearing.
- Officer copy now explicitly states that every adjacent Thief is controlled and every adjacent Bomb Carrier timer is locked.
- Fixed a browser runtime error where a music fade could undershoot zero by a tiny floating-point amount; fade volume is now clamped to 0–1.
- Ran 481,055 iterative games. Rejected one-coin charging, +100% Coach multipliers, 46 starting power, and a long high-power Musician.
- Final unseen-seed holdout: 50,950 games. Balanced play averaged floor 45.60 (median 46), reached floor 20 in 94.52% and floor 40 in 79.12%; failures were 11.64% power, 88.24% agitation, and 0.12% Bomb timer. Risk play failed to power 74.88% of the time.
- Frugal play's baseline lead shrank from roughly 10 floors to 5.05. All 21 riders passed normal/favor/ban checks; acceptance spans 18.0%–62.2%, with no dead-card, auto-pick, indispensability, or trap alert.
- Exhausted 194,481 center-plus-three-neighbor formations and 4,000 random forecast transitions with zero prediction misses.
- Watch items: whether center-position Musician fan-out feels exciting enough, whether its 2-power cost remains legible, and whether the remaining five-floor frugal advantage is healthy style identity.

## v8.21 — 2026-09-04 — A complete soundtrack for the midnight shift

- Integrated 15 player-made tracks: a theme, 12 ten-floor tracks covering floors 1–120, shop music, and failure music.
- Rider placement and ordinary ascents inside one ten-floor band do not restart the current track.
- The shop and failure screen use dedicated music; leaving them restores the correct floor-band track.
- After floor 120, completed tracks shuffle from all 12 earlier floor tracks without immediately repeating the last selection.
- Added a persistent music-note toggle. It controls background music independently from the existing interaction-effect speaker button.
- Kept lossless WAV masters locally under `source-audio`; deployment uses loudness-normalized 128 kbps MP3 files, reducing roughly 503 MB to about 48 MB.
- Automated coverage verifies all 15 assets, floor boundaries, scene changes, no same-band restart, independent mute, and endless shuffle behavior.
- Watch items: perceived loudness, loop seams, transition feel, and whether the 48 MB total needs selective bitrate reduction after real-network testing.

## v8.20 — 2026-09-04 — Red links become a real cost network

- Expanded static red relationships from 19 to 35: 12 agitation, 12 coin-loss, 8 flat-power, 2 doubled-power, and 1 doubled-power/doubled-fare pair.
- Red costs resolve every floor and independently from green cooperation. Multiple x2 links stack linearly from base: two links total x3, never exponential x4.
- Red links now show fire, power, or coin icons, and cards state each conflict’s exact cost. Dynamic Mystery/Shifter/Mimic relationships use the same visible types.
- Locked the power economy at 50 starting power, 60 capacity, +5 shop-entry power, and 2 coins per extra power.
- Courier recharges 2 on arrival and appearance weight changes 9→4. Mechanic costs 2, saves 2 per floor, and weight changes 7→3. Controlled Ghost saving changes 1→2.
- Uncontrolled Thief income changes 3→4 coins per floor while keeping +1 agitation; controlled income remains 1 per floor plus 5 on arrival.
- Officer/Bomb cooperation no longer depends on even floors: adjacency locks the Bomb timer completely, and separating them resumes its −1-per-floor countdown.
- Ran more than 285,000 complete games across candidate parameters, then repeated the final independent 35,200-game holdout after removing the last odd/even rider rule.
- The final locked holdout averaged floor 39.60 (median 44), with 83.44% reaching 20 and 58.52% reaching 40. Balanced failures were 32.72% power, 67.16% agitation, and 0.12% Bomb timer.
- Favoring Officer changed survival by +1.83 floors and banning it by +0.10; favoring Bomb changed 0.00 and banning it −0.07. All 21 normal/favor/ban comparisons passed with no dominance, indispensability, or trap alerts.
- Exhausted 194,481 center-plus-three-neighbor formations and 4,000 random forecast transitions. All multiplier, stacking, and next-floor forecast checks passed with zero misses.
- Watch items: human readability of multiplier icons, whether rare sustain cards feel exciting rather than mandatory, and whether Coach’s high-income/high-power route remains worth its cost.

## v8.19 — 2026-09-03 — Companions become a real stackable group route

- Every adjacent rider now gives a Tourist +1 coin per floor. Duplicate professions and other Tourists each count separately.
- Removed the two-companion rules cap and `x/2` display. Cabin geometry naturally limits one position to at most three adjacent companions.
- Any two adjacent Tourists now draw a green companion link. These visual companion links do not secretly grant the separate generic arrival cooperation reward.
- Ran 27,000 complete games under the new rule, all 194,481 center-plus-three-neighbor formations, and 216 targeted Tourist arrangements with zero forecast misses.
- Same-seed before/after tests moved balanced mean survival only 42.67→42.78 floors while mean income rose 683.86→699.35. The change adds payoff without creating a survival advantage.
- In a 17,000-game unseen-seed holdout, Tourist acceptance was 44.7% normally and 58.9% when favored. Favoring it changed survival by −0.46 floors; banning it changed +0.16. No dominance or indispensability alert fired.
- A full six-Tourist cabin tops out at 14 companion coins per floor across seven adjacency edges, matching six Lovers' per-floor edge scale without their arrival-fare multiplier.
- Watch item: if human players make full travel parties too reliable, tune trip length or base fare before weakening the simple per-rider stacking rule.

## v8.18 — 2026-09-03 — Bomb risk is now a readable countdown

- Replaced every player-facing “fuse” with “Bomb timer” and direct cause-and-effect wording.
- Bomb Carrier cards now state: timer starts at 3–6, drops by 1 each floor, zero before arrival ends the run, and zero on the arrival floor is safe.
- Officer cards now say an adjacent Bomb Carrier timer does not drop on even floors; Counsel cards explicitly say they cannot pause it.
- Cabin labels, rider details, failure messaging, retry advice, the archive, and Mimic exclusions all use the same term in Chinese and English.
- Verified the complete Bomb Carrier lifecycle and localization. No balance values changed: fare 26, power 1, trip 2–6, and starting timer 3–6 remain fixed.
- Watch item: the clearer label is longer, so very narrow cabin labels may eventually use the compact form “Bomb 4.”

## v8.17 — 2026-09-03 — Stacking rules now match every card

- Red adjacency conflicts now add 1 agitation only when the next floor is even. Odd floors no longer apply a hidden conflict penalty.
- Public rider values are unchanged. Green links remain linear and suppress only that rider's generic red-link conflict layer, never intrinsic or volatile agitation.
- Ran 55,604 complete games and 306,663 controlled stacking/trait cases, including all 194,481 center-rider plus three-neighbor formations. Forecast misses: zero.
- For each of all 21 riders, ran 600 normal, 600 favor, and 600 ban comparisons. The highest duplicate rate was Lover at 25.2%, yet favoring it changed survival by −0.67 floors. No favored stack gained more than +1.09 floors.
- Six Lovers arriving together pay 176 coins; each Cooperation Contract level adds exactly 28. Three Coaches scale Tourist fare 18→45, while Concierge tips remain unmultiplied at +3 per level.
- One Nurse/Officer can affect up to three adjacent valid targets, but the benefit remains linear and is bounded by position and cabin capacity. Mimic copied fields remained distinct and evenly distributed across 12,000 samples.
- Rejected Mechanic saving 1 after 9,800 games: balanced floor-40 reach fell from about 69% to 56.5%, aggressive median fell to floor 10, and sustain dependence remained.
- Watch items: Mechanic remains the sustain anchor without a duplicate exploit; blind Thief stacking costs −4.50 floors unless Officer/Counsel support is built with it.

## v8.16 — 2026-09-03 — Every rider competes across two resources

- Initial power changes from 48 to 42; capacity stays 60. The motor, recharge price, and mandatory-rider rules are unchanged.
- Tourist power changes from 2 to 1 per floor. Its 18 base fare, 4–7-floor trip, and diverse-neighbor income remain unchanged.
- Courier recharges 1 power on arrival, capped by capacity. The candidate card, cabin state, settlement feedback, and next-floor forecast all disclose it.
- Coach remains a 2-power rider, but its trip changes from 4–8 to 3–6 floors. All fare multipliers remain unchanged.
- Ran 221,126 complete simulated games and 86,016 controlled rider trajectories. Rejected variants included start power 36, Courier recharge 2, Coach power 1, and guaranteed low-power shop cards.
- Final unseen-seed holdout: 33,200 games, with 2,000 runs for each of four whole-run styles and 1,200 paired normal/favor/ban runs for every rider. Forecast misses: zero.
- Balanced play averaged floor 41.45 (median 44); 91.55% reached floor 20 and 66.75% reached floor 40. Failures were 26.95% power, 72.90% agitation, and 0.15% fuse.
- All 21 riders were selected in 17.7%–62.2% of normal offers. No rider became a universal reject or auto-pick. Tourist, Courier, and Coach favor deltas were +0.20, −0.38, and −0.68 floors.
- Mechanic remains the watch item: favoring it further adds only +0.27 floors, but banning it entirely costs −13.95 floors. Human play should determine whether it is a healthy sustain anchor or needs a third sustain route.

## v8.15 — 2026-09-03 — Tourist becomes a formation investment

- Tourist base fare changes from 22 to 18 and trip length from 3–7 to 4–7 floors; power remains 2 per floor.
- Each distinct adjacent non-Tourist profession earns the Tourist +1 coin per floor, capped at +2. Other Tourists do not count and duplicate professions count once.
- Cabin state shows `Companions 0/2–2/2` and the current bonus. Candidate cards receive a travel-grid postcard surface and Companion Bonus stamp while remaining Fine rarity.
- Companion income is separate from base fare, so Coach multipliers never multiply it.
- Verified 216 directed formations. A paired 10,000-game comparison kept balanced median at floor 25 and moved average income only from 322.79 to 324.06.
- Independent holdout: 20,000 games and 367,691 floor settlements, with zero power or agitation forecast misses and balanced median still at floor 25.
- Research only: 600,000 Storyteller trials showed the raw two-Child exit rule soft-locking a slot for a median 15–19 floors. A 20% per-floor Child-call chance reduced median release to 6 floors and >20-floor locks to 4.72%–5.92%. Storyteller is not yet live.
- Watch items: whether players intentionally preserve diverse Tourist neighbors, and whether to approve the tested Storyteller parameters for a later release.

## v8.14 — 2026-09-03 — Card headers stop competing for space

- The top agitation value is now always a compact “Self +0/+1”; long cancellation or conditional rules appear only in the ability area below.
- Desktop cards use a shrinkable identity column and fixed-content value column, with a safer English-name size.
- Mobile rarity and value areas gain minimum-width constraints to prevent horizontal overflow.
- Browser verification at 1280×720 covers three Chinese candidate sets and one English set with long conditions and material badges; desktop, short-screen, phone, and landscape media rules were also reviewed line by line.
- Full rules, localization, build, and release-history regressions pass. No gameplay values changed.
- Watch item: unusually narrow desktop windows and enlarged system text settings.

## v8.13 — 2026-09-03 — This-floor decisions read at a glance

- Boarded candidate cards turn grey and translucent; riders boarded on the current floor receive a bright gold cabin ring. Existing riders are not marked as new.
- A next-floor power delta shakes in red when the current arrangement would reduce power to zero or below. The agitation delta does the same when it would reach the cap.
- Every floor immediately before a ten-floor shop clearly shows “Next: Shop” in a highlighted notice.
- Player-facing supply-stop wording is now simply “Shop”; shop instructions and departure copy are shorter.
- The current coin total now sits at the very top of the shop with a substantially larger number.
- Reduced-motion settings disable the shake and pulse while preserving the warning color and borders.
- Added shop-warning regressions for floors 9 and 39 and retained exact next-floor power/agitation forecast checks. No balance values changed.
- Watch items: danger-shake salience without distraction, and grey boarded-card legibility on dim displays.

## v8.12 — 2026-09-03 — Two-resource squeeze

- Agitation cap is 6. Removed crowding, shift pressure, empty-car rests, and the hidden high-agitation multiplier. Agitation now comes only from visible rider values, high-risk tags, rider events, and unprotected red links.
- Each Nurse or Musician cancels 1 agitation from one adjacent rider per floor. Multiple calmers stack without going below zero. Any normal arrival reduces total agitation by at most 1 that floor. Calm System now gives cap +1 and immediate −2.
- High-risk riders add +1 agitation and +8 arrival coins. They begin ramping at floor 30; offer sets guarantee at least one from floor 40, two from floor 80, and all three from floor 120.
- Initial power is 48, capacity is 60, charging costs 1 coin per power, and the reference target is 50. At least one rider is required to ascend.
- Inspector now checks total power every floor: at 4 or less it earns +1 coin; above 4 it adds +1 agitation.
- Added a copper-red high-risk material, flame badge, and cabin marker so the risk is visible before committing.
- Screened initial power 36–60, capacities 48–72, charging price 1–2, agitation caps 6–10, and six high-risk progression curves.
- Independent holdout: 40,000 games and 1,050,768 floor settlements with zero forecast misses. Balanced play averaged floor 38.07 (median 43); 96.92% reached 10, 81.20% reached 20, 57.85% reached 40, and 6.26% reached 60. Failure causes were 28.66% power and 70.89% agitation.
- Agitation-blind and greedy strategies both had median floor 9. A conservative two-rider reserve strategy had median 49, so full-cabin and pure-income strategies do not dominate.
- Watch items: whether the floor 30–40 risk ramp feels too slow in human play, and whether +8 coins is enough to tempt players into visible danger.

## v8.11 — 2026-09-03 — Mechanic savings reads fully in English

- The Mechanic card now renders its stackable 2-power-per-floor saving fully in English.
- Runtime localization coverage for all 21 riders now checks power, income, agitation, and ability rows at normal and high agitation.
- Coach copy remains general and does not name Mystery.
- No gameplay value or material tier changed.
- Full verification still covers 52,920 targeted pair/position cases, 48,000 random transitions, 60 connection cases, 8 stacking families, and 768 interaction cases.
- Watch item: keep validating new dynamic copy against actual production candidate combinations.

## v8.10 — 2026-09-03 — Every English rider rule reads cleanly

- Completed compact-rule translations for Thief, Officer, Lawyer, Drunk, Musician, Nurse, Child, Ghost, Exorcist, Coach, Celebrity, Inspector, Bomb Carrier, Mystery, Shifter, and Mimic.
- Covered dynamic even-floor agitation, 25% incident, Inspector threshold, bomb fuse, and copied-stat phrases so runtime values cannot leave Chinese fragments behind.
- The Coach card still states only its general adjacency rule. It does not call out Mystery as a special case, and hidden-fare settlement is unchanged.
- Added runtime-card localization checks for all 21 riders at both normal and high agitation.
- Production visual testing confirmed fully English candidate cards, unclipped card copy, and a single-line primary action.
- No rider value, material tier, appearance weight, power, agitation, coin, or upgrade effect changed.
- Full verification still covers 52,920 targeted pair/position cases, 48,000 random transitions, 60 connection cases, 8 stacking families, and 768 interaction cases.
- Watch item: continue observing reading rhythm for rule-dense riders at narrower desktop widths.

## v8.9 — 2026-09-03 — Rider value becomes a physical material

- Added four materials: Standard dark stock, Fine brushed copper, Rare gilt lacquer, and restrained Legendary iridescent obsidian.
- Fixed public thresholds: appearance weight ≤4 or base fare ≥30 is Legendary; weight ≤6 or fare ≥20 is Rare; weight ≤8 or fare ≥14 is Fine; everything else is Standard. Coach is Rare; Shifter and Bomb Carrier are Legendary.
- Mystery grades from public appearance weight only, never its sealed fare, so the card material cannot leak the reward.
- Desktop cards now size to complete rules. If all three exceed the rail height, only the candidate rail scrolls; card text is never clipped.
- Added a Coach-and-hidden-fare regression: Mystery base fare still receives 50% per adjacent Coach, without adding special-case copy to the card.
- No rider, power, agitation, coin, appearance, or upgrade value changed.
- Added an exact two-Coach Mystery regression: sealed base fare 31 resolves to 62 coins and is logged only on arrival.
- Full verification still covers 52,920 targeted pair/position cases, 48,000 random transitions, 60 connection cases, 8 stacking families, and 768 interaction cases.
- Watch item: material means appearance rarity or base reward, not automatic strength.
- Watch item: observe whether the candidate rail needs a stronger end fade when long-rule combinations require internal scrolling.

## v8.8 — 2026-09-03 — Candidate cards keep only useful feedback

- Removed “Drag to a position / click to board” from available, unselected candidate cards so rider rules have more room.
- Kept contextual messages for selected riders, boarded riders, a full cabin, and candidates that can immediately create a link.
- No rider, power, agitation, coin, difficulty-wave, or upgrade values changed in this release.
- Checked default, selected, boarded, full-cabin, and link-ready states in both English and Chinese.
- Full verification still covers 52,920 targeted rider-pair and position cases, 48,000 random state transitions, 60 connection cases, 8 stacking families, and 768 interaction cases.
- Production and GitHub Pages static builds must pass, and the candidate-card render path must no longer contain the removed English or Chinese default message.
- Watch item: short-rule cards now keep deliberate breathing room instead of filling it with a generic instruction.
- Watch item: keep observing whether first-time players can board smoothly from drag feedback and the selected state alone.

## v8.7 — 2026-09-03 — The midnight shift goes bilingual

- English is now the default. A `中文 / EN` switch appears in the header; Chinese mode keeps `?lang=zh` in the URL and survives refreshes.
- English covers the intro, rider cards, cabin states, cooperation and conflict, shift manual, archive, upgrade shop, results, failures, and the complete release archive.
- The document language defaults to `en` and changes to `zh-CN` with the interface.
- No rider, power, agitation, coin, difficulty-wave, or upgrade values changed in this release.
- Added localization coverage checks across rider, upgrade, rule, dynamic interface, and release-note copy.
- Full rules verification still covers 52,920 targeted rider-pair and position cases, 48,000 random state transitions, 60 connection cases, 8 stacking families, and 768 interaction cases.
- Production and GitHub Pages static builds must both pass. The default static document declares `lang=en` and retains a direct Chinese entry point.
- Watch item: review long English rules on short 375×667 phones, shortening wording only when no decision-critical value is lost.
- Watch item: future riders and mechanics must ship with both languages so the two rulesets never drift.

## v8.6 — 2026-09-03 — High pressure without a forced death wall

- Reduced the three-floor high-pressure wave from +5 to +4 agitation per floor; the +1 preparation wave and long-run scaling are unchanged.
- Removed duplicate forecast, energy-equation, and reseating copy from the mobile action area. The normal close-and-rise button is now 74px tall; a single contextual instruction appears only while placing or reseating.
- Reframed the guided first run as one example of reading a green cooperation line, not a claim that lovers are the universal best play.
- Corrected candidate-list and animated-number accessibility semantics; the automated audit reports zero violations.
- Fixed the balance harness so simulated players reserve coins and recharge at supply stops instead of following an impossible no-charge policy.
- Ran 20,000 games and 370,594 floor settlements with zero forecast mismatches. Balanced play reached floor 10 in 99.92%, floor 20 in 44.58%, and floor 30 in 19.60% of runs, with a maximum of 100. Ignoring agitation reached floor 20 only 2.66% of the time.
- Browser-tested 1440×900, 390×844, and 375×667 layouts, including placement, green-link feedback, settlement animation, and the floor-10 shop without page scrolling.
- Watch item: balanced median remains floor 19, deliberately severe but still requiring human play feedback around the first high-pressure wall.

## v8.5 — 2026-09-03 — Version history in game

- Added a clickable version entry on desktop and mobile.
- Added an in-game changelog with changes, experiments, conclusions, and watch items.
- Added an automated release invariant so the visible version, changelog data, and this file cannot drift.
- Re-ran 52,920 directed relationship cases and 48,000 randomized transitions with zero forecast mismatches.
- Carries forward v8.4's 17,750 simulated games and 1,083,654 floor settlements.

## v8.4 — 2026-09-03 — Stacking builds

- Every active green connection pays its own arrival bonus. Every unprotected red connection adds its own even-floor agitation.
- Mechanics contribute 2 passenger-energy savings each; controlled ghosts and the eco circuit add independently.
- Lover and coach bonuses stack linearly. Duplicate nurses, musicians, inspectors, and other per-character effects resolve independently.
- Energy savings remain capped by passenger energy and never erase the elevator's 1 energy motor cost.
- Tested 17,750 games across mechanic, lover, coach, occult, calming, link-focused, and adaptive mixed strategies. Pure stacking did not dominate adaptive play.
- Verified 21 passenger relationship profiles and eight special stacking families.

## v8.3 — 2026-09-03 — Predictable mechanic support

- Replaced the mechanic's multiple-of-three trigger with a per-floor saving.
- Replaced the clock-like agitation icon with a flame.
- Compacted the ten-floor shop so its continue action remains in the viewport.

## v8.2 — 2026-09-03 — Agitation clarity

- Consolidated character values around coins, energy, and agitation.
- Put metric icons beside numeric effects and simplified shop copy.

## v8.1 — 2026-09-03 — Onboard readability

- Kept the three character metrics visible after boarding.
- Cropped portraits without distortion and strengthened boarded-state and connection feedback.

## v8.0 — 2026-09-03 — Passenger cards and archive

- Moved larger metrics beside character names and fixed long-text clipping.
- Fixed the passenger archive so only encountered characters are discovered.
