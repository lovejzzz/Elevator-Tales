import { riskPartnerships } from './shift-rules';
import { bondStatus, conflictLinks, riderProfile, type ConflictEffect } from './rider-profile';
import { ADJACENT, PASSENGERS, type PassengerKind } from './game-data';
import { hasNeighbour, isBigParcel, seatRider, parcelLayoutOk, parcelLinks, isFreeReseat, neighbourCount, oldMovesRemaining, riderAgitation, type Rider, type RunState } from './game-engine';
import { agitationBand } from './balance-v832';

const RED_SHORT: Record<ConflictEffect,string> = { agitation:'+1躁动/层', energy:'+1耗电/层', coins:'−2金币/层', overload:'两人耗电×2', gamble:'两人耗电×2' };

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
  // v9.18.2: a box is nobody's partner (the Tourist's companions and every bond skip it), so it never draws a link.
  if (a.kind === 'parcel' || b.kind === 'parcel') return false;
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

/** v9.18.4: a box that has just come into an unguarded Thief's reach (he takes it when he leaves). */
function newlyEyedMessage(before: Array<Rider | null>, after: Array<Rider | null>, floor: number): string | null {
  const eyedBefore = parcelLinks(before).eyed;
  const hit = [...parcelLinks(after).eyed].find(([p, t]) => eyedBefore.get(p) !== t);
  if (!hit) return null;
  const stops = Math.max(1, after[hit[1]]!.destination - floor);
  return `小偷盯上了这个纸箱：他${stops === 1 ? '下一层' : `${stops} 层后`}下车时会带走它，给一半金币作小费；它的快递员就拿不到了。`;
}
/** Situational agitation (not a rider's own or impatience), keyed per rider so a placement can report only what it newly caused. */
function situationalAgitation(state: RunState, cabin: Array<Rider | null>) {
  const next = { ...state, cabin };
  return cabin.flatMap((r, i) => r ? riderAgitation(next, i).fixed.filter(line => !/自身躁动$|急躁$/.test(line.label))
    // A Courier whose box is still waiting in the queue is announced by the departure alert instead.
    .filter(line => !(line.label === '快递员在找纸箱' && !cabin.some(p => p?.ownerId === r.id)))
    .map(line => ({ key: `${r.id}|${line.label}`, text: `${line.label} +${line.amount}躁动/层` })) : []);
}

