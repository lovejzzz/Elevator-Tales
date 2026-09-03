import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import type {Rider,RunState} from '../lib/game-engine';
import type {PassengerKind} from '../lib/game-data';
const root=resolve(import.meta.dirname,'..'),version=process.argv[2]??'baseline';
const base=join(root,version==='baseline'?'experiments/v66/lib':'lib');
const {PASSENGERS,PASSENGER_ORDER}=await import(pathToFileURL(join(base,'game-data.ts')).href);
const {initialRun,resolveFloor}=await import(pathToFileURL(join(base,'game-engine.ts')).href);
const {BONDS,randomTraits}=await import(pathToFileURL(join(base,'rider-profile.ts')).href);
const seeded=(seed:number)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const make=(kind:PassengerKind,id:string,extra:Partial<Rider>={}):Rider=>({kind,id,destination:50,boardedAt:1,patience:0,fareBonus:0,...(kind==='bomb'?{fuse:50}:{}),...extra});
const summaries=[];let trajectories=0;
for(const kind of PASSENGER_ORDER as PassengerKind[]){
 const row={kind,cases:0,positive:0,negative:0,safeCases:0,netCash:0,utility:0,cooperationGain:0,cooperationWins:0,conflictLoss:0,conflictHurts:0,fuseFailures:0,energy:0,agitation:0,netRange:[Infinity,-Infinity]};
 for(let sample=0;sample<64;sample++)for(const upgraded of [false,true])for(const stressed of [false,true])for(const extra of [false,true]){
  const rng=seeded(701234+sample*9923),spec=PASSENGERS[kind],trip=spec.trip[0]+Math.floor(rng()*(spec.trip[1]-spec.trip[0]+1));
  const rider=make(kind,'candidate',{destination:1+trip,fuse:kind==='bomb'?3+Math.floor(rng()*4):undefined,copySeed:sample,traits:['mystery','shifter'].includes(kind)?randomTraits(kind,PASSENGER_ORDER,rng):undefined});
  const bond=rider.traits?.bond??BONDS[kind],liked=bond.likes[sample%bond.likes.length],avoided=bond.avoids[sample%bond.avoids.length];
  const test=(neighbor:PassengerKind,adjacent:boolean)=>{
   let state:RunState={...initialRun(),energy:100,energyCap:100,stress:stressed?70:10,stressCap:100,cabin:[rider,null,null,null,null,extra?make('tourist','load'):null]};
   state.cabin[adjacent?1:2]=make(neighbor,'neighbor');
   if(upgraded)state.upgrades={...state.upgrades,battery:1,reinforced:1};
   const original=state;let steps=0;const random=seeded(880721+sample);
   while(state.cabin.some(r=>r?.id==='candidate')&&state.status!=='lost'&&steps<20){state=resolveFloor({...state,status:'playing'},random);steps++;}
   let without:RunState={...original,cabin:original.cabin.map(r=>r?.id==='candidate'?null:r)};const other=seeded(880721+sample);
   for(let n=0;n<steps;n++)without=resolveFloor({...without,status:'playing'},other);
   const cash=(state.coins-original.coins)-(without.coins-original.coins),energy=state.energy-without.energy,pressure=state.stress-without.stress;
   const failed=state.status==='lost';trajectories+=2;
   return{net:cash+energy*3,utility:cash+energy*3-pressure*2-(failed?100:0),energy,pressure,failed};
  };
  const support=test(liked,true),far=test(liked,false),conflict=test(avoided,true),noConflict=test(avoided,false);
  row.cases++;row.safeCases+=Number(!support.failed);row.fuseFailures+=Number(support.failed);row.netCash+=support.net;row.utility+=support.utility;row.positive+=Number(support.utility>0);row.negative+=Number(support.utility<0);row.energy+=support.energy;row.agitation+=support.pressure;
  row.cooperationGain+=support.utility-far.utility;row.cooperationWins+=Number(support.utility>far.utility+.01);row.conflictLoss+=noConflict.utility-conflict.utility;row.conflictHurts+=Number(noConflict.utility>conflict.utility+.01);
  row.netRange=[Math.min(row.netRange[0],support.net),Math.max(row.netRange[1],support.net)];
 }
 summaries.push({...row,positivePct:100*row.positive/row.cases,meanNet:row.netCash/row.cases,meanUtility:row.utility/row.cases,meanCooperationGain:row.cooperationGain/row.cases,meanConflictLoss:row.conflictLoss/row.cases});
}
const out=join(root,'docs/balance-checkpoint-2026-09-03');mkdirSync(out,{recursive:true});const target=join(out,'probe-'+version+'.json');assert.ok(!existsSync(target));
const hashes=Object.fromEntries(['game-engine.ts','game-data.ts','rider-profile.ts'].map(f=>[f,createHash('sha256').update(readFileSync(join(base,f))).digest('hex')]));
writeFileSync(target,JSON.stringify({version,hashes,trajectories,summaries,limits:'Controlled character probes, not normal games: 100 battery/cap and stress cap 100 isolate passenger effects. Utility uses an explicit diagnostic shadow price of 2 coins per agitation and 3 per battery, not a game reward. All fare measurements occur after simulated outcomes; this is not information supplied to a player policy. Adjacent and separated comparisons keep the same neighbor and starting RNG, but different branch draws can diverge.'},null,2));
console.log(JSON.stringify({version,trajectories,summaries:summaries.map(s=>({kind:s.kind,positive:Math.round(s.positivePct),net:Math.round(s.meanNet*10)/10,coop:Math.round(s.meanCooperationGain*10)/10,conflict:Math.round(s.meanConflictLoss*10)/10,fuse:s.fuseFailures}))}));
