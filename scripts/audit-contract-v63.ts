import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync, symlinkSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const root=resolve(import.meta.dirname,'..'), frozen=join(root,'experiments/v62');
const phase=process.argv[2]??'screen',runs=Number(process.argv[3]??80);
const ids=(process.argv[4]??'baseline,relief1,relief2,relief3').split(',');
const policies=process.argv[5]??'cautious-calm,cautious-6,without-calm,contract-mixed-4,contract-mixed-6,contract-no-calm-4,contract-no-calm-6,contract-only-4,contract-pair-no-calm,contract-police-no-calm,contract-lovers-no-calm,contract-calming-no-calm';
const context=process.argv[6]??'normal';
const variants:Record<string,number>={baseline:0,relief1:1,relief2:2,relief3:3,relief3Price60:3,relief3Price75:3};
const prices:Record<string,number>={relief3Price60:60,relief3Price75:75};
assert.ok(['screen','broad','holdout','stress'].includes(phase));
assert.ok(Number.isSafeInteger(runs)&&runs>0);ids.forEach(id=>assert.ok(id in variants));
const seedBase=phase==='holdout'?946882903:phase==='stress'?946399207:946121329;
const reportRoot=resolve(process.env.ELEVATOR_AUDIT_OUTPUT??join(root,'docs/contract-v63-2026-09-03'));
const out=join(reportRoot,phase),archive=join(reportRoot,'generated-sources');
mkdirSync(out,{recursive:true});mkdirSync(archive,{recursive:true});
const work=mkdtempSync(join(tmpdir(),'elevator-contract-'));
symlinkSync(join(root,'node_modules'),join(work,'node_modules'),'dir');
writeFileSync(join(work,'package.json'),'{"type":"module"}\n');
const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const replace=(s:string,a:string,b:string)=>{assert.equal(s.split(a).length-1,1,a);return s.replace(a,b);};
function sources(id:string){
  const dir=join(work,id);mkdirSync(join(dir,'scripts'),{recursive:true});
  cpSync(join(root,'lib'),join(dir,'lib'),{recursive:true});
  let engine= id==='baseline' ? readFileSync(join(frozen,'lib/game-engine.ts'),'utf8') : readFileSync(join(root,'lib/game-engine.ts'),'utf8').replace(/export const COOPERATION_RELIEF = \d+;/,`export const COOPERATION_RELIEF = ${variants[id]};`);
  assert.equal(engine.match(/battery: \d+, solar: 55/g)?.length,1);
  engine=engine.replace(/battery: \d+, solar: 55/,`battery: ${prices[id]??45}, solar: 55`);
  const forecast=readFileSync(join(id==='baseline'?frozen:root,'lib/game-forecast.ts'),'utf8');
  writeFileSync(join(dir,'lib/game-engine.ts'),engine);writeFileSync(join(dir,'lib/game-forecast.ts'),forecast);
  let runner=readFileSync(join(frozen,'scripts/tournament.ts'),'utf8');
  runner=replace(runner,'const seedBase=913784233;',`const seedBase=${seedBase};`);
  runner=replace(runner,'pairSearch?:boolean','pairSearch?:boolean;contract?:boolean;contractOnly?:boolean;stackContract?:boolean');
  runner=replace(runner,"policy('profit-only-6'",`...[3,4,6].flatMap(cap=>[
    policy('contract-mixed-'+cap,{cap,risk:9,contract:true}),
    policy('contract-no-calm-'+cap,{cap,risk:9,contract:true,banUpgrade:'calm'}),
    policy('contract-only-'+cap,{cap,risk:9,contract:true,contractOnly:true}),
  ]),
  ...['pair','police','lovers','calming'].flatMap(group=>[false,true].map(noCalm=>policy('contract-'+group+(noCalm?'-no-calm':'-mixed'),{cap:4,risk:9,contract:true,pairSearch:true,banUpgrade:noCalm?'calm':undefined,favorite:group==='police'?['thief','cop','lawyer']:group==='lovers'?['lover']:group==='calming'?['musician','nurse']:[]}))),
  policy('contract-stack',{cap:6,risk:9,contract:true,stackContract:true}),
  policy('contract-lookahead',{cap:4,risk:6,restAware:true,lookahead:true,contract:true}),
  policy('contract-lookahead-no-calm',{cap:4,risk:6,restAware:true,lookahead:true,contract:true,banUpgrade:'calm'}),
  policy('profit-only-6'`);
  runner=replace(runner,'!c.purchased&&c.key!==config.banUpgrade',"!c.purchased&&(!config.contractOnly||c.key==='battery')&&(!config.contract||config.stackContract||c.key!=='battery'||state.upgrades.battery===0)&&c.key!==config.banUpgrade");
  runner=replace(runner,'return {...c,score:worth/c.price};',`const priority=config.contract&&c.key==='calm'&&state.stress>=state.stressCap?10000:config.contract&&c.key==='battery'&&(state.upgrades.battery===0||config.stackContract)?1000:0;
      return {...c,score:priority||worth/c.price};`);
  runner=replace(runner,'const scores:number[]=', 'let gamesWithCalm=0,gamesWithContract=0;\n const scores:number[]=');
  runner=replace(runner,'scores.push(state.floor);','gamesWithCalm+=Number(state.upgrades.calm>0);gamesWithContract+=Number(state.upgrades.battery>0);scores.push(state.floor);');
  runner=replace(runner,'const summary={id:config.id,config,runs,','const summary={id:config.id,config,runs,gamesWithCalm,gamesWithContract,');
  writeFileSync(join(dir,'scripts/run.ts'),runner);
  const hashes:Record<string,string>={};
  for(const path of [...readdirSync(join(dir,'lib')).filter(f=>f.endsWith('.ts')).map(f=>'lib/'+f),'scripts/run.ts']){
    const source=readFileSync(join(dir,path),'utf8'),hash=sha(source);hashes[path]=hash;
    const target=join(archive,hash+'.txt');if(!existsSync(target))writeFileSync(target,source);
  }
  return {dir,hashes};
}
async function runOne(id:string){
  const target=join(out,id+(context==='normal'?'':'-'+context)+'.json');assert.ok(!existsSync(target),'Refusing to overwrite '+target);
  const {dir,hashes}=sources(id),start=Date.now();
  const child=spawn(process.execPath,[join(root,'node_modules/tsx/dist/cli.mjs'),join(dir,'scripts/run.ts'),'validate',String(runs),policies,context],{cwd:dir,stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='';child.stdout.on('data',s=>stdout+=s);child.stderr.on('data',s=>stderr+=s);
  const code=await new Promise<number|null>((done,reject)=>{child.on('error',reject);child.on('close',done);});
  assert.equal(code,0,stderr.slice(-4000));
  const result=JSON.parse(stdout) as {totalGames:number;summaries:Array<{id:string;mean:number;gamesWithCalm:number;gamesWithContract:number}>};
  const report={...result,source:'v6.3-contract-experiment',phase,id,relief:variants[id],contractBasePrice:prices[id]??45,revision,hashes,seconds:(Date.now()-start)/1000};
  writeFileSync(target,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({id,context,games:result.totalGames,seconds:report.seconds,ranking:[...result.summaries].sort((a,b)=>b.mean-a.mean).map(s=>({id:s.id,mean:s.mean,calm:s.gamesWithCalm,contract:s.gamesWithContract}))}));
}
console.log(JSON.stringify({phase,runs,ids,policies,context,seedBase,work}));
let next=0;await Promise.all(Array.from({length:Math.min(3,ids.length)},async()=>{while(next<ids.length)await runOne(ids[next++]);}));
