import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PASSENGER_ORDER, LEGEND_KINDS, UPGRADES, type UpgradeKey } from '../lib/game-data';
import { KEEPSAKE_KEYS } from '../lib/legends';
import { AGITATION_CAPACITY, ENERGY_CAPACITY, HIGH_RISK_BONUS, HIGH_RISK_START, INITIAL_ENERGY, OFFER_PRESSURE_STEP, chargeBattery, chargingPlan, initialRun, makeOffers, resolveFloor, riderAgitation, type Rider, type RunState } from '../lib/game-engine';
import { energyForecast, stressForecast } from '../lib/game-forecast';

const rider=(kind:Rider['kind'],id=kind as string,extra:Partial<Rider>={}):Rider=>({kind,id,destination:25,patience:0,boardedAt:1,fareBonus:0,...extra});
const state=(extra:Partial<RunState>={}):RunState=>({...initialRun(),...extra});
const rngFor=(seed:number)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};

assert.deepEqual([INITIAL_ENERGY,ENERGY_CAPACITY,AGITATION_CAPACITY,HIGH_RISK_START,OFFER_PRESSURE_STEP,HIGH_RISK_BONUS],[50,60,8,17,40,4]);
const empty=state();assert.equal(resolveFloor(empty).floor,1);assert.match(resolveFloor(empty).message,/至少接一位/);
assert.equal(resolveFloor(state({energy:40,cabin:[rider('tourist'),null,null,null,null,null]}),()=>.9).energy,38);

const courierArrival=resolveFloor(state({energy:40,cabin:[rider('courier','battery',{destination:2}),null,null,null,null,null]}),()=>.9);
assert.equal(courierArrival.energy,40,'Courier consumes 1 rider power and restores 2 on arrival, covering self and motor');
assert.equal(courierArrival.lastEnergy.sources.find(line=>line.label==='快递员电池包')?.amount,2);

const hot=rider('commuter','hot',{volatile:true,destination:2});
const hotState=state({cabin:[hot,null,null,null,null,null]});const hotResult=resolveFloor(hotState,()=>.9);
assert.equal(riderAgitation(hotState,0).low,1);
assert.equal(hotResult.lastEarnings.sources.find(line=>line.label==='通勤者到站')?.amount,13,'6 base +4 high-risk premium +3 low-departure bonus (the +1 low-band tip is a separate line)');
assert.equal(hotResult.lastPressure.delta,0,'arrival relief cancels one visible high-risk point');

const cancelled=state({cabin:[rider('child','child'),rider('nurse','nurse'),null,null,null,null]});
assert.equal(riderAgitation(cancelled,0).low,0,'one adjacent calmer cancels the child point');
const stacked=state({cabin:[rider('commuter','hotter',{volatile:true}),rider('nurse','n1'),null,rider('musician','m1'),null,null]});
assert.equal(riderAgitation(stacked,0).low,0,'two adjacent calmers may stack without creating negative agitation');

const twoArrivals=state({stress:4,cabin:[rider('commuter','a',{destination:2,volatile:true}),rider('courier','b',{destination:2,volatile:true}),null,null,null,null]});
assert.equal(resolveFloor(twoArrivals,()=>.9).lastPressure.delta,0,'each arrival relieves one risk point, capped at two per floor');
const threeArrivals=state({stress:2,cabin:[rider('commuter','a',{destination:2,volatile:true}),rider('courier','b',{destination:2,volatile:true}),rider('lawyer','c',{destination:2,volatile:true}),null,null,null]});
assert.equal(resolveFloor(threeArrivals,()=>.9).lastPressure.delta,1,'three arrivals still use the two-point floor cap');

