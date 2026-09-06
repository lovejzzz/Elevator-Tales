import type {Preview,Observation,PolicyName,PreviewService,Decision,Action,ShopStyle,InvestmentSample} from './types.mts';
// No runtime/engine imports: decisions receive public observations and a bounded
// preview service. These are behavioral hypotheses, not calibrated humans.
export const POLICIES:PolicyName[]=['novice','merchant','explorer','minimalist','planner','opportunist','investor','operator','allocator','diverse'];
export function score(p:Preview,mode:PolicyName,seen:Set<string>):number {
 const f=p.features,o=p.observation;
 if(!f.occupied)return -1e8;
 const unsafe=!(p.safety.resourceSafe&&p.safety.bombSafe);
 const room=o.stressCap-o.stress;
 const stressAfter=o.stress+(o.forecast?.stress[1]??f.rise-Math.min(o.arrivalReliefCap,f.due));
 const danger=unsafe?1e6:0;
 if(mode==='operator'||mode==='allocator'||mode==='diverse'){
  // R836-01 behavioral hypothesis: bankroll has diminishing marginal value;
  // schedule groups matter, and high agitation is not itself a reason to flee.
  // No actual future offers, seeds or sealed rewards enter these terms.
  const refuel=Math.max(0,o.energyCap-o.energy)*o.prices.charge;
  const cashWeight=o.coins>refuel+60?1:o.coins>refuel?2:3;
  const groups=new Map<number,number>();
  for(const r of o.cabin)if(r)groups.set(r.remaining,(groups.get(r.remaining)??0)+1);
  const alignment=[...groups].reduce((n,[d,count])=>n+(count>=2?(o.installed.includes('relay')?8:1)/Math.max(1,d):0),0);
  return -danger+(f.flow+f.fareRate+f.stateValue+f.bankedPerStep*.5)*cashWeight
   -f.energyCost*3-f.spent*2+f.pendingRepair*1.5+alignment
   -Math.max(0,stressAfter-o.stressCap+2)*12-Math.max(0,f.committedEnergy-o.energy)*24;
 }
 if(mode==='novice'){
  // Limited card reading: immediate visible payout, warning avoidance, familiar
  // people; no seat optimization or dismissal. Hidden fare is not a known 24.
  const visible=o.cabin.reduce((n,r)=>n+(r?.currentPayout??0),0);
  return -danger+visible/Math.max(1,f.shortest)-f.energyCost*2-f.rise*12-f.hidden*5-f.newKinds.filter(k=>!seen.has(k)).length*2;
 }
 if(mode==='minimalist'){
  // An adversarial low-load baseline: lexicographic survival / pressure / load,
  // not a discounted merchant with a slightly different income coefficient.
  return -danger-f.rise*130-f.occupied*25+Math.min(8,f.shortest)*2-f.energyCost*3-f.spent;
 }
 if(mode==='merchant'){
  const carryingCost=f.energyCost*o.prices.charge+Math.max(0,stressAfter-o.stressCap+3)*o.prices.soothe;
  return -danger+(f.flow+f.fareRate+f.stateValue+f.bankedPerStep*.6)*4-carryingCost-f.spent+f.pendingRepair-Math.max(0,f.committedEnergy-o.energy)*8;
 }
 if(mode==='explorer'){
  const novelty=f.newKinds.filter(k=>!seen.has(k)).length;
  return -danger+(f.flow+f.fareRate+f.stateValue+f.bankedPerStep*.7)*2.4+f.green*2+novelty*6+f.pendingRepair-f.energyCost*2-f.spent*1.5-Math.max(0,stressAfter-o.stressCap+3)*10-Math.max(0,f.committedEnergy-o.energy)*6;
 }
 if(mode==='opportunist'){
  // An explicit stress-use hypothesis, not a win-rate calibrated human. Value
  // short bank windows and tolerate a useful high band; never ignore the exact
  // next-floor resource/bomb warning or the visible sector power commitment.
  const highValue=o.cabin.some(r=>r?.kind==='drunk');
  const target=highValue?5:3;
  return -danger+(f.flow+f.fareRate+f.stateValue)*3+f.bankedPerStep*3
   -f.energyCost*2-f.spent*2+f.pendingRepair
   -Math.max(0,stressAfter-target)*7-Math.max(0,f.committedEnergy-o.energy)*16;
 }
 return -danger+(f.flow+f.fareRate+f.stateValue+f.bankedPerStep*.4)*3-f.energyCost*2-f.rise*(room<=2?30:6)-f.spent*2+f.green*.5+f.pendingRepair
  -Math.max(0,f.committedEnergy-o.energy)*16;
}
export class Player {
 readonly seen=new Set<string>(); readonly successes=new Map<string,number>();
 readonly investmentHistory:InvestmentSample[]=[];
 investmentStudy:{key:string;gross:number;net:number;observations:number}[]=[];
 constructor(readonly mode:PolicyName,readonly shopStyle:ShopStyle='native'){}
 decide(o:Observation,service:PreviewService):Decision {
  const allocates=this.mode==='allocator'||this.mode==='diverse',operates=this.mode==='operator'||allocates;
  const known=[...this.seen],{plans,enumerated}=service.candidates(this.mode,this.seen);
  if(!plans.length)throw Error('No boarding plan available');
  let ranked=plans.map(p=>({p,value:score(p,this.mode,this.seen),rollout:null as ReturnType<PreviewService['imagine']>|null})).sort((a,b)=>b.value-a.value);
  if(['planner','opportunist','investor'].includes(this.mode)||operates){
   const economical=ranked.filter(c=>c.p.safety.resourceSafe&&c.p.safety.bombSafe).sort((a,b)=>a.p.features.energyCost-b.p.features.energyCost||a.p.features.rise-b.p.features.rise)[0];
   let finalists=[...new Set([...ranked.slice(0,3),...(economical?[economical]:[])])];
   if(this.mode==='diverse'){
    const offered=new Set(o.offers.map(r=>r.id)),representatives=new Map<number,typeof ranked[number]>();
    for(const c of ranked){const count=c.p.observation.cabin.filter(r=>r&&offered.has(r.id)).length;if(!representatives.has(count))representatives.set(count,c);}
    finalists=[...new Set([...representatives.values(),...ranked])].slice(0,4);
   }
   for(const c of finalists){
    c.rollout=operates?service.imagine(c.p.actions,5,4,'operator'):service.imagine(c.p.actions,3,2);
    // Research estimates, never a promise of safety or a use of real future RNG.
    c.value+=c.rollout.survivalFraction*180+c.rollout.meanFloors*15+c.rollout.meanNetCash*1.2
      +c.rollout.meanEnergy*(operates?2:.8)-c.rollout.meanStress*((this.mode==='opportunist'||operates)?1:5);
    if(allocates)c.value+=(c.rollout.meanInvestmentRoom??0)*1.2;
   }
   ranked=finalists.sort((a,b)=>Number(b.p.safety.resourceSafe&&b.p.safety.bombSafe)-Number(a.p.safety.resourceSafe&&a.p.safety.bombSafe)
    ||b.rollout!.survivalFraction-a.rollout!.survivalFraction||b.rollout!.meanFloors-a.rollout!.meanFloors||b.value-a.value);
  }
  const chosen=ranked[0];
  for(const r of [...(this.mode==='novice'?o.offers.slice(0,2):o.offers),...o.cabin])if(r)this.seen.add(r.kind);
  return {actions:chosen.p.actions,
   reason:this.mode==='novice'?'有限阅读：看前两张、优先可见收益与当前警告':this.mode==='minimalist'?'少载检验：优先控制持续压力和人数':
    this.mode==='diverse'?'接客数量多样性：同投资空间评分，四个推演名额优先覆盖不同的新上客人数':this.mode==='allocator'?'投资空间假设：沿用经营者，另重视想象中进店后支付已知承诺仍余下的投资资金；不预支真实未来':this.mode==='operator'?'经营者假设：同层送达、现金边际价值、五层四样本经营式反应；不读取真实未来':
    this.mode==='merchant'?'经营检验：收入与可见资源成本对比':this.mode==='explorer'?'探索检验：新人物、关系和收入并看':this.mode==='opportunist'?'窗口检验：主动寻找短期危险合作与高躁动收益，保留区间续航预算和三层推演':
    this.mode==='investor'?'投资检验：沿用规划检验的关门策略，商店先投资并保留基础续航，不自动清零躁动':
    '规划检验：对当前候选方案做独立随机、可反应的三层推演',
   alternatives:ranked.slice(0,4).map(c=>({actions:c.p.actions,score:c.value,safety:c.p.safety})),
   diagnostics:{enumerated,sampledSafePlans:plans.filter(p=>p.safety.resourceSafe&&p.safety.bombSafe).length,horizon:chosen.rollout,knowledge:known}};
 }
 feedback(before:Observation,after:Observation,sample?:InvestmentSample){
  for(const r of before.cabin)if(r&&!after.cabin.some(p=>p?.id===r.id))this.successes.set(r.kind,(this.successes.get(r.kind)??0)+1);
  if(sample){this.investmentHistory.push(structuredClone(sample));if(this.investmentHistory.length>20)this.investmentHistory.shift();}
 }
 shop(o:Observation,service?:Pick<PreviewService,'preview'>):{actions:Action[];reason:string}{
  if(this.mode==='allocator'||this.mode==='diverse'){
   const operator=new Player('operator',this.shopStyle);operator.investmentHistory.push(...this.investmentHistory);
   const decision=operator.shop(o,service);this.investmentStudy=operator.investmentStudy;return decision;
  }
  let coins=o.coins,energy=o.energy,stress=o.stress,energyCap=o.energyCap,cap=o.stressCap,bought=false;const actions:Action[]=[];
  // Public post-shop option budget, not a forecast of offers or a guarantee:
  // keep one known risky rider's removal affordable instead of spending the
  // last coin on power while an agitation/fuse crisis is visibly approaching.
  const optionCash=this.mode==='operator'?Math.max(0,...o.cabin.flatMap(r=>r&&
   ((o.stress>=o.stressCap-2&&(r.agitation>0||r.kind==='thief'))||(r.kind==='bomb'&&(r.fuse??0)<=2))
   ?[r.dismissalCost??0]:[])):0;
  const soothe=(units:number)=>{units=Math.max(0,stress-cap+1);if(units>0&&coins>=units*o.prices.soothe){actions.push({type:'soothe',units});coins-=units*o.prices.soothe;stress-=units;}};
  const charge=(target:number)=>{const units=Math.min(Math.max(0,Math.min(energyCap,target)-energy),Math.floor(coins/o.prices.charge));if(units>0){actions.push({type:'charge',units});coins-=units*o.prices.charge;energy+=units;}};
  const buy=(key:string)=>{const card=o.shop.find(c=>c.key===key);if(!card||card.price>coins||bought)return;
   actions.push({type:'buy',key});coins-=card.price;bought=true;energyCap+=card.effect.energyCap;cap+=card.effect.stressCap;energy+=card.effect.energy;stress+=card.effect.stress;};
  // Repair both crisis dimensions before discretionary spending. Purchasing
  // CALM can itself rescue a stress crisis and is considered first if offered.
  if(stress>=cap)buy('calm');
  soothe(Math.max(0,stress-cap+1));charge(1);
  this.investmentStudy=[];
  if(this.mode==='investor'||this.mode==='operator'||this.shopStyle==='committed'||this.shopStyle==='adaptive'){
   // R01 exposed a shop-order blind spot: charging to full first prevents early
   // permanent investments. This is a separate public-information hypothesis,
   // not a replay of R01's offers or proof of next-sector survival.
   const bankWindow=o.cabin.some(r=>r&&r.stash>0&&r.remaining<=2);
   soothe(Math.max(0,stress-Math.min(cap-2,bankWindow?6:5)));
   if((this.shopStyle!=='native'||this.mode==='operator')&&!service)throw Error('Committed shopping requires public previews, never a hidden-world fallback');
   const floorBudget=(o.nextShop-o.floor)*o.nextMotor+1;
   let order=['reinforced','concierge','tipjar','calm','battery','relay','crowd','capacity','express','meter'];
   if(this.shopStyle==='adaptive'||this.mode==='operator'){
    const history=this.investmentHistory,steps=history.length;
    const arrivals=history.reduce((n,x)=>n+x.arrivals,0),averageRide=arrivals?history.reduce((n,x)=>n+x.rideSum,0)/arrivals:0;
    const prefix=service!.preview(actions)?.features.committedEnergy??0;
    this.investmentStudy=o.shop.map(card=>{
     // Thirty future ascents is a declared research horizon, not known survival.
     // New-rider-only abilities lose the observed average travel-time lag.
     const horizon=['concierge','express'].includes(card.key)?Math.max(0,30-averageRide):30;
     let gross=steps?history.reduce((n,x)=>n+(x.gross[card.key]??0),0)/steps*horizon:0;
     // Capacity has no income; value it only when it uniquely lets the current
     // public commitment fit. Other long-term capacity uses remain unmodelled.
     if(card.key==='capacity')gross=prefix+2>energyCap&&prefix+2<=energyCap+card.effect.energyCap?card.price+(prefix+2-energyCap)*o.prices.charge:0;
     // More room can be useful BEFORE current commitments require it. Only
     // value this buffer if later motor costs are public and it can be filled.
     if(this.mode==='operator'&&card.key==='capacity'&&o.nextMotor>=3&&
       energy+Math.floor((coins-card.price)/o.prices.charge)>=energyCap+8)
      gross=Math.max(gross,card.price+card.effect.energyCap*o.prices.charge);
     if(card.key==='calm')gross=Math.max(0,-card.effect.stress)*o.prices.soothe+(steps?history.filter(x=>x.nearLimit).length/steps*20*o.prices.soothe:0);
     return {key:card.key,gross,net:gross-card.price,observations:steps};
    });
    order=[...this.investmentStudy].filter(x=>x.net>0).sort((a,b)=>b.net-a.net||a.key.localeCompare(b.key)).map(x=>x.key);
   }
   const desired=order.find(key=>{
    const card=o.shop.find(c=>c.key===key);if(!card||card.price>coins)return false;
    const available=Math.min(energyCap+card.effect.energyCap,energy+card.effect.energy+Math.floor(Math.max(0,coins-card.price-optionCash)/o.prices.charge));
    if(this.shopStyle==='native'&&this.mode!=='operator')return available>=floorBudget;
    const preview=service!.preview([...actions,{type:'buy',key}]);
    // Existing riders + one baseline rider once empty, scheduled departures,
    // actual upgrade savings and existing reserve. No predicted future offers
    // or guaranteed chance recharge; two power is a declared research buffer.
    return preview!==null&&available>=preview.features.committedEnergy+2;
   });
   if(desired)buy(desired);
   charge(Math.min(energyCap,energy+Math.floor(Math.max(0,coins-optionCash)/o.prices.charge)));
   if(!o.reserveCell&&coins-optionCash>=o.prices.reserve&&energy>=Math.min(energyCap,50))actions.push({type:'buy-reserve'});
   actions.push({type:'leave'});
   return {actions,reason:this.mode==='operator'?'经营者购物假设：依公开历史估算30层回报，保留当前乘客前缀预算+2电；31层起也考虑可付得起的扩容续航缓冲。概率收益不能支付当前用电，不是未来保证。':this.shopStyle==='adaptive'?'基于最近最多20次实际上行的公开触发机会，估算未来30次回报减价格；新客能力扣除旅程延迟。扩容另看当前路程是否必须扩容才能容纳；舒缓另看近险频率。只买正估值且保留当前乘客前缀预算+2电的能力，否则留钱。概率收益不用于支付当前用电；不是最优购物或未来保证。':this.shopStyle==='committed'?'有承诺预算的投资：购后支付当前乘客至商店的前缀用电预算，另留2电；空车后假设一位基础乘客，不预支未知候客或概率回电。余款充电；这不是整段安全保证。':'先处理失控，再按公开价格投资；至少留运转基线+1电的购买能力，余款充电。人物耗电仍有风险，不是续航保证。'};
  }
  const keep=['explorer','merchant','opportunist'].includes(this.mode)? (o.cabin.some(r=>r?.kind==='drunk')?5: o.cabin.some(r=>r?.kind==='tourist')?3:0):0;
  if(this.mode==='novice'){charge(50);soothe(Math.max(0,stress-1));}
  else {soothe(Math.max(0,stress-keep));charge(this.mode==='minimalist'?50:energyCap);}
  const orders:Record<PolicyName,string[]>={
   novice:['reinforced','calm','express','concierge'],
   merchant:['concierge','crowd','tipjar','battery','meter','reinforced','express','calm','capacity','relay'],
   explorer:['calm','reinforced','relay','tipjar','crowd','battery','express','capacity','concierge','meter'],
   minimalist:['capacity','calm','express'],
   planner:['reinforced','calm','express','concierge','capacity','crowd','tipjar','relay','battery','meter'],
   opportunist:['calm','relay','battery','reinforced','express','tipjar','capacity','concierge','crowd','meter'],
   investor:[], // Handled above; never falls through to charge-first shopping.
   operator:[],allocator:[],diverse:[],
  };
  const desired=orders[this.mode].find(k=>o.shop.some(c=>c.key===k&&c.price<=coins));
  if(desired)buy(desired);
  if(bought&&energyCap>o.energyCap)charge(energyCap);
  if(this.mode!=='novice'&&!o.reserveCell&&coins>=o.prices.reserve&&energy>=Math.min(energyCap,50)){
   actions.push({type:'buy-reserve'});coins-=o.prices.reserve;
  }
  actions.push({type:'leave'});
  return {actions,reason:'按玩家偏好留资源/投资；只购买本店未安装且付得起的能力'};
 }
}
