import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {E,D,type Rider,type RunState} from './game.mts';
import {rider} from './fixtures.mts';
import {manifest,writeNew,rngFor,quantile} from './util.mts';

// Designed public-state counterfactuals, NOT a player policy or a win-rate test.
// No source/catalog overrides, new offers, reseating, shopping or future knowledge.
const before=manifest();
function play(cabin:Array<Rider|null>,stress:number,focus='focus'){
 let state:RunState={...E.initialRun(),floor:31,energy:60,stress,cabin:structuredClone(cabin)};
 const steps=[];
 while(state.status==='playing'&&state.cabin.some(r=>r?.id===focus)&&steps.length<8){
  const prior=state;
  state=E.resolveFloor(state,()=>.99);
  steps.push({floor:state.floor,departureAgitation:prior.stress,agitation:state.stress,energy:state.energy,coins:state.coins,
   earnings:state.lastEarnings.sources,energySources:state.lastEnergy.sources,pressure:state.lastPressure.sources,
   riders:state.cabin.map(r=>r?{kind:r.kind,remaining:r.destination-state.floor,fuse:r.fuse}:null)});
 }
 const motor=steps.reduce((n,s)=>n-s.energySources.filter(l=>l.label==='电梯运转').reduce((n,l)=>n+l.amount,0),0);
 const energyUsed=60-state.energy;
 return {status:state.status,delivered:!state.cabin.some(r=>r?.id===focus),steps:steps.length,coins:state.coins,
  energyUsed,motor,nonMotorEnergy:energyUsed-motor,agitation:state.stress,
  // A bookkeeping conversion at the fixed shop price, NOT a utility/fun score.
  cashMinusNonMotorReplacement:state.coins-E.CHARGE_PRICE*(energyUsed-motor),trace:steps};
}
const supports=['none','coach','nurse','courier','celebrity','thief'] as const;
type Result=ReturnType<typeof play>;
type Ordinary={support:typeof supports[number];stress:number;trip:number}&Record<'commuter'|'tourist',Result>;
const ordinary:Ordinary[]=[];
for(const support of supports)for(let stress=0;stress<8;stress++)for(const trip of [4,5]){
 const variants=Object.fromEntries((['commuter','tourist'] as const).map(kind=>{
  const cabin:Array<Rider|null>=Array(6).fill(null);cabin[0]=rider(kind,'focus',31,trip,false,false);
  if(support!=='none')cabin[1]=rider(support,'support',31,Math.min(trip,D.PASSENGERS[support].trip[1]),false,false);
  return [kind,play(cabin,stress)];
 })) as Record<'commuter'|'tourist',ReturnType<typeof play>>;
 ordinary.push({support,stress,trip,...variants});
}
const partners=['thief','drunk','child','bomb','thief+bomb'] as const;
type Control={partner:typeof partners[number];stress:number;trip:number;guardTrip:number;volatile:boolean}&Record<'none'|'cop'|'nurse',Result>;
const control:Control[]=[];
for(const partner of partners)
 for(let stress=0;stress<8;stress++)for(const trip of [3,5])for(const guardTrip of [1,3,5])for(const volatile of [false,true]){
  const variants=Object.fromEntries((['none','cop','nurse'] as const).map(guard=>{
   const cabin:Array<Rider|null>=Array(6).fill(null);
   cabin[0]=rider(partner==='thief+bomb'?'thief':partner,'focus',31,trip,volatile,false);
   if(guard!=='none')cabin[1]=rider(guard,'guard',31,guardTrip,false,guardTrip===1);
   if(guard!=='none'&&guardTrip===1)cabin[1]!.boardedAt=29;
   // A triangle is impossible in this cabin: 0 and 3 link, guard 1 only controls 0.
   // Put the second risk at 2 instead: guard 1 controls both, but they do not link.
   if(partner==='thief+bomb')cabin[2]=rider('bomb','second',31,trip,false,false);
   return [guard,play(cabin,stress)];
  })) as Record<'none'|'cop'|'nurse',ReturnType<typeof play>>;
  control.push({partner,stress,trip,guardTrip,volatile,...variants});
 }
