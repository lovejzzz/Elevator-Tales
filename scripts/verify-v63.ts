import assert from 'node:assert/strict';
import { shiftAgitation, COOPERATION_RELIEF, cooperationRelief, cooperationBonus, initialRun, resolveFloor, dismissRider, previewUpgrade, upgradePrice, type Rider, type RunState } from '../experiments/v63/lib/game-engine';
import { resolveFloor as baselineResolve } from '../experiments/v62/lib/game-engine';
import { stressForecast, energyForecast } from '../experiments/v63/lib/game-forecast';
import { PASSENGER_ORDER, type PassengerKind } from '../experiments/v63/lib/game-data';
import { randomTraits } from '../experiments/v63/lib/rider-profile';
import { metricChanges } from '../experiments/v63/lib/metric-feedback';
import { passengerBrief } from '../experiments/v63/lib/passenger-presentation';

const rngFor=(seed:number)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const rider=(kind:PassengerKind,id:string,destination=3):Rider=>({kind,id,destination,patience:12,boardedAt:1,fareBonus:0});
const base=():RunState=>({...initialRun(),floor:2,stress:9,coins:200,earned:200,upgrades:{...initialRun().upgrades,battery:1}});
const seats=(...people:Array<Rider|null>)=>Array.from({length:6},(_,i)=>people[i]??null);
const amount=(s:RunState)=>s.lastPressure.sources.find(s=>s.label==='默契契约 · 协作送达')?.amount??0;
const check=(before:RunState,random=()=>.9)=>{
 const encoded=JSON.stringify(before),p=stressForecast(before),e=energyForecast(before),after=resolveFloor(before,random);
 assert.equal(JSON.stringify(before),encoded,'forecasts/settlement must not mutate input');
 assert.ok(after.lastPressure.delta>=p.lowDelta&&after.lastPressure.delta<=p.highDelta,JSON.stringify({before,p,after}));
 assert.equal(after.lastEnergy.delta,e.lowDelta);
 assert.ok([0,-cooperationRelief(before)].includes(amount(after)),'never stack by riders, neighbors or contract levels');
 for(const metric of metricChanges(before,after,'test'))assert.equal(metric.sources.reduce((s,v)=>s+v.amount,0),metric.delta);
 return after;
};
const pair={...base(),cabin:seats(rider('lover','a'),rider('lover','b'))};
assert.equal(amount(check(pair)),-COOPERATION_RELIEF);
assert.equal(check(pair).coins-pair.coins,36,'both simultaneous arrivals keep coin bonuses');
assert.equal(check(pair).stress,9-1-2-COOPERATION_RELIEF);
assert.equal(amount(check({...pair,upgrades:{...pair.upgrades,battery:0}})),0);
assert.equal(amount(check({...base(),cabin:seats(rider('lover','a'),null,null,null,null,rider('lover','b'))})),0,'nonadjacent pair');
for(const level of [1,2,9,100]){
 const state={...base(),upgrades:{...base().upgrades,battery:level},cabin:Array.from({length:6},(_,i)=>rider('lover','l'+i))};
 assert.equal(amount(check(state)),-COOPERATION_RELIEF,'all six simultaneous arrivals trigger once');
}
const early={...base(),cabin:seats(rider('lover','a'),rider('lover','b',5))};
const afterEarly=check(early);assert.equal(amount(afterEarly),-COOPERATION_RELIEF);
assert.equal(amount(check({...afterEarly,cabin:afterEarly.cabin.map(r=>r?{...r,destination:4}:null)})),0,'partner left on an earlier floor');
const impatientSupport={...early,cabin:seats(rider('lover','a'),{...rider('lover','b',5),patience:1})};
assert.equal(amount(check(impatientSupport)),-COOPERATION_RELIEF,'arrivals precede impatience removal');
const noArrival={...base(),cabin:seats(rider('lover','a',5),rider('lover','b',5))};
assert.equal(amount(check(noArrival)),0);
assert.equal(amount(check({...noArrival,cabin:noArrival.cabin.map(r=>r?{...r,patience:1}:null)})),0,'impatient departure earns no relief');
assert.equal(dismissRider(noArrival,'a').stress,noArrival.stress,'paid ejection earns no relief');
assert.equal(previewUpgrade({...base(),upgrades:{...base().upgrades,battery:0}},'battery').stress,9,'buying a contract is not an immediate crisis repair');
// Drunk at 3 swaps with lover at 0: the arriving lover is no longer adjacent.
const broken={...base(),floor:1,cabin:seats(rider('lover','a',2),rider('lover','b',5),null,rider('drunk','d',5))};
let calls=0;assert.equal(amount(check(broken,()=>calls++===0?0:.99)),0);
// Drunk at 1 swaps with lover at 4: a previously absent pair is formed.
const created={...base(),floor:1,cabin:seats(rider('lover','a',2),rider('drunk','d',5),null,null,rider('lover','b',5))};
calls=0;assert.equal(amount(check(created,()=>calls++===0?0:.99)),-COOPERATION_RELIEF);
assert.match(stressForecast(broken).details,/契约舒缓可能/);
assert.match(stressForecast(created).details,/契约舒缓可能/);
assert.equal(upgradePrice('battery',10,0),60);
assert.equal(upgradePrice('battery',20,1),87);
for(const kind of PASSENGER_ORDER){
 const brief=passengerBrief(rider(kind,'text'),2,[],cooperationBonus(base()),cooperationRelief(base()));
 assert.equal(brief.cooperation.relief,`额外躁动 −${COOPERATION_RELIEF}`);
 assert.equal(brief.cooperation.limit,'舒缓全车每层1次');
 assert.ok(brief.cardRules.find(r=>r.tone==='good')?.lines.some(line=>line.includes(`${COOPERATION_RELIEF}`)&&line.includes('躁动')));
 assert.match(brief.cardRules.find(r=>r.tone==='good')!.note!,/全车每层仅一次/);
}
assert.equal(passengerBrief(rider('lover','no-contract'),2).cooperation.relief,null);

