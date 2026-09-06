import assert from 'node:assert/strict';
import * as E from '../lib/game-engine';
import {rollShopRewards} from '../lib/shop-effects';
const r=(kind:E.Rider['kind'],slot:number):E.Rider=>({id:'p'+slot,kind,boardedAt:1,destination:7,patience:0,fareBonus:0});
const s={...E.initialRun(),floor:6,coins:10,energy:50,upgrades:{...E.EMPTY_UPGRADES,tipjar:1,meter:1,punchcard:1,finale:1},punchCount:4,
 cabin:[r('tourist',0),r('tourist',1),r('tourist',2),null,null,null]};
const out=E.resolveFloor(s,()=>0);
// Tourists: 10/12/10 fare; +8 fifth-ticket to seat1, +4 tip to
// middle seat, +4 meter to each. Curtain Call stays cabin-wide.
assert.deepEqual(out.lastArrivals?.map(a=>[a.slot,a.coins]),[[0,22],[1,20],[2,14]]);
assert.equal(out.lastArrivals!.reduce((n,a)=>n+a.coins,0)+6,out.lastEarnings.total);
assert.equal(out.lastArrivals![0].riderId,'p0');
const ghost={...E.initialRun(),floor:5,energy:40,cabin:[{...r('ghost',0),destination:10},{...r('commuter',1),destination:6},null,null,null,null]};
assert.equal(E.resolveFloor(ghost,()=>0).lastArrivals?.length,0,'Delayed rider does not fade out or receive a receipt');
const noArrivals=E.resolveFloor({...s,cabin:s.cabin.map(r=>r?{...r,destination:20}:null)},()=>0);
assert.deepEqual(noArrivals.lastArrivals,[],'No stale arrivals from prior turn');
let draws=0;const rewards=rollShopRewards({eligibleTips:3,relay:true},()=>{draws++;return draws%2?0:.99;});
assert.equal(draws,4,'Receipt allocation does not reroll chance');
assert.deepEqual(rewards.winningTipIndices,[0,2]);
assert.equal(rewards.tips,8);
const risk={...E.initialRun(),floor:6,stress:5,cabin:[{...r('drunk',0),stash:9},null,null,null,null,null]};
const paid=E.resolveFloor(risk,()=>.99);
assert.equal(paid.lastArrivals![0].coins,paid.lastEarnings.total,'State premium and banked fare belong to the person');
console.log('Arrival receipts: simultaneous identity, real individual tips, meter, fifth ticket, banked fare, cabin-only rewards, Ghost delay and RNG count passed.');
