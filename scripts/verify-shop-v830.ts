import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { UPGRADES, PASSENGER_ORDER, type UpgradeKey } from '../experiments/v8.31/lib/game-data';
import * as E from '../experiments/v8.31/lib/game-engine';
import { energyForecast, stressForecast } from '../experiments/v8.31/lib/game-forecast';
import { planPlacement } from '../experiments/v8.31/lib/game-interaction';
import { randomTraits } from '../experiments/v8.31/lib/rider-profile';
import { shopOpportunities, rollShopRewards } from '../experiments/v8.31/lib/shop-effects';
import { experimentalRiskLinks } from '../experiments/v8.31/lib/risk-link-experiment';

const keys = Object.keys(UPGRADES) as UpgradeKey[];
let seed = 904830;
const rng = () => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; };
let serial = 0;
const r = (kind:E.Rider['kind'], destination=8, extra:Partial<E.Rider>={}):E.Rider =>
  ({ id: 'r'+serial++, kind, boardedAt:1, destination, patience:0, fareBonus:0, ...extra });
const s = (cabin:Array<E.Rider|null>, extra:Partial<E.RunState>={}):E.RunState =>
  ({...E.initialRun(), cabin:[...cabin,...Array(6-cabin.length).fill(null)], ...extra});
const line = (run:E.RunState, label:string) => [...run.lastEarnings.sources,...run.lastEnergy.sources,...run.lastPressure.sources].find(l=>l.label===label)?.amount??0;

let shopChecks = 0;
for(let mask=0;mask<2**keys.length;mask++) for(const crisis of [null,'energy','stress','both'] as const) {
  const owned = {...E.EMPTY_UPGRADES};
  keys.forEach((key,i)=>owned[key]=(mask>>i)&1);
  const choices = E.upgradeChoices(owned,rng,crisis);
  assert.equal(choices.length,Math.min(3,keys.filter(k=>!owned[k]).length));
  assert.equal(new Set(choices).size,choices.length);
  choices.forEach(k=>assert.equal(owned[k],0));
  shopChecks++;
}
for(const key of keys) {
  let shop = s([], { status:'upgrade',floor:10,coins:1000,energy:20,stress:5,shop:keys.map(key=>({key,price:E.upgradePrice(key,10,0),purchased:false})) });
  const before=JSON.stringify(shop), bought=E.installUpgrade(shop,key);
  assert.equal(JSON.stringify(shop),before);
  assert.equal(bought.upgrades[key],1); assert.equal(bought.shopUpgradeBought,true);
  assert.equal(bought.coins,shop.coins-E.upgradePrice(key,10,0));
  assert.equal(E.availableShopCards(bought).length,0);
  keys.forEach(other=>assert.equal(E.installUpgrade(bought,other),bought,'one permanent purchase per visit'));
  shop={...bought,shopUpgradeBought:false,shop:[{key,price:1,purchased:false}]};
  assert.equal(E.installUpgrade(shop,key),shop,'stale owned card cannot be bought in another shop');
  assert.equal(E.previewUpgrade(shop,key),shop);
  assert.equal(E.availableShopCards(shop).length,0,'UI must hide stale owned cards');
  assert.equal(E.upgradePrice(key,100,7),E.upgradePrice(key,10,0),'unique abilities have fixed prices');
}
const full = s([], {floor:20,status:'upgrade',coins:100,energy:0,stress:7,shopUpgradeBought:true,
  upgrades:Object.fromEntries(keys.map(k=>[k,1])) as Record<UpgradeKey,number>});
assert.deepEqual(E.upgradeChoices(full.upgrades,rng,'both'),[]);
const repaired=E.chargeBattery(E.sootheAgitation(full,2),1);
assert.equal(E.leaveShop(repaired).status,'playing');
assert.equal(repaired.energy,1,'soothing never fuels the reclaimer');
assert.equal(repaired.stressCap,6);
for(const units of [-1,0,.5,NaN,Infinity,8]) assert.equal(E.sootheAgitation(full,units),full);
assert.equal(E.sootheAgitation({...full,coins:7},1).stress,7);
assert.equal(E.sootheAgitation({...full,status:'playing'},1).stress,7);

