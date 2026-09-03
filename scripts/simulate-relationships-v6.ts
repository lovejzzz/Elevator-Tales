import assert from 'node:assert/strict';
import { PASSENGER_ORDER, type PassengerKind } from '../experiments/v6/game-data';
import { initialRun, makeOffers, resolveFloor, hasNeighbour, energySavings, totalWeight, cooperationBonus, chargeBattery, chargingPlan, installUpgrade, leaveShop, dismissRider, dismissalCost, nextShopFloor, type Rider, type RunState } from '../experiments/v6/game-engine';
import { bondStatus, riderProfile } from '../experiments/v6/rider-profile';
import { planPlacement } from '../experiments/v6/game-interaction';
import { stressForecast, energyForecast } from '../experiments/v6/game-forecast';

const count=Number(process.argv[2]??2000),occupancyCap=Number(process.argv[3]??6),horizon=600,seedBase=842917;
assert.ok(Number.isSafeInteger(count)&&count>0);
assert.ok(Number.isInteger(occupancyCap)&&occupancyCap>=2&&occupancyCap<=6);
const seeded=(seed:number)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const randomFor=(game:number,floor:number,phase:number)=>seeded(seedBase+game*100003+floor*991+phase*29009);
const round=(n:number)=>Math.round(n*100)/100;
const nearSlots=(slot:number)=>[0,1,2,3,4,5].filter(i=>Math.abs(i-slot)===3||Math.floor(i/3)===Math.floor(slot/3)&&Math.abs(i-slot)===1);
function value(state:RunState){
 const forecast=stressForecast(state),near=state.stress>state.stressCap*.55;
 let score=energySavings(state)*2;
 state.cabin.forEach((r,slot)=>{
  if(!r)return;
  const profile=riderProfile(r,state.cabin,slot),trip=Math.max(1,r.destination-state.floor);
  let fare=profile.hidden?24:profile.fare;
  const lovers=r.kind==='lover'&&hasNeighbour(state.cabin,slot,['lover']);
  if(lovers)fare*=2;
  if(r.kind==='thief'&&hasNeighbour(state.cabin,slot,['cop','lawyer']))fare+=5;
  if(r.kind==='ghost'&&hasNeighbour(state.cabin,slot,['exorcist']))fare+=6;
  if(r.kind==='coach')fare+=nearSlots(slot).filter(i=>state.cabin[i]).length*3;
  if(r.kind!=='coach'&&hasNeighbour(state.cabin,slot,['coach']))fare=Math.ceil(fare*1.5);
  fare+=r.fareBonus+ (bondStatus(r,state.cabin,slot).supported?cooperationBonus(state):0);
  const expectedPatience=trip*(near?2:1)+(r.kind==='child'&&!hasNeighbour(state.cabin,slot,['lover','musician','nurse'])?trip*.5:0);
  score+=fare/trip*1.5*(expectedPatience > r.patience ? .3 : 1);
  if(lovers)score+=1.5;
  if(r.kind==='thief')score+=hasNeighbour(state.cabin,slot,['cop','lawyer'])?1:3;
  if(r.kind==='drunk'&&hasNeighbour(state.cabin,slot,['musician','nurse']))score+=1;
  if(r.kind==='celebrity'&&nearSlots(slot).filter(i=>state.cabin[i]).length===1)score+=3;
  if(r.kind==='bomb'){
   const cops=nearSlots(slot).flatMap(i=>state.cabin[i]?.kind==='cop'?[state.cabin[i]!]:[]);
   let fuse=r.fuse??0,unsafe=false;
   for(let floor=state.floor+1;floor<=r.destination;floor++){
    // A controller is present during its arrival floor, not after leaving.
    const paused=floor%2===0&&cops.some(c=>c.destination>=floor&&c.patience>=floor-state.floor);
    if(!paused)fuse--;
    if(fuse<=0&&floor<r.destination){unsafe=true;break;}
   }
   if(unsafe)score-=1000;
  }
 });
 score-=(forecast.lowDelta+forecast.highDelta)/2*(near?10:3);
 if(state.stress+forecast.highDelta>=state.stressCap)score-=80;
 if(totalWeight(state.cabin)>state.weightCap)score-=20;
 return score;
}
type Policy='random-placement'|'best-boarding-position'|'best-boarding-and-reseat';
const policies:Policy[]=['random-placement','best-boarding-position','best-boarding-and-reseat'];
const summaries=[],outcomes:number[][]=[];
for(const policy of policies){
 const floors:number[]=[],role=Object.fromEntries(PASSENGER_ORDER.map(k=>[k,{offered:0,boarded:0,dismissed:0,aboardFloors:0,conflictFloors:0,supportedFloors:0}])) as Record<PassengerKind,{offered:number;boarded:number;dismissed:number;aboardFloors:number;conflictFloors:number;supportedFloors:number}>;
 const pressureSources:Record<string,number>={};
 let moves=0,moveValue=0,coinsEarned=0,dismissals=0,compensation=0,steps=0,conflictFloors=0,anyShifter=0,shifterOverload=0;
 const deaths={power:0,agitation:0,fuse:0,censored:0};
 for(let game=0;game<count;game++){
  let state=initialRun(),offers=makeOffers(1,state.upgrades,game%2===0,randomFor(game,1,1));
  while(state.status!=='lost'&&state.floor<horizon){
   if(state.status==='upgrade'){
    const charge=chargingPlan(state);
    state=chargeBattery(state,Math.min(charge.units,Math.floor(state.coins/2)));
    for(;;){
     const options=state.shop.filter(c=>!c.purchased&&c.price<=state.coins).map(c=>{
      const worth=c.key==='calm'?12+Math.min(state.stress,6)*8:c.key==='concierge'?32:c.key==='express'?35:c.key==='solar'?38:c.key==='reinforced'?(state.weightCap<13?30:8):24;
      return {...c,score:worth/c.price};
     }).sort((a,b)=>b.score-a.score);
     const best=options[0];if(!best||best.score<.3)break;
     const next=installUpgrade(state,best.key);if(next===state)break;state=next;
    }
    state=leaveShop(state);
    if(state.status==='playing')offers=makeOffers(state.floor,state.upgrades,false,randomFor(game,state.floor,1),state.cabin);
    continue;
   }
   for(let n=0;n<6;n++){
    let best=value(state)+4,next=state,removed:Rider|null=null;
    for(const r of state.cabin){
     if(!r)continue;const price=dismissalCost(state,r);
     if(state.coins-price<(nextShopFloor(state.floor)-state.floor)*2)continue;
     const trial=dismissRider(state,r.id);if(trial===state)continue;
     const score=value(trial)-price/4;
     if(score>best){best=score;next=trial;removed=r;}
    }
    if(next===state)break;
    dismissals++;compensation+=state.coins-next.coins;if(removed)role[removed.kind].dismissed++;
    state=next;
   }
   const placementRng=randomFor(game,state.floor,2);
   for(const offer of offers){
    role[offer.kind].offered++;
    if(state.cabin.filter(Boolean).length>=occupancyCap)continue;
    const legal=state.cabin.flatMap((r,slot)=>r?[]:[planPlacement(state,offer,slot)]).filter(p=>p.ok);
    if(!legal.length)continue;
    const current=value(state);
    const plan=policy==='random-placement'?legal[Math.floor(placementRng()*legal.length)]:legal.reduce((a,b)=>value(a.next)>=value(b.next)?a:b);
    if(value(plan.next)>current+.1){state=plan.next;role[offer.kind].boarded++;}
   }
   if(policy==='best-boarding-and-reseat'){
    const before=value(state);let best=before+.1,next=state;
    // One improvement per floor, respecting free moves vs the old-rider quota.
    for(let from=0;from<6;from++)for(let to=from+1;to<6;to++){
     const r=state.cabin[from]??state.cabin[to];if(!r)continue;
     const target=state.cabin[from]?to:from;
     const plan=planPlacement(state,r,target);if(!plan.ok||!plan.changed)continue;
     const score=value(plan.next);
     if(score>best){best=score;next=plan.next;}
    }
    if(next!==state){moves++;moveValue+=best-before;state=next;}
   }
   let conflict=false;
   state.cabin.forEach((r,slot)=>{if(!r)return;const bond=bondStatus(r,state.cabin,slot);role[r.kind].aboardFloors++;
    if(bond.conflict){role[r.kind].conflictFloors++;if((state.floor+1)%2===0)conflict=true;}
    if(bond.supported)role[r.kind].supportedFloors++;
   });
   if(conflict)conflictFloors++;
   if(state.cabin.some(r=>r?.kind==='shifter')){anyShifter++;if(totalWeight(state.cabin)>state.weightCap)shifterOverload++;}
   const forecast=stressForecast(state),energy=energyForecast(state),next=resolveFloor(state,randomFor(game,state.floor,3));
   assert.ok(next.lastPressure.delta>=forecast.lowDelta&&next.lastPressure.delta<=forecast.highDelta);
   assert.equal(next.lastEnergy.delta,energy.lowDelta);
   next.lastPressure.sources.filter(s=>s.amount>0).forEach(s=>pressureSources[s.label]=(pressureSources[s.label]??0)+s.amount);
   state=next;steps++;
   if(state.status==='playing')offers=makeOffers(state.floor,state.upgrades,false,randomFor(game,state.floor,1),state.cabin);
  }
  floors.push(state.floor);coinsEarned+=state.earned;
  deaths[state.status!=='lost'?'censored':state.message.includes('引信')?'fuse':state.energy<=0?'power':'agitation']++;
 }
 outcomes.push(floors);
 const sorted=[...floors].sort((a,b)=>a-b);
 const summary={policy,runs:count,median:sorted[Math.floor(count/2)],mean:round(floors.reduce((a,b)=>a+b,0)/count),p10:sorted[Math.floor(count*.1)],p90:sorted[Math.floor(count*.9)],max:sorted.at(-1),deaths,
  steps,moves,meanMoveScoreImprovement:moves?round(moveValue/moves):0,meanIncome:round(coinsEarned/count),dismissals,compensation,conflictFloors,conflictFloorPct:round(conflictFloors/steps*100),pressureSources,
  shifterAboardFloors:anyShifter,shifterOverloadFloors:shifterOverload,roles:role};
 summaries.push(summary);console.error(JSON.stringify({...summary,roles:undefined}));
}
function comparison(a:number,b:number){
 const differences=outcomes[b].map((v,i)=>v-outcomes[a][i]),rng=seeded(39817),boot=[];
 for(let trial=0;trial<1000;trial++){let sum=0;for(let i=0;i<count;i++)sum+=differences[Math.floor(rng()*count)];boot.push(sum/count);}
 boot.sort((a,b)=>a-b);
 return {from:policies[a],to:policies[b],meanFloorDifference:round(differences.reduce((s,v)=>s+v,0)/count),
 bootstrap95:[round(boot[25]),round(boot[975])],improvedPct:round(differences.filter(v=>v>0).length/count*100),tiedPct:round(differences.filter(v=>v===0).length/count*100)};
}
console.log(JSON.stringify({source:'f59e02c7cea65e56ef4dba61233a10a7e7444525',seedBase,horizon,occupancyCap,totalGames:count*3,
 note:'Floor/phase seeded randomness prevents action-dependent RNG consumption shifting all subsequent floors. Actual offers can still differ because lover calls depend on cabin state. All policies use the same admission valuation, dismissal rule and charging-first shop policy. Only legal positioning policy differs. This is a bot experiment, not a human retention test.',
 summaries,comparisons:[comparison(0,1),comparison(1,2),comparison(0,2)]},null,2));
