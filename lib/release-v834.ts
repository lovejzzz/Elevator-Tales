import type {ChangelogEntry} from './changelog';
export const V834_ZH:ChangelogEntry={
 version:'8.34',date:'2026-09-05',title:'先看电量，再做投资',
 summary:'商店顶部固定显示剩余电量与金币，滚动选购时也不会丢失关键资源。',
 changes:['剩余电量移到商店左上，与金币并列；当前电量48px，窄屏/矮窗36px，上限20px/18px。两项资源独立于商品滚动区，充电、消费和容量变化直接反映当前状态。','电量耗尽时电量卡改为暖红色，仍保留明确数字；未更改充电2币/电、抵达最多补5电、商店价格或人物参数。'],
 experiments:['强制静音浏览器完成12个商店夹具：中文/英文×1440×900、390×844、320×740×26电/0电。检查电量与上限可见、数字至少36px、真实充电+1且金币−2，以及滚动商品后顶部位置不变。不是对局或平衡实验。'],
 watch:['继续观察固定资源栏在极矮窗口中占用的空间；充电区的下个商店电量仍是运转参考，不包含人物耗电。'],
};
export const V834_EN:ChangelogEntry={
 version:'8.34',date:'2026-09-05',title:'Power before purchases',
 summary:'Keep remaining power and coins visible at the top of the shop while browsing purchases.',
 changes:['Power moves to the upper left beside coins: current value48px,36px on narrow/short windows; capacity20px/18px. Both stay outside the scrolling purchase list and reflect current charge, spending and capacity immediately.','Depleted power uses a warm red card without hiding the exact value. Charging2 coins/power, entry charge up to5, shop prices and rider values are unchanged.'],
 experiments:['12 forced-muted injected shop fixtures: Chinese/English ×1440×900,390×844,320×740 ×26/0 power. Verify visible power/capacity, minimum36px value, real+1 charging/−2 coins and unchanged header position after scrolling. Not games or balance experiments.'],
 watch:['Watch fixed-header space on extremely short screens. The next-shop power reference still covers the motor only, not rider costs.'],
};
