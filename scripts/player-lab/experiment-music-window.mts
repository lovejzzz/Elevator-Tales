import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {E,B,type Rider} from './game.mts';
import {rider} from './fixtures.mts';
import {configureScenario} from './scenarios.mts';
import {manifest,writeNew} from './util.mts';

// Fixed, public starting states; no future offers or policy optimization.
// This measures timing, not adoption or the frequency of these states in play.
const before=manifest();
const contexts=['tourist','quiet-work','one-drunk','two-drunks'] as const;
function play(context:typeof contexts[number],stress:number,musicTrip:number,otherTrip:number,mode:string){
 configureScenario(mode==='two'?'music-two-step':'music-one-step');
 const cabin:Array<Rider|null>=Array(6).fill(null);
 cabin[0]=mode==='absent'?null:rider('musician','music',31,musicTrip);
 if(context==='tourist')cabin[1]=rider('tourist','tour',31,otherTrip);
 if(context==='quiet-work'){
  cabin[1]=rider('inspector','inspect',31,otherTrip);
  cabin[4]=rider('mechanic','repair',31,otherTrip);
 }
 if(context==='one-drunk'||context==='two-drunks')cabin[1]=rider('drunk','d1',31,otherTrip);
 if(context==='two-drunks')cabin[4]=rider('drunk','d2',31,otherTrip);
 let state={...E.initialRun(),floor:31,energy:60,stress,cabin};
 const steps=[];
 let touristBonus=0,drunkBonus=0,stash=0;
 while(state.status==='playing'&&state.cabin.some(Boolean)&&steps.length<5){
  const prior=state;
  state=E.resolveFloor(state,()=>.99);
  if(prior.cabin.some(r=>r?.kind==='tourist'&&r.destination===state.floor)&&B.agitationBand(prior.stress)==='medium')touristBonus+=B.TOURIST_MEDIUM_BONUS;
  drunkBonus+=state.lastEarnings.sources.find(l=>l.label==='醉汉躁动加价')?.amount??0;
  stash+=state.lastEarnings.sources.find(l=>l.label==='坏人暂存兑现')?.amount??0;
  steps.push({floor:state.floor,departureAgitation:prior.stress,agitation:state.stress,energy:state.energy,coins:state.coins,
   earnings:state.lastEarnings.sources,pressure:state.lastPressure.sources,
   riders:state.cabin.map(r=>r?{kind:r.kind,remaining:r.destination-state.floor,stamped:!!r.complianceReady,repairDone:!!r.repairDone}:null)});
 }
 return {status:state.status,floor:state.floor,energy:state.energy,coins:state.coins,agitation:state.stress,touristBonus,drunkBonus,stash,serviceTurns:state.serviceTurns??0,steps};
}
type WindowCase={context:typeof contexts[number];stress:number;musicTrip:number;otherTrip:number;one:ReturnType<typeof play>;two:ReturnType<typeof play>;absent:ReturnType<typeof play>};
const cases:WindowCase[]=[];
try{
 for(const context of contexts)for(let stress=0;stress<8;stress++)for(let musicTrip=2;musicTrip<=5;musicTrip++)for(let otherTrip=2;otherTrip<=5;otherTrip++){
  cases.push({context,stress,musicTrip,otherTrip,one:play(context,stress,musicTrip,otherTrip,'one'),two:play(context,stress,musicTrip,otherTrip,'two'),absent:play(context,stress,musicTrip,otherTrip,'absent')});
 }
}finally{configureScenario('baseline');}
assert.deepEqual(manifest(),before);
const summary=contexts.map(context=>{
 const rows=cases.filter(c=>c.context===context);
 return {context,cases:rows.length,changed:rows.filter(c=>JSON.stringify(c.one)!==JSON.stringify(c.two)).length,
  deaths:Object.fromEntries(['one','two','absent'].map(k=>[k,rows.filter(c=>c[k as 'one'].status==='lost').length])),
  touristPayoutCases:Object.fromEntries(['one','two','absent'].map(k=>[k,rows.filter(c=>c[k as 'one'].touristBonus>0).length])),
  twoHigherCoins:rows.filter(c=>c.two.coins>c.one.coins).length,twoLowerCoins:rows.filter(c=>c.two.coins<c.one.coins).length,
  twoPreventsDeath:rows.filter(c=>c.one.status==='lost'&&c.two.status!=='lost').length,
  twoCausesDeath:rows.filter(c=>c.one.status!=='lost'&&c.two.status==='lost').length};
});
writeNew(resolve(process.argv[2]),{manifest:before,cases,summary,
 limitations:'512 designed starting states × 3 fixed-action variants. Music-absent removes its fare, seat and power too, not an isolated ability ablation. No new boarding/reseating/shop actions, no future input. Counts are fixture coverage, not real-world prevalence or human win rates.'});
console.log(JSON.stringify(summary,null,2));
