import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import type {Rider,RunState} from '../lib/game-engine';
import type {PassengerKind} from '../lib/game-data';

const root=resolve(import.meta.dirname,'..'),experiment=join(root,'experiments/person-power-20260903');
const reportPath=resolve(root,process.argv[2]);
const report=JSON.parse(readFileSync(reportPath,'utf8')),p=report.params;
const work=mkdtempSync(join(tmpdir(),'elevator-power-verification-'));mkdirSync(join(work,'lib'));
writeFileSync(join(work,'package.json'),'{"type":"module"}');
for(const [name,hash]of Object.entries(report.hashes)){
 const s=readFileSync(join(experiment,'sources',hash+'.txt'),'utf8');assert.equal(createHash('sha256').update(s).digest('hex'),hash);
 writeFileSync(join(work,'lib',name),s);
}
const engine=await import(pathToFileURL(join(work,'lib/game-engine.ts')).href);
const forecast=await import(pathToFileURL(join(work,'lib/game-forecast.ts')).href);
const profiles=await import(pathToFileURL(join(work,'lib/rider-profile.ts')).href);
const data=await import(pathToFileURL(join(work,'lib/game-data.ts')).href);
const kinds=data.PASSENGER_ORDER as PassengerKind[];
const edges=[[0,1],[1,2],[3,4],[4,5],[0,3],[1,4],[2,5]];
const adjacent=(a:number,b:number)=>edges.some(([x,y])=>x===a&&y===b||y===a&&x===b);
let seed=86772091,tests=0;
const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const rider=(kind:PassengerKind,id:string,floor:number):Rider=>({kind,id,destination:floor+1+Math.floor(rng()*8),patience:0,boardedAt:floor,fareBonus:0,fuse:9,copySeed:Math.floor(rng()*100000),...(['mystery','shifter'].includes(kind)?{traits:profiles.randomTraits(kind,kinds,rng)}:{})});
const expectedOwn=(r:Rider)=>r.traits?.energy??(p.legacy?['tourist','coach'].includes(r.kind)?1:0:r.kind==='ghost'?p.ghostCost??0:['tourist','coach'].includes(r.kind)?2:1);
function check(s:RunState){
 let people=0;
 s.cabin.forEach((r,i)=>{if(!r)return;const profile=profiles.riderProfile(r,s.cabin,i);let expected=expectedOwn(r);
  for(const copy of profile.copies)if(copy.field==='energy')expected=expectedOwn(s.cabin.find(n=>n?.id===copy.sourceId)!);
  assert.equal(profile.energy,expected);people+=expected;
 });
 const next=s.floor+1,stabilizer=s.upgrades.reinforced?Math.min(1,people):0;
 let saving=s.upgrades.solar&&next%4===0?1:0;
 s.cabin.forEach((r,i)=>{if(r?.kind==='mechanic'&&next%3===0)saving++;if(r?.kind==='ghost'&&s.cabin.some((n,j)=>n?.kind==='exorcist'&&adjacent(i,j)))saving++;});
 saving=Math.min(p.saveCap??1,saving,Math.max(0,people-stabilizer));
 const expected=(p.base??1)+people-stabilizer-saving;
 assert.ok(expected>=(p.base??1));assert.equal(engine.passengerEnergy(s),people);
 assert.equal(engine.stabilizedEnergy(s),stabilizer);assert.equal(engine.energySavings(s),saving);
 const ef=forecast.energyForecast(s),sf=forecast.stressForecast(s),result=engine.resolveFloor(s,rng);
 assert.equal(ef.lowDelta,-expected);assert.equal(ef.highDelta,-expected);assert.equal(result.lastEnergy.delta,-expected);
 assert.equal(result.energy,s.energy-expected);assert.equal(result.lastEnergy.sources.reduce((n:number,x:{amount:number})=>n+x.amount,0),-expected);
 assert.ok(result.lastPressure.delta>=sf.lowDelta&&result.lastPressure.delta<=sf.highDelta);
 let rewards=0;
 s.cabin.forEach((r,i)=>{if(r?.kind!=='inspector')return;
  const failed=next%2===0&&people-stabilizer-saving>(p.inspection??0);
  const line=engine.riderAgitation(s,i).fixed.find((x:{label:string})=>x.label==='检查员发现额外耗电');
  assert.equal(line?.amount??0,failed?(s.stress>=Math.ceil(s.stressCap*2/3)?2:1):0);
  if(next%2===0&&!failed)rewards++;
 });
 assert.equal(result.lastEarnings.sources.find((x:{label:string})=>x.label==='检查员合规奖励')?.amount??0,rewards);
 tests++;
}
for(const kind of kinds)for(let slot=0;slot<6;slot++)for(let floor=1;floor<=12;floor++)for(const mask of [0,1,2,3])for(const stress of [0,10]){
 const s:RunState={...engine.initialRun(),floor,energy:200,energyCap:200,stress};s.upgrades.reinforced=mask&1;s.upgrades.solar=mask>>1;
 s.cabin[slot]=rider(kind,'target',floor);
 s.cabin[(slot+1)%6]=rider('mechanic','mechanic',floor);s.cabin[(slot+2)%6]=rider('tourist','tourist',floor);
 check(s);
}
const directed=tests;
for(let i=0;i<6000;i++){
 const floor=1+Math.floor(rng()*180),s:RunState={...engine.initialRun(),floor,energy:200,energyCap:200,stress:Math.floor(rng()*15)};
 s.upgrades.reinforced=Number(rng()<.5);s.upgrades.solar=Number(rng()<.5);s.upgrades.battery=Number(rng()<.5);
 s.cabin=Array.from({length:6},(_,n)=>rng()<.3?null:rider(kinds[Math.floor(rng()*kinds.length)],'r'+i+'-'+n,floor));check(s);
}
for(const units of [1,5,10]){const s={...engine.initialRun(),energy:0,coins:units*p.price,earned:units*p.price,status:'upgrade'};const next=engine.chargeBattery(s,units);assert.equal(next.energy,units);assert.equal(next.coins,0);}
const empty={...engine.initialRun(),floor:9,energy:p.base??1};
assert.equal(engine.resolveFloor(empty,rng).status,'upgrade');
assert.equal(engine.resolveFloor({...empty,floor:8},rng).status,'lost');
const target=join(experiment,'verification-'+report.id+'.json');assert.ok(!existsSync(target));
const result={variant:report.id,params:p,hashes:report.hashes,directed,random:tests-directed,total:tests,chargeCases:3,shopBoundaryCases:2,forecastFailures:0,seed:86772091};
writeFileSync(target,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
