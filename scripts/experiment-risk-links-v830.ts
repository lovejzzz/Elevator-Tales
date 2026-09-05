import {mkdirSync,writeFileSync} from 'node:fs';
import * as E from '../experiments/v8.31/lib/game-engine';
import { PASSENGERS, type UpgradeKey } from '../experiments/v8.31/lib/game-data';
import { energyForecast, stressForecast } from '../experiments/v8.31/lib/game-forecast';
import { planPlacement } from '../experiments/v8.31/lib/game-interaction';
import { experimentalRiskLinks, type RiskLinkTuning } from '../experiments/v8.31/lib/risk-link-experiment';

const randomFor=(seed:number)=>()=>{let t=seed+=0x6d2b79f5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
const trials=250;
const tunings:Array<RiskLinkTuning|undefined>=[undefined,{coinsPerMember:1,agitationPerEdge:1},{coinsPerMember:2,agitationPerEdge:1},{coinsPerMember:3,agitationPerEdge:1},{coinsPerMember:2,agitationPerEdge:2},{coinsPerMember:4,agitationPerEdge:1,payoutChance:.5},{coinsPerMember:8,agitationPerEdge:1,payoutChance:.25}];
const packages:Record<string,UpgradeKey[]>={none:[],shared:['crowd'],recovery:['solar','relay'],all:['crowd','solar','relay','meter','tipjar','concierge','calm','battery','reinforced','express']};
type Scenario='nurses'|'volatile'|'drunk';
const rows=[];
for(const scenario of ['nurses','volatile','drunk'] as Scenario[]) for(const [packageName,owned] of Object.entries(packages))
 for(const action of ['hold','split','control']) for(const tuning of tunings) {
  let completed=0,coins=0,netAtEnergyPrice=0,steps=0,linkedFloors=0,moves=0,maxPressure=0,deadEnergy=0,deadStress=0,successNet=0;
  for(let trial=0;trial<trials;trial++) {
    const rng=randomFor(830711+trial*97);
    const kinds:Array<E.Rider['kind']|null>=['thief','thief',scenario==='drunk'?'drunk':null,
      action==='control'?'cop':scenario==='volatile'?'musician':'nurse',scenario==='volatile'?'musician':'nurse',scenario==='drunk'?'nurse':null];
    let state:E.RunState={...E.initialRun(),floor:11,stress:trial%4,energy:50,coins:0};
    for(const key of owned)state.upgrades[key]=1;
    state.stressCap+=state.upgrades.calm;
    state.cabin=kinds.map((kind,slot)=>{
      if(!kind)return null;
      const spec=PASSENGERS[kind],totalTrip=E.expressTrip(E.rand(spec.trip[0],spec.trip[1],rng),state.upgrades.express);
      return {kind,id:'seat'+slot,boardedAt:10,destination:11+Math.max(1,totalTrip-1),patience:0,fareBonus:state.upgrades.concierge*3,
        volatile:scenario==='volatile'&&kind==='thief'};
    });
    // Synthetic timing windows with granted upgrades; no claim that each state
    // is reachable from actual offers or equally likely in a real session.
    const initialEnergy=state.energy;
    while(state.status==='playing'&&state.cabin.some(Boolean)&&state.floor<19) {
      if(action==='split'&&experimentalRiskLinks(state.cabin,tuning).edges&&state.stress+stressForecast(state,undefined,tuning).highDelta>=state.stressCap-2) {
        const score=(candidate:E.RunState)=>{
          const ep=energyForecast(candidate,undefined,tuning),sp=stressForecast(candidate,undefined,tuning);
          const next=E.resolveFloor(candidate,()=>.999,{riskLinks:tuning});
          return -(candidate.stress+sp.highDelta>=candidate.stressCap?10000:0)
            -(candidate.energy+ep.lowDelta<=0?10000:0)-sp.highDelta*100+next.lastEarnings.total-E.totalEnergyCost(candidate)*2;
        };
        let best=score(state),selected=state;
        state.cabin.forEach((r,i)=>{if(r)for(let target=0;target<6;target++){
          if(i===target)continue;
          const plan=planPlacement(state,r,target);
          if(plan.ok&&plan.changed){const candidate=score(plan.next);if(candidate>best){best=candidate;selected=plan.next;}}
        }});
        moves+=Number(selected!==state);state=selected;
      }
      linkedFloors+=Number(experimentalRiskLinks(state.cabin,tuning).edges>0);
      state=E.resolveFloor(state,randomFor(830711+trial*97+state.floor*100003),{riskLinks:tuning});
      steps++;maxPressure=Math.max(maxPressure,state.stress);
    }
    const net=state.earned-2*(initialEnergy-state.energy);
    const safe=state.status!=='lost'&&!state.cabin.some(Boolean);
    completed+=Number(safe);coins+=state.earned;netAtEnergyPrice+=net;successNet+=safe?net:0;
    deadEnergy+=Number(state.status==='lost'&&state.energy<=0);deadStress+=Number(state.status==='lost'&&state.stress>=state.stressCap);
  }
  rows.push({scenario,packageName,grantedUpgradePrice:owned.reduce((sum,k)=>sum+E.upgradePrice(k,10,0),0),action,tuning:tuning??null,trials,
    completed:completed/trials,meanCoins:coins/trials,meanNetAtEnergyPrice:netAtEnergyPrice/trials,successfulNet:completed?successNet/completed:null,
    meanFloors:steps/trials,linkedFloors,moves,maxPressure,deadEnergy,deadStress});
 }
const report={version:'8.30',trialsPerCell:trials,cells:rows.length,episodes:rows.length*trials,rows,
 limits:'Synthetic remaining-trip windows using base trip ranges minus one elapsed floor; initial agitation 0–3, no new riders or shop visits. Upgrades granted, not earned; purchase cost reported but excluded from net flow. Every structural state is not proven reachable from offer history. Completion means delivering this starting cabin, not winning a run. Split is a legal one-move greedy safety policy, not optimal control. Net values use 2 coins per energy and do not price agitation, seat opportunity, capital, or failure. All-upgrade package is a late-run stress test, not a normal early purchase.'};
const out=new URL('../experiments/v8.30/',import.meta.url);mkdirSync(out,{recursive:true});
writeFileSync(new URL('risk-link-windows-'+(process.argv[2]??'complete-effects')+'.json',out),JSON.stringify(report,null,2));
console.log(JSON.stringify({cells:rows.length,episodes:rows.length*trials,selected:rows.filter(r=>r.scenario==='nurses'&&['none','all'].includes(r.packageName))}));
