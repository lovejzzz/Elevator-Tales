import assert from 'node:assert/strict';
import * as E from '../lib/game-engine';
import {energyForecast} from '../lib/game-forecast';
import {SHOP_TUNING,finaleIncome} from '../lib/shop-effects';
const original={...SHOP_TUNING};
try{
 Object.assign(SHOP_TUNING,{bufferBoost:1,finaleRemaining:1});
 let cases=0;
 for(const floor of [9,11,31,51,61])for(const power of [1,30,59,60])for(const courier of [true,false])for(const relay of [0,1])for(const roll of [0,.99]){
  const s={...E.initialRun(),floor,energy:power,upgrades:{...E.EMPTY_UPGRADES,buffer:1,relay},cabin:[{id:'a',kind:courier?'courier' as const:'commuter' as const,boardedAt:floor-1,destination:floor+1,patience:0,fareBonus:0},{id:'b',kind:'commuter' as const,boardedAt:floor-1,destination:floor+1,patience:0,fareBonus:0},null,null,null,null]};
  const out=E.resolveFloor(s,()=>roll),forecast=energyForecast(s),boost=out.lastEnergy.sources.find(x=>x.label==='自然回充增幅')?.amount??0;
  assert.equal(boost,Number(courier||Boolean(relay&&roll===0)),'Only actual natural recharge triggers once');
  assert(out.energy-s.energy>=forecast.lowDelta&&out.energy-s.energy<=forecast.highDelta);
  cases++;
 }
 const state={...E.initialRun(),upgrades:{...E.EMPTY_UPGRADES,finale:1}};
 assert.equal(finaleIncome(state,2,0),6);assert.equal(finaleIncome(state,2,1),6);
 assert.equal(finaleIncome(state,2,2),0);assert.equal(finaleIncome(state,1,0),0);
 console.log({cases,naturalChargeOnly:true,cabinLimit:true});
}finally{Object.assign(SHOP_TUNING,original);}
