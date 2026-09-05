import type {Observation,Decision,Action,Preview} from './types.mts';
import {mean,quantile} from './util.mts';
export type Turn={before:Observation;decision:Decision;departure:Observation;after:Observation;
  features:Preview['features'];opportunities:{kind:string;safeSinglePlacement:boolean;interactionPossible:boolean}[];
  income:number;spend:number;dismissed:number;arrivals:string[];tipEligible:number;tipCoins:number;relayEligible:boolean;relayEnergy:number;elapsedMs:number};
export type ShopVisit={entry:Observation;exit:Observation;actions:Action[];study?:Array<{key:string;gross:number;net:number;observations:number}>;spend:number;emptyPermanentPool:boolean;minimumRepair:number;fullServiceQuote:number};
export type Flag={code:string;floor:number;evidence:Record<string,unknown>;interpretation:string};
export function flagBlock(b:{floor:number;occupancy:number;skipFraction:number;income:number;spend:number;coins:number;fullServiceQuote:number;emptyPermanentPool:boolean}):Flag[]{
 const out:Flag[]=[];
 if(b.occupancy<=2&&b.skipFraction>=.5&&b.income>b.spend)out.push({code:'LOW_LOAD_STILL_ACCUMULATES',floor:b.floor,evidence:b,interpretation:'少载且多次不接新客仍有净积累；这是经济压力线索，不是已证明最优策略。'});
 if(b.fullServiceQuote>0&&b.coins/b.fullServiceQuote>=5)out.push({code:'CASH_OUTGROWS_MAINTENANCE',floor:b.floor,evidence:{coins:b.coins,fullServiceQuote:b.fullServiceQuote,coverage:b.coins/b.fullServiceQuote},interpretation:'现有余额可覆盖至少5次本次全维护报价；未来花费并非固定不变。'});
 if(b.emptyPermanentPool)out.push({code:'PERMANENT_CHOICES_EXHAUSTED',floor:b.floor,evidence:{coins:b.coins},interpretation:'永久能力池已耗尽；商店是否仍有取舍需要UI/玩家复核。'});
 return out;
}
export function summarize(turns:Turn[],shops:ShopVisit[],final:Observation){
 const flags:Flag[]=[],byDecade=[];
 for(const floor of new Set(turns.map(t=>Math.ceil(t.after.floor/10)*10))){
  const ts=turns.filter(t=>Math.ceil(t.after.floor/10)*10===floor),shop=shops.find(s=>s.entry.floor===floor);
  const occupancy=mean(ts.map(t=>t.features.occupied)),skips=ts.filter(t=>t.features.newCount===0).length;
  const income=ts.reduce((n,t)=>n+t.income,0),spend=ts.reduce((n,t)=>n+t.spend,0)+(shop?.spend??0);
  const b={floor,ascents:ts.length,occupancy,skipFraction:skips/ts.length,income,spend,net:income-spend,
   coins:(shop?.entry??ts.at(-1)!.after).coins,fullServiceQuote:shop?.fullServiceQuote??0,emptyPermanentPool:shop?.emptyPermanentPool??false};
  byDecade.push(b);flags.push(...flagBlock(b));
 }
 let streak=0,maxStreak=0;
 const roles:Record<string,{offered:number;safeSinglePlacement:number;interactionPossible:number;accepted:number;arrived:number}>={};
 const role=(k:string)=>roles[k]??=( {offered:0,safeSinglePlacement:0,interactionPossible:0,accepted:0,arrived:0});
 for(const t of turns){
  for(const o of t.opportunities){const r=role(o.kind);r.offered++;r.safeSinglePlacement+=Number(o.safeSinglePlacement);r.interactionPossible+=Number(o.interactionPossible);}
  for(const r of t.departure.cabin)if(r&&r.boardedAt===t.before.floor)role(r.kind).accepted++;
  for(const k of t.arrivals)role(k).arrived++;
  const skip=t.features.newCount===0&&t.features.occupied<6;streak=skip?streak+1:0;maxStreak=Math.max(maxStreak,streak);
  if(streak===5)flags.push({code:'FIVE_SKIP_WITH_SPACE',floor:t.before.floor,evidence:{stress:t.before.stress,coins:t.before.coins},interpretation:'连续五层有空位而不接客；不等于没看牌或感到无聊。'});
  if(t.before.offers.length>0&&t.before.offers.every(r=>r.volatile)&&skip)flags.push({code:'ALL_HIGH_RISK_REJECTED',floor:t.before.floor,evidence:{count:t.before.offers.length},interpretation:'整批高危且全不接；需要结合单张与联合可行机会判断供给。'});
  if(t.dismissed&&t.spend/Math.max(1,t.before.coins)<.01)flags.push({code:'DISMISSAL_CASH_COST_UNDER_ONE_PERCENT',floor:t.before.floor,evidence:{paid:t.spend,coins:t.before.coins,dismissed:t.dismissed},interpretation:'只标现金代价轻；未兑现车费、到站舒缓、连携损失另见公开前后状态。'});
  if(t.after.phase==='upgrade'&&(t.after.stress>=t.after.stressCap||t.after.energy<=0))flags.push({code:'SHOP_RESCUE_WINDOW',floor:t.after.floor,evidence:{coins:t.after.coins,stress:t.after.stress},interpretation:'进入抢救商店，不是死亡；必须再检查支付与离店结果。'});
  if(t.after.receipt.coinSources.some(s=>s.label==='醉汉躁动加价'&&s.amount>0))flags.push({code:'NEGATIVE_RESOURCE_PAID_OFF',floor:t.after.floor,evidence:{sources:t.after.receipt.coinSources},interpretation:'已有躁动产生实际额外收益；不是单凭亮绿线判断组合成功。'});
 }
 const outcome=final.phase==='lost'?final.failureCause+'-death':'alive-censored';
 const tips=turns.reduce((n,t)=>n+t.tipEligible,0),relay=turns.filter(t=>t.relayEligible).length;
 return {outcome,final:{floor:final.floor,energy:final.energy,stress:final.stress,coins:final.coins},
  ascents:turns.length,meanOccupancy:mean(turns.map(t=>t.features.occupied)),maxOccupancy:Math.max(0,...turns.map(t=>t.features.occupied)),
  noNewRiderAscents:turns.filter(t=>t.features.newCount===0).length,maxSkipWithSpaceStreak:maxStreak,
  income:turns.reduce((n,t)=>n+t.income,0),spend:turns.reduce((n,t)=>n+t.spend,0)+shops.reduce((n,s)=>n+s.spend,0),
  decisionsMs:{mean:mean(turns.map(t=>t.elapsedMs)),p90:quantile(turns.map(t=>t.elapsedMs),.9)},
  shops:shops.length,byDecade,roles,flags,
  uncertainty:{tipOpportunities:tips,tipCoins:turns.reduce((n,t)=>n+t.tipCoins,0),relayOpportunities:relay,relayEnergy:turns.reduce((n,t)=>n+t.relayEnergy,0)},
  deathReview:final.phase==='lost'?{window:turns.slice(-5).map(t=>({floor:t.before.floor,resources:{energy:t.before.energy,stress:t.before.stress,coins:t.before.coins},
   actions:t.decision.actions,reason:t.decision.reason,sampledSafePlans:t.decision.diagnostics.sampledSafePlans,alternatives:t.decision.alternatives})),
   caveat:'最后五层的可见信息与已搜索替代方案；未找到安全方案不等于证明无解，也不据此将死亡归罪于抽牌。'}:null};
}
