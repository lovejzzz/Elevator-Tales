import {E,R,type Rider} from './game.mts';
import {Names,applyLocal,applyPlan,previewWorld,features,observe,believed,clone,type World} from './runtime.mts';
import {score} from './policies.mts';
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
  shop:shop.map(({rule:_rule,...card})=>card)};
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
 if(s.reserveCell&&s.energy<s.energyCap)actions.push({type:'use-reserve'});
 const offers=mode==='novice'?w.offers.slice(0,2):w.offers;
 const limit=mode==='novice'?2:mode==='minimalist'?1:6;
 if(count<limit)for(const r of offers){if(s.cabin.some(p=>p?.id===r.id))continue;
  for(let i=0;i<6;i++)if(!s.cabin[i]){actions.push({type:'place',rider:names.id(r.id),slot:i});if(mode==='novice')break;}}
 if(mode!=='novice')s.cabin.forEach((r,i)=>{if(r&&r.boardedAt<s.floor){
  if(!s.swapped)for(let j=0;j<6;j++)if(i!==j&&!(j<i&&s.cabin[j]))actions.push({type:'place',rider:names.id(r.id),slot:j});
  if(s.coins>=E.dismissalCost(s,r))actions.push({type:'dismiss',rider:names.id(r.id)});
 }});
 return actions;
}
const key=(w:World)=>w.state.cabin.map(r=>r?.id??'-').join('|')+'/'+w.state.coins+'/'+w.state.swapped+'/'+w.state.energy+'/'+Boolean(w.state.reserveCell);
export function enumerate(base:World,names:Names,mode:PolicyName,seen:Set<string>,budgetOverride?:number){
 const budget=budgetOverride??({novice:18,minimalist:70,merchant:110,explorer:160,planner:180,opportunist:180,investor:180,operator:180}[mode]);
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
 const final=[...new Set([...all.slice(0,10),root,...(largest?[largest]:[]),...dismissalDiversity.values()])];
 const plans=final.filter(n=>n.w.state.cabin.some(Boolean)).map(n=>previewWorld(base,n.actions,names)!).filter(Boolean);
 return {plans,enumerated:count};
}

// Sample unknown copy assignments conditioned on the currently visible one;
// never carry the true copy seed into future imagined arrangements.
function beliefWorld(w:World,rng:()=>number):World {
 const b=believed(w,rng);
 const all=[...b.state.cabin,...b.offers].filter((r):r is Rider=>Boolean(r));
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
export function serviceFor(base:World,names:Names):PreviewService {
 // This seed is derived exclusively from redacted, currently visible data.
 const publicSeed=planningSeed(observe(base,names));
 return {
  preview:actions=>previewWorld(base,actions,names),
  candidates:(mode,seen)=>enumerate(base,names,mode,seen),
  imagine(actions,depth,samples,continuation='minimalist'):Rollout {
   const placed=applyPlan(base,actions,names);if(!placed)throw Error('Illegal imagined root plan');
   if(!Number.isInteger(depth)||depth<1||depth>5||!Number.isInteger(samples)||samples<1||samples>16)throw Error('Planning budget exceeded');
   const outcomes=[];
   for(let n=0;n<samples;n++){
    const rng=rngFor(publicSeed+n*1009);let w=beliefWorld(placed,rng),travelled=0,minRoom=w.state.stressCap-w.state.stress;
    const startCoins=w.state.coins;
    for(let t=0;t<depth;t++){
     if(w.state.status!=='playing'||!w.state.cabin.some(Boolean))break;
     const state=E.resolveFloor(clone(w.state),rng);travelled++;minRoom=Math.min(minRoom,state.stressCap-state.stress);
     w={state,offers:[]};
     if(state.status==='lost'||state.status==='upgrade')break;
     if(t+1<depth){
      w.offers=E.makeOffers(state.floor,state.upgrades,false,rng,state.cabin);
      const localNames=new Names();localNames.register(w);
      const next=enumerate(w,localNames,continuation,new Set(),24).plans.sort((a,b)=>score(b,continuation,new Set())-score(a,continuation,new Set()))[0];
      if(next)w=applyPlan(w,next.actions,localNames)!;
     }
    }
    const s=w.state,repair=Math.max(0,1-s.energy)*E.CHARGE_PRICE+Math.max(0,s.stress-s.stressCap+1)*E.SOOTHE_PRICE;
    const survived=s.status!=='lost'&&(s.status!=='upgrade'||s.coins>=repair);
    outcomes.push({survived,travelled,minRoom,net:s.coins-startCoins,energy:s.energy,stress:s.stress});
   }
   return {samples,depth,survivalFraction:mean(outcomes.map(v=>Number(v.survived))),minStressRoom:Math.min(...outcomes.map(v=>v.minRoom)),
    meanFloors:mean(outcomes.map(v=>v.travelled)),meanNetCash:mean(outcomes.map(v=>v.net)),meanEnergy:mean(outcomes.map(v=>v.energy)),meanStress:mean(outcomes.map(v=>v.stress)),
    hypothesis:`Independent sampled futures; ${continuation} reactive continuation; stop at next shop and test minimum repair affordability. Not actual future / exhaustive survival probability.`};
  }
 };
}