const pair=s([r('commuter',2),r('commuter',2),r('commuter',2)],{energy:20,upgrades:{...E.EMPTY_UPGRADES,tipjar:1,relay:1}});
const before=JSON.stringify(pair);
const low=E.resolveFloor(pair,()=>.5),high=E.resolveFloor(pair,()=>.499999);
assert.equal(line(low,'小费盒额外小费'),0); assert.equal(line(high,'小费盒额外小费'),4);
assert.equal(line(low,'并联回充'),0); assert.equal(line(high,'并联回充'),4);
assert.equal(JSON.stringify(pair),before);
assert.equal(high.lastEarnings.total-low.lastEarnings.total,4,'only central rider has two neighbors');
assert.equal(high.energy-low.energy,4,'one relay roll per floor, not per pair or rider');
const pred=energyForecast(pair); assert.equal(pred.lowDelta,-4); assert.equal(pred.highDelta,0);
const ghostOnly=s([r('ghost'),r('courier',3),null,r('nurse')],{floor:2,upgrades:{...E.EMPTY_UPGRADES,relay:1}});
assert.doesNotMatch(energyForecast(ghostOnly).summary,/并联回充50%/,'a Ghost-only recharge range must not imply a relay opportunity');
const risky={...pair,energy:4}; assert.equal(energyForecast(risky).danger,true);
assert.equal(E.resolveFloor(risky,()=>.9).status,'lost');
assert.equal(E.resolveFloor(risky,()=>.1).status,'playing','a successful roll may rescue but never guarantees it');
assert.equal(E.resolveFloor({...pair,energy:60},()=>.1).energy,60);
const coachPair=s([r('coach',2),r('commuter',2,{fareBonus:3,volatile:true}),r('coach',2)],
  {upgrades:{...E.EMPTY_UPGRADES,tipjar:1}});
assert.equal(E.resolveFloor(coachPair,()=>.1).coins-E.resolveFloor(coachPair,()=>.9).coins,4,'bonus is not multiplied');
let draws=0; const counted=()=>{draws++;return .9;};
for(let i=0;i<20;i++){ shopOpportunities(pair,pair.cabin,[0,1,2]); energyForecast(pair); stressForecast(pair); E.previewUpgrade(pair,'solar'); }
assert.equal(draws,0);
rollShopRewards({eligibleTips:3,relay:true},counted); assert.equal(draws,4);
const noArrivals=s([r('commuter'),r('commuter'),r('commuter')],{upgrades:{...E.EMPTY_UPGRADES,tipjar:1,relay:1}});
draws=0; E.resolveFloor(noArrivals,counted); assert.equal(draws,0,'no extra dice on an ineligible floor');
assert.equal(line(E.resolveFloor(s([r('commuter',2)],{upgrades:{...E.EMPTY_UPGRADES,tipjar:1,relay:1}}),()=>0),'并联回充'),0);
const crowd=s([r('commuter'),r('commuter'),r('commuter'),r('commuter')],{upgrades:{...E.EMPTY_UPGRADES,crowd:1,meter:1}});
assert.equal(line(E.resolveFloor(crowd,()=>.9),'共乘票'),3);
assert.equal(line(E.resolveFloor({...crowd,floor:4},()=>.9),'长途计价器'),0);
assert.equal(line(E.resolveFloor({...crowd,floor:5},()=>.9),'长途计价器'),4);
const moved=planPlacement({...crowd,floor:5},crowd.cabin[0]!,5).next;
assert.equal(line(E.resolveFloor(moved,()=>.9),'长途计价器'),4,'reseating does not reset actual ride duration');

