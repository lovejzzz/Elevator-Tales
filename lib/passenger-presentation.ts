import { MECHANIC_SAVING, PASSENGERS, type PassengerKind } from './game-data';
import { bondLines, bondSummary, riderConflictRules, riderProfile } from './rider-profile';
import { HIGH_RISK_BONUS, INSPECTOR_COMPLIANCE_REWARD, INSPECTOR_ENERGY_LIMIT, riderAgitation, type Rider, type RunState } from './game-engine';

export const SHARED_SAVING_RULE = '维修工、受控幽灵和节能线路逐项相加；节能最多抵完人物耗电，不能抵运转1电。';

// Cooperation conditions stay on the card face, including on phones.
export const PASSENGER_RULES: Record<PassengerKind, readonly string[]> = {
  commuter: ['短途稳定，送达领取车费。'],
  tourist: ['每位相邻乘客：每层 +1 金币，逐人叠加。', '包括其他游客；不设人数上限，由站位决定最大旅伴数。邻座变化时立即重新计算。'],
  courier: ['到站时补充2电，不超过电量上限。', '短途周转，快速送达赚取金币并换取续航。'],
  mechanic: [`每层节能${MECHANIC_SAVING}电，多位维修工逐个叠加。`, '本人耗2电；节能不能抵消电梯运转，也不会倒充电。'],
  lover: ['每位恋人邻座：本人每层 +1 金币，到站基础车费 +100%；多位逐个叠加。', '没有恋人邻座：每层有 25% 概率呼唤另一位恋人候客。'],
  musician: ['所有相邻乘客：每人每层各抵消 2 点躁动；多人可叠加，不会降成负数。', '自身每层耗2电；同时安抚相邻的醉汉和儿童，阻止其人物躁动。'],
  thief: ['没有警察或律师邻座：每层 +4 金币、躁动 +1。', '有警察或律师邻座：改为每层 +1 金币，不再加压，到站车费 +5。'],
  cop: ['控制相邻的小偷，消除其加压效果。', '与炸弹客相邻期间：锁住炸弹倒计时。'],
  lawyer: ['控制相邻的小偷，消除其加压效果。不能暂停炸弹倒计时。'],
  drunk: ['没有音乐家或护士邻座：每层躁动 +1。', '有音乐家或护士邻座：不再加压，每层 +1 金币。'],
  nurse: ['所有相邻乘客：每人每层各抵消 1 点躁动；多人可叠加，不会降成负数。', '自身每层耗1电；同时安抚相邻的醉汉和儿童，阻止其人物躁动。'],
  child: ['没有恋人、音乐家或护士邻座：每层躁动 +1。', '与其中任一角色相邻，即可阻止这项躁动。'],
  ghost: ['没有驱魔师邻座：抵达 3、6、9… 层时，随机让一名邻座的目的地延后 1 层。', '有驱魔师邻座：不再延误邻座；每位受控幽灵每层节能2电，到站车费 +6。',SHARED_SAVING_RULE],
  exorcist: ['每位相邻幽灵分别受控：阻止延误、每层节能2电，幽灵到站车费 +6。',SHARED_SAVING_RULE],
  coach: ['非教练邻座到站时：每位相邻教练使基础车费 +50%，线性叠加。', '本人到站时，每位仍在身旁的邻座使车费 +3。'],
  celebrity: ['恰好 1 位邻座：每层 +3 金币。', '至少 2 位邻座：每层躁动 +1。没有邻座则无额外效果。'],
  inspector: [`每层：本次总耗电不超过${INSPECTOR_ENERGY_LIMIT}，金币 +${INSPECTOR_COMPLIANCE_REWARD}；超过则躁动 +1。`,'总耗电＝电梯运转＋所有人物耗电−节能。包括检查员本人；稳压模块和节能可帮助通过检查。'],
  bomb: ['炸弹倒计时每上升一层减少 1；如果到站前归零，本局立即失败。到站当层归零则安全。', '有警察邻座：相邻期间倒计时锁定不减。'],
  mystery: ['耗电、自身躁动、路程及协作/冲突对象每次出现时随机。','车费已封存，到站才揭晓；请离不结算隐藏车费。'],
  shifter: ['每到一层重新抽取耗电（1–2）、自身躁动（0–1）、车费（28–48）和联动偏好。','目的地不延长。开门后先看新数值，再决定去留。'],
  mimic: ['每位邻座复制一项：耗电、车费或躁动（含联动偏好），最多三项且不重复。','同一邻座组合不会重抽；邻座属性变化会同步。隐藏车费不会提前公开。','不复制技能、炸弹倒计时、路程；复制人互相连接时只取各自本体属性，避免递归。'],
};

