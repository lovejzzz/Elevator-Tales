import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {cpSync,mkdirSync,mkdtempSync,readFileSync,writeFileSync,symlinkSync,readdirSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';

// Test-only generated engines. Never mutate lib/ or the published checkpoint.
const root=resolve(import.meta.dirname,'..');
const experiment=join(root,'experiments/person-power-20260903');
const phase=process.argv[2]??'screen',runs=Number(process.argv[3]??40);
const ids=(process.argv[4]??'old,new20,p40c1,p50c1,p60c1,p40c2,p50c2,p60c2,p60c3').split(',');
const selected=process.argv[5]??'planning-pairs-6,low-power-6,sparse-planner,support-stack-music,greedy-6';
const context=process.argv[6]??'normal';
const seeds:Record<string,number>={smoke:910711,screen:91071371,refine:92071387,holdout:93071413,final:94071421,ablation:95071439,contexts:96071453};
assert.ok(seeds[phase]);assert.ok(Number.isInteger(runs)&&runs>0);
type Params={initial:number;cap:number;price:number;target:number;base?:number;legacy?:boolean;inspection?:number;saveCap?:number;mechanic?:number;ghostCost?:number};
const variants:Record<string,Params>={old:{initial:20,cap:24,price:3,target:22,legacy:true},new20:{initial:20,cap:24,price:3,target:22}};
for(const initial of [30,40,45,50,55,60,70])for(const price of [1,2,3])variants[`p${initial}c${price}`]={initial,cap:Math.ceil(initial*1.2),price,target:initial+2};
for(const initial of [40,45,50,55,60])for(const target of [36,42,48,54,60])variants[`i${initial}t${target}`]={initial,cap:60,price:1,target};
for(const cap of [48,54,60,66,72])variants[`cap${cap}`]={initial:45,cap,price:1,target:48};
for(const cap of [60,66,72,84])variants[`fixed60cap${cap}`]={initial:60,cap,price:1,target:62,inspection:3};
for(const limit of [0,2,3,4])variants[`inspect${limit}`]={initial:60,cap:72,price:1,target:62,inspection:limit};
for(const initial of [50,55,60])for(const target of [48,54,62])variants[`r${initial}t${target}`]={initial,cap:Math.ceil(initial*1.2),price:1,target,inspection:3};
for(const cap of [1,2,3])variants[`saving${cap}`]={initial:60,cap:72,price:1,target:62,inspection:3,saveCap:cap};
variants.emptyFree={initial:60,cap:72,price:1,target:62,inspection:3,base:0};
variants.base2={initial:60,cap:72,price:1,target:62,inspection:3,base:2};
variants.ghost1={initial:60,cap:72,price:1,target:62,inspection:3,ghostCost:1};
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const replace=(s:string,a:string,b:string)=>{assert.equal(s.split(a).length-1,1,a);return s.replace(a,b);};
const freeze=join(experiment,'baseline');
mkdirSync(experiment,{recursive:true});
if(!existsSync(freeze)){
 mkdirSync(freeze);cpSync(join(root,'lib'),join(freeze,'lib'),{recursive:true});
 const checkpoint=JSON.parse(readFileSync(join(root,'docs/balance-checkpoint-2026-09-03/final/release-normal.json'),'utf8'));
 const source=readFileSync(join(root,'docs/balance-checkpoint-2026-09-03/sources',checkpoint.runnerHash+'.txt'),'utf8');
 assert.equal(sha(source),checkpoint.runnerHash);writeFileSync(join(freeze,'runner.txt'),source);
 writeFileSync(join(freeze,'provenance.json'),JSON.stringify({commit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),runnerHash:checkpoint.runnerHash},null,2));
}
const work=mkdtempSync(join(tmpdir(),'elevator-person-power-'));
symlinkSync(join(root,'node_modules'),join(work,'node_modules'),'dir');writeFileSync(join(work,'package.json'),'{"type":"module"}');
const out=join(experiment,'results',phase),evidence=join(experiment,'sources');mkdirSync(out,{recursive:true});mkdirSync(evidence,{recursive:true});
async function run(id:string){
 const p=variants[id];assert.ok(p,id);assert.ok(p.cap>=p.initial);const target=join(out,id+'-'+context+'.json');assert.ok(!existsSync(target),target);
 const dir=join(work,id);mkdirSync(join(dir,'scripts'),{recursive:true});cpSync(join(freeze,'lib'),join(dir,'lib'),{recursive:true});
 let engine=readFileSync(join(dir,'lib/game-engine.ts'),'utf8'),data=readFileSync(join(dir,'lib/game-data.ts'),'utf8'),profile=readFileSync(join(dir,'lib/rider-profile.ts'),'utf8');
 engine=replace(engine,'energy: 20, energyCap: 24',`energy: ${p.initial}, energyCap: ${p.cap}`);
 engine=replace(engine,'export const CHARGE_PRICE = 3;',`export const CHARGE_PRICE = ${p.price};`);
 engine=replace(engine,'(nextShopFloor(state.floor) - state.floor) * 2 + 2',String(p.target));
 if(!p.legacy){
  const lines=data.split('\n');for(let i=0;i<lines.length;i++)if(/^  \w+: \{ kind:/.test(lines[i])||/^  (mystery|shifter|mimic): \{ kind:/.test(lines[i])){
   const kind=lines[i].trim().split(':')[0],cost=kind==='ghost'?p.ghostCost??0:['tourist','coach'].includes(kind)?2:1;
   lines[i]=lines[i].replace(/energy:\s*\d+/,`energy: ${cost}`);
  }data=lines.join('\n');
  profile=replace(profile,'energy:randomInt(0,1,rng)','energy:randomInt(1,2,rng)');
 }
 const base=p.base??1,limit=p.inspection??0;
 engine=replace(engine,'export const travelEnergyCost = (_destinationFloor: number) => 1;',`export const travelEnergyCost = (_destinationFloor: number) => ${base};`);
 // Savings may offset people, never produce battery charge or erase the motor cost.
 engine=replace(engine,'Math.min(1,saved,Math.max(0,travelEnergyCost(next)+passengerEnergy(state)-stabilizedEnergy(state)-1))',`Math.min(${p.saveCap??1},saved,Math.max(0,passengerEnergy(state)-stabilizedEnergy(state)))`);
 engine=replace(engine,'even && inspectionExtraEnergy(state) > 0',`even && inspectionExtraEnergy(state) > ${limit}`);
 engine=replace(engine,'nextFloor % 2 === 0 && inspectionExtraEnergy(state) === 0',`nextFloor % 2 === 0 && inspectionExtraEnergy(state) <= ${limit}`);
 writeFileSync(join(dir,'lib/game-engine.ts'),engine);writeFileSync(join(dir,'lib/game-data.ts'),data);writeFileSync(join(dir,'lib/rider-profile.ts'),profile);
 let runner=readFileSync(join(freeze,'runner.txt'),'utf8');
 runner=runner.replace(/const seedBase=\d+;/,`const seedBase=${seeds[phase]};`);
 runner=replace(runner,"policy('zero-extra-6'","policy('low-power-6'");
 runner=replace(runner,"policy('profit-only-6'",`policy('only-ghost',{cap:6,risk:6,lookahead:true,restAware:true,contract:true,onlyKinds:['ghost']}),
 policy('occult-specialist',{cap:6,risk:6,lookahead:true,restAware:true,pairSearch:true,contract:true,favorite:['ghost','exorcist'],bias:8}),
 policy('mechanic-specialist',{cap:6,risk:6,lookahead:true,restAware:true,pairSearch:true,contract:true,favorite:['mechanic'],bias:8}),
 policy('no-savings',{cap:6,risk:6,lookahead:true,restAware:true,pairSearch:true,contract:true,banKind:'mechanic',banUpgrade:'all-savings'}),
 policy('planner-full-charge',{cap:6,risk:6,lookahead:true,restAware:true,pairSearch:true,contract:true,chargeFull:true}),
 policy('no-passengers',{cap:0,risk:6,shop:'none'}),
 policy('profit-only-6'`);
 runner=replace(runner,'state.cabin.some((r,i)=>r&&riderProfile(r,state.cabin,i).energy)',`state.cabin.some((r,i)=>r&&riderProfile(r,state.cabin,i).energy>${p.legacy?0:1})`);
 runner=replace(runner,'Math.max(0,-electric.lowDelta-1)',`Math.max(0,-electric.lowDelta-${base})`);
 runner=replace(runner,"r.kind==='inspector'&&electric.lowDelta===-1",`r.kind==='inspector'&&electric.lowDelta>=-${base+limit}`);
 runner=replace(runner,'(future.energy-state.energy)*2','(future.energy-state.energy)*CHARGE_PRICE');
 runner=replace(runner,'Math.min(20,state.energyCap)-Math.max(0,state.energy-remaining)',`Math.min(${p.target},state.energyCap)-Math.max(0,state.energy-remaining*${base})`);
 runner=replace(runner,'r.kind!==config.banKind',"r.kind!==config.banKind&&!(config.id==='no-savings'&&r.kind==='exorcist')&&(!config.onlyKinds||state.floor<25||config.onlyKinds.includes(r.kind))");
 runner=replace(runner,'c.key!==config.banUpgrade',"c.key!==config.banUpgrade&&!(config.banUpgrade==='all-savings'&&['reinforced','solar'].includes(c.key))");
 runner=replace(runner,'next.energy<state.energy','next.energy<=state.energy');
 assert.equal(runner.split('energy:20,stress:').length-1,3);runner=runner.replaceAll('energy:20,stress:',`energy:${p.initial},stress:`);
 runner=replace(runner,'energy:22,stress:10',`energy:${Math.min(p.cap,p.target)},stress:10`);
 runner=replace(runner,'let extraEnergy=0,agitatedSteps=0,recoveries=0;','let extraEnergy=0,agitatedSteps=0,recoveries=0,totalEnergy=0;const checkpointRows:Array<{game:number;floor:number;coins:number;energy:number;stress:number;people:number;upgrades:number}>=[];');
 runner=replace(runner,"if(state.status==='upgrade'){shopVisits++;",`if(state.status==='upgrade'){checkpointRows.push({game,floor:state.floor,coins:state.coins,energy:state.energy,stress:state.stress,people:state.cabin.filter(Boolean).length,upgrades:Object.values(state.upgrades).reduce((a,b)=>a+b,0)});shopVisits++;`);
 runner=replace(runner,'extraEnergy+=Math.max(0,-next.lastEnergy.delta-1);',`extraEnergy+=Math.max(0,-next.lastEnergy.delta-${base});totalEnergy-=next.lastEnergy.delta;`);
 runner=replace(runner,'const summary={id:config.id,config,runs,','const summary={id:config.id,config,runs,totalEnergy,checkpointRows,');
 // The inherited 'only' role lives in our extended policy type only.
 runner=replace(runner,'banKind?:PassengerKind','banKind?:PassengerKind;onlyKinds?:PassengerKind[]');
 writeFileSync(join(dir,'scripts/run.ts'),runner);
 const sources=Object.fromEntries(readdirSync(join(dir,'lib')).filter(f=>f.endsWith('.ts')).map(f=>[f,readFileSync(join(dir,'lib',f),'utf8')]));
 const hashes=Object.fromEntries(Object.entries(sources).map(([f,s])=>[f,sha(s)]));
 for(const s of [...Object.values(sources),runner])if(!existsSync(join(evidence,sha(s)+'.txt')))writeFileSync(join(evidence,sha(s)+'.txt'),s);
 const child=spawn(process.execPath,[join(root,'node_modules/tsx/dist/cli.mjs'),join(dir,'scripts/run.ts'),'validate',String(runs),selected,context],{cwd:dir,stdio:['ignore','pipe','pipe']});
 let stdout='',stderr='';child.stdout.on('data',s=>stdout+=s);child.stderr.on('data',s=>{stderr+=s;for(const l of String(s).split('\n'))if(l.startsWith('{'))console.error(id+' '+l);});
 assert.equal(await new Promise((done,reject)=>{child.on('close',done);child.on('error',reject);}),0,stderr.slice(-4000));
 const result=JSON.parse(stdout);assert.equal(result.forecastFailures,0);
 writeFileSync(target,JSON.stringify({id,params:p,phase,hashes,runnerHash:sha(runner),...result},null,2));
 console.log(JSON.stringify({id,games:result.totalGames,steps:result.transitions,rank:result.summaries.map((s:{id:string;mean:number;meanOccupancy:number;firstShopPassed:number;deaths:unknown})=>({id:s.id,mean:s.mean,people:s.meanOccupancy,firstShop:s.firstShopPassed,deaths:s.deaths}))}));
}
let index=0;await Promise.all(Array.from({length:Math.min(3,ids.length)},async()=>{while(index<ids.length)await run(ids[index++]);}));
