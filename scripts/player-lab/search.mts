import {E,R,type Rider} from './game.mts';
import {Names,applyLocal,applyPlan,previewWorld,features,observe,believed,clone,type World} from './runtime.mts';
import {score,Player} from './policies.mts';
import {rngFor,seedFor,mean} from './util.mts';
import type {Action,Observation,PublicRider,Preview,PreviewService,PolicyName,Rollout} from './types.mts';

// Model futures depend on public mechanical state, never translated prose,
// release labels, or receipt wording. This is a deliberate planning-v2 break:
// old action replays remain valid, but old policy trajectories are not baselines.
export function planningSeed(o:Observation):number {
 const rider=(r:PublicRider|null)=>{
  if(!r)return null;
  const {name:_name,rule:_rule,...mechanics}=r;return mechanics;
 };
 const {schema:_schema,version:_version,receipt:_receipt,cabin,offers,shop,...state}=o;
 const mechanics={...state,cabin:cabin.map(rider),offers:offers.map(rider),
  shop:shop.map(({rule:_rule,...card})=>card),reserved:o.reserved?rider(o.reserved):null};
 return seedFor(JSON.stringify(mechanics)+'/planning-v2');
}

function quick(w:World,actions:Action[],baseCoins:number,_names:Names):Preview {
 const f=features(w,baseCoins),s=w.state;
 // Cheap screen only. Exact shared forecasts are used for shortlisted plans.
 const energy=s.energy-f.energyCost+(s.floor%10===9?E.SHOP_ENTRY_CHARGE:0),stress=s.stress+f.rise-E.arrivalRelief(f.due);
 return {actions,features:f,observation:{floor:s.floor,coins:s.coins,energy:s.energy,energyCap:s.energyCap,stress:s.stress,stressCap:s.stressCap,installed:Object.keys(s.upgrades).filter(k=>s.upgrades[k as keyof typeof s.upgrades]>0),
  arrivalReliefCap:E.arrivalRelief(6),prices:{charge:E.CHARGE_PRICE,soothe:E.SOOTHE_PRICE},cabin:s.cabin.map((r,i)=>r?{kind:r.kind,remaining:r.destination-s.floor,currentPayout:R.riderProfile(r,s.cabin,i).hidden?null:E.arrivalFare(r,s.cabin,i,E.cooperationBonus(s),s.stress)}:null)} as Preview['observation'],
  safety:{resourceSafe:f.occupied>0&&(s.floor%10===9?energy>=0:energy>0&&stress<s.stressCap),bombSafe:s.cabin.every((r,i)=>!r||r.kind!=='bomb'||(r.fuse??0)>1||r.destination<=s.floor+1||E.hasNeighbour(s.cabin,i,['cop'])),shopWindow:s.floor%10===9}};
}
function localActions(w:World,names:Names,mode:PolicyName):Action[]{
 const s=w.state,count=s.cabin.filter(Boolean).length,actions:Action[]=[];
 if(s.upgrades.retime&&s.retimeUsedSector!==Math.floor(s.floor/10))for(const r of s.cabin)if(r?.boardedAt===s.floor)for(const delta of [-1,1])if(r.destination+delta>s.floor)actions.push({type:'retime',rider:names.id(r.id),delta});
 if(s.calmCharge&&s.stress>0)actions.push({type:'use-calm'});
 if(s.upgrades.reservation&&!s.reservedRider&&s.reservationUsedSector!==Math.floor(s.floor/10))for(const r of w.offers)if(!s.cabin.some(p=>p?.id===r.id)&&!s.reservedIds?.includes(r.id))actions.push({type:'reserve-offer',rider:names.id(r.id)});
 if(s.reserveCell&&s.energy<s.energyCap)actions.push({type:'use-reserve'});
 const offers=mode==='novice'?w.offers.slice(0,2):w.offers;
 const limit=mode==='novice'?2:mode==='minimalist'?1:6;
 if(count<limit)for(const r of offers){if(s.cabin.some(p=>p?.id===r.id))continue;
  for(let i=0;i<6;i++)if(!s.cabin[i]){actions.push({type:'place',rider:names.id(r.id),slot:i});if(mode==='novice')break;}}
 if(mode!=='novice')s.cabin.forEach((r,i)=>{if(r&&r.boardedAt<s.floor){
  if(E.oldMovesRemaining(s)>0)for(let j=0;j<6;j++)if(i!==j&&!(j<i&&s.cabin[j]))actions.push({type:'place',rider:names.id(r.id),slot:j});
  if(s.coins>=E.dismissalCost(s,r))actions.push({type:'dismiss',rider:names.id(r.id)});
 }});
 return actions;
}
const key=(w:World)=>w.state.cabin.map(r=>r?r.id+':'+r.destination:'-').join('|')+'/'+w.state.coins+'/'+E.oldMovesRemaining(w.state)+'/'+w.state.reservedRider?.id+'/'+w.state.retimeUsedSector+'/'+Boolean(w.state.calmCharge)+'/'+w.state.energy+'/'+Boolean(w.state.reserveCell);
export function enumerate(base:World,names:Names,mode:PolicyName,seen:Set<string>,budgetOverride?:number,diagnosticAll=false){
 const intakeDiverse=mode==='diverse';if(mode==='diverse')mode='allocator';
 const budget=budgetOverride??({novice:18,minimalist:70,merchant:110,explorer:160,planner:180,opportunist:180,investor:180,operator:180,allocator:180}[mode]);
 type Node={w:World;actions:Action[];q:Preview;score:number};
 const q=quick(base,[],base.state.coins,names),root={w:base,actions:[],q,score:score(q,mode,seen)};
 let beam:Node[]=[root],count=0;const all:Node[]=[root],visited=new Set([key(base)]);
 for(let depth=0;depth<(mode==='novice'?2:5)&&count<budget;depth++){
  const next:Node[]=[];
  for(const parent of beam)for(const a of localActions(parent.w,names,mode)){
   if(count>=budget)break;const w=applyLocal(parent.w,a,names);if(!w||visited.has(key(w)))continue;
   visited.add(key(w));count++;const actions=[...parent.actions,a],q=quick(w,actions,base.state.coins,names);
   next.push({w,actions,q,score:score(q,mode,seen)});
  }
  next.sort((a,b)=>b.score-a.score);all.push(...next);
  // Preserve different occupancies so a temporarily weak first component does
  // not erase every route to a larger current-batch combination.
  const diversity=new Map<number,Node>();for(const n of next)if(!diversity.has(n.q.features.occupied))diversity.set(n.q.features.occupied,n);
  beam=[...new Set([...diversity.values(),...next.slice(0,4)])].slice(0,8);
  if(!beam.length)break;
 }
 // Panic actions must not be crowded out by dozens of cosmetic swaps. Enumerate
 // every affordable subset of OLD riders to dismiss (at most 2^6), then allow
 // one replacement if emptied. This tests the actual emergency option space.
 const s=base.state,pressure=features(base,s.coins);
 if(mode!=='novice'&&(s.energy<pressure.energyCost*Math.min(4,E.nextShopFloor(s.floor)-s.floor)||s.stress+pressure.rise>=s.stressCap-1)){
  const old=s.cabin.filter((r):r is Rider=>Boolean(r&&r.boardedAt<s.floor));
  for(let mask=1;mask<(1<<old.length);mask++){
   const actions:Action[]=old.flatMap((r,i)=>mask&(1<<i)?[{type:'dismiss' as const,rider:names.id(r.id)}]:[]);
   const w=applyPlan(base,actions,names);if(!w)continue;
   const add=(w:World,actions:Action[])=>{if(visited.has(key(w)))return;visited.add(key(w));count++;const q=quick(w,actions,s.coins,names);all.push({w,actions,q,score:score(q,mode,seen)});};
   if(w.state.cabin.some(Boolean))add(w,actions);
   else for(const a of localActions(w,names,mode)){const next=applyLocal(w,a,names);if(next)add(next,[...actions,a]);}
  }
 }
 all.sort((a,b)=>b.score-a.score);
 const largest=all.find(n=>n.q.features.occupied===Math.max(...all.map(n=>n.q.features.occupied)));
 const dismissalDiversity=new Map<number,Node>();for(const n of all){const count=n.actions.filter(a=>a.type==='dismiss').length;if(!dismissalDiversity.has(count))dismissalDiversity.set(count,n);}
 const intakeRepresentatives=new Map<number,Node>();
 if(intakeDiverse){const offered=new Set(base.offers.filter(r=>!base.state.cabin.some(p=>p?.id===r.id)).map(r=>r.id));for(const n of all){const count=n.w.state.cabin.filter(r=>r&&offered.has(r.id)).length;if(!intakeRepresentatives.has(count))intakeRepresentatives.set(count,n);}}
 const final=diagnosticAll?all:[...new Set([...intakeRepresentatives.values(),...all.slice(0,10),root,...(largest?[largest]:[]),...dismissalDiversity.values()])];
 const plans=final.filter(n=>n.w.state.cabin.some(Boolean)).map(n=>previewWorld(base,n.actions,names)!).filter(Boolean);
 return {plans,enumerated:count};
}

