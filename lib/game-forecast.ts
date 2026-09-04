import { COURIER_ARRIVAL_CHARGE, energyBreakdown, riderAgitation, hasNeighbour, neighbours, type RunState } from './game-engine';

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

export function stressForecast(state: RunState, _legacyWeight?: number): StressForecast {
  const nextFloor = state.floor + 1;
  const effects = state.cabin.map((_, slot) => riderAgitation(state, slot));
  const passengerRise = effects.reduce((sum, effect) => sum + effect.low, 0);
  const variants = projectedDestinationVariants(state).map((destinations) => {
    const arriving = state.cabin.flatMap((rider, slot) => rider && destinations[slot] !== null && nextFloor >= destinations[slot]! ? [slot] : []);
    return { arrivals: arriving.length };
  });
  const minArrivals = Math.min(...variants.map((variant) => variant.arrivals)); const maxArrivals = Math.max(...variants.map((variant) => variant.arrivals));
  const arrivalReason = !maxArrivals ? '' : minArrivals === maxArrivals ? '到站舒缓 −1' : '可能到站舒缓 −1';
  const lows = variants.map((variant) => Math.max(0, state.stress + passengerRise - (variant.arrivals ? 1 : 0)));
  const highs = lows;
  const low = Math.min(...lows); const high = Math.max(...highs);
  const lowDelta = low - state.stress; const highDelta = high - state.stress;
  const range = lowDelta === highDelta ? signedDelta(lowDelta) : `${signedDelta(lowDelta)}～${signedDelta(highDelta)}`;
  const reasons = [
    ...effects.flatMap(effect => effect.fixed.map(line => `${line.label} ${signedDelta(line.amount)}`)),
    arrivalReason,
  ].filter(Boolean);
  const details = reasons.join(' · ');
  const summary = details ? `下一层 ${range} · ${details}` : '下一层躁动不变 · 没有已知来源';
  const tone = state.stress + highDelta >= state.stressCap || highDelta >= 2 ? 'danger' : highDelta > 0 ? 'caution' : 'safe';
  return { range, details, summary, tone, lowDelta, highDelta };
}

export function energyForecast(state: RunState, _legacyWeight?: number): EnergyForecast {
 const {motor,people,saved,total}=energyBreakdown(state);
 const nextFloor=state.floor+1;
 const charges=projectedDestinationVariants(state).map(destinations=>state.cabin.reduce((sum,rider,slot)=>sum+(rider?.kind==='courier'&&destinations[slot]!==null&&destinations[slot]!<=nextFloor?COURIER_ARRIVAL_CHARGE:0),0));
 const deltas=charges.map(charge=>Math.min(state.energyCap,state.energy-total+charge)-state.energy);
 const lowDelta=Math.min(...deltas),highDelta=Math.max(...deltas);
 const minCharge=Math.min(...charges),maxCharge=Math.max(...charges);
 const chargeNote=maxCharge?minCharge===maxCharge?`＋快递补电 ${maxCharge}`:`＋可能快递补电 ${minCharge}–${maxCharge}`:'';
 const range=lowDelta===highDelta?signedDelta(lowDelta):`${signedDelta(lowDelta)}～${signedDelta(highDelta)}`;
 return {range,summary:`下一站耗 ${total} 电＝运转 ${motor}＋人物 ${people}−节能 ${saved}${chargeNote}`,danger:state.energy+lowDelta<=0,lowDelta,highDelta};
}
