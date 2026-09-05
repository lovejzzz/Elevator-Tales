import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {E,D,type RunState,type Rider} from './game.mts';
import {rider} from './fixtures.mts';
import {manifest,writeNew} from './util.mts';

// Exact local counterfactuals, not player trajectories. An isolated 9-stop
// ordinary Ghost keeps the same 8-step observation horizon legally nonempty.
// It has no neighbors, consumes no power, and does not arrive within the window.
const supports=['alone','nurse-1','nurse-3','nurse-7','musician-2','musician-5','drunk-2','drunk-4'] as const;
type Support=typeof supports[number];
type Variant='skip'|'ordinary'|'volatile';
type Trace={floor:number;departureAgitation:number;agitation:number;status:RunState['status'];energy:number;coins:number;
 serviceTurns:number;focus:Rider|null;energySources:RunState['lastEnergy']['sources'];earnings:RunState['lastEarnings']['sources'];pressure:RunState['lastPressure']['sources']};
const source=manifest();
function run(support:Support,stress:number,trip:number,variant:Variant){
 const cabin:Array<Rider|null>=Array(6).fill(null);
 cabin[5]=rider('ghost','anchor',31,9,false,false);
 if(variant!=='skip')cabin[0]=rider('mechanic','focus',31,trip,variant==='volatile',false);
 if(support!=='alone'){
  const [kind,value]=support.split('-'),remaining=Number(value);
  const k=kind as 'nurse'|'musician'|'drunk';
  assert(remaining===1||remaining>=D.PASSENGERS[k].trip[0]);
  assert(remaining<=D.PASSENGERS[k].trip[1]);
  cabin[1]=rider(k,'support',31,remaining,false,remaining===1);
  if(remaining===1)cabin[1]!.boardedAt=29;
 }
 assert(E.neighbours(5).every(i=>!cabin[i]),'Anchor must never interact');
 let state:RunState={...E.initialRun(),floor:31,energy:60,stress,cabin};
 let repairFloor:number|null=null,deliveredFloor:number|null=null;
 const trace:Trace[]=[];
 for(let step=0;step<8&&state.status==='playing';step++){
  const prior=structuredClone(state);
  state=E.resolveFloor(state,()=>.99);
  assert.equal(state.floor,32+step);
  if((state.serviceTurns??0)>Math.max(0,(prior.serviceTurns??0)-1))repairFloor=state.floor;
  if(prior.cabin.some(r=>r?.id==='focus')&&!state.cabin.some(r=>r?.id==='focus'))deliveredFloor=state.floor;
  trace.push({floor:state.floor,departureAgitation:prior.stress,agitation:state.stress,status:state.status,
   energy:state.energy,coins:state.coins,serviceTurns:state.serviceTurns??0,
   focus:state.cabin.find(r=>r?.id==='focus')??null,
   energySources:state.lastEnergy.sources,earnings:state.lastEarnings.sources,pressure:state.lastPressure.sources});
 }
 const sum=(field:'energySources'|'earnings',label:string)=>trace.reduce((s,t)=>s+t[field].filter(l=>l.label===label).reduce((s,l)=>s+l.amount,0),0);
 return {variant,status:state.status,steps:trace.length,repairFloor,deliveredFloor,coins:state.coins,energy:state.energy,
  agitation:state.stress,unconsumedService:state.serviceTurns??0,repairSaving:sum('energySources','检修运转节能'),
  drunkPremium:sum('earnings','醉汉躁动加价'),trace};
}
const cases:Array<{support:Support;stress:number;trip:number}&Record<Variant,ReturnType<typeof run>>>=[];
for(const support of supports)for(let stress=0;stress<8;stress++)for(let trip=3;trip<=7;trip++){
 cases.push({support,stress,trip,skip:run(support,stress,trip,'skip'),ordinary:run(support,stress,trip,'ordinary'),volatile:run(support,stress,trip,'volatile')});
}
const get=(support:Support,stress:number,trip:number)=>cases.find(c=>c.support===support&&c.stress===stress&&c.trip===trip)!;
// Known boundaries from the actual public departure timing, not an assumption
// that high-risk passengers are always worse or that low agitation is utility.
assert.equal(get('alone',0,3).volatile.repairFloor,33);
assert.equal(get('alone',1,3).volatile.repairFloor,33);
assert.equal(get('alone',2,3).volatile.repairFloor,null);
assert.equal(get('alone',2,3).ordinary.repairFloor,33);
assert.equal(get('nurse-3',2,3).volatile.repairFloor,33);
assert.equal(get('alone',0,7).volatile.repairSaving,3);
assert.equal(get('alone',7,3).volatile.status,'lost');
assert.equal(get('alone',7,3).ordinary.status,'playing');
assert(cases.every(c=>c.skip.repairSaving===0));
const safe=(r:ReturnType<typeof run>)=>r.status==='playing'&&r.steps===8;
const summary=supports.map(support=>{
 const rows=cases.filter(c=>c.support===support),both=rows.filter(c=>safe(c.ordinary)&&safe(c.volatile));
 return {support,cases:rows.length,bothSurvive:both.length,
  ordinaryOnlySurvives:rows.filter(c=>safe(c.ordinary)&&!safe(c.volatile)).length,
  volatileOnlySurvives:rows.filter(c=>safe(c.volatile)&&!safe(c.ordinary)).length,
  ordinaryRepairs:rows.filter(c=>c.ordinary.repairFloor!==null).length,
  volatileRepairs:rows.filter(c=>c.volatile.repairFloor!==null).length,
  bothSafeVolatileMoreCoins:both.filter(c=>c.volatile.coins>c.ordinary.coins).length,
  bothSafeVolatileLessEnergy:both.filter(c=>c.volatile.energy<c.ordinary.energy).length,
  bothSafeExtraDrunkPremium:both.filter(c=>c.volatile.drunkPremium>c.ordinary.drunkPremium).length};
});
const examples={lowStart:get('alone',0,3),edgeStart:get('alone',2,3),nursedEdge:get('nurse-3',2,3),
 highTooLate:get('alone',7,3),earlyNurseExit:get('nurse-1',2,3),
 premiumCounterexamples:cases.filter(c=>safe(c.ordinary)&&safe(c.volatile)&&c.volatile.drunkPremium>c.ordinary.drunkPremium)};
