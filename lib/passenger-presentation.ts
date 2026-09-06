import { PASSENGERS, passengerCategory, type PassengerKind } from './game-data';
import { bondLines, bondSummary, riderConflictRules, riderProfile, type ConflictEffect } from './rider-profile';
import { arrivalFare, arrivalTip, HIGH_RISK_BONUS, riderAfterWork, riderAgitation, type Rider, unlockedAt, type RunState } from './game-engine';
import { CHILD_CARE_BONUS, CHILD_CARE_WORK, COMMUTER_QUIET_BONUS, INSPECTION_BONUS, INSPECTION_WORK, REPAIR_DURATION, REPAIR_WORK, TOURIST_MEDIUM_BONUS } from './balance-v832';
import { RISK_PARTNERS, RISK_STASH_PER_ASCENT, riskPartnerships } from './shift-rules';
import { agitationBand } from './balance-v832';

export const SHARED_SAVING_RULE = '检修完成：后续运转少耗1电；受控幽灵：抵消人物耗电。节能不产生电量，躁动不兑换电量。';

// Cooperation conditions stay on the card face, including on phones.
export const PASSENGER_RULES = Object.fromEntries(Object.entries(PASSENGERS).map(([kind, spec]) => [kind, [spec.detail, ...(['ghost','exorcist'].includes(kind) ? [SHARED_SAVING_RULE] : [])]])) as unknown as Record<PassengerKind, readonly string[]>;

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
  case 'commuter':moneyNote=`低躁动到站 +${COMMUTER_QUIET_BONUS}金币`;break;
  case 'tourist':moneyNote=`每位邻座：到站+2币；中躁动到站 +${TOURIST_MEDIUM_BONUS}金币`;special='包括其他游客；邻座变化即重算';break;
  case 'courier':special='到站补充2电（不超过上限）';break;
  case 'lover':moneyNote='每位邻座恋人：到站基价+100%';special='无恋人邻座：每站25%呼唤恋人';break;
  case 'thief':moneyNote='无警察：每站+3；受控仅到站+5';pressure.splice(0,1,`每层 +1`,'挨警察免除');break;
  case 'drunk':moneyNote='高躁动到站：基价+100%';pressure.splice(0,1,'每层 +1','挨护士免除');break;
  case 'child':pressure.splice(0,1,'每层 +1','挨恋人或护士免除');moneyNote=`累计被照顾${CHILD_CARE_WORK}层：到站 +${CHILD_CARE_BONUS}金币`;break;
  case 'celebrity':moneyNote='恰好1邻座：每站+2';pressure.splice(0,1,`2+邻座：每层 +1`);break;
  case 'musician':special='按关门时状态：低档向3、高档向4靠近最多2点；中档不变，整车不叠加';break;
  case 'nurse':pressure.push('所有相邻乘客：每层各抵消1躁动');special='每层耗1电；安抚相邻醉汉、儿童';break;
  case 'mechanic':special=`低躁动检修 ${rider.repairProgress??0}/${REPAIR_WORK}；完成后${REPAIR_DURATION}层运转少耗1电；每人一次`;break;
  case 'ghost':special='无驱魔师：3的倍数层随机延误邻座1站；邻驱魔师：不延误且每站节能1';moneyNote='邻驱魔师：到站再+2币';break;
  case 'exorcist':special='邻幽灵：阻止延误，每站节能1';moneyNote='受控幽灵到站再+2币';break;
  case 'inspector':moneyNote=`连续低躁动${INSPECTION_WORK}层：到站 +${INSPECTION_BONUS}金币`;special='达标后保留签章；未达标时升至中/高会中断连续计数';break;
  case 'coach':moneyNote='每位相邻教练：基础车费+50%；本人到站每邻座+3币';break;
  case 'cop':moneyNote='邻小偷：停止途中收入，到站+5';special='邻小偷：免偷窃躁动；邻炸弹：锁住倒计时';break;
  case 'lawyer':moneyNote='邻小偷：停止途中收入，到站+5';special='邻小偷：免偷窃躁动；不能暂停炸弹倒计时';break;
  case 'bomb':special=`炸弹倒计时 ${rider.fuse??0} 层：每上升一层 −1；到站前归零则失败。同层到站安全；幽灵可能延误。`;break;
  case 'mystery':special='本次参数已固定；车费到站揭晓';break;
  case 'shifter':special='每站重抽三值和关系；基价16–28币';break;
  case 'mimic':special=profile.copies.length?profile.copies.map(c=>`↑ 复制${PASSENGERS[c.sourceKind].name}的${c.field==='energy'?'耗电':'基础车费'} · 同一人物对不重抽`).join('；'):'↑ 只复制正上方的耗电或基础车费；同一人物对不重抽';break;
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

