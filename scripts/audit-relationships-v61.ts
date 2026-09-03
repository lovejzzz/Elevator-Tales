import assert from 'node:assert/strict';
import { PASSENGERS, PASSENGER_ORDER, ADJACENT, type PassengerKind } from '../lib/game-data';
import { initialRun, resolveFloor, totalWeight, energySavings, dismissRider, type Rider, type RunState } from '../lib/game-engine';
import { BONDS, bondStatus, randomTraits, riderProfile } from '../lib/rider-profile';
import { activeConnection, conflictingConnection, planPlacement } from '../lib/game-interaction';
import { energyForecast, stressForecast } from '../lib/game-forecast';
import { passengerBrief } from '../lib/passenger-presentation';

const seeded=(seed:number)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const round=(n:number)=>Math.round(n*1000)/1000;
function rider(kind:PassengerKind,id:string,floor=1,trip=4,rng=seeded(100)):Rider{
 return {kind,id,boardedAt:floor,destination:floor+trip,patience:12,fareBonus:0,
 fuse:kind==='bomb'?6:undefined,copySeed:kind==='mimic'?Math.floor(rng()*2147483647):undefined,
 traits:kind==='mystery'||kind==='shifter'?randomTraits(kind,PASSENGER_ORDER,rng):undefined};
}
const seats=(entries:Array<[number,Rider]>)=>Array.from({length:6},(_,i)=>entries.find(([slot])=>slot===i)?.[1]??null);
let resolves=0,forecastChecks=0;
function step(state:RunState,rng:()=>number){
 const encoded=JSON.stringify(state),p=stressForecast(state),e=energyForecast(state);
 const next=resolveFloor(state,rng);resolves++;forecastChecks++;
 assert.equal(JSON.stringify(state),encoded);
 assert.ok(next.lastPressure.delta>=p.lowDelta&&next.lastPressure.delta<=p.highDelta);
 assert.equal(next.lastEnergy.delta,e.lowDelta);
 return next;
}
function journey(initial:RunState,steps=4,rng=seeded(100)){
 let state=initial;let conflict=0,delays=0;
 for(let i=0;i<steps&&state.status==='playing';i++){
  const prev=state;state=step(state,rng);
  conflict+=state.lastPressure.sources.filter(s=>s.label==='邻座冲突').reduce((s,v)=>s+v.amount,0);
  state.cabin.forEach(r=>{const before=prev.cabin.find(x=>x?.id===r?.id);if(r&&before)delays+=Math.max(0,r.destination-before.destination);});
 }
 return {coins:state.coins-initial.coins,pressure:state.stress-initial.stress,power:state.energy-initial.energy,
 conflict,delays,remaining:state.cabin.filter(Boolean).length,status:state.status,floor:state.floor,state};
}

// All unordered pairs, including duplicates. Controlled geometry and identical
// initial objects; no offers/shops/reseating. Four-floor observation window.
const pairs=[];
for(let a=0;a<PASSENGER_ORDER.length;a++)for(let b=a;b<PASSENGER_ORDER.length;b++){
 const first=PASSENGER_ORDER[a],second=PASSENGER_ORDER[b];
 const sum={coins:0,pressure:0,power:0,conflict:0,delays:0,remaining:0};let cases=0;
 for(const floor of [1,2,40,41])for(let sample=0;sample<16;sample++){
  const seed=93017+sample*101+a*701+b*131;
  const rng=seeded(seed),left=rider(first,'a',floor,4,rng),right=rider(second,'b',floor,4,rng);
  const base={...initialRun(),floor,energy:24,stress:8,stressCap:100,coins:100,earned:100};
  const near=journey({...base,cabin:seats([[0,left],[1,right]])},4,seeded(seed+8));
  const far=journey({...base,cabin:seats([[0,left],[5,right]])},4,seeded(seed+8));
  for(const k of Object.keys(sum) as Array<keyof typeof sum>)sum[k]+=near[k]-far[k];cases++;
 }
 pairs.push({first,second,names:[PASSENGERS[first].name,PASSENGERS[second].name],cases,
  adjacentMinusSeparated:Object.fromEntries(Object.entries(sum).map(([k,v])=>[k,round(v/cases)]))});
}

// Each distinct three-person roster, all three possible center choices, on
// odd/even arrival floors. Normalize patience/fuse to isolate relationships.
const triples=[];let arrangementChecks=0;
for(let a=0;a<21;a++)for(let b=a+1;b<21;b++)for(let c=b+1;c<21;c++){
 const kinds=[PASSENGER_ORDER[a],PASSENGER_ORDER[b],PASSENGER_ORDER[c]];
 const contexts=[];
 for(const floor of [40,41]){
  const people=kinds.map((k,i)=>rider(k,'person-'+i,floor,1));
  const values=people.map((center,index)=>{
   const sides=people.filter((_,i)=>i!==index);
   const base={...initialRun(),floor,energy:24,stress:8,stressCap:100,cabin:seats([[0,sides[0]],[1,center],[2,sides[1]]])};
   const next=step(base,()=>.9);arrangementChecks++;
   return {center:center.kind,coins:next.coins,pressure:next.stress-base.stress,power:next.energy-base.energy};
  });
  const different=new Set(values.map(v=>[v.coins,v.pressure,v.power].join('/'))).size>1;
  let tradeoff=false;
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++){
   const x=values[i],y=values[j];
   const d=[x.coins-y.coins,y.pressure-x.pressure,x.power-y.power];
   if(d.some(n=>n>0)&&d.some(n=>n<0))tradeoff=true;
  }
  contexts.push({floor,values,different,tradeoff});
 }
 triples.push({kinds,contexts});
}

