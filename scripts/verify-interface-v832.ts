import assert from 'node:assert/strict';
import { initialRun, energyBreakdown, affordableChargingPlan, chargeBattery, purchaseRepairWarning, failureLesson, type Rider } from '../lib/game-engine';
import { PASSENGER_ORDER, passengerCardGrade, UPGRADES } from '../lib/game-data';
import { passengerBrief, passengerCardSections, passengerFace } from '../lib/passenger-presentation';
import { planPlacement } from '../lib/game-interaction';
import { shouldPreviewConnection } from '../lib/connection-preview';
import { sanitizeDiscoveredPassengers } from '../lib/passenger-discovery';
import { translateGameText } from '../lib/i18n';
import { conflictEffectBetween, riderConflictRules, riderProfile } from '../lib/rider-profile';
import { motorAdvanceNotice, motorScheduleText, nextMotorChange } from '../lib/balance-v832';

assert.deepEqual(nextMotorChange(31),{from:41,power:4});
assert.deepEqual(nextMotorChange(40),{from:51,power:5},'Current next-floor cost already displays floor41');
assert.equal(nextMotorChange(60),null);
for(let amount=0;amount<=8;amount++)assert.equal(translateGameText(`使用应急电池 +${amount}电`,'en'),`Use Reserve Cell +${amount} power`);
for(const floor of [1,10,30,31,40,50,60,100])assert.doesNotMatch(translateGameText(motorAdvanceNotice(floor),'en'),/[\u3400-\u9fff]/u);
assert.match(translateGameText(motorScheduleText(),'en'),/capped at 6 from 61/);

