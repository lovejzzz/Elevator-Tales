export type PassengerKind =
  | 'commuter' | 'tourist' | 'courier' | 'mechanic' | 'lover' | 'musician'
  | 'thief' | 'cop' | 'lawyer' | 'drunk' | 'nurse' | 'child'
  | 'ghost' | 'exorcist' | 'coach' | 'celebrity' | 'inspector' | 'bomb'
  | 'mystery' | 'shifter' | 'mimic';

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
  sheet: '01' | '02' | '03' | '04';
  cell: number;
  tone: 'steady' | 'social' | 'risk' | 'occult' | 'support';
  short: string;
  detail: string;
  risk?: { label: '风险交易' | '条件风险' | '致命风险'; guide: string };
};

export type PassengerCardGrade = 'standard' | 'fine' | 'rare' | 'legendary';

export const MECHANIC_SAVING = 2;

export const PASSENGERS: Record<PassengerKind, PassengerSpec> = {
  commuter: { kind: 'commuter', name: '通勤者', title: 'The Commuter', weight: 1, fare: 5, energy: 1, trip: [2, 5], patience: 3, rarity: 18, sheet: '01', cell: 0, tone: 'steady', short: '低躁动到站：额外+2金币', detail: '到站前关门时处于低躁动，额外支付2金币，不参与倍率。不消耗躁动，也不要求邻座。' },
  tourist: { kind: 'tourist', name: '游客', title: 'The Tourist', weight: 2, fare: 8, energy: 1, trip: [4, 7], patience: 3, rarity: 10, sheet: '01', cell: 1, tone: 'steady', short: "本人到站：每位邻座+2币；本次关门时中躁动再+3", detail: "基价以卡面为准；每位仍相邻的乘客让本人到站多赚2金币，包括游客与同层到站者。到站前关门时处于中躁动，再支付3金币；两项均不参与倍率。途中不产金币。" },
  courier: { kind: 'courier', name: '快递员', title: 'The Courier', weight: 1, fare: 3, energy: 1, trip: [1, 3], patience: 2, rarity: 4, sheet: '01', cell: 2, tone: 'support', short: '到站补充2电 · 短途周转', detail: '目的地很近；到站时为电梯补充2电（不超过电量上限），适合用短途周转换取续航。' },
  mechanic: { kind: 'mechanic', name: '维修工', title: 'The Mechanic', weight: 2, fare: 6, energy: 1, trip: [3, 7], patience: 3, rarity: 5, sheet: '01', cell: 3, tone: 'support', short: '低躁动检修2次：随后3层运转少耗1电', detail: '关门时处于低躁动，检修进度+1；其他状态暂停，不清空进度。完成2次后，随后3次上行运转少耗1电；每位维修工仅完成一次。多位延长时间，最多6层，不增加每层节能量。不消耗躁动。' },
  lover: { kind: 'lover', name: '恋人', title: 'The Lover', weight: 1, fare: 3, energy: 1, trip: [3, 7], patience: 4, rarity: 10, sheet: '01', cell: 4, tone: 'social', short: "每位邻座恋人：到站基价+100%", detail: "有未配对恋人时，每层全车统一25%概率呼唤1位恋人，不按人数叠加。成功时另两位为非恋人，仍可互相作用；未触发时按普通候客规则生成。每位相邻恋人让本人到站基价增加100%，线性叠加；途中不产金币。小费、默契和高危加价不参与倍率。" },
  musician: { kind: 'musician', name: '音乐家', title: 'The Musician', weight: 2, fare: 6, energy: 1, trip: [2, 5], patience: 3, rarity: 5, sheet: '01', cell: 5, tone: 'social', short: '全舱节拍：向中躁动靠近最多2点', detail: '按关门时状态：低躁动向3提高最多2点，高躁动向4降低最多2点，中躁动不变。多位音乐家不叠加。不单独照护邻座，也不停止坏人合作。节拍后仍会结算人物、红线与到站舒缓；不是保证最终停在中档。' },
  thief: { kind: 'thief', name: '小偷', title: 'The Thief', weight: 1, fare: 5, energy: 1, trip: [2, 6], patience: 2, rarity: 8, sheet: '02', cell: 0, tone: 'risk', short: "未控制每层+3币、+1躁动；坏人相邻可攒钱", detail: "未受警察控制时，每层赚3金币并增加1躁动；受控后不产途中收入、不加偷窃躁动，到站额外+5金币。与未受控的小偷、醉汉或炸弹客相邻时，双方每层各暂存2金币，高躁动时各存3金币；多邻座不重复，每条链接额外+1躁动；暂存收益只有送达才支付，不参与倍率。", risk: { label: '风险交易', guide: '警察邻座可控' } },
  cop: { kind: 'cop', name: '警察', title: 'The Officer', weight: 2, fare: 6, energy: 1, trip: [3, 7], patience: 4, rarity: 8, sheet: '02', cell: 1, tone: 'support', short: '控制小偷，锁住炸弹倒计时', detail: '同时控制所有相邻小偷。与任意数量的炸弹客相邻期间，分别锁住他们的倒计时。' },
  lawyer: { kind: 'lawyer', name: '律师', title: 'The Counsel', weight: 1, fare: 6, energy: 1, trip: [3, 7], patience: 4, rarity: 6, sheet: '02', cell: 2, tone: 'support', short: "控制小偷；每层抵消最多2金币红线损失", detail: "控制相邻小偷，不再产生偷窃躁动，到站额外+5。本人在车内时，整车每层抵消最多2金币红线损失；多位律师不叠加。不能暂停炸弹。" },
  drunk: { kind: 'drunk', name: '醉汉', title: 'The Drifter', weight: 2, fare: 10, energy: 1, trip: [2, 6], patience: 1, rarity: 7, sheet: '02', cell: 3, tone: 'risk', short: '到站前关门时高躁动：基价+100%', detail: '未受护士照护时每层+1躁动。到站前关门时处于高躁动，基价额外+100%，无需额外邻座，不消耗躁动；与教练倍率相加。护士可停止新增躁动，不降低全局已有躁动，但会停止醉汉的坏人链接。', risk: { label: '风险交易', guide: '护士邻座可安抚；音乐家调节全舱' } },
  nurse: { kind: 'nurse', name: '护士', title: 'The Nurse', weight: 1, fare: 5, energy: 1, trip: [3, 7], patience: 4, rarity: 8, sheet: '02', cell: 4, tone: 'support', short: '所有相邻乘客：每层各抵消1躁动', detail: '稳定的轻量照护：所有相邻乘客每层各抵消1点躁动，且自身每层只耗1电。也能阻止相邻醉汉与儿童的负面效果；多位护士可逐人叠加。' },
  child: { kind: 'child', name: '儿童', title: 'The Child', weight: 1, fare: 7, energy: 1, trip: [2, 5], patience: 1, rarity: 7, sheet: '02', cell: 5, tone: 'social', short: '照顾满2层：到站额外+6币', detail: '没有恋人或护士相邻时，每层躁动+1；有照顾者时免除并积累1次照护。累计2次后，到站额外+6金币，不参与倍率；无人照护时进度保留，不重复完成。' },
  ghost: { kind: 'ghost', name: '幽灵', title: 'The Apparition', weight: 0, fare: 4, energy: 0, trip: [4, 9], patience: 5, rarity: 6, sheet: '03', cell: 0, tone: 'occult', short: '0耗电；未受控到3的倍数层，随机1位邻座延误1站', detail: '相邻驱魔师时，不再延误邻座，每位受控幽灵每层抵消1点人物耗电且到站多得2金币；否则到3的倍数层时随机延误一位邻座1站。受控幽灵的节能逐项相加，但不能抵消电梯运转耗电。' },
  exorcist: { kind: 'exorcist', name: '驱魔师', title: 'The Warden', weight: 1, fare: 5, energy: 1, trip: [3, 7], patience: 3, rarity: 6, sheet: '03', cell: 1, tone: 'occult', short: '每位受控幽灵每站节能1电', detail: '控制每位相邻幽灵，分别阻止延误并使其每层抵消1点人物耗电、到站多得2金币。多位幽灵的效果逐个叠加；电梯运转耗电不能被抵消。' },
  coach: { kind: 'coach', name: '教练', title: 'The Coach', weight: 3, fare: 8, energy: 1, trip: [3, 6], patience: 3, rarity: 6, sheet: '03', cell: 2, tone: 'social', short: '每位邻座教练使车费+50%', detail: '非教练乘客抵达时，每位相邻教练增加其本体基价的50%；与恋人配对、醉汉加价等倍率相加，不再放大受控奖励、小费或状态奖励。教练自己抵达时，每位仍在身旁的邻座额外支付3金币。' },
  celebrity: { kind: 'celebrity', name: '名人', title: 'The Celebrity', weight: 1, fare: 12, energy: 1, trip: [4, 8], patience: 2, rarity: 5, sheet: '03', cell: 3, tone: 'risk', short: "恰好1邻座每层+2币；2+邻座+1躁动", detail: "恰好一位邻座时每层赚2金币；至少两位邻座时每层+1躁动。无人相邻无效果。", risk: { label: '条件风险', guide: '保持恰好 1 名邻座' } },
  inspector: { kind: 'inspector', name: '检查员', title: 'The Inspector', weight: 2, fare: 8, energy: 1, trip: [4, 7], patience: 4, rarity: 5, sheet: '03', cell: 4, tone: 'support', short: '连续低躁动2层：到站额外+8币', detail: '连续两次关门时处于低躁动，获得合规印章，到站额外+8金币，不参与倍率。完成前离开低档会重新计数；完成后印章保留，每位检查员只奖励一次。不再检查人物耗电，也不因此增加躁动。' },
  bomb: { kind: 'bomb', name: '炸弹客', title: 'Bomb Timer', weight: 1, fare: 14, energy: 1, trip: [2, 6], patience: 1, rarity: 4, sheet: '03', cell: 5, tone: 'risk', short: "倒计时归零前送达；坏人链接可暂存收益", detail: "基价以卡面为准，倒计时3–6层；到站前归零立即失败，同层归零安全。相邻警察锁住倒计时，也停止坏人链接。未受控时可与小偷、醉汉或炸弹客链接暂存收益。", risk: { label: '致命风险', guide: '与警察相邻：锁住倒计时' } },
  mystery: { kind:'mystery', name:'神秘人', title:'The Mystery', weight:2, fare:0, energy: 1, trip:[2,7], patience:4, rarity:6, sheet:'04', cell:0, tone:'occult', short: "参数与关系随机；8–24金币到站揭晓", detail: "出现时随机耗电、自身躁动、路程与关系；车费均匀抽取8–24金币，封存至到站，请离报价不透露答案。", risk:{label:'风险交易',guide:'查看这一次的协作与冲突对象'} },
  shifter: { kind:'shifter', name:'百变人', title:'The Shifter', weight:2, fare: 22, energy: 1, trip:[4,7], patience:5, rarity:5, sheet:'04', cell:1, tone:'risk', short: "每层换属性；基价看卡面", detail: "每到一层重新抽取耗电1–2、自身躁动0–1、原始车费16–28与协作/冲突对象。短途再按固定比例折算基价。目的地不延长，关门前查看新状态。", risk:{label:'条件风险',guide:'每层查看新状态，留好请离赔偿'} },
  mimic: { kind:'mimic', name:'复制人', title:'The Mimic', weight:1, fare:10, energy: 1, trip:[3,6], patience:4, rarity:6, sheet:'04', cell:2, tone:'occult', short:'↑ 只复制正上方 · 同一人物对不重抽', detail:'只模仿正上方紧邻的乘客，随机复制其基础车费或人物耗电。每位复制人与每位具体来源之间的抽签固定；来回挪动、换列、其他邻座变化均不重抽。换新乘客才是新抽签。上方空缺时恢复本体；隐藏车费仍隐藏。不复制技能、倒计时、路程或已叠加奖励。'} ,
};

