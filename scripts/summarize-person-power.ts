import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {PASSENGERS,type PassengerKind} from '../lib/game-data';

const root=resolve(import.meta.dirname,'..'),dir=join(root,'experiments/person-power-20260903');
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const round=(n:number)=>Math.round(n*100)/100;
const stats=(a:number[])=>{
 const mean=a.reduce((s,v)=>s+v,0)/a.length,sorted=[...a].sort((a,b)=>a-b);
 const se=Math.sqrt(a.reduce((s,v)=>s+(v-mean)**2,0)/(a.length-1)/a.length);
 return {n:a.length,mean:round(mean),median:sorted[Math.floor(a.length/2)],p10:sorted[Math.floor(a.length*.1)],p90:sorted[Math.floor(a.length*.9)],mean95Approx:[round(mean-1.96*se),round(mean+1.96*se)]};
};
const phaseTotals:Record<string,{reports:number;games:number;transitions:number}>={};
const reports=[];
let forecastFailures=0,censored=0;
for(const phase of readdirSync(join(dir,'results'))){
 if(phase==='smoke')continue;
 phaseTotals[phase]={reports:0,games:0,transitions:0};
 for(const name of readdirSync(join(dir,'results',phase))){
  const r=read(join(dir,'results',phase,name));
  for(const hash of [...Object.values(r.hashes),r.runnerHash])assert.equal(sha(readFileSync(join(dir,'sources',hash+'.txt'),'utf8')),hash);
  assert.equal(r.totalGames,r.summaries.reduce((n:number,s:{runs:number})=>n+s.runs,0));
  phaseTotals[phase].reports++;phaseTotals[phase].games+=r.totalGames;phaseTotals[phase].transitions+=r.transitions;
  forecastFailures+=r.forecastFailures;censored+=r.summaries.reduce((n:number,s:{deaths:{censored:number}})=>n+s.deaths.censored,0);
  reports.push({phase,id:r.id,context:r.context,params:r.params,runs:r.totalGames,policies:r.summaries.map((s:{id:string;mean:number;deaths:unknown})=>({id:s.id,mean:s.mean,deaths:s.deaths}))});
 }
}
const productionHashes=Object.fromEntries(readdirSync(join(dir,'baseline/lib')).filter(f=>f.endsWith('.ts')).map(f=>{
 const original=readFileSync(join(dir,'baseline/lib',f),'utf8'),current=readFileSync(join(root,'lib',f),'utf8');assert.equal(current,original,f);return [f,sha(current)];
}));
const final=read(join(dir,'results/final/inspect3-normal.json'));
const policies=final.summaries.map((s:{id:string;floors:number[];checkpointRows:Array<{energy:number;floor:number}>;meanIncome:number;chargeSpend:number;runs:number;meanOccupancy:number;totalEnergy:number;steps:number;deaths:unknown;firstShopPassed:number;spending:Record<string,number>;dismissals:number;gamesWithContract:number})=>{
 const checkpoints=s.checkpointRows,early=checkpoints.filter(r=>r.floor<=30);
 return {id:s.id,...stats(s.floors),meanIncome:s.meanIncome,chargingPerGame:round(s.chargeSpend/s.runs),chargingIncomePct:round(s.chargeSpend/(s.meanIncome*s.runs)*100),meanOccupancy:s.meanOccupancy,energyPerStop:round(s.totalEnergy/s.steps),deaths:s.deaths,firstShopPassed:s.firstShopPassed,upgradeSpendPerGame:round(Object.values(s.spending).reduce((a,b)=>a+b,0)/s.runs),dismissalsPerGame:round(s.dismissals/s.runs),gamesWithContract:s.gamesWithContract,shopArrivalsAtMost5EnergyPct:round(checkpoints.filter(r=>r.energy<=5).length/checkpoints.length*100),earlyShopAtMost5EnergyPct:round(early.filter(r=>r.energy<=5).length/early.length*100),firstShopEnergy:stats(checkpoints.filter(r=>r.floor===10).map(r=>r.energy))};
});
const mixed=final.summaries.find((s:{id:string})=>s.id==='planning-pairs-6');
const roles=Object.keys(mixed.exposed).map(k=>({id:k,name:PASSENGERS[k as PassengerKind].name,exposed:mixed.exposed[k],boarded:mixed.boarded[k],acceptPct:round(mixed.boarded[k]/mixed.exposed[k]*100),delivered:mixed.delivered[k],completionPct:round(mixed.delivered[k]/mixed.boarded[k]*100)}));
const verification=read(join(dir,'verification-inspect3.json'));
assert.deepEqual(verification.hashes,final.hashes);assert.equal(forecastFailures,0);assert.equal(censored,0);
const target=join(dir,'summary.json');assert.ok(!existsSync(target));
const result={candidate:final.params,phaseTotals,totalGames:Object.values(phaseTotals).reduce((n,p)=>n+p.games,0),transitions:Object.values(phaseTotals).reduce((n,p)=>n+p.transitions,0),forecastFailures,censored,verification,productionUnchanged:true,productionHashes,policies,roles,comparisons:final.comparisons,reports};
writeFileSync(target,JSON.stringify(result,null,2));console.log(JSON.stringify({...result,verification:verification.total,productionHashes:undefined,reports:undefined},null,2));
