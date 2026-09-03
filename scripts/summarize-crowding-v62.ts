import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root=resolve(import.meta.dirname,'..'),dir=join(root,'docs/crowding-v62-2026-09-03');
type Summary={id:string;mean:number;floors:number[];deaths:Record<string,number>;duplicateCalmerSteps:number;maxMusicians:number;maxNurses:number;steps:number;purchases:Record<string,number>};
type Report={id:string;phase:string;workspace:string;params:unknown;seedBase:number;engineHash:string;profileHash:string;runnerHash:string;totalGames:number;transitions:number;forecastFailures:number;summaries:Summary[]};
const reports:Report[]=['baseline','screen','holdout'].flatMap(phase=>readdirSync(join(dir,phase)).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(readFileSync(join(dir,phase,f),'utf8'))));
const current=reports.find(r=>r.phase==='holdout'&&r.id==='crowdFrom5')!,baseline=reports.find(r=>r.phase==='holdout'&&r.id==='baseline')!;
assert.ok(current&&baseline);
const round=(n:number)=>Math.round(n*100)/100;
function compare(a:number[],b:number[]){
  assert.equal(a.length,b.length);
  const delta=a.map((v,i)=>v-b[i]),n=delta.length;
  let seed=91933271;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const samples=Array.from({length:2000},()=>{let sum=0;for(let i=0;i<n;i++)sum+=delta[Math.floor(random()*n)];return sum/n;}).sort((x,y)=>x-y);
  return {n,delta:round(delta.reduce((s,v)=>s+v,0)/n),bootstrap95:[round(samples[50]),round(samples[1949])],winPct:round(delta.filter(v=>v>0).length/n*100),tiePct:round(delta.filter(v=>v===0).length/n*100)};
}
const effects=current.summaries.map(s=>{const b=baseline.summaries.find(b=>b.id===s.id)!;return {id:s.id,oldMean:b.mean,newMean:s.mean,...compare(s.floors,b.floors)};});
const leader=[...current.summaries].sort((a,b)=>b.mean-a.mean)[0];
const competitors=current.summaries.filter(s=>s.id!==leader.id).map(s=>({id:s.id,...compare(s.floors,leader.floors)}));
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const archive=join(dir,'generated-sources');mkdirSync(archive,{recursive:true});
for(const r of reports)for(const [file,hash] of [['lib/game-engine.ts',r.engineHash],['lib/rider-profile.ts',r.profileHash],['scripts/run.ts',r.runnerHash]]){
  const source=readFileSync(join(r.workspace,file),'utf8');assert.equal(sha(source),hash);writeFileSync(join(archive,hash+'.txt'),source);
}
assert.equal(sha(readFileSync(join(root,'lib/game-engine.ts'),'utf8')),current.engineHash,'Ship precisely the engine tested');
const fixtures=JSON.parse(execFileSync(process.execPath,[join(root,'node_modules/tsx/dist/cli.mjs'),'scripts/verify-v62.ts'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','inherit']}));
const relationships=JSON.parse(execFileSync(process.execPath,[join(root,'node_modules/tsx/dist/cli.mjs'),'scripts/audit-relationships-v61.ts'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','inherit']}));
relationships.source='v6.2-crowding';relationships.engineHash=current.engineHash;
writeFileSync(join(dir,'relationships.json'),JSON.stringify(relationships,null,2)+'\n');
writeFileSync(join(dir,'fixtures.json'),JSON.stringify(fixtures,null,2)+'\n');
const result={fullGames:reports.reduce((s,r)=>s+r.totalGames,0),transitions:reports.reduce((s,r)=>s+r.transitions,0),forecastFailures:reports.reduce((s,r)=>s+r.forecastFailures,0),censored:reports.reduce((s,r)=>s+r.summaries.reduce((n,p)=>n+p.deaths.censored,0),0),effects,leader:leader.id,competitors,duplication:current.summaries.filter(s=>s.id.includes('stack')).map(s=>({id:s.id,mean:s.mean,maxMusicians:s.maxMusicians,maxNurses:s.maxNurses,duplicateStepPct:round(s.duplicateCalmerSteps/s.steps*100)})),fixtures,relationshipChecks:relationships.forecastChecks};
assert.equal(result.fullGames,23040);assert.equal(result.forecastFailures,0);assert.equal(result.censored,0);
writeFileSync(join(dir,'analysis.json'),JSON.stringify(result,null,2)+'\n');
writeFileSync(join(dir,'reproduction.json'),JSON.stringify(reports.map(r=>({phase:r.phase,id:r.id,params:r.params,seedBase:r.seedBase,runs:r.summaries[0].floors.length,policies:r.summaries.map(s=>s.id),engineHash:r.engineHash,profileHash:r.profileHash,runnerHash:r.runnerHash})),null,2)+'\n');
const row=(id:string)=>effects.find(s=>s.id===id)!;
const table=[['稳健选人、只买舒缓','cautious-calm'],['提前预演／休整','rest-lookahead'],['偏好重复音乐家（最多4人）','musician-stack-4-12'],['偏好重复护士（最多6人）','nurse-stack-6-12'],['恋人协作规划','pair-lovers'],['警察／小偷偏好','police-thief-4'],['教练组合偏好','coach-4'],['不买舒缓卡','without-calm'],['最多3人','balanced-3']].map(([name,id])=>{const r=row(id);return `| ${name} | ${r.oldMean} | ${r.newMean} | ${r.delta>0?'+':''}${r.delta} | ${r.bootstrap95.join(' ～ ')} |`;}).join('\n');
writeFileSync(join(dir,'README.md'),`# Elevator Tales v6.2：四人组合与安抚堆叠测试

日期：2026-09-03。原版源代码固定于 bc4a95c687f5362a0da21a321874317b82701438，副本见 experiments/v61。测试版与拟发布引擎的 SHA-256 完全一致。

## 采用的改动

3–4 人不增加拥挤躁动；5 人每站 +1，6 人 +2，最多2人每站 −1。音乐家仍从4人起生效，音乐家／护士的多人安抚仍可相加。初始20电／容量24、疲劳、人物参数、升级效果和价格全部保持不变。帮助和状态说明同步修改，并纠正商店把默契契约／轿厢加固误标为电量救援的旧提示。

## 方法和规模

- 72 种策略 × 50 局 × 2 组拥挤规则 = 7,200 局筛查。
- 8 种策略 × 80 局 × 6 组规则 = 3,840 局价格对照。
- 20 种策略 × 300 个独立新种子 × 2 组规则 = 12,000 局复验。
- 总计 **${result.fullGames.toLocaleString('en-US')} 局**、${result.transitions.toLocaleString('en-US')} 次楼层转换，预报错误0；没有游戏达到600层测试保护线（不代表游戏有终点）。筛查和价格对照使用相同批种子，统计时不冒充独立样本；复验另用新种子。
- 另有 ${fixtures.cases.toLocaleString('en-US')} 个穷举场景，覆盖所有六格中空位／通勤者／音乐家／护士的安排、同类重复、奇偶层、疲劳边界、同时到站和耐心归零。
- 人物关系专项重跑 ${relationships.pairRosterCount} 种双人阵容、${relationships.pairJourneys.toLocaleString('en-US')} 次短途，${relationships.tripleRosterCount} 种三人阵容／${relationships.arrangementChecks.toLocaleString('en-US')} 次安排，${relationships.forecastChecks.toLocaleString('en-US')} 次预报检查，${relationships.copyCases.toLocaleString('en-US')} 次复制属性检查。这些都不是完整游戏局数。

同组种子配对，合法接客、一次付费换位、赔偿请离、付费充电和随机商店。重复安抚策略分别偏好音乐家或护士，人数上限4／6、偏好强度2／6／12；没有凭空生成指定角色，也没有延长其旅途。神秘人的车费对规划保持隐藏。

## 独立复验结果

每种规则、每行300局。平均结束楼层是程序策略指标，不是人类玩家胜率。

| 策略 | 原版 | 四人免拥挤 | 差值 | 配对95%区间 |
| --- | ---: | ---: | ---: | --- |
${table}

四人组合得到显著空间，堆叠安抚也确实增强，但不是无条件获胜：随机出现、到站离开、人数门槛和持续增加的疲劳仍构成限制。原样保留可叠加效果，没有在证据不足时削弱角色。详细同类出现次数、对局结果及策略间胜负见 analysis.json 和 holdout/。

## 没有采用的改动与遗留问题

仅降低默契契约、礼宾服务、轿厢加固的基础价格25%／50%，后期涨价不变，并分别在两组拥挤规则下比较。筛查未产生更强的不买舒缓路线：四人版中该策略从99.73降至97.39／97.40。固定的购买评分会因便宜而买更多卡，说明这些结果与程序的花钱习惯有关，不能解读为便宜卡对真人有害。因此不发布降价，也不声称已证明所有价格方案无效。

**舒缓卡依赖尚未解决。** 四人版稳健选人、只买舒缓仍明显领先不买舒缓。下一步应单独验证能把协作周转变成生存收益的升级，而不是继续单纯加金币；这次没有把未经验证的新机制混入上线版。

有限策略池不证明不存在全局最优策略。对筛查后挑选的策略，区间仅为描述性、未做多重比较校正。构造场景不用于估计自然出现概率；程序善于拒载致命炸弹，不代表真人面临的炸弹风险为零。自动测试不等于主观趣味性测试，仍需实际试玩观察是否愿意尝试四人组合。

## 复现

运行 scripts/audit-crowding-v62.ts 的 baseline／screen／holdout 阶段，参数、种子、策略表见 reproduction.json。每次运行须用新的 ELEVATOR_AUDIT_OUTPUT 目录；脚本拒绝覆盖旧结果。generated-sources/ 保存实际生成源码，experiments/v61/ 保存其他依赖。npm run verify 包含当前版四人和重复安抚回归检查。
`);
console.log(JSON.stringify(result,null,2));
