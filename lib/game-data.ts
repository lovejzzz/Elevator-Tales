export type PassengerKind =
  | 'commuter' | 'tourist' | 'courier' | 'mechanic' | 'lover' | 'musician'
  | 'thief' | 'cop' | 'lawyer' | 'drunk' | 'nurse' | 'child'
  | 'ghost' | 'exorcist' | 'coach' | 'celebrity' | 'inspector' | 'bomb'
  | 'mystery' | 'shifter' | 'mimic'
  | 'parcel'
  | LegendKind;

/** v9 legendary riders: one may wait on floor 1 as a fourth card. They ride 1→10,
 * pay no ordinary fare and leave a keepsake when delivered to the first shop. */
export type LegendKind = 'operator' | 'matchmaker' | 'don' | 'matron' | 'nightingale' | 'medium' | 'tycoon' | 'stranger';
export const LEGEND_KINDS: LegendKind[] = ['operator', 'matchmaker', 'don', 'matron', 'nightingale', 'medium', 'tycoon', 'stranger'];
export const isLegend = (kind: string): kind is LegendKind => (LEGEND_KINDS as string[]).includes(kind);

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
  commuter: { kind: 'commuter', name: '通勤者', title: 'The Commuter', weight: 1, fare: 6, energy: 1, trip: [2, 5], patience: 3, rarity: 18, sheet: '01', cell: 0, tone: 'steady', short: '低躁动到站：额外+3金币', detail: '到站前关门时处于低躁动，额外支付3金币，不参与倍率。不消耗躁动，也不要求邻座。' },
  tourist: { kind: 'tourist', name: '游客', title: 'The Tourist', weight: 2, fare: 8, energy: 1, trip: [4, 7], patience: 3, rarity: 10, sheet: '01', cell: 1, tone: 'steady', short: "本人到站：每位邻座+2币；本次关门时中躁动再+3", detail: "基价以卡面为准；每位仍相邻的乘客让本人到站多赚2金币，包括游客与同层到站者。到站前关门时处于中躁动，再支付3金币；两项均不参与倍率。途中不产金币。" },
  courier: { kind: 'courier', name: '快递员', title: 'The Courier', weight: 1, fare: 8, energy: 1, trip: [1, 3], patience: 2, rarity: 4, sheet: '01', cell: 2, tone: 'support', short: '送包裹：纸箱在旁才付钱 · 回 2 电', detail: '会多带一张纸箱卡：普通、稀有或传奇，偶尔是占上下两格的大纸箱，他的卡和箱子同一稀有度。纸箱挨着他（上下左右）时，他到站付车费并为电梯补充2电，箱子越稀有付得越多；没有纸箱时每层+1躁动，到站不付钱也不补电。另一位空手快递员也挨着他的箱子时，两人都+1躁动，他照常付钱。空手时挨着炸弹客会接过炸弹：比炸弹客先下车就带走炸弹、照常付钱，炸弹客变成乔装的通勤者。' },
  mechanic: { kind: 'mechanic', name: '维修工', title: 'The Mechanic', weight: 2, fare: 6, energy: 1, trip: [3, 7], patience: 3, rarity: 5, sheet: '01', cell: 3, tone: 'support', short: '低躁动检修2次：随后4层运转少耗1电', detail: '关门时处于低躁动，检修进度+1；其他状态暂停，不清空进度。完成2次后，随后4次上行运转少耗1电；每位维修工仅完成一次。多位延长时间，最多8层，不增加每层节能量。不消耗躁动。挨着无主纸箱时会拆来当零件：纸箱没了，检修立刻完成。' },
  lover: { kind: 'lover', name: '恋人', title: 'The Lover', weight: 1, fare: 5, energy: 1, trip: [3, 7], patience: 4, rarity: 10, sheet: '01', cell: 4, tone: 'social', short: "每位邻座恋人：到站基价+100%", detail: "有未配对恋人时，每层全车统一15%概率呼唤1位恋人，不按人数叠加。成功时另两位为非恋人，仍可互相作用；未触发时按普通候客规则生成。每位相邻恋人让本人到站基价增加100%，线性叠加；途中不产金币。小费、默契和急躁加价不参与倍率。" },
  musician: { kind: 'musician', name: '音乐家', title: 'The Musician', weight: 2, fare: 6, energy: 1, trip: [2, 5], patience: 3, rarity: 5, sheet: '01', cell: 5, tone: 'social', short: '全舱节拍：向中躁动靠近；中躁动每层+2币', detail: '按关门时状态：低躁动向3提高最多2点，高躁动向4降低最多2点，中躁动不变；关门时处于中躁动，每层演出收入+2金币。多位音乐家不叠加。不单独照护邻座，也不停止坏人合作。节拍后仍会结算人物、红线与到站舒缓；不是保证最终停在中档。' },
  thief: { kind: 'thief', name: '小偷', title: 'The Thief', weight: 1, fare: 5, energy: 1, trip: [2, 6], patience: 2, rarity: 8, sheet: '02', cell: 0, tone: 'risk', short: "每层偷邻座的钱、+1躁动；被警察管住后帮忙降躁动", detail: "未受警察或律师控制时，每层从每位相邻乘客身上偷钱，口袋越鼓偷得越多：名人4，游客、神秘人、百变人3，大多数人2，维修工、护士、儿童、醉汉、驱魔师、检查员、小偷1，幽灵偷不到（警察、律师、教父和传奇人物除外），并增加1躁动；挨着纸箱时不躁动，下车时带走纸箱，给一半箱内金币作小费。受控后不再偷钱，改为每层帮全车−1躁动，到站额外+5金币。与未受控的小偷、醉汉或炸弹客相邻时，双方每层各暂存2金币，高躁动时各存3金币；多邻座不重复，每条链接额外+1躁动；暂存收益只有送达才支付，不参与倍率。", risk: { label: '风险交易', guide: '警察邻座可控' } },
  cop: { kind: 'cop', name: '警察', title: 'The Officer', weight: 2, fare: 6, energy: 1, trip: [3, 7], patience: 4, rarity: 8, sheet: '02', cell: 1, tone: 'support', short: '控制小偷，锁住炸弹倒计时', detail: '同时控制所有相邻小偷。与任意数量的炸弹客相邻期间，分别锁住他们的倒计时。' },
  lawyer: { kind: 'lawyer', name: '律师', title: 'The Counsel', weight: 1, fare: 6, energy: 1, trip: [3, 7], patience: 4, rarity: 6, sheet: '02', cell: 2, tone: 'support', short: "控制小偷；每层抵消最多2金币红线损失", detail: "控制相邻小偷，不再产生偷窃躁动，到站额外+5。本人在车内时，整车每层抵消最多2金币红线损失；多位律师不叠加。不能暂停炸弹。" },
  drunk: { kind: 'drunk', name: '醉汉', title: 'The Drifter', weight: 2, fare: 10, energy: 1, trip: [2, 6], patience: 1, rarity: 7, sheet: '02', cell: 3, tone: 'risk', short: '到站前关门时高躁动：基价+100%', detail: '未受护士照护时每层+1躁动。到站前关门时处于高躁动，基价额外+100%，无需额外邻座，不消耗躁动；与教练倍率相加。护士可停止新增躁动，不降低全局已有躁动，但会停止醉汉的坏人链接。', risk: { label: '风险交易', guide: '护士邻座可安抚；音乐家调节全舱' } },
  nurse: { kind: 'nurse', name: '护士', title: 'The Nurse', weight: 1, fare: 5, energy: 1, trip: [3, 7], patience: 4, rarity: 8, sheet: '02', cell: 4, tone: 'support', short: '所有相邻乘客：每层各抵消1躁动', detail: '稳定的轻量照护：所有相邻乘客每层各抵消1点躁动，且自身每层只耗1电。也能阻止相邻醉汉与儿童的负面效果；多位护士可逐人叠加。' },
  child: { kind: 'child', name: '儿童', title: 'The Child', weight: 1, fare: 7, energy: 1, trip: [2, 5], patience: 1, rarity: 7, sheet: '02', cell: 5, tone: 'social', short: '照顾满2层：到站额外+6币', detail: '没有恋人或护士相邻时，每层躁动+1；有照顾者时免除并积累1次照护。累计2次后，到站额外+6金币，不参与倍率；无人照护时进度保留，不重复完成。挨着纸箱时不躁动，并在下一层把纸箱拆开：箱里的金币或电归你，它的快递员就没箱子了。' },
  ghost: { kind: 'ghost', name: '幽灵', title: 'The Apparition', weight: 0, fare: 3, energy: 0, trip: [5, 10], patience: 5, rarity: 6, sheet: '03', cell: 0, tone: 'occult', short: '0耗电；未受控到3的倍数层，随机1位邻座延误1站', detail: '相邻驱魔师时，不再延误邻座，每位受控幽灵每层抵消1点人物耗电且到站多得2金币；否则到3的倍数层时随机延误一位邻座1站。受控幽灵的节能逐项相加，但不能抵消电梯运转耗电。' },
  exorcist: { kind: 'exorcist', name: '驱魔师', title: 'The Warden', weight: 1, fare: 5, energy: 1, trip: [3, 7], patience: 3, rarity: 6, sheet: '03', cell: 1, tone: 'occult', short: '每位受控幽灵每层抵1人物耗电；不抵运转', detail: '控制每位相邻幽灵，分别阻止延误并使其每层抵消1点人物耗电、到站多得2金币。多位幽灵的效果逐个叠加；电梯运转耗电不能被抵消。' },
  coach: { kind: 'coach', name: '教练', title: 'The Coach', weight: 3, fare: 8, energy: 1, trip: [3, 6], patience: 3, rarity: 6, sheet: '03', cell: 2, tone: 'social', short: '每位邻座教练使车费+50%', detail: '非教练乘客抵达时，每位相邻教练增加其本体基价的50%；与恋人配对、醉汉加价等倍率相加，不再放大受控奖励、小费或状态奖励。教练自己抵达时，每位仍在身旁的邻座额外支付2金币。' },
  celebrity: { kind: 'celebrity', name: '名人', title: 'The Celebrity', weight: 1, fare: 12, energy: 1, trip: [4, 8], patience: 2, rarity: 5, sheet: '03', cell: 3, tone: 'risk', short: "恰好1邻座每层+2币；2+邻座+1躁动", detail: "恰好一位邻座时每层赚2金币；至少两位邻座时每层+1躁动。无人相邻无效果。", risk: { label: '条件风险', guide: '保持恰好 1 名邻座' } },
  inspector: { kind: 'inspector', name: '检查员', title: 'The Inspector', weight: 2, fare: 8, energy: 1, trip: [4, 7], patience: 4, rarity: 5, sheet: '03', cell: 4, tone: 'support', short: '连续3层不在高躁动：到站额外+12币', detail: '连续3次关门时不在高躁动（低或中躁动都算），获得合规印章，到站额外+12金币，不参与倍率。完成前遇到高躁动会重新计数；完成后印章保留，每位检查员只奖励一次。检查员本人不会带躁动。挨着快递员的纸箱时会验货一次：快递员晚一层到站，送达多付5金币。' },
  bomb: { kind: 'bomb', name: '炸弹客', title: 'Bomb Timer', weight: 1, fare: 30, energy: 1, trip: [2, 6], patience: 1, rarity: 4, sheet: '03', cell: 5, tone: 'risk', short: "实时倒计时：归零前送达，车费高、有拆弹奖金", detail: "基价以卡面为准，车费很高。上车后开始实时倒计时：10秒加每站10秒，高躁动时两倍速；到站前归零立即失败。切到别的页面、进商店或打开菜单时暂停，看人物卡时不暂停。相邻警察锁住倒计时，也停止坏人链接。送达时每剩3秒多付1金币拆弹奖金。未受控时可与小偷、醉汉或炸弹客链接暂存收益。空手的快递员挨着时会接过炸弹：快递员先下车就带走炸弹，炸弹客变成乔装的通勤者（车费不变，没有倒计时）。", risk: { label: '致命风险', guide: '与警察相邻：锁住倒计时' } },
  mystery: { kind:'mystery', name:'神秘人', title:'The Mystery', weight:2, fare:0, energy: 1, trip:[2,7], patience:4, rarity:6, sheet:'04', cell:0, tone:'occult', short: "参数与关系随机；8–24金币到站揭晓", detail: "出现时随机耗电、自身躁动、路程与关系；车费均匀抽取8–24金币，封存至到站，请离报价不透露答案。", risk:{label:'风险交易',guide:'查看这一次的协作与冲突对象'} },
  shifter: { kind:'shifter', name:'百变人', title:'The Shifter', weight:2, fare: 22, energy: 1, trip:[4,7], patience:5, rarity:5, sheet:'04', cell:1, tone:'risk', short: "每层换属性；基价看卡面", detail: "每到一层重新抽取自身躁动0–1、原始车费16–28与协作/冲突对象；耗电固定为1。短途再按固定比例折算基价。目的地不延长，关门前查看新状态。", risk:{label:'条件风险',guide:'每层查看新状态，留好请离赔偿'} },
  // v9.16: a Courier's parcel. Not a person: it takes a seat and power, never counts as a neighbour.
  parcel: { kind:'parcel', name:'纸箱', title:'The Parcel', weight:0, fare:0, energy:1, trip:[1,1], patience:9, rarity:0, sheet:'04', cell:0, tone:'support', short:'占座耗电；挨着快递员送达，无主时到站开箱', detail:'快递员的包裹，分普通、稀有、传奇；大纸箱占同一列上下两格。每格每层耗1电，不算任何人的邻座，本身不付钱。和它的快递员一起上车时必须挨着他；它的快递员没上车时，挨着另一位空手快递员也算他的。无主纸箱到站开箱，内容开箱前看不到：随机的金币或电，偶尔是一项能力，箱子越稀有开得越多、出能力的机会越大。小偷挨着会在下车时带走它，给一半金币作小费；小孩挨着会在下一层拆开；维修工会拆无主纸箱当零件，立刻完成检修；检查员验快递员的箱子，快递员晚一层到站、多付5金币；复制人在它正下方会复制一个同样的箱子。' },
  mimic: { kind:'mimic', name:'复制人', title:'The Mimic', weight:1, fare:10, energy: 1, trip:[3,6], patience:4, rarity:6, sheet:'04', cell:2, tone:'occult', short:'↑ 复制正上方乘客的车费', detail:'固定复制正上方紧邻乘客的基础车费；上方空缺时恢复本体车费。隐藏车费仍隐藏。不复制技能、耗电、倒计时、路程或已叠加奖励。正上方是纸箱时，复制一个同样的箱子，下车时打开。'} ,
  operator: { kind:'operator', name:'老周', title:'The Old Operator', weight:0, fare:0, energy:0, trip:[9,9], patience:9, rarity:0, sheet:'04', cell:0, tone:'support', short:'传奇 · 在车时运转耗电−1（满6人时不生效）', detail:'退休电梯工。第1层上车、第10层商店下车，自身不耗电、不付车费。在车时每层运转耗电−1；关门时满6人则当层不帮忙。送达后留下信物「老周的扳手」：配电箱免费升1级，此后每次升级便宜5金币。' },
  matchmaker: { kind:'matchmaker', name:'月老', title:'The Matchmaker', weight:0, fare:0, energy:0, trip:[9,9], patience:9, rarity:0, sheet:'04', cell:0, tone:'social', short:'传奇 · 恋人呼唤50%；邻座到站+3币', detail:'第1层上车、第10层下车，不耗电、不付车费。在车时恋人呼唤概率升至50%，她的每位邻座到站额外+3金币；车内每有一条红线，每层额外+1躁动。信物「红绳」：每条默契到站奖励+2，此后恋人呼唤概率35%。' },
  don: { kind:'don', name:'教父', title:'The Don', weight:0, fare:0, energy:0, trip:[9,9], patience:9, rarity:0, sheet:'04', cell:0, tone:'risk', short:'传奇 · 每层暂存7币；每层+1躁动', detail:'第1层上车、第10层下车，不耗电。在车时每层暂存7金币，送达兑现；每层+1躁动，护士无法抵消。与他相邻的小偷照常赚途中收入但不加躁动。信物「怀表」：坏人链接每层多存1金币，坏人链接躁动每层最多1点。', risk:{label:'风险交易',guide:'用到站舒缓和护士长压住躁动'} },
  matron: { kind:'matron', name:'护士长', title:'The Matron', weight:0, fare:0, energy:0, trip:[9,9], patience:9, rarity:0, sheet:'04', cell:0, tone:'support', short:'传奇 · 全车每层躁动−1', detail:'第1层上车、第10层下车，不耗电、不付车费。在车时全车每层躁动−1、到站舒缓上限+1，低躁动关门时每位到站乘客再+2金币，相邻儿童与醉汉视为受照护；坏人与她相邻时每层+2躁动。信物「查房记录」：躁动上限+2，每次进商店躁动−3，低躁动关门时每位到站乘客再+1金币，检查员印章只需1层。' },
  nightingale: { kind:'nightingale', name:'夜莺', title:'The Nightingale', weight:0, fare:0, energy:0, trip:[9,9], patience:9, rarity:0, sheet:'04', cell:0, tone:'social', short:'传奇 · 中躁动每层+7币', detail:'爵士歌手。第1层上车、第10层下车，不耗电、不付车费。关门时中躁动每层+7金币；低躁动时每层+1躁动。相邻游客多算1位邻座。信物「黑胶唱片」：音乐家提前出现（不必等到16层），中躁动时音乐家演出收入再+2、每位到站乘客小费再+2。' },
  medium: { kind:'medium', name:'灵媒', title:'The Medium', weight:0, fare:0, energy:0, trip:[9,9], patience:9, rarity:0, sheet:'04', cell:0, tone:'occult', short:'传奇 · 幽灵提前出现并受她控制', detail:'第1层上车、第10层下车，不耗电、不付车费。在车时幽灵加入候客，幽灵出现频率翻倍；与她相邻的幽灵视为受控，每位受控幽灵每层降神会收入+3金币；提前出现的幽灵若不受控，照样会延误邻座。信物「招魂铃」：幽灵永久视为受控，不再延误邻座，到站共+5金币。' },
  tycoon: { kind:'tycoon', name:'大亨', title:'The Tycoon', weight:0, fare:0, energy:0, trip:[9,9], patience:9, rarity:0, sheet:'04', cell:0, tone:'steady', short:'传奇 · 预付10币；低躁动无红线送达再付40', detail:'第1层上车、第10层下车，不耗电。第一次上行预付10金币；送达时若关门为低躁动且他身边没有红线，再付40金币。邻座2人以上时每层+1躁动。信物「股票凭证」：每次进商店，未花金币得15%利息，最多+12。' },
  stranger: { kind:'stranger', name:'13号房客', title:'The Stranger', weight:0, fare:0, energy:0, trip:[9,9], patience:9, rarity:0, sheet:'04', cell:0, tone:'occult', short:'传奇 · 每层一个随机小效果', detail:'第1层上车、第10层下车，不耗电、不付车费。每层随机：+2金币、−1躁动、+1电或无事发生。信物：随机获得另一件传奇信物，再加0–20金币。' },
};