export type PassengerCardEffect = {
 tone: 'coins' | 'energy' | 'agitation' | 'timer' | 'neutral';
 text: string;
};

export type PassengerCardRelation = {
 targets?: PassengerKind[];
 targetLabel?: '任何邻座' | '任意人物' | '任意非教练';
 effects: PassengerCardEffect[];
};

export type PassengerCardSections = {
 self: PassengerCardEffect[];
 greenBonus: PassengerCardEffect[];
 green: PassengerCardRelation[];
 red: PassengerCardRelation[];
 risk: PassengerCardRelation[];
};

const effect = (tone: PassengerCardEffect['tone'], text: string): PassengerCardEffect => ({tone,text});
const conflictEffects = (kind: ConflictEffect): PassengerCardEffect[] => ({
 agitation: [effect('agitation','每上1层 +1躁动')],
 energy: [effect('energy','每上1层额外耗1电')],
 coins: [effect('coins','每上1层立即 −2')],
 overload: [effect('energy','两人每层耗电 ×2')],
 gamble: [effect('energy','两人每层耗电 ×2'),effect('coins','双方到站：基价额外 +100%')],
}[kind]);

// Candidate cards deliberately expose only three information groups: the rider,
// green neighbors, and red neighbors. Detailed rules remain available on demand.
export function passengerCardSections(
 rider: Rider,
 state: RunState,
 bonus = 1,
 relief = 0,
): PassengerCardSections {
 const profile=riderProfile(rider,state.cabin);
 const self:PassengerCardEffect[]=[];
 const green:PassengerCardRelation[]=[];
 const addGreen=(targets:PassengerKind[]|null,effects:PassengerCardEffect[],targetLabel?:PassengerCardRelation['targetLabel'])=>green.push({targets:targets??undefined,targetLabel,effects});
 switch(rider.kind){
  case 'courier':self.push(effect('energy','到站 +2'));break;
  case 'commuter':self.push(effect('coins',`低躁动到站 +${COMMUTER_QUIET_BONUS}金币`));break;
  case 'mechanic':self.push(effect('neutral',rider.repairDone?'本次检修已完成':`低躁动检修 ${rider.repairProgress??0}/${REPAIR_WORK}`),effect('energy',`完成：后续${REPAIR_DURATION}层运转少耗1电`),effect('neutral','每人一次；中/高暂停，不清零'));break;
  case 'lover':
   self.push(effect('neutral','单独时：25% 呼唤恋人'));
   addGreen(['lover'],[effect('coins','到站基价 +100%/人')]);
   break;
  case 'tourist':self.push(effect('coins',`中躁动到站 +${TOURIST_MEDIUM_BONUS}金币`));addGreen(null,[effect('coins','到站 +2金币/人')],'任何邻座');break;
  case 'musician':self.push(effect('agitation','低→3 · 高→4 · 最多2点 · 中不变'),effect('neutral','整车节拍，每层一次；多位不叠加'));break;
  case 'thief':
   self.push(effect('coins','未受控：每上1层立即 +3'),effect('agitation','未受控：每上1层 +1躁动'));
   addGreen(['cop'],[effect('coins','途中不产币'),effect('coins','到站 +5'),effect('agitation','不加躁动')]);
   break;
  case 'cop':
   addGreen(['thief'],[effect('coins','小偷仅到站 +5'),effect('agitation','小偷不加躁动')]);
   addGreen(['bomb'],[effect('timer','倒计时锁定')]);
   break;
  case 'lawyer':self.push(effect('coins','整车红线损失每层抵消最多2'));addGreen(['thief'],[effect('coins','小偷仅到站 +5'),effect('agitation','小偷不加躁动')]);break;
  case 'drunk':
   self.push(effect('agitation','未安抚 +1/层'));
   self.push(effect('coins','高躁动到站：基价 +100%'));
   addGreen(['nurse'],[effect('agitation','不加躁动')]);
   break;
  case 'nurse':addGreen(null,[effect('agitation','每人 −1/层')],'任意人物');break;
  case 'child':
   self.push(effect('agitation','无人照顾 +1/层'));
   self.push(effect('neutral',`已被照顾 ${rider.careProgress??0}/${CHILD_CARE_WORK}`),effect('coins',`累计${CHILD_CARE_WORK}层：到站 +${CHILD_CARE_BONUS}金币`));
   addGreen(['lover','nurse'],[effect('agitation','不加躁动'),effect('neutral','每上1层累计照顾1次')]);
   break;
  case 'ghost':
   self.push(effect('neutral','3的倍数层：随机邻座 +1站'));
   addGreen(['exorcist'],[effect('neutral','不再延误'),effect('energy','节能 1/层'),effect('coins','到站 +2')]);
   break;
  case 'exorcist':addGreen(['ghost'],[effect('neutral','不再延误'),effect('energy','节能 1/层'),effect('coins','幽灵到站 +2')]);break;
  case 'coach':
   self.push(effect('neutral','倍率只作用于本体基价；不再放大其他奖励'));
   addGreen(null,[effect('coins','基础车费 +50%/教练')],'任意非教练');
   addGreen(null,[effect('coins','教练到站 +3/人')],'任意人物');
   break;
  case 'celebrity':
   self.push(effect('coins','1位邻座：每上1层立即 +2'),effect('agitation','2+邻座：每上1层 +1躁动'));
   break;
  case 'inspector':
   self.push(effect('neutral',rider.complianceReady?'合规签章已保留':`连续低躁动 ${rider.quietStreak??0}/${INSPECTION_WORK}`),effect('coins',`达标：到站 +${INSPECTION_BONUS}金币`));
   break;
  case 'bomb':
   self.push(effect('timer',`倒计时 ${rider.fuse??0} · 未到站归零失败`),effect('neutral','同层到站安全；幽灵可能延误'));
   addGreen(['cop'],[effect('timer','倒计时锁定')]);
   break;
  case 'mystery':self.push(effect('neutral','参数与邻座关系随机 · 车费到站揭晓'));break;
  case 'shifter':self.push(effect('neutral','每层重抽三值与邻座关系'));break;
  case 'mimic':self.push(effect('neutral',profile.copies.length?`↑ 复制${PASSENGERS[profile.copies[0].sourceKind].name}的${profile.copies[0].field==='energy'?'耗电':'基础车费'}`:'↑ 只复制正上方 · 耗电或基础车费'),effect('neutral','同一人物对固定；移动不重抽'));break;
 }

 // Ability links do not all pay a bond bonus. Attach the bonus only to its
 // named targets, never to a blanket heading such as "any neighbor".
 const greenBonus: PassengerCardEffect[] = [];
 const bondEffects = [effect('coins',`本人到站时 +${bonus}金币/人`),
  ...(relief>0?[effect('agitation',`本人到站时 −${relief}躁动`)]:[])];
 const linked=new Set<PassengerKind>();
 green.forEach(row=>{
  if(!row.targets?.length||!row.targets.every(target=>profile.bond.likes.includes(target)))return;
  row.targets.forEach(target=>linked.add(target));
  row.effects.push(...bondEffects);
 });
 const unlisted=profile.bond.likes.filter(target=>!linked.has(target));
 if(unlisted.length)addGreen(unlisted,[...bondEffects]);

 const redGroups=new Map<ConflictEffect,PassengerKind[]>();
 riderConflictRules(rider,state.cabin).forEach(rule=>redGroups.set(rule.effect,[...(redGroups.get(rule.effect)??[]),rule.target]));
 const red=[...redGroups.entries()].map(([kind,targets])=>({targets,effects:conflictEffects(kind)}));
 const risk: PassengerCardRelation[] = passengerCategory(rider.kind) === 'bad' ? [{ targets: RISK_PARTNERS, effects: [effect('coins','未受控相邻：每人暂存 +2金币/层；高躁动 +3'), effect('agitation','每条链接 +1躁动/层'), effect('neutral','送达兑现；请离全部放弃')] }] : [];
 if (rider.stash) self.push(effect('coins','已暂存 ' + rider.stash + ' · 送达兑现'));
 return {self,greenBonus,green,red,risk};
}

