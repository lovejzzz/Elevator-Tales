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
  commuter: { kind: 'commuter', name: '通勤者', title: 'The Commuter', weight: 1, fare: 7, energy: 1, trip: [2, 5], patience: 3, rarity: 18, sheet: '01', cell: 0, tone: 'steady', short: '安静、可靠、准时付费', detail: '没有特殊能力。平稳而可靠，是填补空位的可靠选择。' },
  tourist: { kind: 'tourist', name: '游客', title: 'The Tourist', weight: 2, fare: 22, energy: 2, trip: [3, 7], patience: 3, rarity: 10, sheet: '01', cell: 1, tone: 'steady', short: '长途，但报酬丰厚', detail: '每站耗2电，抵达后提供较高车费。' },
  courier: { kind: 'courier', name: '快递员', title: 'The Courier', weight: 1, fare: 6, energy: 1, trip: [1, 3], patience: 2, rarity: 9, sheet: '01', cell: 2, tone: 'support', short: '短途快速周转', detail: '目的地很近，适合迅速赚取车费并腾出座位。' },
  mechanic: { kind: 'mechanic', name: '维修工', title: 'The Mechanic', weight: 2, fare: 7, energy: 1, trip: [3, 7], patience: 3, rarity: 7, sheet: '01', cell: 3, tone: 'support', short: `每位每层节能${MECHANIC_SAVING}电 · 可叠加`, detail: `每位维修工每层抵消${MECHANIC_SAVING}点人物耗电，多位逐个叠加。维修工本人耗1电；节能总量最多抵完本层人物耗电，不能抵消电梯运转的1电，也不会倒充电。` },
  lover: { kind: 'lover', name: '恋人', title: 'The Lover', weight: 1, fare: 6, energy: 1, trip: [3, 7], patience: 4, rarity: 10, sheet: '01', cell: 4, tone: 'social', short: '每位邻座恋人：每站+1币，到站基价+100%', detail: '独处时，每层有25%概率让下一批候选出现另一位恋人。回应者会带有专属标记。每位相邻恋人都让本人每层多赚1金币、到站基础车费增加100%；多条恋人连接线性叠加，小费不参与倍率。' },
  musician: { kind: 'musician', name: '音乐家', title: 'The Musician', weight: 1, fare: 8, energy: 1, trip: [4, 8], patience: 3, rarity: 7, sheet: '01', cell: 5, tone: 'social', short: '车内 ≥4人：每层躁动 −1', detail: '车内至少有4名乘客时，每层降低1点躁动；也能安抚醉汉与儿童。' },
  thief: { kind: 'thief', name: '小偷', title: 'The Thief', weight: 1, fare: 5, energy: 1, trip: [3, 7], patience: 2, rarity: 8, sheet: '02', cell: 0, tone: 'risk', short: '未控制 +3 金币/层 · 偶数层 +1 躁动', detail: '未受控制时每层赚3金币、每两层增加1躁动。相邻警察或律师后每层赚1金币且不再制造躁动，抵达再奖励5金币。', risk: { label: '风险交易', guide: '警察 / 律师邻座可控' } },
  cop: { kind: 'cop', name: '警察', title: 'The Officer', weight: 2, fare: 8, energy: 1, trip: [3, 7], patience: 4, rarity: 8, sheet: '02', cell: 1, tone: 'support', short: '控制小偷，延缓炸弹', detail: '控制相邻小偷。与炸弹相邻时，炸弹每两层暂停一次倒计时。' },
  lawyer: { kind: 'lawyer', name: '律师', title: 'The Counsel', weight: 1, fare: 10, energy: 1, trip: [3, 7], patience: 4, rarity: 6, sheet: '02', cell: 2, tone: 'support', short: '控制小偷，每站耗1电', detail: '控制相邻小偷，并让其抵达时获得额外车费；不能延缓炸弹。' },
  drunk: { kind: 'drunk', name: '醉汉', title: 'The Drifter', weight: 2, fare: 14, energy: 1, trip: [2, 6], patience: 1, rarity: 7, sheet: '02', cell: 3, tone: 'risk', short: '未安抚每层 25% 闹事 · 躁动 +2', detail: '高额底价补偿风险。被音乐家或护士安抚时每层再赚1金币；否则有25%概率增加2躁动并随机换位。', risk: { label: '风险交易', guide: '音乐家 / 护士邻座可安抚' } },
  nurse: { kind: 'nurse', name: '护士', title: 'The Nurse', weight: 2, fare: 9, energy: 1, trip: [3, 7], patience: 4, rarity: 7, sheet: '02', cell: 4, tone: 'support', short: '每逢偶数层：躁动 −1', detail: '每逢偶数层降低1点躁动，并安抚相邻的醉汉与儿童。' },
  child: { kind: 'child', name: '儿童', title: 'The Child', weight: 1, fare: 7, energy: 1, trip: [2, 5], patience: 1, rarity: 7, sheet: '02', cell: 5, tone: 'social', short: '无照顾者：偶数层躁动 +1', detail: '没有恋人、音乐家或护士相邻时，每逢偶数层躁动+1；有任意照顾者相邻时免除。' },
  ghost: { kind: 'ghost', name: '幽灵', title: 'The Apparition', weight: 0, fare: 8, energy: 0, trip: [4, 9], patience: 5, rarity: 6, sheet: '03', cell: 0, tone: 'occult', short: '不耗电，但会延误邻座', detail: '相邻驱魔师时，不再延误邻座，每位受控幽灵每层抵消1点人物耗电且到站多得6金币；否则到3的倍数层时随机延误一位邻座1站。所有节能逐项相加，但电梯运转仍至少耗1电。' },
  exorcist: { kind: 'exorcist', name: '驱魔师', title: 'The Warden', weight: 1, fare: 9, energy: 1, trip: [3, 7], patience: 3, rarity: 6, sheet: '03', cell: 1, tone: 'occult', short: '每位受控幽灵每站节能1电', detail: '控制每位相邻幽灵，分别阻止延误并使其每层抵消1点人物耗电、到站多得6金币。多位幽灵的效果逐个叠加；电梯运转仍至少耗1电。' },
  coach: { kind: 'coach', name: '教练', title: 'The Coach', weight: 3, fare: 20, energy: 2, trip: [4, 8], patience: 3, rarity: 6, sheet: '03', cell: 2, tone: 'social', short: '每位邻座教练使车费+50%', detail: '非教练乘客抵达时，每位相邻教练都让其基础车费提高50%，线性叠加，小费不参与倍率；教练自己抵达时，每名仍在身旁的邻座额外支付3金币。' },
  celebrity: { kind: 'celebrity', name: '名人', title: 'The Celebrity', weight: 1, fare: 18, energy: 1, trip: [4, 8], patience: 2, rarity: 5, sheet: '03', cell: 3, tone: 'risk', short: '恰好 1 邻座 +3 金币/层 · 2+ 邻座会加压', detail: '恰好一名邻座时每层赚3金币；两名以上邻座时只在偶数层增加1躁动。', risk: { label: '条件风险', guide: '保持恰好 1 名邻座' } },
  inspector: { kind: 'inspector', name: '检查员', title: 'The Inspector', weight: 2, fare: 12, energy: 1, trip: [4, 8], patience: 4, rarity: 5, sheet: '03', cell: 4, tone: 'risk', short: '偶数层：总耗电≤4则+1币，超过则躁动+1', detail: '偶数层检查整趟耗电：运转＋所有人物耗电−节能，总计不超过4电时奖励1金币，否则躁动+1。检查员本人也耗1电；稳压和节能能帮助通过检查。', risk: { label: '条件风险', guide: '偶数层总耗电尽量不超过4' } },
  bomb: { kind: 'bomb', name: '炸弹客', title: 'The Fuse', weight: 1, fare: 26, energy: 1, trip: [2, 6], patience: 1, rarity: 4, sheet: '03', cell: 5, tone: 'risk', short: '引信归零则本局立即结束', detail: '高额悬赏补偿整局失败风险。上车时获得3–6格引信；到站前归零会结束本局，警察可让倒计时每两层暂停一次。', risk: { label: '致命风险', guide: '警察邻座可延缓引信' } },
  mystery: { kind:'mystery', name:'神秘人', title:'The Mystery', weight:2, fare:0, energy: 1, trip:[2,7], patience:4, rarity:6, sheet:'04', cell:0, tone:'occult', short:'参数与关系随机 · 到站才揭晓车费', detail:'每次出现随机人物耗电、自身躁动、路程与协作/冲突对象。车费在生成时封存，到站才揭晓；请离赔偿不透露隐藏车费。', risk:{label:'风险交易',guide:'查看这一次的协作与冲突对象'} },
  shifter: { kind:'shifter', name:'百变人', title:'The Shifter', weight:2, fare:36, energy: 1, trip:[4,7], patience:5, rarity:5, sheet:'04', cell:1, tone:'risk', short:'每到一层换属性 · 高额车费', detail:'每到一层重新抽取人物耗电、自身躁动、车费与协作/冲突关系；开门后先看新状态再决定去留。目的地不延长；耗电和躁动会随新属性立即变化。', risk:{label:'条件风险',guide:'每层查看新状态，留好请离赔偿'} },
  mimic: { kind:'mimic', name:'复制人', title:'The Mimic', weight:1, fare:10, energy: 1, trip:[3,6], patience:4, rarity:6, sheet:'04', cell:2, tone:'occult', short:'每位邻座复制一项 · 随邻座改变', detail:'随机分配人物耗电、车费、躁动（含联动偏好）三类属性，每位邻座复制一项，最多三项且不重复。相同邻座组合不会重新抽签；复制人的来源取本体，避免递归。隐藏车费仍然隐藏。不复制技能、引信或路程。'} ,
};

