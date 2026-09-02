export type PassengerKind =
  | 'commuter' | 'tourist' | 'courier' | 'mechanic' | 'lover' | 'musician'
  | 'thief' | 'cop' | 'lawyer' | 'drunk' | 'nurse' | 'child'
  | 'ghost' | 'exorcist' | 'coach' | 'celebrity' | 'inspector' | 'bomb';

export type PassengerSpec = {
  kind: PassengerKind;
  name: string;
  title: string;
  weight: number;
  fare: number;
  energy: number;
  trip: [number, number];
  patience: number;
  rarity: number;
  sheet: '01' | '02' | '03';
  cell: number;
  tone: 'steady' | 'social' | 'risk' | 'occult' | 'support';
  short: string;
  detail: string;
};

export const PASSENGERS: Record<PassengerKind, PassengerSpec> = {
  commuter: { kind: 'commuter', name: '通勤者', title: 'The Commuter', weight: 1, fare: 7, energy: 1, trip: [2, 5], patience: 3, rarity: 18, sheet: '01', cell: 0, tone: 'steady', short: '安静、可靠、准时付费', detail: '没有特殊能力。轻便而稳定，是填补空位的可靠选择。' },
  tourist: { kind: 'tourist', name: '游客', title: 'The Tourist', weight: 2, fare: 13, energy: 2, trip: [3, 7], patience: 3, rarity: 10, sheet: '01', cell: 1, tone: 'steady', short: '长途，但报酬丰厚', detail: '占用更多载重与时间，抵达后提供较高车费和能源。' },
  courier: { kind: 'courier', name: '快递员', title: 'The Courier', weight: 1, fare: 6, energy: 2, trip: [1, 3], patience: 2, rarity: 9, sheet: '01', cell: 2, tone: 'support', short: '短途快速周转', detail: '目的地很近，适合迅速回收能源并腾出座位。' },
  mechanic: { kind: 'mechanic', name: '维修工', title: 'The Mechanic', weight: 2, fare: 7, energy: 3, trip: [3, 7], patience: 3, rarity: 7, sheet: '01', cell: 3, tone: 'support', short: '每三层修复 1 能源', detail: '每到三的倍数楼层额外恢复1点能源。抵达时也能提供大量能源。' },
  lover: { kind: 'lover', name: '恋人', title: 'The Lover', weight: 1, fare: 6, energy: 1, trip: [3, 7], patience: 4, rarity: 10, sheet: '01', cell: 4, tone: 'social', short: '寻找另一位恋人', detail: '与另一位恋人相邻时每层获得1金币，抵达车费翻倍；独处时每两层额外失去1耐心。' },
  musician: { kind: 'musician', name: '音乐家', title: 'The Musician', weight: 1, fare: 8, energy: 1, trip: [4, 8], patience: 3, rarity: 7, sheet: '01', cell: 5, tone: 'social', short: '人多时每层降低压力', detail: '车内至少有4名乘客时，每层降低1点压力；也能安抚醉汉与儿童。' },
  thief: { kind: 'thief', name: '小偷', title: 'The Thief', weight: 1, fare: 5, energy: 1, trip: [3, 7], patience: 2, rarity: 8, sheet: '02', cell: 0, tone: 'risk', short: '未控制 +3 金币/层 · 偶数层 +1 压力', detail: '未受控制时每层赚3金币、每两层增加1压力。相邻警察或律师后每层赚1金币且不再制造压力，抵达再奖励5金币。' },
  cop: { kind: 'cop', name: '警察', title: 'The Officer', weight: 2, fare: 8, energy: 2, trip: [3, 7], patience: 4, rarity: 8, sheet: '02', cell: 1, tone: 'support', short: '控制小偷，延缓炸弹', detail: '控制相邻小偷。与炸弹相邻时，炸弹每两层暂停一次倒计时。' },
  lawyer: { kind: 'lawyer', name: '律师', title: 'The Counsel', weight: 1, fare: 10, energy: 1, trip: [3, 7], patience: 4, rarity: 6, sheet: '02', cell: 2, tone: 'support', short: '轻量的小偷控制者', detail: '控制相邻小偷，并让其抵达时获得额外车费；不能延缓炸弹。' },
  drunk: { kind: 'drunk', name: '醉汉', title: 'The Drifter', weight: 2, fare: 14, energy: 1, trip: [2, 6], patience: 1, rarity: 7, sheet: '02', cell: 3, tone: 'risk', short: '未安抚每层 25% 闹事 · 压力 +2', detail: '高额底价补偿风险。被音乐家或护士安抚时每层再赚1金币；否则有25%概率增加2压力并随机换位。' },
  nurse: { kind: 'nurse', name: '护士', title: 'The Nurse', weight: 2, fare: 9, energy: 2, trip: [3, 7], patience: 4, rarity: 7, sheet: '02', cell: 4, tone: 'support', short: '稳定降低压力', detail: '每两层降低1点压力，并安抚相邻的醉汉与儿童。' },
  child: { kind: 'child', name: '儿童', title: 'The Child', weight: 1, fare: 5, energy: 1, trip: [3, 7], patience: 1, rarity: 7, sheet: '02', cell: 5, tone: 'social', short: '需要有人照顾', detail: '没有情侣、音乐家或护士相邻时，每两层额外失去1点耐心。' },
  ghost: { kind: 'ghost', name: '幽灵', title: 'The Apparition', weight: 0, fare: 8, energy: 0, trip: [4, 9], patience: 5, rarity: 6, sheet: '03', cell: 0, tone: 'occult', short: '零重量，但会延误邻座', detail: '相邻驱魔师时每层恢复1能源且抵达多得6金币；否则每三层让随机邻座多坐一层。' },
  exorcist: { kind: 'exorcist', name: '驱魔师', title: 'The Warden', weight: 1, fare: 9, energy: 2, trip: [3, 7], patience: 3, rarity: 6, sheet: '03', cell: 1, tone: 'occult', short: '把幽灵变成能源', detail: '控制相邻幽灵，使其不再延误邻座，并让它每层恢复能源。' },
  coach: { kind: 'coach', name: '教练', title: 'The Coach', weight: 3, fare: 10, energy: 1, trip: [4, 8], patience: 3, rarity: 6, sheet: '03', cell: 2, tone: 'social', short: '邻座抵达车费 ×1.5', detail: '相邻乘客抵达时车费提高50%；自己抵达时，每名邻座额外支付3金币。' },
  celebrity: { kind: 'celebrity', name: '名人', title: 'The Celebrity', weight: 1, fare: 18, energy: 1, trip: [4, 8], patience: 2, rarity: 5, sheet: '03', cell: 3, tone: 'risk', short: '恰好 1 邻座 +3 金币/层', detail: '恰好一名邻座时每层赚3金币；两名以上邻座时只在偶数层增加1压力。' },
  inspector: { kind: 'inspector', name: '检查员', title: 'The Inspector', weight: 2, fare: 12, energy: 3, trip: [4, 8], patience: 4, rarity: 5, sheet: '03', cell: 4, tone: 'risk', short: '每两层检查一次载重', detail: '总载重不超过8时恢复1能源，否则增加1压力。' },
  bomb: { kind: 'bomb', name: '炸弹客', title: 'The Fuse', weight: 1, fare: 26, energy: 2, trip: [2, 6], patience: 1, rarity: 4, sheet: '03', cell: 5, tone: 'risk', short: '26 金币 · 引信归零则本局结束', detail: '高额悬赏补偿整局失败风险。上车时获得3–6格引信；到站前归零会结束本局，警察可让倒计时每两层暂停一次。' },
};

