import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const root=resolve(import.meta.dirname,'..'),dir=join(root,'docs/three-values-v65-2026-09-03');
const reports=['screen','holdout','countercheck','final','crises'].flatMap(phase=>readdirSync(join(dir,phase)).filter(f=>f.endsWith('.json')).map(file=>({path:phase+'/'+file,...JSON.parse(readFileSync(join(dir,phase,file),'utf8'))})));
const full=reports.filter(r=>r.context==='normal'),conditional=reports.filter(r=>r.context!=='normal');
assert.equal(full.reduce((s,r)=>s+r.totalGames,0),19680);assert.equal(conditional.reduce((s,r)=>s+r.totalGames,0),360);
assert.ok(reports.every(r=>r.forecastFailures===0&&r.summaries.every((s:{deaths:{censored:number}})=>s.deaths.censored===0)));
const sha=(text:Buffer|string)=>createHash('sha256').update(text).digest('hex');
const final=reports.find(r=>r.path==='final/release.json');
for(const file of ['game-engine.ts','game-data.ts','game-forecast.ts','game-interaction.ts','rider-profile.ts'])assert.equal(sha(readFileSync(join(root,'lib',file))),final.hashes[file],file);
// Preserve exact simulation modules from the private temporary copies. This
// also retains earlier rejected candidates as the runtime changes evolve.
const archives=join(dir,'sources');mkdirSync(archives,{recursive:true});
const wanted=new Set<string>(reports.flatMap(r=>[...Object.values(r.hashes) as string[],r.runnerHash]));
for(const hash of wanted){
 const path=join(archives,hash+'.txt');
 if(existsSync(path)&&sha(readFileSync(path))===hash)wanted.delete(hash);
}
for(const work of readdirSync(tmpdir()).filter(name=>name.startsWith('elevator-three-'))){
 const base=join(tmpdir(),work);for(const name of readdirSync(base)){
  const variant=join(base,name);if(!existsSync(join(variant,'lib')))continue;
  for(const file of [...readdirSync(join(variant,'lib')).map(f=>join(variant,'lib',f)),join(variant,'scripts/run.ts')]){
   if(!existsSync(file))continue;const data=readFileSync(file),hash=sha(data);if(wanted.has(hash)){writeFileSync(join(archives,hash+'.txt'),data);wanted.delete(hash);}
  }
 }
}
assert.equal(wanted.size,0,'all exact experiment sources must be archived');
const summary={fullGames:19680,conditionalGames:360,transitions:reports.reduce((s,r)=>s+r.transitions,0),forecastErrors:0,censored:0,final:final.summaries.map((s:Record<string,unknown>)=>({id:s.id,mean:s.mean,median:s.median,p10:s.p10,p90:s.p90,deaths:s.deaths,firstShopPassed:s.firstShopPassed,three:s.three})),reports:reports.map(r=>({path:r.path,games:r.totalGames,seed:r.seed,context:r.context,hashes:r.hashes,runnerHash:r.runnerHash}))};
writeFileSync(join(dir,'summary.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify({fullGames:summary.fullGames,conditionalGames:summary.conditionalGames,transitions:summary.transitions,forecastErrors:0,exactSourcesArchived:true}));
