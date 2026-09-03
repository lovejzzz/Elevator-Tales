import { ADJACENT, PASSENGERS, type PassengerKind } from './game-data';
import type { Rider } from './game-engine';

export type Bond = { likes: PassengerKind[]; avoids: PassengerKind[] };
// weight is a retired compatibility field for archived simulations, not a rule.
export type VariableTraits = { weight: number; energy?: number; agitation?: number; fare: number; bond: Bond; revision: number };
export type CopyField = 'energy' | 'fare' | 'agitation' | 'weight' | 'bond';
export type CopiedTrait = { sourceId: string; sourceKind: PassengerKind; field: CopyField };
export const COPY_LABELS: Record<CopyField,string> = {energy:'每站耗电',fare:'车费',agitation:'躁动与联动偏好',weight:'旧属性（已停用）',bond:'联动偏好'};
export const BONDS: Record<PassengerKind,Bond> = {
 commuter:{likes:['courier'],avoids:['drunk']},
 tourist:{likes:['celebrity'],avoids:['thief']},
 courier:{likes:['mechanic'],avoids:['ghost']},
 mechanic:{likes:['inspector'],avoids:['drunk']},
 lover:{likes:['lover'],avoids:['ghost']},
 musician:{likes:['tourist'],avoids:['inspector']},
 thief:{likes:['cop','lawyer'],avoids:['inspector']},
 cop:{likes:['thief','bomb'],avoids:['drunk']},
 lawyer:{likes:['thief'],avoids:['ghost']},
 drunk:{likes:['musician','nurse'],avoids:['inspector']},
 nurse:{likes:['child','drunk'],avoids:['ghost']},
 child:{likes:['lover','musician','nurse'],avoids:['bomb']},
 ghost:{likes:['exorcist'],avoids:['inspector']},
 exorcist:{likes:['ghost'],avoids:['drunk']},
 coach:{likes:['commuter','courier'],avoids:['celebrity']},
 celebrity:{likes:['tourist'],avoids:['inspector']},
 inspector:{likes:['mechanic'],avoids:['thief']},
 bomb:{likes:['cop'],avoids:['child']},
 mystery:{likes:['lawyer'],avoids:['inspector']},
 shifter:{likes:['nurse'],avoids:['cop']},
 mimic:{likes:['mimic'],avoids:['ghost']},
};
const nearby=(slot:number)=>ADJACENT.flatMap(([a,b])=>a===slot?[b]:b===slot?[a]:[]);
const hash=(text:string)=>{let n=2166136261;for(const ch of text)n=Math.imul(n^ch.charCodeAt(0),16777619);return n>>>0;};
const randomInt=(min:number,max:number,rng:()=>number)=>min+Math.floor(rng()*(max-min+1));
export function randomTraits(kind:'mystery'|'shifter', available:PassengerKind[], rng:()=>number, revision=0):VariableTraits {
 const pool=available.filter(k=>!['mystery','shifter','mimic',kind].includes(k));
 const liked=pool[randomInt(0,pool.length-1,rng)]??'commuter';
 const rest=pool.filter(k=>k!==liked);
 const avoided=rest[randomInt(0,rest.length-1,rng)]??'drunk';
 return {weight:0,energy:randomInt(1,2,rng),agitation:randomInt(0,1,rng),fare:randomInt(kind==='shifter'?28:8,kind==='shifter'?48:40,rng),bond:{likes:[liked],avoids:[avoided]},revision};
}
function ownProfile(rider:Rider){
 const spec=PASSENGERS[rider.kind];
 return {weight:0,energy:rider.traits?.energy??spec.energy,agitation:rider.traits?.agitation??0,fare:rider.traits?.fare??spec.fare,bond:rider.traits?.bond??BONDS[rider.kind],hidden:rider.kind==='mystery'};
}
export function riderProfile(rider:Rider,cabin:Array<Rider|null>=[],slot=cabin.findIndex(r=>r?.id===rider.id)) {
 const result={...ownProfile(rider),copies:[] as CopiedTrait[]};
 if(rider.kind!=='mimic'||slot<0)return result;
 const sources=nearby(slot).flatMap(i=>cabin[i]?[cabin[i]!]:[]).sort((a,b)=>a.id.localeCompare(b.id));
 const fields:CopyField[]=['energy','fare','agitation'];
 // Stable for a given neighbor set: reconnecting cannot reroll. No recursive
 // calls: a neighboring mimic contributes its own baseline attributes.
 const signature=sources.map(r=>r.id).join('|');
 for(const source of sources){
   const field=fields.splice(hash(String(rider.copySeed??rider.id)+signature+source.id)%fields.length,1)[0];
   const profile=ownProfile(source);
   if(field==='energy')result.energy=profile.energy;
   if(field==='fare'){result.fare=profile.fare;result.hidden=profile.hidden;}
   if(field==='agitation'){result.agitation=profile.agitation;result.bond=profile.bond;}
   result.copies.push({sourceId:source.id,sourceKind:source.kind,field});
 }
 return result;
}
export function bondStatus(rider:Rider,cabin:Array<Rider|null>,slot=cabin.findIndex(r=>r?.id===rider.id)){
 const profile=riderProfile(rider,cabin,slot);
 const kinds=slot<0?[]:nearby(slot).flatMap(i=>cabin[i]?[cabin[i]!.kind]:[]);
 const supportCount=kinds.filter(kind=>profile.bond.likes.includes(kind)).length;
 const rawConflictCount=kinds.filter(kind=>profile.bond.avoids.includes(kind)).length;
 const supported=supportCount>0;
 const conflictCount=supported?0:rawConflictCount;
 const conflict=conflictCount>0;
 return {supported,conflict,supportCount,conflictCount,...profile};
}
export const profileWeight=(cabin:Array<Rider|null>)=>cabin.reduce((sum,r,i)=>sum+(r?riderProfile(r,cabin,i).weight:0),0);
export function bondSummary(rider:Rider,cabin:Array<Rider|null>=[],bonus=3){
 const {bond}=riderProfile(rider,cabin);
 const names=(kinds:PassengerKind[])=>kinds.map(k=>PASSENGERS[k].name).join(' / ');
 return {
  partners:names(bond.likes),opponents:names(bond.avoids),bonus,
  benefit:`每条协作连接：本人到站额外 +${bonus} 金币`,
  condition:'到站时每位仍相邻的协作对象各算一条',
  conflict:'每条冲突连接：偶数层躁动 +1；有协作邻座时全部免除',
 };
}
export function bondLines(rider:Rider,cabin:Array<Rider|null>=[],bonus=3){
 const {copies}=riderProfile(rider,cabin);
 const summary=bondSummary(rider,cabin,bonus);
 return [
  `协作：${summary.partners}。本人到站时，每位仍相邻的协作对象 → 额外 +${bonus} 金币。`,
  '多条绿色连接逐条叠加；恋人、教练、途中收入等人物技能另外计算。',
  `冲突：${summary.opponents}。${summary.conflict}；只免除邻座冲突，不改变人物自身技能。`,
  ...copies.map(c=>'复制 '+PASSENGERS[c.sourceKind].name+' 的'+COPY_LABELS[c.field]+'。'),
 ];
}