export type PassengerRuleBlock = {
 tone: 'neutral' | 'good' | 'risk'; heading: string; lines: string[]; note?: string;
};

export function passengerFace(rider: Rider, state: RunState) {
 const profile=riderProfile(rider,state.cabin);
 const names=(kinds:PassengerKind[])=>kinds.map(k=>(k===rider.kind?'另一位':'')+PASSENGERS[k].name).join('或');
 const energy=[`耗电 ${profile.energy} /站`];
 const pressure=[profile.agitation||rider.volatile?`每站躁动 +${profile.agitation+(rider.volatile?1:0)}`:'自身躁动 +0'];
 let moneyNote='',special='';
 switch(rider.kind){
  case 'tourist':moneyNote='每位相邻乘客：每站+1币，逐人叠加';special='包括其他游客；邻座变化即重算';break;
  case 'courier':special='到站补充2电（不超过上限）';break;
  case 'lover':moneyNote='每位邻座恋人：每站+1币，到站基价+100%';special='无恋人邻座：每站25%呼唤恋人';break;
  case 'thief':moneyNote='无警察/律师：每站+4；有则+1，到站再+5';pressure.splice(0,1,`每层 +1`,'挨警察或律师免除');break;
  case 'drunk':moneyNote='挨护士或音乐家：每站+1';pressure.splice(0,1,`每层 +1`,'挨护士或音乐家免除');break;
  case 'child':pressure.splice(0,1,`每层 +1`,'挨恋人/护士/音乐家免除');break;
  case 'celebrity':moneyNote='恰好1邻座：每站+3';pressure.splice(0,1,`2+邻座：每层 +1`);break;
  case 'musician':pressure.push('所有相邻乘客：每层各抵消2躁动');special='每层耗2电；安抚相邻醉汉、儿童';break;
  case 'nurse':pressure.push('所有相邻乘客：每层各抵消1躁动');special='每层耗1电；安抚相邻醉汉、儿童';break;
  case 'mechanic':energy.push(`每层节能${MECHANIC_SAVING} · 可堆叠`);break;
  case 'ghost':special='无驱魔师：3的倍数层随机延误邻座1站；邻驱魔师：不延误且每站节能2';moneyNote='邻驱魔师：到站再+6币';break;
  case 'exorcist':special='邻幽灵：阻止延误，每站节能2';moneyNote='受控幽灵到站再+6币';break;
  case 'inspector':moneyNote=`总耗电≤${INSPECTOR_ENERGY_LIMIT}：每层+${INSPECTOR_COMPLIANCE_REWARD}币`;pressure.splice(0,1,`总耗电>${INSPECTOR_ENERGY_LIMIT}：每层 +1`);special='检查整趟耗电，含本人；扣除稳压和节能';break;
  case 'coach':moneyNote='每位相邻教练：基础车费+50%；本人到站每邻座+3币';break;
  case 'cop':moneyNote='邻小偷：小偷每站改赚1币';special='邻小偷：免偷窃躁动；邻炸弹：锁住倒计时';break;
  case 'lawyer':moneyNote='邻小偷：小偷每站改赚1币';special='邻小偷：免偷窃躁动；不能暂停炸弹倒计时';break;
  case 'bomb':special=`炸弹倒计时 ${rider.fuse??0} 层：每上升一层 −1；到站前归零则失败`;break;
  case 'mystery':special='本次参数已固定；车费到站揭晓';break;
  case 'shifter':special='每站重抽三值和关系；基价28–48币';break;
  case 'mimic':special=profile.copies.length?profile.copies.map(c=>`复制${PASSENGERS[c.sourceKind].name}的${c.field==='energy'?'耗电':c.field==='fare'?'金钱':'躁动/关系'}`).join('；'):'每位邻座复制一项，随邻座变化';break;
 }
 if(rider.volatile){moneyNote=[`高危到站 +${HIGH_RISK_BONUS}币`,moneyNote].filter(Boolean).join('；');pressure.push('高危 +1');}
 const slot=state.cabin.findIndex(r=>r?.id===rider.id),actual=slot>=0?riderAgitation(state,slot):null;
 const conflicts=riderConflictRules(rider,state.cabin).map(rule=>`邻${PASSENGERS[rule.target].name}：${rule.text}`);
 return {energy,pressure,moneyNote,special,
  cooperative:`到站每邻${names(profile.bond.likes)}`,
  conflict:conflicts.join('；'),
  conflicts,
  actual:actual?`下站人物躁动 ${actual.low===actual.high?actual.low:actual.low+'～'+actual.high}`:null,
 };
}

