import {E,type Rider,type PassengerKind,type RunState} from './game.mts';
import type {World} from './runtime.mts';
export const rider=(kind:PassengerKind,id:string,floor:number,remaining:number,volatile=false,old=true):Rider=>({
 kind,id,destination:floor+remaining,boardedAt:old?floor-1:floor,patience:0,fareBonus:0,volatile,
 ...(kind==='bomb'?{fuse:3}:{}),...(kind==='mystery'||kind==='shifter'?{traits:{weight:0,energy:1,agitation:0,fare:kind==='mystery'?24:36,bond:{likes:['tourist'],avoids:['cop']},revision:0}}:{})});
function fixture(floor:number,extra:Partial<RunState>={}):World{return {state:{...E.initialRun(),floor,coins:500,energy:50,...extra},offers:[]};}
export function rescueWindow(){const w=fixture(149,{stress:6,stressCap:7,coins:2454});w.state.cabin[0]=rider('cop','old',149,4,true);return w;}
export function bombReplacement(){
 const w=fixture(188,{stress:6,stressCap:7,coins:2566});w.state.cabin[4]=rider('inspector','old-inspector',188,3,true);
 w.offers=[rider('thief','new-thief',188,3,true,false),rider('mystery','new-mystery',188,4,true,false),rider('bomb','new-bomb',188,2,false,false)];
 w.offers[1].traits!.agitation=1;return w;
}
export function sixSeats(){
 const w=fixture(12,{energy:60});[0,2,3].forEach((slot,i)=>w.state.cabin[slot]=rider('tourist','old'+i,12,3));
 w.offers=[0,1,2].map(i=>rider('tourist','new'+i,12,3,false,false));return w;
}
export function appetite(){
 const w=fixture(277,{stress:5,stressCap:8});
 w.state.cabin[1]=rider('drunk','d',277,1,true);w.state.cabin[2]=rider('musician','m',277,2,true);
 w.state.cabin[3]=rider('cop','p',277,4);w.state.cabin[4]=rider('thief','t',277,3,true);w.state.cabin[5]=rider('nurse','n',277,3,true);return w;
}
export function careExpiry(){
 const w=fixture(45,{stress:5,stressCap:7});w.state.cabin[1]=rider('drunk','d',45,5,true);w.state.cabin[4]=rider('nurse','n',45,1);return w;
}
export function sealed(){const w=fixture(42);w.state.cabin[0]=rider('mystery','mystery',42,2);w.offers=[rider('tourist','tour',42,3,false,false)];return w;}
