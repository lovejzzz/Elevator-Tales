// Public-state reconstructions only: not exact browser state/RNG/history replay.
import assert from 'node:assert/strict';
import {E,type Rider,type UpgradeKey} from './game.mts';
import {Names,observe,previewWorld,type World} from './runtime.mts';
const r=(kind:Rider['kind'],remaining:number,extra:Partial<Rider>={}):Rider=>({kind,id:kind+remaining,boardedAt:0,destination:remaining,patience:0,fareBonus:0,...extra});
const cases=[
 {floor:10,energy:13,coins:86,stress:1,buy:'battery',installed:[],cabin:[null,null,null,r('tourist',2),null,r('mechanic',3,{repairProgress:1})]},
 {floor:20,energy:1,coins:127,stress:2,buy:'meter',installed:['battery'],cabin:[r('musician',1),r('child',2,{volatile:true,careProgress:2}),null,r('thief',1),r('nurse',4),null]},
 {floor:30,energy:1,coins:134,stress:0,buy:'reinforced',installed:['battery','meter'],cabin:[null,r('mechanic',4,{volatile:true,repairProgress:1}),r('inspector',6,{quietStreak:1}),null,r('nurse',1),null]},
 {floor:40,energy:5,coins:136,stress:2,buy:'relay',installed:['battery','meter','reinforced'],cabin:[r('ghost',1),r('exorcist',4,{volatile:true}),r('ghost',6),r('mechanic',1,{repairDone:true}),r('ghost',6,{id:'ghost-b'}),null]},
];
for(const c of cases){
 const state=E.initialRun();for(const key of c.installed)state.upgrades[key as UpgradeKey]=1;
 Object.assign(state,{floor:c.floor,energy:c.energy,coins:c.coins,stress:c.stress,status:'upgrade',serviceTurns:c.floor===40?2:0,cabin:c.cabin.map((r,i)=>r?{...r,id:`s${i}`,boardedAt:c.floor-1,destination:c.floor+r.destination}:null),shop:[{key:c.buy as UpgradeKey,price:E.UPGRADE_BASE_PRICES[c.buy as UpgradeKey],purchased:false}]});
 const w:World={state,offers:[]},n=new Names();observe(w,n);
 const preview=previewWorld(w,[{type:'buy',key:c.buy}],n);assert(preview);
 const available=Math.min(state.energyCap,state.energy+Math.floor((state.coins-E.UPGRADE_BASE_PRICES[c.buy as UpgradeKey])/E.CHARGE_PRICE));
 console.log(JSON.stringify({floor:c.floor,buy:c.buy,available,committedWithBuffer:preview.features.committedEnergy+2,passesPurchaseEnergyGate:available>=preview.features.committedEnergy+2,limits:'Visible resource/remaining-trip reconstruction. Unknown ride ages set to1; not an actual browser replay or adaptive valuation-history reproduction.'}));
}
