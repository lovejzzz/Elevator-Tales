import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

// Test-only exact-source variants. Never edits lib/ or the deployed application.
// Every replacement has an exact-match guard; an unchanged variant is the
// frozen v6.1 engine byte-for-byte. Generated sources, seeds and raw runs are kept.
type Params = Partial<{
 utilityDiscount:number; energy:number; capacity:number; stressCap:number; fatigueEvery:number;
 threshold:string; sparseRelief:number; crowdedAt:number; fareScale:number;
 chargePrice:number; cooperation:number; shopInflation:number; calmPrice:number;
 calmCap:number; calmRelief:number; restCap:number; patience:number;
 weightCap:number; dismissalScale:number; loverCall:number; bombMin:number;
}>;
const variants:Record<string,Params>={
 baseline:{}, crowdFrom5:{crowdedAt:5},
 utility25:{utilityDiscount:.75}, crowdUtility25:{crowdedAt:5,utilityDiscount:.75},
 utility50:{utilityDiscount:.5}, crowdUtility50:{crowdedAt:5,utilityDiscount:.5},
};
const root=resolve(import.meta.dirname,'..');
const sourceRoot=join(root,'experiments/v61');
const phase=process.argv[2]??'smoke';
const runs=Number(process.argv[3]??(phase==='baseline'?40:phase==='holdout'?200:phase==='screen'?40:2));
const selected=(process.argv[4]??(phase==='screen'?'ofat':phase==='smoke'?'baseline':'baseline')).split(',');
const selectedPolicies=process.argv[5]??(phase==='baseline'?'all':phase==='smoke'?'balanced-3':
 'balanced-3,cautious-6,rest-relay-calm,calming-6,police-thief-4,high-fare-calm');
