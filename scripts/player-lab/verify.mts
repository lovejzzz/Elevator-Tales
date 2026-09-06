import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {E,F,B,S,R,D,I,P,GAME_ROOT,type Rider,type RunState} from './game.mts';
import {configureScenario,scenarioRecord} from './scenarios.mts';
import {Session,Names,observe,previewWorld,applyPlan,clone,replay,features} from './runtime.mts';
import {serviceFor,enumerate,planningSeed,shopInvestmentRoom} from './search.mts';
import {Player,score} from './policies.mts';
import {flagBlock} from './analytics.mts';
import {runOne} from './run.mts';
import * as fixtures from './fixtures.mts';
import {hash,rngFor,quantile} from './util.mts';
import {checkVisibleUI} from './ui-audit.mts';
import {diverseQueue} from './review-queue.mts';
import {investmentSample} from './investment-study.mts';

export function verify(){
 const checks:string[]=[];
 const test=(name:string,fn:()=>void)=>{fn();checks.push(name);};
 test('allocator values shop investment room without changing shopping safety or public-only planning',()=>{
  const a=fixtures.sealed();Object.assign(a.state,{floor:10,status:'upgrade',energy:20,coins:90,stress:0,cabin:Array(6).fill(null),upgrades:{...E.EMPTY_UPGRADES}});a.offers=[];
  a.state.cabin[0]=fixtures.rider('commuter','a',10,2);
  const b=clone(a);for(let i=0;i<4;i++)b.state.cabin[i]=fixtures.rider('commuter',String(i),10,6);
  const before=hash(a);assert(shopInvestmentRoom(a)>shopInvestmentRoom(b));assert.equal(hash(a),before);
  const full=clone(a);for(const k of ['battery','meter','relay','reinforced'] as const)full.state.upgrades[k]=1;
  assert.equal(shopInvestmentRoom(full),0);
  const n=new Names(),o=observe(a,n),operator=new Player('operator','committed'),allocator=new Player('allocator','committed');
  assert.deepEqual(allocator.shop(o,serviceFor(a,n)),operator.shop(o,serviceFor(a,n)));
  const w=fixtures.sealed(),names=new Names();const publicBefore=hash(w),service=serviceFor(w,names);
  const first=service.imagine([],3,2,'operator');assert.deepEqual(first,service.imagine([],3,2,'operator'));assert.equal(hash(w),publicBefore);
  assert.equal(first.meanInvestmentRoom,0,'No reached shop, no investment-room reward');
 });
 test('investment history does not double-count Steady and capped Ghost savings',()=>{
  const w=fixtures.sealed();Object.assign(w.state,{floor:31,cabin:Array(6).fill(null),upgrades:{...E.EMPTY_UPGRADES}});
  w.state.cabin[0]=fixtures.rider('ghost','g',31,4);w.state.cabin[1]=fixtures.rider('exorcist','e',31,4);w.state.cabin[3]=fixtures.rider('ghost','h',31,4);
  // Move the second Ghost beside the same provider; only1 passenger power exists.
  w.state.cabin[2]=w.state.cabin[3];w.state.cabin[3]=null;
  assert.equal(E.stabilizedEnergy({...w.state,upgrades:{...w.state.upgrades,reinforced:1}}),1);
  assert.equal(investmentSample(w,{...w,state:{...w.state,floor:32}}).gross.reinforced,0);
  w.state.cabin[2]=fixtures.rider('commuter','c',31,4);
  assert.equal(investmentSample(w,{...w,state:{...w.state,floor:32}}).gross.reinforced,2);
 });
 test('cooperation access probe changes only marginal upgrade income and its price',()=>{
  const base=configureScenario('baseline');const s=E.initialRun();
  try{
   const probe=configureScenario('cooperation-access');assert.deepEqual({...probe,name:base.name,economy:base.economy,upgradePrices:base.upgradePrices},base);
   assert.equal(E.cooperationBonus(s),1);assert.equal(E.cooperationBonus({...s,upgrades:{...s.upgrades,battery:1}}),2);
   assert.equal(E.UPGRADE_BASE_PRICES.battery,20);assert.match(D.UPGRADES.battery.description,/额外 \+1/);
  }finally{configureScenario('baseline');}
  assert.equal(E.cooperationBonus({...s,upgrades:{...s.upgrades,battery:1}}),3);assert.equal(E.UPGRADE_BASE_PRICES.battery,30);
  assert.match(D.UPGRADES.battery.description,/额外 \+2/);
 });
 test('late motor probe preserves pre71 rules and defaults, with fixed announced cap8',()=>{
  const base=configureScenario('baseline'),costs=Array.from({length:120},(_,n)=>B.motorCost(n+1));
  try{
   const treatment=configureScenario('v836-late-motor');
   assert.deepEqual({...treatment,name:base.name,motor:base.motor},base);
   for(let floor=1;floor<=120;floor++)assert.equal(B.motorCost(floor),floor<71?costs[floor-1]:floor<91?7:8);
   assert.deepEqual(B.nextMotorChange(69),{from:71,power:7});assert.deepEqual(B.nextMotorChange(89),{from:91,power:8});assert.equal(B.nextMotorChange(91),null);
   assert.match(B.motorScheduleText(),/71–90层7电/);assert.match(B.motorScheduleText(),/91层起8电封顶/);
  }finally{configureScenario('baseline');}
  assert.equal(B.MOTOR_RULES.lateSteps,false);assert.equal(B.motorCost(120),6);
 });
 test('continuation fixtures clone their initial world, preserve opening cash and replay every step',()=>{
  const w=fixtures.sealed();Object.assign(w.state,{floor:61,energy:60,coins:60,stress:0,status:'playing',cabin:Array(6).fill(null)});w.offers=[];
  w.state.cabin[0]=fixtures.rider('commuter','fixture-rider',61,3);
  const session=new Session(193843117,false,w),start=hash(session.world());w.state.coins=999;
  assert.equal(session.observation().coins,60);session.act({type:'depart'});
  const record=session.replayRecord();assert.equal(hash(record.initialWorld),start);assert.equal(hash(replay(record).world()),hash(session.world()));
  const normal=new Session(19).replayRecord();assert(!Object.hasOwn(normal,'initialWorld'));
  const result=runOne('minimalist',193843117,62,false,'committed',record.initialWorld);
  assert.equal(60+result.summary.income-result.summary.spend,result.summary.final.coins);
 });
 test('minimum local trip experiment retains RNG, roles and risks and restores the default',()=>{
  let shortened=0;
  for(const floor of [30,31,40,51,61])for(let seed=1;seed<=100;seed++){
   configureScenario('v836-local-investment');const aRng=rngFor(seed),a=E.makeOffers(floor,{...E.EMPTY_UPGRADES},false,aRng,Array(6).fill(null));
   configureScenario('v836-local-minimum');const bRng=rngFor(seed),b=E.makeOffers(floor,{...E.EMPTY_UPGRADES},false,bRng,Array(6).fill(null));
   assert.equal(aRng(),bRng());assert.equal(a.length,b.length);
   a.forEach((r,i)=>{const delta=r.destination-b[i].destination;assert(delta===0||delta===1);shortened+=delta;
    if(floor<31||Number(r.id.split('-')[1])!==floor%3)assert.equal(delta,0);
    else assert.equal(b[i].destination-floor,D.PASSENGERS[r.kind].trip[0]);
    assert.deepEqual({...b[i],destination:r.destination},r);
   });
  }
  assert(shortened>0);configureScenario('baseline');assert.equal(B.JOURNEY_RULES.localExtra,0);
 });
 test('operator preserves a visible post-shop dismissal option instead of buying surplus power',()=>{
  const w=fixtures.sealed();Object.assign(w.state,{floor:50,status:'upgrade',energy:4,coins:108,stress:6,cabin:Array(6).fill(null),shop:[]});w.offers=[];
  w.state.cabin[0]=fixtures.rider('drunk','risk',50,2,true);
  const n=new Names(),o=observe(w,n),decision=new Player('operator','committed').shop(o,serviceFor(w,n));
  const next=applyPlan(w,decision.actions.slice(0,-1),n);assert(next);assert(next.state.coins>=o.cabin[0]!.dismissalCost!);
  const left=E.leaveShop(next.state);assert.equal(left.status,'playing');const removed=E.dismissRider(left,'risk');assert.notEqual(removed,left);assert.equal(removed.cabin[0],null);
 });
 test('operator values an affordable late capacity buffer before commitments require it',()=>{
  const w=fixtures.sealed();Object.assign(w.state,{floor:30,status:'upgrade',energy:20,coins:200,stress:0,cabin:Array(6).fill(null)});w.offers=[];
  w.state.shop=['capacity','calm'].map(key=>({key:key as 'capacity'|'calm',price:E.upgradePrice(key as 'capacity'|'calm',30,0),purchased:false}));
  const n=new Names(),o=observe(w,n),p=new Player('operator','committed'),before=hash(w);
  const decision=p.shop(o,serviceFor(w,n));assert(decision.actions.some(a=>a.type==='buy'&&a.key==='capacity'));
  assert.equal(decision.actions.at(-1)?.type,'leave');
  const next=applyPlan(w,decision.actions.slice(0,-1),n);assert(next);assert.equal(next.state.energyCap,70);assert.equal(next.state.energy,70);
  assert.equal(E.leaveShop(next.state).status,'playing');assert.equal(hash(w),before);
 });
 test('operator arrival alignment is a valuation signal not guaranteed recharge',()=>{
  const w=fixtures.sixSeats();w.state.upgrades.relay=1;const n=new Names();n.register(w);const p=previewWorld(w,[],n)!;
  const dispersed=clone(p);dispersed.observation.cabin.forEach((r,i)=>{if(r)r.remaining=i+1;});
  assert(score(p,'operator',new Set())>score(dispersed,'operator',new Set()));
  assert.deepEqual(p.safety,dispersed.safety);assert.equal(p.features.committedEnergy,dispersed.features.committedEnergy);
 });
 test('operator five-floor four-sample continuation hides sealed fares and preserves actual world',()=>{
  const a=fixtures.sealed(),b=clone(a);b.state.cabin[0]!.traits!.fare=8;
  const na=new Names(),nb=new Names();na.register(a);nb.register(b);const before=hash(a);
  const pa=new Player('operator','committed').decide(observe(a,na),serviceFor(a,na));
  const pb=new Player('operator','committed').decide(observe(b,nb),serviceFor(b,nb));
  assert.deepEqual(pa,pb);assert.equal(pa.diagnostics.horizon?.depth,5);assert.equal(pa.diagnostics.horizon?.samples,4);
  assert.match(pa.diagnostics.horizon!.hypothesis,/operator reactive/);assert.equal(hash(a),before);
 });
 test('R05 fixed-offer commitment window retains active and deferred-income alternatives',()=>{
  // Retrospective public-state fixture, not a seeded replay, optimal policy or win-rate sample.
  const play=(active:boolean,hit:boolean)=>{
   const make=(kind:Rider['kind'],floor:number,remaining:number,volatile=false):Rider=>({
    ...fixtures.rider(kind,`${kind}-${floor}`,floor,remaining,volatile,false),fareBonus:2,
   });
   let s:RunState={...E.initialRun(),floor:53,energy:39,stress:4,coins:22,reserveCell:true,
    upgrades:{...E.EMPTY_UPGRADES,relay:1,concierge:1},cabin:[
     {...make('child',53,4),boardedAt:52,careProgress:1},
     {...make('nurse',53,4),boardedAt:50},
     {...make('mimic',53,2,true),boardedAt:52},null,null,null]};
   const place=(r:Rider,slot:number)=>{
    const p=I.planPlacement(s,r,slot);assert(p.ok&&p.changed,p.label);s=p.next;
   };
   let opportunities=0,reserves=0;
   const boarded:number[]=[];
   const board=(kind:Rider['kind'],remaining:number,slot:number,volatile=false)=>{
    assert.equal(s.cabin[slot],null);place(make(kind,s.floor,remaining,volatile),slot);boarded.push(s.floor);
   };
   while(s.floor<60){
    assert.equal(s.status,'playing');
    if(active){
     if(s.floor===54)board('courier',3,5);
     if(s.floor===55){place(s.cabin[0]!,3);board('coach',3,4);}
     if(s.floor===57)board('musician',3,2);
    }else{
     if(s.floor===53)board('celebrity',6,4,true);
     if(s.floor===59)board('celebrity',4,1,true);
    }
    s.cabin.forEach((r,slot)=>{if(r?.kind==='mimic')assert.equal(R.riderProfile(r,s.cabin,slot).copies.length,0);});
    if(s.reserveCell&&s.energy+F.energyForecast(s).lowDelta<=0){s=E.consumeReserveCell(s);reserves++;}
    const arrivals=s.cabin.flatMap((r,slot)=>r&&r.destination<=s.floor+1?[slot]:[]);
    if(S.shopOpportunities(s,s.cabin,arrivals).relay)opportunities++;
    s=E.resolveFloor(s,()=>hit?.01:.99);
   }
   assert.equal(opportunities,1);assert.equal(reserves,1);assert.equal(s.status,'upgrade');
   assert.equal(s.energy,hit?4:0);assert.equal(s.coins,active?92:88);assert.equal(s.stress,active?2:3);
   assert.deepEqual(boarded,active?[54,55,57]:[53,59]);
   const unpaid=s.cabin.flatMap(r=>r?[r]:[]);
   if(active)assert.equal(unpaid.length,0);
   else{
    assert.equal(unpaid.length,1);assert.equal(unpaid[0].kind,'celebrity');
    assert.equal(unpaid[0].destination-s.floor,3);
    assert.equal(P.passengerBrief(unpaid[0],s.floor,s.cabin,1,0,1,s.stress).expectedFare,18);
   }
   const charged=E.chargeBattery(s,E.affordableChargingPlan(s).units);
   assert.equal(charged.energy,(active?46:44)+(hit?4:0));assert.equal(charged.coins,0);
  };
  for(const active of [false,true])for(const hit of [false,true])play(active,hit);
 });
 test('encounter discovery preserves early packets, unlocks, parameters and restores its partner table',()=>{
  const before=scenarioRecord(),catalog=hash(D.PASSENGERS);
  const early=Array.from({length:15},(_,i)=>E.makeOffers(i+1,E.EMPTY_UPGRADES,false,rngFor(8329900+i),[]));
  try{
   const changed=configureScenario('encounter-discovery');
   assert(changed.encounterPartners.tourist.includes('musician'));
   assert(changed.encounterPartners.tourist.includes('mimic'));
   assert(changed.encounterPartners.coach.includes('mystery'));
   assert.deepEqual(Array.from({length:15},(_,i)=>E.makeOffers(i+1,E.EMPTY_UPGRADES,false,rngFor(8329900+i),[])),early);
   assert.equal(hash(D.PASSENGERS),catalog);
   for(let floor=1;floor<=60;floor++)for(let sample=0;sample<10;sample++){
    const offers=E.makeOffers(floor,E.EMPTY_UPGRADES,false,rngFor(floor*100+sample));
    assert.equal(offers.length,3);
    assert(offers.some(r=>!r.volatile));
    assert(offers.every(r=>E.unlockedAt(floor).includes(r.kind)));
   }
  }finally{configureScenario('baseline');}
  assert.deepEqual(scenarioRecord(),before);
  try{
   const old=configureScenario('encounter-legacy');
   assert.deepEqual(old.encounterPartners.tourist,['commuter','celebrity','tourist']);
   assert.deepEqual(old.encounterPartners.coach,['commuter','courier']);
  }finally{configureScenario('baseline');}
  assert.deepEqual(scenarioRecord(),before);
 });
 test('high-risk Mechanic has timing, care and premium windows without spending agitation',()=>{
  const play=(stress:number,volatile:boolean,support:'nurse'|'drunk'|null,steps:number)=>{
   let s={...E.initialRun(),floor:31,energy:60,stress};
   s.cabin[0]=fixtures.rider('mechanic','focus',31,3,volatile,false);
   if(support)s.cabin[1]=fixtures.rider(support,'support',31,support==='drunk'?2:3,false,false);
   for(let i=0;i<steps;i++)s=E.resolveFloor(s,()=>.99);
   return s;
  };
  for(const stress of [0,1])assert(play(stress,true,null,2).cabin[0]?.repairDone);
  assert(!play(2,true,null,2).cabin[0]?.repairDone);
  assert(play(2,false,null,2).cabin[0]?.repairDone);
  assert(play(2,true,'nurse',2).cabin[0]?.repairDone);
  const normal=play(3,false,'drunk',3),risk=play(3,true,'drunk',3);
  assert.equal(normal.coins,16);assert.equal(risk.coins,30);
  assert.equal(normal.energy,risk.energy);
  assert.equal(normal.status,'playing');assert.equal(risk.status,'playing');
  assert.equal(play(7,true,null,1).status,'lost');
  assert.equal(play(7,false,null,1).status,'playing');
 });
 test('upper-zone motor experiment is fixed, capped, forecast-consistent and leaves prices and early game unchanged',()=>{
  const before=scenarioRecord(),early=Array.from({length:40},(_,i)=>E.travelEnergyCost(i+1));
  const prices=Object.keys(D.UPGRADES).map(k=>E.upgradePrice(k as keyof typeof D.UPGRADES,10,0));
  try{
   configureScenario('motor-upper');
   assert.deepEqual(Array.from({length:40},(_,i)=>E.travelEnergyCost(i+1)),early);
   for(const [floor,power] of [[40,3],[41,4],[50,4],[51,5],[60,5],[61,6],[10000,6]]){
    assert.equal(E.travelEnergyCost(floor),power);
    const w=fixtures.sealed();w.state.floor=floor-1;w.state.stress=0;w.state.cabin=[fixtures.rider('commuter','c',floor-1,3),null,null,null,null,null];
    const prediction=F.energyForecast(w.state),next=E.resolveFloor(clone(w.state),()=>.99);
    assert.equal(next.energy-w.state.energy,prediction.lowDelta);
    assert.equal(next.energy-w.state.energy,prediction.highDelta);
    assert.equal(E.travelEnergyCost(floor),power,'Resource changes cannot change the schedule');
   }
   assert.deepEqual(Object.keys(D.UPGRADES).map(k=>E.upgradePrice(k as keyof typeof D.UPGRADES,10000,0)),prices);
   const late=fixtures.sealed();late.state.floor=99;late.state.cabin=[fixtures.rider('ghost','g',99,1),null,null,null,null,null];
   assert.equal(E.resolveFloor(late.state,()=>.99).status,'upgrade','No forced terminal floor');
  }finally{configureScenario('baseline');}
  assert.deepEqual(scenarioRecord(),before);
 });
 test('historical shop opportunities match actual shared reward eligibility and hide sealed fares',()=>{
  const w=fixtures.sixSeats();w.offers=[];
  w.state.floor=20;w.state.cabin=w.state.cabin.map(r=>r?{...r,boardedAt:16,destination:21}:null);
  const after={state:E.resolveFloor(clone(w.state),()=>.99),offers:[]};
  const sample=investmentSample(w,after);
  assert.equal(sample.arrivals,3);assert.equal(sample.gross.reinforced,2);
  assert.equal(sample.gross.relay,4);assert.equal(sample.gross.meter,12);
  assert.equal(sample.gross.concierge,6);assert.equal(sample.gross.crowd,0);
  const installed=clone(w);installed.state.upgrades.meter=1;
  assert.equal(E.resolveFloor(installed.state,()=>.99).coins-after.state.coins,sample.gross.meter);
  const a=fixtures.sealed(),b=clone(a);b.state.cabin[0]!.traits!.fare=8;
  const afterA={state:E.resolveFloor(clone(a.state),()=>.99),offers:[]};
  const afterB={state:E.resolveFloor(clone(b.state),()=>.99),offers:[]};
  assert.deepEqual(investmentSample(a,afterA),investmentSample(b,afterB));
 });
 test('adaptive shopping changes choice with observed opportunities, can abstain, and keeps obligation guard',()=>{
  const w=fixtures.sealed();w.state.floor=20;w.state.status='upgrade';w.state.coins=150;w.state.energy=50;w.state.stress=0;w.state.cabin=Array(6).fill(null);
  w.state.shop=['battery','relay','meter'].map(key=>({key:key as 'battery'|'relay'|'meter',price:E.upgradePrice(key as 'battery'|'relay'|'meter',20,0),purchased:false}));
  const n=new Names(),o=observe(w,n),service=serviceFor(w,n);
  for(const key of ['battery','relay','meter']){
   const player=new Player('planner','adaptive');
   for(let i=0;i<10;i++)player.feedback(o,o,{floor:i+1,arrivals:1,rideSum:5,nearLimit:false,gross:{[key]:4}});
   const actions=player.shop(o,service).actions;
   assert.equal(actions.find(a=>a.type==='buy')?.key,key);
   const actual=applyPlan(w,actions.filter(a=>a.type!=='leave'),n)!;
   assert.equal(actual.state.upgrades[key as 'battery'|'relay'|'meter'],1);
  }
  assert(!new Player('planner','adaptive').shop(o,service).actions.some(a=>a.type==='buy'));
  w.state.energy=1;w.state.coins=30;
  w.state.cabin=Array.from({length:6},(_,i)=>fixtures.rider('tourist','cost'+i,20,7));
  const poor=observe(w,n),player=new Player('planner','adaptive');
  player.feedback(poor,poor,{floor:19,arrivals:6,rideSum:30,nearLimit:false,gross:{battery:100,relay:100,meter:100}});
  assert(!player.shop(poor,serviceFor(w,n)).actions.some(a=>a.type==='buy'),'Expected chance income must not finance the current commitment');
  assert.throws(()=>player.shop(poor),/public previews/);
 });
 test('planning randomness ignores prose and release labels but retains public mechanics',()=>{
  const w=fixtures.sixSeats(),n=new Names(),o=observe(w,n),changed=clone(o);
  changed.version='copy-only-release';
  for(const r of [...changed.cabin,...changed.offers])if(r){r.name='translated name';r.rule='translated explanation';}
  for(const card of changed.shop)card.rule='translated shop';
  changed.receipt.coinSources=[{label:'translated ledger',amount:999}];
  assert.equal(planningSeed(o),planningSeed(changed));
  changed.energy-=1;assert.notEqual(planningSeed(o),planningSeed(changed));
  changed.energy=o.energy;changed.cabin.find(r=>r)!.currentPayout=123;
  assert.notEqual(planningSeed(o),planningSeed(changed));
  const original=Object.entries(D.PASSENGERS).map(([kind,p])=>({kind,name:p.name,detail:p.detail}));
  const before=serviceFor(w,n).imagine([],3,2);
  const decision=new Player('planner').decide(o,serviceFor(w,n));
  try{
   for(const p of Object.values(D.PASSENGERS)){p.name='translated name';p.detail='copy-only text';}
   const after=observe(w,n);assert.notDeepEqual(after,o);
   assert.deepEqual(serviceFor(w,n).imagine([],3,2),before);
   assert.deepEqual(new Player('planner').decide(after,serviceFor(w,n)),decision);
  }finally{
   for(const p of original)Object.assign(D.PASSENGERS[p.kind as keyof typeof D.PASSENGERS],{name:p.name,detail:p.detail});
  }
 });
 test('medium Concierge experiment gates new-rider tips on departure band, outside multipliers and without spending agitation',()=>{
  const before=scenarioRecord();
  try{
   configureScenario('concierge-middle');
   const r={...fixtures.rider('tourist','t',31,1),fareBonus:3};
   for(const agitation of [0,1,2,3,4,5,6,7]){
    const s={...E.initialRun(),floor:31,stress:agitation,cabin:[r,null,null,null,null,null]};
    const next=E.resolveFloor(s,()=>.99);
    assert.equal(next.coins,agitation===3||agitation===4?14:8);
    assert.equal(next.stress,Math.max(0,agitation-1));
    assert.equal(E.arrivalTip(r,agitation),agitation===3||agitation===4?3:0);
   }
   const coached=[r,fixtures.rider('coach','c',31,2),null,null,null,null];
   assert.equal(E.arrivalFare(r,coached,0,1,3)-E.arrivalFare({...r,fareBonus:0},coached,0,1,3),3);
   const offers=E.makeOffers(31,{...E.EMPTY_UPGRADES,concierge:1},false,rngFor(55));
   assert(offers.every(r=>r.fareBonus===3));
   assert.equal(E.arrivalTip({...r,fareBonus:0},3),0,'existing riders do not retroactively get tips');
  }finally{configureScenario('baseline');}
  assert.deepEqual(scenarioRecord(),before);
 });
 test('role-frontier experiments change only Commuter trip or Bomb base, retain risky bank and restore defaults',()=>{
  const before=scenarioRecord();
  try {
   configureScenario('commuter-short');
   assert.deepEqual(D.PASSENGERS.commuter.trip,[2,3]);
   let seen=0;
   for(let seed=0;seed<30;seed++)for(const express of [0,1]){
    const offers=E.makeOffers(31,{...E.EMPTY_UPGRADES,express},false,rngFor(100+seed));
    for(const r of offers)if(r.kind==='commuter'){seen++;assert(r.destination-31>=2&&r.destination-31<=3);}
   }
   assert(seen>0);
   configureScenario('bomb-fourteen');
   assert.deepEqual(D.PASSENGERS.commuter.trip,before.baselineTrips.commuter);
   const bomb=fixtures.rider('bomb','b',31,1);bomb.stash=6;
   const cabin=[bomb,fixtures.rider('thief','t',31,1),null,null,null,null];
   const s={...E.initialRun(),floor:31,stress:5,cabin};
   assert.equal(E.arrivalFare(bomb,cabin,0,1,5),20,'base14 + retained6');
   const next=E.resolveFloor(s,()=>.99);
   assert.equal(next.lastEarnings.sources.find(x=>x.label==='坏人暂存兑现')?.amount,12,'old6 + two members each high-bank3');
   configureScenario('commuter-short-bomb-fourteen');
   assert.deepEqual(D.PASSENGERS.commuter.trip,[2,3]);assert.equal(D.PASSENGERS.bomb.fare,14);
  }finally{configureScenario('baseline');}
  assert.deepEqual(scenarioRecord(),before);
 });
 test('ghost provider experiment retains every controlled fare but caps power by participating Exorcists',()=>{
  const before=scenarioRecord();
  const s={...E.initialRun(),cabin:[fixtures.rider('ghost','g1',1,3),fixtures.rider('exorcist','e1',1,3),fixtures.rider('ghost','g2',1,3),fixtures.rider('tourist','t1',1,3),null,fixtures.rider('tourist','t2',1,3)]};
  try{
   configureScenario('ghost-provider-cap');
   assert.equal(E.energySavings(s),1);
   for(const slot of [0,2])assert.equal(E.arrivalFare(s.cabin[slot]!,s.cabin,slot),7);
   s.cabin[3]=fixtures.rider('exorcist','e2',1,3);assert.equal(E.energySavings(s),2);
  }finally{configureScenario('baseline');}
  assert.deepEqual(scenarioRecord(),before);
 });
 test('journey experiment changes visible destinations only after its fixed zone boundaries',()=>{
  const before=scenarioRecord();
  try{
   for(const floor of [1,30,31,50,51,100]){
    configureScenario('v835-baseline');
    const ordinary=E.makeOffers(floor,E.EMPTY_UPGRADES,false,rngFor(942+floor));
    configureScenario('journey-two');
    const changed=E.makeOffers(floor,E.EMPTY_UPGRADES,false,rngFor(942+floor));
    changed.forEach((r,i)=>{assert.equal(r.destination,ordinary[i].destination+(floor>=51?2:floor>=31?1:0));assert.deepEqual({...r,destination:0},{...ordinary[i],destination:0});});
   }
  }finally{configureScenario('baseline');}
  assert.deepEqual(scenarioRecord(),before);
 });
 test('fare experiments isolate base multipliers and Coach attendance without changing other rewards',()=>{
  const before=scenarioRecord();
  const coach=fixtures.rider('coach','c',31,3);
  const lover=fixtures.rider('lover','l',31,3);
  const cabin=[lover,coach,null,fixtures.rider('lover','l2',31,3),null,null];
  try{
   configureScenario('legacy-fare');
   const original=E.arrivalFare(lover,cabin,0);
   configureScenario('base-only-multipliers');
   assert.equal(E.arrivalFare(lover,cabin,0),original-1);
   const thief=fixtures.rider('thief','t',31,3);
   const controlled=[thief,coach,null,fixtures.rider('cop','p',31,3),null,null];
   assert.equal(E.arrivalFare(thief,controlled,0),14,'base5 + Coach3 + control5 + bond1');
   configureScenario('coach-self-one');
   assert.equal(E.arrivalFare(coach,[coach,lover,null,null,null,null],0),9);
  }finally{configureScenario('baseline');}
  assert.deepEqual(scenarioRecord(),before);
 });
 test('experimental music moves toward but never across the middle band and restores baseline',()=>{
  const before=scenarioRecord();
  const s={...E.initialRun(),cabin:[fixtures.rider('musician','m',1,5),null,null,null,null,null]};
  try {
   configureScenario('music-two-step');
   for(const [stress,delta] of [[0,2],[1,2],[2,1],[3,0],[4,0],[5,-1],[6,-2],[7,-2]]){
    const current={...s,stress};
    assert.equal(E.musicAgitation(current),delta);
    assert.equal(E.resolveFloor(current,()=>.99).stress,stress+delta);
   }
  }finally{configureScenario('baseline');}
  assert.deepEqual(scenarioRecord(),before);
 });
 test('Inspector relationship experiments restore legacy costs without changing the candidate baseline',()=>{
  const before=structuredClone(R.BONDS);
  const effects=structuredClone(R.CONFLICT_EFFECTS);
  const inspector=fixtures.rider('inspector','i',30,5);
  try {
   configureScenario('inspector-legacy-relations');
   for(const kind of ['tourist','lover','musician','nurse'] as const)assert.equal(R.conflictEffectBetween(inspector,fixtures.rider(kind,kind,30,3)),kind==='lover'?'agitation':'coins');
   configureScenario('inspector-quiet-relations');
   for(const kind of ['tourist','lover','musician','nurse'] as const){
    assert.equal(R.conflictEffectBetween(inspector,fixtures.rider(kind,kind,30,3)),null);
   }
   assert.equal(R.conflictEffectBetween(inspector,fixtures.rider('thief','t',30,3)),'coins');
   assert.equal(R.conflictEffectBetween(inspector,fixtures.rider('ghost','g',30,3)),'energy');
  }finally{configureScenario('baseline');}
  assert.deepEqual(R.BONDS,before);
  assert.deepEqual(R.CONFLICT_EFFECTS,effects);
 });
 test('economy experiments share settlement, previews and observations then restore defaults',()=>{
  const baseline=scenarioRecord();
  const w=fixtures.sealed();w.state.floor=40;w.state.cabin=[fixtures.rider('thief','t',40,3),null,null,null,null,null];
  const normal=E.resolveFloor(clone(w.state),()=>.99).lastEarnings.total;
  const normalFlow=features(w,w.state.coins).flow;
  try {
   configureScenario('repeat-and-commission-small');
   assert.equal(E.resolveFloor(clone(w.state),()=>.99).lastEarnings.total,normal-1);
   assert.equal(features(w,w.state.coins).flow,normalFlow-1);
   assert.equal(S.rollShopRewards({eligibleTips:2,relay:false},()=>.49).tips,6);
   const u={...E.EMPTY_UPGRADES,concierge:1};
   assert(E.makeOffers(40,u,false,()=>.51).every(r=>r.fareBonus===1));
   w.state.cabin=[fixtures.rider('celebrity','star',40,3),fixtures.rider('commuter','fan',40,3),null,null,null,null];
   assert.equal(E.resolveFloor(clone(w.state),()=>.99).lastEarnings.sources.find(x=>x.label==='名人关注')?.amount,1);
  } finally {configureScenario('baseline');}
  assert.deepEqual(scenarioRecord(),baseline);
 });
 test('archival v8.31 dependency files retain verified byte identity',()=>{
  const path=GAME_ROOT+'/experiments/v8.31/';
  const m=JSON.parse(readFileSync(path+'source-manifest.json','utf8'));
  assert.equal(m.version,'8.31');assert.equal(m.files.length,17);
  for(const f of m.files)assert.equal(hash(readFileSync(path+f.file)),f.sha256,f.file);
 });
 test('summary quantiles interpolate instead of reporting the upper middle as an even-sample median',()=>{
  assert.equal(quantile([1,2,3,4],.5),2.5);assert.equal(quantile([7],.9),7);assert.equal(quantile([],.5),null);
 });
 test('public observation hides sealed fares and engine random identifiers',()=>{
  const a=fixtures.sealed(),b=clone(a);b.state.cabin[0]!.traits!.fare=39;
  const namesA=new Names(),namesB=new Names();
  assert.deepEqual(observe(a,namesA),observe(b,namesB));
  const text=JSON.stringify(observe(a,namesA));assert(!text.includes('copySeed'));assert(!text.includes('destination'));assert(!text.includes('mystery-'));
  assert.equal(observe(a,namesA).cabin[0]!.baseFare,null);
  for(const mode of ['planner','opportunist','investor'] as const){
   const da=new Player(mode).decide(observe(a,namesA),serviceFor(a,namesA));
   const db=new Player(mode).decide(observe(b,namesB),serviceFor(b,namesB));assert.deepEqual(da,db);
  }
 });
 test('unknown copy seed does not affect imagined unobserved assignments',()=>{
  const a=fixtures.sealed();a.state.cabin[0]=fixtures.rider('mimic','copy',42,4);a.state.cabin[0].copySeed=1;
  const b=clone(a);b.state.cabin[0]!.copySeed=99991;
  const na=new Names(),nb=new Names();assert.deepEqual(observe(a,na),observe(b,nb));
  assert.deepEqual(serviceFor(a,na).imagine([],3,3),serviceFor(b,nb).imagine([],3,3));
 });
 test('previews and imagination neither mutate world nor consume actual future',()=>{
  const s=new Session(7801),before=hash(s.world()),service=serviceFor(s.world(),s.names);
  const choices=service.candidates('explorer',new Set());assert(choices.plans.length);
  service.imagine(choices.plans[0].actions,3,2);assert.equal(hash(s.world()),before);
  const again=new Session(7801);for(const a of choices.plans[0].actions){s.act(a);again.act(a);}s.act({type:'depart'});again.act({type:'depart'});
  assert.equal(hash(s.world()),hash(again.world()));
 });
 test('same seed and actions replay exactly without global Math.random',()=>{
  const old=Math.random;Math.random=()=>{throw Error('Uncontrolled randomness');};
  try{const r=runOne('merchant',81443,30);assert.equal(replay(r.replay).observation().floor,r.summary.final.floor);}finally{Math.random=old;}
 });
 test('real prices and permanent single purchase / no repeat are enforced',()=>{
  const s={...E.initialRun(),status:'upgrade' as const,coins:500,energy:10,stress:4,shop:[{key:'calm' as const,price:E.upgradePrice('calm',10,0),purchased:false}]};
  const charged=E.chargeBattery(s,7);assert.equal(charged.coins,s.coins-7*E.CHARGE_PRICE);
  assert.equal(E.sootheAgitation(charged,2),charged,'Routine soothing removed in v8.35');
  const crisis={...charged,stress:charged.stressCap+1};
  const soothed=E.sootheAgitation(crisis,2);assert.equal(soothed.coins,charged.coins-2*E.SOOTHE_PRICE);
  const bought=E.installUpgrade(soothed,'calm');assert.equal(E.installUpgrade(bought,'calm'),bought);
  assert(!E.upgradeChoices(bought.upgrades,rngFor(2)).includes('calm'));
 });
 test('one shared old-rider move; no free dismissal / duplicate boarding',()=>{
  const w=fixtures.sixSeats(),n=new Names();n.register(w);const id=n.id(w.state.cabin[0]!.id);
  const once=applyPlan(w,[{type:'place',rider:id,slot:1}],n)!;assert(once.state.swapped);
  assert.equal(applyPlan(once,[{type:'place',rider:id,slot:5}],n),null);
  const s=new Session(33);assert.throws(()=>s.act({type:'depart'}));assert.throws(()=>s.act({type:'place',rider:'p999',slot:0}));
  s.act({type:'place',rider:'p1',slot:0});assert.throws(()=>s.act({type:'dismiss',rider:'p1'}));
  s.act({type:'place',rider:'p1',slot:1});assert.equal(s.world().state.cabin.filter(Boolean).length,1);
  s.act({type:'withdraw',rider:'p1'});assert.equal(s.world().state.cabin.filter(Boolean).length,0);
 });
 test('bounded joint search can propose six occupied seats',()=>{
  const w=fixtures.sixSeats(),n=new Names();n.register(w);const c=enumerate(w,n,'explorer',new Set());
  assert(c.plans.some(p=>p.features.occupied===6),'Search still excludes six-seat combinations');
 });
 test('checkpoint agitation limit is a repair window, not death',()=>{
  const w=fixtures.rescueWindow(),n=new Names(),p=previewWorld(w,[],n)!;assert(p.safety.resourceSafe);
  const s=E.resolveFloor(clone(w.state),rngFor(1));assert.equal(s.status,'upgrade');assert.equal(s.stress,7);
  assert.equal(E.leaveShop(E.sootheAgitation(s,1)).status,'playing');assert.equal(E.leaveShop(s).status,'lost');
 });
 test('paid dismissal + ordinary bomb offers a legal two-floor escape',()=>{
  const w=fixtures.bombReplacement(),n=new Names();n.register(w);
  const plans=enumerate(w,n,'planner',new Set()).plans;
  const p=plans.find(p=>p.actions.some(a=>a.type==='dismiss')&&p.observation.cabin.some(r=>r?.kind==='bomb')&&p.safety.resourceSafe&&p.safety.bombSafe);
  assert(p,'Missed dismissal-before-placement rescue');const placed=applyPlan(w,p.actions,n)!;
  assert(placed.state.coins<w.state.coins);let s=E.resolveFloor(clone(placed.state),rngFor(1));assert.equal(s.status,'playing');
  s=E.resolveFloor(s,rngFor(2));assert.equal(s.status,'upgrade');assert(!s.cabin.some(r=>r?.kind==='bomb'));
 });
 test('agitation premium coexists with care and actual five-person settlement',()=>{
  const w=fixtures.appetite(),s=E.resolveFloor(clone(w.state),rngFor(1));
  assert.equal(s.lastEarnings.sources.find(s=>s.label==='醉汉躁动加价')?.amount,10);
  assert.equal(s.stress,6);assert.equal(s.status,'playing');
 });
 test('one-step safety misses caregiver departure later in the journey',()=>{
  const w=fixtures.careExpiry();assert(w.state.stress+F.stressForecast(w.state).highDelta<w.state.stressCap);
  let s=E.resolveFloor(clone(w.state),rngFor(1));assert.equal(s.status,'playing');assert(!s.cabin.some(r=>r?.kind==='nurse'));
  s=E.resolveFloor(s,rngFor(2));assert.equal(s.status,'playing');s=E.resolveFloor(s,rngFor(3));assert.equal(s.status,'lost');
 });
 test('economic alarms respond to data, not a run ID or floor hardcode',()=>{
  const b={floor:90,occupancy:1.2,skipFraction:.8,income:60,spend:25,coins:700,fullServiceQuote:50,emptyPermanentPool:true};
  const good=flagBlock(b).map(f=>f.code);assert(good.includes('LOW_LOAD_STILL_ACCUMULATES'));assert(good.includes('CASH_OUTGROWS_MAINTENANCE'));
  assert.equal(flagBlock({...b,income:10,coins:20,emptyPermanentPool:false}).length,0);
 });
 test('policy module cannot import engine or runtime internals',()=>{
  const s=readFileSync(new URL('policies.mts',import.meta.url),'utf8');
  assert(!/from ['"].*(?:game|runtime|util|search)/.test(s));assert(!s.includes('Math.random'));
 });
 test('UI insolvency wording warning distinguishes affordable and unaffordable repair',()=>{
  const body=(coins:number)=>({text:`电量\n50/60\n躁动\n7/7\n余额\n${coins}`,buttons:[{text:'无力修复 · 结束本班'}]});
  assert.equal(checkVisibleUI(body(2454)).issues.length,1);assert.equal(checkVisibleUI(body(7)).issues.length,0);
 });
 test('multiple paid dismissals remain searchable when swaps exhaust a beam',()=>{
  const w=fixtures.sixSeats();w.state.floor=18;w.state.energy=4;w.state.cabin.forEach(r=>{if(r){r.destination=24;r.boardedAt=10;}});w.offers=[];
  const n=new Names();n.register(w);const c=enumerate(w,n,'planner',new Set());assert(c.plans.some(p=>p.actions.filter(a=>a.type==='dismiss').length>=2&&p.safety.resourceSafe));
 });
 test('ongoing income feature uses settlement, including zero-cash loss clamping',()=>{
  const w=fixtures.appetite();w.state.coins=0;w.state.cabin.forEach(r=>{if(r)r.destination=w.state.floor+3;});
  const f=features(w,0),s=E.resolveFloor(clone(w.state),()=>.51);assert.equal(f.flow,s.lastEarnings.total);
 });
 test('review queue retains later personas instead of only the first policy',()=>{
  const packets=['novice','merchant','planner'].flatMap(p=>Array.from({length:30},(_,i)=>({caseId:p+'-'+i,trigger:'DEATH_REVIEW'})));
  assert.equal(new Set(diverseQueue(packets,6).map(p=>p.caseId.split('-')[0])).size,3);
 });
 test('an empty cabin has no recurring income from a stale last receipt',()=>{
  const w=fixtures.sealed();w.state.cabin.fill(null);w.state.lastEarnings={total:100,sources:[]};assert.equal(features(w,500).flow,0);
 });
 test('v8.32 observations expose work, bands and reserve without hidden seeds',()=>{
  const w=fixtures.sealed();w.state.cabin[0]={...fixtures.rider('mechanic','work',31,3),repairProgress:1};
  w.state.floor=31;w.state.serviceTurns=2;w.state.reserveCell=true;w.state.stress=5;
  const o=observe(w,new Names());assert.equal(o.schema,2);assert.equal(o.agitationBand,'high');assert.equal(o.serviceTurns,2);
  assert.equal(o.reserveCell,true);assert.equal(o.cabin[0]!.progress.repair,1);
  assert.equal(o.reserveCharge,B.RESERVE_CELL_CHARGE);assert.equal(o.prices.reserve,B.RESERVE_CELL_PRICE);
 });
 test('energy budget expires completed repairs and includes prospective low-band work',()=>{
  const w=fixtures.sealed();w.state.floor=31;w.state.cabin=[{...fixtures.rider('mechanic','work',31,3),repairDone:true},null,null,null,null,null];
  w.state.serviceTurns=0;const baseline=features(w,500).committedEnergy;
  w.state.serviceTurns=1;assert.equal(features(w,500).committedEnergy,baseline-1,'one repair step cannot last the whole sector');
  w.state.serviceTurns=0;w.state.cabin[0]!.repairDone=false;
  assert.equal(features(w,500).committedEnergy,baseline-B.REPAIR_DURATION,'completed work persists after Mechanic delivery');
 });
 test('reserve actions are real purchases and consumptions, including panic search',()=>{
  const w=fixtures.sealed();w.state.status='upgrade';w.state.energy=1;
  const names=new Names();names.register(w);
  const bought=applyPlan(w,[{type:'buy-reserve'}],names)!;assert.equal(bought.state.coins,w.state.coins-B.RESERVE_CELL_PRICE);
  assert.equal(applyPlan(bought,[{type:'buy-reserve'}],names),null);
  assert.equal(applyPlan(bought,[{type:'use-reserve'}],names),null,'cannot use inside the shop');
  bought.state=E.leaveShop(bought.state);
  const used=applyPlan(bought,[{type:'use-reserve'}],names)!;assert.equal(used.state.energy,1+B.RESERVE_CELL_CHARGE);
  assert.equal(applyPlan(used,[{type:'use-reserve'}],names),null);
  const plans=enumerate(bought,names,'planner',new Set()).plans;
  assert(plans.some(p=>p.actions.some(a=>a.type==='use-reserve')&&p.safety.resourceSafe));
 });
 test('future shop charge cannot finance a dead intermediate floor',()=>{
  const w=fixtures.sealed();w.state.floor=17;w.state.energy=7;
  w.state.cabin=[fixtures.rider('lover','l',17,5),fixtures.rider('tourist','t',17,2),null,null,fixtures.rider('nurse','n',17,1),null];
  assert.equal(features(w,500).committedEnergy,10);
  // Net cost to floor 20 is only seven, but floor 19 requires ten initially.
  const first=E.resolveFloor(clone(w.state),()=>.5);assert.equal(first.energy,2);
  const second=E.resolveFloor(first,()=>.5);assert.equal(second.status,'lost');
 });
 test('same-floor shop replenishment is settled before failure, unlike a later floor',()=>{
  const w=fixtures.sealed();w.state.floor=79;
  w.state.cabin=[fixtures.rider('courier','c',79,2,true),null,null,null,fixtures.rider('mimic','m',79,3,true),null];
  w.state.energy=E.totalEnergyCost(w.state)-E.SHOP_ENTRY_CHARGE+1;
  const next=E.resolveFloor(clone(w.state),()=>.5);
  assert.equal(next.status,'upgrade');assert.equal(next.energy,1);
  assert(previewWorld(w,[],new Names())!.safety.resourceSafe);
 });
 test('investor can buy before filling while respecting a public motor budget',()=>{
  const w=fixtures.sealed();w.state.floor=10;w.state.status='upgrade';w.state.energy=11;w.state.coins=89;w.state.stress=6;
  w.state.shop=[{key:'reinforced',price:45,purchased:false}];w.state.cabin=[];
  const o=observe(w,new Names()),actions=new Player('investor').shop(o).actions;
  assert(actions.findIndex(a=>a.type==='buy')<actions.findIndex(a=>a.type==='charge'));
  const next=applyPlan(w,actions.filter(a=>a.type!=='leave'),new Names())!;
  assert.equal(next.state.upgrades.reinforced,1);assert.equal(next.state.energy,33);assert.equal(next.state.coins,0);assert.equal(next.state.stress,6);
  w.state.energy=1;w.state.coins=50;
  assert(!new Player('investor').shop(observe(w,new Names())).actions.some(a=>a.type==='buy'));
 });
 test('bounded planning considers a last-ascent Coach–Celebrity red link',()=>{
  const w=fixtures.sealed();w.state.floor=93;w.state.energy=44;w.state.stress=3;w.offers=[];
  w.state.upgrades.reinforced=1;w.state.upgrades.concierge=1;
  w.state.cabin=[fixtures.rider('celebrity','later',93,4),null,fixtures.rider('coach','coach',93,5),fixtures.rider('celebrity','due',93,1),null,null];
  const n=new Names();n.register(w);
  const decision=new Player('investor').decide(observe(w,n),serviceFor(w,n));
  const placed=applyPlan(w,decision.actions,n)!;
  assert(E.arrivalFare(placed.state.cabin.find(r=>r?.id==='due')!,placed.state.cabin,placed.state.cabin.findIndex(r=>r?.id==='due'),1,3)>E.arrivalFare(w.state.cabin[3]!,w.state.cabin,3,1,3),'Missed the visible final-fare tradeoff');
 });
 test('committed shopping protects rider obligations without banning investment',()=>{
  const w=fixtures.sealed();w.state.floor=10;w.state.status='upgrade';w.state.energy=11;w.state.coins=100;w.state.stress=0;
  w.state.shop=[{key:'reinforced',price:45,purchased:false}];
  w.state.cabin=Array.from({length:6},(_,i)=>i<4?fixtures.rider('tourist','t'+i,10,7):null);
  const n=new Names(),o=observe(w,n),service=serviceFor(w,n);
  assert(new Player('investor').shop(o).actions.some(a=>a.type==='buy'),'Motor-only investor takes this risk');
  assert(!new Player('investor','committed').shop(o,service).actions.some(a=>a.type==='buy'),'Current rider commitment is unaffordable after purchase');
  w.state.cabin=Array(6).fill(null);
  const actions=new Player('investor','committed').shop(observe(w,n),serviceFor(w,n)).actions;
  assert(actions.some(a=>a.type==='buy'),'Affordable investment still allowed');
  const settled=applyPlan(w,actions.filter(a=>a.type!=='leave'),n);assert(settled);
  assert.equal(settled.state.upgrades.reinforced,1);assert.equal(settled.state.energy,38);
  assert.throws(()=>new Player('investor','committed').shop(observe(w,n)),/public previews/);
 });
 test('committed shop decisions are invariant to sealed fares and do not mutate the world',()=>{
  const a=fixtures.sealed();a.state.floor=10;a.state.status='upgrade';a.state.coins=100;a.state.energy=11;a.state.stress=0;
  a.state.shop=[{key:'reinforced',price:45,purchased:false}];
  const b=clone(a);for(const r of b.state.cabin)if(r?.traits)r.traits.fare=8;
  const before=hash(a),na=new Names(),nb=new Names();
  assert.deepEqual(new Player('planner','committed').shop(observe(a,na),serviceFor(a,na)),new Player('planner','committed').shop(observe(b,nb),serviceFor(b,nb)));
  assert.equal(hash(a),before);
 });
 return {passed:checks.length,checks,limits:'Synthetic regression fixtures inspired by UI discoveries, not exact reconstructions of unrecorded hidden UI state. Smoke trajectories are not human games.'};
}
