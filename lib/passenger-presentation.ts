import { PASSENGERS, type PassengerKind } from './game-data';
import type { Rider } from './game-engine';

// Decision-critical copy is always shown in full; never hidden behind a tooltip.
export const PASSENGER_RULES: Record<PassengerKind, readonly string[]> = {
  commuter: ['没有特殊效果。送达目的地即可领取奖励。'],
  tourist: ['没有特殊效果。旅途较长、占用载重较多，到站报酬也更高。'],
  courier: ['没有特殊效果。短途送达后，较快补回能源。'],
  mechanic: ['抵达 3、6、9… 层时，额外恢复 1 能源。'],
  lover: ['有恋人邻座：本人每层 +1 金币，到站车费翻倍。', '没有恋人邻座：每层有 25% 概率呼唤另一位恋人候客。'],
  musician: ['车内至少 4 人：每层躁动 −1。', '安抚相邻的醉汉和儿童，阻止其负面效果。'],
  thief: ['没有警察或律师邻座：每层 +3 金币，偶数层躁动 +1。', '有警察或律师邻座：改为每层 +1 金币，不再加压，到站车费 +5。'],
  cop: ['控制相邻的小偷，消除其加压效果。', '与炸弹客相邻：偶数层暂停引信倒计时。'],
  lawyer: ['控制相邻的小偷，消除其加压效果。不能暂停炸弹引信。'],
  drunk: ['没有音乐家或护士邻座：每层 25% 概率闹事，躁动 +2，并随机与邻座换位。', '有音乐家或护士邻座：不再闹事，每层 +1 金币。'],
  nurse: ['每逢偶数层，躁动 −1。', '安抚相邻的醉汉和儿童，阻止其负面效果。'],
  child: ['没有恋人、音乐家或护士邻座：偶数层额外消耗 1 点耐心。', '与其中任一角色相邻，即可阻止额外消耗。'],
  ghost: ['没有驱魔师邻座：抵达 3、6、9… 层时，随机让一名邻座的目的地延后 1 层。', '有驱魔师邻座：不再延误邻座，每层 +1 能源，到站车费 +6。'],
  exorcist: ['镇压相邻幽灵：阻止延误，每位受控幽灵每层 +1 能源，到站车费 +6。'],
  coach: ['邻座到站时，车费 ×1.5（向上取整）。', '本人到站时，每位仍在身旁的邻座使车费 +3。'],
  celebrity: ['恰好 1 位邻座：每层 +3 金币。', '至少 2 位邻座：偶数层躁动 +1。没有邻座则无额外效果。'],
  inspector: ['每逢偶数层检查：总载重不超过 8，能源 +1；超过 8，躁动 +1。'],
  bomb: ['引信每层减少 1 格；到站前归零，本局立即结束。到站当层归零则安全。', '有警察邻座：偶数层暂停倒计时。'],
};

export function passengerBrief(rider: Rider, floor: number) {
  const spec = PASSENGERS[rider.kind];
  return { coins: spec.fare, tip: rider.fareBonus, energy: spec.energy, distance: Math.max(0, rider.destination - floor), rules: PASSENGER_RULES[rider.kind] };
}