const thieves=s([r('thief'),r('thief'),null,r('nurse'),r('nurse')],{floor:3,energy:50});
assert.deepEqual(experimentalRiskLinks(thieves.cabin),{edges:0,coins:0,agitation:0});
assert.equal(line(E.resolveFloor(thieves,()=>.9),'同伙收入（实验）'),0,'normal game does not enable the experiment');
const risk={coinsPerMember:2,agitationPerEdge:1};
const strengthened=E.resolveFloor(thieves,()=>.9,{riskLinks:risk});
assert.equal(strengthened.lastEarnings.total,12); assert.equal(strengthened.lastEnergy.delta,-5); assert.equal(strengthened.lastPressure.delta,1);
const police={...thieves,cabin:thieves.cabin.map((old,i)=>i===3?r('cop'):old)};
assert.equal(experimentalRiskLinks(police.cabin,risk).edges,0);
assert.equal(experimentalRiskLinks(planPlacement(thieves,thieves.cabin[1]!,5).next.cabin,risk).edges,0);
const chanceRisk={coinsPerMember:4,agitationPerEdge:1,payoutChance:.5};
assert.equal(line(E.resolveFloor(thieves,()=>.49,{riskLinks:chanceRisk}),'同伙收入（实验）'),8);
assert.equal(line(E.resolveFloor(thieves,()=>.5,{riskLinks:chanceRisk}),'同伙收入（实验）'),0);
assert.equal(E.resolveFloor(thieves,()=>.49,{riskLinks:chanceRisk}).stress,E.resolveFloor(thieves,()=>.5,{riskLinks:chanceRisk}).stress,'research chance changes rewards, not hidden death odds');

let forecasts=0;
for(let n=0;n<12000;n++) {
  const floor=1+Math.floor(rng()*140),run=s([],{floor,stress:Math.floor(rng()*9),energy:Math.floor(rng()*61)});
  keys.forEach(key=>run.upgrades[key]=Number(rng()<.5));
  run.stressCap+=run.upgrades.calm;
  run.cabin=Array.from({length:6},(_,i)=>{
    if(i&&rng()<.3)return null;
    const kind=PASSENGER_ORDER[Math.floor(rng()*PASSENGER_ORDER.length)];
    return r(kind,floor+1+Math.floor(rng()*4),{boardedAt:Math.max(1,floor-Math.floor(rng()*7)),volatile:rng()<.4,fuse:1+Math.floor(rng()*4),copySeed:n+i,
      traits:kind==='mystery'||kind==='shifter'?randomTraits(kind,PASSENGER_ORDER,rng):undefined});
  });
  const tuning=n%3===0?undefined:n%3===1?risk:chanceRisk;
  const ep=energyForecast(run,undefined,tuning),sp=stressForecast(run,undefined,tuning);
  const encoded=JSON.stringify(run),next=E.resolveFloor(run,rng,{riskLinks:tuning});
  assert.equal(JSON.stringify(run),encoded);
  assert.ok(next.lastEnergy.delta>=ep.lowDelta&&next.lastEnergy.delta<=ep.highDelta,'energy bounds '+n);
  assert.ok(next.lastPressure.delta>=sp.lowDelta&&next.lastPressure.delta<=sp.highDelta,'stress bounds '+n);
  assert.equal(next.lastEarnings.sources.reduce((sum,l)=>sum+l.amount,0),next.lastEarnings.total);
  assert.equal(next.lastEnergy.sources.reduce((sum,l)=>sum+l.amount,0),next.lastEnergy.delta);
  if(next.status==='upgrade') assert.equal(next.shopUpgradeBought,false);
  forecasts++;
}
const ui=readFileSync(new URL('../experiments/v8.31/components/elevator-game.tsx.txt',import.meta.url),'utf8');
assert.ok(ui.includes('availableShopCards(run).map'));
assert.ok(ui.includes('上方车费不含这项概率奖励'));
console.log(JSON.stringify({version:'8.30',uniqueShopMasks:shopChecks,abilities:keys.length,randomForecastChecks:forecasts,
  purchases:'one per visit; owned cards absent even in crisis or stale state',randomness:'only actual resolution; strict <50%; no fare multipliers; one relay roll',
  riskLinks:'opt-in experiment only; forecast and resolution share pressure'}));
