import {createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
import {E} from './game.mts';
export function checkVisibleUI(data:{text:string;buttons:Array<{text:string;label?:string|null}>}){
 const text=data.text,energy=text.match(/电量\n(\d+)\/(\d+)/),stress=text.match(/躁动\n(\d+)\/(\d+)/),coins=text.match(/余额\n(\d+)/);
 if(!energy||!stress||!coins)return {parsed:false as const,issues:[]};
 const state={energy:Number(energy[1]),energyCap:Number(energy[2]),stress:Number(stress[1]),stressCap:Number(stress[2]),coins:Number(coins[1])};
 const minCost=Math.max(0,1-state.energy)*E.CHARGE_PRICE+Math.max(0,state.stress-state.stressCap+1)*E.SOOTHE_PRICE;
 const endLabel=data.buttons.some(b=>b.text.replaceAll(/\s/g,'').includes('无力修复·结束本班'));
 const issues=[];
 if(endLabel&&minCost>0&&state.coins>=minCost)issues.push({code:'AFFORDABLE_REPAIR_LABELED_INSOLVENT',state,minCost,
  interpretation:'可支付最低抢救费，却出现“无力修复”结束按钮；提示应交给UI审查，而非算作引擎死亡。'});
 return {parsed:true as const,state,minCost,issues,
  musicMuted:data.buttons.some(b=>b.label==='打开音乐'),soundMuted:data.buttons.some(b=>b.label==='打开音效')};
}
export async function auditUILog(path:string){
 let records=0,parsed=0;const cases=new Map<string,unknown>();
 for await(const line of createInterface({input:createReadStream(path),crlfDelay:Infinity})){
  if(!line.trim())continue;const e=JSON.parse(line);records++;
  const result=checkVisibleUI(e.data);if(result.parsed)parsed++;
  for(const issue of result.issues)cases.set(e.session+'/'+e.data.floor+'/'+issue.code,{at:e.at,session:e.session,floor:e.data.floor,...issue});
 }
 return {records,parsed,issues:[...cases.values()],limits:'Visible DOM / accessible-button evidence only. No screenshot or audio quality assessment; no application state read or mutated.'};
}