export const PASSENGER_ORDER: PassengerKind[] = [
  'commuter', 'tourist', 'courier', 'mechanic', 'lover', 'musician',
  'thief', 'cop', 'drunk', 'nurse', 'child',
  'lawyer', 'ghost', 'exorcist', 'coach', 'celebrity', 'inspector', 'bomb', 'mystery', 'mimic', 'shifter',
];

// Lower rarity values mean a lower appearance weight. The material grade also
// recognizes high base fares, but never reads a Mystery rider's hidden fare.
/** v9.17: a Courier and his box take the box's tier. */
export function riderCardGrade(rider: { kind: PassengerKind; tier?: 'rare' | 'legendary' }): PassengerCardGrade {
  return rider.tier ?? passengerCardGrade(rider.kind);
}
export function passengerCardGrade(kind: PassengerKind): PassengerCardGrade {
  if (isLegend(kind)) return 'legendary';
  if (['courier','mechanic','parcel'].includes(kind)) return 'standard';
  const passenger = PASSENGERS[kind];
  if (passenger.rarity <= 4 || passenger.fare >= 30) return 'rare';
  if (passenger.rarity <= 6 || passenger.fare >= 20) return 'rare';
  if (passenger.rarity <= 8 || passenger.fare >= 14) return 'fine';
  return 'standard';
}

