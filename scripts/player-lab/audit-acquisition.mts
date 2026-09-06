import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Session,previewWorld} from './runtime.mts';
import {configureScenario} from './scenarios.mts';
for(const file of process.argv.slice(2)){
 const saved=JSON.parse(readFileSync(file,'utf8'));configureScenario(saved.scenario.name);
 const session=new Session(saved.record.seed,saved.record.tutorial,saved.record.initialWorld);const visited=new Set<number>();
 for(const step of saved.record.transcript){
  const o=session.observation();
  if(o.phase==='upgrade'&&o.floor<=20&&!visited.has(o.floor)){
   visited.add(o.floor);
   assert(o.energy>0&&o.stress<o.stressCap,'This audit only covers non-crisis shop entries');
   const optionCash=Math.max(0,...o.cabin.flatMap(r=>r&&((o.stress>=o.stressCap-2&&(r.agitation>0||r.kind==='thief'))||(r.kind==='bomb'&&(r.fuse??0)<=2))?[r.dismissalCost??0]:[]));
   const cards=o.shop.map(card=>{
    const p=previewWorld(session.world(),[{type:'buy',key:card.key}],session.names);
    const available=Math.min(o.energyCap+card.effect.energyCap,o.energy+card.effect.energy+Math.floor(Math.max(0,o.coins-card.price-optionCash)/o.prices.charge));
    return{key:card.key,price:card.price,available,budget:p?p.features.committedEnergy+2:null,passes:!!p&&available>=p.features.committedEnergy+2};
   });
   console.log(JSON.stringify({file,floor:o.floor,energy:o.energy,coins:o.coins,optionCash,cabin:o.cabin.map(r=>r?{kind:r.kind,remaining:r.remaining}:null),cards}));
  }
  session.act(step.action);assert.deepEqual(session.transcript.at(-1),step);
 }
}
configureScenario('baseline');
