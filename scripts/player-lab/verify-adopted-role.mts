import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {D} from './game.mts';
import {configureScenario} from './scenarios.mts';
import {replay} from './runtime.mts';
import {manifest,writeNew} from './util.mts';

// Explicit migration audit, not the strict same-source replay command.
// The implemented default must reproduce the already observed Bomb14 treatment.
const output=resolve(process.argv[2]);
const dirs=process.argv.slice(3).map(p=>resolve(p));assert.equal(dirs.length,2);
assert.equal(D.PASSENGERS.bomb.fare,14);assert.deepEqual(D.PASSENGERS.commuter.trip,[2,5]);
const before=manifest();
const allowedSource=new Set(['lib/game-data.ts','lib/i18n-v832.ts','lib/release-v832.ts']);
const allowedLab=new Set(['scenarios.mts','verify-adopted-role.mts']);
const rows=[];
try{
 configureScenario('bomb-fourteen');
 for(const dir of dirs){
  const m=JSON.parse(readFileSync(join(dir,'manifest.json'),'utf8'));
  assert.equal(m.scenario.name,'bomb-fourteen');
  assert.equal(m.scenario.fareOverrides.bomb,14);
  const sourceChanges=Object.keys(before.source).filter(k=>before.source[k]!==m.source[k]);
  const labChanges=Object.keys(before.lab).filter(k=>before.lab[k]!==m.lab[k]);
  assert(sourceChanges.every(k=>allowedSource.has(k)),sourceChanges.join(','));
  assert(labChanges.every(k=>allowedLab.has(k)),labChanges.join(','));
  assert(Object.keys(m.source).every(k=>k in before.source));
  assert(Object.keys(m.lab).every(k=>k in before.lab));
  const files=readdirSync(dir).filter(p=>p.endsWith('.private-replay.json'));
  assert.equal(files.length,m.runsPerPolicy*2);
  for(const file of files){
   const input=JSON.parse(readFileSync(join(dir,file),'utf8'));
   assert.deepEqual(input.source,m.source);assert.deepEqual(input.lab,m.lab);
   const s=replay(input.record);
   rows.push({dir,file,actions:input.record.transcript.length,floor:s.observation().floor,sourceChanges,labChanges});
  }
 }
}finally{configureScenario('baseline');}
assert.equal(rows.length,36);assert.deepEqual(manifest(),before);
writeNew(output,{manifest:before,verified:rows.length,actions:rows.reduce((n,r)=>n+r.actions,0),rows,
 limits:'Exact per-action state/hash parity for 36 already observed treatments after adopting Bomb14. Not new trajectories, independent evidence, browser QA or a balance certificate. Only named catalog/copy/release and scenario/audit-file changes are permitted.'});
console.log(JSON.stringify({verified:rows.length,actions:rows.reduce((n,r)=>n+r.actions,0)}));