// Every identity's declared preferences, including randomized profiles, is
// checked on every actual edge. Supporting neighbor suppresses common conflict.
let edgeChecks=0,suppressionChecks=0;
for(const kind of PASSENGER_ORDER.filter(k=>k!=='mimic')){
 const own=rider(kind,'owner'),profile=riderProfile(own);
 for(const [a,b] of ADJACENT){
  const liked=rider(profile.bond.likes[0],'liked'),avoided=rider(profile.bond.avoids[0],'avoided');
  assert.ok(bondStatus(own,seats([[a,own],[b,liked]]),a).supported);edgeChecks++;
  assert.ok(bondStatus(own,seats([[a,own],[b,avoided]]),a).conflict);edgeChecks++;
 }
 const liked=rider(profile.bond.likes[0],'liked'),avoided=rider(profile.bond.avoids[0],'avoided');
 assert.ok(bondStatus(own,seats([[0,own],[1,avoided],[3,liked]]),0).supported);
 assert.equal(bondStatus(own,seats([[0,own],[1,avoided],[3,liked]]),0).conflict,false);suppressionChecks++;
}

// Targeted counterplay, support-expiry, and presentation witnesses.
const thiefTradeoffs=[];
for(const trip of [2,4,6]){
 const t=rider('thief','thief',1,trip),cop=rider('cop','cop',1,trip);
 const base={...initialRun(),energy:24,stress:8,stressCap:100};
 const controlled=journey({...base,cabin:seats([[0,t],[1,cop]])},trip,()=>.9);
 const separate=journey({...base,cabin:seats([[0,t],[5,cop]])},trip,()=>.9);
 thiefTradeoffs.push({trip,coinsControlled:controlled.coins,coinsSeparate:separate.coins,
  pressureControlled:controlled.pressure,pressureSeparate:separate.pressure});
}
const bomb=rider('bomb','bomb',41,6),cop=rider('cop','cop',41,6);bomb.fuse=3;
const bombBase={...initialRun(),floor:41,energy:24,stress:4,stressCap:100};
const supportStays=journey({...bombBase,cabin:seats([[0,bomb],[1,cop]])},6,()=>.9);
const supportLeaves=journey({...bombBase,cabin:seats([[0,bomb],[1,{...cop,destination:42}]])},6,()=>.9);
assert.equal(supportStays.status,'playing');assert.equal(supportLeaves.status,'lost');

const mimicWitnesses:{worseGreen?:unknown;removalOverload?:unknown;hiddenStable?:unknown}={};
let copyCases=0;
for(let seed=0;seed<10000;seed++){
 const m={...rider('mimic','clone'),copySeed:seed};
 const cheap=rider('courier','cheap');
 const two=seats([[0,cheap],[1,m]]);
 const profile=riderProfile(m,two,1);
 if(!mimicWitnesses.worseGreen&&profile.copies[0].field==='fare'){
  const plan=planPlacement({...initialRun(),cabin:seats([[0,cheap]])},m,1);
  mimicWitnesses.worseGreen={seed,baselineFare:10,copiedFare:profile.fare,green:activeConnection(two,0,1),message:plan.next.message};
 }
 const g=rider('ghost','weight-zero'),heavy=rider('coach','heavy'),fill=rider('tourist','fill');
 const original=seats([[0,heavy],[1,m],[2,g],[3,fill],[4,rider('nurse','nurse')],[5,rider('courier','courier')]]);
 const lighter=original.map(r=>r?.id==='weight-zero'?null:r);
 if(!mimicWitnesses.removalOverload&&totalWeight(original)<=10&&totalWeight(lighter)>10){
  const s={...initialRun(),floor:2,coins:100,earned:100,cabin:original};
  const dismissed=dismissRider(s,g.id);
  mimicWitnesses.removalOverload={seed,beforeWeight:totalWeight(original),afterWeight:totalWeight(lighter),
   dismissedWeight:totalWeight(dismissed.cabin),beforeCopy:riderProfile(m,original,1).copies,afterCopy:riderProfile(m,lighter,1).copies};
 }
 const secret=rider('mystery','secret');const secretSeats=seats([[0,secret],[1,m]]);
 const resolved=riderProfile(m,secretSeats,1);
 if(resolved.copies[0].field==='fare'){
  assert.equal(passengerBrief(m,1,secretSeats).coins,null);
  assert.deepEqual(riderProfile(m,secretSeats,1),resolved);
 }
 const reflected=seats([[2,cheap],[1,m]]);
 assert.deepEqual(riderProfile(m,reflected,1),profile);
 copyCases++;
}
assert.ok(mimicWitnesses.worseGreen);assert.ok(mimicWitnesses.removalOverload);

