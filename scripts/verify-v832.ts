import assert from 'node:assert/strict';
import * as E from '../lib/game-engine';
import * as D from '../lib/game-data';
import * as F from '../lib/game-forecast';
import * as R from '../lib/rider-profile';
import * as B from '../lib/balance-v832';
import { activeConnection, planPlacement } from '../lib/game-interaction';
import { passengerBrief, passengerCardSections } from '../lib/passenger-presentation';
import { riskPartnerships, UPGRADE_SLOTS } from '../lib/shift-rules';

const rider=(kind:E.Rider['kind'],id=kind as string,extra:Partial<E.Rider>={}):E.Rider=>({kind,id,destination:15,boardedAt:1,patience:0,fareBonus:0,...extra});
const state=(extra:Partial<E.RunState>={}):E.RunState=>({...E.initialRun(),...extra});
const checks:string[]=[];
const test=(name:string,fn:()=>void)=>{fn();checks.push(name);};
let seed=832260905;
const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};

test('R04 topology: vertical Celebrity crowding is forecast, fatal, and avoidable for this ascent',()=>{
 // Reconstructed public topology, not hidden-state replay or another full run.
 const s=state({floor:73,energy:36,stress:8,stressCap:9,cabin:[null,
  rider('celebrity','star',{destination:79}),rider('bomb','old',{destination:74,fuse:2,stash:3}),
  rider('ghost','g1',{destination:76}),rider('ghost','g2',{destination:75}),
  rider('bomb','new',{destination:76,fuse:4,stash:3})]});
 const forecast=F.stressForecast(s);
 assert.equal(forecast.lowDelta,1);assert.equal(forecast.highDelta,1);
 const lost=E.resolveFloor(s,()=>.99);
 assert.equal(lost.stress,9);assert.equal(lost.status,'lost');
 assert.match(lost.message,/达到上限/);assert.match(E.failureLesson(lost),/名人只留1位邻座/);
 const without={...s,cabin:s.cabin.map((r,i)=>i===1?null:r)};
 assert.equal(F.stressForecast(without).highDelta,0);
 const safe=E.resolveFloor(without,()=>.99);
 assert.equal(safe.stress,8);assert.equal(safe.status,'playing');
 const coach=rider('coach'),star=rider('celebrity','volatile',{volatile:true});
 assert.equal(E.arrivalFare(star,[star,coach,null,null,null,null],0,1,7),34,'12 base +6 Coach +12 gamble +4 high risk; never total-fare doubling');
});

test('Bomb base14 preserves high-risk premiums, tight linked delivery and expiry safety',()=>{
 assert.equal(D.PASSENGERS.bomb.fare,14);
 assert.deepEqual(D.PASSENGERS.commuter.trip,[2,5],'short-Commuter experiment was not adopted');
 const bomb=rider('bomb','b',{boardedAt:31,destination:33,fuse:3});
 let linked=state({floor:31,energy:60,stress:5,cabin:[bomb,rider('thief','t',{boardedAt:31,destination:33}),null,null,null,null]});
 linked=E.resolveFloor(linked,()=>.99);linked=E.resolveFloor(linked,()=>.99);
 assert.equal(linked.status,'playing');assert.equal(linked.stress,7);assert.equal(linked.coins,37);
 assert.equal(linked.lastEarnings.sources.find(l=>l.label==='坏人暂存兑现')?.amount,12);
 let cared=state({floor:31,energy:60,stress:6,cabin:[{...bomb,volatile:true,destination:34},rider('nurse','n',{boardedAt:31,destination:34}),null,null,null,null]});
 for(let i=0;i<3;i++)cared=E.resolveFloor(cared,()=>.99);
 assert.equal(cared.status,'playing');assert.equal(cared.coins,23,'Bomb14 + volatile4 + Nurse5');
 assert(!cared.cabin.some(Boolean),'expiry on arrival remains safe');
});

