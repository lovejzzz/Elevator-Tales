import { ADJACENT, PASSENGERS, type PassengerKind } from './game-data';
import type { Rider } from './game-engine';

export type Bond = { likes: PassengerKind[]; avoids: PassengerKind[] };
export type VariableTraits = { weight: number; fare: number; bond: Bond; revision: number };
export type CopyField = 'weight' | 'fare' | 'bond';
export type CopiedTrait = { sourceId: string; sourceKind: PassengerKind; field: CopyField };
export const COPY_LABELS: Record<CopyField,string> = {weight:'载重',fare:'车费',bond:'联动偏好'};
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
 return {weight:randomInt(1,kind==='shifter'?4:3,rng),fare:randomInt(kind==='shifter'?28:8,kind==='shifter'?48:40,rng),bond:{likes:[liked],avoids:[avoided]},revision};
}
function ownProfile(rider:Rider){
 const spec=PASSENGERS[rider.kind];
 return {weight:rider.traits?.weight??spec.weight,fare:rider.traits?.fare??spec.fare,bond:rider.traits?.bond??BONDS[rider.kind],hidden:rider.kind==='mystery'};
}
export function riderProfile(rider:Rider,cabin:Array<Rider|null>=[],slot=cabin.findIndex(r=>r?.id===rider.id)) {
 const result={...ownProfile(rider),copies:[] as CopiedTrait[]};
 if(rider.kind!=='mimic'||slot<0)return result;
 const sources=nearby(slot).flatMap(i=>cabin[i]?[cabin[i]!]:[]).sort((a,b)=>a.id.localeCompare(b.id));
 const fields:CopyField[]=['weight','fare','bond'];
 // Stable for a given neighbor set: reconnecting cannot reroll. No recursive
 // calls: a neighboring mimic contributes its own baseline attributes.
 const signature=sources.map(r=>r.id).join('|');
 for(const source of sources){
   const field=fields.splice(hash(String(rider.copySeed??rider.id)+signature+source.id)%fields.length,1)[0];
   const profile=ownProfile(source);
   if(field==='weight')result.weight=profile.weight;
   if(field==='fare'){result.fare=profile.fare;result.hidden=profile.hidden;}
   if(field==='bond')result.bond=profile.bond;
   result.copies.push({sourceId:source.id,sourceKind:source.kind,field});
 }
 return result;
}
export function bondStatus(rider:Rider,cabin:Array<Rider|null>,slot=cabin.findIndex(r=>r?.id===rider.id)){
 const profile=riderProfile(rider,cabin,slot);
 const kinds=slot<0?[]:nearby(slot).flatMap(i=>cabin[i]?[cabin[i]!.kind]:[]);
 const supported=kinds.some(kind=>profile.bond.likes.includes(kind));
 const conflict=!supported&&kinds.some(kind=>profile.bond.avoids.includes(kind));
 return {supported,conflict,...profile};
}
export const profileWeight=(cabin:Array<Rider|null>)=>cabin.reduce((sum,r,i)=>sum+(r?riderProfile(r,cabin,i).weight:0),0);
export function bondLines(rider:Rider,cabin:Array<Rider|null>=[],bonus=3){
 const {bond,copies}=riderProfile(rider,cabin);
 const names=(kinds:PassengerKind[])=>kinds.map(k=>PASSENGERS[k].name).join(' / ');
 return [
  '协作：'+names(bond.likes)+'邻座 → 到站额外 +'+bonus+' 金币。',
  '冲突：'+names(bond.avoids)+'邻座 → 偶数层躁动 +1；有协作邻座可压住。',
  ...copies.map(c=>'复制 '+PASSENGERS[c.sourceKind].name+' 的'+COPY_LABELS[c.field]+'。'),
 ];
}

