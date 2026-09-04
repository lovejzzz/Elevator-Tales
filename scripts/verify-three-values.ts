import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PASSENGER_ORDER } from '../lib/game-data';
import { AGITATION_CAPACITY, ENERGY_CAPACITY, HIGH_RISK_BONUS, HIGH_RISK_START, INITIAL_ENERGY, OFFER_PRESSURE_STEP, chargeBattery, chargingPlan, initialRun, makeOffers, resolveFloor, riderAgitation, type Rider, type RunState } from '../lib/game-engine';
import { energyForecast, stressForecast } from '../lib/game-forecast';

const rider=(kind:Rider['kind'],id=kind as string,extra:Partial<Rider>={}):Rider=>({kind,id,destination:25,patience:0,boardedAt:1,fareBonus:0,...extra});
const state=(extra:Partial<RunState>={}):RunState=>({...initialRun(),...extra});
const rngFor=(seed:number)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};

assert.deepEqual([INITIAL_ENERGY,ENERGY_CAPACITY,AGITATION_CAPACITY,HIGH_RISK_START,OFFER_PRESSURE_STEP,HIGH_RISK_BONUS],[42,60,6,30,40,8]);
const empty=state();assert.equal(resolveFloor(empty).floor,1);assert.match(resolveFloor(empty).message,/至少接一位/);
assert.equal(resolveFloor(state({cabin:[rider('tourist'),null,null,null,null,null]}),()=>.9).energy,40);

const courierArrival=resolveFloor(state({cabin:[rider('courier','battery',{destination:2}),null,null,null,null,null]}),()=>.9);
assert.equal(courierArrival.energy,41,'Courier consumes 1 rider power and restores 1 on arrival; motor still costs 1');
assert.equal(courierArrival.lastEnergy.sources.find(line=>line.label==='快递员电池包')?.amount,1);

const hot=rider('commuter','hot',{volatile:true,destination:2});
const hotState=state({cabin:[hot,null,null,null,null,null]});const hotResult=resolveFloor(hotState,()=>.9);
assert.equal(riderAgitation(hotState,0).low,1);
assert.equal(hotResult.lastEarnings.sources.find(line=>line.label==='通勤者到站')?.amount,15);
assert.equal(hotResult.lastPressure.delta,0,'arrival relief cancels one visible high-risk point');

const cancelled=state({cabin:[rider('child','child'),rider('nurse','nurse'),null,null,null,null]});
assert.equal(riderAgitation(cancelled,0).low,0,'one adjacent calmer cancels the child point');
const stacked=state({cabin:[rider('commuter','hotter',{volatile:true}),rider('nurse','n1'),null,rider('musician','m1'),null,null]});
assert.equal(riderAgitation(stacked,0).low,0,'two adjacent calmers may stack without creating negative agitation');

const twoArrivals=state({stress:4,cabin:[rider('commuter','a',{destination:2,volatile:true}),rider('courier','b',{destination:2,volatile:true}),null,null,null,null]});
assert.equal(resolveFloor(twoArrivals,()=>.9).lastPressure.delta,1,'two risk points minus one cabin-wide arrival relief');

const offers39=makeOffers(39,initialRun().upgrades,false,rngFor(12));
assert.equal(offers39.filter(r=>r.volatile).length>=1,true);
const offers40=makeOffers(40,initialRun().upgrades,false,rngFor(13));
assert.equal(offers40[0].volatile,true,'floor 40 guarantees one visible high-risk offer');

const shop=state({floor:10,status:'upgrade',coins:100,earned:100,energy:2});
assert.equal(chargingPlan(shop).target,50);assert.equal(chargingPlan(shop).baseline,10);
assert.equal(chargeBattery(shop,20).energy,22);assert.equal(chargeBattery(shop,20).coins,80);

const rng=rngFor(812091);let transitions=0;
for(let i=0;i<4000;i++){
  const floor=1+Math.floor(rng()*140),run=state({floor,energy:1+Math.floor(rng()*60),stress:Math.floor(rng()*6),coins:100,earned:100});
  run.cabin=Array.from({length:6},(_,slot)=>rng()<.38?null:rider(PASSENGER_ORDER[Math.floor(rng()*PASSENGER_ORDER.length)],`r${i}-${slot}`,{destination:floor+1+Math.floor(rng()*5),boardedAt:floor-1,volatile:rng()<.35,fuse:1+Math.floor(rng()*5),copySeed:i+slot}));
  if(!run.cabin.some(Boolean))run.cabin[0]=rider('commuter',`forced-${i}`,{destination:floor+2});
  const pressure=stressForecast(run),energy=energyForecast(run),after=resolveFloor(run,rngFor(i+99));
  assert.ok(after.lastEnergy.delta>=energy.lowDelta&&after.lastEnergy.delta<=energy.highDelta);assert.ok(after.lastPressure.delta>=pressure.lowDelta&&after.lastPressure.delta<=pressure.highDelta);
  assert.ok(!after.lastPressure.sources.some(s=>/拥挤|疲劳|班次|倍率/.test(s.label)));
  transitions++;
}
const ui=readFileSync(new URL('../components/elevator-game.tsx',import.meta.url),'utf8');
assert.ok(ui.includes('本班失败'));assert.ok(ui.includes('至少接1人'));assert.ok(!ui.includes('人物躁动 ×2'));assert.ok(!ui.includes('空驶休整'));
assert.ok(ui.includes('energyPreview.lowDelta <= 0'),'fatal energy warning must use the worst-case forecast');
assert.ok(ui.includes('positiveEnergySummary'),'arrival feedback must preserve positive recharge sources');
console.log(JSON.stringify({version:'v8.18',transitions,threeValues:true,deterministicAgitation:true,mandatoryRider:true,courierRecharge:true}));
