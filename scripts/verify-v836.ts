import assert from 'node:assert/strict';
import {makeOffers,initialRun,UPGRADE_BASE_PRICES,upgradePrice,expressTrip,resolveFloor,type Rider} from '../lib/game-engine';
import {JOURNEY_RULES} from '../lib/balance-v832';
import {PASSENGERS} from '../lib/game-data';
import {energyForecast} from '../lib/game-forecast';
assert.deepEqual(UPGRADE_BASE_PRICES,{battery:30,capacity:35,calm:35,concierge:40,reinforced:45,express:45,tipjar:30,relay:30,crowd:40,meter:25});
for(const key of Object.keys(UPGRADE_BASE_PRICES) as (keyof typeof UPGRADE_BASE_PRICES)[])for(const floor of [10,30,60,100])assert.equal(upgradePrice(key,floor,4),UPGRADE_BASE_PRICES[key]);
let cases=0,changed=0;
const enabled=JOURNEY_RULES.localFrom31;
const prorated=JOURNEY_RULES.prorateLocalFare;
try{
 JOURNEY_RULES.prorateLocalFare=false; // Isolate trip/RNG invariants; ticket invariants live in Player Lab.
 for(const floor of [1,10,30,31,32,33,41,60,61,99])for(const express of [0,1])for(let seed=1;seed<=100;seed++){
  const roll=()=>{let n=seed;let calls=0;return {rng:()=>{calls++;n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;},count:()=>calls};};
  const a=roll(),b=roll(),upgrades={...initialRun().upgrades,express};
  JOURNEY_RULES.localFrom31=false;const original=makeOffers(floor,upgrades,false,a.rng);
  JOURNEY_RULES.localFrom31=true;const local=makeOffers(floor,upgrades,false,b.rng);
  assert.equal(a.count(),b.count());
  original.forEach((r,i)=>{
   const got=local[i];
   assert.deepEqual({...got,destination:r.destination},r);
   if(floor<31||Number(r.id.split('-')[1])!==floor%3)assert.equal(got.destination,r.destination);
   else{
    const cap=expressTrip(PASSENGERS[r.kind].trip[0],express);
    assert.ok(got.destination-floor<=cap);
    assert.ok(got.destination<=r.destination);
    if(got.destination!==r.destination)changed++;
   }
  });cases++;
 }
}finally{JOURNEY_RULES.localFrom31=enabled;JOURNEY_RULES.prorateLocalFare=prorated;}
assert.ok(enabled&&changed>0);
// Browser R836-02: departure bands must not be confused with settled agitation.
const rider=(kind:Rider['kind'],id:string,extra:Partial<Rider>={}):Rider=>({kind,id,boardedAt:1,destination:20,patience:0,fareBonus:0,...extra});
for(const [stress,settledStress,fare] of [[2,3,8],[4,5,11]]){
 const s={...initialRun(),floor:4,energy:60,stress,cabin:[rider('tourist','t',{destination:5}),null,rider('mechanic','m',{volatile:true}),null,null,rider('cop','c',{volatile:true})]};
 const next=resolveFloor(s,()=>.99);
 assert.equal(next.stress,settledStress);
 assert.equal(next.lastEarnings.sources.find(l=>l.label==='游客到站')?.amount,fare);
}
assert.match(PASSENGERS.tourist.short,/关门时中躁动/);
assert.match(PASSENGERS.drunk.short,/到站前关门时高躁动/);
for(const [stress,fare] of [[4,10],[5,20]]){
 const s={...initialRun(),floor:4,energy:60,stress,cabin:[rider('drunk','departure-band',{destination:5}),null,null,null,null,null]};
 assert.equal(resolveFloor(s,()=>.99).lastEarnings.total,fare);
}
// Actual ticket browser game: 49 -> 50 survives because the shop gift is
// included BEFORE the loss check, not an inaccessible reward after survival.
const shopEdge={...initialRun(),floor:49,energy:2,stress:6,cabin:[rider('thief','shop-edge',{destination:50,volatile:true}),null,null,null,null,null]};
const shopResult=resolveFloor(shopEdge,()=>.99);
assert.equal(shopResult.status,'upgrade');
assert.equal(shopResult.energy,2);
assert.equal(energyForecast(shopEdge).lowDelta,0);
const terminalEdge={...initialRun(),floor:58,energy:5,stress:4,cabin:[rider('commuter','terminal-edge',{destination:60,volatile:true}),null,null,null,null,null]};
assert.equal(resolveFloor(terminalEdge,()=>.99).status,'lost');
assert.equal(resolveFloor(terminalEdge,()=>.99).energy,-1);
assert.match(PASSENGERS.ghost.short,/3的倍数层.*随机1位邻座.*1站/);
for(const floor of [1,2,3,4,5,6]){
 const s={...initialRun(),floor,energy:60,cabin:[rider('ghost','g'),rider('commuter','c'),null,rider('mechanic','m'),null,null]};
 const next=resolveFloor(s,()=>0);
 assert.equal(next.cabin[1]?.destination,20+Number((floor+1)%3===0));
 assert.equal(next.cabin[3]?.destination,20,'one neighbor, not all neighbors');
}
console.log({v836OfferPairs:cases,shortened:changed,fixedPrices:true,rngAndRiskUnchanged:true});
