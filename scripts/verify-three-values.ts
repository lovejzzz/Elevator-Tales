import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PASSENGER_ORDER } from '../lib/game-data';
import { initialRun, resolveFloor, makeOffers, riderAgitation, passengerEnergy, stabilizedEnergy, energySavings, eventPressureMultiplier, shiftAgitation, chargeBattery, chargingPlan, previewUpgrade, installUpgrade, leaveShop, dismissalCost, dismissRider, upgradeChoices, type Rider, type RunState } from '../lib/game-engine';
import { stressForecast, energyForecast } from '../lib/game-forecast';
import { planPlacement } from '../lib/game-interaction';
import { metricChanges } from '../lib/metric-feedback';
import { BONDS, riderProfile, randomTraits } from '../lib/rider-profile';
import { passengerBrief, passengerFace } from '../lib/passenger-presentation';

const rngFor=(seed:number)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const rider=(kind:Rider['kind'],id=kind as string,extra:Partial<Rider>={}):Rider=>({kind,id,destination:25,patience:0,boardedAt:1,fareBonus:0,...extra});
const state=(extra:Partial<RunState>={}):RunState=>({...initialRun(),...extra});
assert.equal(initialRun().energy,20);assert.equal(initialRun().energyCap,24);
assert.equal(resolveFloor(state(),()=>.9).energy,19);
const tourist=rider('tourist'),child=rider('child');
assert.equal(resolveFloor(state({cabin:[tourist,null,null,null,null,null]}),()=>.9).energy,18);
assert.equal(resolveFloor(state({cabin:[child,null,null,null,null,null]}),()=>.9).lastPressure.sources.find(x=>x.label==='儿童无人照顾')?.amount,1);
assert.equal(resolveFloor(state({stress:10,cabin:[child,null,null,null,null,null]}),()=>.9).lastPressure.sources.find(x=>x.label==='儿童无人照顾')?.amount,2);
assert.equal(resolveFloor(state({cabin:[child,rider('nurse'),null,null,null,null]}),()=>.9).lastPressure.sources.some(x=>x.label==='儿童无人照顾'),false);
assert.equal(resolveFloor(state({cabin:[rider('commuter','patient',{patience:-100}),null,null,null,null,null]}),()=>.9).cabin[0]?.id,'patient','retired timer cannot eject');
assert.equal(planPlacement(state({weightCap:0}),rider('coach'),0).ok,true,'retired weight cap cannot block placement');
const six:RunState=state({weightCap:0,cabin:Array.from({length:6},(_,i)=>rider('coach','heavy'+i))});
assert.equal(passengerEnergy(six),6);assert.equal(resolveFloor(six,()=>.9).energy,13);
assert.equal(resolveFloor(six,()=>.9).lastPressure.sources.some(x=>/载重|超载/.test(x.label)),false);
const stabilized=previewUpgrade(six,'reinforced');assert.equal(stabilizedEnergy(stabilized),1);assert.equal(resolveFloor(stabilized,()=>.9).energy,14);
assert.equal(energySavings(state({cabin:[rider('ghost'),rider('exorcist'),null,null,null,null]})),0,'never free travel');
assert.equal(energySavings(state({cabin:[rider('ghost'),rider('exorcist'),tourist,null,null,null]})),1);
assert.equal(resolveFloor(state({floor:9,energy:1}),()=>.9).status,'upgrade');
assert.equal(resolveFloor(state({floor:8,energy:1}),()=>.9).status,'lost');
assert.equal(resolveFloor(state({floor:9,energy:1,cabin:[tourist,null,null,null,null,null]}),()=>.9).status,'lost');
for(const destination of [2,3]){const after=resolveFloor(state({cabin:[rider('bomb','fuse',{fuse:1,destination}),null,null,null,null,null]}),()=>.9);assert.equal(after.status,destination===2?'playing':'lost');}
const shop=state({floor:10,status:'upgrade',coins:100,earned:100,energy:2,shop:[{key:'reinforced',price:45,purchased:false}]});
assert.equal(chargingPlan(shop).baseline,10);assert.equal(chargingPlan(shop).target,22);
assert.equal(chargeBattery(shop,20).coins,40);assert.equal(chargeBattery(shop,20).energy,22);
for(const n of [0,-1,1.5,NaN,Infinity,23])assert.equal(chargeBattery(shop,n),shop);
assert.equal(installUpgrade(shop,'reinforced').coins,55);
const owned={...shop,upgrades:{...shop.upgrades,reinforced:1}};assert.equal(installUpgrade(owned,'reinforced'),owned);
assert.ok(!upgradeChoices({...shop.upgrades,reinforced:1,solar:1,express:1},()=>.2).includes('reinforced'));
assert.equal(leaveShop({...shop,energy:0}).status,'lost');assert.equal(leaveShop({...shop,stress:15}).status,'lost');
const eject=state({floor:3,coins:100,earned:100,cabin:[tourist,null,null,null,null,null]});
const dismissed=dismissRider(eject,tourist.id);assert.equal(dismissed.coins,100-dismissalCost(eject,tourist));assert.equal(dismissed.earned,100);assert.equal(dismissed.cabin[0],null);assert.equal(dismissRider(dismissed,tourist.id),dismissed);
// Full directed pair/position sweep. Conditions are checked against an explicit
// oracle rather than relying only on the forecast's shared implementation.
let pairs=0;
for(const kind of PASSENGER_ORDER)for(const other of PASSENGER_ORDER)for(let a=0;a<6;a++)for(let b=0;b<6;b++)if(a!==b)for(const floor of [1,2])for(const stress of [0,10]){
 const cabin:Array<Rider|null>=Array(6).fill(null);cabin[a]=rider(kind,'a');cabin[b]=rider(other,'b');
 const run=state({floor,stress,cabin}),m=stress>=10?2:1,even=(floor+1)%2===0;
 const adjacent=[[0,1],[1,2],[3,4],[4,5],[0,3],[1,4],[2,5]].some(([x,y])=>a===x&&b===y||a===y&&b===x);
 const profile=riderProfile(cabin[a]!,cabin,a),bond=profile.bond;
 let expected=even&&adjacent&&!bond.likes.includes(other)&&bond.avoids.includes(other)?m:0;
 if(kind==='thief'&&even&&!(adjacent&&['cop','lawyer'].includes(other)))expected+=m;
 if(kind==='child'&&even&&!(adjacent&&['lover','musician','nurse'].includes(other)))expected+=m;
 if(kind==='inspector'&&even&&passengerEnergy(run)>0)expected+=m;
 if(kind==='nurse'&&even)expected--;
 const random=kind==='drunk'&&!(adjacent&&['musician','nurse'].includes(other))?2*m:0;
 assert.equal(riderAgitation(run,a).low,expected);assert.equal(riderAgitation(run,a).high,expected+random);
 assert.equal(eventPressureMultiplier(run),m);
 pairs++;
}
// Randomized layouts include changing/hidden/copied profiles, arrivals, ghosts,
// intoxicated swaps, lost runs, upgrades and input immutability.
const rng=rngFor(98710231);let transitions=0,mysteries=0,shifters=0,mimics=0;
for(let i=0;i<16000;i++){
 const floor=1+Math.floor(rng()*250),run=state({floor,energy:1+Math.floor(rng()*24),stress:Math.floor(rng()*25),stressCap:15+i%4*3,coins:100,earned:100,restStops:i%4,weightCap:i%2?0:100});
 run.upgrades={...run.upgrades,battery:i%3,solar:i%2,reinforced:i%2,concierge:i%4};
 run.cabin=Array.from({length:6},(_,slot)=>{
  if(rng()<.25)return null;
  const kind=PASSENGER_ORDER[Math.floor(rng()*PASSENGER_ORDER.length)];
  if(kind==='mystery')mysteries++;if(kind==='shifter')shifters++;if(kind==='mimic')mimics++;
  return rider(kind,'r'+slot,{destination:floor+1+Math.floor(rng()*5),boardedAt:floor-1,patience:i%3-1,copySeed:i+slot,fuse:1+Math.floor(rng()*5),traits:['mystery','shifter'].includes(kind)?randomTraits(kind as 'mystery'|'shifter',PASSENGER_ORDER,rng):undefined});
 });
 const before=JSON.stringify(run),pressure=stressForecast(run),energy=energyForecast(run);
 for(let sample=0;sample<3;sample++){
  const after=resolveFloor(run,rngFor(997123+i*11+sample));assert.equal(JSON.stringify(run),before);
  assert.equal(after.lastEnergy.delta,energy.lowDelta);assert.ok(after.lastPressure.delta>=pressure.lowDelta&&after.lastPressure.delta<=pressure.highDelta);
  assert.ok(after.energy<run.energy);assert.ok(after.coins>=0&&after.earned>=after.coins);
  assert.ok(!after.lastPressure.sources.some(s=>/耐心|超载|载重/.test(s.label)));
  assert.ok(after.cabin.every(r=>!r||r.destination>after.floor));
  for(const change of metricChanges(run,after,'test')){assert.ok(['coins','energy','stress'].includes(change.key));assert.equal(change.sources.reduce((s,l)=>s+l.amount,0),change.delta);}
  for(let slot=0;slot<6;slot++){
   const r=run.cabin[slot];if(!r)continue;
   const face=passengerFace(r,run),brief=passengerBrief(r,floor,run.cabin,3,0,eventPressureMultiplier(run));
   assert.ok(!/耐心|载重/.test(JSON.stringify({face,brief})));
   assert.equal(brief.coins,riderProfile(r,run.cabin,slot).hidden?null:riderProfile(r,run.cabin,slot).fare);
   if(r.kind==='mimic'){const p=riderProfile(r,run.cabin,slot);assert.ok(p.copies.length<=3);assert.equal(new Set(p.copies.map(c=>c.field)).size,p.copies.length);assert.ok(p.copies.every(c=>['energy','fare','agitation'].includes(c.field)));}
  }
  transitions++;
 }
}
for(let i=0;i<500;i++){
 const run=state({floor:i+1,upgrades:{...initialRun().upgrades,concierge:2}}),offers=makeOffers(run.floor,run.upgrades,false,rng);
 assert.ok(offers.every(r=>r.patience===0&&r.fareBonus===6));
 for(const r of offers)assert.ok(BONDS[r.kind].likes.length&&BONDS[r.kind].avoids.length);
}
assert.deepEqual(Array.from({length:10},(_,i)=>shiftAgitation(i+11,4)),[0,0,0,1,1,1,5,5,5,0]);
const ui=readFileSync(new URL('../components/elevator-game.tsx',import.meta.url),'utf8');assert.ok(ui.includes('本班失败'));assert.ok(ui.includes('failure-cause'));assert.ok(!ui.includes('data-metric="weight"'));assert.ok(!ui.includes('耐心 {'));
console.log(JSON.stringify({version:'v6.5',pairCases:pairs,randomTransitions:transitions,mysteries,shifters,mimics,noRetiredMechanics:true,forecastErrors:0}));
