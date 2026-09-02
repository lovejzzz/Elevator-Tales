import { PASSENGERS } from './game-data';
import { hasNeighbour, neighbourCount, neighbours, totalWeight, travelEnergyCost, type RunState } from './game-engine';

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
    return rider.patience - 1 - (nextFloor % 2 === 0 && unattendedChild ? 1 : 0);
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
  const impatientCounts = projectedDestinationVariants(state).map((destinations) => state.cabin.reduce((count, rider, index) => count + (rider && destinations[index] !== null && nextFloor < destinations[index]! && patience[index] !== null && patience[index]! <= 0 ? 1 : 0), 0));
  const minImpatient = Math.min(...impatientCounts); const maxImpatient = Math.max(...impatientCounts);
  const fixedRise = thieves + celebrities + inspectors;
  const low = Math.max(0, state.stress + fixedRise + minImpatient * 2 - relief);
  const high = Math.max(0, state.stress + fixedRise + maxImpatient * 2 + drunks * 2 - relief);
  const lowDelta = low - state.stress; const highDelta = high - state.stress;
  const range = lowDelta === highDelta ? signedDelta(lowDelta) : `${signedDelta(lowDelta)}～${signedDelta(highDelta)}`;
  const impatienceReason = !maxImpatient ? '' : minImpatient === maxImpatient
    ? `${maxImpatient} 人耐心归零 +${maxImpatient * 2}`
    : minImpatient === 0 ? `最多 ${maxImpatient} 人可能耐心归零 +${maxImpatient * 2}` : `${minImpatient}～${maxImpatient} 人可能耐心归零 +${minImpatient * 2}～${maxImpatient * 2}`;
  const reasons = [
    impatienceReason,
    thieves ? `小偷 +${thieves}` : '',
    celebrities ? `名人 +${celebrities}` : '',
    inspectors ? `超载检查 +${inspectors}` : '',
    drunks ? `醉汉 ${Math.round((1 - .75 ** drunks) * 100)}% 概率闹事` : '',
    relief ? `安抚 −${relief}` : '',
  ].filter(Boolean);
  const details = reasons.join(' · ');
  const summary = details ? `下一层 ${range} · ${details}` : '下一层压力不变 · 没有已知来源';
  const tone = state.stress + highDelta >= state.stressCap || lowDelta >= 2 ? 'danger' : highDelta > 0 ? 'caution' : 'safe';
  return { range, details, summary, tone, lowDelta, highDelta };
}

export function energyForecast(state: RunState, weight = totalWeight(state.cabin)): EnergyForecast {
  const nextFloor = state.floor + 1; const drain = travelEnergyCost(nextFloor);
  let fixedGain = 0; const reasons: string[] = [];
  state.cabin.forEach((rider, slot) => {
    if (!rider) return;
    if (rider.kind === 'mechanic' && nextFloor % 3 === 0) fixedGain += 1;
    if (rider.kind === 'ghost' && hasNeighbour(state.cabin, slot, ['exorcist'])) fixedGain += 1;
    if (rider.kind === 'inspector' && nextFloor % 2 === 0 && weight <= 8) fixedGain += 1;
  });
  if (state.upgrades.solar && nextFloor % 4 === 0) fixedGain += state.upgrades.solar;
  const arrivalGains = projectedDestinationVariants(state).map((variant) => state.cabin.reduce((sum, rider, index) => sum + (rider && variant[index] !== null && nextFloor >= variant[index]! ? PASSENGERS[rider.kind].energy : 0), 0));
  const deltas = arrivalGains.map((arrivalGain) => {
    return Math.min(state.energyCap, state.energy - drain + fixedGain + arrivalGain) - state.energy;
  });
  const lowDelta = Math.min(...deltas); const highDelta = Math.max(...deltas); const range = lowDelta === highDelta ? signedDelta(lowDelta) : `${signedDelta(lowDelta)}～${signedDelta(highDelta)}`;
  const lowArrivalGain = Math.min(...arrivalGains); const highArrivalGain = Math.max(...arrivalGains);
  reasons.push(`行驶 −${drain}`); if (fixedGain) reasons.push(`效果 +${fixedGain}`);
  if (highArrivalGain) reasons.push(lowArrivalGain === highArrivalGain ? `到站 +${highArrivalGain}` : `到站 +${lowArrivalGain}～+${highArrivalGain}`);
  const danger = state.energy + lowDelta <= 0;
  return { range, summary: `下一层能源 ${range} · ${reasons.join(' · ')}`, danger, lowDelta, highDelta };
}