const bombs:Array<{trip:number;fuse:number;express:boolean;actualTrip:number}&Result>=[];
for(let trip=2;trip<=6;trip++)for(let fuse=3;fuse<=6;fuse++)for(const express of [false,true]){
 const actualTrip=E.expressTrip(trip,Number(express));
 const cabin:Array<Rider|null>=Array(6).fill(null);
 cabin[0]={...rider('bomb','focus',31,actualTrip,false,false),fuse};
 const result=play(cabin,0);
 assert.equal(result.delivered,actualTrip<=fuse);
 assert.equal(result.status==='lost',actualTrip>fuse);
 bombs.push({trip,fuse,express,actualTrip,...result});
}
// Early Commuter departures are a real benefit; this is deliberately NOT a
// same-horizon comparison. Explicitly retain free-seat time and motor cost.
const shortTrips=(['commuter','tourist'] as const).flatMap(kind=>{
 const [min,max]=D.PASSENGERS[kind].trip;
 return Array.from({length:max-min+1},(_,i)=>{
  const cabin:Array<Rider|null>=Array(6).fill(null);cabin[0]=rider(kind,'focus',31,min+i,false,false);
  return {kind,trip:min+i,...play(cabin,0)};
 });
});
// Supply-only diagnostic: empty cabin, no Lover call, ordinary opening,
// all floors sampled. This does not model survival, uptake, or an actual run.
const introduction:Array<{seed:number;first:number|null}>=[];
for(let seed=0;seed<1000;seed++){
 const rng=rngFor(83296001+seed*101);let first:number|null=null;
 for(let floor=36;floor<=100;floor++){
  const offers=E.makeOffers(floor,E.EMPTY_UPGRADES,false,rng,[]);
  if(first===null&&offers.some(r=>r.kind==='mimic'))first=floor;
 }
 introduction.push({seed:83296001+seed*101,first});
}
const safe=(r:ReturnType<typeof play>)=>r.delivered&&r.status!=='lost';
const summary={
 ordinary:supports.map(support=>{
  const rows=ordinary.filter(c=>c.support===support),both=rows.filter(c=>safe(c.commuter)&&safe(c.tourist));
  return {support,cases:rows.length,bothDelivered:both.length,
   touristMoreCoins:both.filter(c=>c.tourist.coins>c.commuter.coins).length,
   commuterMoreCoins:both.filter(c=>c.commuter.coins>c.tourist.coins).length,
   touristMoreEnergy:both.filter(c=>c.tourist.energyUsed>c.commuter.energyUsed).length,
   commuterOnlySafe:rows.filter(c=>safe(c.commuter)&&!safe(c.tourist)).length,
   touristOnlySafe:rows.filter(c=>safe(c.tourist)&&!safe(c.commuter)).length};
 }),
 control:['thief','drunk','child','bomb','thief+bomb'].map(partner=>{
  const rows=control.filter(c=>c.partner===partner),both=rows.filter(c=>safe(c.cop)&&safe(c.nurse));
  return {partner,cases:rows.length,bothDelivered:both.length,
   copOnlySafe:rows.filter(c=>safe(c.cop)&&!safe(c.nurse)).length,
   nurseOnlySafe:rows.filter(c=>safe(c.nurse)&&!safe(c.cop)).length,
   nurseMoreCoins:both.filter(c=>c.nurse.coins>c.cop.coins).length,
   copMoreCoins:both.filter(c=>c.cop.coins>c.nurse.coins).length};
 }),
 bombs:[false,true].map(express=>{
  const rows=bombs.filter(c=>c.express===express),delivered=rows.filter(safe);
  return {express,cases:rows.length,delivered:delivered.length,
   passengerCostAdjustedCashRange:[Math.min(...delivered.map(c=>c.cashMinusNonMotorReplacement)),Math.max(...delivered.map(c=>c.cashMinusNonMotorReplacement))]};
 }),
 mimicIntroduction:{samples:introduction.length,unseenBy60:introduction.filter(c=>c.first===null||c.first>60).length,
  unseenBy100:introduction.filter(c=>c.first===null).length,
  observedFirstFloorQuantiles:[.1,.5,.9].map(q=>({q,floor:quantile(introduction.flatMap(c=>c.first===null?[]:[c.first]),q)}))}
};
assert.equal(ordinary.length,96);assert.equal(control.length,480);assert.equal(bombs.length,40);
assert.deepEqual(manifest(),before);
writeNew(resolve(process.argv[2]),{manifest:before,summary,ordinary,control,bombs,shortTrips,introduction,
 limitations:[
  '1680 fixed-action fixture executions (192 ordinary, 1440 control, 40 Bomb, 8 natural-trip). Counts are coverage, not occurrence frequencies or human win rates.',
  'Volatile focus riders only in the control suite. No upgrades (except Bomb destination compression), future offers, moves, weight-cap competition or optimal play. A guard with one remaining floor is an existing rider; other riders are new. Remaining riders beyond focus delivery are censored.',
  'Agitation is reported, never scored as intrinsically bad. Cash minus replacement power excludes motor, seats, upfront Express cost and future income; it is not profit or dominance.',
  'Ordinary comparison uses only shared legal trip lengths 4 and 5; natural Commuter 2/3-floor turnover is reported separately, not erased.',
  'Bomb safe fraction is exact only for independent uniform base trip 2–6 and fuse 3–6 without Ghost delay or a controller. All failed cases retain losses.',
  'Mimic supply diagnostic uses 1000 new declared seeds and empty cabins, not 1000 played games. No statistical independence claim about the two manual runs.'
 ]});
console.log(JSON.stringify(summary,null,2));