const random=rngFor(96352109);let randomChecks=0,baselineChecks=0;
for(let n=0;n<30000;n++){
 const floor=1+Math.floor(random()*300),contract=Math.floor(random()*5);
 const before:RunState={...initialRun(),floor,energy:24,coins:100,earned:100,stress:Math.floor(random()*20),
  upgrades:{...initialRun().upgrades,battery:contract},cabin:Array.from({length:6},(_,i)=>{
   if(random()<.15)return null;
   const kind=PASSENGER_ORDER[Math.floor(random()*PASSENGER_ORDER.length)];
   return {...rider(kind,'random-'+n+'-'+i,floor+1+Math.floor(random()*5)),patience:1+Math.floor(random()*12),
    fuse:kind==='bomb'?1+Math.floor(random()*5):undefined,copySeed:Math.floor(random()*100000),
    traits:kind==='mystery'||kind==='shifter'?randomTraits(kind,PASSENGER_ORDER,random):undefined};
  })};
 for(let sample=0;sample<3;sample++){
  const seed=963311+7*n+sample,after=check(before,rngFor(seed));randomChecks++;
  if(!contract){
   // Later releases may change fatigue but must retain passenger settlement.
   const old=baselineResolve({...before, shop: []},rngFor(seed));
   for(const key of ['energy','coins','earned','cabin','restStops','upgrades'] as const)assert.deepEqual(after[key],old[key]);
   const oldFatigue=old.lastPressure.sources.find(s=>s.label==='长班疲劳')?.amount??0;
   const expected=before.stress+old.lastPressure.sources.reduce((sum,s)=>sum+s.amount,0)-oldFatigue+shiftAgitation(floor+1,before.cabin.filter(Boolean).length,before.restStops);
   assert.equal(after.stress,Math.max(0,expected));baselineChecks++;
  }
 }
}
console.log(JSON.stringify({version:'v6.3',relief:COOPERATION_RELIEF,randomChecks,baselineChecks,oncePerFloor:true,levelsDoNotStack:true,swapBeforeArrival:true,forecastFailures:0}));
