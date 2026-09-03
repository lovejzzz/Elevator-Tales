import { type PassengerKind } from './game-data';
import { bondLines, bondSummary, riderProfile } from './rider-profile';
import type { Rider } from './game-engine';

// Full rules are inline on desktop and available in a tap-open dialog on phones.
export const PASSENGER_RULES: Record<PassengerKind, readonly string[]> = {
  commuter: ['短途稳定，送达领取车费。'],
  tourist: ['旅途较长，送达车费较高。'],
  courier: ['短途周转，快速送达赚取金币。'],
  mechanic: ['抵达 3、6、9… 层时，少耗 1 电。'],
  lover: ['有恋人邻座：本人每层 +1 金币，到站车费翻倍。', '没有恋人邻座：每层有 25% 概率呼唤另一位恋人候客。'],
  musician: ['车内至少 4 人：每层躁动 −1。', '安抚相邻的醉汉和儿童，阻止其负面效果。'],
  thief: ['没有警察或律师邻座：每层 +3 金币，偶数层躁动 +1。', '有警察或律师邻座：改为每层 +1 金币，不再加压，到站车费 +5。'],
  cop: ['控制相邻的小偷，消除其加压效果。', '与炸弹客相邻：偶数层暂停引信倒计时。'],
  lawyer: ['控制相邻的小偷，消除其加压效果。不能暂停炸弹引信。'],
  drunk: ['没有音乐家或护士邻座：每层 25% 概率闹事，躁动 +2，并随机与邻座换位。', '有音乐家或护士邻座：不再闹事，每层 +1 金币。'],
  nurse: ['每逢偶数层，躁动 −1。', '安抚相邻的醉汉和儿童，阻止其负面效果。'],
  child: ['没有恋人、音乐家或护士邻座：偶数层额外消耗 1 点耐心。', '与其中任一角色相邻，即可阻止额外消耗。'],
  ghost: ['没有驱魔师邻座：抵达 3、6、9… 层时，随机让一名邻座的目的地延后 1 层。', '有驱魔师邻座：不再延误邻座，每层少耗 1 电，到站车费 +6。'],
  exorcist: ['镇压相邻幽灵：阻止延误，每位受控幽灵每层少耗 1 电，到站车费 +6。'],
  coach: ['邻座到站时，车费 ×1.5（向上取整）。', '本人到站时，每位仍在身旁的邻座使车费 +3。'],
  celebrity: ['恰好 1 位邻座：每层 +3 金币。', '至少 2 位邻座：偶数层躁动 +1。没有邻座则无额外效果。'],
  inspector: ['每逢偶数层检查：总载重不超过 8，少耗 1 电；超过 8，躁动 +1。'],
  bomb: ['引信每层减少 1 格；到站前归零，本局立即结束。到站当层归零则安全。', '有警察邻座：偶数层暂停倒计时。'],
  mystery: ['载重、路程、耐心及协作/冲突对象每次出现时随机。','车费已封存，到站才揭晓；请离不结算隐藏车费。'],
  shifter: ['每到一层重新抽取载重（1–4）、车费（28–48）和联动偏好。','目的地不延长、耐心不刷新。开门后可查看新属性；超载会使下一站躁动 +2。'],
  mimic: ['每位邻座复制一项：载重、车费或联动偏好，最多三项且不重复。','同一邻座组合不会重抽；邻座属性变化会同步。隐藏车费不会提前公开。','不复制技能、引信、路程；复制人互相连接时只取各自本体属性，避免递归。'],
};

export function passengerBrief(rider: Rider, floor: number, cabin: Array<Rider|null>=[], bonus=3) {
 const profile=riderProfile(rider,cabin);
 const skillRules=PASSENGER_RULES[rider.kind],bondRules=bondLines(rider,cabin,bonus);
 return {coins:profile.hidden?null:profile.fare, tip:rider.fareBonus, energy:0,weight:profile.weight,hidden:profile.hidden,
  distance:Math.max(0,rider.destination-floor),bond:bondSummary(rider,cabin,bonus),skillRules,bondRules,rules:[...skillRules,...bondRules]};
}
