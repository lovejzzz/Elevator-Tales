import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {PASSENGERS,PASSENGER_ORDER} from '../lib/game-data';
import {BONDS} from '../lib/rider-profile';
const root=resolve(import.meta.dirname,'..'),dir=join(root,'docs/balance-checkpoint-2026-09-03');
type Summary={id:string;mean:number;median:number;p10:number;p90:number;max:number;floors:number[];runs:number;deaths:{power:number;agitation:number;fuse:number;censored:number};firstShopPassed:number;recoveries:number;boarded:Record<string,number>;exposed:Record<string,number>;delivered:Record<string,number>;emptyStepPct:number;meanOccupancy:number};
type Report={id:string;phase:string;context:string;totalGames:number;transitions:number;forecastFailures:number;hashes:Record<string,string>;runnerHash:string;summaries:Summary[]};
const phases=['baseline','screen','specialists','holdout','final','crises','rosters'];
const reports:Report[]=phases.flatMap(p=>readdirSync(join(dir,p)).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(readFileSync(join(dir,p,f),'utf8'))));
const final=reports.find(r=>r.phase==='final'&&r.id==='release')!;assert.ok(final);
for(const r of reports){assert.equal(r.forecastFailures,0);assert.equal(r.summaries.reduce((n,s)=>n+s.runs,0),r.totalGames);assert.ok(r.summaries.every(s=>s.deaths.censored===0));}
for(const r of reports)for(const hash of [...Object.values(r.hashes),r.runnerHash])assert.equal(createHash('sha256').update(readFileSync(join(dir,'sources',hash+'.txt'))).digest('hex'),hash,'evidence snapshot corrupted');
const core=['game-engine.ts','game-data.ts','rider-profile.ts','game-forecast.ts','game-interaction.ts','passenger-presentation.ts'];
const hashes=Object.fromEntries(core.map(f=>[f,createHash('sha256').update(readFileSync(join(root,'lib',f))).digest('hex')]));
for(const r of reports.filter(r=>r.id==='release'))for(const f of core)assert.equal(r.hashes[f],hashes[f],'release source drift: '+f);
const sorted=[...final.summaries].sort((a,b)=>b.mean-a.mean),best=sorted[0];
const contenders=sorted.filter(s=>s.mean>=best.mean*.9);assert.ok(contenders.length>=3);
const mixed=final.summaries.find(s=>s.id==='planning-pairs-6')!,greedy=final.summaries.find(s=>s.id==='greedy-6')!;
assert.ok(greedy.mean<best.mean*.4,'greed should not bypass difficulty');
const probe=JSON.parse(readFileSync(join(dir,'probe-release.json'),'utf8'));
assert.equal(probe.summaries.length,21);assert.ok(probe.summaries.every((s:{positivePct:number})=>s.positivePct>70));
const characterMetrics=PASSENGER_ORDER.map(kind=>{
 const rate=mixed.boarded[kind]/mixed.exposed[kind];assert.ok(rate>=.08&&rate<.9,'character selection extreme: '+kind);
 return{kind,name:PASSENGERS[kind].name,fare:PASSENGERS[kind].fare,energy:PASSENGERS[kind].energy,trip:PASSENGERS[kind].trip,bond:BONDS[kind],offers:mixed.exposed[kind],boarded:mixed.boarded[kind],delivered:mixed.delivered[kind],acceptPct:Math.round(rate*1000)/10};
});
const specialist=reports.find(r=>r.phase==='specialists'&&r.id==='combined')!,reference=specialist.summaries.find(s=>s.id==='planning-pairs-4')!;
const ablations=PASSENGER_ORDER.map(kind=>({kind,banMean:specialist.summaries.find(s=>s.id==='ban-'+kind)!.mean,favorMean:specialist.summaries.find(s=>s.id==='favor-'+kind)!.mean}));
assert.ok(ablations.every(s=>s.banMean>=reference.mean*.75),'one passenger is too indispensable');
const total=reports.reduce((n,r)=>n+r.totalGames,0),normal=reports.filter(r=>r.context==='normal').reduce((n,r)=>n+r.totalGames,0),transitions=reports.reduce((n,r)=>n+r.transitions,0);
const summary={checkpoint:'Elevator Tales v6.7',baselineCommit:'3abf4834ec9dc8fc08b94ec74fcc5c24c91e4cbc',hashes,totalGames:total,normalGames:normal,conditionalGames:total-normal,transitions,forecastFailures:0,contenders:contenders.map(s=>({id:s.id,mean:s.mean})),finalStrategies:sorted,characterMetrics,ablations,phaseTotals:phases.map(phase=>({phase,games:reports.filter(r=>r.phase===phase).reduce((n,r)=>n+r.totalGames,0)})),criteria:{threeStrategiesWithin10Percent:true,greedyBelow40PercentOfBest:true,everyCharacterChosenBetween8And90Percent:true,everyCharacterPositiveInOver70PercentOfSupportedProbeCases:true,noSingleCharacterBanCosts25Percent:true},limits:'Thresholds are practical checkpoint criteria, not proofs of global optimality or human fun. Favor/ban samples are only 60 seeds per policy and exploratory. Probe utility is a diagnostic coin-equivalent estimate. Normal runs mix guided and randomized openings 50/50. Context fixtures are not human win rates. Low-extra-energy strategies remain somewhat favored. The 600-floor simulator cutoff is not a game endpoint; no run reached it.'};
const target=join(dir,'checkpoint.json'),check=process.argv.includes('--check');
if(check)assert.deepEqual(JSON.parse(readFileSync(target,'utf8')),summary);else{assert.ok(!existsSync(target));writeFileSync(target,JSON.stringify(summary,null,2));}
const labels:Record<string,string>={'zero-extra-6':'低额外耗电','planning-pairs-6':'混合配对','planning-pairs-4':'四人配对','support-stack-music':'音乐家控场','support-stack-nurse':'护士控场','contract-lookahead':'契约前瞻','sparse-planner':'稀疏载客','greedy-6':'贪心满载','balanced-3':'简单三人','no-upgrades':'不买升级'};
const text=`# Elevator Tales — 平衡 checkpoint v6.7

基线已冻结为 checkpoint/elevator-v66-baseline-20260903。最终代码、数值、随机种子和结果保存于本目录及对应版本记录。

## 结论

可以冻结为下一轮真人试玩基线。不是“完美平衡”的证明：低额外耗电仍略强，但多种控场/配对路线在同一数量级；没有发现无视取舍的固定单人流。

## 仅采用两项调整

- 儿童：基础车费 5→7，路程 3–7→2–5 站。无人照顾时的偶数层躁动 +1（高躁动 +2）保留；恋人、音乐家、护士的邻座照护仍重要。
- 检查员：偶数层检查改为稳压与节能抵消之后的额外耗电。清零则 +1 金币，否则原有躁动惩罚；基础行驶 1 电不参与检查。因此维修工在 6、12… 层确实可能帮他通过检查，驱魔组合/稳压也可提供支持。

没有提高全体车费，没有削弱所有强角色，没有改初始20/容量24、每10层商店、价格、波次压力或无尽模式。

## 测试规模

${normal.toLocaleString('en-US')} 局正常开局完整模拟，另 ${total-normal} 局条件残局，总计 ${total.toLocaleString('en-US')} 局、${transitions.toLocaleString('en-US')} 次楼层结算，预报偏差 0。21 个角色另做两版共 172,032 条受控轨迹比较，不计入完整游戏局数。

正常模拟一半使用引导开局、一半随机候客。条件残局分别是41层缺钱、41层高躁动、81层带升级局面，不代表它们在真实游戏中的发生率。

| 阶段 | 完整模拟数 |
| --- | ---: |
${summary.phaseTotals.map(p=>'| '+p.phase+' | '+p.games+' |').join('\n')}

## 最终独立种子：每种策略 250 局

| 策略 | 平均结束层 | 中位数 | 第10百分位 | 第90百分位 | 断电 / 躁动 / 引信失败 |
| --- | ---: | ---: | ---: | ---: | --- |
${sorted.map(s=>'| '+(labels[s.id]??s.id)+' | '+s.mean+' | '+s.median+' | '+s.p10+' | '+s.p90+' | '+s.deaths.power+' / '+s.deaths.agitation+' / '+s.deaths.fuse+' |').join('\n')}

这些是策略程序的结果，不是人类玩家应达到的楼层。${contenders.length} 种策略距离最佳均值在10%以内；贪心满载明显较差，难度没有被普遍放松。

## 单一阵容与困境复测

另外每种阵容用150局独立种子检验：从10层起只接音乐家/护士，平均结束于59.53层；只接恋人55.29层；只接小偷35.53层。相同测试中，混合配对116.60层、低额外耗电119.20层。单一阵容限制从10层开始，之前正常接客；这些结果不能代表所有可能的同类阵容策略。

条件残局每策略100局：41层缺钱时，稀疏载客84.41层、低耗电83.54层；41层高躁动时，低耗电86.80层、音乐家86.51层；81层带升级时，各路线平均结束于103.30–104.69层。数字为最终绝对楼层，不是多活了多少层；小差异不作为显著优劣依据。

## 21个人物逐项检查

下表是最终“混合配对”策略的选择情况。选择率按实际遇见候客计算；送达数受到局末失败和请离影响，不能作为该人物的因果胜率。动态角色的基价/耗电会变化，表格只列本体；神秘人的0为隐藏占位，实际封存8–40。

| 人物 | 基础车费 | 额外电/站 | 路程 | 被选择率 | 上车 / 送达 |
| --- | ---: | ---: | --- | ---: | --- |
${characterMetrics.map(s=>'| '+s.name+' | '+s.fare+' | '+s.energy+' | '+s.trip.join('–')+' | '+s.acceptPct+'% | '+s.boarded+' / '+s.delivered+' |').join('\n')}

偏爱/禁用对照为每人物每策略60局，结果见 specialists/combined-normal.json。它们用于发现异常，不用于宣称细微差异有统计显著性。禁用快递员、护士等会付出代价，但并不会让其他路线完全失效；百变人等风险角色并非每一局都值得接。

## 人物相互制约

- 支持关系与相邻/隔开对照保持相同人物、初始随机种子，观察送达收益、实际电量、躁动及引信；包含有无稳压/契约、有无额外用电、高低躁动。
- 受控轨迹使用100电/容量100、躁动上限100来隔离人物效果。诊断效用=金币差+电量差×3−躁动差×2−失败惩罚100，不是游戏内奖励或真实胜率；每人物512组支持场景，不代表每种任意阵容都值得接。
- “冲突”不保证经济上一定亏钱。例如教练与名人可能用更多金币换更多躁动，这本身是取舍，不应一律消除。
- 复制人、神秘人、百变人继续覆盖隐藏值、复制来源、动态关系；规划程序不读取真实隐藏车费或未来候客。
- 回归包括52,920组定向关系用例、48,000次随机状态结算、768组检查员/维修/驱魔/稳压/节能交叉用例，以及32组基本检查、小费倍率和教练例外。预测、实际结算和说明保持一致。

## 可复核性与局限

完整游戏报告保存种子、执行器哈希、实际核心源码哈希；sources/保存执行时文本。受控轨迹报告保存核心源码哈希，种子与算法见 scripts/probe-checkpoint.ts。最终 release 报告与当前代码哈希一致。experiments/v66 保存未改动基线；历史 v6.5/v6.6 报告不改写。

运行 npx tsx scripts/summarize-checkpoint.ts --check 可只读复核报告总数、验收条件、源码快照及当前规则一致性，不重新运行游戏或覆盖证据。

验收阈值是本轮工程取舍：至少三路线在最优10%内；没有极端全选/全弃人物；没有单角色禁用造成25%以上断崖；贪心不能绕过难度；功能回归零偏差。有限策略、有限种子不能证明不存在更强打法。策略会因决策导致后续候客/随机调用分叉，相同种子不等于每一步牌面相同。

程序还不能证明主观“上瘾”。下一步应拿这个冻结版本真人试玩，重点观察低耗电路线是否过于省心、百变人的风险是否值得，以及儿童/检查员的新取舍是否直观。本轮不修改美术与布局，未增加新的浏览器视觉测试。
`;
if(check)assert.equal(readFileSync(join(dir,'README.md'),'utf8'),text);else writeFileSync(join(dir,'README.md'),text);
console.log(JSON.stringify({normalGames:normal,conditionalGames:total-normal,totalGames:total,transitions,contenders:summary.contenders,characters:characterMetrics.map(s=>({kind:s.kind,accept:s.acceptPct})),criteria:summary.criteria}));
