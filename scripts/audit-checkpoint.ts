import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {cpSync,mkdirSync,mkdtempSync,readFileSync,writeFileSync,symlinkSync,readdirSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const phase=process.argv[2]??'screen',runs=Number(process.argv[3]??60),ids=(process.argv[4]??'baseline').split(',');
const policies=process.argv[5]??'balanced-3,greedy-6,cautious-6,planning-pairs-6,zero-extra-6,contract-lookahead,pair-lovers,pair-police,pair-occult,pair-calming,coach-4,mimic-4,high-fare-4,rest-relay-calm,no-upgrades';
const context=process.argv[6]??'normal';
const seeds:Record<string,number>={smoke:701431,baseline:70013917,screen:70023929,refine:70033731,holdout:80013793,final:90013801,crises:90113477,specialists:90213491,rosters:90313517};
assert.ok(seeds[phase]);assert.ok(Number.isInteger(runs)&&runs>0);
const out=join(root,'docs/balance-checkpoint-2026-09-03',phase),work=mkdtempSync(join(tmpdir(),'elevator-checkpoint-'));
mkdirSync(out,{recursive:true});symlinkSync(join(root,'node_modules'),join(work,'node_modules'),'dir');writeFileSync(join(work,'package.json'),'{"type":"module"}');
const freeze=join(root,'experiments/v66');
if(!existsSync(freeze)){mkdirSync(freeze);cpSync(join(root,'lib'),join(freeze,'lib'),{recursive:true});}
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const replace=(s:string,a:string,b:string)=>{assert.equal(s.split(a).length-1,1,a);return s.replace(a,b);};
const variants:Record<string,{fares?:Record<string,number>;coop?:number;thief?:number;celebrity?:number;lover?:number;childTrip?:string;netInspection?:boolean}>={
 baseline:{},release:{},
 fares:{fares:{child:8,mechanic:10,exorcist:11,tourist:25,coach:23}},
 cooperation:{coop:4},
 risk:{thief:2,celebrity:2},
 light:{fares:{child:7,mechanic:9,exorcist:10,tourist:24,coach:22}},
 children:{fares:{child:7},childTrip:'[2, 5]'},
 inspection:{netInspection:true},
 combined:{fares:{child:7},childTrip:'[2, 5]',netInspection:true},
};
async function run(id:string){
 assert.ok(variants[id],id);const p=variants[id],target=join(out,id+'-'+context+'.json');assert.ok(!existsSync(target),target);
 const dir=join(work,id);mkdirSync(join(dir,'scripts'),{recursive:true});cpSync(join(root,id==='release'?'lib':'experiments/v66/lib'),join(dir,'lib'),{recursive:true});
 const dataPath=join(dir,'lib/game-data.ts'),enginePath=join(dir,'lib/game-engine.ts');let data=readFileSync(dataPath,'utf8'),engine=readFileSync(enginePath,'utf8');
 for(const [kind,fare] of Object.entries(p.fares??{})){
  const line=data.split('\n').find(s=>s.trimStart().startsWith(kind+':'));assert.ok(line,kind);
  data=replace(data,line,line.replace(/fare:\s*\d+/,`fare: ${fare}`));
 }
 if(p.coop)engine=replace(engine,'3 + state.upgrades.battery * 2',`${p.coop} + state.upgrades.battery * 2`);
 if(p.childTrip){const line=data.split('\n').find(s=>s.trimStart().startsWith('child:'));assert.ok(line);data=replace(data,line,line.replace(/trip:\s*\[[^\]]+\]/,'trip: '+p.childTrip));}
 if(p.netInspection){
  engine=replace(engine,"case 'inspector': if (even && passengerEnergy(state) > 0)","case 'inspector': if (even && passengerEnergy(state)-stabilizedEnergy(state)-energySavings(state) > 0)");
  engine=replace(engine,"nextFloor % 2 === 0 && passengerEnergy(state) === 0","nextFloor % 2 === 0 && passengerEnergy(state)-stabilizedEnergy(state)-energySavings(state) === 0");
 }
 if(p.thief)engine=replace(engine,'controlledThief ? 1 : 3','controlledThief ? 1 : '+p.thief);
 if(p.celebrity)engine=replace(engine,"addCoins('名人关注', 3)","addCoins('名人关注', "+p.celebrity+')');
 writeFileSync(dataPath,data);writeFileSync(enginePath,engine);
 let runner=readFileSync(join(root,'experiments/v63/scripts/tournament.ts'),'utf8');
 runner=replace(runner,'stackContract?:boolean','stackContract?:boolean;zeroExtra?:boolean;banKind?:PassengerKind;onlyKinds?:PassengerKind[]');
 runner=replace(runner,"policy('profit-only-6'",`policy('zero-extra-6',{cap:6,risk:6,lookahead:true,restAware:true,contract:true,zeroExtra:true}),
 policy('planning-pairs-6',{cap:6,risk:6,lookahead:true,restAware:true,pairSearch:true,contract:true}),
 policy('planning-pairs-4',{cap:4,risk:6,lookahead:true,restAware:true,pairSearch:true,contract:true}),
 policy('support-stack-music',{cap:6,risk:6,lookahead:true,restAware:true,contract:true,favorite:['musician'],bias:12}),
 policy('support-stack-nurse',{cap:6,risk:6,lookahead:true,restAware:true,contract:true,favorite:['nurse'],bias:12}),
 policy('sparse-planner',{cap:2,risk:6,lookahead:true,restAware:true,contract:true}),
 policy('pure-support',{cap:6,risk:6,lookahead:true,restAware:true,contract:true,onlyKinds:['musician','nurse']}),
 policy('pure-lovers',{cap:4,risk:6,lookahead:true,restAware:true,contract:true,pairSearch:true,onlyKinds:['lover']}),
 policy('pure-rogues',{cap:3,risk:6,lookahead:true,restAware:true,contract:true,onlyKinds:['thief']}),
 ...PASSENGER_ORDER.map(kind=>policy('favor-'+kind,{cap:4,risk:6,lookahead:true,restAware:true,contract:true,pairSearch:true,favorite:[kind],bias:4})),
 ...PASSENGER_ORDER.map(kind=>policy('ban-'+kind,{cap:4,risk:6,lookahead:true,restAware:true,contract:true,pairSearch:true,banKind:kind})),
 policy('profit-only-6'`);
 runner=runner.replace(/const seedBase=\d+;/,`const seedBase=${seeds[phase]};`);
 runner=replace(runner,"const cost=trip*(near?2:1)+(r.kind==='child'&&!hasNeighbour(state.cabin,slot,['lover','musician','nurse'])?trip*.5:0);",'const cost=0;');
 runner=replace(runner,'c.destination>=floor&&c.patience>=floor-state.floor','c.destination>=floor');
 runner=replace(runner,"c.key==='reinforced'?(state.weightCap<13?30:8)","c.key==='reinforced'?38");
 runner=replace(runner,'let score=energySavings(state)*2;',`const electric=energyForecast(state);
 let score=-Math.max(0,-electric.lowDelta-1)*CHARGE_PRICE*1.5;
 if(p.zeroExtra&&state.cabin.some((r,i)=>r&&riderProfile(r,state.cabin,i).energy))score-=500;
 if(state.energy+electric.lowDelta<=0&&(state.floor+1)%10!==0)score-=500;
 `);
 runner=replace(runner,'remaining*2','remaining');
 runner=replace(runner,"if(r.kind==='celebrity'&&neighbours(slot).filter(i=>state.cabin[i]).length===1)score+=3;",`if(r.kind==='celebrity'&&neighbours(slot).filter(i=>state.cabin[i]).length===1)score+=${p.celebrity??3};
 if(r.kind==='inspector'&&${p.netInspection||id==='release'?'electric.lowDelta===-1':'!state.cabin.some((r,i)=>r&&riderProfile(r,state.cabin,i).energy)'})score+=.5;`);
 if(p.thief)runner=replace(runner,"score+=controlled?1:3;","score+=controlled?1:"+p.thief+';');
 runner=replace(runner,'const waiting=[...offers];','const waiting=offers.filter(r=>r.kind!==config.banKind&&(!config.onlyKinds||state.floor<10||config.onlyKinds.includes(r.kind)));');
 runner=replace(runner,'let duplicateCalmerSteps=0,maxMusicians=0,maxNurses=0;',`let duplicateCalmerSteps=0,maxMusicians=0,maxNurses=0;
 const exposed=Object.fromEntries(PASSENGER_ORDER.map(k=>[k,0])),delivered=Object.fromEntries(PASSENGER_ORDER.map(k=>[k,0])),riderSteps=Object.fromEntries(PASSENGER_ORDER.map(k=>[k,0]));
 let extraEnergy=0,agitatedSteps=0,recoveries=0;
 `);
 runner=replace(runner,'const value=evaluator(config);','const value=evaluator(config);let inDanger=false;');
 runner=replace(runner,'// Pay for relief, retaining a conservative next-shop electricity reserve.','for(const r of offers)exposed[r.kind]++;\n   // Pay for relief, retaining a conservative next-shop electricity reserve.');
 runner=replace(runner,'const next=resolveFloor(state,rngFor(game,state.floor,3));',`const next=resolveFloor(state,rngFor(game,state.floor,3));
 for(const r of state.cabin){if(!r)continue;riderSteps[r.kind]++;if(!next.cabin.some(n=>n?.id===r.id))delivered[r.kind]++;}
 extraEnergy+=Math.max(0,-next.lastEnergy.delta-1);
 if(next.stress>=Math.ceil(next.stressCap*2/3)){inDanger=true;agitatedSteps++;}
 else if(inDanger&&next.stress<=next.stressCap/2&&next.status!=='lost'){inDanger=false;recoveries++;}
 `);
 runner=replace(runner,'const summary={id:config.id,config,runs,','const summary={id:config.id,config,runs,exposed,delivered,riderSteps,extraEnergy,agitatedSteps,recoveries,');
 // Half the normal games use the actual guided opening; half use random starts.
 runner=replace(runner,'offers=makeOffers(state.floor,state.upgrades,false,rngFor(game,state.floor,1),state.cabin),lastBoarding','offers=makeOffers(state.floor,state.upgrades,game%2===0&&context===\'normal\',rngFor(game,state.floor,1),state.cabin),lastBoarding');
 writeFileSync(join(dir,'scripts/run.ts'),runner);
 const sources=Object.fromEntries(readdirSync(join(dir,'lib')).filter(f=>f.endsWith('.ts')).map(f=>[f,readFileSync(join(dir,'lib',f),'utf8')]));
 const hashes=Object.fromEntries(Object.entries(sources).map(([f,s])=>[f,sha(s)]));
 const evidence=join(root,'docs/balance-checkpoint-2026-09-03/sources');mkdirSync(evidence,{recursive:true});
 for(const s of [...Object.values(sources),runner])if(!existsSync(join(evidence,sha(s)+'.txt')))writeFileSync(join(evidence,sha(s)+'.txt'),s);
 const child=spawn(process.execPath,[join(root,'node_modules/tsx/dist/cli.mjs'),join(dir,'scripts/run.ts'),'validate',String(runs),policies,context],{cwd:dir,stdio:['ignore','pipe','pipe']});
 let stdout='',stderr='';child.stdout.on('data',s=>stdout+=s);child.stderr.on('data',s=>{stderr+=s;for(const line of String(s).split('\n'))if(line.startsWith('{'))console.error(id+' '+line);});
 assert.equal(await new Promise((done,reject)=>{child.on('close',done);child.on('error',reject);}),0,stderr.slice(-2000));
 const result=JSON.parse(stdout);assert.equal(result.forecastFailures,0);
 writeFileSync(target,JSON.stringify({id,phase,params:p,seed:seeds[phase],revision:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),hashes,runnerHash:sha(runner),...result},null,2));
 console.log(JSON.stringify({id,games:result.totalGames,steps:result.transitions,rank:result.summaries.map((s:{id:string;mean:number})=>({id:s.id,mean:s.mean}))}));
}
let index=0;await Promise.all(Array.from({length:Math.min(3,ids.length)},async()=>{while(index<ids.length)await run(ids[index++]);}));
