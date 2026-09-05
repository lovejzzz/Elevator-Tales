import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {R,type PassengerKind} from './game.mts';
import {Session,previewWorld} from './runtime.mts';
import {hash,manifest,writeNew} from './util.mts';
import type {Action} from './types.mts';

// Diagnostic only: compare the same recorded post-decision cabin, permitting
// free withdrawal of new offers and placement of one rejected offer. No old
// rider dismissal/move, future offers, hidden fare reading or new game run.
const [input,output]=process.argv.slice(2);assert(input&&output,'INPUT_DIR OUTPUT_JSON');
const frozen=manifest(),dir=resolve(input);
const targets=new Set(['inspector','musician','courier','ghost','mystery']);
const quietKinds:PassengerKind[]=['tourist','lover','musician','nurse'];
const saved=quietKinds.map(k=>[k,[...R.BONDS[k].avoids]] as const);
function withQuietRelations<T>(changed:boolean,fn:()=>T){
 try {
  if(changed)for(const k of quietKinds)R.BONDS[k].avoids=R.BONDS[k].avoids.filter(x=>x!=='inspector');
  return fn();
 }finally{for(const [k,avoids] of saved)R.BONDS[k].avoids=[...avoids];}
}
type AuditPlan={actions:Action[];safe:boolean;budget:boolean;energy:number;rise:number;flow:number;stateValue:number;red:number;commitment:number;cabin:(string|null)[]};
type PlanSummary={legal:number;safe:number;safeBudget:number;zeroRed:number};
type RoleCase={run:string;floor:number;kind:string;band:string;volatile:boolean;remaining:number;energy:number;stress:number;baseline:PlanSummary;quiet:PlanSummary;changedPlans:number;witness:{before:AuditPlan;after:AuditPlan}|null};
const cases:RoleCase[]=[];
let replays=0,actions=0;
for(const file of readdirSync(dir).filter(f=>f.endsWith('.private-replay.json')).sort()){
 const data=JSON.parse(readFileSync(join(dir,file),'utf8'));
 assert.equal(data.record.scenario,'baseline');
 // Changelog-only revisions are allowed; all other production sources must match.
 for(const [path,digest] of Object.entries(data.source))if(path!=='lib/release-v832.ts')assert.equal(frozen.source[path as keyof typeof frozen.source],digest,path);
 const session=new Session(data.record.seed,data.record.tutorial);
 for(const event of data.record.transcript){
  assert.equal(hash(session.world()),event.before,'recorded state mismatch');
  if(event.action.type==='depart'){
   const w=session.world(),o=session.observation();
   for(const candidate of o.offers.filter(r=>targets.has(r.kind))){
    const newer=o.cabin.filter(r=>r&&r.boardedAt===o.floor&&w.offers.some(x=>session.names.id(x.id)===r.id));
    const plans:Action[][]=[];
    for(let mask=0;mask<(1<<newer.length);mask++){
     const withdrawals:Action[]=newer.flatMap((r,i)=>mask&(1<<i)?[{type:'withdraw' as const,rider:r!.id}]:[]);
     for(let slot=0;slot<6;slot++)if(!o.cabin[slot]||withdrawals.some(a=>a.type==='withdraw'&&a.rider===o.cabin[slot]?.id))plans.push([...withdrawals,{type:'place',rider:candidate.id,slot}]);
    }
    const inspect=(changed:boolean)=>withQuietRelations(changed,()=>plans.flatMap(plan=>{
     const p=previewWorld(w,plan,session.names);if(!p)return [];
     const safe=p.safety.resourceSafe&&p.safety.bombSafe;
     return [{actions:plan,safe,budget:p.features.committedEnergy<=o.energy,energy:p.features.energyCost,rise:p.features.rise,
      flow:p.features.flow,stateValue:p.features.stateValue,red:p.features.red,commitment:p.features.committedEnergy,
      cabin:p.observation.cabin.map(r=>r?.kind??null)}];
    }));
    const baseline=inspect(false),quiet=candidate.kind==='inspector'?inspect(true):baseline;
    const summary=(ps:typeof baseline)=>({legal:ps.length,safe:ps.filter(p=>p.safe).length,
     safeBudget:ps.filter(p=>p.safe&&p.budget).length,zeroRed:ps.filter(p=>p.safe&&p.budget&&p.red===0).length});
    const improved=baseline.flatMap((b,i)=>{
     const q=quiet[i];if(!q||q.red>=b.red)return [];
     return [{before:b,after:q}];
    });
    cases.push({run:file.replace('.private-replay.json',''),floor:o.floor,kind:candidate.kind,
     band:o.agitationBand,volatile:candidate.volatile,remaining:candidate.remaining,
     energy:o.energy,stress:o.stress,baseline:summary(baseline),quiet:summary(quiet),
     changedPlans:improved.length,witness:improved.find(p=>p.after.safe&&p.after.budget)??improved[0]??null});
   }
  }
  session.act(event.action);actions++;
  assert.equal(hash(session.world()),event.after,'diagnostic mutated source trajectory');
 }
 assert.equal(hash(session.world()),data.record.finalHash);replays++;
}
const groups=[...targets].map(kind=>{
 const cs=cases.filter(c=>c.kind===kind);
 const count=(fn:(c:RoleCase)=>boolean)=>cs.filter(fn).length;
 return {kind,rejected:cs.length,lowBand:count(c=>c.band==='low'),volatile:count(c=>c.volatile),
  legal:count(c=>c.baseline.legal>0),safe:count(c=>c.baseline.safe>0),budget:count(c=>c.baseline.safeBudget>0),
  zeroRed:count(c=>c.baseline.zeroRed>0),quietBudget:count(c=>c.quiet.safeBudget>0),quietZeroRed:count(c=>c.quiet.zeroRed>0),
  changed:count(c=>c.changedPlans>0)};
});
assert.deepEqual(manifest(),frozen);
const report={source:frozen,replays,actions,groups,cases,
 hypothesis:'Remove only Tourist/Lover/Musician/Nurse avoidance of Inspector in isolated previews. No fare, power, chance, generation or default rule changes.',
 limits:'Rejected offers in recorded chosen cabins only. Free new-offer withdrawals and placements, no other joint rearrangements. Budget is an estimate, not survival. No new trajectories, adoption prediction or enjoyment certification. Hypothetical relations can make more plans feasible without making them worth selecting.'};
writeNew(resolve(output),report);console.log(JSON.stringify({replays,actions,groups},null,2));
