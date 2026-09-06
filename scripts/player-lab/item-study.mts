import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {E,type UpgradeKey} from './game.mts';
import {configureScenario} from './scenarios.mts';
import {Session,replay} from './runtime.mts';
import {Player} from './policies.mts';
import {serviceFor} from './search.mts';
import {rider} from './fixtures.mts';
import {rngFor,manifest,writeNew} from './util.mts';
const [item,scenario,out,seedText='193860001',runsText='4',horizonText='61']=process.argv.slice(2);
assert(['buffer','finale'].includes(item));assert(out);
const runs=Number(runsText),base=Number(seedText);assert(Number.isInteger(runs)&&runs>0);
const horizon=Number(horizonText);assert(Number.isInteger(horizon)&&horizon>31&&horizon<=150);
configureScenario(scenario);mkdirSync(out,{recursive:false});const source=manifest();
writeNew(join(out,'manifest.json'),{source,item,runs,base,horizon,scope:`Paid conditional floor31→${horizon} trials; fixed starting resources/cabin, no subsequent upgrades. Not normal acquisition or complete games.`});
const loadouts:UpgradeKey[][]=[[],[item as UpgradeKey],['relay'],['retime'],[item as UpgradeKey,'relay'],[item as UpgradeKey,'retime']];
const rows=[];
for(let i=0;i<runs;i++)for(const loadout of loadouts){
 const seed=base+i*97;let state={...E.initialRun(),floor:31,energy:50,coins:100,earned:100};
 for(const key of loadout){state=E.previewUpgrade(state,key);state.coins-=E.UPGRADE_BASE_PRICES[key];}
 state.cabin=[rider('commuter','initial-a',31,1),rider('courier','initial-b',31,2),rider('tourist','initial-c',31,3),null,null,null];
 const session=new Session(seed,false,{state,offers:E.makeOffers(31,state.upgrades,false,rngFor(seed),state.cabin)}),player=new Player('operator','committed');
 const effects:Record<string,number>={},triggers:Record<string,number>={},actions:Record<string,number>={};let guard=0;
 while(session.observation().phase!=='lost'&&session.observation().floor<horizon){
  assert(guard++<horizon*2);const o=session.observation(),service=serviceFor(session.world(),session.names);
  const choice=o.phase==='upgrade'?player.shop({...o,shop:[]},service):player.decide(o,service);
  for(const a of choice.actions){session.act(a);actions[a.type]=(actions[a.type]??0)+1;}
  if(o.phase==='upgrade')continue;
  session.act({type:'depart'});
  for(const line of [...session.world().state.lastEarnings.sources,...session.world().state.lastEnergy.sources,...session.world().state.lastPressure.sources]){
   effects[line.label]=(effects[line.label]??0)+line.amount;triggers[line.label]=(triggers[line.label]??0)+1;
  }
 }
 const record=session.replayRecord();replay(record);const last=session.observation();
 const row={loadout,seed,floor:last.floor,censored:last.phase!=='lost',deathReason:last.phase==='lost'?session.world().state.message:null,coins:last.coins,energy:last.energy,stress:last.stress,actions,effects,triggers};
 rows.push(row);writeNew(join(out,(loadout.join('-')||'none')+'-'+seed+'.json'),{source,row,record});
 console.log(JSON.stringify({loadout,seed,floor:row.floor,censored:row.censored,itemEffect:effects[item==='buffer'?'自然回充增幅':'谢幕礼']??0}));
}
assert.deepEqual(manifest(),source);writeNew(join(out,'summary.json'),{source,rows});
