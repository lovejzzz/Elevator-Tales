import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,cpSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import * as live from '../lib/game-engine';
import {PASSENGER_ORDER,PASSENGERS} from '../lib/game-data';
import {riderProfile,randomTraits} from '../lib/rider-profile';
import {energyForecast,stressForecast} from '../lib/game-forecast';
import {passengerBrief,PASSENGER_RULES} from '../lib/passenger-presentation';

const root=resolve(import.meta.dirname,'..'),dir=join(root,'experiments/person-power-20260903');
const reference=JSON.parse(readFileSync(join(dir,'results/final/inspect3-normal.json'),'utf8'));
const temp=mkdtempSync(join(tmpdir(),'elevator-power-release-'));mkdirSync(join(temp,'reference/lib'),{recursive:true});
writeFileSync(join(temp,'package.json'),'{"type":"module"}');
for(const [name,hash]of Object.entries(reference.hashes)){
 const content=readFileSync(join(dir,'sources',hash+'.txt'),'utf8');assert.equal(createHash('sha256').update(content).digest('hex'),hash);
 writeFileSync(join(temp,'reference/lib',name),content);
}
const ref=await import(pathToFileURL(join(temp,'reference/lib/game-engine.ts')).href);
const seeded=(value:number)=>()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};
const rng=seeded(68813519);
// Text changed intentionally; compare every numeric/structural gameplay field.
const numeric=(value:unknown):unknown=>Array.isArray(value)?value.map(numeric):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([key])=>!['message','log','label'].includes(key)).map(([key,v])=>[key,numeric(v)])):value;
assert.deepEqual(numeric(live.initialRun()),numeric(ref.initialRun()));assert.equal(live.CHARGE_PRICE,ref.CHARGE_PRICE);
let states=0;
for(let i=0;i<12000;i++){
 const floor=1+Math.floor(rng()*180),state:live.RunState={...live.initialRun(),floor,energy:Math.floor(rng()*73),stress:Math.floor(rng()*30),stressCap:15+3*(i%4),coins:200,earned:400};
 state.upgrades={...state.upgrades,reinforced:i%2,solar:i%3===0?1:0,battery:i%3,calm:i%4,concierge:i%3};
 state.cabin=Array.from({length:6},(_,slot)=>{
  if(rng()<.25)return null;
  const kind=PASSENGER_ORDER[Math.floor(rng()*PASSENGER_ORDER.length)];
  return {kind,id:`r${slot}`,boardedAt:floor-1,destination:floor+1+Math.floor(rng()*8),patience:0,fareBonus:3,copySeed:i+slot,fuse:1+Math.floor(rng()*6),traits:kind==='mystery'||kind==='shifter'?randomTraits(kind,PASSENGER_ORDER,rng):undefined};
 });
 const result=live.resolveFloor(state,seeded(881+i)),expected=ref.resolveFloor(state,seeded(881+i));
 assert.deepEqual(numeric(result),numeric(expected));assert.deepEqual(live.chargingPlan(state),ref.chargingPlan(state));
 const b=live.energyBreakdown(state);assert.equal(b.total,1+b.people-b.saved);assert.ok(b.total>=1);assert.equal(result.lastEnergy.delta,-b.total);
 assert.equal(energyForecast(state).lowDelta,-b.total);const pressure=stressForecast(state);assert.ok(result.lastPressure.delta>=pressure.lowDelta&&result.lastPressure.delta<=pressure.highDelta);
 for(const r of state.cabin)if(r){const face=passengerBrief(r,floor,state.cabin);assert.equal(face.energy,riderProfile(r,state.cabin).energy);assert.ok(!JSON.stringify(face).includes('额外耗电'));}
 states++;
}
for(const kind of PASSENGER_ORDER)assert.equal(PASSENGERS[kind].energy,kind==='ghost'?0:['tourist','coach'].includes(kind)?2:1);
assert.ok(PASSENGER_RULES.inspector.some(s=>s.includes('不超过4')));
for(const units of [1,10,62,72]){const state={...live.initialRun(),floor:10,status:'upgrade' as const,energy:0,coins:100};const after=live.chargeBattery(state,units);assert.equal(after.energy,units);assert.equal(after.coins,100-units);}

// Replay the exact final seed batch/policies against the release, not a second
// approximation. Use its first 100 seeds per selected policy for a bounded check.
mkdirSync(join(temp,'release/scripts'),{recursive:true});cpSync(join(root,'lib'),join(temp,'release/lib'),{recursive:true});
symlinkSync(join(root,'node_modules'),join(temp,'node_modules'),'dir');
const runner=readFileSync(join(dir,'sources',reference.runnerHash+'.txt'),'utf8');
assert.equal(createHash('sha256').update(runner).digest('hex'),reference.runnerHash);
writeFileSync(join(temp,'release/scripts/run.ts'),runner);
const output=execFileSync(process.execPath,[join(root,'node_modules/tsx/dist/cli.mjs'),join(temp,'release/scripts/run.ts'),'validate','100','planning-pairs-6,low-power-6,support-stack-nurse,planner-full-charge','normal'],{cwd:temp,encoding:'utf8',maxBuffer:32*1024*1024});
const replay=JSON.parse(output);assert.equal(replay.forecastFailures,0);
for(const summary of replay.summaries){const original=reference.summaries.find((s:{id:string})=>s.id===summary.id);assert.deepEqual(summary.floors,original.floors.slice(0,100));}
const report={version:'v6.8',stateComparisons:states,replayedGames:replay.totalGames,forecastFailures:0,exactReferenceOutcomeMatch:true,referenceRunnerHash:reference.runnerHash};
mkdirSync(join(root,'docs/power-release-2026-09-03'),{recursive:true});writeFileSync(join(root,'docs/power-release-2026-09-03/verification.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
