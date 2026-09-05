import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as E from '../experiments/v8.31/lib/game-engine';
import * as F from '../experiments/v8.31/lib/game-forecast';
import * as D from '../experiments/v8.31/lib/game-data';
import * as R from '../experiments/v8.31/lib/rider-profile';
import {activeConnection, planPlacement} from '../experiments/v8.31/lib/game-interaction';
import {riskPartnerships, UPGRADE_SLOTS} from '../experiments/v8.31/lib/shift-rules';
import {offerReveal} from '../experiments/v8.31/lib/offer-reveal';
import {passengerBrief} from '../experiments/v8.31/lib/passenger-presentation';

let seed=831260905;
const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const rider=(kind:E.Rider['kind'],id:string,destination=8):E.Rider=>({kind,id,destination,boardedAt:1,patience:0,fareBonus:0,stash:0,fuse:5});
const checks:string[]=[];
const test=(name:string,fn:()=>void)=>{fn();checks.push(name);};

test('route difficulty is public, deterministic and never changes shop prices',()=>{
 for(const [floor,motor] of [[2,1],[20,1],[21,2],[30,2],[31,3],[41,4],[51,5],[61,6]])assert.equal(E.travelEnergyCost(floor),motor);
 for(const key of Object.keys(D.UPGRADES) as D.UpgradeKey[])for(const floor of [10,60,200])assert.equal(E.upgradePrice(key,floor,0),E.upgradePrice(key,10,0));
 assert.equal(E.CHARGE_PRICE,2);assert.equal(E.SOOTHE_PRICE,8);
});
test('delivery economy: no waiting income for Lovers or Tourists',()=>{
 const s=E.initialRun();s.cabin=[rider('lover','a'),rider('lover','b'),rider('tourist','t'),null,null,null];
 const mid=E.resolveFloor(s,rng);assert.equal(mid.lastEarnings.total,0);
 assert.equal(E.arrivalFare(s.cabin[0]!,s.cabin,0,1),11);
 assert.equal(E.arrivalFare(s.cabin[2]!,s.cabin,2,1),12);
});
test('controlled thief and calmed drunk no longer create passive cash',()=>{
 const s=E.initialRun();s.cabin=[rider('thief','t'),rider('cop','p'),null,rider('nurse','n'),rider('drunk','d'),null];
 assert.equal(E.resolveFloor(s,rng).lastEarnings.total,0);
});
test('risk bonus is outside multipliers; agitation appetite remains compatible with care',()=>{
 const s=E.initialRun();s.stress=3;s.cabin=[rider('nurse','n'),{...rider('drunk','d',2),volatile:true},rider('coach','c'),null,null,null];
 // 10 base * (1 + 100% appetite + 50% coach) + 4 high risk + 1 Nurse bond.
 assert.equal(E.arrivalFare(s.cabin[1]!,s.cabin,1,1,s.stress),30);
 const next=E.resolveFloor(s,()=>.99);
 assert.equal(next.lastEarnings.sources.find(l=>l.label==='醉汉躁动加价')?.amount,10);
 assert(!riskPartnerships(s.cabin).edges.length);
});
test('bad riders bank rewards once per member, not once per edge; previews do not bank',()=>{
 const s=E.initialRun();s.stressCap=20;s.cabin=[rider('thief','a',4),rider('thief','b',4),rider('drunk','c',4),null,null,null];
 assert.equal(riskPartnerships(s.cabin).agitation,2);
 const original=JSON.stringify(s);F.stressForecast(s);F.energyForecast(s);planPlacement(s,s.cabin[2]!,4);assert.equal(JSON.stringify(s),original);
 const next=E.resolveFloor(s,rng);assert.deepEqual(next.cabin.slice(0,3).map(r=>r?.stash),[2,2,2]);
 assert.equal(next.lastEarnings.sources.filter(l=>l.label==='坏人暂存兑现').length,0);
 assert.equal(next.lastPressure.sources.find(l=>l.label==='坏人链接躁动')?.amount,2);
 assert(activeConnection(s.cabin,0,1));
});
test('simultaneous delivery banks final step and pays each stash exactly once',()=>{
 const s=E.initialRun();s.cabin=[{...rider('thief','a',2),stash:6},{...rider('thief','b',2),stash:6},null,null,null,null];
 const next=E.resolveFloor(s,rng);assert.equal(next.lastEarnings.sources.find(l=>l.label==='坏人暂存兑现')?.amount,16);
 assert(!next.cabin.some(Boolean));assert.equal(s.cabin[0]!.stash,6);
});
test('control breaks partnerships without confiscating already banked rewards',()=>{
 const s=E.initialRun();s.cabin=[{...rider('thief','a'),stash:6},rider('thief','b'),null,rider('cop','p'),null,null];
 assert.equal(riskPartnerships(s.cabin).edges.length,0);
 const next=E.resolveFloor(s,rng);assert.equal(next.cabin[0]!.stash,6);
});
test('dismissals spend cash, forfeit stash, do not soothe; two per sector and reset at shop',()=>{
 let s=E.initialRun();s.floor=8;s.coins=300;s.stress=3;s.cabin=[{...rider('thief','a',15),stash:40},rider('commuter','b',15),rider('commuter','c',15),null,null,null];
 const before=s.coins,cost=E.dismissalCost(s,s.cabin[0]!);s=E.dismissRider(s,'a');assert.equal(s.coins,before-cost);assert.equal(s.stress,3);assert.equal(s.lastEarnings.total,0);
 s=E.dismissRider(s,'b');assert.equal(E.dismissalsRemaining(s),0);assert.equal(E.dismissRider(s,'c'),s);
 s.floor=9;const shop=E.resolveFloor(s,rng);assert.equal(shop.status,'upgrade');assert.equal(E.dismissalsRemaining(shop),2);
});
test('whole cabin shares one old-rider move; new offers can be withdrawn without a dismissal',()=>{
 const s=E.initialRun();s.floor=3;s.cabin=[rider('commuter','a'),null,null,null,null,null];
 const moved=planPlacement(s,s.cabin[0]!,1);assert(moved.ok);assert(moved.next.swapped);assert(!planPlacement(moved.next,moved.next.cabin[1]!,2).ok);
 const fresh=rider('tourist','new');fresh.boardedAt=3;const placed=planPlacement(moved.next,fresh,4);assert(placed.ok);assert(planPlacement(placed.next,fresh,5).ok);assert.equal(E.dismissalsRemaining(placed.next),2);
});
test('1024 held-upgrade combinations exclude duplicates and enforce four slots',()=>{
 const keys=Object.keys(D.UPGRADES) as D.UpgradeKey[];
 for(let mask=0;mask<1<<keys.length;mask++){
  const upgrades={...E.EMPTY_UPGRADES};keys.forEach((k,i)=>upgrades[k]=(mask>>i)&1);
  const held=Object.values(upgrades).filter(Boolean).length,choices=E.upgradeChoices(upgrades,rng);
  assert.equal(choices.length,held>=UPGRADE_SLOTS?0:Math.min(3,keys.length-held));assert.equal(new Set(choices).size,choices.length);assert(choices.every(k=>!upgrades[k]));
 }
 const s=E.initialRun();s.status='upgrade';s.coins=1000;s.upgrades={...E.EMPTY_UPGRADES,battery:1,solar:1,calm:1,relay:1};s.shop=[{key:'concierge',price:40,purchased:false}];
 assert.equal(E.installUpgrade(s,'concierge'),s);assert.equal(E.availableShopCards(s).length,0);
});
test('minimum repair is atomic, affordable and remains in shop; unaffordable never spends',()=>{
 const s=E.initialRun();s.status='upgrade';s.energy=0;s.stress=7;s.coins=18;
 assert.deepEqual(E.emergencyRepairPlan(s),{energy:1,stress:2,cost:18,affordable:true});
 const next=E.repairEmergency(s);assert.equal(next.status,'upgrade');assert.equal(next.energy,1);assert.equal(next.stress,5);assert.equal(next.coins,0);assert.equal(E.leaveShop(next).status,'playing');
 const poor={...s,coins:17};assert.equal(E.repairEmergency(poor),poor);
});
test('conditional shop bonuses require actual arrivals; dismissals and ghosts cannot farm waiting income',()=>{
 const s=E.initialRun();s.floor=6;s.upgrades.crowd=1;s.upgrades.meter=1;s.cabin=Array.from({length:6},(_,i)=>i<4?rider('commuter','p'+i,8):null);
 assert.equal(E.resolveFloor(s,rng).lastEarnings.total,0);
 s.floor=7;const next=E.resolveFloor(s,rng);
 assert.equal(next.lastEarnings.sources.find(l=>l.label==='共乘票')?.amount,3);assert.equal(next.lastEarnings.sources.find(l=>l.label==='长途计价器')?.amount,16);
 s.upgrades.reinforced=1;assert.equal(E.stabilizedEnergy(s),1);s.cabin[2]=s.cabin[3]=null;assert.equal(E.stabilizedEnergy(s),0);
});
test('Lawyer has a distinct cabin-wide cash-loss protection, never creates money',()=>{
 const s=E.initialRun();s.coins=100;s.cabin=[rider('tourist','t'),rider('thief','s'),null,null,null,rider('lawyer','l')];
 const n=E.resolveFloor(s,rng);assert(!n.lastEarnings.sources.some(l=>l.label==='红线金币损失'));
 s.cabin[5]=null;assert.equal(E.resolveFloor(s,rng).lastEarnings.sources.find(l=>l.label==='红线金币损失')?.amount,-2);
});
test('Inspector remains usable on upper floors by judging controllable load, not motor',()=>{
 for(const floor of [1,31,41,51,61,81]){
  const s=E.initialRun();s.floor=floor;s.cabin[0]=rider('inspector','i',floor+2);
  assert.equal(E.inspectionLoad(s),1);assert.equal(E.riderAgitation(s,0).low,0);
  assert.equal(E.resolveFloor(s,rng).lastEarnings.sources.find(l=>l.label==='检查员合规奖励')?.amount,1);
  s.cabin[1]=rider('tourist','t',floor+2);s.cabin[2]=rider('commuter','c',floor+2);s.cabin[5]=rider('courier','q',floor+2);
  assert.equal(E.inspectionLoad(s),4);assert.equal(E.riderAgitation(s,0).low,1);
 }
});
test('12000 encounter packets unlock gradually, include interaction and retain one ordinary card',()=>{
 for(let i=0;i<12000;i++){
  const floor=1+i%120,offers=E.makeOffers(floor,E.EMPTY_UPGRADES,false,rng),available=E.unlockedAt(floor);
  assert.equal(offers.length,3);assert(offers.every(r=>available.includes(r.kind)));assert(offers.some(r=>!r.volatile));
  let interaction=false;
  for(let a=0;a<3;a++)for(let b=a+1;b<3;b++){
   const pair:Array<E.Rider|null>=[offers[a],offers[b],null,null,null,null];
   interaction ||= activeConnection(pair,0,1)||R.conflictLinks(pair).length>0;
  }
  assert(interaction,'packet without a relationship at '+floor);
  assert.equal(E.unlockedAt(1).length,5);
 }
});
test('special category uses a reveal cue independently of material grade',()=>{
 assert.equal(D.passengerCategory('nurse'),'good');assert.equal(D.passengerCategory('thief'),'bad');assert.equal(D.passengerCategory('mystery'),'special');
 assert.equal(offerReveal([rider('inspector','i')],['inspector']).cue,'rare');
});
test('sealed fares remain hidden from cards and dismissal prices',()=>{
 const s=E.initialRun();s.floor=2;const r=rider('mystery','x');r.traits=R.randomTraits('mystery',E.unlockedAt(40),rng);s.cabin[0]=r;
 const first=passengerBrief(r,2,s.cabin),cost=E.dismissalCost(s,r);r.traits.fare=24;
 assert.equal(first.coins,null);assert.equal(first.expectedFare,null);assert.equal(passengerBrief(r,2,s.cabin).expectedFare,null);assert.equal(E.dismissalCost(s,r),cost);
});
test('12000 mixed settlements match forecast ranges and reconcile every resource line',()=>{
 for(let i=0;i<12000;i++){
  const s=E.initialRun();s.floor=1+i%90;s.energy=E.rand(1,60,rng);s.stress=E.rand(0,5,rng);s.coins=E.rand(0,100,rng);
  s.upgrades.solar=E.rand(0,1,rng);s.upgrades.relay=E.rand(0,1,rng);s.upgrades.tipjar=E.rand(0,1,rng);s.upgrades.reinforced=E.rand(0,1,rng);
  s.cabin=s.cabin.map((_,slot)=>{
   if(slot>0&&rng()<.25)return null;
   const kind=D.PASSENGER_ORDER[E.rand(0,D.PASSENGER_ORDER.length-1,rng)];
   const r=rider(kind,'r'+slot,s.floor+E.rand(1,5,rng));r.boardedAt=Math.max(1,s.floor-4);r.volatile=rng()<.3;r.stash=E.rand(0,8,rng);
   if(kind==='mystery'||kind==='shifter')r.traits=R.randomTraits(kind,E.unlockedAt(50),rng);
   return r;
  });
  const before=JSON.stringify(s),ef=F.energyForecast(s),sf=F.stressForecast(s);assert.equal(JSON.stringify(s),before);
  const next=E.resolveFloor(s,rng);assert.equal(JSON.stringify(s),before);
  assert(next.energy-s.energy>=ef.lowDelta&&next.energy-s.energy<=ef.highDelta,'energy forecast '+i);
  assert(next.stress-s.stress>=sf.lowDelta&&next.stress-s.stress<=sf.highDelta,'stress forecast '+i);
  assert.equal(next.lastEarnings.sources.reduce((n,l)=>n+l.amount,0),next.coins-s.coins);
  assert.equal(next.lastEnergy.sources.reduce((n,l)=>n+l.amount,0),next.energy-s.energy);
  assert.equal(next.lastPressure.sources.reduce((n,l)=>n+l.amount,0),next.stress-s.stress);
 }
});
test('UI wires minimum rescue and uses category independently from rarity',()=>{
 const ui=readFileSync('experiments/v8.31/components/elevator-game.tsx.txt','utf8');
 assert(ui.includes('repairEmergency(run)'));assert(!ui.includes("upgradeCrisis ? '无力修复"));assert(ui.includes('category-${passengerCategory(offer.kind)}'));
 assert(ui.includes('SOUND_PREFERENCE_KEY'));assert(ui.includes('signedDelta(feedback.coins ?? 0)'));
});
console.log(JSON.stringify({version:'8.31',passed:checks.length,checks,encounterPackets:12000,mixedSettlements:12000,heldUpgradeStates:1024,limits:'Synthetic regression and coverage tests; not human enjoyment or win-rate calibration.'},null,2));