const pressureText=(text:string,m:number)=>text.replace(/躁动 \+(\d+)/g,(_,n)=>'躁动 +'+Number(n)*m).replace(/\+(\d+) 躁动/g,(_,n)=>'+'+Number(n)*m+' 躁动');
export function passengerCardRules(rider: Rider, cabin: Array<Rider|null>=[], bonus=3, relief=0, multiplier=1): PassengerRuleBlock[] {
 const bond=bondSummary(rider,cabin,bonus),name=PASSENGERS[rider.kind].name;
 const partners=bond.partners.replaceAll(' / ','或'),opponents=bond.opponents.replaceAll(' / ','或');
 const ability:PassengerRuleBlock={tone:'neutral',heading:'人物能力',lines:PASSENGER_RULES[rider.kind].map(rule=>pressureText(rule,multiplier))};
 const cooperation:PassengerRuleBlock={
  tone:'good',heading:`协作：旁边有${partners}`,
  lines:[`${name}到站时，每位仍相邻的协作对象额外赚 ${bonus} 金币。`],
  note:'每条绿色连接逐条叠加，到站那一刻仍相邻才算。',
 };
 if(rider.kind==='thief'){
  ability.heading='没人看管：旁边没有警察或律师';
  ability.lines=['每上 1 层，赚 4 金币。','每上 1 层，躁动 +1。'];
  cooperation.lines=['途中：每层赚 1 金币，不再产生偷窃躁动。',`到站：受控奖励 +5 金币，协作奖励再 +${bonus} 金币。`];
 }
 if(rider.kind==='cop'){
  ability.heading='警察能帮谁？';
  ability.lines=['旁边的小偷：每层收益从 4 降为 1 金币，不再产生偷窃躁动。','旁边的炸弹客：相邻期间锁住炸弹倒计时。'];
 }
 if(rider.kind==='lawyer'){
  ability.heading='律师能帮谁？';
  ability.lines=['旁边的小偷：每层收益从 4 降为 1 金币，不再产生偷窃躁动。'];
  ability.note='律师不能暂停炸弹倒计时。';
 }
 if(relief>0){
  cooperation.lines.push(`契约生效：${name}协作到站，额外躁动 −${relief}。`);
  cooperation.note='到站时仍相邻才生效；同层送达多位协作乘客，可分别舒缓。';
 }
 const conflictLines=riderConflictRules(rider,cabin).map(rule=>`旁边有${PASSENGERS[rule.target].name}：${rule.text}。`);
 return [ability,cooperation,{
  tone:'risk',heading:`冲突：旁边有${opponents}`,
  lines:conflictLines,
  note:'红线每层生效；多条逐条相加。同类倍率按基础值线性叠加。',
 }];
}

export function passengerBrief(rider: Rider, floor: number, cabin: Array<Rider|null>=[], bonus=3, relief=0, multiplier=1) {
 const profile=riderProfile(rider,cabin);
 const bond=bondSummary(rider,cabin,bonus);
 const partnerNames=profile.bond.likes.map(kind=>(kind===rider.kind?'另一位':'')+PASSENGERS[kind].name);
 const cooperation={
  arrival:`${PASSENGERS[rider.kind].name}到站时`,
  partners:partnerNames,
  neighbor:`旁边仍有${partnerNames.join('或')}`,
  reward:`每条连接 +${bonus} 金币`,
  relief:relief>0 ? `额外躁动 −${relief}` : null,
  limit:relief>0 ? '每位协作送达各舒缓1次' : null,
 };
 const skillRules=PASSENGER_RULES[rider.kind].map(rule=>pressureText(rule,multiplier)),bondRules=bondLines(rider,cabin,bonus).map(rule=>pressureText(rule,multiplier));
 const detailRules=[bondRules[1],'绿色协作和红色冲突分别结算，互不抵消。',...bondRules.slice(3)];
 return {coins:profile.hidden?null:profile.fare+(rider.volatile?HIGH_RISK_BONUS:0), riskBonus:rider.volatile?HIGH_RISK_BONUS:0, energy:profile.energy,agitation:profile.agitation+(rider.volatile?1:0), tip:rider.fareBonus,weight:0,hidden:profile.hidden,
  distance:Math.max(0,rider.destination-floor),bond,cooperation,cardRules:passengerCardRules(rider,cabin,bonus,relief,multiplier),detailRules,skillRules,bondRules,rules:[...skillRules,...bondRules]};
}