export const PASSENGER_ORDER: PassengerKind[] = [
  'commuter', 'tourist', 'courier', 'mechanic', 'lover', 'musician',
  'thief', 'cop', 'lawyer', 'drunk', 'nurse', 'child',
  'ghost', 'exorcist', 'coach', 'celebrity', 'inspector', 'bomb', 'mystery', 'shifter', 'mimic',
];

// Lower rarity values mean a lower appearance weight. The material grade also
// recognizes high base fares, but never reads a Mystery rider's hidden fare.
export function passengerCardGrade(kind: PassengerKind): PassengerCardGrade {
  const passenger = PASSENGERS[kind];
  if (passenger.rarity <= 4 || passenger.fare >= 30) return 'legendary';
  if (passenger.rarity <= 6 || passenger.fare >= 20) return 'rare';
  if (passenger.rarity <= 8 || passenger.fare >= 14) return 'fine';
  return 'standard';
}

export const UNLOCK_TIERS: { floor: number; kinds: PassengerKind[] }[] = [
  { floor: 1, kinds: ['commuter', 'tourist', 'courier', 'mechanic', 'lover', 'musician', 'thief', 'cop'] },
  { floor: 10, kinds: ['lawyer', 'drunk', 'nurse', 'child', 'coach', 'mystery'] },
  { floor: 20, kinds: ['shifter', 'mimic'] },
  { floor: 25, kinds: ['ghost', 'exorcist', 'inspector'] },
  { floor: 40, kinds: ['celebrity', 'bomb'] },
];

