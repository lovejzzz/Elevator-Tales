import assert from 'node:assert/strict';
import {E,B,type Rider} from './game.mts';
import {configureScenario} from './scenarios.mts';

const base=configureScenario('baseline'),capped=configureScenario('ghost-provider-cap');
assert.deepEqual({...capped,name:base.name,ghost:base.ghost},base,'Cap experiment must differ only in Ghost rule');
configureScenario('baseline');
const kinds=[null,'ghost','exorcist','commuter'] as const;
const counts={states:0,capChanges:0,capPower:0,steadyEligible:0,steadyMarginalZero:0,steadyMarginalOne:0,zeroOccupancyDependency:0,zeroDependencyActualSaving:0};
const examples:unknown[]=[];
try{
 for(let code=0;code<4096;code++)for(const reinforced of [0,1]){
  let digits=code;
  const cabin=Array.from({length:6},(_,slot)=>{const kind=kinds[digits%4];digits=Math.floor(digits/4);return kind?{kind,id:String(slot),boardedAt:30,destination:40,patience:0,fareBonus:0} as Rider:null;});
  const state={...E.initialRun(),floor:31,cabin,upgrades:{...E.initialRun().upgrades,reinforced}};
  B.GHOST_RULES.oneSavingPerExorcist=false;
  const normal=E.energyBreakdown(state),without=E.energyBreakdown({...state,upgrades:{...state.upgrades,reinforced:0}});
  B.GHOST_RULES.oneSavingPerExorcist=true;
  const cap=E.energyBreakdown(state);
  const delta=cap.total-normal.total,marginal=without.total-normal.total;
  assert.ok(delta>=0&&delta<=2);assert.ok(marginal===0||marginal===1);
  counts.states++;
  if(delta){counts.capChanges++;counts.capPower+=delta;if(examples.length<6)examples.push({cabin:cabin.map(r=>r?.kind??null),reinforced,normal,cap});}
  const occupied=cabin.filter(Boolean).length,paying=cabin.filter(r=>r&&r.kind!=='ghost').length;
  if(reinforced&&occupied>=3){counts.steadyEligible++;if(marginal)counts.steadyMarginalOne++;else counts.steadyMarginalZero++;
   if(paying<3){counts.zeroOccupancyDependency++;counts.zeroDependencyActualSaving+=marginal;}}
 }
}finally{configureScenario('baseline');}
console.log(JSON.stringify({counts,examples,limits:'Exact static power subsystem enumeration; no frequency weighting, future offers, adaptive strategy or survival inference.'},null,2));
