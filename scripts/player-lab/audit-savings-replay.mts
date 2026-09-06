// Post-hoc authoritative replay audit. Never supplied to a policy decision.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {E,B} from './game.mts';
import {Session} from './runtime.mts';
import {configureScenario} from './scenarios.mts';
for(const file of process.argv.slice(2)){
 const saved=JSON.parse(readFileSync(file,'utf8'));
 configureScenario(saved.scenario.name);
 const record=saved.record;
 const session=new Session(record.seed,record.tutorial);
 const exposed:number[]=[],marginals:number[]=[];
 for(const item of record.transcript){
  if(item.action.type==='depart'){
   const state=session.world().state,old=B.GHOST_RULES.oneSavingPerExorcist;
   try{
    B.GHOST_RULES.oneSavingPerExorcist=false;const normal=E.energyBreakdown(state).total;
    const without=E.energyBreakdown({...state,upgrades:{...state.upgrades,reinforced:0}}).total;
    B.GHOST_RULES.oneSavingPerExorcist=true;const cap=E.energyBreakdown(state).total;
    if(cap>normal)exposed.push(state.floor);
    marginals.push(without-normal);
   }finally{B.GHOST_RULES.oneSavingPerExorcist=old;}
  }
  session.act(item.action);
  assert.deepEqual(session.transcript.at(-1),item,'Exact step hash replay changed');
 }
 console.log(JSON.stringify({file,capExposedDepartureFloors:exposed,staticSteadyMarginalPower:marginals.reduce((a,b)=>a+b,0),ascents:marginals.length,final:session.observation().floor,limitation:'Fixed observed placements; no counterfactual policy or survival extrapolation.'}));
}
configureScenario('baseline');