// v9.7: support riders never roll high risk, so check across seeds rather than one fixed draw.
const risky39=Array.from({length:20},(_,i)=>makeOffers(39,initialRun().upgrades,false,rngFor(12+i))).filter(o=>o.some(r=>r.volatile)).length;
assert.ok(risky39>=8,`high-risk offers appear by 39F (${risky39}/20)`);
assert.ok(Array.from({length:40},(_,i)=>makeOffers(39,initialRun().upgrades,false,rngFor(100+i))).flat().every(r=>!r.volatile||!['nurse','inspector','cop','lawyer','mechanic','courier','exorcist'].includes(r.kind)),'support riders are never high risk');
const offers40=makeOffers(40,initialRun().upgrades,false,rngFor(13));
assert(offers40.some(r=>!r.volatile),'every floor retains a non-high-risk offer');

const shop=state({floor:10,status:'upgrade',coins:100,earned:100,energy:2});
// v9.19: shops up to 20F sell power 15% cheaper (1.7 instead of 2 coins at transformer level 0).
assert.equal(chargingPlan(shop).target,50);assert.equal(chargingPlan(shop).baseline,20);assert.equal(chargingPlan(shop).cost,82);
assert.equal(chargeBattery(shop,20).energy,22);assert.equal(chargeBattery(shop,20).coins,66);

const rng=rngFor(812091);let transitions=0;
for(let i=0;i<4000;i++){
  const floor=1+Math.floor(rng()*140),run=state({floor,energy:1+Math.floor(rng()*60),stress:Math.floor(rng()*8),coins:100,earned:100});
  const pool=[...PASSENGER_ORDER,...LEGEND_KINDS];
  run.keepsakes=KEEPSAKE_KEYS.filter(()=>rng()<.3);
  run.box={storage:Math.floor(rng()*4),transformer:Math.floor(rng()*4),motor:Math.floor(rng()*4)};
  run.upgrades={...run.upgrades,...Object.fromEntries((Object.keys(UPGRADES) as UpgradeKey[]).map(k=>[k,rng()<.2?1:0]))};
  run.cabin=Array.from({length:6},(_,slot)=>rng()<.38?null:rider(pool[Math.floor(rng()*pool.length)],`r${i}-${slot}`,{destination:floor+1+Math.floor(rng()*5),boardedAt:floor-1,volatile:rng()<.35,fuse:1+Math.floor(rng()*5),copySeed:i+slot}));
  if(!run.cabin.some(Boolean))run.cabin[0]=rider('commuter',`forced-${i}`,{destination:floor+2});
  const pressure=stressForecast(run),energy=energyForecast(run),after=resolveFloor(run,rngFor(i+99));
  assert.ok(after.lastEnergy.delta>=energy.lowDelta&&after.lastEnergy.delta<=energy.highDelta);assert.ok(after.lastPressure.delta>=pressure.lowDelta&&after.lastPressure.delta<=pressure.highDelta);
  assert.ok(!after.lastPressure.sources.some(s=>/疲劳|班次|倍率/.test(s.label)));
  transitions++;
}
const ui=readFileSync(new URL('../components/elevator-game.tsx',import.meta.url),'utf8');
assert.ok(ui.includes('本班结束')&&ui.includes('result-details'),'compact ending preserves expandable diagnostics');assert.ok(ui.includes('至少接1人'));assert.ok(!ui.includes('人物躁动 ×2'));assert.ok(!ui.includes('空驶休整'));
// v9.17: the warning uses the ascend guard (worst-case forecast; 0 power on arriving at a shop floor is safe, as in settlement).
assert.ok(ui.includes('const energyFatal = risk.fatal'),'fatal energy warning must use the worst-case ascend guard');
{ const guard=readFileSync(new URL('../lib/departure-guard.ts',import.meta.url),'utf8'); assert.ok(guard.includes('energyForecast(state).lowDelta')&&guard.includes('minimumAfterAscent'),'guard uses the worst case and the shop-floor rule'); }
assert.ok(ui.includes('positiveEnergySummary'),'arrival feedback must preserve positive recharge sources');
console.log(JSON.stringify({version:'v9',transitions,threeValues:true,deterministicAgitation:true,mandatoryRider:true,courierRecharge:true,arrivalReliefCap:2}));
