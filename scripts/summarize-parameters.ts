import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
type Summary={id:string;runs:number;mean:number;median:number;p10:number;p90:number;floors:number[];deaths:Record<string,number>;meanIncome:number;meanOccupancy:number;purchases:Record<string,number>;spending:Record<string,number>;chargeSpend:number;boarded:Record<string,number>;pressureSources:Record<string,number>;firstShopPassed:number;deliveryCount:number;patienceLosses:number;emptyStepPct:number;lateEmptyStepPct:number;dismissals:number};
type Report={id:string;params:Record<string,unknown>;phase:string;workspace:string;revision:string;seedBase:number;engineHash:string;profileHash:string;runnerHash:string;totalGames:number;transitions:number;forecastFailures:number;summaries:Summary[]};
const dir=resolve(process.env.ELEVATOR_AUDIT_OUTPUT??resolve(import.meta.dirname,'../docs/parameter-audit-2026-09-03'));
const read=<T>(path:string):T=>JSON.parse(readFileSync(path,'utf8'));
const reports=['baseline','screen','holdout'].flatMap(phase=>readdirSync(join(dir,phase)).filter(f=>f.endsWith('.json')).map(f=>read<Report>(join(dir,phase,f))));
// Retain the exact generated text used by each run, including earlier policy
// catalogs. Unchanged supporting modules remain addressable by git revision.
const archive=join(dir,'generated-sources');mkdirSync(archive,{recursive:true});
for(const report of reports)for(const [path,hash] of [['lib/game-engine.ts',report.engineHash],['lib/rider-profile.ts',report.profileHash],['scripts/run.ts',report.runnerHash]]){
 const target=join(archive,hash+'.txt');
 if(existsSync(target))continue;
 const source=readFileSync(join(report.workspace,path),'utf8');
 assert.equal(createHash('sha256').update(source).digest('hex'),hash);
 writeFileSync(target,source);
}
writeFileSync(join(dir,'reproduction.json'),JSON.stringify(reports.map(r=>({revision:r.revision,phase:r.phase,id:r.id,params:r.params,seedBase:r.seedBase,runs:r.summaries[0].runs,policies:r.summaries.map(s=>s.id),engineHash:r.engineHash,profileHash:r.profileHash,runnerHash:r.runnerHash})),null,2)+'\n');
const current=reports.find(r=>r.phase==='holdout'&&r.id==='baseline')!;assert.ok(current,'Holdout must finish first');
const mean=(a:number[])=>a.reduce((x,y)=>x+y,0)/a.length;
const round=(n:number)=>Math.round(n*100)/100;
function compare(a:number[],b:number[]){
 const n=Math.min(a.length,b.length);const delta=a.slice(0,n).map((v,i)=>v-b[i]);
 let seed=9039907;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const samples=Array.from({length:2000},()=>{let sum=0;for(let i=0;i<n;i++)sum+=delta[Math.floor(rng()*n)];return sum/n;}).sort((x,y)=>x-y);
 return {n,delta:round(mean(delta)),bootstrap95:[round(samples[50]),round(samples[1949])],winPct:round(100*delta.filter(v=>v>0).length/n),tiePct:round(100*delta.filter(v=>v===0).length/n)};
}
const baseline=current.summaries.find(s=>s.id==='cautious-6')!;
const ranks=[...current.summaries].sort((a,b)=>b.mean-a.mean);
const policyComparisons=current.summaries.map(s=>({id:s.id,...compare(s.floors,baseline.floors)}));
const effects=reports.filter(r=>r.phase==='holdout'&&r.id!=='baseline').map(r=>({id:r.id,params:r.params,effects:r.summaries.map(s=>({policy:s.id,mean:s.mean,...compare(s.floors,current.summaries.find(b=>b.id===s.id)!.floors)}))}));
const screenBase=reports.find(r=>r.phase==='screen'&&r.id==='baseline')!;
const screening=reports.filter(r=>r.phase==='screen').map(r=>({id:r.id,params:r.params,averagePolicyDelta:round(mean(r.summaries.map(s=>s.mean-screenBase.summaries.find(b=>b.id===s.id)!.mean))),leader:[...r.summaries].sort((a,b)=>b.mean-a.mean)[0].id}));
const onboarding=read<{games:number;transitions:number;results:unknown[]}>(join(dir,'onboarding.json'));
const result={fullGames:reports.reduce((s,r)=>s+r.totalGames,0),onboardingGames:onboarding.games,
 fullTransitions:reports.reduce((s,r)=>s+r.transitions,0),onboardingTransitions:onboarding.transitions,
 forecastFailures:reports.reduce((s,r)=>s+r.forecastFailures,0),censoredFullRuns:reports.reduce((s,r)=>s+r.summaries.reduce((x,p)=>x+p.deaths.censored,0),0),
 current:ranks.map(({floors:_floors,...s})=>s),policyComparisons,effects,screening,
 limits:'Paired descriptive bootstrap intervals; multiple comparisons unadjusted. Screening seeds overlap baseline discovery; holdout uses fresh seeds. Heuristic estimates are not human outcomes or a proof of global nondominance.'};
writeFileSync(join(dir,'analysis.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,current:result.current.map(s=>({id:s.id,mean:s.mean,median:s.median,p10:s.p10,p90:s.p90,occupancy:s.meanOccupancy,deaths:s.deaths,purchases:s.purchases,deliveryCount:s.deliveryCount,patienceLosses:s.patienceLosses,dismissals:s.dismissals})),screening:undefined},null,2));
