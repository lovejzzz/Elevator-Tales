import assert from 'node:assert/strict';
import {arrivalFare,initialRun,resolveFloor,sootheAgitation,repairEmergency,type Rider} from '../lib/game-engine';
import {PASSENGER_ORDER,type PassengerKind} from '../lib/game-data';
import {passengerCardSections} from '../lib/passenger-presentation';
import {V835_PAIRS} from '../lib/i18n-v835';
import {translateGameText} from '../lib/i18n';
const rider=(kind:PassengerKind,id:string,destination=2):Rider=>({kind,id,destination,boardedAt:1,patience:3,fareBonus:0});
let cases=0;
for(const a of PASSENGER_ORDER)for(const b of PASSENGER_ORDER)for(const stress of [0,3,5])for(const bonus of [1,3]){
 const cabin=[rider(a,'a',9),rider('tourist','t'),rider(b,'b',9),null,rider('tourist','other',9),null];
 const coaches=Number(a==='coach')+Number(b==='coach');
 const celebs=Number(a==='celebrity')+Number(b==='celebrity');
 assert.equal(arrivalFare(cabin[1]!,cabin,1,bonus,stress),8+4*coaches+6+(stress===3?3:0)+bonus*celebs);
 cases++;
}
for(const stress of [0,3,5]){
 const cabin=[rider('tourist','a'),rider('tourist','b'),null,null,null,null];
 const same=resolveFloor({...initialRun(),stress,cabin},()=>.9);
 assert.equal(same.lastEarnings.total,stress===3?26:20);
 cabin[1]!.destination=3;
 const first=resolveFloor({...initialRun(),stress:0,cabin},()=>.9);
 const second=resolveFloor(first,()=>.9);
 assert.equal(first.lastEarnings.total,10);assert.equal(second.lastEarnings.total,8);
}
for(let stress=0;stress<=12;stress++)for(let coins=0;coins<=80;coins++){
 const s={...initialRun(),status:'upgrade' as const,floor:10,energy:20,stress,coins};
 const n=Math.max(0,stress-s.stressCap+1),cost=n*8;
 assert.equal(sootheAgitation(s,stress),s,'Cannot buy a full clear');
 const next=repairEmergency(s);
 assert.equal(next.stress,n&&coins>=cost?s.stressCap-1:stress);
 assert.equal(next.coins,n&&coins>=cost?coins-cost:coins);
 assert.equal(next.energy,20);
}
for(const kind of PASSENGER_ORDER){
 const low=passengerCardSections(rider(kind,kind),initialRun());
 const high=passengerCardSections(rider(kind,kind),{...initialRun(),floor:60});
 assert.deepEqual(low.green,high.green);assert.deepEqual(low.red,high.red);
}
for(const [zh,en] of V835_PAIRS)assert.equal(translateGameText(zh,'en'),en);
console.log(JSON.stringify({touristCombinationCases:cases,emergencyCases:13*81,simultaneousAndStaggeredArrivals:true,allTargetsVisibleAtEveryFloor:true}));