export const PASSENGER_ORDER: PassengerKind[] = [
  'commuter', 'tourist', 'courier', 'mechanic', 'lover', 'musician',
  'thief', 'cop', 'drunk', 'nurse', 'child',
  'ghost', 'exorcist', 'coach', 'celebrity', 'inspector', 'bomb', 'mystery', 'mimic',
];

// Lower rarity values mean a lower appearance weight. The material grade also
// recognizes high base fares, but never reads a Mystery rider's hidden fare.
export function passengerCardGrade(kind: PassengerKind): PassengerCardGrade {
  if (['courier','mechanic'].includes(kind)) return 'standard';
  const passenger = PASSENGERS[kind];
  if (passenger.rarity <= 4 || passenger.fare >= 30) return 'legendary';
  if (passenger.rarity <= 6 || passenger.fare >= 20) return 'rare';
  if (passenger.rarity <= 8 || passenger.fare >= 14) return 'fine';
  return 'standard';
}

export const UNLOCK_TIERS: { floor: number; kinds: PassengerKind[] }[] = [
  { floor: 1, kinds: ['commuter', 'tourist', 'courier', 'mechanic', 'lover'] },
  { floor: 6, kinds: ['thief', 'cop'] },
  { floor: 11, kinds: ['drunk', 'nurse', 'child'] },
  { floor: 16, kinds: ['musician'] },
  { floor: 21, kinds: ['ghost', 'exorcist'] },
  { floor: 26, kinds: ['coach', 'inspector'] },
  { floor: 31, kinds: ['mystery', 'celebrity', 'bomb'] },
  { floor: 36, kinds: ['mimic'] },
];