// Sample unknown copy assignments conditioned on the currently visible one;
// never carry the true copy seed into future imagined arrangements.
function beliefWorld(w:World,rng:()=>number):World {
 const b=believed(w,rng);
 const all=[...b.state.cabin,...b.offers,b.state.reservedRider].filter((r):r is Rider=>Boolean(r));
 const done=new Set<string>();
 for(const r of all)if(r.kind==='mimic'&&!done.has(r.id)){
  done.add(r.id);const slot=b.state.cabin.findIndex(p=>p?.id===r.id);
  const target=slot>=0?R.riderProfile(r,b.state.cabin,slot).copies.map(c=>c.sourceId+':'+c.field).join('|'):'';
  let accepted=false;
  for(let i=0;i<512;i++){r.copySeed=E.rand(0,2147483647,rng);
   if(slot<0||R.riderProfile(r,b.state.cabin,slot).copies.map(c=>c.sourceId+':'+c.field).join('|')===target){accepted=true;break;}}
  if(!accepted)throw Error('Could not sample a public-consistent copy belief');
  for(const other of all)if(other.id===r.id)other.copySeed=r.copySeed;
 }
 return b;
}
export function shopInvestmentRoom(w:World):number {
 const s=w.state;
 if(s.status!=='upgrade'||Object.values(s.upgrades).filter(Boolean).length>=4)return 0;
 const soothe=Math.max(0,s.stress-s.stressCap+1),repaired={...s,stress:s.stress-soothe};
 const commitment=features({...w,state:repaired},s.coins).committedEnergy+2;
 const optionCash=Math.max(0,...s.cabin.flatMap((r,slot)=>r&&((repaired.stress>=s.stressCap-2&&(R.riderProfile(r,s.cabin,slot).agitation+Number(Boolean(r.volatile))>0||r.kind==='thief'))||(r.kind==='bomb'&&(r.fuse??0)<=2))?[E.dismissalCost(s,r)]:[]));
 const room=s.coins-soothe*E.SOOTHE_PRICE-Math.max(0,commitment-s.energy)*E.CHARGE_PRICE-optionCash;
 return Math.max(0,Math.min(60,room));
}
// Research-v3: actual engine continuations, including all installed abilities.
// No fabricated per-item ROI. Finite next-shop horizon deliberately understates
// slow-payback upgrades; retain heuristic controls and longer acquisition trials.
export function jointChargeTargets(w:World){
 const s=w.state;
 // These are alternative public budgets, not prescribed purchases. The joint
 // continuation pays actual dismissals and determines whether saving this cash
 // was useful. Never insert the retrospective minimum rescue charge here.
 const optionCash=Math.max(0,...s.cabin.flatMap((r,slot)=>r&&
  ((s.stress>=s.stressCap-2&&(R.riderProfile(r,s.cabin,slot).agitation+Number(Boolean(r.volatile))>0||r.kind==='thief'))||(r.kind==='bomb'&&(r.fuse??0)<=2))
  ?[E.dismissalCost(s,r)]:[]));
 return {fifty:50,full:s.energyCap,minimum:Math.max(1,s.energy),
  commitment:features(w,s.coins).committedEnergy+2,
  reserve:s.energy+Math.floor(Math.max(0,s.coins-optionCash)/E.CHARGE_PRICE)};
}
export function jointShopTrials(base:World,names:Names,samples=4,depth:10|20=10,continuation:'greedy'|'operator'|'diverse'='greedy'):import('./types.mts').ShopTrial[] {
 if(base.state.status!=='upgrade')throw Error('Joint shopping requires shop state');
 if(!Number.isInteger(samples)||samples<1||samples>16)throw Error('Joint sample budget exceeded');
 if(![10,20].includes(depth))throw Error('Joint horizon budget exceeded');
 const seed=planningSeed(observe(base,names)),trials:import('./types.mts').ShopTrial[]=[];
 const keys=['none',...E.availableShopCards(base.state).map(c=>c.key)];
 for(const key of keys)for(const budget of ['fifty','full','minimum','commitment','reserve'] as const){
  let root=clone(base);const actions:Action[]=[];
  const act=(a:Action)=>{const n=applyLocal(root,a,names);if(!n)return false;root=n;actions.push(a);return true;};
  if(key!=='none'&&!act({type:'buy',key}))continue;
  if(root.state.stress>=root.state.stressCap&&root.state.calmCharge)act({type:'use-calm'});
  const soothe=Math.max(0,root.state.stress-root.state.stressCap+1);
  if(soothe&&!act({type:'soothe',units:soothe}))continue;
  const chargeTarget=jointChargeTargets(root)[budget];
  const charge=Math.min(root.state.energyCap-root.state.energy,Math.max(0,chargeTarget-root.state.energy),Math.floor(root.state.coins/E.CHARGE_PRICE));
  if(charge>0)act({type:'charge',units:charge});
  const left=E.leaveShop(root.state);if(left.status!=='playing')continue;
  if(trials.some(t=>JSON.stringify(t.actions)===JSON.stringify([...actions,{type:'leave'}])))continue;
  const outcomes=[];
  for(let sample=0;sample<samples;sample++){
   // Separate streams per floor/channel keep packet randomness matched even
   // when a purchase changes settlement trigger counts. Never use run seed.
   const stream=(channel:string,floor:number)=>rngFor(seedFor(seed+'/joint-v3/'+sample+'/'+channel+'/'+floor));
   let w=beliefWorld({state:left,offers:[]},stream('belief',left.floor)),travelled=0;
   w=E.nextOfferBatch(w.state,stream('offers',w.state.floor));
   const reactive=continuation==='greedy'?null:new Player(continuation,'committed');
   const persistentNames=new Names();persistentNames.register(w);
   for(let step=0;step<depth&&w.state.status==='playing';step++){
    const ids=reactive?persistentNames:new Names();ids.register(w);
    const beforeObservation=observe(w,ids);
    const best=reactive?reactive.decide(beforeObservation,serviceFor(w,ids)):
     enumerate(w,ids,'diverse',new Set(),72).plans.sort((a,b)=>score(b,'operator',new Set())-score(a,'operator',new Set()))[0];
    if(!best)break;
    w=applyPlan(w,best.actions,ids)!;
    const next=E.resolveFloor(clone(w.state),stream('settle',w.state.floor));travelled++;
    w=next.status==='playing'?E.nextOfferBatch(next,stream('offers',next.floor)):{state:next,offers:[]};
    if(reactive){ids.register(w);reactive.feedback(beforeObservation,observe(w,ids));}
    // At the intermediate shop, pay real mandatory repair and charging.
    // No further ability purchase: isolates the current investment while
    // retaining its effect on the next packet, budget and ten-floor checkpoint.
    if(w.state.status==='upgrade'&&step+1<depth){
     let serviced=w.state;
     if(serviced.stress>=serviced.stressCap&&serviced.calmCharge)serviced=E.useCalmCharge(serviced);
     const units=Math.max(0,serviced.stress-serviced.stressCap+1);
     if(units)serviced=E.sootheAgitation(serviced,units);
     const power=Math.min(serviced.energyCap-serviced.energy,Math.floor(serviced.coins/E.CHARGE_PRICE));
     if(power>0)serviced=E.chargeBattery(serviced,power);
     serviced=E.leaveShop(serviced);
     w=serviced.status==='playing'?E.nextOfferBatch(serviced,stream('offers',serviced.floor)):{state:serviced,offers:[]};
    }
   }
   const s=w.state,freeRelief=s.calmCharge?2:0;
   const repair=Math.max(0,1-s.energy)*E.CHARGE_PRICE+Math.max(0,s.stress-freeRelief-s.stressCap+1)*E.SOOTHE_PRICE;
   const survived=s.status==='upgrade'&&s.coins>=repair;
   // Terminal cash plus stored power valued at charge price; visible pending
   // fares discounted and capped. No hidden fare, future offers or asset resale.
   const pending=observe(w,new Names(),false).cabin.reduce((n,r)=>n+(r?.currentPayout??0),0);
   const value=Number(survived)*1000+travelled*20+s.coins+Math.max(0,s.energy+(s.bufferPower??0))*E.CHARGE_PRICE
     +Math.min(30,Math.max(0,pending)*.25)-repair;
   outcomes.push({survived,travelled,value,cash:s.coins,power:s.energy,stress:s.stress});
  }
  trials.push({key,actions:[...actions,{type:'leave'}],samples,depth,
   survival:mean(outcomes.map(o=>Number(o.survived))),floors:mean(outcomes.map(o=>o.travelled)),
   value:mean(outcomes.map(o=>o.value)),cash:mean(outcomes.map(o=>o.cash)),
   power:mean(outcomes.map(o=>o.power)),stress:mean(outcomes.map(o=>o.stress))});
 }
 return trials;
}
export function serviceFor(base:World,names:Names,options:{boardingHorizon?:'fixed'|'next-shop'}={}):PreviewService {
 // This seed is derived exclusively from redacted, currently visible data.
 const publicSeed=planningSeed(observe(base,names));
 return {
  preview:actions=>previewWorld(base,actions,names),
  jointShop:(samples=4,depth=10)=>jointShopTrials(base,names,samples,depth),
  candidates:(mode,seen)=>enumerate(base,names,mode,seen),
  imagine(actions,depth,samples,continuation='minimalist'):Rollout {
   const placed=applyPlan(base,actions,names);if(!placed)throw Error('Illegal imagined root plan');
   if(!Number.isInteger(depth)||depth<1||depth>5||!Number.isInteger(samples)||samples<1||samples>16)throw Error('Planning budget exceeded');
   const nextShop=options.boardingHorizon==='next-shop';
   const actualDepth=nextShop?10-base.state.floor%10:depth;
   const outcomes=[];
   for(let n=0;n<samples;n++){
    const rng=rngFor(publicSeed+n*1009);let w=beliefWorld(placed,rng),travelled=0,minRoom=w.state.stressCap-w.state.stress;
    const startCoins=w.state.coins;
    for(let t=0;t<actualDepth;t++){
     if(w.state.status!=='playing'||!w.state.cabin.some(Boolean))break;
     const state=E.resolveFloor(clone(w.state),rng);travelled++;minRoom=Math.min(minRoom,state.stressCap-state.stress);
     w={state,offers:[]};
     if(state.status==='lost'||state.status==='upgrade')break;
     if(t+1<actualDepth){
      w=E.nextOfferBatch(state,rng);
      const localNames=new Names();localNames.register(w);
      const next=enumerate(w,localNames,continuation,new Set(),24).plans.sort((a,b)=>score(b,continuation,new Set())-score(a,continuation,new Set()))[0];
      if(next)w=applyPlan(w,next.actions,localNames)!;
     }
    }
    const s=w.state,repair=Math.max(0,1-s.energy)*E.CHARGE_PRICE+Math.max(0,s.stress-s.stressCap+1)*E.SOOTHE_PRICE;
    const survived=s.status!=='lost'&&(s.status!=='upgrade'||s.coins>=repair);
    const reachedShop=s.status==='upgrade'&&s.coins>=repair;
    outcomes.push({survived:nextShop?reachedShop:survived,reachedShop,censored:s.status==='playing',travelled,minRoom,net:s.coins-startCoins,energy:s.energy,stress:s.stress,investmentRoom:survived?shopInvestmentRoom(w):0});
   }
   return {samples,depth:actualDepth,survivalFraction:mean(outcomes.map(v=>Number(v.survived))),shopArrivalFraction:mean(outcomes.map(v=>Number(v.reachedShop))),censoredFraction:mean(outcomes.map(v=>Number(v.censored))),minStressRoom:Math.min(...outcomes.map(v=>v.minRoom)),
    meanFloors:mean(outcomes.map(v=>v.travelled)),meanNetCash:mean(outcomes.map(v=>v.net)),meanEnergy:mean(outcomes.map(v=>v.energy)),meanStress:mean(outcomes.map(v=>v.stress)),meanInvestmentRoom:mean(outcomes.map(v=>v.investmentRoom)),
    hypothesis:`Independent sampled futures; ${continuation} reactive continuation; ${nextShop?'survival means reaching next shop and affording minimum repair':'fixed-depth survival may be censored before next shop'}. Not actual future / exhaustive survival probability.`};
  }
 };
}
