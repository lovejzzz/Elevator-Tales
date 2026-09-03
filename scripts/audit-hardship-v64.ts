import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync, symlinkSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const root=resolve(import.meta.dirname,'..'),frozen=join(root,'experiments/v63');
const phase=process.argv[2]??'screen',runs=Number(process.argv[3]??60),ids=(process.argv[4]??'baseline,wave2c2,wave2c3,wave2c4,wave3c3,wave3c4').split(',');
const policies=process.argv[5]??'balanced-3,greedy-6,cautious-calm,cautious-6,no-upgrades,contract-mixed-4,contract-mixed-6,contract-no-calm-4,contract-lookahead,contract-lookahead-no-calm,contract-police-mixed,contract-lovers-mixed';
const context=process.argv[6]??'normal';
type Variant={charge:number;peak:number;interval:number};
type PrintedSummary={id:string;mean:number;deaths:Record<string,number>;shopVisits:number;steps:number;hardship:{tightShops:number;firstDanger:number[];decisionRescues:number;highStressSteps:number;recoveries:number}};
const variants:Record<string,Variant>={baseline:{charge:2,peak:0,interval:30},charge3:{charge:3,peak:0,interval:30},charge4:{charge:4,peak:0,interval:30},wave2c2:{charge:2,peak:2,interval:30},wave2c3:{charge:3,peak:2,interval:30},wave2c4:{charge:4,peak:2,interval:30},wave3c3:{charge:3,peak:3,interval:40},wave3c4:{charge:4,peak:3,interval:40}};
Object.assign(variants,{wave4c3:{charge:3,peak:4,interval:40},wave5c3:{charge:3,peak:5,interval:40},wave5c2:{charge:2,peak:5,interval:40}});
variants.release={charge:3,peak:5,interval:40};
assert.ok(['screen','broad','holdout','stress'].includes(phase));assert.ok(Number.isSafeInteger(runs)&&runs>0);ids.forEach(id=>assert.ok(id in variants,id));
const seedBase=phase==='holdout'?971731281:phase==='stress'?971511103:970172319;
const reportRoot=resolve(process.env.ELEVATOR_AUDIT_OUTPUT??join(root,'docs/hardship-v64-2026-09-03')),out=join(reportRoot,phase),archive=join(reportRoot,'generated-sources');
mkdirSync(out,{recursive:true});mkdirSync(archive,{recursive:true});
const work=mkdtempSync(join(tmpdir(),'elevator-hardship-'));symlinkSync(join(root,'node_modules'),join(work,'node_modules'),'dir');writeFileSync(join(work,'package.json'),'{"type":"module"}\n');
const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const replace=(s:string,a:string,b:string)=>{assert.equal(s.split(a).length-1,1,a);return s.replace(a,b);};
function sources(id:string){
 const v=variants[id],dir=join(work,id);mkdirSync(join(dir,'scripts'),{recursive:true});cpSync(join(id==='release'?root:frozen,'lib'),join(dir,'lib'),{recursive:true});
 let engine=readFileSync(join(dir,'lib/game-engine.ts'),'utf8');
 if(v.peak&&id!=='release')engine=replace(engine,'export const shiftAgitation = (floor: number, occupied: number, restStops = 0) => occupied > 0 || restStops <= 0 ? difficultyTier(floor) : 0;',`export const shiftAgitation = (floor: number, occupied: number, restStops = 0) => {
  if (occupied === 0 && restStops > 0 || floor <= 10) return 0;
  const position = floor % 10;
  const base = Math.floor((floor - 11) / ${v.interval});
  const wave = position >= 7 ? ${v.peak} : position >= 4 ? 1 : 0;
  return base + wave;
};`);
 if(id!=='release')engine=replace(engine,'export const CHARGE_PRICE = 2;',`export const CHARGE_PRICE = ${v.charge};`);writeFileSync(join(dir,'lib/game-engine.ts'),engine);
 let runner=readFileSync(join(frozen,'scripts/tournament.ts'),'utf8');
 runner=runner.replace(/const seedBase=\d+;/,`const seedBase=${seedBase};`);
 runner=replace(runner,'stackContract?:boolean','stackContract?:boolean;peakRest?:boolean');
 runner=replace(runner,"policy('profit-only-6'",`policy('contract-lookahead-6',{cap:6,risk:6,restAware:true,lookahead:true,contract:true}),
 policy('wave-pair-4',{cap:4,risk:6,restAware:true,lookahead:true,pairSearch:true,contract:true}),
 policy('wave-pair-6',{cap:6,risk:6,restAware:true,lookahead:true,pairSearch:true,contract:true}),
 policy('wave-rest-calm',{cap:4,risk:6,peakRest:true,restAware:true,lookahead:true,shop:'calm'}),
 policy('wave-rest-mixed',{cap:4,risk:6,peakRest:true,restAware:true,lookahead:true,contract:true}),
 policy('profit-only-6'`);
 runner=replace(runner,'if(p.quick)score+=2/trip;',`if(p.quick)score+=2/trip;
   if(p.peakRest&&state.floor>=10&&state.restStops>0){const pos=state.floor%10,peak=Math.floor(state.floor/10)*10+(pos>=9?17:7);if(r.destination>=peak)score-=50;}
`);
 runner=replace(runner,'const summaries=[],outcomes:number[][]=[];',`const summaries=[],outcomes:number[][]=[];
const dangerous=(s:RunState)=>s.stress>=Math.ceil(s.stressCap*2/3);
const exposureBucket=(floor:number)=>Math.floor((floor-1)/10)*10+1;
`);
 runner=replace(runner,'let duplicateCalmerSteps=0,maxMusicians=0,maxNurses=0;',`let duplicateCalmerSteps=0,maxMusicians=0,maxNurses=0;
 let tightShops=0,cannotFullyCharge=0,noUpgradeAfterCharge=0,shopCrisis=0,nearDeathEntries=0,decisionRescues=0,highStressSteps=0,recoveries=0,gamesRecovered=0;
 const firstDanger:number[]=[],shopWallets:number[]=[],segment:Record<string,{steps:number;danger:number;rescues:number;stressRatio:number}>= {};
 const stage:Record<string,{steps:number;danger:number;stressRatio:number}>={};
 const failureProbes:Array<{floor:number;tested:number;oneAction:boolean;twoActions:boolean;truncated:boolean}>=[];
`);
 runner=replace(runner,'const value=evaluator(config);',`const value=evaluator(config);let firstDangerFloor=0,recoveredThisGame=false,awaitingRecovery=false;
`);
 runner=replace(runner,"if(state.status==='upgrade'){shopVisits++;const cashBeforeCharge=state.coins;",`if(state.status==='upgrade'){shopVisits++;const cashBeforeCharge=state.coins;
    const planned=chargingPlan(state),available=state.shop.filter(c=>!c.purchased),cheapest=Math.min(...available.map(c=>c.price));
    tightShops+=Number(state.coins<planned.cost+cheapest);cannotFullyCharge+=Number(state.coins<planned.cost);shopCrisis+=Number(state.stress>=state.stressCap||state.energy<=0);
    shopWallets.push(state.coins-planned.cost);
`);
 runner=replace(runner,'chargeSpend+=cashBeforeCharge-state.coins;',`chargeSpend+=cashBeforeCharge-state.coins;const purchasesBefore=state.shop.filter(c=>c.purchased).length;
`);
 runner=replace(runner,'state=leaveShop(state);if(state.floor===10',`noUpgradeAfterCharge+=Number(state.shop.filter(c=>c.purchased).length===purchasesBefore);
    state=leaveShop(state);if(state.floor===10`);
 runner=replace(runner,'// Pay for relief, retaining a conservative next-shop electricity reserve.',`const entry=state;
   // Pay for relief, retaining a conservative next-shop electricity reserve.`);
 runner=replace(runner,'const next=resolveFloor(state,rngFor(game,state.floor,3));',`const next=resolveFloor(state,rngFor(game,state.floor,3));
   if(next.status==='lost'&&game<12)failureProbes.push(probeEscape(entry,offers));
   const beforeForecast=stressForecast(entry),couldDie=entry.stress+beforeForecast.highDelta>=entry.stressCap&&((entry.floor+1)%10!==0);
   const saved=couldDie&&next.status!=='lost'&&state.stress+pressure.highDelta<state.stressCap;
   nearDeathEntries+=Number(couldDie);decisionRescues+=Number(saved);
   const high=dangerous(next);highStressSteps+=Number(high);
   if(high&&!firstDangerFloor)firstDangerFloor=next.floor;
   if(high)awaitingRecovery=true;
   else if(awaitingRecovery&&next.status!=='lost'&&next.stress<=next.stressCap/2){recoveries++;recoveredThisGame=true;awaitingRecovery=false;}
   const key=String(exposureBucket(next.floor)),s=segment[key]??={steps:0,danger:0,rescues:0,stressRatio:0};s.steps++;s.danger+=Number(high);s.rescues+=Number(saved);s.stressRatio+=next.stress/next.stressCap;
   const pos=next.floor%10,part=pos===0?'shop':pos<=3?'prepare':pos<=6?'build':'peak',t=stage[part]??={steps:0,danger:0,stressRatio:0};t.steps++;t.danger+=Number(high);t.stressRatio+=next.stress/next.stressCap;
`);
 runner=replace(runner,'gamesWithCalm+=Number(state.upgrades.calm>0);',`if(firstDangerFloor)firstDanger.push(firstDangerFloor);gamesRecovered+=Number(recoveredThisGame);
  gamesWithCalm+=Number(state.upgrades.calm>0);`);
 runner=replace(runner,'const summary={id:config.id,config,runs,',`const summary={id:config.id,config,runs,
  hardship:{tightShops,cannotFullyCharge,noUpgradeAfterCharge,shopCrisis,nearDeathEntries,decisionRescues,highStressSteps,recoveries,gamesRecovered,firstDanger,shopWallets,segment,stage,failureProbes},
`);
 runner=replace(runner,'const summaries=[],outcomes:number[][]=[];',`function probeEscape(entry:RunState,offers:RunState['cabin']){
  let tested=0;const limit=900,seen=new Set<string>();
  const signature=(s:RunState)=>JSON.stringify([s.coins,s.swapped,s.cabin.map(r=>r?.id??null)]);
  const safe=(s:RunState)=>{tested++;return [137,971,2309,8707,19001].every(seed=>resolveFloor(s,seeded(seed+entry.floor)).status!=='lost');};
  const actions=(s:RunState)=>{
   const candidates:RunState[]=[];
   for(const r of [...s.cabin,...offers])if(r)for(let slot=0;slot<6;slot++){const p=planPlacement(s,r,slot);if(p.ok&&p.changed)candidates.push(p.next);}
   for(const r of s.cabin)if(r){const next=dismissRider(s,r.id);if(next!==s)candidates.push(next);}
   return candidates.filter(s=>{const k=signature(s);if(seen.has(k))return false;seen.add(k);return true;});
  };
  seen.add(signature(entry));
  if(safe(entry))return {floor:entry.floor,tested,oneAction:true,twoActions:false,truncated:false};
  const first=actions(entry);for(const s of first){if(tested>=limit)break;if(safe(s))return {floor:entry.floor,tested,oneAction:true,twoActions:false,truncated:false};}
  for(const s of first)for(const next of actions(s)){if(tested>=limit)return {floor:entry.floor,tested,oneAction:false,twoActions:false,truncated:true};if(safe(next))return {floor:entry.floor,tested,oneAction:false,twoActions:true,truncated:false};}
  return {floor:entry.floor,tested,oneAction:false,twoActions:false,truncated:false};
 }
 const summaries=[],outcomes:number[][]=[];`);
 writeFileSync(join(dir,'scripts/run.ts'),runner);
 const hashes:Record<string,string>={};for(const path of [...readdirSync(join(dir,'lib')).filter(f=>f.endsWith('.ts')).map(f=>'lib/'+f),'scripts/run.ts']){const source=readFileSync(join(dir,path),'utf8'),hash=sha(source);hashes[path]=hash;const target=join(archive,hash+'.txt');if(!existsSync(target))writeFileSync(target,source);}
 return {dir,hashes};
}
async function runOne(id:string){
 const target=join(out,id+(context==='normal'?'':'-'+context)+'.json');assert.ok(!existsSync(target),'Refusing to overwrite '+target);const {dir,hashes}=sources(id),start=Date.now();
 const child=spawn(process.execPath,[join(root,'node_modules/tsx/dist/cli.mjs'),join(dir,'scripts/run.ts'),'validate',String(runs),policies,context],{cwd:dir,stdio:['ignore','pipe','pipe']});let stdout='',stderr='';child.stdout.on('data',s=>stdout+=s);child.stderr.on('data',s=>stderr+=s);
 const code=await new Promise<number|null>((done,reject)=>{child.on('error',reject);child.on('close',done);});assert.equal(code,0,stderr.slice(-4000));
 const result=JSON.parse(stdout) as {totalGames:number;summaries:PrintedSummary[]};const report={...result,source:'v6.4-hardship-experiment',phase,id,variant:variants[id],revision,hashes,seconds:(Date.now()-start)/1000};writeFileSync(target,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({id,games:result.totalGames,seconds:report.seconds,summaries:result.summaries.map(s=>({id:s.id,mean:s.mean,death:s.deaths,tight:s.hardship.tightShops/s.shopVisits,firstDanger:s.hardship.firstDanger.reduce((a,b)=>a+b,0)/s.hardship.firstDanger.length,rescues:s.hardship.decisionRescues,high:s.hardship.highStressSteps/s.steps,recoveries:s.hardship.recoveries}))}));
}
console.log(JSON.stringify({phase,runs,ids,policies,context,seedBase,work}));let next=0;await Promise.all(Array.from({length:Math.min(3,ids.length)},async()=>{while(next<ids.length)await runOne(ids[next++]);}));
