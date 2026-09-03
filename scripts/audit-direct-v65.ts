import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, symlinkSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const root=resolve(import.meta.dirname,'..'),phase=process.argv[2]??'screen',runs=Number(process.argv[3]??60);
const ids=(process.argv[4]??'baseline,direct,load6,load7,load8').split(',');
const policies=process.argv[5]??'balanced-3,greedy-6,cautious-6,contract-lookahead,contract-mixed-6,pair-calming,coach-4,mimic-4,police-thief-4,no-upgrades,rest-relay-calm,without-reinforced';
const seed=phase==='holdout'?983127119:982381711;
const out=join(root,'docs/direct-v65-2026-09-03',phase),work=mkdtempSync(join(tmpdir(),'elevator-direct-'));
mkdirSync(out,{recursive:true});symlinkSync(join(root,'node_modules'),join(work,'node_modules'),'dir');writeFileSync(join(work,'package.json'),'{"type":"module"}');
const replace=(s:string,a:string,b:string)=>{assert.equal(s.split(a).length-1,1,a);return s.replace(a,b);};
async function run(id:string){
 assert.ok(['baseline','direct','load6','load7','load8','release'].includes(id));
 const target=join(out,id+'.json');assert.ok(!existsSync(target),target);
 const dir=join(work,id);mkdirSync(join(dir,'scripts'),{recursive:true});cpSync(join(root,id==='baseline'?'experiments/v64/lib':'experiments/v65-load-prototype/lib'),join(dir,'lib'),{recursive:true});
 let engine=readFileSync(join(dir,'lib/game-engine.ts'),'utf8');
 if(id!=='baseline'&&id!=='release')engine=replace(engine,'state.weightCap - 4',`state.weightCap - ${id==='direct'?-100:Number(10-Number(id.slice(4)))}`);
 writeFileSync(join(dir,'lib/game-engine.ts'),engine);
 let runner=readFileSync(join(root,'experiments/v63/scripts/tournament.ts'),'utf8');
 runner=runner.replace(/const seedBase=\d+;/,`const seedBase=${seed};`);
 if(id!=='baseline'){
  runner=replace(runner,'const cost=trip*(near?2:1)+(r.kind===\'child\'&&!hasNeighbour(state.cabin,slot,[\'lover\',\'musician\',\'nurse\'])?trip*.5:0);','const cost=0;');
  runner=replace(runner,'c.destination>=floor&&c.patience>=floor-state.floor','c.destination>=floor');
 }
 // Same energy-aware evaluator for baseline and candidates: it sees the public
 // next-step cost, not future offers or mystery fares. No anticipation oracle.
 runner=replace(runner,'let score=energySavings(state)*2;',`let score=energySavings(state)*2;
 const energy=energyForecast(state);score-=(Math.max(0,-energy.lowDelta-2))*${CHARGE_VALUE};
 if(state.energy+energy.lowDelta<=0&&((state.floor+1)%10!==0))score-=500;
`);
 runner=replace(runner,'let duplicateCalmerSteps=0,maxMusicians=0,maxNurses=0;',`let duplicateCalmerSteps=0,maxMusicians=0,maxNurses=0;
 let loadSteps=0,extraLoadEnergy=0,blockedOffers=0,openOfferChecks=0,earlySteps=0,earlyHeavy=0,gamesHeavyBy30=0;
 const firstHeavy:number[]=[],weights:Record<string,number>={};
`);
 runner=replace(runner,'const value=evaluator(config);','const value=evaluator(config);let firstHeavyFloor=0;');
 runner=replace(runner,'const waiting=[...offers];',`const waiting=[...offers];
 for(const r of waiting)if(!state.cabin.some(x=>x?.id===r.id)&&state.cabin.some(x=>!x)){
  openOfferChecks++;if(!state.cabin.some((x,i)=>!x&&planPlacement(state,r,i).ok))blockedOffers++;
 }
`);
 runner=replace(runner,'const next=resolveFloor(state,rngFor(game,state.floor,3));',`const next=resolveFloor(state,rngFor(game,state.floor,3));
 const weight=totalWeight(state.cabin),heavy=next.lastEnergy.sources.find(s=>s.label==='重载额外耗电')?.amount??0;
 weights[weight]=(weights[weight]??0)+1;
 if(heavy){loadSteps++;extraLoadEnergy-=heavy;if(!firstHeavyFloor)firstHeavyFloor=state.floor;}
 if(state.floor<=30){earlySteps++;if(heavy)earlyHeavy++;}
`);
 runner=replace(runner,'gamesWithCalm+=Number(state.upgrades.calm>0);','if(firstHeavyFloor){firstHeavy.push(firstHeavyFloor);if(firstHeavyFloor<=30)gamesHeavyBy30++;}gamesWithCalm+=Number(state.upgrades.calm>0);');
 runner=replace(runner,'const summary={id:config.id,config,runs,','const summary={id:config.id,config,runs,load:{loadSteps,extraLoadEnergy,blockedOffers,openOfferChecks,earlySteps,earlyHeavy,gamesHeavyBy30,firstHeavy,weights},');
 writeFileSync(join(dir,'scripts/run.ts'),runner);
 const hashes=Object.fromEntries(readdirSync(join(dir,'lib')).filter(f=>f.endsWith('.ts')).map(f=>[f,createHash('sha256').update(readFileSync(join(dir,'lib',f))).digest('hex')]));
 const child=spawn(process.execPath,[join(root,'node_modules/tsx/dist/cli.mjs'),join(dir,'scripts/run.ts'),'validate',String(runs),policies],{cwd:dir,stdio:['ignore','pipe','pipe']});
 let stdout='',stderr='';child.stdout.on('data',s=>stdout+=s);child.stderr.on('data',s=>stderr+=s);
 assert.equal(await new Promise((done,reject)=>{child.on('close',done);child.on('error',reject);}),0,stderr.slice(-2500));
 const result=JSON.parse(stdout);assert.equal(result.forecastFailures,0);
 writeFileSync(target,JSON.stringify({id,phase,seed,runs,hashes,evaluatorLoadPenalty:CHARGE_VALUE,...result},null,2));
 console.log(JSON.stringify({id,totalGames:result.totalGames,transitions:result.transitions,results:result.summaries.map((s:{id:string;mean:number;firstShopPassed:number;deaths:unknown;steps:number;load:{loadSteps:number;blockedOffers:number;openOfferChecks:number;gamesHeavyBy30:number};purchases:{reinforced?:number}})=>({id:s.id,mean:s.mean,firstShop:s.firstShopPassed/runs,death:s.deaths,heavyPct:s.load.loadSteps/s.steps,blocked:s.load.blockedOffers/s.load.openOfferChecks,earlyHeavyGames:s.load.gamesHeavyBy30/runs,reinforced:s.purchases.reinforced??0}))}));
}
const CHARGE_VALUE=3;let index=0;await Promise.all(Array.from({length:Math.min(3,ids.length)},async()=>{while(index<ids.length)await run(ids[index++]);}));
