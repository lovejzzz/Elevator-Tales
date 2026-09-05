import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {B} from './game.mts';
import {configureScenario} from './scenarios.mts';
import {replay} from './runtime.mts';
import {manifest,writeNew} from './util.mts';
const output=resolve(process.argv[2]),dirs=process.argv.slice(3).map(p=>resolve(p));
assert.equal(dirs.length,4);assert.equal(B.MOTOR_RULES.upperZone,true);
const before=manifest(),rows=[];
const allowedSource=new Set(['lib/balance-v832.ts','components/elevator-game.tsx','app/globals.css','lib/i18n-v832.ts','lib/release-v832.ts']);
const allowedLab=new Set(['scenarios.mts','verify.mts','verify-adopted-motor.mts']);
try{
 configureScenario('motor-upper');
 for(const dir of dirs){
  const m=JSON.parse(readFileSync(join(dir,'manifest.json'),'utf8'));
  assert.equal(m.scenario.name,'motor-upper');assert.equal(m.scenario.motor.upperZone,true);
  const sourceChanges=Object.keys(before.source).filter(k=>before.source[k]!==m.source[k]);
  const labChanges=Object.keys(before.lab).filter(k=>before.lab[k]!==m.lab[k]);
  assert(sourceChanges.every(k=>allowedSource.has(k)),sourceChanges.join(','));
  assert(labChanges.every(k=>allowedLab.has(k)),labChanges.join(','));
  assert(Object.keys(m.source).every(k=>k in before.source));assert(Object.keys(m.lab).every(k=>k in before.lab));
  for(const file of readdirSync(dir).filter(p=>p.endsWith('.private-replay.json'))){
   const x=JSON.parse(readFileSync(join(dir,file),'utf8'));
   assert.deepEqual(x.source,m.source);assert.deepEqual(x.lab,m.lab);
   const session=replay(x.record);
   rows.push({dir,file,actions:x.record.transcript.length,floor:session.observation().floor,sourceChanges,labChanges});
  }
 }
}finally{configureScenario('baseline');}
assert.equal(rows.length,72);assert.deepEqual(manifest(),before);
writeNew(output,{manifest:before,rows,actions:rows.reduce((n,r)=>n+r.actions,0),limits:'Explicit migration audit: 72 previously observed motor-upper treatments replay each action and world hash after local adoption. Not 72 new trajectories, human games, visual QA or final balance acceptance. Strict same-source replay remains unchanged.'});
console.log(JSON.stringify({verified:rows.length,actions:rows.reduce((n,r)=>n+r.actions,0)}));
