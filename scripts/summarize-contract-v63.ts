import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
type Summary={id:string;runs:number;mean:number;floors:number[];purchases:Record<string,number>;gamesWithCalm:number;gamesWithContract:number;deaths:Record<string,number>;pressureSources:Record<string,number>};
type Report={id:string;phase:string;context:string;seedBase:number;hashes:Record<string,string>;relief:number;contractBasePrice?:number;totalGames:number;transitions:number;forecastFailures:number;summaries:Summary[]};
const root=resolve(import.meta.dirname,'..'),dir=join(root,'docs/contract-v63-2026-09-03');
const reports:Report[]=['screen','broad','holdout','stress'].flatMap(phase=>readdirSync(join(dir,phase)).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(readFileSync(join(dir,phase,f),'utf8'))));
const get=(phase:string,id:string,context='normal')=>{const r=reports.find(r=>r.phase===phase&&r.id===id&&r.context===context);assert.ok(r);return r;};
const baseline=get('holdout','baseline'),current=get('holdout','relief3Price60'),cheap=get('holdout','relief3');
for(const file of ['game-engine','game-forecast','game-data','rider-profile','game-interaction','metric-feedback'])assert.equal(createHash('sha256').update(readFileSync(join(root,'lib',file+'.ts'))).digest('hex'),current.hashes['lib/'+file+'.ts'],'Actual gameplay module differs from selected candidate: '+file);
const round=(n:number)=>Math.round(n*100)/100;
function compare(a:number[],b:number[]){
 assert.equal(a.length,b.length);const n=a.length,d=a.map((v,i)=>v-b[i]);let seed=96641203;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const samples=Array.from({length:2000},()=>{let sum=0;for(let i=0;i<n;i++)sum+=d[Math.floor(random()*n)];return sum/n;}).sort((a,b)=>a-b);
 return {n,delta:round(d.reduce((s,v)=>s+v,0)/n),bootstrap95:[round(samples[50]),round(samples[1949])],winPct:round(d.filter(v=>v>0).length/n*100),tiePct:round(d.filter(v=>v===0).length/n*100)};
}
const effects=current.summaries.map(s=>{const old=baseline.summaries.find(b=>b.id===s.id)!;return {id:s.id,before:old.mean,after:s.mean,...compare(s.floors,old.floors),oldCalmPerGame:round((old.purchases.calm??0)/old.runs),calmPerGame:round((s.purchases.calm??0)/s.runs),contractPerGame:round((s.purchases.battery??0)/s.runs),gamesWithCalm:s.gamesWithCalm};});
const leader=[...current.summaries].sort((a,b)=>b.mean-a.mean)[0];
const priceEffects=current.summaries.map(s=>({id:s.id,...compare(s.floors,cheap.summaries.find(b=>b.id===s.id)!.floors)}));
const scenarios=['cash-poor','agitated','late-build'].map(context=>{const old=get('stress','baseline',context),now=get('stress','relief3Price60',context);return {context,effects:now.summaries.map(s=>({id:s.id,before:old.summaries.find(b=>b.id===s.id)!.mean,after:s.mean,...compare(s.floors,old.summaries.find(b=>b.id===s.id)!.floors)}))};});
const result={normalGames:reports.filter(r=>r.context==='normal').reduce((s,r)=>s+r.totalGames,0),scenarioRuns:reports.filter(r=>r.context!=='normal').reduce((s,r)=>s+r.totalGames,0),transitions:reports.reduce((s,r)=>s+r.transitions,0),forecastFailures:reports.reduce((s,r)=>s+r.forecastFailures,0),censored:reports.reduce((s,r)=>s+r.summaries.reduce((n,p)=>n+p.deaths.censored,0),0),effects,priceEffects,scenarios,leader:leader.id,leaderComparisons:current.summaries.filter(s=>s.id!==leader.id).map(s=>({id:s.id,...compare(s.floors,leader.floors)}))};
assert.equal(result.normalGames,36800);assert.equal(result.scenarioRuns,4320);assert.equal(result.forecastFailures,0);assert.equal(result.censored,0);
writeFileSync(join(dir,'analysis.json'),JSON.stringify(result,null,2)+'\n');
writeFileSync(join(dir,'reproduction.json'),JSON.stringify(reports.map(r=>({phase:r.phase,id:r.id,context:r.context,relief:r.relief,contractBasePrice:r.contractBasePrice??45,seedBase:r.seedBase,runs:r.summaries[0].runs,policies:r.summaries.map(s=>s.id),hashes:r.hashes})),null,2)+'\n');
const labels=[['協作规划＋混合升级','contract-lookahead'],['協作规划，不买舒缓','contract-lookahead-no-calm'],['最多四人，混合升级','contract-mixed-4'],['最多六人，不买舒缓','contract-no-calm-6'],['恋人组合，混合升级','contract-lovers-mixed'],['警察／小偷组合，混合升级','contract-police-mixed'],['偏好安抚角色，混合升级','contract-calming-mixed'],['只买舒缓系统','cautious-calm']];
const table=labels.map(([name,id])=>{const s=effects.find(s=>s.id===id)!;return `| ${name} | ${s.before} | ${s.after} | +${s.delta} | ${s.bootstrap95.join(' ～ ')} |`;}).join('\n');
const main=effects.find(s=>s.id==='contract-lookahead')!;
writeFileSync(join(dir,'README.md'),`# Elevator Tales v6.3：协作送达与舒缓卡依赖

日期：2026-09-03。比较基线为公开 v6.2（50a0da204bcb2ba359ac349e70318ab3d146ff07）。候选发布规则见下；不是宣称已证明全局平衡。

## 采用的机制

默契契约保留每级协作到站再 +2 金币，新增：**本层至少有一名乘客到站，且结算时仍与自己的协作对象相邻，全车额外 −3 躁动；每层最多一次。** 多人同时到站、多个邻座和多级契约都不叠加此舒缓。普通到站的每人 −1 躁动仍单独计算。

请离、撤回、失去耐心离开均不触发。买卡本身不立即舒缓，因此它不能像舒缓系统一样救当前躁动危机。若醉汉换位会改变是否协作，预报显示可能范围；幽灵延误、同层到站、随机关系也参与检查。基础价45→60，楼层涨价和重复安装涨价规则不变。其他人物参数、4人免拥挤、20／24电量全部保留。

人物卡片正面直接写明谁到站、需要谁在旁边、金币奖励、额外躁动 −3，以及全车每层一次的限制。商店和已装清单明确重复购买只增加金币奖励、不强化舒缓。沿用真实数值变化、舒缓音效及明细反馈。

## 实验规模

- 6组机制／价格 × 12策略 × 80局 = 5,760局筛查。
- 3组机制 × 92策略 × 40局 = 11,040局广泛检查。
- 4组规则 × 20策略 × 250个新种子 = 20,000局独立复验。
- 合计 **36,800局从第一层开始的完整模拟**。
- 另有 **4,320条条件流程**：缺钱、已有高躁动、后期已装升级三种固定初始场景，3组规则 × 6策略 × 80个种子；不把它们当作自然发生概率或完整开局。
- 总计 ${result.transitions.toLocaleString('en-US')} 次真实楼层结算，预报错误0，达到600层测试保护线的局数0。600不是游戏终点。
- 另做90,000次全人物随机结算检查，其中17,859次未装契约的检查确认：除契约价格变化外，结算与旧版一致。继续运行原有122,880个人数／重复安抚场景、12,000个旧回归随机场景和音频调度检查。

筛查与广泛检查共享种子，不伪称彼此独立；独立复验使用另一批新种子。全部使用真实引擎和合法购买／接客／请离／换位；隐藏车费不提供给规划器。增加只买一张契约、禁止买舒缓、优先多次买契约、双人联合安排和三站前瞻等策略；同策略比较两边行为能力相同。生成源码按内容哈希完整保存在 generated-sources/，配置见 reproduction.json。拟发布的六个核心游戏模块与选定复验模块逐字一致。

## 独立复验：最终规则对旧版

每行每组250局。指标为平均结束楼层，不是人类玩家胜率。

| 策略 | 旧版 | 新版（−3、60金币） | 差值 | 描述性配对95%区间 |
| --- | ---: | ---: | ---: | --- |
${table}

协作规划＋混合升级平均购买舒缓卡从 ${main.oldCalmPerGame} 次降至 ${main.calmPerGame} 次，同时层数从 ${main.before} 升至 ${main.after}。这支持“协作能够承担部分生存职责”，但不是“已经不需要舒缓”：独立复验中混合升级仍领先不买舒缓路线。

## 为什么选这个强度和价格

减1收益偏弱，减2有改善，减3让协作规划和多类组合的提升更清楚，并保留每层一次的硬上限。45、60、75基础价均做了筛查，45和60另做独立复验。60是保留收益同时增加早期投资取舍的设计选择，不是统计上证明的最优价。旧购买评分仍只把契约估为赚钱卡，因此高价会让某些旧程序不再购买；不能把这种启发式失灵当作真人不愿买的证据。

缺钱场景中，简单优先契约打法仍可能不如只买舒缓，前瞻策略则更能利用契约；这张卡需要实际完成协作，不能凭购买保证存活。后期场景初始已经含3级舒缓，禁止继续买舒缓不等于这类场景全程没有舒缓。详见 analysis.json。

## 尚未解决与边界

这不是平衡终点。混合升级仍是平均表现最好的策略类；契约是否会成为高手必选仍需真人试玩和更强规划器验证。没有证明全局不存在最优打法，也没有用平均层数代替主观趣味。多策略、多参数比较的区间仅为描述性，未做多重比较校正；筛查后挑选策略仍存在选择偏差。炸弹策略会主动拒载明显来不及送达的角色，不能据此低估真人风险。

## 复现

scripts/audit-contract-v63.ts 接收阶段、每策略局数、配置列表、策略列表和初始场景；精确参数见 reproduction.json。用新的 ELEVATOR_AUDIT_OUTPUT 路径运行，避免覆盖旧报告。npm run verify 包含 v6.3 的送达、换位、一次性上限及全人物随机回归。
`);
console.log(JSON.stringify({...result,effects:result.effects,leaderComparisons:undefined},null,2));
