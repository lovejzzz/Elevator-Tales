import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {E,type Rider,type UpgradeKey} from './game.mts';
import {runOne} from './run.mts';
import {replay,type World} from './runtime.mts';
import {configureScenario} from './scenarios.mts';
import {manifest,rngFor,seedFor,writeNew} from './util.mts';
const out=resolve(process.argv[2]??'');assert(process.argv[2],'Pass a fresh output directory');mkdirSync(out,{recursive:false});
const scenarios=process.argv[3]?.split(',')??['baseline','ghost-provider-cap'];
const loadouts:Record<string,UpgradeKey[]>={observed:['battery','meter','reinforced','relay'],earnings:['battery','concierge','crowd','meter'],buffer:['reinforced','calm','capacity','express']};
const before=manifest();writeNew(join(out,'manifest.json'),{...before,scenarios,classification:'constructed conditional continuation fixtures, not full games',seeds:[193843117,193843214],start:61,horizon:120,policy:'operator',shopStyle:'committed',loadouts});
const rows:unknown[]=[];
for(const scenario of scenarios)for(const [loadout,keys] of Object.entries(loadouts)){
 if(scenario==='ghost-provider-cap'&&loadout!=='observed')continue;
 configureScenario(scenario);
 for(const cabinName of ['neutral','controlled'])for(const seed of [193843117,193843214]){
  let state=E.initialRun();for(const key of keys)state=E.previewUpgrade(state,key);
  const rider=(kind:Rider['kind'],id:string,remaining:number):Rider=>({kind,id,boardedAt:60,destination:61+remaining,patience:3,fareBonus:0});
  Object.assign(state,{floor:61,status:'playing',coins:60,energy:60,stress:3,swapped:false,shop:[],reserveCell:false,serviceTurns:0,cabin:Array(6).fill(null)});
  state.cabin[0]=cabinName==='neutral'?rider('commuter','fixture-a',2):rider('ghost','fixture-a',4);
  state.cabin[1]=cabinName==='neutral'?rider('courier','fixture-b',3):rider('exorcist','fixture-b',3);
  const fixture:World={state,offers:E.makeOffers(61,state.upgrades,false,rngFor(seedFor(`${seed}/offers/61`)),state.cabin)};
  const result=runOne('operator',seed,120,false,'committed',fixture);
  replay(result.replay);
  const label=`${scenario}-${loadout}-${cabinName}-${seed}`;
  writeNew(join(out,label+'.private-replay.json'),{source:before.source,lab:before.lab,scenario:configureScenario(scenario),record:result.replay});
  writeNew(join(out,label+'.public.jsonl'),result.turns.map(t=>JSON.stringify(t)).join('\n')+'\n');
  writeNew(join(out,label+'.shops.json'),result.shops);
  const row={scenario,loadout,cabinName,seed,classification:'conditional fixture',openingCoins:60,...result.summary};rows.push(row);console.log(JSON.stringify({scenario,loadout,cabinName,seed,floor:result.summary.final.floor,outcome:result.summary.outcome,coins:result.summary.final.coins}));
 }
}
configureScenario('baseline');assert.deepEqual(manifest().source,before.source);assert.deepEqual(manifest().lab,before.lab);
writeNew(join(out,'summary.json'),{classification:'conditional fixture outcomes, NOT full-run success probabilities',rows});
