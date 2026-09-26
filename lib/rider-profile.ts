import { GHOST_RIDE, MYSTERY_RULES } from './dark-rules';
import { ADJACENT, PASSENGERS, type PassengerKind } from './game-data';
import { SYMBOLS, SYMBOL_KEYS, pairLink, symbolEdges, symbolTitle, symbolsOf, type SymbolKey } from './symbols';
import type { Rider } from './game-engine';

export type Bond = { likes: PassengerKind[]; avoids: PassengerKind[] };
// weight is a retired compatibility field for archived simulations, not a rule.
export type ConflictEffect = 'agitation' | 'energy' | 'coins' | 'overload' | 'gamble';
export type ConflictLink = { first: number; second: number; effect: ConflictEffect };
export type VariableTraits = { weight: number; energy?: number; agitation?: number; fare: number; bond: Bond; conflictEffect?: ConflictEffect; revision: number; symbols?: SymbolKey[] };
export type CopyField = 'energy' | 'fare' | 'agitation' | 'weight' | 'bond';
export type CopiedTrait = { sourceId: string; sourceKind: PassengerKind; field: CopyField };
export const COPY_LABELS: Record<CopyField,string> = {energy:'每站耗电',fare:'车费',agitation:'躁动与联动偏好',weight:'旧属性（已停用）',bond:'联动偏好'};
export const BONDS: Record<PassengerKind,Bond> = {
 commuter:{likes:['courier'],avoids:['drunk','celebrity']},
 tourist:{likes:['celebrity'],avoids:['drunk']},
 courier:{likes:['mechanic'],avoids:['ghost','drunk']},
 mechanic:{likes:['inspector'],avoids:['drunk','celebrity']},
 lover:{likes:['lover'],avoids:['ghost']},
 musician:{likes:['tourist'],avoids:['bomb']},
 thief:{likes:['cop'],avoids:['ghost']},
 cop:{likes:['thief','bomb'],avoids:['drunk','celebrity']},
 lawyer:{likes:['thief'],avoids:['ghost','cop']},
 drunk:{likes:['nurse'],avoids:['inspector']},
 nurse:{likes:['child','drunk'],avoids:['ghost']},
 child:{likes:['lover','nurse'],avoids:['bomb','drunk']},
 ghost:{likes:['exorcist'],avoids:['inspector','mimic']},
 exorcist:{likes:['ghost'],avoids:['drunk','mystery']},
 coach:{likes:['commuter','courier'],avoids:['celebrity','musician']},
 celebrity:{likes:['tourist'],avoids:['inspector']},
 inspector:{likes:['mechanic'],avoids:['drunk']},
 bomb:{likes:['cop'],avoids:['child','mechanic']},
 mystery:{likes:['coach'],avoids:['inspector']},
 shifter:{likes:['nurse'],avoids:['cop']},
 mimic:{likes:['mimic'],avoids:['ghost','bomb']},
 // v9.19 dark versions: new friends and enemies (many invert the original's).
 overtimer:{likes:[],avoids:['noisemaker']}, voyeur:{likes:['scandal'],avoids:['crookedcop']}, smuggler:{likes:['grafter'],avoids:[]},
 scrapper:{likes:['grafter'],avoids:[]}, exlover:{likes:[],avoids:['exlover','lover']}, noisemaker:{likes:['brawler'],avoids:['nurse']},
 robber:{likes:['shyster'],avoids:[]}, crookedcop:{likes:['robber','thief'],avoids:['voyeur','shyster']}, shyster:{likes:['robber'],avoids:['crookedcop']},
 brawler:{likes:['noisemaker'],avoids:[]}, pusher:{likes:['brawler'],avoids:[]}, creepychild:{likes:[],avoids:[]},
 wraith:{likes:['exorcist','summoner'],avoids:[]}, summoner:{likes:['ghost','wraith'],avoids:[]}, taskmaster:{likes:[],avoids:[]},
 scandal:{likes:['voyeur'],avoids:[]}, grafter:{likes:['smuggler','scrapper'],avoids:[]}, madbomber:{likes:['crookedcop'],avoids:[]},
 parcel:{likes:[],avoids:[]}, operator:{likes:[],avoids:[]}, matchmaker:{likes:[],avoids:[]}, don:{likes:[],avoids:[]}, matron:{likes:[],avoids:[]},
 nightingale:{likes:[],avoids:[]}, medium:{likes:[],avoids:[]}, tycoon:{likes:[],avoids:[]}, stranger:{likes:[],avoids:[]},
 nightoperator:{likes:[],avoids:[]}, severer:{likes:[],avoids:[]}, kingpin:{likes:[],avoids:[]}, coldmatron:{likes:[],avoids:[]}, banshee:{likes:[],avoids:[]}, necromancer:{likes:[],avoids:[]}, highroller:{likes:[],avoids:[]}, otherthirteen:{likes:[],avoids:[]},
};
const pairKey=(a:PassengerKind,b:PassengerKind)=>[a,b].sort().join(':');
const effectPairs=(effect:ConflictEffect,pairs:Array<[PassengerKind,PassengerKind]>)=>pairs.map(([a,b])=>[pairKey(a,b),effect] as const);
export const CONFLICT_EFFECTS:Record<string,ConflictEffect>=Object.fromEntries([
 ...effectPairs('agitation',[
  ['commuter','drunk'],['lover','ghost'],['cop','drunk'],['nurse','ghost'],['child','bomb'],['exorcist','drunk'],
  ['shifter','cop'],['musician','bomb'],['cop','celebrity'],['child','drunk'],['tourist','drunk'],
 ]),
 ...effectPairs('agitation',[['exlover','exlover'],['exlover','lover'],['noisemaker','nurse'],['overtimer','noisemaker']]),
 ...effectPairs('coins',[['voyeur','crookedcop'],['crookedcop','shyster']]),
 ...effectPairs('coins',[
  // v9.18.3: a Thief's neighbours are handled by pickpocketing alone (no −2 red link on top of the steal).
  ['drunk','inspector'],['celebrity','inspector'],
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
const randomInt=(min:number,max:number,rng:()=>number)=>min+Math.floor(rng()*(max-min+1));
export function randomTraits(kind:'mystery'|'shifter', available:PassengerKind[], rng:()=>number, revision=0):VariableTraits {
 const pool=available.filter(k=>!['mystery','shifter','mimic',kind].includes(k));
 const liked=pool[randomInt(0,pool.length-1,rng)]??'commuter';
 const rest=pool.filter(k=>k!==liked);
 const avoided=rest[randomInt(0,rest.length-1,rng)]??'drunk';
 const conflictEffect=(['agitation','energy','coins'] as ConflictEffect[])[randomInt(0,2,rng)];
 // v10: two random non-opposite symbols.
 const first=SYMBOL_KEYS[randomInt(0,5,rng)],others=SYMBOL_KEYS.filter(k=>k!==first&&SYMBOLS[first].opposite!==k),symbols:SymbolKey[]=[first,others[randomInt(0,others.length-1,rng)]];
 return {weight:0,energy:kind==='shifter'?1:randomInt(1,2,rng),agitation:randomInt(0,1,rng),fare:randomInt(kind==='shifter'?10:5,kind==='shifter'?17:14,rng),bond:{likes:[liked],avoids:[avoided]},conflictEffect,revision,symbols};
}
function ownProfile(rider:Rider){
 const spec=PASSENGERS[rider.kind];
 // v9.19: a Mystery's fare follows his identity and stays sealed until he is revealed (one floor after boarding).
 const identityFare=rider.kind==='mystery'&&rider.identity?MYSTERY_RULES[rider.identity].fare:undefined;
 // v10.1.2: a Ghost's fare is his ride length times GHOST_RIDE.perFloor.
 const masterFare=rider.kind==='musician'&&rider.master?PASSENGERS.musician.fare*2:undefined;
 const ghostFare=rider.kind==='ghost'?Math.max(1,Math.round((rider.destination-rider.boardedAt)*GHOST_RIDE.perFloor)):undefined;
 return {weight:0,energy:rider.traits?.energy??spec.energy,agitation:rider.traits?.agitation??0,fare:rider.traits?.fare??identityFare??ghostFare??masterFare??(rider.disguised?PASSENGERS.bomb.fare:spec.fare),bond:rider.traits?.bond??BONDS[rider.kind],conflictEffect:rider.traits?.conflictEffect,hidden:rider.kind==='mystery'&&!rider.revealed};
}
// A ticket adjustment applies only to the base fare, never to earned stashes,
// tips or adjacency payouts. Express retains its full purchased benefit.
/** v10.2.5: riders who board from 31F on pay 75% of their base fare (rounded up; tips, link coins and stashes are not scaled).
 * A 1,120-run study cut mid-to-late surplus by about 15% (with LATE_CHARGE) while the novice bot stayed at 60F. */
export const LATE_FARE = { from: 31, factor: 0.75 };
// The Ghost's card promises 1 coin a floor ridden, so his distance fare is never scaled.
// v10.2.7 (human playtest, 65F: a short-trip Lover paid 1 coin after both discounts): a fare of 2 or more never drops below 2.
const ticketFare=(rider:Rider,fare:number)=>{const scaled=Math.ceil(fare*(rider.localFareRatio??1)*(rider.boardedAt>=LATE_FARE.from&&rider.kind!=='ghost'?LATE_FARE.factor:1));return fare>=2?Math.max(2,scaled):scaled;};
export function riderProfile(rider:Rider,cabin:Array<Rider|null>=[],slot=cabin.findIndex(r=>r?.id===rider.id)) {
 const result={...ownProfile(rider),copies:[] as CopiedTrait[]};
 if(rider.kind!=='mimic'||slot<0){result.fare=ticketFare(rider,result.fare);return result;}
 // Only the immediately-above position. The pair key deliberately excludes
 // floor, column, and all other neighbors. Preview/reseat never consumes RNG.
 const above = slot >= 3 ? cabin[slot-3] : null;
 const source = above?.kind === 'parcel' ? null : above; // a parcel has no fare to copy
 if(source){
   // v9: deterministic — the Mimic always copies the base fare of the rider above.
   const field=('fare' as CopyField);
   const profile=ownProfile(source);
   if(field==='energy')result.energy=profile.energy;
   if(field==='fare'){result.fare=ticketFare(source,profile.fare);result.hidden=profile.hidden;}
   result.copies.push({sourceId:source.id,sourceKind:source.kind,field});
   // v9.18.3: the copy is the fare above exactly as that rider would be paid; the Mimic's own short-trip
   // discount is not applied a second time (a Mimic under a 30-coin Bomber is paid 30, not 24).
   return result;
 }
 result.fare=ticketFare(rider,result.fare);
 return result;
}
export function bondStatus(rider:Rider,cabin:Array<Rider|null>,slot=cabin.findIndex(r=>r?.id===rider.id)){
 const profile=riderProfile(rider,cabin,slot);
 // v10: support and conflict count shared and opposite symbols with the neighbours (lib/symbols.ts).
 const own=symbolsOf(rider,cabin,slot);
 const links=slot<0?[]:nearby(slot).map(i=>pairLink(own,symbolsOf(cabin[i],cabin,i)));
 const supportCount=links.reduce((n,l)=>n+l.shared.length,0);
 const conflictCount=links.reduce((n,l)=>n+l.clashes.length,0);
 return {supported:supportCount>0,conflict:conflictCount>0,supportCount,conflictCount,...profile};
}
export function conflictEffectBetween(a:Rider,b:Rider,cabin:Array<Rider|null>=[],aSlot=cabin.findIndex(r=>r?.id===a.id),bSlot=cabin.findIndex(r=>r?.id===b.id)):ConflictEffect|null{
 return pairLink(symbolsOf(a,cabin,aSlot),symbolsOf(b,cabin,bSlot)).clashes.length?'agitation':null;
}
/** v10: one red link per pair of opposite symbols between neighbours; every red link adds agitation. */
export function conflictLinks(cabin:Array<Rider|null>):ConflictLink[]{
 return symbolEdges(cabin).flatMap(e=>e.clashes.map(()=>({first:e.first,second:e.second,effect:'agitation' as ConflictEffect})));
}
export const conflictEffectText=(effect:ConflictEffect)=>({
 agitation:'每层 +1 躁动',energy:'每层额外耗 1 电',coins:'每层损失 2 金币',
 overload:'两人耗电 ×2',gamble:'两人耗电 ×2；双方到站：基价额外 +100%',
}[effect]);
/** v10: red links come from opposite symbols (shown on the card), so there are no named opponents any more. */
export function riderConflictRules(_rider:Rider,_cabin:Array<Rider|null>=[]):Array<{target:PassengerKind;effect:ConflictEffect;text:string}>{
 return [];
}
export const profileWeight=(cabin:Array<Rider|null>)=>cabin.reduce((sum,r,i)=>sum+(r?riderProfile(r,cabin,i).weight:0),0);
/** v10: relations come from symbols, so there are no named partners or opponents; the sheet explains the symbols. */
export function bondSummary(rider:Rider,cabin:Array<Rider|null>=[],bonus=3){
 void rider;void cabin;
 return {partners:'',opponents:'',bonus,benefit:'',condition:'',conflict:''};
}
export const SYMBOL_SHAPE_RULE='相同和相反的符号一对一抵消。同一符号连成一排（+1级）、四人方块（+2级）或满车（+4级），效果更强。';
export function bondLines(rider:Rider,cabin:Array<Rider|null>=[],_bonus=3){
 const syms=symbolsOf(rider,cabin,cabin.findIndex(r=>r?.id===rider.id));
 const {copies}=riderProfile(rider,cabin);
 return [
  ...syms.map(sy=>symbolTitle(sy,true)),
  ...(syms.length?[SYMBOL_SHAPE_RULE]:[]),
  ...copies.map(c=>'复制 '+PASSENGERS[c.sourceKind].name+' 的'+COPY_LABELS[c.field]+'。'),
 ];
}