export type UpgradeKey = 'battery' | 'solar' | 'calm' | 'concierge' | 'reinforced' | 'express';
export const UPGRADES: Record<UpgradeKey, { name: string; label: string; description: string; strategy: string; tone: 'sustain' | 'control' | 'score' | 'capacity' | 'tempo' }> = {
  battery: { name: '默契契约', label: 'COOPERATION', description: '每级使每条协作连接的到站奖励再 +2 金币，并解锁协作送达舒缓。每位协作乘客送达都可舒缓，强度不随等级叠加；购买时不立即舒缓。', strategy: '协作控场', tone: 'control' },
  solar: { name: '节能线路', label: 'ECO CIRCUIT', description: '到4的倍数层抵消1点人物耗电。与维修工、受控幽灵的节能逐项相加；稳压先算，所有节能最多抵完人物耗电。电梯运转仍至少耗1电。限装一次。', strategy: '长期节能', tone: 'sustain' },
  calm: { name: '舒缓系统', label: 'CALM SYSTEM', description: '躁动上限 +3，并立即降低 6 躁动。', strategy: '控场缓冲', tone: 'control' },
  concierge: { name: '礼宾服务', label: 'CONCIERGE', description: '此后新乘客到站小费 +3，可叠加；不参与车费倍率。', strategy: '收入投资', tone: 'score' },
  reinforced: { name: '稳压模块', label: 'STABILIZER', description: '每站抵消1点人物耗电；不影响电梯运转1电。本局限装一次。', strategy: '抵消耗电', tone: 'sustain' },
  express: { name: '快速电梯', label: 'EXPRESS', description: '此后新乘客原定路程至少 5 层时，目的地提前 1 层；每局限装一次。', strategy: '长途周转', tone: 'tempo' },
};

export const ADJACENT: [number, number][] = [[0,1],[1,2],[3,4],[4,5],[0,3],[1,4],[2,5]];
