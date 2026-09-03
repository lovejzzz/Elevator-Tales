import assert from 'node:assert/strict';
import { PASSENGERS, PASSENGER_ORDER, type PassengerKind } from '../lib/game-data';
import { chargeBattery, chargingPlan, cooperationBonus, dismissRider, dismissalCost, initialRun, installedUpgradeSummary, makeOffers, resolveFloor, totalWeight, upgradeChoices, type Rider } from '../lib/game-engine';
import { BONDS, bondStatus, randomTraits, riderProfile } from '../lib/rider-profile';
import { passengerBrief } from '../lib/passenger-presentation';
import { planPlacement, activeConnection, conflictingConnection } from '../lib/game-interaction';
import { stressForecast, energyForecast } from '../lib/game-forecast';
import { metricChanges } from '../lib/metric-feedback';
let seed=618321;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const rider=(kind:PassengerKind,id=kind as string,overrides:Partial<Rider>={}):Rider=>({kind,id,destination:8,patience:12,boardedAt:1,fareBonus:0,...overrides});
const cabin=(...riders:Rider[])=>Array.from({length:6},(_,i)=>riders[i]??null);
assert.equal(initialRun().energy,20);assert.equal(initialRun().energyCap,24);
const courierArrival=resolveFloor({...initialRun(),cabin:cabin(rider('courier','parcel',{destination:2}))},rng);
assert.equal(courierArrival.energy,18);assert.equal(courierArrival.coins,6);
const shop={...initialRun(),floor:10,status:'upgrade' as const,energy:4,coins:100,earned:100};
assert.deepEqual(chargingPlan(shop),{target:22,units:18,cost:36,baseline:20});
const full=chargeBattery(shop,20);assert.equal(full.energy,24);assert.equal(full.coins,60);assert.equal(full.earned,100);
for(const units of [-1,0,0.5,21,NaN,Infinity])assert.equal(chargeBattery(shop,units),shop);
assert.equal(chargeBattery({...shop,coins:1},1).energy,4);assert.equal(chargeBattery(initialRun(),1).energy,20);
assert.equal(resolveFloor({...initialRun(),floor:9,energy:1},rng).status,'lost');
assert.equal(resolveFloor({...initialRun(),floor:9,energy:2},rng).status,'upgrade');
assert.ok(!upgradeChoices({...initialRun().upgrades,solar:1,express:1},rng).some(k=>k==='solar'||k==='express'));

// Ejection is idempotent and cannot reveal or collect hidden fare.
const mystery=rider('mystery','secret',{traits:{weight:2,fare:37,bond:BONDS.mystery,revision:0}});
const before={...initialRun(),floor:3,coins:60,earned:80,stress:4,cabin:cabin(mystery,rider('commuter'))};
const price=dismissalCost(before,mystery),beforeJSON=JSON.stringify(before);
const after=dismissRider(before,mystery.id);
assert.equal(price,14);assert.equal(after.coins,46);assert.equal(after.earned,80);assert.equal(after.stress,4);assert.equal(after.energy,20);
assert.equal(after.cabin[0],null);assert.equal(after.cabin[1],before.cabin[1]);
assert.equal(dismissRider(after,mystery.id),after);assert.equal(JSON.stringify(before),beforeJSON);
assert.equal(dismissRider({...before,coins:price-1},mystery.id).cabin[0],mystery);
assert.equal(dismissRider({...before,status:'upgrade'},mystery.id).cabin[0],mystery);
assert.equal(dismissRider({...before,floor:1},mystery.id).cabin[0],mystery);
assert.equal(dismissalCost(before,{...mystery,traits:{...mystery.traits!,fare:9}}),price);
assert.ok(!JSON.stringify(metricChanges(before,after,'请离赔偿')).includes('37'));
assert.equal(passengerBrief(mystery,3).coins,null);
const revealed=resolveFloor({...initialRun(),floor:7,cabin:cabin(mystery)},rng);
assert.equal(revealed.coins,37);assert.equal(revealed.lastEarnings.sources[0].label,'神秘人揭晓车费');
assert.equal(passengerBrief(mystery,3).coins,null,'reveal must not mutate the old object');