const childComparisons=[];
for(const supported of [false,true])for(const kind of ['child','commuter'] as const){
 const person={...rider(kind,kind,1,4),patience:4+PASSENGERS[kind].patience};
 const care=rider('nurse','care',1,5);
 const state={...initialRun(),energy:24,cabin:seats([[0,person],...(supported?[[1,care] as [number,Rider]]:[])])};
 const result=journey(state,4,()=>.9);
 childComparisons.push({kind,supported,coins:result.coins,remaining:result.remaining,pressure:result.pressure});
}
// A second controlled ghost cannot stack another saving; text currently says
// "each ghost" while the economy intentionally caps ALL saving at one.
const ghosts=seats([[0,rider('ghost','g1')],[1,rider('exorcist','warden')],[2,rider('ghost','g2')]]);
assert.equal(energySavings({...initialRun(),cabin:ghosts}),1);
// Duplicate supports do not accidentally multiply one identity's effect.
const threeLovers=step({...initialRun(),cabin:seats([[0,rider('lover','l1')],[1,rider('lover','l2')],[2,rider('lover','l3')]])},()=>.9);
assert.equal(threeLovers.lastEarnings.sources.find(s=>s.label==='恋人连携')?.amount,3);
const doublePolice=seats([[0,rider('cop','p1')],[1,{...rider('bomb','fuse'),fuse:3}],[2,rider('cop','p2')]]);
assert.equal(step({...initialRun(),cabin:doublePolice},()=>.9).cabin[1]?.fuse,3);
assert.equal(step({...initialRun(),floor:2,cabin:doublePolice},()=>.9).cabin[1]?.fuse,2);
const doubleCoach=seats([[0,rider('coach','coach1')],[1,rider('courier','parcel',1,1)],[2,rider('coach','coach2')]]);
assert.equal(step({...initialRun(),cabin:doubleCoach},()=>.9).lastEarnings.sources.find(s=>s.label==='快递员到站')?.amount,9);
const twoCalmers=seats([[0,rider('musician','music')],[1,rider('drunk','drunk')],[2,rider('nurse','nurse')]]);
const calm=step({...initialRun(),cabin:twoCalmers},()=>0);
assert.equal(calm.lastEarnings.sources.find(s=>s.label==='醉汉安抚')?.amount,1);
assert.ok(!calm.lastPressure.sources.some(s=>s.label==='醉汉闹事'));
const simultaneous=journey({...initialRun(),cabin:seats([[0,rider('lover','l1',1,1)],[1,rider('lover','l2',1,1)]])},1,()=>.9);
assert.equal(simultaneous.coins,32,'both same-floor arrivals retain their pair bonus');
const expires=journey({...initialRun(),cabin:seats([[0,rider('lover','l1',1,2)],[1,rider('lover','l2',1,1)]])},2,()=>.9);
assert.equal(expires.coins,23,'later arrival loses the departed partner bonus');
// Nonadjacent helper false positive is not a rendered-edge failure: the actual
// renderer only asks about ADJACENT pairs.
const remote=seats([[0,rider('commuter','c')],[1,rider('drunk','d1')],[5,rider('drunk','d2')]]);
const helperNonEdge=conflictingConnection(remote,0,5);

const startupUnavailable=PASSENGER_ORDER.filter(k=>['commuter','tourist','courier','mechanic','lover','musician','thief','cop'].includes(k))
 .map(k=>({kind:k,likes:BONDS[k].likes,unavailable:BONDS[k].likes.every(p=>!['commuter','tourist','courier','mechanic','lover','musician','thief','cop'].includes(p))}));
const output={source:'v6.1-service-rest',resolves,forecastChecks,
 pairRosterCount:pairs.length,pairJourneys:pairs.reduce((s,p)=>s+p.cases*2,0),pairResults:pairs,
 tripleRosterCount:triples.length,arrangementChecks,
 triplesWithDifferentOutcomes:triples.filter(t=>t.contexts.some(c=>c.different)).length,
 triplesWithMoneyRiskTradeoff:triples.filter(t=>t.contexts.some(c=>c.tradeoff)).length,
 tripleExamples:triples.filter(t=>t.contexts.some(c=>c.tradeoff)).slice(0,12),
 edgeChecks,suppressionChecks,copyCases,thiefTradeoffs,childComparisons,startupUnavailable,
 supportExpiry:{stays:{floor:supportStays.floor,status:supportStays.status},leaves:{floor:supportLeaves.floor,status:supportLeaves.status}},
 mimicWitnesses,controlledGhostSavings:1,stackingAndSimultaneousArrivalChecks:8,helperNonEdge};
console.log(JSON.stringify(output,null,2));
