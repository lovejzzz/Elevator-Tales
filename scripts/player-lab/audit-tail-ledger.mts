import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {Session} from './runtime.mts';
import {configureScenario} from './scenarios.mts';
import {D} from './game.mts';
import {manifest,hash,writeNew} from './util.mts';

// Retrospective accounting only. No policy is given the replay's hidden future.
const output=resolve(process.argv[2]),dirs=process.argv.slice(3).map(p=>resolve(p));
assert.equal(dirs.length,2);assert.equal(D.PASSENGERS.bomb.fare,14);
const before=manifest();
const add=(target:Record<string,number>,key:string,value:number)=>target[key]=(target[key]??0)+value;
const audited=[];
try{
 configureScenario('bomb-fourteen');
 for(const dir of dirs)for(const file of readdirSync(dir).filter(f=>f.endsWith('.private-replay.json'))){
  const input=JSON.parse(readFileSync(join(dir,file),'utf8'));
  assert.equal(input.scenario.name,'bomb-fourteen');
  const changed=Object.keys(before.source).filter(k=>before.source[k]!==input.source[k]);
  assert(changed.every(k=>['lib/game-data.ts','lib/i18n-v832.ts','lib/release-v832.ts'].includes(k)));
  const changedLab=Object.keys(before.lab).filter(k=>before.lab[k]!==input.lab[k]);
  assert(changedLab.every(k=>['scenarios.mts','verify-adopted-role.mts','audit-tail-ledger.mts'].includes(k)));
  const session=new Session(input.record.seed,input.record.tutorial);
  const income:Record<string,number>={},energy:Record<string,number>={},spending:Record<string,number>={},riderFloors:Record<string,number>={},delivered:Record<string,number>={};
  const shops=[],steps=[];
  let startCoins:number|null=null,startEnergy:number|null=null,cashDelta=0,energyDelta=0,actions=0;
  for(const entry of input.record.transcript){
   assert.equal(hash(session.world()),entry.before);
   const prior=session.world().state,action=entry.action;
   session.act(action);const next=session.world().state;
   assert.equal(hash(session.world()),entry.after);actions++;
   if(prior.floor<60)continue;
   if(startCoins===null){startCoins=prior.coins;startEnergy=prior.energy;}
   cashDelta+=next.coins-prior.coins;energyDelta+=next.energy-prior.energy;
   if(action.type==='depart'){
    for(const l of next.lastEarnings.sources)add(income,l.label,l.amount);
    for(const l of next.lastEnergy.sources)add(energy,l.label,l.amount);
    for(const r of prior.cabin)if(r){add(riderFloors,r.kind,1);if(!next.cabin.some(n=>n?.id===r.id))add(delivered,r.kind,1);}
    steps.push({floor:next.floor,energyBefore:prior.energy,energy:next.energy,agitationBefore:prior.stress,agitation:next.stress,coins:next.coins,
     installed:Object.keys(prior.upgrades).filter(k=>prior.upgrades[k as keyof typeof prior.upgrades]),
     riders:prior.cabin.map(r=>r?{kind:r.kind,remaining:r.destination-prior.floor,volatile:!!r.volatile,stash:r.stash??0}:null),
     energySources:next.lastEnergy.sources,incomeSources:next.lastEarnings.sources});
   }else{
    if(next.coins!==prior.coins)add(spending,action.type==='buy'?`buy:${action.key}`:action.type,prior.coins-next.coins);
    if(next.energy!==prior.energy)add(energy,action.type,next.energy-prior.energy);
    if(action.type==='leave')shops.push({floor:prior.floor,energy:prior.energy,coins:prior.coins,agitation:prior.stress,reserve:!!prior.reserveCell});
   }
  }
  const final=session.world().state;assert.equal(hash(session.world()),input.record.finalHash);
  if(startCoins!==null){
   assert.equal(final.coins-startCoins,cashDelta);assert.equal(final.energy-startEnergy!,energyDelta);
   assert.equal(Object.values(income).reduce((a,b)=>a+b,0)-Object.values(spending).reduce((a,b)=>a+b,0),cashDelta);
   assert.equal(Object.values(energy).reduce((a,b)=>a+b,0),energyDelta);
  }
  audited.push({dir,file,actions,final:{floor:final.floor,status:final.status,coins:final.coins,energy:final.energy,message:final.message},
   late:startCoins===null?null:{startCoins,startEnergy,cashDelta,energyDelta,income,energy,spending,riderFloors,delivered,shops,steps}});
 }
}finally{configureScenario('baseline');}
assert.equal(audited.length,36);assert.deepEqual(manifest(),before);
writeNew(output,{manifest:before,audited:36,actions:audited.reduce((n,r)=>n+r.actions,0),runs:audited,
 limits:'36 exact retrospective replays, not new games. Late accounting begins at the first action at F60, including that shop, not at a shared biological time or build state. Conditional on reaching this point. Role occupancy and itemized rewards are descriptive, not causal ablations; survival, exposures and policies differ. All input actions and source changes are audited.'});
console.log(JSON.stringify(audited.filter(r=>r.late).map(r=>({file:r.file,dir:r.dir.split('/').at(-1),final:r.final,late:{...r.late,steps:undefined}})),null,2));