test('fixed agitation bands do not move with the loss cap',()=>{
 assert.deepEqual([0,1,2,3,4,5,7,8].map(B.agitationBand),['low','low','low','medium','medium','high','high','high']);
 assert.equal(E.initialRun().stressCap,8);
 const calm=E.previewUpgrade(state({stress:6}),'calm');
 assert.equal(calm.stressCap,9);assert.equal(calm.stress,4);assert.equal(B.agitationBand(calm.stress),'medium');
 for(const cap of [8,9,20])assert.equal(E.agitationThreshold(cap),5);
});
test('motor has a public capped schedule; shops never raise prices',()=>{
 for(const [floor,power] of [[1,1],[10,1],[11,2],[30,2],[31,3],[40,3],[41,4],[50,4],[51,5],[60,5],[61,6],[10000,6]])assert.equal(E.travelEnergyCost(floor),power);
 for(const key of Object.keys(D.UPGRADES) as D.UpgradeKey[])for(const floor of [10,60,10000])assert.equal(E.upgradePrice(key,floor,0),E.upgradePrice(key,10,0));
 const late=state({floor:69,cabin:[rider('ghost'),null,null,null,null,null]});
 assert.equal(E.resolveFloor(late,()=>.9).status,'upgrade','no forced late-floor failure');
});
test('no installed ability converts agitation or arrival relief into power',()=>{
 assert(!('solar' in D.UPGRADES));assert(!('solar' in E.EMPTY_UPGRADES));
 for(const key of Object.keys(D.UPGRADES) as D.UpgradeKey[]){
  const s=state({energy:20,cabin:[rider('commuter','c',{destination:2}),null,null,null,null,null]});
  s.upgrades[key]=1;
  const cold=E.resolveFloor(s,()=>.99),hot=E.resolveFloor({...s,stress:6},()=>.99);
  assert.equal(hot.energy,cold.energy,key+' cannot turn arrival relief into power');
  assert(!hot.lastEnergy.sources.some(line=>/回收/.test(line.label)));
 }
 assert.equal(E.arrivalRegeneration(state({stress:7}),999),0);
 const shop=state({status:'upgrade',stress:6,energy:20,coins:100});
 assert.equal(E.sootheAgitation(shop,4).energy,20);
});
test('repair completes once, pauses without reset, begins saving only next ascent',()=>{
 let s=state({cabin:[rider('mechanic'),null,null,null,null,null]});
 s=E.resolveFloor(s,()=>.99);assert.equal(s.cabin[0]?.repairProgress,1);assert.equal(s.serviceTurns,0);
 s=E.resolveFloor({...s,stress:3},()=>.99);assert.equal(s.cabin[0]?.repairProgress,1);
 s=E.resolveFloor({...s,stress:0},()=>.99);assert(s.cabin[0]?.repairDone);assert.equal(s.serviceTurns,3);
 assert(!s.lastEnergy.sources.some(line=>line.label==='检修运转节能'));
 const before=s.energy;s=E.resolveFloor(s,()=>.99);assert.equal(s.serviceTurns,2);assert.equal(s.energy,before-1);
 assert.equal(s.lastEnergy.sources.find(line=>line.label==='检修运转节能')?.amount,1);
 for(let i=0;i<3;i++)s=E.resolveFloor(s,()=>.99);
 assert.equal(s.serviceTurns,0);assert(s.cabin[0]?.repairDone);
});
test('simultaneous repairs extend to six floors, not strength; delivery retains repair',()=>{
 const cabin=Array.from({length:6},(_,i)=>rider('mechanic','m'+i,{repairProgress:1,destination:2}));
 const s=E.resolveFloor(state({cabin}),()=>.99);
 assert.equal(s.serviceTurns,6);assert(!s.cabin.some(Boolean));
 const resumed={...s,cabin:[rider('courier'),null,null,null,null,null]};
 assert.equal(E.serviceSaving(resumed),1);assert.equal(E.resolveFloor(resumed,()=>.99).serviceTurns,5);
});
test('one Musician beat uses departure band and never stacks or supplies care',()=>{
 for(const [stress,delta] of [[0,2],[1,2],[2,1],[3,0],[4,0],[5,-1],[6,-2],[7,-2]])for(const count of [1,2,6]){
  const s=state({stress,cabin:Array.from({length:6},(_,i)=>i<count?rider('musician','m'+i):null)});
  assert.equal(E.musicAgitation(s),delta);assert.equal(E.resolveFloor(s,()=>.99).stress,stress+delta);
 }
 const s=state({stress:5,cabin:[rider('drunk'),rider('musician'),null,rider('child'),null,null]});
 assert.equal(E.riderAgitation(s,0).low,1);assert.equal(E.riderAgitation(s,3).low,1);
 assert(!activeConnection([rider('commuter'),rider('musician'),null,null,null,null],0,1));
});
test('band preferences are additive and use departure state before arrival relief',()=>{
 const c=rider('commuter'),t=rider('tourist'),d=rider('drunk');
 assert.equal(E.arrivalFare(c,[c,null,null,null,null,null],0,1,0),7);
 assert.equal(E.arrivalFare(c,[c,null,null,null,null,null],0,1,3),5);
 assert.equal(E.arrivalFare(t,[t,null,null,null,null,null],0,1,3),11);
 assert.equal(E.arrivalFare(t,[t,null,null,null,null,null],0,1,5),8);
 assert.equal(E.arrivalFare(d,[d,null,null,null,null,null],0,1,5),20);
 assert.equal(E.arrivalFare(d,[d,null,null,null,null,null],0,1,4),10);
 const s=state({stress:5,cabin:[{...d,destination:2},rider('nurse','n',{destination:2}),null,null,null,null]});
 const next=E.resolveFloor(s,()=>.99);assert.equal(next.stress,3);assert.equal(next.lastEarnings.sources.find(l=>l.label==='醉汉躁动加价')?.amount,10);
 const coached=[c,rider('coach'),null,null,null,null];
 assert.equal(E.arrivalFare(c,coached,0,1,0)-E.arrivalFare(c,coached,0,1,3),2);
});
test('fare multipliers use the rider own base, never compound pairing or control rewards',()=>{
 const coach=rider('coach');
 const lover=rider('lover');
 assert.equal(E.arrivalFare(lover,[lover,coach,null,rider('lover','l2'),null,null],0),9,'base3 + pair3 + ceil(Coach1.5) + bond1');
 const thief=rider('thief');
 assert.equal(E.arrivalFare(thief,[thief,coach,null,rider('cop'),null,null],0),14,'base5 + ceil(Coach2.5) + control5 + bond1');
 const ghost=rider('ghost');
 assert.equal(E.arrivalFare(ghost,[ghost,coach,null,rider('exorcist'),null,null],0),9,'base4 + Coach2 + control2 + bond1');
 const drunk=rider('drunk');
 assert.equal(E.arrivalFare(drunk,[drunk,coach,null,null,null,null],0,1,5),25,'base10 + additive Coach5 and appetite10');
});
test('faster music opens a three-floor Tourist window but interrupts unfinished quiet work',()=>{
 const run=(s:E.RunState,steps:number)=>{for(let i=0;i<steps;i++)s=E.resolveFloor(s,()=>.99);return s;};
 const m=rider('musician','m',{destination:34});
 const t=rider('tourist','t',{destination:34});
 const tourists=run(state({floor:31,stress:0,cabin:[m,t,null,null,null,null]}),3);
 assert.equal(tourists.coins,20);assert.equal(tourists.stress,1);
 const quiet=run(state({floor:31,stress:1,cabin:[{...m,destination:35},rider('inspector','i',{destination:35}),null,null,rider('mechanic','w',{destination:35}),null]}),4);
 assert.equal(quiet.coins,22);assert.equal(quiet.serviceTurns,0);
 const risk=run(state({floor:31,energy:60,stress:2,cabin:[{...m,destination:33},rider('drunk','a',{destination:34}),null,null,rider('drunk','b',{destination:34}),null]}),3);
 assert.equal(risk.status,'playing');assert.equal(risk.stress,7);assert.equal(risk.coins,62);
});
test('two Drunks can earn a high-band bank and narrowly exit together; staying longer is fatal',()=>{
 const pair=[rider('drunk','d1',{destination:14}),rider('drunk','d2',{destination:14}),null,null,null,null];
 let s=state({floor:11,stress:0,cabin:pair});
 s=E.resolveFloor(s,()=>.99);assert.equal(s.stress,3);
 s=E.resolveFloor(s,()=>.99);assert.equal(s.stress,6);
 const overstaying={...s,cabin:s.cabin.map(r=>r?{...r,destination:15}:null)};
 assert.equal(E.resolveFloor(overstaying,()=>.99).status,'lost');
 s=E.resolveFloor(s,()=>.99);assert.equal(s.stress,7);assert.equal(s.status,'playing');
 assert.equal(s.lastEarnings.total,54);assert(!s.cabin.some(Boolean));
});
test('Inspector streak resets before completion but stamp persists; next-step quote matches',()=>{
 let s=state({cabin:[rider('inspector'),null,null,null,null,null]});
 s=E.resolveFloor(s,()=>.99);assert.equal(s.cabin[0]?.quietStreak,1);
 s=E.resolveFloor({...s,stress:3},()=>.99);assert.equal(s.cabin[0]?.quietStreak,0);
 s=E.resolveFloor({...s,stress:0},()=>.99);s.cabin[0]!.destination=s.floor+1;
 const quote=passengerBrief(s.cabin[0]!,s.floor,s.cabin,1,0,1,s.stress).expectedFare;
 const next=E.resolveFloor(s,()=>.99);assert.equal(next.lastEarnings.total,quote);assert.equal(quote,16);
 const stamped=rider('inspector','stamped',{complianceReady:true});
 assert(E.riderAfterWork(stamped,[stamped],0,7).complianceReady);
});
test('Child care accumulates across interruptions; completion on delivery is quoted',()=>{
 let s=state({cabin:[rider('child'),rider('nurse'),null,null,null,null]});
 s=E.resolveFloor(s,()=>.99);assert.equal(s.cabin[0]?.careProgress,1);
 s.cabin[1]=null;s=E.resolveFloor(s,()=>.99);assert.equal(s.cabin[0]?.careProgress,1);
 s.cabin[1]=rider('nurse');s.cabin[0]!.destination=s.floor+1;
 const quote=passengerBrief(s.cabin[0]!,s.floor,s.cabin,1,0,1,s.stress).expectedFare;
 assert.equal(quote,14);assert.equal(E.resolveFloor(s,()=>.99).lastEarnings.total,quote);
});
test('bad links bank once per member, high band improves stash, nursing cannot erase link cost',()=>{
 for(const stress of [3,5]){
  const s=state({stress,cabin:[rider('thief','a'),rider('thief','b'),null,rider('nurse','n1'),rider('nurse','n2'),null]});
  assert.equal(riskPartnerships(s.cabin).agitation,1);assert.equal(E.riderAgitation(s,0).low,0);
  const next=E.resolveFloor(s,()=>.99);assert.equal(next.stress,stress+1);assert.deepEqual(next.cabin.slice(0,2).map(r=>r?.stash),[stress===5?3:2,stress===5?3:2]);
 }
 const s=state({stress:5,cabin:[rider('thief','a'),rider('thief','b'),rider('thief','c'),null,rider('musician'),null]});
 const next=E.resolveFloor(s,()=>.99);assert.deepEqual(next.cabin.slice(0,3).map(r=>r?.stash),[3,3,3]);
 assert.equal(next.lastPressure.sources.find(l=>l.label==='坏人链接躁动')?.amount,2);
 assert.equal(next.lastPressure.sources.find(l=>l.label==='音乐家节拍')?.amount,-1);
});
test('capacity, reserve purchases and use have legal guards; no duplicate permanent abilities',()=>{
 const s=state({floor:10,status:'upgrade',energy:15,coins:100});
 const capacity=E.previewUpgrade(s,'capacity');assert.equal(capacity.energyCap,70);assert.equal(capacity.energy,15);
 const bought=E.buyReserveCell(s);assert(bought.reserveCell);assert.equal(bought.coins,80);assert.equal(bought.energy,15);
 assert.equal(E.buyReserveCell(bought),bought);assert.equal(E.useReserveCell(bought),bought);
 assert.equal(E.buyReserveCell({...s,coins:19}).coins,19);
 const playing=E.leaveShop(bought),used=E.useReserveCell(playing);
 assert.equal(used.energy,23);assert(!used.reserveCell);assert.equal(used.coins,80);assert.equal(E.useReserveCell(used),used);
 assert.equal(E.useReserveCell({...playing,energy:59}).energy,60);
 const full={...playing,energy:60};assert.equal(E.useReserveCell(full),full);
 const keys=Object.keys(D.UPGRADES) as D.UpgradeKey[];
 for(let mask=0;mask<1<<keys.length;mask++){
  const upgrades={...E.EMPTY_UPGRADES};keys.forEach((key,i)=>upgrades[key]=(mask>>i)&1);
  const choices=E.upgradeChoices(upgrades,rng),held=Object.values(upgrades).filter(Boolean).length;
  assert.equal(choices.length,held>=UPGRADE_SLOTS?0:Math.min(3,keys.length-held));
  assert.equal(new Set(choices).size,choices.length);assert(choices.every(key=>!upgrades[key]));
 }
});
test('12000 encounter packets use nineteen roles and supply a real available relationship',()=>{
 assert.equal(D.PASSENGER_ORDER.length,19);assert.equal(E.unlockedAt(1).length,5);
 assert(!D.PASSENGER_ORDER.includes('lawyer'));assert(!D.PASSENGER_ORDER.includes('shifter'));
 for(let i=0;i<12000;i++){
  const floor=1+i%120,offers=E.makeOffers(floor,E.EMPTY_UPGRADES,false,rng);
  assert.equal(offers.length,3);assert(offers.every(r=>E.unlockedAt(floor).includes(r.kind)));assert(offers.some(r=>!r.volatile));
  let relation=false;
  for(let a=0;a<3;a++)for(let b=a+1;b<3;b++){
   for(const [first,second] of [[0,1],[0,3],[3,0]]){
    const cabin:Array<E.Rider|null>=Array(6).fill(null);cabin[first]=offers[a];cabin[second]=offers[b];
    relation ||= activeConnection(cabin,first,second)||R.conflictLinks(cabin).length>0;
   }
  }
  assert(relation,'no packet relationship at '+floor);
 }
});
test('20000 mixed transitions match public forecasts, preserve inputs and reconcile every resource',()=>{
 for(let i=0;i<20000;i++){
  const s=state({floor:1+i%140,stress:E.rand(0,7,rng),energy:E.rand(1,60,rng),coins:E.rand(0,120,rng),serviceTurns:E.rand(0,6,rng),reserveCell:rng()<.5});
  for(const key of ['reinforced','relay','tipjar','crowd','meter'] as const)s.upgrades[key]=Number(rng()<.5);
  s.cabin=Array.from({length:6},(_,slot)=>{
   if(slot>0&&rng()<.3)return null;
   const kind=D.PASSENGER_ORDER[E.rand(0,18,rng)];
   const r=rider(kind,'r'+slot,{destination:s.floor+E.rand(1,5,rng),boardedAt:Math.max(1,s.floor-E.rand(0,6,rng)),volatile:rng()<.3,fuse:E.rand(1,5,rng),copySeed:i+slot,stash:E.rand(0,8,rng),repairProgress:E.rand(0,1,rng),repairDone:rng()<.3,quietStreak:E.rand(0,1,rng),complianceReady:rng()<.3,careProgress:E.rand(0,2,rng)});
   if(kind==='mystery')r.traits=R.randomTraits('mystery',E.unlockedAt(60),rng);
   return r;
  });
  const before=JSON.stringify(s),energy=F.energyForecast(s),stress=F.stressForecast(s);
  planPlacement(s,s.cabin[0]!,5);passengerCardSections(s.cabin[0]!,s);
  const next=E.resolveFloor(s,rng);
  assert.equal(JSON.stringify(s),before,'input mutation at '+i);
  assert(next.energy-s.energy>=energy.lowDelta&&next.energy-s.energy<=energy.highDelta,'energy forecast '+i);
  assert(next.stress-s.stress>=stress.lowDelta&&next.stress-s.stress<=stress.highDelta,'stress forecast '+i);
  assert.equal(next.lastEnergy.sources.reduce((n,l)=>n+l.amount,0),next.energy-s.energy,'energy ledger '+i);
  assert.equal(next.lastPressure.sources.reduce((n,l)=>n+l.amount,0),next.stress-s.stress,'agitation ledger '+i);
  assert.equal(next.lastEarnings.sources.reduce((n,l)=>n+l.amount,0),next.coins-s.coins,'coin ledger '+i);
 }
});
console.log(JSON.stringify({version:'8.32',passed:checks.length,checks,mixedTransitions:20000,encounterPackets:12000,upgradeStates:1024,limits:'Synthetic rules and coverage, not human enjoyment or balance certification.'},null,2));
