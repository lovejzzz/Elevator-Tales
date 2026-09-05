import assert from 'node:assert/strict';
import { chargeBattery, chargingPlan, cooperationBonus, dismissalCost, dismissRider, energySavings, hasNeighbour, initialRun, installUpgrade, leaveShop, makeOffers, nextShopFloor, resolveFloor, totalWeight, type RunState, type Rider } from '../experiments/v8.31/lib/game-engine';
import { bondStatus, riderProfile } from '../experiments/v8.31/lib/rider-profile';
import { stressForecast, energyForecast } from '../experiments/v8.31/lib/game-forecast';
import { planPlacement } from '../experiments/v8.31/lib/game-interaction';

const runs=Number(process.argv[2]??500),seedBase=660301,horizon=600;
assert.ok(Number.isInteger(runs)&&runs>0);
function seeded(seed:number){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function score(state:RunState){
 const f=stressForecast(state),near=state.stress>state.stressCap*.55;
 let value=energySavings(state)*2;
 state.cabin.forEach((r,slot)=>{
  if(!r)return;
  const profile=riderProfile(r,state.cabin,slot),trip=Math.max(1,r.destination-state.floor);
  // The policy never reads the sealed fare; use a fixed prior expectation.
  const fare=(profile.hidden?24:profile.fare)+r.fareBonus+(bondStatus(r,state.cabin,slot).supported?cooperationBonus(state):0);
  value+=fare/trip*1.5;
  if(r.kind==='lover'&&hasNeighbour(state.cabin,slot,['lover']))value+=1.5;
  if(r.kind==='thief')value+=hasNeighbour(state.cabin,slot,['cop','lawyer'])?1:3;
  if(r.kind==='bomb'){
   const pause=hasNeighbour(state.cabin,slot,['cop'])?Math.floor((state.floor+trip)/2)-Math.floor(state.floor/2):0;
   if((r.fuse??0)<trip-pause)value-=1000;
  }
 });
 value-=(f.lowDelta+f.highDelta)/2*(near?10:3);
 if(state.stress+f.highDelta>=state.stressCap)value-=80;
 if(totalWeight(state.cabin)>state.weightCap)value-=20;
 return value;
}
function board(state:RunState,offers:Rider[]){
 let current=state;
 for(const offer of offers){
  let best=score(current)+.1,next=current;
  for(let slot=0;slot<6;slot++){
   if(current.cabin[slot])continue;
   const plan=planPlacement(current,offer,slot);
   if(plan.ok&&score(plan.next)>best){best=score(plan.next);next=plan.next;}
  }
  current=next;
 }
 return current;
}
const summaries=[];
for(const useDismissal of [false,true]){
 let dismissals=0,compensation=0,chargeSpent=0,upgrades=0,firstShop=0,forecastErrors=0;
 const floors:number[]=[],deaths:Record<string,number>={power:0,agitation:0,fuse:0,censored:0};
 const seen:Record<string,number>={mystery:0,shifter:0,mimic:0},boarded:Record<string,number>={mystery:0,shifter:0,mimic:0};
 for(let n=0;n<runs;n++){
  const rng=seeded(seedBase+n*97);let state=initialRun(),offers=makeOffers(1,state.upgrades,n%2===0,rng);
  while(state.status!=='lost'&&state.floor<horizon){
   if(state.status==='upgrade'){
    if(state.floor===10)firstShop++;
    const target=chargingPlan(state),units=Math.min(target.units,Math.floor(state.coins/2));
    const beforeCharge=state;state=chargeBattery(state,units);chargeSpent+=beforeCharge.coins-state.coins;
    for(;;){
     const options=state.shop.filter(c=>!c.purchased&&c.price<=state.coins).map(c=>{
      const worth=c.key==='calm'?12+Math.min(state.stress,6)*8:c.key==='concierge'?32:c.key==='express'?35:c.key==='solar'?38:c.key==='reinforced'?(state.weightCap<13?30:8):24;
      return {...c,score:worth/c.price};
     }).sort((a,b)=>b.score-a.score);
     const best=options[0];if(!best||best.score<.3)break;
     state=installUpgrade(state,best.key);upgrades++;
    }
    state=leaveShop(state);if(state.status==='playing')offers=makeOffers(state.floor,state.upgrades,false,rng,state.cabin);
    continue;
   }
   if(useDismissal){
    for(let attempt=0;attempt<6;attempt++){
     let best=score(state)+4,next=state,spent=0;
     for(const rider of state.cabin){
      if(!rider)continue;
      const price=dismissalCost(state,rider);
      if(state.coins-price<(nextShopFloor(state.floor)-state.floor)*2)continue;
      const trial=dismissRider(state,rider.id);if(trial===state)continue;
      const utility=score(trial)-price/4;
      if(utility>best){best=utility;next=trial;spent=price;}
     }
     if(next===state)break;state=next;dismissals++;compensation+=spent;
    }
   }
   for(const offer of offers)if(offer.kind in seen)seen[offer.kind]++;
   const beforeIds=new Set(state.cabin.flatMap(r=>r?[r.id]:[]));
   state=board(state,offers);
   state.cabin.forEach(r=>{if(r&&r.kind in boarded&&!beforeIds.has(r.id))boarded[r.kind]++;});
   const pressure=stressForecast(state),power=energyForecast(state),before=state;
   state=resolveFloor(state,rng);
   if(state.lastPressure.delta<pressure.lowDelta||state.lastPressure.delta>pressure.highDelta||state.lastEnergy.delta!==power.lowDelta)forecastErrors++;
   assert.ok(state.energy<before.energy);assert.ok(state.coins>=0&&state.earned>=state.coins);
   if(state.status==='playing')offers=makeOffers(state.floor,state.upgrades,false,rng,state.cabin);
  }
  floors.push(state.floor);
  deaths[state.status!=='lost'?'censored':state.message.includes('引信')?'fuse':state.energy<=0?'power':'agitation']++;
 }
 floors.sort((a,b)=>a-b);
 const summary={policy:useDismissal?'with-dismissal':'without-dismissal',runs,meanObservedFloor:Math.round(floors.reduce((a,b)=>a+b,0)/runs*100)/100,median:floors[Math.floor(runs/2)],p10:floors[Math.floor(runs*.1)],p90:floors[Math.floor(runs*.9)],max:floors.at(-1),reachFirstShopPct:firstShop/runs*100,deaths,dismissals,compensation,chargeSpent,upgrades,seen,boarded,forecastErrors};
 summaries.push(summary);console.error(JSON.stringify(summary));
}
console.log(JSON.stringify({seedBase,horizon,totalRuns:runs*2,summaries},null,2));
