import assert from 'node:assert/strict';
import {E,D,R,F,I,U,B,P,consumeReserveCell,GAME_VERSION,type RunState,type Rider,type UpgradeKey} from './game.mts';
import type {Action,Observation,PublicRider,Preview,Features} from './types.mts';
import {hash,rngFor,seedFor} from './util.mts';
import {currentScenario} from './scenarios.mts';

export type World={state:RunState; offers:Rider[]};
export const clone=<T,>(x:T):T=>structuredClone(x);
// Engine IDs encode random output. Public IDs are stable encounter counters.
export class Names {
 private names=new Map<string,string>();
 id(id:string){if(!this.names.has(id))this.names.set(id,'p'+(this.names.size+1));return this.names.get(id)!;}
 register(w:World){[...w.state.cabin,...w.offers].forEach(r=>{if(r)this.id(r.id);});}
 actual(publicId:string,w:World){return [...w.state.cabin,...w.offers].find(r=>r&&this.id(r.id)===publicId)?.id;}
}
export function applyLocal(w:World,a:Action,names:Names):World|null {
 const s=w.state;let next=s;
 if(a.type==='place'){
  const id=names.actual(a.rider,w),r=[...s.cabin,...w.offers].find(r=>r?.id===id);
  if(!r)return null;const p=I.planPlacement(s,r,a.slot);if(!p.ok||!p.changed)return null;next=p.next;
 }else if(a.type==='dismiss'){
  const id=names.actual(a.rider,w);if(!id)return null;next=E.dismissRider(s,id);if(next===s)return null;
 }else if(a.type==='withdraw'){
  // Mirrors the UI's free reversal of a newly placed, still-present offer.
  const id=names.actual(a.rider,w),r=s.cabin.find(r=>r?.id===id);
  if(s.status!=='playing'||!r||r.boardedAt!==s.floor||!w.offers.some(o=>o.id===id))return null;
  next={...s,cabin:s.cabin.map(old=>old?.id===id?null:old)};
 }else if(a.type==='charge')next=E.chargeBattery(s,a.units);
 else if(a.type==='soothe')next=E.sootheAgitation(s,a.units);
 else if(a.type==='buy-reserve')next=E.buyReserveCell(s);
 else if(a.type==='use-reserve')next=consumeReserveCell(s);
 else if(a.type==='buy'){
  if(!Object.hasOwn(D.UPGRADES,a.key))return null;
  next=E.installUpgrade(s,a.key as UpgradeKey);
 }else return null;
 if(next===s)return null;
 return {state:next,offers:w.offers};
}
export function applyPlan(w:World,actions:Action[],names:Names):World|null {
 let next=w;for(const a of actions){const changed=applyLocal(next,a,names);if(!changed)return null;next=changed;}return next;
}
export function visibleRider(r:Rider,w:World,names:Names,slot=-1):PublicRider {
 const s=w.state,p=R.riderProfile(r,slot>=0?s.cabin:[],slot);
 return {id:names.id(r.id),kind:r.kind,name:D.PASSENGERS[r.kind].name,remaining:r.destination-s.floor,boardedAt:r.boardedAt,
  volatile:Boolean(r.volatile),energy:p.energy,agitation:p.agitation+(r.volatile?1:0),baseFare:p.hidden?null:p.fare,
  currentPayout:P.passengerBrief(r,s.floor,slot>=0?s.cabin:[],E.cooperationBonus(s),E.cooperationRelief(s),E.eventPressureMultiplier(s),s.stress).expectedFare,
  tip:r.fareBonus,stash:r.stash??0,fuse:r.fuse??null,likes:[...p.bond.likes],avoids:[...p.bond.avoids],rule:D.PASSENGERS[r.kind].detail,
  copies:p.copies.map(c=>({source:names.id(c.sourceId),field:c.field})),dismissalCost:slot>=0&&r.boardedAt<s.floor?E.dismissalCost(s,r):null,
  progress:{repair:r.repairProgress??0,repairDone:Boolean(r.repairDone),inspection:r.quietStreak??0,stamped:Boolean(r.complianceReady),care:r.careProgress??0}};
}
export function observe(w:World,names:Names,forecast=true):Observation {
 names.register(w);const s=w.state,ef=forecast&&s.status==='playing'?F.energyForecast(s):null,sf=ef?F.stressForecast(s):null;
 return {schema:2,version:GAME_VERSION,floor:s.floor,phase:s.status,energy:s.energy,energyCap:s.energyCap,stress:s.stress,stressCap:s.stressCap,coins:s.coins,
  oldMoveUsed:s.swapped,failureCause:s.status!=='lost'?null:s.message.includes('炸弹')?'bomb':s.message.includes('电量')?'energy':'agitation',cabin:s.cabin.map((r,i)=>r?visibleRider(r,w,names,i):null),
  offers:w.offers.filter(r=>!s.cabin.some(p=>p?.id===r.id)).map(r=>visibleRider(r,w,names)),
  installed:(Object.keys(s.upgrades) as UpgradeKey[]).filter(k=>s.upgrades[k]>0),
  shop:E.availableShopCards(s).map(c=>{const p=E.previewUpgrade(s,c.key);return {key:c.key,price:c.price,rule:D.UPGRADES[c.key].description,
   effect:{energyCap:p.energyCap-s.energyCap,stressCap:p.stressCap-s.stressCap,energy:p.energy-s.energy,stress:p.stress-s.stress}};}),prices:{charge:E.CHARGE_PRICE,soothe:E.SOOTHE_PRICE,reserve:B.RESERVE_CELL_PRICE},nextShop:E.nextShopFloor(s.floor),
  agitationBand:B.agitationBand(s.stress),serviceTurns:s.serviceTurns??0,reserveCell:Boolean(s.reserveCell),reserveCharge:B.RESERVE_CELL_CHARGE,
  arrivalReliefCap:B.AGITATION_RULES.arrivalReliefCap,
  dismissalsRemaining:E.dismissalsRemaining(s),upgradeSlots:U.UPGRADE_SLOTS,nextMotor:E.travelEnergyCost(s.floor+1),
  forecast:ef&&sf?{energy:[ef.lowDelta,ef.highDelta],stress:[sf.lowDelta,sf.highDelta]}:null,
  receipt:{coins:s.lastEarnings.total,energy:s.lastEnergy.delta,stress:s.lastPressure.delta,coinSources:clone(s.lastEarnings.sources)}};
}
// Estimation worlds never contain actual sealed fares. The public distribution
// is a documented model assumption, not a copy of a player's hidden reward.
export function believed(w:World,rng?:()=>number):World {
 const b=clone(w);
 for(const r of [...b.state.cabin,...b.offers])if(r?.kind==='mystery'&&r.traits)r.traits.fare=rng?E.rand(8,24,rng):16;
 return b;
}
export function features(w:World,baseCoins:number):Features {
 const s=believed(w).state;let payout=0,fareRate=0,green=0,hidden=0,stateValue=0,pendingRepair=0;
 for(let slot=0;slot<6;slot++){
  const r=s.cabin[slot];if(!r)continue;
  const worked=E.riderAfterWork(r,s.cabin,slot,s.stress);
  const p=R.riderProfile(r,s.cabin,slot),fare=E.arrivalFare(r.destination<=s.floor+1?worked:r,s.cabin,slot,E.cooperationBonus(s),s.stress);
  payout+=fare;fareRate+=fare/Math.max(1,r.destination-s.floor);hidden+=Number(p.hidden);
  green+=R.bondStatus(r,s.cabin,slot).supportCount;
  // Value observable work and retained state, not just immediate green links.
  // These are explicit policy assumptions; a short trip may not finish the job.
  const remaining=r.destination-s.floor;
  if(r.kind==='mechanic'&&!r.repairDone&&B.agitationBand(s.stress)==='low'&&remaining>=B.REPAIR_WORK-(r.repairProgress??0))pendingRepair+=B.REPAIR_DURATION;
  if(r.kind==='inspector'&&!r.complianceReady&&B.agitationBand(s.stress)==='low'&&remaining>=B.INSPECTION_WORK-(r.quietStreak??0))stateValue+=B.INSPECTION_BONUS/Math.max(1,remaining);
  if(r.kind==='child'&&(r.careProgress??0)<B.CHILD_CARE_WORK&&E.hasNeighbour(s.cabin,slot,['nurse','lover'])&&remaining>=B.CHILD_CARE_WORK-(r.careProgress??0))stateValue+=B.CHILD_CARE_BONUS/Math.max(1,remaining);
 }
 const reds=R.conflictLinks(s.cabin),people=s.cabin.filter((r):r is Rider=>Boolean(r));
 // A diagnostic counterfactual: hold this lineup for one floor with no arrivals.
 // It is NOT a legal player action or a simulated game turn. Reading the shared
 // settlement avoids a second, stale table of thief/celebrity/shop income rates.
 const held={...s,cabin:s.cabin.map(r=>r?{...r,destination:s.floor+2}:null)};
 const flow=s.cabin.some(Boolean)?E.resolveFloor(held,()=>.51).lastEarnings.total:0;
 // Public-information budget, not an oracle or a safety guarantee. Freeze
 // currently visible profiles, deliver existing riders on schedule and assume
 // one baseline passenger after the cabin empties. No unseen offers are used.
 // Ghost delays and future variable traits can invalidate this estimate.
 let committedEnergy=0,cumulativeCost=0,projected=s;
 for(let floor=s.floor;floor<E.nextShopFloor(s.floor);floor++){
  const cabin=projected.cabin.map(r=>r&&r.destination>floor?r:null);
  projected={...projected,floor,cabin};
  cumulativeCost+=cabin.some(Boolean)?E.totalEnergyCost(projected):E.travelEnergyCost(floor+1)+1-E.serviceSaving(projected);
  cumulativeCost-=cabin.filter(r=>r?.kind==='courier'&&r.destination===floor+1).length*E.COURIER_ARRIVAL_CHARGE;
  const reachesShop=(floor+1)%10===0;
  if(reachesShop)cumulativeCost-=E.SHOP_ENTRY_CHARGE;
  // Future charging cannot rescue an earlier dead floor. Non-shop ascents
  // require one remaining power; checkpoint entry may legally have zero.
  committedEnergy=Math.max(committedEnergy,cumulativeCost+(reachesShop?0:1));
  const worked=cabin.map((r,i)=>r?E.riderAfterWork(r,cabin,i,projected.stress):null);
  const completions=worked.filter((r,i)=>r?.kind==='mechanic'&&r.repairDone&&!cabin[i]?.repairDone).length;
  const rise=cabin.reduce((n,_,i)=>n+E.riderAgitation(projected,i).low,0)+R.conflictLinks(cabin).filter(r=>r.effect==='agitation').length+U.riskPartnerships(cabin).agitation+E.musicAgitation(projected);
  projected={...projected,cabin:worked,serviceTurns:Math.min(B.REPAIR_DURATION_CAP,Math.max(0,(projected.serviceTurns??0)-1)+completions*B.REPAIR_DURATION),
   stress:Math.max(0,projected.stress+rise-E.arrivalRelief(cabin.filter(r=>r&&r.destination<=floor+1).length))};
 }
 committedEnergy=Math.max(0,committedEnergy-(s.reserveCell?B.RESERVE_CELL_CHARGE:0));
 const risk=U.riskPartnerships(s.cabin),bankedPerStep=risk.members.length*(2+Number(B.agitationBand(s.stress)==='high'));
 return {occupied:people.length,newCount:people.filter(r=>r.boardedAt===s.floor).length,
  flow,fareRate,payout,energyCost:E.totalEnergyCost(s),committedEnergy,rise:s.cabin.reduce((n,_,i)=>n+E.riderAgitation(s,i).low,0)+reds.filter(r=>r.effect==='agitation').length+risk.agitation+E.musicAgitation(s),
  stateValue,pendingRepair:Math.min(B.REPAIR_DURATION_CAP,pendingRepair),bankedPerStep,riskEdges:risk.edges.length,
  green,red:reds.length,due:people.filter(r=>r.destination<=s.floor+1).length,
  shortest:people.length?Math.min(...people.map(r=>r.destination-s.floor)):0,hidden,
  newKinds:people.filter(r=>r.boardedAt===s.floor).map(r=>r.kind),spent:baseCoins-s.coins,uncertain:people.some(r=>['ghost','shifter','mimic','mystery'].includes(r.kind))};
}
export function previewWorld(base:World,actions:Action[],names:Names):Preview|null {
 const w=applyPlan(base,actions,names);if(!w)return null;
 const o=observe(w,names),f=features(w,base.state.coins),next=o.floor+1,shopWindow=next%10===0;
 // Forecast ranges enumerate Ghost arrival branches. A sample cannot certify safety.
 const energy=o.energy+(o.forecast?.energy[0]??0),stress=o.stress+(o.forecast?.stress[1]??0);
 const bombSafe=w.state.cabin.every((r,i)=>!r||r.kind!=='bomb'||E.hasNeighbour(w.state.cabin,i,['cop'])||
  (r.fuse??0)>1|| (r.destination<=next && !(next%3===0&&E.neighbours(i).some(j=>w.state.cabin[j]?.kind==='ghost'&&!E.hasNeighbour(w.state.cabin,j,['exorcist'])))));
 return {actions,observation:o,features:f,safety:{resourceSafe:f.occupied>0&&(shopWindow?energy>=0:energy>0&&stress<o.stressCap),bombSafe,shopWindow}};
}

