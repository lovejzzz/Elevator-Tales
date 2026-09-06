import assert from 'node:assert/strict';
import {makeOffers,initialRun,UPGRADE_BASE_PRICES,upgradePrice,expressTrip} from '../lib/game-engine';
import {JOURNEY_RULES} from '../lib/balance-v832';
import {PASSENGERS} from '../lib/game-data';
assert.deepEqual(UPGRADE_BASE_PRICES,{battery:30,capacity:30,calm:35,concierge:35,reinforced:40,express:35,tipjar:25,relay:25,crowd:30,meter:20});
for(const key of Object.keys(UPGRADE_BASE_PRICES) as (keyof typeof UPGRADE_BASE_PRICES)[])for(const floor of [10,30,60,100])assert.equal(upgradePrice(key,floor,4),UPGRADE_BASE_PRICES[key]);
let cases=0,changed=0;
const enabled=JOURNEY_RULES.localFrom31;
try{
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
    const cap=expressTrip(PASSENGERS[r.kind].trip[0]+1,express);
    assert.ok(got.destination-floor<=cap);
    assert.ok(got.destination<=r.destination);
    if(got.destination!==r.destination)changed++;
   }
  });cases++;
 }
}finally{JOURNEY_RULES.localFrom31=enabled;}
assert.ok(enabled&&changed>0);
console.log({v836OfferPairs:cases,shortened:changed,fixedPrices:true,rngAndRiskUnchanged:true});
