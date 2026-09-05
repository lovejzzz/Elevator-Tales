import { riskPartnerships } from './shift-rules';
import { bondStatus, riderProfile } from './rider-profile';
import { ADJACENT, PASSENGERS, type PassengerKind } from './game-data';
import { hasNeighbour, isFreeReseat, neighbourCount, type Rider, type RunState } from './game-engine';
import { agitationBand } from './balance-v832';

export function copyConnection(cabin: Array<Rider | null>, first: number, second: number) {
  for (const [copySlot,sourceSlot] of [[first,second],[second,first]]) {
    const copy=cabin[copySlot],source=cabin[sourceSlot];
    if(!copy||!source||copy.kind!=='mimic')continue;
    const trait=riderProfile(copy,cabin,copySlot).copies.find(item=>item.sourceId===source.id);
    if(trait)return {copySlot,sourceSlot,field:trait.field};
  }
  return null;
}

export function activeConnection(cabin: Array<Rider | null>, first: number, second: number): boolean {
  const a = cabin[first]; const b = cabin[second];
  if (!a || !b || !ADJACENT.some(([x,y])=>(x===first&&y===second)||(y===first&&x===second))) return false;
  if(riskPartnerships(cabin).edges.some(([x,y])=>x===first&&y===second))return true;
  if(copyConnection(cabin,first,second))return true;
  // A Tourist earns companion income from every occupied neighboring position.
  // This is a visible positive link, but the separate bond system remains the
  // sole source of generic cooperation arrival rewards.
  if(a.kind==='tourist'||b.kind==='tourist')return true;
  if (a.kind === 'nurse' || b.kind === 'nurse') return true;
  if(riderProfile(a,cabin,first).bond.likes.includes(b.kind)||riderProfile(b,cabin,second).bond.likes.includes(a.kind))return true;
  const supports = (source: PassengerKind, target: PassengerKind, slot: number) => {
    if (source === 'lover') return target === 'lover';
    if (source === 'thief') return target === 'cop' || target === 'lawyer';
    if (source === 'cop') return target === 'thief' || target === 'bomb';
    if (source === 'lawyer') return target === 'thief';
    if (source === 'drunk') return target === 'nurse';
    if (source === 'child') return ['lover', 'nurse'].includes(target);
    if (source === 'ghost') return target === 'exorcist';
    if (source === 'exorcist') return target === 'ghost';
    if (source === 'bomb') return target === 'cop';
    if (source === 'coach') return true;
    return source === 'celebrity' && neighbourCount(cabin, slot) === 1;
  };
  return supports(a.kind, b.kind, first) || supports(b.kind, a.kind, second);
}

export type PlacementResult = { ok: boolean; changed: boolean; next: RunState; tone: 'place' | 'combo' | 'error'; label: string; slots: number[] };

/** One rule path for drag, tap and destination previews; previewing never mutates a run. */
export function planPlacement(state: RunState, candidate: Rider, target: number): PlacementResult {
  const reject = (label: string): PlacementResult => ({ ok: false, changed: false, next: { ...state, message: label }, tone: 'error', label, slots: [target] });
  if (state.status !== 'playing') return reject('当前不能调整站位');
  if (!Number.isInteger(target) || target < 0 || target >= state.cabin.length) return reject('请选择电梯里的站位');
  const cabin = [...state.cabin]; const source = cabin.findIndex((rider) => rider?.id === candidate.id);
  if (source === target) return { ok: true, changed: false, next: state, tone: 'place', label: '已在此处', slots: [] };
  const rider = source >= 0 ? cabin[source]! : candidate;
  let swapped = state.swapped;
  if (source >= 0) {
    const free = isFreeReseat(cabin, source, target, state.floor);
    if (swapped && !free) return reject('本层旧乘客换位已用');
    [cabin[source], cabin[target]] = [cabin[target], cabin[source]];
    swapped ||= !free;
  } else {
    if (cabin[target]) return reject('这里已经有人 · 请选空位');
    cabin[target] = rider;
  }
  const linkIds = (seats: Array<Rider | null>) => new Set(ADJACENT.filter(([a, b]) => activeConnection(seats, a, b)).map(([a, b]) => [seats[a]!.id, seats[b]!.id].sort().join(':')));
  const before = linkIds(state.cabin); const after = linkIds(cabin);
  const combo = [...after].some((id) => !before.has(id));
  const loverPair = rider.kind === 'lover' && hasNeighbour(cabin, target, ['lover']);
  let label = combo ? loverPair ? '恋人配对' : '联动成立' : source >= 0 ? '站位已调整' : '乘客已就位';
  let message = combo && loverPair ? '恋人已配对：每位恋人邻座让本人到站基价 +100%；途中不产币。' : combo ? `${PASSENGERS[rider.kind].name}与邻座联动已生效。` : source >= 0 ? swapped !== state.swapped ? '站位已调整 · 本层旧乘客换位已用。' : '站位已调整 · 不消耗旧乘客换位。' : `${PASSENGERS[rider.kind].name}已站到 ${target + 1} 号位。`;
  let celebrate=combo;
  const riskIds=(seats:Array<Rider|null>)=>riskPartnerships(seats).edges.map(([a,b])=>[seats[a]!.id,seats[b]!.id].sort().join(':'));
  const previousRisk=new Set(riskIds(state.cabin));
  if(riskIds(cabin).some(id=>!previousRisk.has(id))){
    label='危险协作已连接';
    message=`成员每层暂存${agitationBand(state.stress)==='high'?3:2}金币，每条链接+1躁动；送达兑现，请离放弃。`;
    celebrate=false;
  }
  const changedCopy=cabin.flatMap((copy,slot)=>{
    if(copy?.kind!=='mimic')return [];
    const profile=riderProfile(copy,cabin,slot),prior=state.cabin.find(r=>r?.id===copy.id);
    const old=prior?riderProfile(prior,state.cabin).copies:[];
    return JSON.stringify(profile.copies)!==JSON.stringify(old)?[{copy,profile}]:[];
  })[0];
  if(changedCopy){
    const {profile}=changedCopy,trait=profile.copies[0];
    label=trait?'复制已生效':'复制已中断';
    message=trait?`复制人 ↑ ${PASSENGERS[trait.sourceKind].name}：${trait.field==='energy'?`耗电 ${profile.energy}`:`基础车费 ${profile.hidden?'封存':profile.fare}`}。同一人物对固定，移动不重抽。`:'当前位置没有正上方来源，恢复复制人本体数值。';
    celebrate=false;
  }
  const slots = new Set(source >= 0 ? [source, target] : [target]);
  if (combo) ADJACENT.forEach(([a, b]) => { if (activeConnection(cabin, a, b) && !before.has([cabin[a]!.id, cabin[b]!.id].sort().join(':'))) { slots.add(a); slots.add(b); } });
  return { ok: true, changed: true, next: { ...state, cabin, swapped, message }, tone: celebrate ? 'combo' : 'place', label, slots: [...slots] };
}

export function conflictingConnection(cabin: Array<Rider|null>,first:number,second:number) {
 const a=cabin[first],b=cabin[second];
 if(!a||!b)return false;
 const left=bondStatus(a,cabin,first),right=bondStatus(b,cabin,second);
 return (left.conflict&&left.bond.avoids.includes(b.kind))||(right.conflict&&right.bond.avoids.includes(a.kind));
}