export class Session {
 #world:World; #seed:number; #tutorial:boolean; names=new Names();
 transcript:Array<{action:Action;before:string;after:string}> = [];
 #initialWorld:World|undefined;
 constructor(seed:number,tutorial=false,fixture?:World){
  assert(Number.isSafeInteger(seed));this.#seed=seed;this.#tutorial=tutorial;
  if(fixture){assert(!tutorial,'Continuation fixture cannot be a tutorial');this.#initialWorld=clone(fixture);this.#world=clone(fixture);}
  else {const state=E.initialRun();this.#world={state,offers:E.makeOffers(1,state.upgrades,tutorial,this.rng('offers',1),state.cabin)};}
  this.names.register(this.#world);
 }
 private rng(channel:string,floor:number){return rngFor(seedFor(`${this.#seed}/${channel}/${floor}`));}
 // Trusted runtime access only. Policies import types, never this module.
 world(){return this.#world;}
 observation(){return observe(this.#world,this.names);}
 act(a:Action){
  const before=hash(this.#world);let w:World|null;
  if(a.type==='depart'){
   const s=this.#world.state;if(s.status!=='playing'||!s.cabin.some(Boolean))throw Error('Illegal empty or non-playing departure');
   const next=E.resolveFloor(clone(s),this.rng('settle',s.floor));
   w={state:next,offers:next.status==='playing'?E.makeOffers(next.floor,next.upgrades,false,this.rng('offers',next.floor),next.cabin):[]};
  }else if(a.type==='leave'){
   const s=this.#world.state;if(s.status!=='upgrade')throw Error('Not in shop');
   const next=E.leaveShop(s);w={state:next,offers:next.status==='playing'?E.makeOffers(next.floor,next.upgrades,false,this.rng('offers',next.floor),next.cabin):[]};
  }else w=applyLocal(this.#world,a,this.names);
  if(!w)throw Error('Illegal action '+JSON.stringify(a));
  this.#world=w;this.names.register(w);this.transcript.push({action:clone(a),before,after:hash(w)});return this.observation();
 }
 replayRecord(){return {schema:2,version:GAME_VERSION,scenario:currentScenario,seed:this.#seed,tutorial:this.#tutorial,...(this.#initialWorld?{initialWorld:clone(this.#initialWorld)}:{}),transcript:this.transcript,finalHash:hash(this.#world)};}
}
export function replay(record:ReturnType<Session['replayRecord']>){
 assert.equal(record.version,GAME_VERSION);assert.equal(record.scenario??'baseline',currentScenario);const s=new Session(record.seed,record.tutorial,record.initialWorld);
 for(const event of record.transcript){assert.equal(hash(s.world()),event.before);s.act(event.action);assert.equal(hash(s.world()),event.after);}
 assert.equal(hash(s.world()),record.finalHash);return s;
}
