import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, symlinkSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const root=resolve(import.meta.dirname,'..'),phase=process.argv[2]??'screen',runs=Number(process.argv[3]??80);
const ids=(process.argv[4]??'baseline,release,tourist-free,charge2').split(',');
const policies=process.argv[5]??'balanced-3,greedy-6,cautious-6,contract-lookahead,contract-mixed-6,pair-calming,coach-4,mimic-4,police-thief-4,no-upgrades,rest-relay-calm,without-reinforced';
const context=process.argv[6]??'normal',seed=phase==='final'?986564729:phase==='holdout'?985327199:984681317;
const out=join(root,'docs/three-values-v65-2026-09-03',phase),work=mkdtempSync(join(tmpdir(),'elevator-three-'));
mkdirSync(out,{recursive:true});symlinkSync(join(root,'node_modules'),join(work,'node_modules'),'dir');writeFileSync(join(work,'package.json'),'{"type":"module"}');
const replace=(s:string,a:string,b:string)=>{assert.equal(s.split(a).length-1,1,a);return s.replace(a,b);};
async function run(id:string){
 assert.ok(['baseline','release','tourist-free','charge2','base1','base1-plan','premium'].includes(id));
 const target=join(out,id+(context==='normal'?'':'-'+context)+'.json');assert.ok(!existsSync(target),target);
 const dir=join(work,id);mkdirSync(join(dir,'scripts'),{recursive:true});cpSync(join(root,id==='baseline'?'experiments/v64/lib':'lib'),join(dir,'lib'),{recursive:true});
 if(id==='tourist-free'){
  const path=join(dir,'lib/game-data.ts');writeFileSync(path,replace(readFileSync(path,'utf8'),'fare: 22, energy: 1','fare: 13, energy: 0'));
 }
 if(id==='charge2'){
  const path=join(dir,'lib/game-engine.ts');writeFileSync(path,replace(readFileSync(path,'utf8'),'export const CHARGE_PRICE = 3;','export const CHARGE_PRICE = 2;'));
 }
 if(id==='premium'){
  const path=join(dir,'lib/game-data.ts');let data=replace(readFileSync(path,'utf8'),'fare: 22, energy: 1','fare: 28, energy: 1');data=replace(data,'fare: 20, energy: 1','fare: 26, energy: 1');writeFileSync(path,data);
 }
 if(id.startsWith('base1')){
  const path=join(dir,'lib/game-engine.ts');let engine=replace(readFileSync(path,'utf8'),'export const travelEnergyCost = (_destinationFloor: number) => 2;','export const travelEnergyCost = (_destinationFloor: number) => 1;');
  if(id==='base1-plan')engine=replace(engine,'const target = Math.min(state.energyCap, (nextShopFloor(state.floor) - state.floor) * 2 + 2);',`const target = Math.min(state.energyCap, (nextShopFloor(state.floor) - state.floor) + state.cabin.reduce((sum,rider,slot)=>sum+(rider?Math.min(nextShopFloor(state.floor)-state.floor,Math.max(0,rider.destination-state.floor))*riderProfile(rider,state.cabin,slot).energy:0),0) + 2);`);
  writeFileSync(path,engine);
 }
 let runner=readFileSync(join(root,'experiments/v63/scripts/tournament.ts'),'utf8');
 runner=replace(runner,'stackContract?:boolean','stackContract?:boolean;zeroExtra?:boolean');
 runner=replace(runner,"policy('profit-only-6'",`policy('zero-extra-4',{cap:4,risk:6,lookahead:true,restAware:true,contract:true,zeroExtra:true}),
 policy('zero-extra-6',{cap:6,risk:6,lookahead:true,restAware:true,contract:true,zeroExtra:true}),
 policy('planning-pairs-6',{cap:6,risk:6,lookahead:true,restAware:true,pairSearch:true,contract:true}),
 policy('profit-only-6'`);
 runner=runner.replace(/const seedBase=\d+;/,`const seedBase=${seed};`);
 if(id!=='baseline'){
  runner=replace(runner,"const cost=trip*(near?2:1)+(r.kind==='child'&&!hasNeighbour(state.cabin,slot,['lover','musician','nurse'])?trip*.5:0);",'const cost=0;');
  runner=replace(runner,'c.destination>=floor&&c.patience>=floor-state.floor','c.destination>=floor');
  runner=replace(runner,"c.key==='reinforced'?(state.weightCap<13?30:8)","c.key==='reinforced'?38");
 }
 runner=replace(runner,'let score=energySavings(state)*2;',`let score=energySavings(state)*2;
 const electric=energyForecast(state);score-=Math.max(0,-electric.lowDelta-2)*3;
 if(p.zeroExtra&&state.cabin.some((r,i)=>r&&(riderProfile(r,state.cabin,i) as {energy?:number}).energy))score-=500;
 if(state.energy+electric.lowDelta<=0&&((state.floor+1)%10!==0))score-=500;
`);
 runner=replace(runner,'let duplicateCalmerSteps=0,maxMusicians=0,maxNurses=0;',`let duplicateCalmerSteps=0,maxMusicians=0,maxNurses=0;
 let extraEnergy=0,extraSteps=0,earlyPowerDeaths=0,recoveries=0,agitatedSteps=0;
`);
 runner=replace(runner,'const value=evaluator(config);','const value=evaluator(config);let danger=false;');
 runner=replace(runner,'const next=resolveFloor(state,rngFor(game,state.floor,3));',`const next=resolveFloor(state,rngFor(game,state.floor,3));
 const extra=next.lastEnergy.sources.filter(s=>s.label.includes('额外耗电')).reduce((sum,s)=>sum-s.amount,0);extraEnergy+=extra;if(extra)extraSteps++;
 if(next.stress>=Math.ceil(next.stressCap*2/3)){danger=true;agitatedSteps++;}
 else if(danger&&next.stress<=next.stressCap/2&&next.status!=='lost'){danger=false;recoveries++;}
 if(next.status==='lost'&&next.energy<=0&&next.floor<10)earlyPowerDeaths++;
`);
 runner=replace(runner,'const summary={id:config.id,config,runs,','const summary={id:config.id,config,runs,three:{extraEnergy,extraSteps,earlyPowerDeaths,recoveries,agitatedSteps},');
 writeFileSync(join(dir,'scripts/run.ts'),runner);
 const hashes=Object.fromEntries(readdirSync(join(dir,'lib')).filter(f=>f.endsWith('.ts')).map(f=>[f,createHash('sha256').update(readFileSync(join(dir,'lib',f))).digest('hex')]));
 const child=spawn(process.execPath,[join(root,'node_modules/tsx/dist/cli.mjs'),join(dir,'scripts/run.ts'),'validate',String(runs),policies,context],{cwd:dir,stdio:['ignore','pipe','pipe']});
 let stdout='',stderr='';child.stdout.on('data',s=>stdout+=s);child.stderr.on('data',s=>stderr+=s);
 assert.equal(await new Promise((done,reject)=>{child.on('close',done);child.on('error',reject);}),0,stderr.slice(-2500));
 const result=JSON.parse(stdout);assert.equal(result.forecastFailures,0);
 writeFileSync(target,JSON.stringify({id,phase,context,seed,runs,hashes,runnerHash:createHash('sha256').update(runner).digest('hex'),...result},null,2));
 console.log(JSON.stringify({id,games:result.totalGames,steps:result.transitions,results:result.summaries.map((s:{id:string;mean:number;deaths:unknown;firstShopPassed:number;three:unknown})=>({id:s.id,mean:s.mean,firstShop:s.firstShopPassed/runs,deaths:s.deaths,three:s.three}))}));
}
let index=0;await Promise.all(Array.from({length:Math.min(3,ids.length)},async()=>{while(index<ids.length)await run(ids[index++]);}));
