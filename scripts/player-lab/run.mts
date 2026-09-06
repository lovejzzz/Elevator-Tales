import {performance} from 'node:perf_hooks';
import {S} from './game.mts';
import {Session,previewWorld,features,type World} from './runtime.mts';
import {Player} from './policies.mts';
import {serviceFor} from './search.mts';
import {summarize,type Turn,type ShopVisit} from './analytics.mts';
import type {PolicyName,ShopStyle} from './types.mts';
import {investmentSample} from './investment-study.mts';

export function runOne(policy:PolicyName,seed:number,horizon:number,tutorial=false,shopStyle:ShopStyle='native',fixture?:World){
 const session=new Session(seed,tutorial,fixture),player=new Player(policy,shopStyle),turns:Turn[]=[],shops:ShopVisit[]=[];
 const openingCoins=session.observation().coins;
 const start=performance.now();let guard=0;
 while(session.observation().phase!=='lost'&&session.observation().floor<horizon){
  if(guard++>horizon*3)throw Error('Run did not progress');
  const before=session.observation();
  if(before.phase==='upgrade'){
   const service=shopStyle!=='native'||policy==='operator'?serviceFor(session.world(),session.names):undefined;
   const {actions}=player.shop(before,service);for(const a of actions)session.act(a);
   const exit=session.observation();shops.push({entry:before,exit,actions,study:structuredClone(player.investmentStudy),spend:before.coins-exit.coins,
    emptyPermanentPool:before.shop.length===0&&before.installed.length>=before.upgradeSlots,
    minimumRepair:Math.max(0,1-before.energy)*before.prices.charge+Math.max(0,before.stress-before.stressCap+1)*before.prices.soothe,
    fullServiceQuote:(before.energyCap-before.energy)*before.prices.charge+before.stress*before.prices.soothe});continue;
  }
  const started=performance.now(),service=serviceFor(session.world(),session.names);
  // This diagnostic is deliberately SINGLE-card placement coverage. It is not
  // a claim that jointly useful pairs have no opportunity.
  const baseFeatures=features(session.world(),before.coins);
  const opportunities=before.offers.map(r=>{
   const witnesses=Array.from({length:6},(_,slot)=>previewWorld(session.world(),[{type:'place',rider:r.id,slot}],session.names)).filter(Boolean);
   return {kind:r.kind,safeSinglePlacement:witnesses.some(p=>p!.safety.resourceSafe&&p!.safety.bombSafe),
    interactionPossible:witnesses.some(p=>p!.features.green>baseFeatures.green||p!.features.rise<baseFeatures.rise)};
  });
  const decision=player.decide(before,service);for(const a of decision.actions)session.act(a);
  const departure=session.observation(),w=session.world(),f=features(w,before.coins);
  session.act({type:'depart'});const after=session.observation();
  const arrivedSlots=w.state.cabin.flatMap((r,i)=>r&&!session.world().state.cabin.some(p=>p?.id===r.id)?[i]:[]);
  const chance=S.shopOpportunities(w.state,w.state.cabin,arrivedSlots);
  turns.push({before,decision,departure,after,features:f,opportunities,income:after.coins-departure.coins,
   spend:before.coins-departure.coins,dismissed:decision.actions.filter(a=>a.type==='dismiss').length,
   arrivals:arrivedSlots.map(i=>w.state.cabin[i]!.kind),tipEligible:chance.eligibleTips,
   tipCoins:after.receipt.coinSources.find(s=>s.label==='小费盒额外小费')?.amount??0,
   relayEligible:chance.relay,relayEnergy:session.world().state.lastEnergy.sources.find(s=>s.label==='并联回充')?.amount??0,
   elapsedMs:performance.now()-started});
  player.feedback(departure,after,investmentSample(w,session.world()));
 }
 const summary=summarize(turns,shops,session.observation());
 if(openingCoins+summary.income-summary.spend!==summary.final.coins)throw Error('Ledger does not reconcile');
 return {policy,seed,horizon,tutorial,wallMs:performance.now()-start,summary,turns,shops,replay:session.replayRecord()};
}
