import type {ChangelogEntry} from './changelog';
export const V836_ZH:ChangelogEntry={
 version:'8.36',date:'2026-09-06',title:'短途也有取舍',
 summary:'31层起每批一位短途候客：较快下车，较低基价；组合奖励保留。当前为本地实玩候选，尚未公开。',
 changes:[
  '31层起，每批轮换一位候客，行程缩至人物正常最短值；另两位照常。只有实际缩短时，基价按短途/原抽取行程比例向上取整。比例在生成时固定，延误与换位不重算；快速升级随后生效，不额外减价。',
  '卡面显示短途基价，游客公式使用卡面数值。倍率按调整后的基价计算；邻座奖励、小费、暂存、达标奖励不打折。复制车费时先取上方人物的调整后基价，再应用复制人自己的短途比例；神秘人物仍不提前揭晓。',
  '公开v8.35价格不变：默契30、扩容35、舒缓35、礼宾40、稳压45、快速45、小费盒30、并联30、共乘40、计价器25。充电2币/电；每店一项、已选不再出现。运转、躁动与角色出场风险不变，不按玩家资源救场。',
  '游客明确关门时躁动；幽灵明确未受控时在3的倍数层随机延误一位邻座1站。选中人物时提示旧乘客换位已用，英文按钮简化为Ascend。',
 ],
 experiments:[
  '本轮84次执行：48开发、32新种子复核、4个特选历史反例重测。全部逐步回放。累计496次合成整局执行与64次条件续局分开统计，含重复对照，不是独立玩家样本。',
  '新种子复核按普通/引导开局和两种固定策略分组：共同30–59层拒载143→128；升级34→35项。超过60层4/16→5/16，候选最高77，旧规则最高124；不是人类成功率，也没有证明所有策略等强。',
  '免费短途曾两次160层仍存活，366/653金币；加一站也曾127层。新方案四个历史反例重测终止于80/51/68/98层。终局80层仍有137币、98层106币，不能把终止等同于经济循环已经解决。',
  '旧免费短途版本静音浏览器在120层停止观察时仍可修复，190金币。该反例保留，不算新方案实玩。新方案完整静音浏览器验收尚待完成，暂不公开。',
 ],
 watch:['检查卡面、游客和复制人说明、短途与长途选择、投资感和后期现金。少拒载不代表每次拒载都被迫；已知安全单卡也可能被策略放弃。']
};
export const V836_EN:ChangelogEntry={
 version:'8.36',date:'2026-09-06',title:'Local trips, real tradeoffs',
 summary:'From31, one local offer trades a shorter trip for lower base fare while preserving combination rewards. Local playtest candidate, not published.',
 changes:[
  'From31 one rotating offer is capped at its role minimum; other two roll normally. Only actual shortening scales base fare by short/original rolled trip, rounded up. Ratio is fixed on generation; delays and moves do not reroll it. Express applies afterward without another fare reduction.',
  'Cards label Local fare; Tourist formulas use the displayed base. Multipliers use that adjusted base; additive neighbor rewards, tips, stashes and accomplishments are intact. Mimic copies the source adjusted base, then applies its own ticket ratio. Mystery fares stay sealed.',
  'Public v8.35 prices retained: battery30, capacity35, calm35, concierge40, reinforced45, express45, tipjar30, relay30, crowd40, meter25. Charge2/ power; one ability per shop, owned abilities excluded. Motor, agitation and offer risk unchanged; no resource-adaptive rescue.',
  'Copy exposes Tourist door-close agitation, uncontrolled Ghost delay cadence, and used old-rider move allowance. Shorter Ascend label.',
 ],
 experiments:[
  'This iteration:84 executions—48 development,32 fresh confirmation,4 selected historical challenges—all step-replayed. Cumulative496 whole-run synthetic executions and64 conditional continuations are separate counts, including repeated controls, not independent player samples.',
  'Fresh confirmation stratifies ordinary/guided openings and two fixed policies. Common30–59 skips143→128; upgrades34→35. Above60:4/16→5/16; candidate maximum77, control124. Not human probabilities or universal strategy parity.',
  'Free local trips previously censored at160 twice with366/653coins; minimum+1 reached127. Four selected ticket retests end80/51/68/98. Deaths at80 and98 still hold137/106coins: termination alone does not establish a solved economic loop.',
  'Earlier free-local muted browser sample was repairable at120 with190coins. Retained counterexample, not a ticket playtest. Complete muted browser acceptance for this candidate is pending; publication held.',
 ],
 watch:['Inspect card readability, Tourist/Mimic explanations, local versus long-trip decisions, investment and late cash. Refusal behavior is not proof of forced rejection; policies sometimes decline known safe single-card placements.']
};