assert.deepEqual(manifest(),source);
writeNew(resolve(process.argv[2]),{source,executions:cases.length*3,summary,examples,cases,limitations:[
 '960 fixed-action eight-step fixtures, not 960 games; no frequency or human win-rate interpretation.',
 'Every variant has the same isolated nine-stop zero-power Ghost to keep the full eight-step horizon nonempty. It never interacts or pays in the window; this context is explicit, not general gameplay.',
 'No new offers, upgrades, shopping, moves, dismissal or random power. RNG .99 is irrelevant in these cabins; full traces retained.',
 'One-stop Nurse is an existing three-stop rider boarded at29; other supports and Mechanics use legal new trip lengths. No reconstructed R03 hidden state.',
 'Higher agitation is not assigned a negative utility. Actual failures, work, energy and state payouts are separate.',
 'Skip comparison retains the occupied-seat opportunity cost only as a missing rider, not as an optimally filled substitute. Residual service turns are reported, not invented as spent savings.',
 'No gameplay balance parameter is changed by this experiment.'
]});
console.log(JSON.stringify({executions:cases.length*3,summary,counterexamples:examples.premiumCounterexamples.map(c=>({support:c.support,stress:c.stress,trip:c.trip,normalCoins:c.ordinary.coins,riskCoins:c.volatile.coins,normalPremium:c.ordinary.drunkPremium,riskPremium:c.volatile.drunkPremium}))},null,2));
