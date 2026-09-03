import { bondStatus } from './rider-profile';
import { cooperationRelief, energySavings, loadEnergyCost, efficientWeightLimit, riderAgitation, eventPressureMultiplier, crowdAgitation, hasNeighbour, neighbours, shiftAgitation, totalWeight, travelEnergyCost, type RunState } from './game-engine';

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
  const effects = state.cabin.map((_, slot) => riderAgitation(state, slot));
  const drunks = effects.filter(effect => effect.random > 0).length;
  const passengerFixed = effects.reduce((sum, effect) => sum + effect.low, 0);
  const passengerRandom = effects.reduce((sum, effect) => sum + effect.random, 0);
  const contract = cooperationRelief(state);
  const variants = projectedDestinationVariants(state).map((destinations) => {
    const arriving = state.cabin.flatMap((rider, slot) => rider && destinations[slot] !== null && nextFloor >= destinations[slot]! ? [slot] : []);
    const supported = arriving.some(slot => bondStatus(state.cabin[slot]!, state.cabin, slot).supported);
    // Drunks can change the arrival-time neighbor before settlement. Do not
    // promise a bonus using the departure layout; include either outcome.
    const contractLow = !drunks && supported ? contract : 0;
    const contractHigh = (drunks ? arriving.length > 0 : supported) ? contract : 0;
    return {
    contractLow, contractHigh,
    arrivals: state.cabin.reduce((count, rider, index) => count + (rider && destinations[index] !== null && nextFloor >= destinations[index]! ? 1 : 0), 0),
  }; });
  const minArrivals = Math.min(...variants.map((variant) => variant.arrivals)); const maxArrivals = Math.max(...variants.map((variant) => variant.arrivals));
  const arrivalReason = !maxArrivals ? '' : minArrivals === maxArrivals ? `到站舒缓 −${maxArrivals}` : minArrivals === 0 ? `到站舒缓最多 −${maxArrivals}` : `到站舒缓 −${minArrivals}～−${maxArrivals}`;
  const crowd = crowdAgitation(occupied); const fatigue = shiftAgitation(nextFloor, occupied, state.restStops);
  const overload = weight > state.weightCap ? 2 : 0;
  const fixedRise = passengerFixed + crowd + fatigue + overload;
  const lows = variants.map((variant) => Math.max(0, state.stress + fixedRise - variant.arrivals - variant.contractHigh));
  const highs = variants.map((variant) => Math.max(0, state.stress + fixedRise + passengerRandom - variant.arrivals - variant.contractLow));
  const minContract = Math.min(...variants.map(v => v.contractLow)), maxContract = Math.max(...variants.map(v => v.contractHigh));
  const contractReason = maxContract ? minContract === maxContract ? `契约舒缓 −${maxContract}（本层一次）` : `契约舒缓可能 −${maxContract}（本层一次）` : '';
  const low = Math.min(...lows); const high = Math.max(...highs);
  const lowDelta = low - state.stress; const highDelta = high - state.stress;
  const range = lowDelta === highDelta ? signedDelta(lowDelta) : `${signedDelta(lowDelta)}～${signedDelta(highDelta)}`;
  const reasons = [
    ...effects.flatMap(effect => effect.fixed.map(line => `${line.label} ${signedDelta(line.amount)}`)),
    overload ? '载重超限 +2' : '',
    crowd ? crowd > 0 ? `拥挤 +${crowd}` : '宽松 −1' : '',
    fatigue ? `班次压力 +${fatigue}` : '',
    occupied === 0 ? state.restStops > 0 ? `休整 ${state.restStops}→${state.restStops - 1}，免疲劳` : '休整用尽，空驶不免疲劳' : '',
    arrivalReason,
    contractReason,
    eventPressureMultiplier(state) > 1 ? '人物正向躁动已按 ×2 计算' : '',
    drunks ? `每位醉汉各25%概率躁动 +${2 * eventPressureMultiplier(state)}` : '',
  ].filter(Boolean);
  const details = reasons.join(' · ');
  const summary = details ? `下一层 ${range} · ${details}` : '下一层躁动不变 · 没有已知来源';
  const tone = state.stress + highDelta >= state.stressCap || lowDelta >= 2 ? 'danger' : highDelta > 0 ? 'caution' : 'safe';
  return { range, details, summary, tone, lowDelta, highDelta };
}

export function energyForecast(state: RunState, _weight = totalWeight(state.cabin)): EnergyForecast {
 const drain=travelEnergyCost(state.floor+1), heavy=loadEnergyCost(state), saved=energySavings(state), delta=-drain-heavy+saved;
 return {range:signedDelta(delta),summary:`下一层电量 ${signedDelta(delta)} · 行驶 −${drain}${heavy ? ` · 重载 −${heavy}（载重超过${efficientWeightLimit(state)}）` : ''}${saved ? ' · 节能少耗1' : ''}`,danger:state.energy+delta<=0,lowDelta:delta,highDelta:delta};
}