/** One rule path for drag, tap and destination previews; previewing never mutates a run. */
export function planPlacement(state: RunState, candidate: Rider, target: number): PlacementResult {
  const reject = (label: string): PlacementResult => ({ ok: false, changed: false, next: { ...state, message: label }, tone: 'error', label, slots: [target] });
  if (state.status !== 'playing') return reject('当前不能调整站位');
  if(state.reservedRider?.id===candidate.id)return reject('已留座，下一批再上车');
  if (!Number.isInteger(target) || target < 0 || target >= state.cabin.length) return reject('请选择电梯里的站位');
  const cabin = [...state.cabin]; const source = cabin.findIndex((rider) => rider?.id === candidate.id);
  if (source === target) return { ok: true, changed: false, next: state, tone: 'place', label: '已在此处', slots: [] };
  const rider = source >= 0 ? cabin[source]! : state.rebooked?.[candidate.id]!==undefined?{...candidate,destination:state.rebooked[candidate.id]}:candidate;
  let swapped = state.swapped;
  let oldMovesUsed=state.oldMovesUsed??Number(state.swapped);
  // v9.17 two-part box: fills the upper and lower seat of a column; it cannot be moved once seated (withdraw it instead).
  if (isBigParcel(rider) || (source >= 0 && isBigParcel(cabin[target]))) {
    if (source >= 0) return reject('大纸箱放好后不能挪动 · 可以撤回重放');
    const seated = seatRider(cabin, rider, target);
    if (!seated) return reject('大纸箱需要同一列上下两个空位');
    if (!parcelLayoutOk(seated)) return reject('纸箱必须挨着快递员（上下左右）');
    const eyed = newlyEyedMessage(state.cabin, seated, state.floor);
    return { ok: true, changed: true, next: { ...state, cabin: seated, message: eyed ?? '大纸箱已放好：占上下两格。' }, tone: 'place', label: eyed ? '小偷盯上纸箱' : '大纸箱已就位', slots: [target % 3, target % 3 + 3] };
  }
  if (source >= 0) {
    const free = isFreeReseat(cabin, source, target, state.floor);
    if (!oldMovesRemaining(state) && !free) return reject('本层旧乘客换位已用');
    [cabin[source], cabin[target]] = [cabin[target], cabin[source]];
    if(!free)oldMovesUsed++;
    swapped=oldMovesUsed>=1+Number(Boolean(state.upgrades.rails));
  } else {
    if (cabin[target]) return reject('这里已经有人 · 请选空位');
    cabin[target] = rider;
  }
  if (!parcelLayoutOk(cabin)) return reject('纸箱必须挨着快递员（上下左右）');
  const linkIds = (seats: Array<Rider | null>) => new Set(ADJACENT.filter(([a, b]) => activeConnection(seats, a, b)).map(([a, b]) => [seats[a]!.id, seats[b]!.id].sort().join(':')));
  const before = linkIds(state.cabin); const after = linkIds(cabin);
  const combo = [...after].some((id) => !before.has(id));
  const loverPair = rider.kind === 'lover' && hasNeighbour(cabin, target, ['lover']);
  let label = combo ? loverPair ? '恋人配对' : '联动成立' : source >= 0 ? '站位已调整' : '乘客已就位';
  let message = combo && loverPair ? '恋人已配对：每位恋人邻座让本人到站基价 +100%；途中不产币。' : combo ? `${PASSENGERS[rider.kind].name}与邻座联动已生效。` : source >= 0 ? oldMovesUsed > (state.oldMovesUsed??Number(state.swapped)) ? '站位已调整。' : '站位已调整 · 不消耗旧乘客换位。' : `${PASSENGERS[rider.kind].name}已站到 ${target + 1} 号位。`;
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
    message=trait?`复制人 ↑ ${PASSENGERS[trait.sourceKind].name}：${trait.field==='energy'?`耗电 ${profile.energy}`:`基础车费 ${profile.hidden?'封存':profile.fare}`}。`:'当前位置没有正上方来源，恢复复制人本体数值。';
    celebrate=false;
  }
  // v9.18.4: a box that has just come into an unguarded Thief's reach is announced at once (he takes it when he leaves).
  const newlyEyed=newlyEyedMessage(state.cabin,cabin,state.floor);
  if(newlyEyed){ label='小偷盯上纸箱'; message=newlyEyed; celebrate=false; }
  // v9.18.4: the same placement can also draw a red link or leave the rider unattended; say so next to the good news.
  const seatOf=cabin.findIndex(r=>r?.id===rider.id);
  const redBefore=new Set(conflictLinks(state.cabin).map(l=>[state.cabin[l.first]!.id,state.cabin[l.second]!.id].sort().join(':')));
  const newRed=conflictLinks(cabin).filter(l=>(l.first===seatOf||l.second===seatOf)&&!redBefore.has([cabin[l.first]!.id,cabin[l.second]!.id].sort().join(':')));
  const warnings=newRed.map(l=>`与${PASSENGERS[cabin[l.first===seatOf?l.second:l.first]!.kind].name}红线 ${RED_SHORT[l.effect]}`);
  // Includes neighbours this placement newly upsets (e.g. a Celebrity now crowded).
  const sitBefore=new Set(situationalAgitation(state,state.cabin).map(x=>x.key));
  situationalAgitation(state,cabin).filter(x=>!sitBefore.has(x.key)).forEach(x=>warnings.push(x.text));
  if(warnings.length&&!newlyEyed){message+=` 注意：${warnings.join('；')}。`;celebrate=false;}
  const slots = new Set(source >= 0 ? [source, target] : [target]);
  // Only the moved rider reacts; a new link announces itself by drawing in, so seated partners do not flash.
  if(source>=0&&oldMovesUsed>(state.oldMovesUsed??Number(state.swapped)))message+=` 旧乘客换位剩余${Math.max(0,1+Number(Boolean(state.upgrades.rails))-oldMovesUsed)}次。`;
  return { ok: true, changed: true, next: { ...state, cabin, swapped, oldMovesUsed, message }, tone: celebrate ? 'combo' : 'place', label, slots: [...slots] };
}

export function conflictingConnection(cabin: Array<Rider|null>,first:number,second:number) {
 const a=cabin[first],b=cabin[second];
 if(!a||!b)return false;
 const left=bondStatus(a,cabin,first),right=bondStatus(b,cabin,second);
 return (left.conflict&&left.bond.avoids.includes(b.kind))||(right.conflict&&right.bond.avoids.includes(a.kind));
}