const rider=(kind:Rider['kind'],id=kind as string):Rider=>({kind,id,destination:3,boardedAt:1,patience:0,fareBonus:0});
for(const kind of ['coach','celebrity'] as const){
 const blocks=passengerCardSections(rider(kind),{...initialRun(),floor:60});
 assert(blocks.red.some(row=>row.effects.some(e=>e.text==='双方到站：基价额外 +100%')));
 assert(!JSON.stringify(blocks).includes('两人到站车费 ×2'));
}
for(const label of ['名人被围','醉汉']){
 const lost={...initialRun(),status:'lost' as const,message:'躁动达到上限，午夜班次失控。',lastPressure:{delta:1,sources:[{label,amount:1}]}};
 const lesson=failureLesson(lost);
 assert.doesNotMatch(lesson,/音乐家靠近/);
 assert.match(lesson,label==='名人被围'?/只留1位邻座/:/音乐家影响整车/);
 assert.doesNotMatch(translateGameText(lesson,'en'),/[\u3400-\u9fff]/u);
}
for(const text of ['双方到站：基价额外 +100%','⚡×2 · 基价+100%','躁动达到上限，午夜班次失控。'])assert.doesNotMatch(translateGameText(text,'en'),/[\u3400-\u9fff]/u);
// Fixed incoming conflicts are still real costs. The R03 Inspector card
// omitted Ghost even though placing beside it immediately created a red line.
let symmetricCardChecks=0;
for(const a of PASSENGER_ORDER)for(const b of PASSENGER_ORDER){
 if(['mystery','shifter'].includes(a)||['mystery','shifter'].includes(b))continue;
 const first=rider(a,'a'),second=rider(b,'b');
 const expected=conflictEffectBetween(first,second,[first,second,null,null,null,null],0,1);
 assert.equal(riderConflictRules(first).find(rule=>rule.target===b)?.effect??null,expected,`${a} card must disclose ${b} cost`);
 symmetricCardChecks++;
}
const inspectorState={...initialRun(),floor:26};
assert(passengerCardSections(rider('inspector'),inspectorState).red.some(row=>row.targets?.includes('ghost')&&row.effects.some(e=>e.tone==='energy')));
assert(!passengerCardSections(rider('inspector'),{...inspectorState,floor:1}).red.some(row=>row.targets?.includes('ghost')),'Keep progressive disclosure for genuinely locked characters');
for(const kind of PASSENGER_ORDER){
 const run=initialRun(),r=rider(kind);
 const blocks=passengerCardSections(r,run);
 const text=JSON.stringify([blocks,passengerFace(r,run),passengerBrief(r,run.floor)]);
 assert.doesNotMatch(text,/压力回收|躁动转电|每层抵消2点人物耗电/);
 assert.doesNotMatch(text,/律师|百变人/,kind+' must not advertise retired partners');
 // Translate individual rendered text nodes, just like localizeTree; a JSON
 // blob is not a UI node and would bypass anchored localization rules.
 const visible=[...blocks.self,...blocks.greenBonus,...[...blocks.green,...blocks.red].flatMap(row=>row.effects)].map(item=>item.text);
 for(const line of visible)assert.doesNotMatch(translateGameText(line,'en'),/[\u3400-\u9fff]/u,kind+' readable English');
 const targets=blocks.red.flatMap(row=>row.targets??[]);
 assert.equal(new Set(targets).size,targets.length,kind+' no repeated red rows');
}
assert.deepEqual(['mechanic','courier'].map(k=>passengerCardGrade(k as Rider['kind'])),['standard','standard']);
assert.deepEqual(sanitizeDiscoveredPassengers(['lover','bogus','lover']),['lover']);
for(const [active,preview,oldCost,newCost,expected] of [
 [false,false,null,null,false],[false,true,null,null,true],[true,true,null,null,false],
 [false,false,null,'energy',true],[false,false,'energy','energy',false],
] as const) assert.equal(shouldPreviewConnection(true,active,preview,oldCost,newCost),expected);
const risk=initialRun();risk.stress=5;risk.cabin[0]=rider('thief');
const result=planPlacement(risk,rider('drunk'),1);
assert.equal(result.label,'危险协作已连接');
assert.equal(result.tone,'place');
assert.match(result.next.message,/暂存3金币.*链接\+1躁动/);
const power=initialRun();power.cabin=[rider('coach','c1'),rider('celebrity','star'),rider('coach','c2'),null,null,null];
assert.deepEqual(energyBreakdown(power).riderCosts.map(r=>r.total),[2,3,2,0,0,0],'Incident multipliers add from base, not exponential');
const ghost=rider('ghost'),mimic=rider('mimic');power.cabin=[ghost,null,null,mimic,null,null];
for(let seed=0;seed<32;seed++){mimic.copySeed=seed;if(riderProfile(mimic,power.cabin,3).energy===0)break;}
assert.equal(riderProfile(mimic,power.cabin,3).energy,0);
assert.equal(energyBreakdown(power).riderCosts[3].total,0,'Zero copied power remains zero under overload');
for(const [energy,coins,units] of [[11,44,22],[59,999,1],[0,1,0]]){
 const shop={...initialRun(),status:'upgrade' as const,energy,coins};
 const plan=affordableChargingPlan(shop);assert.equal(plan.units,units);
 const charged=chargeBattery(shop,plan.units);assert.equal(charged.coins,coins-plan.cost);assert.equal(charged.energy,plan.target);
}
const warningShop={...initialRun(),status:'upgrade' as const,coins:60,energy:28};
for(const upgrade of Object.values(UPGRADES))for(const line of [`${upgrade.name}已购入，花费 40 金币。`,`${upgrade.name} · 已购入`])assert.doesNotMatch(translateGameText(line,'en'),/[\u3400-\u9fff]/u);
for(const line of ['金币或维修不足，电量未能恢复。','维修后躁动仍然失控，班次结束。','双重失控 · 下一班提前留好维修预算，关门前先处理更接近上限的一项。'])assert.doesNotMatch(translateGameText(line,'en'),/[\u3400-\u9fff]/u);
assert.equal(translateGameText('当前电量低于下一段运转参考；人物耗电与途中回充另计。再点一次确认冒险。','en'),'Power is below the next sector’s motor reference. Rider costs and power gained en route are separate. Click again to accept the risk.');
assert.equal(translateGameText('躁动已达到或超过上限：使用按点舒缓服务，降到上限以下才能继续。','en'),'Agitation has reached or exceeded the cap. Use pay-per-point soothing to bring it below the cap before continuing.');
assert.equal(purchaseRepairWarning(warningShop,'reinforced',45),'reference');
assert.equal(purchaseRepairWarning({...warningShop,energy:-10},'reinforced',45),'crisis');
assert.equal(purchaseRepairWarning({...warningShop,energy:55,stress:8},'calm',35),null,'Calm actually repairs this crisis');
assert.equal(purchaseRepairWarning({...warningShop,coins:200},'reinforced',45),null);
assert.equal(purchaseRepairWarning({...warningShop,coins:2},'reinforced',45),null,'Disabled purchase already says insufficient coins');
assert.equal(translateGameText('维修工检修完成：后续3层运转少耗1电','en'),'Mechanic repair complete: save 1 motor power for the next 3 floors');
assert.equal(translateGameText('未安抚 · 每层+1','en'),'Uncalmed · +1 agitation/floor');
for(const value of ['+2','+1','0','−1','−2'])assert.equal(translateGameText('整车节拍 '+value,'en'),'Cabin beat '+value);
for(const text of ['容量 60 → 70；仍需付费充电','新乘客到站小费 +2','充满 60 · 56 金币',' 电 · 继续充电 ','每条协作连接 +1 → +3 金币。','至少3人：每站抵消1点人物耗电','新乘客原定 ≥5 层时，目的地提前 1 层 · 本局唯一']){
 assert.doesNotMatch(translateGameText(text,'en'),/[\u3400-\u9fff]/u,'Shop impact node: '+text);
}
for(const text of ['检修生效 · 余1层','维修层已离开，继续挑战更高楼层。','购买后不足以修复当前失控','购买后无法补至参考电量；参考线不是离店要求','人物耗电含红线倍率；链接固定耗电与整车节能另计','按余额补 22 电 · 44 金币','补至50需 78 金币，还差 34 金币。','同层到站安全；幽灵可能延误',passengerFace({...rider('bomb'),fuse:3},initialRun()).special]){
 assert.doesNotMatch(translateGameText(text,'en'),/[\u3400-\u9fff]/u,text+' must localize');
}
console.log(JSON.stringify({version:'v8.32',roles:PASSENGER_ORDER.length,symmetricCardChecks,localizedCards:true,edgeScopedPreview:true,riskCostsVisible:true,riderMultiplierReadouts:true,affordableCharging:true,limits:'Presentation-rule regression, not visual browser acceptance.'}));
