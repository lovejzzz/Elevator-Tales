import {createHash} from 'node:crypto';
import {readFileSync, readdirSync, writeFileSync, mkdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {GAME_ROOT, GAME_VERSION, E} from './game.mts';
import {scenarioRecord} from './scenarios.mts';
export const hash=(value:unknown)=>createHash('sha256').update(value instanceof Uint8Array?value:typeof value==='string'?value:JSON.stringify(value)).digest('hex');
export const rngFor=(seed:number)=>()=>{let t=seed+=0x6d2b79f5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
export const seedFor=(text:string)=>parseInt(hash(text).slice(0,8),16);
export const mean=(values:number[])=>values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
export function quantile(values:number[],q:number){
 if(!values.length)return null;
 const sorted=[...values].sort((a,b)=>a-b),position=(sorted.length-1)*Math.max(0,Math.min(1,q));
 const low=Math.floor(position),high=Math.ceil(position);
 return sorted[low]+(sorted[high]-sorted[low])*(position-low);
}
export function writeNew(path:string,data:unknown){mkdirSync(dirname(path),{recursive:true});writeFileSync(path,typeof data==='string'?data:JSON.stringify(data,null,2)+'\n',{flag:'wx'});}
export function manifest(){
 const files=['package.json','app/globals.css','components/elevator-game.tsx','components/agitation-gauge.tsx',...readdirSync(join(GAME_ROOT,'lib')).filter(p=>/\.(ts|tsx)$/.test(p)).map(p=>'lib/'+p)];
 return {version:GAME_VERSION,gameRoot:GAME_ROOT,scenario:scenarioRecord(),source:Object.fromEntries(files.map(p=>[p,hash(readFileSync(join(GAME_ROOT,p),'utf8'))])),
   constants:{initialEnergy:E.INITIAL_ENERGY,energyCap:E.ENERGY_CAPACITY,stressCap:E.AGITATION_CAPACITY,charge:E.CHARGE_PRICE,soothe:E.SOOTHE_PRICE},
   lab:Object.fromEntries(readdirSync(new URL('.',import.meta.url)).filter(p=>p.endsWith('.mts')).map(p=>[p,hash(readFileSync(new URL(p,import.meta.url),'utf8'))]))};
}