export const UNLOCK_TIERS: { floor: number; kinds: PassengerKind[] }[] = [
  { floor: 1, kinds: ['commuter', 'tourist', 'courier', 'mechanic', 'lover'] },
  { floor: 6, kinds: ['thief', 'cop'] },
  { floor: 11, kinds: ['drunk', 'nurse', 'child'] },
  { floor: 16, kinds: ['musician', 'lawyer'] },
  { floor: 21, kinds: ['ghost', 'exorcist', 'inspector'] },
  { floor: 26, kinds: ['coach'] },
  { floor: 31, kinds: ['mystery', 'celebrity', 'bomb'] },
  { floor: 36, kinds: ['mimic'] },
  { floor: 41, kinds: ['shifter'] },
];

export type UpgradeKey = 'battery' | 'capacity' | 'calm' | 'concierge' | 'reinforced' | 'express' | 'tipjar' | 'relay' | 'crowd' | 'meter' | 'rails' | 'insulation' | 'reservation' | 'single' | 'delay' | 'buffer' | 'soundproof' | 'retime' | 'punchcard' | 'finale' | 'dispatch';
export const UPGRADES: Record<UpgradeKey, { name: string; label: string; description: string; strategy: string; tone: 'sustain' | 'control' | 'score' | 'capacity' | 'tempo' }> = {
  battery: { name: '默契契约', label: 'COOPERATION', description: '每条实际默契的本人到站奖励额外 +2 金币，多位默契对象分别叠加。本局限装一次。', strategy: '协作收益', tone: 'score' },
  capacity: { name: '扩容电池', label: 'BATTERY CAPACITY', description: '已并入配电箱蓄电线路，不再出售。', strategy: '预先准备', tone: 'capacity' },
  calm: { name: '安全余量', label: 'SAFETY MARGIN', description: '躁动上限+2，不自动降低躁动。附带一次手动调节：降低3躁动，每次进商店补满。本局限装一次。', strategy: '控场缓冲', tone: 'control' },
  concierge: { name: '礼宾服务', label: 'CONCIERGE', description: '此后新出现的乘客到站小费 +1，不参与车费倍率。本局限装一次。', strategy: '收入投资', tone: 'score' },
  reinforced: { name: '稳压模块', label: 'STABILIZER', description: '每十层最多5次：关门时至少5人，每站抵消1点人物耗电；不影响电梯运转耗电。本局限装一次。', strategy: '抵消耗电', tone: 'sustain' },
  express: { name: '快速电梯', label: 'EXPRESS', description: '此后新乘客原定路程至少 5 层时，目的地提前 1 层；每局限装一次。', strategy: '长途周转', tone: 'tempo' },
  tipjar: { name: '小费盒', label: 'TIP JAR', description: '每位正常到站且有至少2位邻座的乘客，独立有35%概率额外支付4金币。同层下车者仍互算邻座；额外金币不参与倍率。本局限装一次。', strategy: '到站机会', tone: 'score' },
  relay: { name: '并联回充', label: 'ARRIVAL RELAY', description: '同层至少2位乘客正常到站，50%概率回充3电；每层只抽一次，不超过容量。请离不触发。本局限装一次。', strategy: '同时送达', tone: 'sustain' },
  crowd: { name: '混乘票', label: 'MIXED TICKET', description: '20层起出售。关门时好人、坏人、特殊三类齐全，且本层有人正常到站，额外赚6金币，每层一次。请离不触发，不参与倍率。', strategy: '载客收入', tone: 'score' },
  meter: { name: '长途计价器', label: 'LONG-RIDE METER', description: '实际乘坐至少5次上行的乘客，正常到站额外支付4金币，每人一次。幽灵延误计入行程，途中和请离不支付。本局限装一次。', strategy: '乘坐时长', tone: 'tempo' },
  rails: { name: '滑轨底座', label: 'SLIDING RAILS', description: '每层旧乘客换位可用2次，原为1次。新上客仍可免费调整；复制人与同一人物的抽签不重抽。', strategy: '调整站位', tone: 'control' },
  insulation: { name: '绝缘衬层', label: 'INSULATION', description: '红线不再造成额外耗电（含耗电翻倍）和金币损失，且每条红线每层付1金币“冲突小费”（每层最多3）；红线躁动仍然生效。不抵消人物本身耗电或运转耗电。', strategy: '容忍冲突', tone: 'sustain' },
  reservation: { name: '留座牌', label: 'RESERVATION', description: '每十层可保留1位未上车候客到下一批，占一个候客位。属性与剩余路程不变，不能连续保留同一人。', strategy: '等待时机', tone: 'control' },
  single: { name: '单站检票器', label: 'SINGLE ARRIVAL', description: '本层恰好1位乘客正常到站，额外赚2金币，每层一次。幽灵延误后判断；请离不触发，不参与倍率。', strategy: '错峰到站', tone: 'score' },
  delay: { name: '延时保险', label: 'LONGER FUSE', description: '30层起出售。以后新出现的炸弹客倒计时+1；不改变路程、不重置旧炸弹。', strategy: '危险窗口', tone: 'control' },
  buffer: { name: '惯性飞轮', label: 'INERTIA FLYWHEEL', description: '关门时至少2人，且本层无人到站：运转最多少耗2电。每十层累计最多省4电，到商店重置，不累存；不抵消人物耗电，不储存回充。', strategy: '长途续航', tone: 'capacity' },
  soundproof: { name: '隔音门', label: 'SOUNDPROOF DOOR', description: '每层抵消最多1点普通红线躁动；坏人链接不再产生躁动。不降低已有躁动，不抵消人物自身或急躁带来的躁动。', strategy: '容忍冲突', tone: 'control' },
  retime: { name: '改签印章', label: 'REBOOKING STAMP', description: '每十层一次：选中本层新上客，路程缩短或延长1站，最短1站。车费、倒计时和随机属性不变；撤回不退次数。', strategy: '安排到站', tone: 'tempo' },
  punchcard: { name: '第五张票', label: 'FIFTH RIDER BONUS', description: '每送达第5位乘客，额外获得其基价100%。只算安装后的正常到站；同层按1→6号位计数，不放大其他奖励。', strategy: '安排顺序', tone: 'score' },
  dispatch: { name: '调度印章', label: 'DISPATCH STAMP', description: '每十层两次，每次二选一：保留1位未上车候客到下一批（占一个候客位），或让1位本层新上客路程缩短或延长1站（最短1站）。', strategy: '安排到站', tone: 'tempo' },
  finale: { name: '谢幕礼', label: 'CURTAIN CALL', description: '同层至少2人正常到站，且到站后车内最多剩1人，额外赚8金币，每层一次，不参与倍率。', strategy: '集中到站', tone: 'score' },
};

export const ADJACENT: [number, number][] = [[0,1],[1,2],[3,4],[4,5],[0,3],[1,4],[2,5]];

export type PassengerCategory = 'good' | 'bad' | 'special';
export const PASSENGER_CATEGORY_LABELS: Record<PassengerCategory, string> = { good: '好人', bad: '坏人', special: '特殊' };
export function passengerCategory(kind: PassengerKind): PassengerCategory {
  if (['thief', 'drunk', 'bomb', 'don'].includes(kind)) return 'bad';
  if (['ghost', 'mystery', 'shifter', 'mimic', 'celebrity', 'inspector', 'medium', 'stranger'].includes(kind)) return 'special';
  return 'good';
}