// Every identity has a mechanically active cooperation and conflict.
for(const kind of PASSENGER_ORDER){
 const own=rider(kind,'own'),liked=rider(BONDS[kind].likes[0],'liked'),avoided=rider(BONDS[kind].avoids[0],'avoided');
 assert.ok(BONDS[kind].likes.length&&BONDS[kind].avoids.length);
 if(kind==='mimic')continue; // Its inherited bond is tested separately below.
 assert.equal(bondStatus(own,cabin(own,liked),0).supported,true,kind);
 assert.equal(activeConnection(cabin(own,liked),0,1),true,kind);
 assert.equal(bondStatus(own,cabin(own,avoided),0).conflict,true,kind);
 assert.equal(conflictingConnection(cabin(own,avoided),0,1),true,kind);
 assert.equal(bondStatus(own,cabin(own,liked,avoided),0).conflict,false);
 const event=resolveFloor({...initialRun(),cabin:cabin(own,avoided)},()=>.9);
 assert.ok(event.lastPressure.sources.some(s=>s.label==='邻座冲突'&&s.amount>=1),kind);
}
const collaborating=rider('commuter','commuter',{destination:2});
const contractRun={...initialRun(),upgrades:{...initialRun().upgrades,battery:2},cabin:cabin(collaborating,rider('courier'))};
assert.equal(cooperationBonus(contractRun),7);
assert.equal(resolveFloor(contractRun,rng).coins,14);
assert.match(installedUpgradeSummary(contractRun,'battery'),/共 \+7/);

// Relationship copy states beneficiary, timing, amount and conditions, and
// follows the current contract/profile rather than hard-coding the base +3.
for(const kind of PASSENGER_ORDER)for(const bonus of [3,5,7]){
 const brief=passengerBrief(rider(kind),1,[],bonus);
 assert.equal(brief.bond.bonus,bonus);
 assert.equal(brief.bond.partners,BONDS[kind].likes.map(k=>PASSENGERS[k].name).join(' / '));
 assert.match(brief.bond.benefit,new RegExp('本人到站额外 \\+'+bonus+' 金币'));
 assert.match(brief.bondRules[0],/到站时.*仍.*相邻/);
 assert.match(brief.bondRules[1],/多个协作邻座不叠加/);
 assert.match(brief.bondRules[2],/偶数层躁动 \+1/);
 assert.match(brief.bondRules[2],/有协作邻座时免除/);
 assert.ok(!brief.rules.join('').includes('避让'));
}
const unupgraded={...initialRun(),cabin:cabin(collaborating,rider('courier'))};
assert.equal(resolveFloor(unupgraded,rng).coins,10,'base fare7 + advertised cooperation3');
const twoPartners=[collaborating,rider('courier','partner1'),null,rider('courier','partner2'),null,null];
assert.equal(resolveFloor({...initialRun(),cabin:twoPartners},rng).coins,10,'bonus does not multiply by partners');
const earlyPartner={...initialRun(),cabin:cabin(rider('commuter','later',{destination:3}),rider('courier','early',{destination:2}))};
assert.equal(resolveFloor(resolveFloor(earlyPartner,rng),rng).lastEarnings.total,7,'departed partner cannot grant cooperation');
const loverPair={...initialRun(),cabin:cabin(rider('lover','l1',{destination:2}),rider('lover','l2',{destination:2}))};
assert.equal(resolveFloor(loverPair,rng).coins,32,'two en-route coins + doubled fares24 + separate generic bonuses6');
const randomBond={...mystery,traits:{...mystery.traits!,bond:BONDS.coach}};
const dynamicBrief=passengerBrief(randomBond,3,[],7);
assert.equal(dynamicBrief.bond.partners,'通勤者 / 快递员');
assert.equal(dynamicBrief.coins,null);
assert.ok(!JSON.stringify(dynamicBrief).includes('37'),'known bonus must not expose the sealed fare');
let inheritedCopies=0;
for(let n=0;n<100;n++){
 const copy=rider('mimic','copy-label',{copySeed:n}),arr=cabin(copy,randomBond);
 if(riderProfile(copy,arr).copies[0]?.field==='bond'){
  assert.equal(passengerBrief(copy,3,arr,5).bond.partners,'通勤者 / 快递员');
  inheritedCopies++;
 }
}
assert.ok(inheritedCopies>0);

