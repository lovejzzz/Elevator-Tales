import { COURIER_ARRIVAL_CHARGE, SHOP_ENTRY_CHARGE, arrivalRelief, arrivalRegeneration, energyBreakdown, riderAgitation, hasNeighbour, neighbours, type RunState } from './game-engine';
import { conflictLinks } from './rider-profile';
import { RELAY_ENERGY, shopOpportunities } from './shop-effects';
import { experimentalRiskLinks, type RiskLinkTuning } from './risk-link-experiment';
import { riskPartnerships } from './shift-rules';

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

export function stressForecast(state: RunState, _legacyWeight?: number, riskTuning?: RiskLinkTuning): StressForecast {
  const nextFloor = state.floor + 1;
  const effects = state.cabin.map((_, slot) => riderAgitation(state, slot));
  const passengerRise = effects.reduce((sum, effect) => sum + effect.low, 0);
  const linkRise = experimentalRiskLinks(state.cabin, riskTuning).agitation;
  const redRise=conflictLinks(state.cabin).filter(link=>link.effect==='agitation').length + linkRise + riskPartnerships(state.cabin).agitation;
  const variants = projectedDestinationVariants(state).map((destinations) => {
    const arriving = state.cabin.flatMap((rider, slot) => rider && destinations[slot] !== null && nextFloor >= destinations[slot]! ? [slot] : []);
    return { arrivals: arriving.length };
  });
  const minArrivals = Math.min(...variants.map((variant) => variant.arrivals)); const maxArrivals = Math.max(...variants.map((variant) => variant.arrivals));
  const available = Math.max(0, state.stress + passengerRise + redRise);
  const minRelief = Math.min(available, arrivalRelief(minArrivals)); const maxRelief = Math.min(available, arrivalRelief(maxArrivals));
  const arrivalReason = !maxRelief ? '' : minRelief === maxRelief ? `到站舒缓 −${maxRelief}` : `可能到站舒缓 −${minRelief}–${maxRelief}`;
  const lows = variants.map((variant) => Math.max(0, state.stress + passengerRise + redRise - arrivalRelief(variant.arrivals)));
  const highs = lows;
  const low = Math.min(...lows); const high = Math.max(...highs);
  const lowDelta = low - state.stress; const highDelta = high - state.stress;
  const range = lowDelta === highDelta ? signedDelta(lowDelta) : `${signedDelta(lowDelta)}～${signedDelta(highDelta)}`;
  const reasons = [
    ...effects.flatMap(effect => effect.fixed.map(line => `${line.label} ${signedDelta(line.amount)}`)),
    redRise?`红线躁动 +${redRise}`:'',
    arrivalReason,
  ].filter(Boolean);
  const details = reasons.join(' · ');
  const summary = details ? `下一层 ${range} · ${details}` : '下一层躁动不变 · 没有已知来源';
  const tone = state.stress + highDelta >= state.stressCap || highDelta >= 2 ? 'danger' : highDelta > 0 ? 'caution' : 'safe';
  return { range, details, summary, tone, lowDelta, highDelta };
}

export function energyForecast(state: RunState, _legacyWeight?: number, riskTuning?: RiskLinkTuning): EnergyForecast {
 const {motor,people,conflict,saved,total}=energyBreakdown(state);
 const nextFloor=state.floor+1;
 const shopCharge=nextFloor%10===0?SHOP_ENTRY_CHARGE:0;
 let relayPossible=false;
 const charges=projectedDestinationVariants(state).flatMap(destinations=>{
  const slots=state.cabin.flatMap((rider,slot)=>rider&&destinations[slot]!==null&&destinations[slot]!<=nextFloor?[slot]:[]);
  const arriving=slots.map(slot=>state.cabin[slot]!);
  const charge=shopCharge+arriving.filter(rider=>rider.kind==='courier').length*COURIER_ARRIVAL_CHARGE+arrivalRegeneration(state,arriving.length,experimentalRiskLinks(state.cabin,riskTuning).agitation);
  const relay=shopOpportunities(state,state.cabin,slots).relay;
  relayPossible ||= relay;
  return relay ? [charge,charge+RELAY_ENERGY] : [charge];
 });
 const deltas=charges.map(charge=>Math.min(state.energyCap,state.energy-total+charge)-state.energy);
 const lowDelta=Math.min(...deltas),highDelta=Math.max(...deltas);
 const minCharge=Math.min(...charges),maxCharge=Math.max(...charges);
 const chargeNote=maxCharge?minCharge===maxCharge?`＋补电 ${maxCharge}`:`＋可能补电 ${minCharge}–${maxCharge}`:'';
 const range=lowDelta===highDelta?signedDelta(lowDelta):`${signedDelta(lowDelta)}～${signedDelta(highDelta)}`;
 return {range,summary:`下一站耗 ${total} 电＝运转 ${motor}＋人物 ${people}${conflict?`＋红线 ${conflict}`:''}−节能 ${saved}${chargeNote}${relayPossible ? '；并联回充50%，不保证续航' : ''}`,danger:state.energy+lowDelta<=0,lowDelta,highDelta};
}
