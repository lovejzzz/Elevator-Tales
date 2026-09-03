import assert from 'node:assert/strict';
import { initialRun, resolveFloor, dismissRider, chargeBattery, installUpgrade, leaveShop, makeOffers, totalWeight, type Rider, type RunState } from '../lib/game-engine';
import { stressForecast, energyForecast } from '../lib/game-forecast';
import { planPlacement } from '../lib/game-interaction';
import { metricChanges } from '../lib/metric-feedback';

const rider = (kind: Rider['kind'], overrides: Partial<Rider> = {}): Rider => ({
  id: kind, kind, destination: 46, patience: 8, boardedAt: 41, fareBonus: 0, ...overrides,
});
const cabin = (...riders: Rider[]): RunState['cabin'] => [...riders, ...Array(6 - riders.length).fill(null)];
let bombCases = 0;
// Simultaneous fuse/patience expiry must fail, including the shop threshold.
for (const floor of [41, 42, 49, 61, 79, 81]) for (const stress of [0, 10]) for (const patience of [1, 2]) {
  const state = {...initialRun(), floor, stress, cabin: cabin(rider('bomb', {destination: floor + 3, patience, fuse: 1}))};
  const next = resolveFloor(state, () => .9);
  assert.equal(next.status, 'lost'); assert.match(next.message, /引信/); assert.equal(next.coins, 0);
  bombCases++;
}
let trace: RunState = {...initialRun(), floor:41, stress:10, cabin:cabin(rider('bomb', {patience:6, fuse:3}))};
for(let n=0;n<3;n++) trace=resolveFloor(trace,()=>.9);
assert.equal(trace.floor,44); assert.equal(trace.status,'lost'); assert.match(trace.message,/引信/);
// Reaching the destination exactly as the fuse expires is still safe.
for (const floor of [41,49]) {
  const next=resolveFloor({...initialRun(), floor, stress:10, cabin:cabin(rider('bomb',{destination:floor+1,patience:2,fuse:1}))},()=>.9);
  assert.notEqual(next.status,'lost');assert.ok(next.coins>0);assert.equal(next.cabin[0],null);bombCases++;
}
// Patience can legitimately expire BEFORE the fuse. Police pause applies at
// departure even if the officer leaves on that arrival floor.
const early=resolveFloor({...initialRun(),floor:41,cabin:cabin(rider('bomb',{patience:1,fuse:2}))},()=>.9);
assert.equal(early.status,'playing');assert.equal(early.cabin[0],null);
const paused=resolveFloor({...initialRun(),floor:41,cabin:cabin(rider('bomb',{fuse:1}),rider('cop',{destination:42}))},()=>.9);
assert.equal(paused.cabin[0]?.fuse,1);assert.equal(paused.cabin[1],null);
assert.match(resolveFloor(paused,()=>.9).message,/引信/);
// Uncontrolled ghost can postpone an otherwise safe bomb arrival.
const delayed=resolveFloor({...initialRun(),floor:41,cabin:cabin(rider('bomb',{destination:42,fuse:1}),rider('ghost'))},()=>.9);
assert.match(delayed.message,/引信/);
assert.equal(resolveFloor(trace),trace,'game over is terminal');

let rest: RunState={...initialRun(),floor:81,energy:24,stress:8};
for(const remaining of [2,1,0]){
  const before=rest;rest=resolveFloor(rest,()=>.9);
  assert.equal(rest.restStops,remaining);assert.equal(rest.stress,before.stress-1);
  assert.equal(rest.lastEnergy.delta,-2);
}
const tired=resolveFloor(rest,()=>.9);
assert.equal(tired.restStops,0);assert.equal(tired.stress,rest.stress+1);
assert.ok(tired.lastPressure.sources.some(s=>s.label==='长班疲劳'&&s.amount===2));
const due=resolveFloor({...rest,cabin:cabin(rider('commuter',{destination:rest.floor+1,patience:1}))},()=>.9);
assert.equal(due.restStops,1);assert.equal(due.stress,rest.stress,'occupied trip still incurs fatigue before arrival relief');
assert.equal(resolveFloor(due,()=>.9).restStops,0);
const allDue=resolveFloor({...rest,cabin:Array.from({length:6},(_,i)=>rider('commuter',{id:String(i),destination:rest.floor+1}))},()=>.9);
assert.equal(allDue.restStops,3,'multiple arrivals cannot bank unlimited rest');
const impatient=resolveFloor({...rest,cabin:cabin(rider('commuter',{destination:90,patience:1}))},()=>.9);
assert.equal(impatient.restStops,0,'impatience is not a delivery');
const boarding=planPlacement({...rest,coins:100,earned:100},rider('courier',{boardedAt:rest.floor,destination:90}),0);
assert.ok(boarding.ok);assert.equal(boarding.next.restStops,0);
const dismissed=dismissRider({...boarding.next,floor:rest.floor+1},'courier');
assert.equal(dismissed.cabin[0],null);assert.equal(dismissed.restStops,0);
const shop:RunState={...rest,floor:90,status:'upgrade',coins:1000,earned:1000,energy:10,shop:[{key:'calm',price:35,purchased:false}]};
assert.equal(leaveShop(installUpgrade(chargeBattery(shop,10),'calm')).restStops,0,'shopping cannot reset rest');
assert.match(stressForecast(rest).summary,/休整用尽/);
assert.match(stressForecast({...rest,restStops:1}).summary,/1→0/);
assert.deepEqual(metricChanges(rest,tired,'上行').find(c=>c.key==='stress')?.sources,tired.lastPressure.sources);

let seed=1729061,checked=0;
const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
// Empty cabins, every reserve level and high-floor boundaries are explicitly
// sampled, in addition to fully random 21-character configurations.
for(let n=0;n<5000;n++){
  const state={...initialRun(),floor:1+Math.floor(rng()*180),restStops:n%4,stress:Math.floor(rng()*20),stressCap:24};
  if(n%3!==0)for(let i=0;i<6;i++)if(rng()<.55){
    const r=makeOffers(state.floor,state.upgrades,false,rng)[0];
    state.cabin[i]={...r,id:r.id+i,patience:1+Math.floor(rng()*10)};
  }
  const before=JSON.stringify(state),forecast=stressForecast(state),electricity=energyForecast(state);
  const next=resolveFloor(state,rng);
  assert.equal(JSON.stringify(state),before,'resolution must not mutate source');
  assert.ok(next.restStops>=0&&next.restStops<=3&&Number.isInteger(next.restStops));
  assert.ok(next.lastPressure.delta>=forecast.lowDelta&&next.lastPressure.delta<=forecast.highDelta);
  assert.equal(next.lastEnergy.delta,electricity.lowDelta);
  for(const c of metricChanges(state,next,'上行'))assert.equal(c.sources.reduce((s,l)=>s+l.amount,0),c.delta);
  assert.ok(Number.isFinite(totalWeight(next.cabin)));checked++;
}
console.log(JSON.stringify({bombCollisionAndArrivalCases:bombCases,randomizedTransitions:checked,restBoundaries:true,boardingDismissShopCannotReset:true,forecastsAndReceipts:true}));