// Copy assignment is one unique field per neighbor, stable under reconnection,
// responsive to changed source values, bounded and nonrecursive.
const mimic=rider('mimic','mimic',{copySeed:9282});
const sources=[rider('coach','a'),mystery,rider('nurse','c')];
const adjacent=[sources[0],mimic,sources[1],null,sources[2],null];
const profile=riderProfile(mimic,adjacent,1);
assert.equal(profile.copies.length,3);assert.equal(new Set(profile.copies.map(c=>c.field)).size,3);
assert.deepEqual(riderProfile(mimic,adjacent,1),profile);
const permuted=[sources[1],mimic,sources[2],null,sources[0],null];
assert.deepEqual(riderProfile(mimic,permuted,1),profile);
for(const copy of profile.copies){
 const source=adjacent.find(r=>r?.id===copy.sourceId)!;
 assert.deepEqual(profile[copy.field],riderProfile(source)[copy.field]);
}
const changed=adjacent.map(r=>r?.id===mystery.id?{...r,traits:{...r.traits!,weight:3,fare:39,bond:BONDS.courier}}:r);
const changedCopy=riderProfile(mimic,changed,1),field=profile.copies.find(c=>c.sourceId===mystery.id)!.field;
assert.deepEqual(changedCopy[field],riderProfile(changed[2]!)[field]);
assert.equal(riderProfile(mimic,cabin(mimic),0).copies.length,0);
for(let n=0;n<200;n++){
 const clone={...mimic,copySeed:n},c=cabin(clone,mystery);
 if(riderProfile(clone,c,0).copies[0].field==='fare'){
  assert.equal(riderProfile(clone,c,0).fare,37);assert.equal(passengerBrief(clone,3,c).coins,null);
 }
 const recursive=cabin(clone,rider('mimic','other',{copySeed:n+1}));
 assert.ok(Number.isFinite(totalWeight(recursive)));
}
const shifter=rider('shifter','shifter',{traits:randomTraits('shifter',PASSENGER_ORDER,rng),destination:20});
const shifterBefore={...initialRun(),floor:5,cabin:cabin(shifter)};
const beforeTraits=JSON.stringify(shifter.traits);
const shifterAfter=resolveFloor(shifterBefore,rng).cabin[0]!;
assert.equal(shifterAfter.destination,20);assert.equal(shifterAfter.patience,11);assert.equal(shifterAfter.traits!.revision,1);
assert.equal(JSON.stringify(shifter.traits),beforeTraits);
assert.ok(shifterAfter.traits!.weight>=1&&shifterAfter.traits!.weight<=4&&shifterAfter.traits!.fare>=28&&shifterAfter.traits!.fare<=48);
const uniqueStats=new Set<string>();
for(let n=0;n<100;n++)uniqueStats.add(JSON.stringify(randomTraits('mystery',PASSENGER_ORDER,rng)));
assert.ok(uniqueStats.size>90);

// Randomized full-cabin forecasts and mutation checks include all 21 identities.
for(let n=0;n<5000;n++){
 const floor=1+Math.floor(rng()*200);
 const before={...initialRun(),floor,coins:100,earned:100,stress:Math.floor(rng()*15),cabin:Array.from({length:6},(_,i)=>{
  if(rng()<.2)return null;
  const kind=PASSENGER_ORDER[Math.floor(rng()*PASSENGER_ORDER.length)];
  return rider(kind,'r'+n+'-'+i,{destination:floor+1+Math.floor(rng()*7),patience:1+Math.floor(rng()*10),fuse:kind==='bomb'?1+Math.floor(rng()*5):undefined,traits:kind==='mystery'||kind==='shifter'?randomTraits(kind,PASSENGER_ORDER,rng):undefined,copySeed:Math.floor(rng()*10000)});
 })};
 const encoded=JSON.stringify(before),power=energyForecast(before),pressure=stressForecast(before);
 const after=resolveFloor(before,rng);
 assert.equal(JSON.stringify(before),encoded);
 assert.equal(after.energy-before.energy,power.lowDelta);assert.ok(after.energy<before.energy);
 assert.ok(after.lastPressure.delta>=pressure.lowDelta&&after.lastPressure.delta<=pressure.highDelta,'forecast '+n);
 assert.equal(after.earned-before.earned,after.coins-before.coins);
 for(const change of metricChanges(before,after,'到站'))assert.equal(change.sources.reduce((sum,s)=>sum+s.amount,0),change.delta);
 const offer=makeOffers(floor,before.upgrades,false,rng)[0];
 for(let slot=0;slot<6;slot++){
  const result=planPlacement(before,offer,slot);
  assert.equal(JSON.stringify(before),encoded);
  if(result.ok&&result.changed)assert.ok(totalWeight(result.next.cabin)<=before.weightCap||totalWeight(result.next.cabin)<totalWeight(before.cabin));
 }
}
console.log('V6 verified: initial 20/24, paid charging, all 21 relationship identities, ejection guards/idempotency/no fare leakage, three dynamic riders, nonrecursive stable copy, single-use upgrades, 5,000 complete randomized states and placement/receipt invariants.');
