import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {Session} from './runtime.mts';
import {enumerate,serviceFor} from './search.mts';
import {score} from './policies.mts';
import {configureScenario} from './scenarios.mts';
import {hash,manifest,writeNew} from './util.mts';
const input=resolve(process.argv[2]??''),out=resolve(process.argv[3]??'');assert(process.argv[2]&&process.argv[3]);mkdirSync(out,{recursive:false});
configureScenario('baseline');const before=manifest();writeNew(join(out,'manifest.json'),{...before,classification:'Expanded-rollout offline diagnostic; not games or equal-budget improvement'});
for(let i=0;i<4;i++){
 const rows=(mode:string)=>readFileSync(join(input,`${mode}-${i}.public.jsonl`),'utf8').trim().split('\n').map(line=>JSON.parse(line));
 const a=rows('operator'),b=rows('allocator');const index=a.findIndex((t,j)=>hash(t.decision.actions)!==hash(b[j]?.decision.actions));assert(index>=0);
 const target=a[index],other=b[index];assert.deepEqual(target.before,other.before,'Divergence must start from the same public state');
 const record=JSON.parse(readFileSync(join(input,`operator-${i}.private-replay.json`),'utf8')).record;
 const session=new Session(record.seed,record.tutorial,record.initialWorld);
 for(const step of record.transcript){if(session.observation().floor===target.before.floor&&session.observation().phase==='playing')break;session.act(step.action);assert.deepEqual(session.transcript.at(-1),step);}
 assert.deepEqual(session.observation(),target.before);
 const worldHash=hash(session.world()),seen=new Set<string>(target.decision.diagnostics.knowledge),service=serviceFor(session.world(),session.names);
 const normal=enumerate(session.world(),session.names,'allocator',seen),all=enumerate(session.world(),session.names,'allocator',seen,undefined,true);
 const originalFinalists=new Set(other.decision.alternatives.map((p:any)=>hash(p.actions))),shortlist=new Set(normal.plans.map(p=>hash(p.actions)));
 const scored=all.plans.map(p=>{
  const r=service.imagine(p.actions,5,4,'operator');
  const value=score(p,'allocator',seen)+r.survivalFraction*180+r.meanFloors*15+r.meanNetCash*1.2+r.meanEnergy*2-r.meanStress+(r.meanInvestmentRoom??0)*1.2;
  return{actions:p.actions,safe:p.safety.resourceSafe&&p.safety.bombSafe,value,rollout:r,shortlisted:shortlist.has(hash(p.actions)),finalist:originalFinalists.has(hash(p.actions))};
 }).sort((a,b)=>Number(b.safe)-Number(a.safe)||b.rollout.survivalFraction-a.rollout.survivalFraction||b.rollout.meanFloors-a.rollout.meanFloors||b.value-a.value);
 assert.equal(hash(session.world()),worldHash);
 const result={index:i,floor:target.before.floor,generated:all.enumerated,validPlans:all.plans.length,shortlist:normal.plans.length,finalists:originalFinalists.size,chosen:other.decision.actions,best:scored[0],top:scored.slice(0,12),allScores:scored,limitation:'More rollout work, same generated nodes and independent model samples; not exhaustive survival or actual future.'};
 writeNew(join(out,`case-${i}.json`),result);console.log(JSON.stringify({index:i,floor:result.floor,generated:result.generated,validPlans:result.validPlans,shortlist:result.shortlist,best:result.best}));
}
assert.deepEqual(manifest().source,before.source);assert.deepEqual(manifest().lab,before.lab);
