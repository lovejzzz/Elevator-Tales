// Policy / model boundary: no game-state, RNG seed, copy seed or sealed fare.
export type Action = {type:'place'; rider:string; slot:number} | {type:'dismiss'; rider:string}
  | {type:'withdraw'; rider:string} | {type:'charge'|'soothe'; units:number}
  | {type:'buy'; key:string} | {type:'depart'|'leave'|'buy-reserve'|'use-reserve'};
export type PublicRider = {
  id:string; kind:string; name:string; remaining:number; boardedAt:number; volatile:boolean;
  energy:number; agitation:number; baseFare:number|null; currentPayout:number|null;
  tip:number; stash:number; fuse:number|null; likes:string[]; avoids:string[]; rule:string;
  copies:Array<{source:string; field:string}>; dismissalCost:number|null;
  progress:{repair:number;repairDone:boolean;inspection:number;stamped:boolean;care:number};
};
export type Observation = {
  schema:2; version:string; floor:number; phase:'playing'|'upgrade'|'lost';
  energy:number; energyCap:number; stress:number; stressCap:number; coins:number;
  oldMoveUsed:boolean; failureCause:'bomb'|'energy'|'agitation'|null; cabin:Array<PublicRider|null>; offers:PublicRider[];
  installed:string[]; shop:Array<{key:string; price:number; rule:string;effect:{energyCap:number;stressCap:number;energy:number;stress:number}}>;
  prices:{charge:number; soothe:number;reserve:number}; nextShop:number;
  agitationBand:'low'|'medium'|'high'; serviceTurns:number; reserveCell:boolean; reserveCharge:number;
  arrivalReliefCap:number;
  dismissalsRemaining:number; upgradeSlots:number; nextMotor:number;
  forecast:{energy:[number,number]; stress:[number,number]}|null;
  receipt:{coins:number; energy:number; stress:number; coinSources:Array<{label:string;amount:number}>};
};
export type Features = {
  occupied:number; newCount:number; flow:number; fareRate:number; payout:number;
  energyCost:number; committedEnergy:number; rise:number; green:number; red:number; due:number; shortest:number;
  hidden:number; newKinds:string[]; spent:number; uncertain:boolean;
  stateValue:number; pendingRepair:number; bankedPerStep:number; riskEdges:number;
};
export type Preview = {actions:Action[]; observation:Observation; features:Features;
  safety:{resourceSafe:boolean; bombSafe:boolean; shopWindow:boolean};
};
export type Rollout = {samples:number; depth:number; survivalFraction:number; minStressRoom:number;
  meanFloors:number; meanNetCash:number; meanEnergy:number; meanStress:number; hypothesis:string};
export type Decision = {actions:Action[]; reason:string; alternatives:Array<{actions:Action[];score:number;safety:Preview['safety']}>;
  diagnostics:{enumerated:number; sampledSafePlans:number; horizon:Rollout|null; knowledge:string[]}};
export type PolicyName = 'novice'|'merchant'|'explorer'|'minimalist'|'planner'|'opportunist'|'investor'|'operator';
export type ShopStyle = 'native' | 'committed' | 'adaptive';
export type InvestmentSample = {floor:number; arrivals:number; rideSum:number; nearLimit:boolean; gross:Record<string,number>};
export type PreviewService = {
  preview(actions:Action[]):Preview|null;
  candidates(mode:PolicyName,seen:Set<string>):{plans:Preview[];enumerated:number};
  imagine(actions:Action[],depth:number,samples:number,continuation?:'minimalist'|'operator'):Rollout;
};
