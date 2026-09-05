import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHARGE_PRICE, initialRun, shiftAgitation, shiftOutlook, resolveFloor, makeOffers, chargeBattery, chargingPlan, dismissalCost, dismissRider, type RunState, type Rider } from '../experiments/v64/lib/game-engine';
import { resolveFloor as oldResolve } from '../experiments/v63/lib/game-engine';
import { energyForecast, stressForecast } from '../experiments/v64/lib/game-forecast';
import { metricChanges } from '../experiments/v64/lib/metric-feedback';
import { planPlacement } from '../experiments/v64/lib/game-interaction';

const seeded=(seed:number)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const rider=(id:string,kind:Rider['kind']='commuter',destination=20):Rider=>({id,kind,destination,patience:12,boardedAt:15,fareBonus:0});
assert.equal(initialRun().energy,20);assert.equal(initialRun().energyCap,24);assert.equal(CHARGE_PRICE,3);
assert.deepEqual(Array.from({length:10},(_,i)=>shiftAgitation(i+1,6)),Array(10).fill(0));
assert.deepEqual(Array.from({length:10},(_,i)=>shiftAgitation(i+11,4)),[0,0,0,1,1,1,5,5,5,0]);
assert.deepEqual([49,50,51,54,57,59,60,90,91,94,97].map(f=>shiftAgitation(f,4)),[5,0,1,2,6,6,1,1,2,3,7]);
for(let floor=1;floor<=2000;floor++)for(let count=0;count<=6;count++)for(let rests=0;rests<=3;rests++){
 const expected=floor<=10||count===0&&rests>0?0:Math.floor((floor-11)/40)+(floor%10>=7?5:floor%10>=4?1:0);
 assert.equal(shiftAgitation(floor,count,rests),expected);
}
assert.match(shiftOutlook(1),/17–19/);assert.match(shiftOutlook(16),/高压还剩3站.*\+5/);
assert.match(shiftOutlook(18),/高压还剩1站/);assert.match(shiftOutlook(19),/补给/);assert.match(shiftOutlook(20),/27–29/);assert.match(shiftOutlook(56),/\+6/);
// An actionable crisis: one legal move reconnects an arriving lover and saves
// the cabin. No free recovery or random rescue is inserted by the game.
const a=rider('a','lover',17),b=rider('b','lover',20);
const threatened:RunState={...initialRun(),floor:16,stress:12,coins:100,earned:100,upgrades:{...initialRun().upgrades,battery:1},cabin:[a,null,b,null,null,null]};
assert.equal(resolveFloor(threatened,()=>.9).status,'lost');
const paired=planPlacement(threatened,b,1);assert.ok(paired.ok);
const escaped=resolveFloor(paired.next,()=>.9);assert.equal(escaped.status,'playing');assert.equal(escaped.stress,12);
assert.equal(escaped.lastPressure.sources.find(s=>s.label==='默契契约 · 协作送达')?.amount,-3);
// Paid sacrifice can also save a peak: two ejections remove full-cabin crowding.
const crowded:RunState={...initialRun(),floor:16,stress:9,coins:100,earned:100,cabin:Array.from({length:6},(_,i)=>rider('r'+i))};
assert.equal(resolveFloor(crowded,()=>.9).status,'lost');
const trimmed=dismissRider(dismissRider(crowded,'r0'),'r1');
assert.equal(trimmed.coins,100-2*dismissalCost(crowded,crowded.cabin[0]!));assert.equal(trimmed.earned,100);
assert.equal(resolveFloor(trimmed,()=>.9).status,'playing');assert.equal(resolveFloor(trimmed,()=>.9).stress,14);
let rest:RunState={...initialRun(),floor:16,stress:10};
for(const expected of [9,8,7]){rest=resolveFloor(rest,()=>.9);assert.equal(rest.stress,expected);}
assert.equal(rest.restStops,0);assert.equal(resolveFloor(rest,()=>.9).stress,6,'shop phase does not reset agitation');
const exhausted={...initialRun(),floor:16,stress:10,restStops:0};
assert.equal(resolveFloor(exhausted,()=>.9).stress,14,'no fourth free rest');
const shop:RunState={...initialRun(),floor:10,status:'upgrade',energy:2,coins:100,earned:100};
assert.deepEqual(chargingPlan(shop),{target:22,units:20,cost:60,baseline:20});
assert.equal(chargeBattery(shop,20).coins,40);assert.equal(chargeBattery({...shop,coins:59},20).energy,2);
assert.equal(chargeBattery({...shop,coins:3},1).coins,0);assert.equal(chargeBattery({...shop,coins:2},1).energy,2);
assert.equal(chargeBattery({...shop,energy:24},1).energy,24);

const random=seeded(97108443);let checks=0;
for(let i=0;i<20000;i++){
 const floor=1+Math.floor(random()*1000),before:RunState={...initialRun(),floor,energy:1+Math.floor(random()*24),coins:200,earned:200,restStops:i%4,stress:Math.floor(random()*20),upgrades:{...initialRun().upgrades,battery:i%4,calm:i%3}};
 before.stressCap=15+before.upgrades.calm*3;
 before.cabin=Array.from({length:6},(_,slot)=>random()<.25?null:{...makeOffers(floor,before.upgrades,false,random)[0],id:'r'+i+'-'+slot,boardedAt:floor-1,patience:1+Math.floor(random()*12)});
 for(let sample=0;sample<2;sample++){
  const seed=970611+i*13+sample,encoded=JSON.stringify(before),after=resolveFloor(before,seeded(seed)),old=oldResolve({...before, shop: []},seeded(seed));
  assert.equal(JSON.stringify(before),encoded);
  for(const key of ['energy','energyCap','coins','earned','cabin','restStops','upgrades'] as const)assert.deepEqual(after[key],old[key],'role effects must remain unchanged: '+key);
  const oldPressure=old.lastPressure.sources.find(s=>s.label==='长班疲劳')?.amount??0;
  const expected=before.stress+old.lastPressure.sources.reduce((sum,s)=>sum+s.amount,0)-oldPressure+shiftAgitation(floor+1,before.cabin.filter(Boolean).length,before.restStops);
  assert.equal(after.stress,Math.max(0,expected));
  const p=stressForecast(before),e=energyForecast(before);assert.ok(after.lastPressure.delta>=p.lowDelta&&after.lastPressure.delta<=p.highDelta);assert.equal(after.lastEnergy.delta,e.lowDelta);
  for(const metric of metricChanges(before,after,'验证'))assert.equal(metric.sources.reduce((sum,s)=>sum+s.amount,0),metric.delta);
  if(after.status==='lost')assert.ok(after.stress>=after.stressCap||after.energy<=0||after.message.includes('引信'));
  checks++;
 }
}
const ui=readFileSync(new URL('../experiments/v8.31/components/elevator-game.tsx.txt',import.meta.url),'utf8');
assert.ok(ui.includes('shiftOutlook(run.floor)'));assert.ok(ui.includes('run.coins<CHARGE_PRICE'));
assert.ok(!ui.includes('充电每点2金币'));assert.ok(!ui.includes('每过30层增加长班疲劳'));
console.log(JSON.stringify({version:'v6.4',scheduleCases:56000,randomChecks:checks,passengerParity:true,oneMoveEscape:true,paidEjectionEscape:true,chargePrice:CHARGE_PRICE}));