export const PASSENGER_ORDER: PassengerKind[] = [
  'commuter', 'tourist', 'courier', 'mechanic', 'lover', 'musician',
  'thief', 'cop', 'lawyer', 'drunk', 'nurse', 'child',
  'ghost', 'exorcist', 'coach', 'celebrity', 'inspector', 'bomb',
];

export const UNLOCK_TIERS: { floor: number; kinds: PassengerKind[] }[] = [
  { floor: 1, kinds: ['commuter', 'tourist', 'courier', 'mechanic', 'lover', 'musician', 'thief', 'cop'] },
  { floor: 10, kinds: ['lawyer', 'drunk', 'nurse', 'child', 'coach'] },
  { floor: 25, kinds: ['ghost', 'exorcist', 'inspector'] },
  { floor: 40, kinds: ['celebrity', 'bomb'] },
];

export type UpgradeKey = 'battery' | 'solar' | 'calm' | 'concierge' | 'reinforced' | 'express';
export const UPGRADES: Record<UpgradeKey, { name: string; label: string; description: string }> = {
  battery: { name: '增容电池', label: 'BATTERY', description: '能源上限 +5，并立即恢复 5 能源。' },
  solar: { name: '应急回充', label: 'TRICKLE CHARGE', description: '此后每四层恢复 1 能源，可叠加。' },
  calm: { name: '镇静标识', label: 'CALM SIGNAGE', description: '压力上限 +3，并立即降低 3 压力。' },
  concierge: { name: '礼宾服务', label: 'CONCIERGE', description: '此后新乘客初始耐心 +3，到站小费 +2。' },
  reinforced: { name: '轿厢加固', label: 'REINFORCED', description: '载重上限 +3，能源上限 +3，并立即恢复 3 能源。' },
  express: { name: '快速电梯', label: 'EXPRESS', description: '此后长途新乘客的路程 -1，最低为三层；每局限装一次。' },
};

export const ADJACENT: [number, number][] = [[0,1],[1,2],[3,4],[4,5],[0,3],[1,4],[2,5]];