export type UpgradeKey = 'battery' | 'capacity' | 'calm' | 'concierge' | 'reinforced' | 'express' | 'tipjar' | 'relay' | 'crowd' | 'meter';
export const UPGRADES: Record<UpgradeKey, { name: string; label: string; description: string; strategy: string; tone: 'sustain' | 'control' | 'score' | 'capacity' | 'tempo' }> = {
  battery: { name: '默契契约', label: 'COOPERATION', description: '每条实际默契的本人到站奖励额外 +2 金币，多位默契对象分别叠加。本局限装一次。', strategy: '协作收益', tone: 'score' },
  capacity: { name: '扩容电池', label: 'BATTERY CAPACITY', description: '电量上限 +10。只扩容，不赠送电量；可在商店继续充电。本局限装一次。', strategy: '预先准备', tone: 'capacity' },
  calm: { name: '舒缓系统', label: 'CALM SYSTEM', description: '躁动上限 +1，并立即降低 2 躁动。本局限装一次；日常躁动由乘客与站位管理。', strategy: '控场缓冲', tone: 'control' },
  concierge: { name: '礼宾服务', label: 'CONCIERGE', description: '此后新出现的乘客到站小费 +2，不参与车费倍率。本局限装一次。', strategy: '收入投资', tone: 'score' },
  reinforced: { name: '稳压模块', label: 'STABILIZER', description: '关门时至少3人，每站抵消1点人物耗电；不影响电梯运转耗电。本局限装一次。', strategy: '抵消耗电', tone: 'sustain' },
  express: { name: '快速电梯', label: 'EXPRESS', description: '此后新乘客原定路程至少 5 层时，目的地提前 1 层；每局限装一次。', strategy: '长途周转', tone: 'tempo' },
  tipjar: { name: '小费盒', label: 'TIP JAR', description: '每位正常到站且有至少2位邻座的乘客，独立有50%概率额外支付4金币。同层下车者仍互算邻座；额外金币不参与倍率。本局限装一次。', strategy: '到站机会', tone: 'score' },
  relay: { name: '并联回充', label: 'ARRIVAL RELAY', description: '同层至少2位乘客正常到站，50%概率回充4电；每层只抽一次，不超过容量。请离不触发。本局限装一次。', strategy: '同时送达', tone: 'sustain' },
  crowd: { name: '共乘票', label: 'SHARED TICKET', description: '关门时至少4人，且本层有人正常到站，整车额外赚3金币，每层一次。同层到站者计入人数，请离不触发。本局限装一次。', strategy: '载客收入', tone: 'score' },
  meter: { name: '长途计价器', label: 'LONG-RIDE METER', description: '实际乘坐至少5次上行的乘客，正常到站额外支付4金币，每人一次。幽灵延误计入行程，途中和请离不支付。本局限装一次。', strategy: '乘坐时长', tone: 'tempo' },
};

export const ADJACENT: [number, number][] = [[0,1],[1,2],[3,4],[4,5],[0,3],[1,4],[2,5]];

export type PassengerCategory = 'good' | 'bad' | 'special';
export const PASSENGER_CATEGORY_LABELS: Record<PassengerCategory, string> = { good: '好人', bad: '坏人', special: '特殊' };
export function passengerCategory(kind: PassengerKind): PassengerCategory {
  if (['thief', 'drunk', 'bomb'].includes(kind)) return 'bad';
  if (['ghost', 'mystery', 'shifter', 'mimic', 'celebrity', 'inspector'].includes(kind)) return 'special';
  return 'good';
}
