import {E,F} from './game.mts';
import {applyLocal,applyPlan,clone,previewWorld,bombDeadlineDeficits,Names,type World} from './runtime.mts';
import type {Action} from './types.mts';

// Current cabin only: never generate shop-exit offers or sample actual future RNG.
// A quote protects agitation/fuse safety for one ascent, NOT sector solvency.
export function controlBudget(base:World,actions:Action[],names:Names):number|null {
 const prepared=applyPlan(base,actions,names);if(!prepared||prepared.state.status!=='upgrade')return null;
 const state=E.leaveShop(clone(prepared.state));if(state.status!=='playing')return null;
 const start:World={state,offers:[]};const cash=state.coins;let best=Infinity,visited=0;
 const seen=new Set<string>();
 const walk=(w:World,depth:number)=>{
  if(visited++>=2000)return;
  const cost=cash-w.state.coins;if(cost>=best)return;
  const key=JSON.stringify([w.state.cabin,E.oldMovesRemaining(w.state),E.dismissalsRemaining(w.state),w.state.coins,w.state.stress]);
  if(seen.has(key))return;seen.add(key);
  const forecast=F.stressForecast(w.state),preview=previewWorld(w,[],names);
  if(w.state.stress+forecast.highDelta<w.state.stressCap&&preview?.safety.bombSafe&&!bombDeadlineDeficits(w.state).length){best=cost;return;}
  if(depth>=3)return;
  // Engine enforces the real move and dismissal limits, costs and eligibility.
  for(const r of w.state.cabin)if(r){
   const id=names.id(r.id);
   for(let slot=0;slot<w.state.cabin.length;slot++){
    const next=applyLocal(w,{type:'place',rider:id,slot},names);if(next)walk(next,depth+1);
   }
   const next=applyLocal(w,{type:'dismiss',rider:id},names);if(next)walk(next,depth+1);
  }
 };
 walk(start,0);return Number.isFinite(best)?best:null;
}
