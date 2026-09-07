import {E,R,S,B} from './game.mts';
import type {World} from './runtime.mts';
import type {InvestmentSample} from './types.mts';

// Post-action evidence only, computed after the actual ascent. No sealed fares,
// actual future, or RNG state is returned. These are opportunity-based expected
// gross returns, not retroactive receipts or a causal replay of a bought upgrade.
export function investmentSample(before:World,after:World):InvestmentSample {
 const s=before.state;
 const arrived=s.cabin.flatMap((r,i)=>r&&!after.state.cabin.some(p=>p?.id===r.id)?[i]:[]);
 const riders=arrived.map(i=>s.cabin[i]!);
 const hypothetical={...s,upgrades:{...s.upgrades,tipjar:1,relay:1,reinforced:1}};
 const chance=S.shopOpportunities(hypothetical,s.cabin,arrived);
 const rides=riders.map(r=>after.state.floor-r.boardedAt);
 const bondCount=arrived.reduce((n,i)=>n+R.bondStatus(s.cabin[i]!,s.cabin,i).supportCount,0);
 const oneBond=E.cooperationBonus({...s,upgrades:{...s.upgrades,battery:1}})-E.cooperationBonus({...s,upgrades:{...s.upgrades,battery:0}});
 const eligibleTips=B.ECONOMY_RULES.conciergeCondition==='any'||B.agitationBand(s.stress)==='medium'?riders.length:0;
 // Ghost savings are capped after Steady. Count marginal total power rather
 // than nominal activation: otherwise the two upgrades claim the same saving.
 const withoutSteady={...s,upgrades:{...s.upgrades,reinforced:0}};
 const steadySaving=E.totalEnergyCost(withoutSteady)-E.totalEnergyCost({...s,upgrades:{...s.upgrades,reinforced:1}});
 return {floor:s.floor,arrivals:riders.length,rideSum:rides.reduce((a,b)=>a+b,0),nearLimit:s.stress>=s.stressCap-2,
  gross:{
   reinforced:steadySaving*E.CHARGE_PRICE,
   concierge:eligibleTips*B.ECONOMY_RULES.conciergeTip,
   battery:bondCount*oneBond,
   tipjar:chance.eligibleTips*S.TIP_CHANCE*B.ECONOMY_RULES.tipReward,
   relay:Number(chance.relay)*S.relayExpectedEnergy()*E.CHARGE_PRICE,
   crowd:Number(S.mixedTicketEligible(s.cabin)&&riders.length>0)*S.CROWD_COINS,
   single:Number(riders.length===1)*2,
   finale:S.finaleIncome({...s,upgrades:{...s.upgrades,finale:1}},riders.length,after.state.cabin.filter(Boolean).length),
   punchcard:arrived.reduce((n,i)=>{const p=R.riderProfile(s.cabin[i]!,s.cabin,i);return n+(p.hidden?16*(s.cabin[i]!.localFareRatio??1):p.fare)/5;},0), // Neutral cycle estimate, not known next lucky rider.
   buffer:S.SHOP_TUNING.bufferFlywheel
    ? S.flywheelSaving({...s,upgrades:{...s.upgrades,buffer:1}},(after.state.lastArrivals??[]).length,Math.max(0,E.energyBreakdown(s).motor-E.serviceSaving(s)))*E.CHARGE_PRICE
    : Math.min(4,after.state.lastEnergy.sources.filter(x=>x.label==='超额回充未储存'||x.label==='存入缓冲槽').reduce((n,x)=>n+Math.max(0,-x.amount),0))*2+S.naturalChargeBoost({...s,upgrades:{...s.upgrades,buffer:1}},after.state.lastEnergy.sources.filter(x=>x.label==='快递员电池包'||x.label==='并联回充').reduce((n,x)=>n+x.amount,0))*E.CHARGE_PRICE, // Observed opportunity only, not realised ROI.
   insulation:(E.totalEnergyCost({...s,upgrades:{...s.upgrades,insulation:0}})-E.totalEnergyCost({...s,upgrades:{...s.upgrades,insulation:1}}))*E.CHARGE_PRICE,
   meter:rides.filter(n=>n>=S.METER_START).length*4,
   // A deliberately rough turnover estimate; shortening also changes timing,
   // work and fares. It is not a promise of this saving on future arrivals.
   express:arrived.reduce((n,i)=>n+Number(after.state.floor-s.cabin[i]!.boardedAt+s.upgrades.express>=S.SHOP_TUNING.expressMinimum)*R.riderProfile(s.cabin[i]!,s.cabin,i).energy*E.CHARGE_PRICE,0),
  }};
}
