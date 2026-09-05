import { ADJACENT, PASSENGERS, PASSENGER_ORDER, type PassengerKind } from './game-data';
import type { Rider } from './game-engine';

export type Bond = { likes: PassengerKind[]; avoids: PassengerKind[] };
// weight is a retired compatibility field for archived simulations, not a rule.
export type ConflictEffect = 'agitation' | 'energy' | 'coins' | 'overload' | 'gamble';
export type ConflictLink = { first: number; second: number; effect: ConflictEffect };
export type VariableTraits = { weight: number; energy?: number; agitation?: number; fare: number; bond: Bond; conflictEffect?: ConflictEffect; revision: number };
export type CopyField = 'energy' | 'fare' | 'agitation' | 'weight' | 'bond';
export type CopiedTrait = { sourceId: string; sourceKind: PassengerKind; field: CopyField };
export const COPY_LABELS: Record<CopyField,string> = {energy:'每站耗电',fare:'车费',agitation:'躁动与联动偏好',weight:'旧属性（已停用）',bond:'联动偏好'};
export const BONDS: Record<PassengerKind,Bond> = {
 commuter:{likes:['courier'],avoids:['drunk','celebrity']},
 tourist:{likes:['celebrity'],avoids:['thief']},
 courier:{likes:['mechanic'],avoids:['ghost','drunk']},
 mechanic:{likes:['inspector'],avoids:['drunk','celebrity']},
 lover:{likes:['lover'],avoids:['ghost']},
 musician:{likes:['tourist'],avoids:['bomb']},
 thief:{likes:['cop'],avoids:['inspector','ghost']},
 cop:{likes:['thief','bomb'],avoids:['drunk','celebrity']},
 lawyer:{likes:['thief'],avoids:['ghost','cop']},
 drunk:{likes:['nurse'],avoids:['inspector']},
 nurse:{likes:['child','drunk'],avoids:['ghost']},
 child:{likes:['lover','nurse'],avoids:['bomb','drunk']},
 ghost:{likes:['exorcist'],avoids:['inspector','mimic']},
 exorcist:{likes:['ghost'],avoids:['drunk','mystery']},
 coach:{likes:['commuter','courier'],avoids:['celebrity','musician']},
 celebrity:{likes:['tourist'],avoids:['inspector']},
 inspector:{likes:['mechanic'],avoids:['thief','mystery']},
 bomb:{likes:['cop'],avoids:['child','mechanic']},
 mystery:{likes:['coach'],avoids:['inspector']},
 shifter:{likes:['nurse'],avoids:['cop']},
 mimic:{likes:['mimic'],avoids:['ghost','bomb']},
};
const pairKey=(a:PassengerKind,b:PassengerKind)=>[a,b].sort().join(':');
const effectPairs=(effect:ConflictEffect,pairs:Array<[PassengerKind,PassengerKind]>)=>pairs.map(([a,b])=>[pairKey(a,b),effect] as const);
export const CONFLICT_EFFECTS:Record<string,ConflictEffect>=Object.fromEntries([
 ...effectPairs('agitation',[
  ['commuter','drunk'],['lover','ghost'],['cop','drunk'],['nurse','ghost'],['child','bomb'],['exorcist','drunk'],
  ['shifter','cop'],['musician','bomb'],['cop','celebrity'],['child','drunk'],
 ]),
 ...effectPairs('coins',[
  ['tourist','thief'],['thief','inspector'],['drunk','inspector'],['celebrity','inspector'],
  ['mystery','inspector'],['commuter','celebrity'],['courier','drunk'],['thief','ghost'],
  ['lawyer','cop'],
 ]),
 ...effectPairs('energy',[
  ['courier','ghost'],['mechanic','drunk'],['lawyer','ghost'],['ghost','inspector'],['mechanic','celebrity'],
  ['exorcist','mystery'],['coach','musician'],['mimic','bomb'],
 ]),
 ...effectPairs('overload', [['mechanic','bomb'],['ghost','mimic']]),
 ...effectPairs('gamble', [['coach','celebrity']]),
]);
const nearby=(slot:number)=>ADJACENT.flatMap(([a,b])=>a===slot?[b]:b===slot?[a]:[]);
const hash=(text:string)=>{
 let n=2166136261;
 for(const ch of text)n=Math.imul(n^ch.charCodeAt(0),16777619);
 // Avalanche before choosing a binary field. Raw FNV's low bit is just input
 // parity, which couples all Mimics into two identical/inverse source maps.
 // No runtime RNG or mutable cache: the exact pair stays stable across moves.
 n=Math.imul(n^(n>>>16),0x85ebca6b);
 n=Math.imul(n^(n>>>13),0xc2b2ae35);
 return (n^(n>>>16))>>>0;
};
const randomInt=(min:number,max:number,rng:()=>number)=>min+Math.floor(rng()*(max-min+1));
export function randomTraits(kind:'mystery'|'shifter', available:PassengerKind[], rng:()=>number, revision=0):VariableTraits {
 const pool=available.filter(k=>!['mystery','shifter','mimic',kind].includes(k));
 const liked=pool[randomInt(0,pool.length-1,rng)]??'commuter';
 const rest=pool.filter(k=>k!==liked);
 const avoided=rest[randomInt(0,rest.length-1,rng)]??'drunk';
 const conflictEffect=(['agitation','energy','coins'] as ConflictEffect[])[randomInt(0,2,rng)];
 return {weight:0,energy:randomInt(1,2,rng),agitation:randomInt(0,1,rng),fare:randomInt(kind==='shifter'?16:8,kind==='shifter'?28:24,rng),bond:{likes:[liked],avoids:[avoided]},conflictEffect,revision};
}
function ownProfile(rider:Rider){
 const spec=PASSENGERS[rider.kind];
 return {weight:0,energy:rider.traits?.energy??spec.energy,agitation:rider.traits?.agitation??0,fare:rider.traits?.fare??spec.fare,bond:rider.traits?.bond??BONDS[rider.kind],conflictEffect:rider.traits?.conflictEffect,hidden:rider.kind==='mystery'};
}
export function riderProfile(rider:Rider,cabin:Array<Rider|null>=[],slot=cabin.findIndex(r=>r?.id===rider.id)) {
 const result={...ownProfile(rider),copies:[] as CopiedTrait[]};
 if(rider.kind!=='mimic'||slot<0)return result;
 // Only the immediately-above position. The pair key deliberately excludes
 // floor, column, and all other neighbors. Preview/reseat never consumes RNG.
 const source = slot >= 3 ? cabin[slot-3] : null;
 if(source){
   const field:CopyField=hash(JSON.stringify([rider.copySeed??0,rider.id,source.id]))%2===0?'energy':'fare';
   const profile=ownProfile(source);
   if(field==='energy')result.energy=profile.energy;
   if(field==='fare'){result.fare=profile.fare;result.hidden=profile.hidden;}
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
 const conflictCount=rawConflictCount;
 const conflict=conflictCount>0;
 return {supported,conflict,supportCount,conflictCount,...profile};
}
export function conflictEffectBetween(a:Rider,b:Rider,cabin:Array<Rider|null>=[],aSlot=cabin.findIndex(r=>r?.id===a.id),bSlot=cabin.findIndex(r=>r?.id===b.id)):ConflictEffect|null{
 const aProfile=riderProfile(a,cabin,aSlot),bProfile=riderProfile(b,cabin,bSlot);
 const aAvoids=aProfile.bond.avoids.includes(b.kind),bAvoids=bProfile.bond.avoids.includes(a.kind);
 if(!aAvoids&&!bAvoids)return null;
 return CONFLICT_EFFECTS[pairKey(a.kind,b.kind)]??(aAvoids?aProfile.conflictEffect:undefined)??(bAvoids?bProfile.conflictEffect:undefined)??'agitation';
}
export function conflictLinks(cabin:Array<Rider|null>):ConflictLink[]{
 return ADJACENT.flatMap(([first,second])=>{
  const a=cabin[first],b=cabin[second];
  if(!a||!b)return [];
  const effect=conflictEffectBetween(a,b,cabin,first,second);
  return effect?[{first,second,effect}]:[];
 });
}
export const conflictEffectText=(effect:ConflictEffect)=>({
 agitation:'🔥 每层 +1 躁动',energy:'⚡ 每层额外耗 1 电',coins:'🪙 每层损失 2 金币',
 overload:'⚡ 两人耗电 ×2',gamble:'⚡ 两人耗电 ×2；🪙 双方到站：基价额外 +100%',
}[effect]);
export function riderConflictRules(rider:Rider,cabin:Array<Rider|null>=[]){
 const profile=riderProfile(rider,cabin);
 // The engine creates a red link if EITHER rider avoids the other. Static
 // incoming conflicts must be readable on both cards before placement too.
 // Do not invent randomized Mystery/Shifter preferences from their defaults.
 const incoming=PASSENGER_ORDER.filter(target=>!['mystery','shifter'].includes(target)&&BONDS[target].avoids.includes(rider.kind));
 const targets=[...new Set([...profile.bond.avoids,...incoming])];
 return targets.map(target=>{
  const effect=CONFLICT_EFFECTS[pairKey(rider.kind,target)]??profile.conflictEffect??'agitation';
  return {target,effect,text:conflictEffectText(effect)};
 });
}
export const profileWeight=(cabin:Array<Rider|null>)=>cabin.reduce((sum,r,i)=>sum+(r?riderProfile(r,cabin,i).weight:0),0);
export function bondSummary(rider:Rider,cabin:Array<Rider|null>=[],bonus=3){
 const {bond}=riderProfile(rider,cabin);
 const names=(kinds:PassengerKind[])=>kinds.map(k=>PASSENGERS[k].name).join(' / ');
 return {
  partners:names(bond.likes),opponents:names(riderConflictRules(rider,cabin).map(rule=>rule.target)),bonus,
  benefit:`每条协作连接：本人到站额外 +${bonus} 金币`,
  condition:'到站时每位仍相邻的协作对象各算一条',
  conflict:'红线效果每层生效；多条逐条相加，倍率按基础值线性叠加',
 };
}
export function bondLines(rider:Rider,cabin:Array<Rider|null>=[],bonus=3){
 const {copies}=riderProfile(rider,cabin);
 const summary=bondSummary(rider,cabin,bonus);
 const conflicts=riderConflictRules(rider,cabin).map(rule=>`${PASSENGERS[rule.target].name}：${rule.text}`).join('；');
 return [
  `协作：${summary.partners}。本人到站时，每位仍相邻的协作对象 → 额外 +${bonus} 金币。`,
  '只有列出的默契对象给到站奖励；人物能力产生的绿线另算。',
  `冲突：${conflicts}。红线每层生效；多条逐条相加。`,
  ...copies.map(c=>'复制 '+PASSENGERS[c.sourceKind].name+' 的'+COPY_LABELS[c.field]+'。'),
 ];
}