const pressureText=(text:string,m:number)=>text.replace(/躁动 \+(\d+)/g,(_,n)=>'躁动 +'+Number(n)*m).replace(/\+(\d+) 躁动/g,(_,n)=>'+'+Number(n)*m+' 躁动');
export function passengerCardRules(rider: Rider, cabin: Array<Rider|null>=[], bonus=1, relief=0, multiplier=1): PassengerRuleBlock[] {
 const bond=bondSummary(rider,cabin,bonus),name=PASSENGERS[rider.kind].name;
 const partners=bond.partners.replaceAll(' / ','或'),opponents=bond.opponents.replaceAll(' / ','或');
 const ability:PassengerRuleBlock={tone:'neutral',heading:'人物能力',lines:PASSENGER_RULES[rider.kind].map(rule=>pressureText(rule,multiplier))};
 const cooperation:PassengerRuleBlock={
  tone:'good',heading:`协作：旁边有${partners}`,
  lines:[`${name}到站时，每位仍相邻的协作对象额外赚 ${bonus} 金币。`],
  note:'只有列出的对象有这项到站奖励；能力绿线不一定有奖励。到站那一刻仍相邻才算。',
 };
 if(rider.kind==='tourist') {
  cooperation.heading='游客自己的到站收入';
  cooperation.lines=[`8基价 + 每位邻座2金币 + 每位相邻名人再加${bonus}金币；中躁动再加3金币。`, '只在游客本人下车时结算，不给邻座发钱。其他游客也算邻座；同层下车仍互算，先下车的以后不再算。', '例：两位游客相邻且同时下车，无其他加成，各得10金币，共20；中躁动各得13，共26。'];
  cooperation.note='邻座奖励、中躁动奖励和名人协作奖励直接相加，不参与基价倍率。';
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

export function passengerBrief(rider: Rider, floor: number, cabin: Array<Rider|null>=[], bonus=1, relief=0, multiplier=1, agitation=0) {
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
 const slot=cabin.findIndex(candidate=>candidate?.id===rider.id);
 const quotedRider=slot>=0&&rider.destination<=floor+1?riderAfterWork(rider,cabin,slot,agitation):rider;
 if(quotedRider!==rider&&riskPartnerships(cabin).members.includes(slot)) {
  quotedRider.stash=(quotedRider.stash??0)+RISK_STASH_PER_ASCENT+Number(agitationBand(agitation)==='high');
 }
 const expectedFare=profile.hidden?null:slot<0?profile.fare+(rider.volatile?HIGH_RISK_BONUS:0)+arrivalTip(rider,agitation):arrivalFare(quotedRider,cabin,slot,bonus,agitation);
 return {coins:profile.hidden?null:profile.fare, expectedFare, seated:slot>=0, riskBonus:rider.volatile?HIGH_RISK_BONUS:0, energy:profile.energy,agitation:profile.agitation+(rider.volatile?1:0), tip:rider.fareBonus,weight:0,hidden:profile.hidden,
  distance:Math.max(0,rider.destination-floor),bond,cooperation,cardRules:passengerCardRules(rider,cabin,bonus,relief,multiplier),detailRules,skillRules,bondRules,rules:[...skillRules,...bondRules]};
}
