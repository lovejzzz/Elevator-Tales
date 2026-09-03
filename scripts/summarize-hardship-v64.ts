import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';

type Exposure={steps:number;danger:number;stressRatio:number;rescues?:number};
type Summary={id:string;runs:number;mean:number;p10:number;p90:number;floors:number[];shopVisits:number;firstShopPassed:number;steps:number;deaths:Record<string,number>;purchases:Record<string,number>;hardship:{tightShops:number;cannotFullyCharge:number;decisionRescues:number;nearDeathEntries:number;firstDanger:number[];recoveries:number;gamesRecovered:number;highStressSteps:number;segment:Record<string,Exposure>;stage:Record<string,Exposure>;failureProbes?:Array<{floor:number;tested:number;oneAction:boolean;twoActions:boolean;truncated:boolean}>}};
type Report={id:string;phase:string;context:string;seedBase:number;totalGames:number;transitions:number;forecastFailures:number;variant:Record<string,number>;hashes:Record<string,string>;summaries:Summary[]};
const root=resolve(import.meta.dirname,'..'),dir=join(root,'docs/hardship-v64-2026-09-03');
const groups=['screen','broad','holdout','stress','exploit-check/holdout'];
const reports=groups.flatMap(group=>readdirSync(join(dir,group)).filter(f=>f.endsWith('.json')).map(f=>({path:group+'/'+f,...JSON.parse(readFileSync(join(dir,group,f),'utf8')) as Report})));
const old=reports.find(r=>r.path==='holdout/baseline.json')!,current=reports.find(r=>r.path==='holdout/release.json')!;
assert.ok(old&&current);
for(const file of ['game-engine','game-forecast','game-data','game-interaction','rider-profile','metric-feedback'])assert.equal(createHash('sha256').update(readFileSync(join(root,'lib',file+'.ts'))).digest('hex'),current.hashes['lib/'+file+'.ts'],'Unverified gameplay module: '+file);
const round=(n:number)=>Math.round(n*100)/100;
const mean=(xs:number[])=>xs.length?round(xs.reduce((s,n)=>s+n,0)/xs.length):null;
const stats=(s:Summary)=>({mean:s.mean,p10:s.p10,p90:s.p90,firstDangerMean:mean(s.hardship.firstDanger),everDangerPct:round(s.hardship.firstDanger.length/s.runs*100),recoveriesPerGame:round(s.hardship.recoveries/s.runs),gamesRecoveredPct:round(s.hardship.gamesRecovered/s.runs*100),tightShopPct:round(s.hardship.tightShops/s.shopVisits*100),cannotFullyChargePct:round(s.hardship.cannotFullyCharge/s.shopVisits*100),firstShopPassedPct:round(s.firstShopPassed/s.runs*100),reach20Pct:round(s.floors.filter(f=>f>=20).length/s.runs*100),reach50Pct:round(s.floors.filter(f=>f>=50).length/s.runs*100),decisionRescues:s.hardship.decisionRescues,decisionRescuesPer100Floors:round(s.hardship.decisionRescues/s.steps*100),highStressPct:round(s.hardship.highStressSteps/s.steps*100),deaths:s.deaths});
function interval(a:number[],b:number[]){
 assert.equal(a.length,b.length);let seed=97613431;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const d=a.map((n,i)=>n-b[i]),samples=Array.from({length:2000},()=>{let sum=0;for(let i=0;i<d.length;i++)sum+=d[Math.floor(rng()*d.length)];return sum/d.length;}).sort((a,b)=>a-b);
 return {mean:mean(d),bootstrap95:[round(samples[50]),round(samples[1949])]};
}
const comparison=current.summaries.map(s=>{const before=old.summaries.find(x=>x.id===s.id)!;return {id:s.id,runs:s.runs,before:stats(before),after:stats(s),floorDifference:interval(s.floors,before.floors)};});
const aggregate=(rs:Report[])=>({games:rs.reduce((n,r)=>n+r.totalGames,0),transitions:rs.reduce((n,r)=>n+r.transitions,0),forecastFailures:rs.reduce((n,r)=>n+r.forecastFailures,0),deaths:rs.flatMap(r=>r.summaries).reduce((all,s)=>{for(const [key,value]of Object.entries(s.deaths))all[key]=(all[key]??0)+value;return all;},{} as Record<string,number>)});
const normal=aggregate(reports.filter(r=>r.context==='normal')),scenarios=aggregate(reports.filter(r=>r.context!=='normal'));
assert.equal(normal.games,33600);assert.equal(scenarios.games,2880);assert.equal(normal.forecastFailures+scenarios.forecastFailures,0);assert.equal((normal.deaths.censored??0)+(scenarios.deaths.censored??0),0);
const exploit=reports.filter(r=>r.path.startsWith('exploit-check')).map(r=>({id:r.id,games:r.totalGames,policies:r.summaries.map(s=>({id:s.id,...stats(s)}))}));
const conditional=reports.filter(r=>r.context!=='normal').map(r=>({id:r.id,context:r.context,games:r.totalGames,policies:r.summaries.map(s=>({id:s.id,...stats(s)}))}));
const probes=current.summaries.flatMap(s=>(s.hardship.failureProbes??[]).map(p=>({policy:s.id,...p}))),probeSummary={cases:probes.length,zeroOrOneActionEscapes:probes.filter(p=>p.oneAction).length,twoActionEscapes:probes.filter(p=>p.twoActions).length,truncated:probes.filter(p=>p.truncated).length};
const result={normal,scenarios,comparison,exploit,conditional,probeSummary,probes,exposure:current.summaries.map(s=>({id:s.id,bySegment:s.hardship.segment,byStage:s.hardship.stage}))};
writeFileSync(join(dir,'analysis.json'),JSON.stringify(result,null,2)+'\n');
writeFileSync(join(dir,'reproduction.json'),JSON.stringify(reports.map(r=>({path:r.path,phase:r.phase,id:r.id,context:r.context,seedBase:r.seedBase,runs:r.summaries[0].runs,policies:r.summaries.map(s=>s.id),variant:r.variant,hashes:r.hashes})),null,2)+'\n');
const labels=[['偏收入、满载倾向','greedy-6'],['普通三人运营','balanced-3'],['协作规划、最多四人','contract-lookahead'],['协作规划、最多六人','contract-lookahead-6'],['双人组合搜索、最多六人','wave-pair-6']];
const table=labels.map(([label,id])=>{const c=comparison.find(c=>c.id===id)!;return `| ${label} | ${c.before.mean} → ${c.after.mean} | ${c.before.firstDangerMean} → ${c.after.firstDangerMean} | ${c.after.gamesRecoveredPct}% |`;}).join('\n');
const planner=comparison.find(c=>c.id==='contract-lookahead')!;
writeFileSync(join(dir,'README.md'),`# Elevator Tales v6.4：艰难取舍与十层压力节奏

日期：2026-09-03。对照为公开 v6.3，提交 aa038d30aca528c23bad48110a5e817339ba6993。本次目标是更早遇到可以应对的困难，而非单纯提高平均结束层数。

## 发布规则

- 保留初始20电／容量24、每层基础耗2电、全部21位人物参数及关系、协作契约、请离、换位、升级和休整规则。
- 第一段1–10层没有班次压力。之后每段尾数1–3为准备期，4–6额外躁动+1／站，7–9为高压三层、额外+5／站，整十层补给撤去时段加压，但不会自动恢复或清零躁动。
- 51层开始叠加基础压力+1，此后每40层再+1。固定公开曲线，不根据玩家金币、强度或输赢动态调整。
- 空车且尚有休整次数，依旧免除本层班次压力；送达才恢复休整，最多3次。
- 充电2→3金币／电。升级价格与人物奖励不变；常驻充电不受抽卡影响，可按1电购买，也可以选择少充。
- 电梯顶部提前写出高压楼层与压力；当前高压显示剩余站数。预报、结算明细、手册、商店费用和禁用条件均与实际规则一致。

## 实验规模

1. 8组配置×12策略×40局，加3组更强高压×12策略×60局：6,000局初筛。
2. 对照、峰值4、峰值5三组×95策略×40局：11,400局广泛检查。
3. 三组×20策略×250个新种子：15,000局复验。
4. 针对性空车避峰检查：两组×4策略×150局：1,200局。

合计 **${normal.games.toLocaleString('en-US')}局完整模拟**，另有 **${scenarios.games.toLocaleString('en-US')}条条件流程**（缺钱、高躁动、后期已装升级，分别两组×6策略×80局）。共${(normal.transitions+scenarios.transitions).toLocaleString('en-US')}次楼层结算，预报错误0，达到600层测试保护线0。游戏无终点；600仅为模拟保护线。

初筛和广泛检查共用种子。复验使用新种子；空车检查复用了复验前150个种子，故不将所有局数称作相互独立样本。同策略两边使用相同合法操作能力与按楼层分开的随机流；玩家决策仍可影响乘客召唤。策略看不到未来报价或神秘人的隐藏车费。历史生成源码按哈希保存在各 generated-sources 目录，精确配置在 reproduction.json；六个发布核心模块与 release 复验源码逐字一致。

## 独立复验结果

每策略每组250局，均成功通过第一座补给站。这是程序策略，不代表新手通关率。首次高躁动指结算后达到耐心加倍阈值；均值只包含出现过该状态的局。

| 策略 | 平均结束层：旧→新 | 首次高躁动：旧→新 | 新版至少恢复过一次 |
| --- | ---: | ---: | ---: |
${table}

四人协作规划策略中，计划充电后无力再买最便宜未购卡的商店占比从${planner.before.tightShopPct}%增至${planner.after.tightShopPct}%；至少一次从高躁动降回半上限以下的局数占${planner.after.gamesRecoveredPct}%。这是资源取舍和恢复机会的代理指标，不等于主观上一定好玩。

为什么未选择充电4金币：它显著打击低载客收入，却没有同样增加强组合策略的挑战。为什么选高压5而非4：新种子复验中，4人规划的首次高躁动在峰值4时约60层，峰值5约36层，后者更贴近早期就需要认真应对的目标。

## 危机、对策与漏洞检查

- 记录进入决策时预报存在失控风险、操作后预报不再失控且本层存活的次数。它证明实际有应对窗口；并非证明原布局在所有随机结果下一定会死，也不是全局最优解检测。
- 复验首12局中发生于行驶结算的死亡，用当时可见候选做至多两步合法安排／请离搜索，每状态用5个独立随机样本检查能否活过下一层，最多900状态。共${probeSummary.cases}例，至多一步找到${probeSummary.zeroOrOneActionEscapes}例，两步找到${probeSummary.twoActionEscapes}例，搜索截断${probeSummary.truncated}例。找不到不代表此前几层已经无解；此搜索不含未来候选，也不覆盖购物错误。
- 明确的单元场景：高压前重新连接即将到站的恋人，一次换位将必败局变为存活；满载高压时付费请离两人也能救场。没有隐藏救命、免费赔偿或动态保底。
- 专门针对每次高压空车休整的策略进行了150局／组检查。新版两种避峰路线平均98.97／99.17层，动态双人组合107.71层；避峰策略约85.5%／87.2%的商店不足以兼顾计划充电和最便宜卡，并分别出现17／15次缺电死亡。它是可行的保守路线，不是被证明劣于所有打法；其重复性仍值得真人试玩观察。
- 缺钱、高躁动、后期升级场景是固定条件，不是自然出现概率。后期场景预装3级舒缓，禁止继续购买不代表全程未用舒缓。

## 边界与下一步

难度节奏更早、恢复过程更多，策略水平差异仍明显。但大多数正常策略最终仍因躁动失败，不能宣称资源之间已完全平衡。高压三层是否过于机械、低收入路线是否挫败、固定空车避峰是否太重复，需要真人试玩。程序模拟不能证明“像 Darkest Dungeon 一样有压迫感”，也不能证明不存在统治策略。多策略比较的区间仅为描述性，未做多重比较校正。

测试保留原有122,880个布局回归和90,000个契约随机检查，并新增56,000个时段边界、40,000个新旧人物结算一致性检查。旧回归仅调整了本次有意改变的班次压力和充电费预期；人物收益、引信、耐心、复制、关系和休整规则继续检查。
`);
console.log(JSON.stringify({normal,scenarios,probeSummary,selected:comparison.filter(c=>labels.some(([,id])=>id===c.id))},null,2));