const ids=selected.includes('ofat')?Object.keys(variants).filter(id=>!['reliefAndCoop','crowdAndCoop'].includes(id)):selected;
assert.ok(['smoke','baseline','screen','holdout'].includes(phase));
assert.ok(Number.isSafeInteger(runs)&&runs>0);ids.forEach(id=>assert.ok(variants[id],id));
const reportDir=resolve(process.env.ELEVATOR_AUDIT_OUTPUT??join(root,'docs/crowding-v62-2026-09-03'),phase);
mkdirSync(reportDir,{recursive:true});
const work=mkdtempSync(join(tmpdir(),'elevator-parameters-'));
// Temp code resolves the project's installed runtime without changing it.
symlinkSync(join(root,'node_modules'),join(work,'node_modules'),'dir');
writeFileSync(join(work,'package.json'),'{"type":"module"}\n');
const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
// Fresh, disjoint seeds; neither batch appeared in the previous parameter audit.
const seedBase=phase==='holdout'?913784233:913129307;
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
function replaceOne(source:string,from:string,to:string){
 assert.equal(source.split(from).length-1,1,'Expected exactly one match: '+from);
 return source.replace(from,to);
}
function sources(id:string){
 const dir=join(work,id);mkdirSync(join(dir,'scripts'),{recursive:true});
 cpSync(join(sourceRoot,'lib'),join(dir,'lib'),{recursive:true});
 const p=variants[id];const engineFile=join(dir,'lib/game-engine.ts'),profileFile=join(dir,'lib/rider-profile.ts');
 let engine=readFileSync(engineFile,'utf8'),profile=readFileSync(profileFile,'utf8');
 const patch=(from:string,to:string)=>{engine=replaceOne(engine,from,to);};
 if(p.energy!==undefined)patch('restStops: 3, energy: 20','restStops: 3, energy: '+p.energy);
 if(p.capacity!==undefined)patch('energyCap: 24, stress: 0','energyCap: '+p.capacity+', stress: 0');
 if(p.stressCap!==undefined)patch('stressCap: 15, weightCap: 10','stressCap: '+p.stressCap+', weightCap: 10');
 if(p.weightCap!==undefined)patch('weightCap: 10, coins: 0','weightCap: '+p.weightCap+', coins: 0');
 if(p.fatigueEvery!==undefined)patch('Math.max(0, floor - 1) / 30','Math.max(0, floor - 1) / '+p.fatigueEvery);
 if(p.threshold!==undefined)patch('Math.ceil(cap * 2 / 3)','Math.ceil(cap * '+p.threshold+')');
 if(p.sparseRelief!==undefined)patch('occupied <= 2 ? -1 : 0','occupied <= 2 ? '+p.sparseRelief+' : 0');
 if(p.crowdedAt!==undefined)patch('occupied >= 4 ? 1','occupied >= '+p.crowdedAt+' ? 1');
 if(p.utilityDiscount!==undefined)patch('BASE_PRICES[key] + Math.max',"Math.round(BASE_PRICES[key] * (['battery','concierge','reinforced'].includes(key) ? "+p.utilityDiscount+" : 1)) + Math.max");
 if(p.fareScale!==undefined)profile=replaceOne(profile,'fare:rider.traits?.fare??spec.fare','fare:Math.round((rider.traits?.fare??spec.fare)*'+p.fareScale+')');
 if(p.chargePrice!==undefined)patch('CHARGE_PRICE = 2','CHARGE_PRICE = '+p.chargePrice);
 if(p.cooperation!==undefined)patch('3 + state.upgrades.battery * 2',p.cooperation+' + state.upgrades.battery * 2');
 if(p.shopInflation!==undefined)patch('* 12 + installed * 15','* '+p.shopInflation+' + installed * 15');
 if(p.calmPrice!==undefined)patch('calm: 35, concierge: 50','calm: '+p.calmPrice+', concierge: 50');
 if(p.calmCap!==undefined)patch('stressCap += 3','stressCap += '+p.calmCap);
 if(p.calmRelief!==undefined)patch('Math.max(0, stress - 6)','Math.max(0, stress - '+p.calmRelief+')');
 if(p.restCap!==undefined){patch('restStops: 3, energy:','restStops: '+p.restCap+', energy:');patch('REST_STOP_CAP = 3','REST_STOP_CAP = '+p.restCap);}
 if(p.patience!==undefined)patch(': spec.patience) + upgrades.concierge * 3',': spec.patience) + '+p.patience+' + upgrades.concierge * 3');
 if(p.dismissalScale!==undefined)patch('=>4+Math.max(0,rider.destination-state.floor)*2','=>Math.ceil((4+Math.max(0,rider.destination-state.floor)*2)*'+p.dismissalScale+')');
 if(p.loverCall!==undefined)patch('LOVER_CALL_CHANCE = .25','LOVER_CALL_CHANCE = '+p.loverCall);
 if(p.bombMin!==undefined)patch("kind === 'bomb' ? rand(3, 6, rng)","kind === 'bomb' ? rand("+p.bombMin+', '+(p.bombMin+3)+', rng)');
 writeFileSync(engineFile,engine);writeFileSync(profileFile,profile);
 let runner=readFileSync(join(sourceRoot,'scripts/tournament-dominance-v61.ts'),'utf8');
 runner=replaceOne(runner,'type RunState }','CHARGE_PRICE, REST_STOP_CAP, type RunState }');
 runner=replaceOne(runner,"const seedBase=mode==='train'?193409:mode==='validate'?690011:224813;",'const seedBase='+seedBase+';');
 runner=replaceOne(runner,'Math.floor(state.coins/2)','Math.floor(state.coins/CHARGE_PRICE)');
 runner=replaceOne(runner,'const reserve=2*Math.max(0,20-Math.max(0,state.energy-remaining*2));','const reserve=CHARGE_PRICE*Math.max(0,Math.min(20,state.energyCap)-Math.max(0,state.energy-remaining*2));');
 runner=replaceOne(runner,'Math.min(3,3-state.restStops)','Math.min(REST_STOP_CAP,REST_STOP_CAP-state.restStops)');
 // Instrument legal spending, deliveries, and the sources behind failure.
 runner=replaceOne(runner,'const deaths={power:0,agitation:0,fuse:0,censored:0}',`const purchases:Record<string,number>={},spending:Record<string,number>={},pressureSources:Record<string,number>={};let chargeSpend=0,shopVisits=0,firstShopPassed=0,deliveryCount=0,patienceLosses=0;\n const deaths={power:0,agitation:0,fuse:0,censored:0}`);
 runner=replaceOne(runner,"if(state.status==='upgrade'){", "if(state.status==='upgrade'){shopVisits++;const cashBeforeCharge=state.coins;");
 runner=replaceOne(runner,'for(;;){','chargeSpend+=cashBeforeCharge-state.coins;\n    for(;;){');
 runner=replaceOne(runner,'if(next===state)break;state=next;','if(next===state)break;const key=options[0].key;purchases[key]=(purchases[key]??0)+1;spending[key]=(spending[key]??0)+state.coins-next.coins;state=next;');
 runner=replaceOne(runner,'state=leaveShop(state);',"state=leaveShop(state);if(state.floor===10&&state.status==='playing')firstShopPassed++;");
 runner=replaceOne(runner,'const occupied=state.cabin.filter(Boolean).length;headcount+=occupied;',`for(const line of next.lastPressure.sources){pressureSources[line.label]=(pressureSources[line.label]??0)+line.amount;if(line.label==='乘客到站舒缓')deliveryCount-=line.amount;if(line.label==='耐心归零')patienceLosses+=line.amount/2;}\n   const occupied=state.cabin.filter(Boolean).length;headcount+=occupied;`);
 runner=replaceOne(runner,'const summary={id:config.id,config,runs,','const summary={id:config.id,config,runs,purchases,spending,chargeSpend,shopVisits,firstShopPassed,deliveryCount,patienceLosses,pressureSources,');
 // Extra controls differ only in shopping or refusal behavior, not intelligence.
 runner=replaceOne(runner,"shop:'balanced'|'calm'|'economy'","shop:'balanced'|'calm'|'economy'|'none'");
 runner=replaceOne(runner,'relay?:boolean','relay?:boolean;chargeFull?:boolean;banUpgrade?:string;pairSearch?:boolean');
 runner=replaceOne(runner,"policy('cautious-working'", "policy('no-upgrades',{cap:6,risk:9,shop:'none'}),\n policy('cautious-calm',{cap:6,risk:9,shop:'calm'}),\n policy('profit-only-6',{cap:6,risk:0}),\n policy('cautious-working'");
 runner=replaceOne(runner,"for(;;){\n     if(config.cashoutAt", "for(;;){\n     if(config.shop==='none')break;\n     if(config.cashoutAt");
 runner=replaceOne(runner,'Math.min(charge.units,Math.floor(state.coins/CHARGE_PRICE))','Math.min(config.chargeFull?state.energyCap-state.energy:charge.units,Math.floor(state.coins/CHARGE_PRICE))');
 runner=replaceOne(runner,'!c.purchased&&c.price<=state.coins','!c.purchased&&c.key!==config.banUpgrade&&c.price<=state.coins');
 runner=replaceOne(runner,"policy('profit-only-6'", "policy('cautious-full-charge',{cap:6,risk:9,chargeFull:true}),\n policy('relay-full-charge',{cap:2,risk:6,restAware:true,relay:true,quick:true,shop:'calm',chargeFull:true}),\n ...['calm','battery','concierge','solar','reinforced','express'].map(banUpgrade=>policy('without-'+banUpgrade,{cap:6,risk:9,banUpgrade})),\n policy('profit-only-6'");
 runner=replaceOne(runner,"policy('profit-only-6'", "policy('pair-cautious',{cap:6,risk:9,pairSearch:true}),\n policy('pair-balanced',{pairSearch:true}),\n policy('pair-police',{cap:4,pairSearch:true,favorite:['thief','cop','lawyer']}),\n policy('pair-occult',{pairSearch:true,favorite:['ghost','exorcist']}),\n policy('profit-only-6'");
 runner=replaceOne(runner,'const waiting=[...offers];',`const waiting=[...offers];
   if(config.pairSearch&&capFor(config,state)-state.cabin.filter(Boolean).length>=2){
    let best=value(state)+.1,next=state,chosen:number[]=[];
    for(const offer of waiting)for(let slot=0;slot<6;slot++)if(!state.cabin[slot]){
     const plan=planPlacement(state,offer,slot);if(plan.ok)best=Math.max(best,value(plan.next));
    }
    for(let i=0;i<waiting.length;i++)for(let j=i+1;j<waiting.length;j++)for(let a=0;a<6;a++)if(!state.cabin[a]){
     const first=planPlacement(state,waiting[i],a);if(!first.ok)continue;
     for(let b=0;b<6;b++)if(!first.next.cabin[b]){
      const second=planPlacement(first.next,waiting[j],b);if(!second.ok)continue;
      const score=value(second.next);if(score>best){best=score;next=second.next;chosen=[i,j];}
     }
    }
    if(chosen.length){for(const index of chosen)boarded[waiting[index].kind]++;for(const index of [...chosen].reverse())waiting.splice(index,1);state=next;lastBoarding=state.floor;}
   }`);
 // Changed base fares must not reveal hidden data to the heuristic.
 runner=replaceOne(runner,"policy('profit-only-6'",`...[4,6].flatMap(cap=>[2,6,12].flatMap(bias=>['musician','nurse'].map(kind=>policy(kind+'-stack-'+cap+'-'+bias,{cap,risk:6,bias,favorite:[kind as PassengerKind],shop:'calm'})))),
 policy('pair-calming',{cap:4,risk:6,pairSearch:true,favorite:['musician','nurse'],shop:'calm'}),
 policy('pair-lovers',{cap:4,risk:6,pairSearch:true,favorite:['lover'],shop:'calm'}),
 policy('profit-only-6'`);
 runner=replaceOne(runner,'const scores:number[]=', 'let duplicateCalmerSteps=0,maxMusicians=0,maxNurses=0;\n const scores:number[]=');
 runner=replaceOne(runner,'const occupied=state.cabin.filter(Boolean).length;headcount+=occupied;',`const musicians=state.cabin.filter(r=>r?.kind==='musician').length,nurses=state.cabin.filter(r=>r?.kind==='nurse').length;
   maxMusicians=Math.max(maxMusicians,musicians);maxNurses=Math.max(maxNurses,nurses);if(musicians>=2||nurses>=2)duplicateCalmerSteps++;
   const occupied=state.cabin.filter(Boolean).length;headcount+=occupied;`);
 runner=replaceOne(runner,'const summary={id:config.id,config,runs,','const summary={id:config.id,config,runs,duplicateCalmerSteps,maxMusicians,maxNurses,');
 if(p.fareScale!==undefined)runner=replaceOne(runner,'let fare=profile.hidden?24:profile.fare;','let fare=profile.hidden?Math.round(24*'+p.fareScale+'):profile.fare;');
 writeFileSync(join(dir,'scripts/run.ts'),runner);
 writeFileSync(join(dir,'provenance.json'),JSON.stringify({revision,id,params:p,seedBase,engineHash:sha(engine),profileHash:sha(profile),runnerHash:sha(runner)},null,2));
 if(id==='baseline')assert.equal(engine,readFileSync(join(sourceRoot,'lib/game-engine.ts'),'utf8'));
 return dir;
}
async function runOne(id:string){
 const target=join(reportDir,id+'.json');
 assert.ok(!existsSync(target),'Refusing to overwrite prior report: '+target);
 const dir=sources(id),started=Date.now();
 const child=spawn(process.execPath,[join(root,'node_modules/tsx/dist/cli.mjs'),join(dir,'scripts/run.ts'),'validate',String(runs),selectedPolicies],{cwd:dir,stdio:['ignore','pipe','pipe']});
 let out='',err='';child.stdout.on('data',chunk=>out+=chunk);child.stderr.on('data',chunk=>err+=chunk);
 const status=await new Promise<number|null>((done,reject)=>{child.on('error',reject);child.on('close',done);});
 if(status!==0)throw new Error(id+' failed: '+err.slice(-4000));
 const result=JSON.parse(out);const report={...JSON.parse(readFileSync(join(dir,'provenance.json'),'utf8')),phase,elapsedSeconds:(Date.now()-started)/1000,workspace:dir,...result};
 writeFileSync(target,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({id,games:result.totalGames,seconds:report.elapsedSeconds,ranking:result.summaries.map((s:{id:string;mean:number})=>({id:s.id,mean:s.mean})).sort((a:{mean:number},b:{mean:number})=>b.mean-a.mean)}));
}
console.log(JSON.stringify({phase,runs,variants:ids,policies:selectedPolicies,revision,work,reportDir}));
let next=0;await Promise.all(Array.from({length:Math.min(3,ids.length)},async()=>{while(next<ids.length){const id=ids[next++];await runOne(id);}}));
