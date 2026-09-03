import { bondStatus } from './rider-profile';
import { energySavings, crowdAgitation, hasNeighbour, neighbourCount, neighbours, patienceCost, shiftAgitation, totalWeight, travelEnergyCost, type RunState } from './game-engine';

export type StressForecast = {
  range: string;
  details: string;
  summary: string;
  tone: 'safe' | 'caution' | 'danger';
  lowDelta: number;
  highDelta: number;
};

export type EnergyForecast = {
  range: string;
  summary: string;
  danger: boolean;
  lowDelta: number;
  highDelta: number;
};

const signedDelta = (value: number) => value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '不变';

function projectedDestinationVariants(state: RunState): Array<Array<number | null>> {
  const nextFloor = state.floor + 1;
  let variants: Array<Array<number | null>> = [state.cabin.map((rider) => rider?.destination ?? null)];
  if (nextFloor % 3 !== 0) return variants;
  state.cabin.forEach((rider, slot) => {
    if (rider?.kind !== 'ghost' || hasNeighbour(state.cabin, slot, ['exorcist'])) return;
    const targets = neighbours(slot).filter((index) => state.cabin[index]);
    if (targets.length) variants = variants.flatMap((variant) => targets.map((target) => variant.map((destination, index) => index === target && destination !== null ? destination + 1 : destination)));
  });
  return variants;
}

export function stressForecast(state: RunState, weight = totalWeight(state.cabin)): StressForecast {
  const nextFloor = state.floor + 1;
  const occupied = state.cabin.filter(Boolean).length;
  let thieves = 0; let drunks = 0; let celebrities = 0; let inspectors = 0; let relief = 0;
  const patience = state.cabin.map((rider, slot) => {
    if (!rider) return null;
    const unattendedChild = rider.kind === 'child' && !hasNeighbour(state.cabin, slot, ['lover', 'musician', 'nurse']);
    return rider.patience - patienceCost(state) - (nextFloor % 2 === 0 && unattendedChild ? 1 : 0);
  });
  state.cabin.forEach((rider, slot) => {
    if (!rider) return;
    switch (rider.kind) {
      case 'thief': if (!hasNeighbour(state.cabin, slot, ['cop', 'lawyer']) && nextFloor % 2 === 0) thieves += 1; break;
      case 'drunk': if (!hasNeighbour(state.cabin, slot, ['musician', 'nurse'])) drunks += 1; break;
      case 'musician': if (occupied >= 4) relief += 1; break;
      case 'nurse': if (nextFloor % 2 === 0) relief += 1; break;
      case 'celebrity': if (nextFloor % 2 === 0 && neighbourCount(state.cabin, slot) > 1) celebrities += 1; break;
      case 'inspector': if (nextFloor % 2 === 0 && weight > 8) inspectors += 1; break;
    }
  });
  const variants = projectedDestinationVariants(state).map((destinations) => ({
    impatient: state.cabin.reduce((count, rider, index) => count + (rider && destinations[index] !== null && nextFloor < destinations[index]! && patience[index] !== null && patience[index]! <= 0 ? 1 : 0), 0),
    arrivals: state.cabin.reduce((count, rider, index) => count + (rider && destinations[index] !== null && nextFloor >= destinations[index]! ? 1 : 0), 0),
  }));
  const minImpatient = Math.min(...variants.map((variant) => variant.impatient)); const maxImpatient = Math.max(...variants.map((variant) => variant.impatient));
  const minArrivals = Math.min(...variants.map((variant) => variant.arrivals)); const maxArrivals = Math.max(...variants.map((variant) => variant.arrivals));
  const arrivalReason = !maxArrivals ? '' : minArrivals === maxArrivals ? `到站舒缓 −${maxArrivals}` : minArrivals === 0 ? `到站舒缓最多 −${maxArrivals}` : `到站舒缓 −${minArrivals}～−${maxArrivals}`;
  const crowd = crowdAgitation(occupied); const fatigue = shiftAgitation(nextFloor, occupied);
  const conflicts = nextFloor % 2 === 0 ? state.cabin.reduce((sum,rider,slot)=>sum+(rider && bondStatus(rider,state.cabin,slot).conflict ? 1 : 0),0) : 0;
  const overload = weight > state.weightCap ? 2 : 0;
  const fixedRise = thieves + celebrities + inspectors + crowd + fatigue + conflicts + overload;
  const lows = variants.map((variant) => Math.max(0, state.stress + fixedRise + variant.impatient * 2 - relief - variant.arrivals));
  const highs = variants.map((variant) => Math.max(0, state.stress + fixedRise + variant.impatient * 2 + drunks * 2 - relief - variant.arrivals));
  const low = Math.min(...lows); const high = Math.max(...highs);
  const lowDelta = low - state.stress; const highDelta = high - state.stress;
  const range = lowDelta === highDelta ? signedDelta(lowDelta) : `${signedDelta(lowDelta)}～${signedDelta(highDelta)}`;
  const impatienceReason = !maxImpatient ? '' : minImpatient === maxImpatient
    ? `${maxImpatient} 人耐心归零 +${maxImpatient * 2}`
    : minImpatient === 0 ? `最多 ${maxImpatient} 人可能耐心归零 +${maxImpatient * 2}` : `${minImpatient}～${maxImpatient} 人可能耐心归零 +${minImpatient * 2}～${maxImpatient * 2}`;
  const reasons = [
    conflicts ? `邻座冲突 +${conflicts}` : '',
    overload ? '载重超限 +2' : '',
    crowd ? crowd > 0 ? `拥挤 +${crowd}` : '宽松 −1' : '',
    fatigue ? `长班疲劳 +${fatigue}` : '',
    arrivalReason,
    patienceCost(state) > 1 ? '高躁动：耐心每站 −2' : '',
    impatienceReason,
    thieves ? `小偷 +${thieves}` : '',
    celebrities ? `名人 +${celebrities}` : '',
    inspectors ? `超载检查 +${inspectors}` : '',
    drunks ? `醉汉 ${Math.round((1 - .75 ** drunks) * 100)}% 概率闹事` : '',
    relief ? `安抚 −${relief}` : '',
  ].filter(Boolean);
  const details = reasons.join(' · ');
  const summary = details ? `下一层 ${range} · ${details}` : '下一层躁动不变 · 没有已知来源';
  const tone = state.stress + highDelta >= state.stressCap || lowDelta >= 2 ? 'danger' : highDelta > 0 ? 'caution' : 'safe';
  return { range, details, summary, tone, lowDelta, highDelta };
}

export function energyForecast(state: RunState, _weight = totalWeight(state.cabin)): EnergyForecast {
 const drain=travelEnergyCost(state.floor+1), saved=energySavings(state), delta=-drain+saved;
 return {range:signedDelta(delta),summary:`下一层电量 ${signedDelta(delta)} · 行驶 −${drain}${saved ? ' · 节能少耗1' : ''}；乘客不赠电`,danger:state.energy+delta<=0,lowDelta:delta,highDelta:delta};
}
