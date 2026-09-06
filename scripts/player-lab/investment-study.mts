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
   relay:Number(chance.relay)*S.RELAY_CHANCE*S.RELAY_ENERGY*E.CHARGE_PRICE,
   crowd:Number(s.cabin.filter(Boolean).length>=S.CROWD_MINIMUM&&riders.length>0)*S.CROWD_COINS,
   meter:rides.filter(n=>n>=S.METER_START).length*4,
   // A deliberately rough turnover estimate; shortening also changes timing,
   // work and fares. It is not a promise of this saving on future arrivals.
   express:arrived.reduce((n,i)=>n+Number(after.state.floor-s.cabin[i]!.boardedAt+s.upgrades.express>=5)*R.riderProfile(s.cabin[i]!,s.cabin,i).energy*E.CHARGE_PRICE,0),
  }};
}
