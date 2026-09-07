import assert from 'node:assert/strict';
import * as E from '../lib/game-engine';
import * as D from '../lib/game-data';
import * as S from '../lib/shop-effects';
import {planPlacement} from '../lib/game-interaction';
import {energyForecast} from '../lib/game-forecast';
import {translateGameText} from '../lib/i18n';
import {V837_PAIRS} from '../lib/i18n-v837';
const rngFor=(seed:number)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const rider=(kind:D.PassengerKind,id=kind as string,extra:Partial<E.Rider>={}):E.Rider=>({kind,id,destination:9,boardedAt:1,patience:0,fareBonus:0,...extra});
let checks=0;
function test(name:string,fn:()=>void){fn();checks++;console.log('PASS '+name);}
test('two paid moves, free new moves, illegal attempts and next-floor reset',()=>{
 let s={...E.initialRun(),floor:2,upgrades:{...E.EMPTY_UPGRADES,rails:1},cabin:[rider('commuter'),null,null,null,null,null]};
 const first=planPlacement(s,s.cabin[0]!,1);assert(first.ok);s=first.next;assert.equal(E.oldMovesRemaining(s),1);
 s=planPlacement(s,s.cabin[1]!,2).next;assert.equal(E.oldMovesRemaining(s),0);
 assert(!planPlacement(s,s.cabin[2]!,3).ok);assert.equal(E.oldMovesRemaining(s),0);
 const fresh=rider('courier','new',{boardedAt:2});s=planPlacement(s,fresh,3).next;
 assert(planPlacement(s,fresh,4).ok);assert.equal(E.oldMovesRemaining(E.resolveFloor(s,()=>.99)),2);
});
test('optional calm preserves high agitation and cannot produce power or repeat',()=>{
 const start={...E.initialRun(),stress:6};const p=E.previewUpgrade(start,'calm');
 assert.equal(p.stress,6);assert.equal(p.stressCap,9);assert(p.calmCharge);
 const used=E.useCalmCharge(p);assert.equal(used.stress,4);assert.equal(used.energy,p.energy);assert.equal(used.coins,p.coins);assert.equal(E.useCalmCharge(used),used);
 assert.equal(E.useCalmCharge({...p,stress:0}).calmCharge,true);
});
test('insulation matches forecast across every pair; never shields multipliers or creates power',()=>{
 let effective=0;
 for(const a of D.PASSENGER_ORDER)for(const b of D.PASSENGER_ORDER){
  const base={...E.initialRun(),energy:30,cabin:[rider(a,'a'),rider(b,'b'),null,null,null,null]};
  const s={...base,upgrades:{...base.upgrades,insulation:1}},saving=E.totalEnergyCost(base)-E.totalEnergyCost(s);
  assert(saving===0||saving===1);effective+=saving;
  const next=E.resolveFloor(s,()=>.99),forecast=energyForecast(s);
  assert(next.energy-s.energy>=forecast.lowDelta&&next.energy-s.energy<=forecast.highDelta);
 }
 assert(effective>0);console.log({pairCases:D.PASSENGER_ORDER.length**2,effective});
});
test('arrival bonuses are once per floor, after delays, with all three categories',()=>{
 const s={...E.initialRun(),upgrades:{...E.EMPTY_UPGRADES,crowd:1,single:1},cabin:[rider('commuter','a',{destination:2}),rider('drunk','b'),null,null,rider('ghost','c'),null]};
 let out=E.resolveFloor(s,()=>.99);assert.equal(out.lastEarnings.sources.find(x=>x.label==='混乘票')?.amount,3);assert.equal(out.lastEarnings.sources.find(x=>x.label==='单站检票器')?.amount,2);
 const two=structuredClone(s);two.cabin[1]!.destination=2;out=E.resolveFloor(two,()=>.99);assert(!out.lastEarnings.sources.some(x=>x.label==='单站检票器'));
 const delay={...s,floor:2,cabin:[rider('ghost','g'),rider('commuter','a',{destination:3}),null,null,null,null]};out=E.resolveFloor(delay,()=>0);assert(!out.lastEarnings.sources.some(x=>x.label==='单站检票器'));
 assert.equal(S.deliveryUpgradeIncome(s,s.cabin,[]).crowd,0);
});
test('reservations preserve every kind, sealed traits, fuse, seed and remaining trip across shops',()=>{
 for(const kind of D.PASSENGER_ORDER)for(const floor of [8,9,19,39]){
  const s={...E.initialRun(),floor,upgrades:{...E.EMPTY_UPGRADES,reservation:1}};
  const r=rider(kind,'held',{boardedAt:floor,destination:floor+5,fuse:3,copySeed:12345,localFareRatio:.5});
  const held=E.reserveOffer(s,[r],r.id);assert(held!==s);assert(!planPlacement(held,r,0).ok);
  assert.equal(E.reserveOffer(held,[r],r.id),held);
  const next=E.nextOfferBatch({...held,floor:floor+1},rngFor(floor));assert.equal(next.offers.length,3);assert(!next.state.reservedRider);
  assert.deepEqual(next.offers[0],{...r,boardedAt:floor+1,destination:floor+6,calledByLover:false});
  assert.equal(E.reserveOffer(next.state,next.offers,r.id),next.state);
 }
});
test('offer bags cover all twenty, no repeats before each pool exhausts, owned never returns',()=>{
 for(let seed=0;seed<1000;seed++){
  let seen:D.UpgradeKey[]=[],all=new Set<D.UpgradeKey>();const u={...E.EMPTY_UPGRADES};const rng=rngFor(seed);
  // Each group is a separate finite bag.
  for(let shop=0;shop<7;shop++){
   const drawn=E.drawUpgradeOffer(u,seen,rng);assert.equal(drawn.keys.length,3);assert.equal(new Set(drawn.keys).size,3);
   for(const group of E.UPGRADE_GROUPS){const key=drawn.keys.find(k=>group.includes(k));assert(key);if(group.some(k=>!seen.includes(k)))assert(!seen.includes(key));}
   drawn.keys.forEach(k=>all.add(k));seen=drawn.seen;
  }
  assert.equal(all.size,20);u.rails=1;u.reservation=1;u.calm=1;
  for(let n=0;n<5;n++){const drawn=E.drawUpgradeOffer(u,seen,rng);assert(drawn.keys.every(k=>!u[k]));seen=drawn.seen;}
 }
});
test('buffer stores genuine overflow then releases it once; purchased charging cannot fill it',()=>{
 const s={...E.initialRun(),energy:60,upgrades:{...E.EMPTY_UPGRADES,buffer:1},cabin:Array.from({length:6},(_,i)=>rider('courier','c'+i,{destination:2}))};
 const n=E.resolveFloor(s,()=>.99);assert.equal(n.energy,60);assert.equal(n.bufferPower,4);
 const next={...n,cabin:[rider('commuter'),null,null,null,null,null]};const out=E.resolveFloor(next,()=>.99);
 assert.equal(out.energy,60);assert.equal(out.bufferPower,2);assert.equal(energyForecast(next).lowDelta,0);
 const shop={...s,status:'upgrade' as const,energy:58,coins:100};assert.equal(E.chargeBattery(shop,2).bufferPower,undefined);
});
test('soundproof preserves ordinary protection and adds conditional criminal-link protection',()=>{
 assert.equal(S.SHOP_TUNING.soundproofRisk,true);assert.equal(E.UPGRADE_BASE_PRICES.soundproof,24);
 const s={...E.initialRun(),cabin:[rider('ghost'),rider('nurse'),null,null,null,null]};
 const n=E.resolveFloor({...s,upgrades:{...s.upgrades,soundproof:1}},()=>.99);assert.equal(n.stress,0);
 const bad={...s,cabin:[rider('thief'),rider('drunk'),null,null,null,null]};
 assert.equal(E.resolveFloor(bad,()=>.99).stress,E.resolveFloor({...bad,upgrades:{...bad.upgrades,soundproof:1}},()=>.99).stress);
 for(const stress of [3,5,7]){
  const unprotected={...bad,stress},protectedState={...unprotected,upgrades:{...bad.upgrades,soundproof:1}};
  assert.equal(E.redAgitationProtection(protectedState),1);
  assert.equal(E.resolveFloor(unprotected,()=>.99).stress-E.resolveFloor(protectedState,()=>.99).stress,1);
 }
 const quiet={...s,stress:5,upgrades:{...s.upgrades,soundproof:1},cabin:[rider('commuter'),null,null,null,null,null]};
 assert.equal(E.redAgitationProtection(quiet),0);assert.equal(E.resolveFloor(quiet,()=>.99).stress,5);
 const solo={...quiet,cabin:[rider('thief','solo',{volatile:true}),null,null,null,null,null]};assert.equal(E.redAgitationProtection(solo),0);
 assert(!/[\u3400-\u9fff]/.test(translateGameText(D.UPGRADES.soundproof.description,'en')));
});
test('retiming is once per sector, retains fare/fuse and survives undo/reboarding',()=>{
 let s={...E.initialRun(),floor:31,upgrades:{...E.EMPTY_UPGRADES,retime:1},cabin:[rider('bomb','b',{boardedAt:31,destination:33,fuse:3}),null,null,null,null,null]};
 const original=s.cabin[0]!;s=E.retimeRider(s,'b',-1);assert.equal(s.cabin[0]!.destination,32);assert.equal(s.cabin[0]!.fuse,3);
 assert.equal(E.retimeRider(s,'b',1),s);const undone={...s,cabin:Array(6).fill(null)};
 assert.equal(planPlacement(undone,original,2).next.cabin[2]!.destination,32);
});
test('fifth ticket reads seat order and own base; curtain call requires two actual arrivals and at most one remaining rider',()=>{
 const s={...E.initialRun(),punchCount:4,upgrades:{...E.EMPTY_UPGRADES,punchcard:1,finale:1},cabin:[rider('commuter','a',{destination:2}),rider('tourist','b',{destination:2}),null,null,null,null]};
 let n=E.resolveFloor(s,()=>.99);assert.equal(n.lastEarnings.sources.find(x=>x.label==='第五位基价奖励')?.amount,5);assert.equal(n.punchCount,1);assert.equal(n.lastEarnings.sources.find(x=>x.label==='谢幕礼')?.amount,6);
 const swapped={...s,cabin:[s.cabin[1],s.cabin[0],rider('ghost'),null,null,null]};n=E.resolveFloor(swapped,()=>.99);assert.equal(n.lastEarnings.sources.find(x=>x.label==='第五位基价奖励')?.amount,8);assert.equal(n.lastEarnings.sources.find(x=>x.label==='谢幕礼')?.amount,6);
 const twoRemain={...swapped,cabin:[...swapped.cabin]};twoRemain.cabin[3]=rider('commuter','stays',{destination:5});n=E.resolveFloor(twoRemain,()=>.99);assert(!n.lastEarnings.sources.some(x=>x.label==='谢幕礼'));
});
test('delayed fuse uses identical offer draws; gated shop items appear only after their prerequisite floor',()=>{
 let bombs=0;
 for(let seed=0;seed<1000;seed++){
  const a=E.makeOffers(35,E.EMPTY_UPGRADES,false,rngFor(seed)),b=E.makeOffers(35,{...E.EMPTY_UPGRADES,delay:1},false,rngFor(seed));
  a.forEach((r,i)=>{if(r.kind==='bomb'){bombs++;assert.deepEqual(b[i],{...r,fuse:r.fuse!+1});}else assert.deepEqual(r,b[i]);});
  assert(!E.drawUpgradeOffer(E.EMPTY_UPGRADES,[],rngFor(seed),10).keys.includes('crowd'));assert(!E.drawUpgradeOffer(E.EMPTY_UPGRADES,[],rngFor(seed),20).keys.includes('delay'));
 }assert(bombs>0);
});
test('floor 69 death reports actual offsets, not gross passenger cost as net loss',()=>{
 const start={...E.initialRun(),floor:68,energy:5,cabin:[null,null,null,rider('ghost','g1',{destination:71}),rider('exorcist','w',{destination:75}),rider('ghost','g2',{destination:70})]};
 assert.equal(E.energySavings(start),1,'two Ghosts cannot save more than passenger consumption');
 assert.equal(E.totalEnergyCost(start),6,'motor is not offset');
 const lost=E.resolveFloor(start,()=>.99);
 assert.equal(lost.status,'lost');assert.equal(lost.energy,-1);
 assert.equal(lost.lastEnergy.delta,-6);
 const text=E.failureLesson(lost);
 assert(text.includes('总扣电 7（运转 6、人物与红线 1）'));
 assert(text.includes('抵消与回电 +1；净变化 -6'));
 assert(!/[\u3400-\u9fff]/.test(translateGameText(text,'en')));
 assert(E.failureLesson({...lost,reserveCell:true}).includes('未使用的应急电池'));
 assert(D.PASSENGERS.exorcist.short.includes('不抵运转'));
});
test('all upgrade descriptions and new interface text translate',()=>{for(const [zh] of V837_PAIRS)assert(!/[\u3400-\u9fff]/.test(translateGameText(zh,'en')),zh);});
console.log(JSON.stringify({version:'8.37',checks,limits:'Deterministic fixtures and offer coverage, not human balance or full games.'}));
