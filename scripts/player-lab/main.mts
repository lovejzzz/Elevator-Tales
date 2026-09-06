import assert from 'node:assert/strict';
import {readFileSync,readdirSync,mkdirSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {randomInt} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {POLICIES} from './policies.mts';
import {runOne} from './run.mts';
import {verify} from './verify.mts';
import {manifest,writeNew,mean,quantile} from './util.mts';
import {replay,Session} from './runtime.mts';
import {auditUILog} from './ui-audit.mts';
import {diverseQueue} from './review-queue.mts';
import type {Action,PolicyName,Observation,Decision,ShopStyle} from './types.mts';
import {configureScenario} from './scenarios.mts';
import {guidedOpening} from './opening.mts';

const [command,...args]=process.argv.slice(2);
function arg(key:string,fallback?:string){const i=args.indexOf('--'+key);return i<0?fallback:args[i+1];}
const replayInput=command==='replay'&&arg('file')?JSON.parse(readFileSync(arg('file')!,'utf8')):null;
const scenario=configureScenario(replayInput?.scenario?.name??arg('scenario','baseline')!);
if(!['run','replay'].includes(command))assert.equal(scenario.name,'baseline','Research overrides are only allowed in batch runs/replays');
const before=manifest();
if(command==='verify')console.log(JSON.stringify(verify(),null,2));
else if(command==='run'){
 const dir=resolve(arg('out')??'.player-lab/results/'+new Date().toISOString().replaceAll(':','-'));
 mkdirSync(dirname(dir),{recursive:true});mkdirSync(dir,{recursive:false});
 const runs=Number(arg('runs','4')),horizon=Number(arg('horizon','160')),split=arg('split','development');
 assert(Number.isInteger(runs)&&runs>=1&&runs<=1000);assert(Number.isInteger(horizon)&&horizon>=10&&horizon<=1000);
 assert(['development','holdout'].includes(split!));
 const requested=(arg('policies')?.split(',')??POLICIES) as PolicyName[];assert(requested.every(p=>POLICIES.includes(p)));
 const shopStyle=arg('shop-style','native') as ShopStyle;assert(['native','committed','adaptive'].includes(shopStyle));
 const opening=arg('opening','policy-default')!;guidedOpening(opening,requested[0]);
 const seedBase=Number(arg('seed-base',String(split==='holdout'?193260904:173260904)));assert(Number.isSafeInteger(seedBase));
 writeNew(join(dir,'manifest.json'),{...before,split,runsPerPolicy:runs,horizon,seedBase,shopStyle,opening,scenario,
  methodology:'Same real engine and legal actions. Floor-keyed offer/settlement streams; conditional Lover calls and earlier choices can still change offers. All outcomes are synthetic policy samples. Seeds never enter policy inputs. Search budgets and probabilities are not human calibration.'});
 const results:Array<ReturnType<typeof runOne>['summary']&{policy:PolicyName;index:number;seed:number;wallMs:number;opening:string}>=[];
 const packets:Array<{caseId:string;trigger:string;observation:Observation;proposedActions:Action[];alternatives:Decision['alternatives'];reviewQuestions:string[];limitation:string}>=[];
 const started=performance.now();
 for(const policy of requested)for(let i=0;i<runs;i++){
  const guided=guidedOpening(opening,policy);
  const result=runOne(policy,seedBase+i*97,horizon,guided,shopStyle);
  const stem=policy+'-'+i;
  writeNew(join(dir,stem+'.public.jsonl'),result.turns.map(t=>JSON.stringify(t)).join('\n')+'\n');
  writeNew(join(dir,stem+'.shops.json'),result.shops);
  writeNew(join(dir,stem+'.private-replay.json'),{source:before.source,lab:before.lab,scenario,record:result.replay});
  // Replaying every trajectory verifies execution parity, not only totals.
  replay(result.replay);
  results.push({policy,index:i,seed:result.seed,wallMs:result.wallMs,...result.summary,opening:guided?'guided':'ordinary'});
  const reviewFlags=[...(result.summary.outcome!=='alive-censored'?[{code:'DEATH_REVIEW',floor:result.summary.final.floor}]:[]),...result.summary.flags.filter(f=>!['ALL_HIGH_RISK_REJECTED'].includes(f.code)).slice(0,5)];
  for(const flag of reviewFlags){
   const t=result.turns.find(t=>t.before.floor===flag.floor||t.after.floor===flag.floor);
   if(t)packets.push({caseId:stem+'-'+flag.floor+'-'+flag.code,trigger:flag.code,observation:t.before,
    proposedActions:t.decision.actions,alternatives:t.decision.alternatives,
    reviewQuestions:['只根据此时已知信息，你会怎样选择？','是否有未被程序搜索到的合法组合？','此情况需要在真实界面上检查什么？'],
    limitation:'Public information at the decision only. No seed, actual next offers or sealed reward.'});
  }
  console.log(JSON.stringify({policy,index:i,floor:result.summary.final.floor,outcome:result.summary.outcome,coins:result.summary.final.coins,ms:Math.round(result.wallMs)}));
 }
 const elapsedMs=performance.now()-started,totalAscents=results.reduce((n,r)=>n+r.ascents,0);
 const groups=requested.map(policy=>{const rs=results.filter(r=>r.policy===policy);return {policy,runs:rs.length,
  meanObservedFloor:mean(rs.map(r=>r.final.floor)),medianObservedFloor:quantile(rs.map(r=>r.final.floor),.5),p90ObservedFloor:quantile(rs.map(r=>r.final.floor),.9),
  above60:rs.filter(r=>r.final.floor>60).length,censored:rs.filter(r=>r.outcome==='alive-censored').length,
  meanOccupancy:mean(rs.map(r=>r.meanOccupancy)),maximumOccupancy:Math.max(...rs.map(r=>r.maxOccupancy)),
  meanFinalCoins:mean(rs.map(r=>r.final.coins)),flags:Object.fromEntries([...new Set(rs.flatMap(r=>r.flags.map(f=>f.code)))].map(code=>[String(code),rs.filter(r=>r.flags.some(f=>f.code===code)).length]))};});
 writeNew(join(dir,'summary.json'),{groups,elapsedMs,totalAscents,ascentsPerSecond:totalAscents/(elapsedMs/1000),results,
  opening,caveats:['Censored floors are observed lower bounds, not deaths or wins.','Above60 is policy-specific, not a human success probability.','Novelty/choice flags are review cues, not measurements of fun.','Safe plan counts cover a bounded shortlist only.',opening==='policy-default'?'Novice starts guided; other policies start ordinary, so persona contrasts are descriptive, not isolated causal effects.':'Opening is held fixed across policies in this batch; policy results still are not human calibration.']});
 writeNew(join(dir,'review-queue.json'),diverseQueue(packets));
 assert.deepEqual(manifest(),before,'Game or lab changed during experiment');
 console.log(JSON.stringify({dir,groups,elapsedMs,ascentsPerSecond:totalAscents/(elapsedMs/1000)}));
}else if(command==='replay'){
 const input=arg('file');assert(input);const r=JSON.parse(readFileSync(input,'utf8'));assert.deepEqual(r.source,before.source,'Replay source mismatch');assert.deepEqual(r.lab,before.lab,'Replay lab mismatch');
 const s=replay(r.record);console.log(JSON.stringify({verified:true,floor:s.observation().floor,phase:s.observation().phase,actions:r.record.transcript.length}));
}else if(command==='ui-scan'){
 assert(arg('file'),'Use --file with an existing UI log');const file=resolve(arg('file')!);const output=await auditUILog(file);
 if(arg('out'))writeNew(resolve(arg('out')!),output);console.log(JSON.stringify(output,null,2));
}else if(command==='model'){
 const dir=resolve(arg('dir')??'');assert(arg('dir'),'Use --dir');let s:Session,step=0;
 if(args.includes('--new')){mkdirSync(dirname(dir),{recursive:true});mkdirSync(dir,{recursive:false});s=new Session(randomInt(1,2147483647),true);writeNew(join(dir,'manifest.json'),before);}
 else {
  const previous=readdirSync(dir).filter(p=>/^\d+\.private\.json$/.test(p)).sort().at(-1);assert(previous,'No session');
  const m=JSON.parse(readFileSync(join(dir,'manifest.json'),'utf8'));assert.deepEqual(m.source,before.source);
  s=replay(JSON.parse(readFileSync(join(dir,previous),'utf8')));step=Number(previous.split('.')[0])+1;
  const actions=JSON.parse(arg('actions')??'[]') as Action[];assert(Array.isArray(actions)&&actions.length>0&&actions.length<=16);
  const decisionObservation=s.observation();
  for(const a of actions)s.act(a);
  writeNew(join(dir,String(step).padStart(5,'0')+'.decision.json'),{observation:decisionObservation,actions,reason:arg('reason','No reason supplied; action protocol test only')});
 }
 const label=String(step).padStart(5,'0');writeNew(join(dir,label+'.private.json'),s.replayRecord());
 const observation=s.observation();writeNew(join(dir,label+'.public.json'),observation);
 console.log(JSON.stringify({step,observation}));
}else throw Error('Commands: verify | run --out DIR [--runs N --horizon N --split development|holdout] | replay --file FILE | ui-scan --file FILE | model --dir DIR --new / --actions JSON');
assert.deepEqual(manifest(),before,'Frozen game or lab changed');
