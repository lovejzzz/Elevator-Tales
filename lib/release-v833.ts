import type {ChangelogEntry} from './changelog';

export const V833_ZH: ChangelogEntry = {
 version:'8.33',date:'2026-09-05',title:'三位候客，同时看清',
 summary:'桌面候客不再套着滚动区域，三张卡同时比较；完整规则仍可随时打开。',
 changes:[
  '取消候客卡内部滚动和桌面候客列表滚动，删除重复的三枚跳转按钮。高窗口右侧三张等高卡；较矮桌面与平板改为横排三卡，不靠缩小正文或遮住第三张来适配。',
  '主卡保留人物身份、行程、基价、小费、耗电、自身躁动、能力摘要和工作/倒计时状态。绿色和红色关系显示对象；简单关系保留具体收益，复杂关系显示对象与总数，完整效果通过完整规则查看。主能力与关系正文14px，保留类别颜色和稀有度材质。',
  '已上车候客继续使用车内当前人物的行程和状态；点击撤回、选择空位和独立规则按钮保持原交互。恋人摘要明确25%呼唤是全车判定，不按人数叠加。',
  '恋人呼唤成功时只补1位，另外2位从非恋人中生成可互动组合，不再由被召唤恋人额外带出配套恋人。全车25%判定、普通未触发候客、新手首包、基价3和每位恋人邻座+100%基价均不变；商店和结算不变。',
 ],
 experiments:[
  '隔离强制静音浏览器：中文/英文×1728×900、1440×900、1280×720、1024×768，覆盖19位在用人物的56个注入候客布局。检查三张卡、文字边界、页面无滚动、规则按钮可达；这是UI夹具，不是真人对局或平衡认证。',
  '恋人修改前后各240000候客包：5/25/45层×4种车厢×20000。修复后每次成功召唤恰好1位恋人；1位/2位未配对的同种子结果一致，无人/全部配对不召唤。第5层未配对时2+恋人包41.36%→15.945%，恋人卡占比34.58%→24.24%；普通无人和已配对样本不变。不是整局胜率或整体平衡证明。',
 ],
 watch:['手机仍保留原横向候客浏览；本次无整页滚动验收针对桌面和平板窗口。继续观察复杂关系摘要是否增加打开规则的频率，以及恋人补位是否仍有吸引力；普通候客仍可能出现多位恋人，不能用生成包数量推断整局强度。'],
};
export const V833_EN: ChangelogEntry = {
 version:'8.33',date:'2026-09-05',title:'Three offers at a glance',
 summary:'Compare all three desktop offers without nested scrolling; full rules remain one click away.',
 changes:[
  'Remove internal offer scrolling, desktop list scrolling and redundant jump tabs. Tall desktops use three equal-height cards on the right; short desktops and tablets use three columns above the cabin.',
  'Keep identity, trip, fare, tip, power, own agitation, ability summary and work/timer state. Green/red rows show targets and simple effects; complex relationships show targets and counts with complete effects in Details. Ability and relationship text is 14px; category colors and rarity materials remain.',
  'Boarded offers retain current cabin state; selection, undo boarding and independent Details remain. Lover summary explicitly describes one cabin-wide 25% call check, not one roll per Lover.',
  'Successful calls supply exactly one Lover; the other two slots form an interacting non-Lover pair. Keep the cabin-wide 25% roll, normal no-call offers, tutorial packet, base fare 3 and +100% base fare per Lover neighbor. Shop and settlement are unchanged.',
 ],
 experiments:[
  'Forced-muted isolated browser: Chinese/English at 1728×900, 1440×900, 1280×720 and 1024×768. 56 injected offer fixtures cover all 19 active roles, three card/text bounds, no page scrolling and reachable Details. UI fixtures, not games or balance certification.',
  'Before/after: 240000 packets each, three floors × four cabin layouts × 20000. Successful calls now always supply exactly one Lover. One/two unpaired Lovers give identical seeded results; no unpaired Lover means no call. Floor-5 unpaired: 2+ Lover packets 41.36%→15.945%, Lover card share 34.58%→24.24%. No-Lover/paired samples unchanged. Packet statistics, not win rates or complete balance evidence.',
 ],
 watch:['Phones retain existing browsing; no-page-scroll acceptance covers tested desktop/tablet viewports. Watch Details frequency and the appeal of Lover calls. Normal offers may still include multiple Lovers; packet counts do not establish whole-run strength.'],
};
