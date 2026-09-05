import fs from 'node:fs';
import { CHANGELOG_EN } from '../lib/changelog';
import { initialRun, type Rider } from '../lib/game-engine';
import { PASSENGERS, PASSENGER_ORDER, UPGRADES } from '../lib/game-data';
import { I18N_CORE_SAMPLES, translateGameText } from '../lib/i18n';
import { planPlacement } from '../lib/game-interaction';
import { PASSENGER_RULES, SHARED_SAVING_RULE, passengerBrief, passengerCardRules, passengerCardSections, passengerFace } from '../lib/passenger-presentation';

if(!translateGameText(PASSENGERS.bomb.detail,'en').startsWith('Base fare 14,'))throw Error('Bomb detail must translate the current base fare, not the historical 20');

const dynamicSamples = [
  '商店舒缓 −1 躁动，支付 8 金币。',
  '商店舒缓 −6 躁动，支付 48 金币。',
  '修复至上限以下 · 24 金币',
  '躁动上限 7；安装时立即舒缓2点，本局唯一',
  '下一站耗 4 电＝运转 1＋人物 3−节能 0＋可能补电 0–4；并联回充50%，不保证续航',
  '当前楼层 · BEST 27',
  '距离 30 层商店还有 3 站',
  '下一站耗 5 电＝运转 1＋人物 7−节能 3',
  '下一层不变 · 宽松 −1 · 休整 3→2，免疲劳',
  '查看已装升级，共 3 次',
  '还剩 5 站',
  '到站金币 14',
  '每站耗电 2',
  '到站补充2电（不超过上限）',
  '任何邻座 ×3 · +3币/层',
  '快递员电池包 +2',
  '空驶休整剩余 2 次，查看规则',
  '已请离 · 赔偿 10 金币',
  '恋人的呼唤得到了回应。把两人安排在相邻站位。',
  '电量耗尽，轿厢停在了楼层之间。',
  '躁动突破上限，午夜班次失控。',
];
const runtimeFaceSamples=PASSENGER_ORDER.flatMap((kind)=>[0,10].flatMap((agitation)=>{
  const run=initialRun();
  run.stress=agitation;
  const rider:Rider={kind,id:`i18n-${kind}-${agitation}`,destination:5,boardedAt:1,patience:0,fareBonus:0,fuse:kind==='bomb'?4:undefined};
  run.cabin=[rider,null,null,null,null,null];
  const face=passengerFace(rider,run);
  return [...face.energy,face.moneyNote,...face.pressure,face.special,...face.conflicts];
}));
const compactCardSamples=PASSENGER_ORDER.flatMap((kind)=>{
  const run=initialRun();
  const passenger:Rider={kind,id:`compact-${kind}`,destination:5,boardedAt:1,patience:0,fareBonus:0,fuse:kind==='bomb'?4:undefined};
  const sections=passengerCardSections(passenger,run);
  return [
    ...sections.self.map(effect=>effect.text),
    ...sections.greenBonus.map(effect=>effect.text),
    ...[...sections.green,...sections.red].flatMap(section=>[section.targetLabel??'',...(section.targets??[]).map(target=>PASSENGERS[target].name),...section.effects.map(effect=>effect.text)]),
  ];
});
const detailCardSamples=PASSENGER_ORDER.flatMap((kind)=>{
  const run=initialRun();
  const passenger:Rider={kind,id:`detail-${kind}`,destination:5,boardedAt:1,patience:0,fareBonus:0,fuse:kind==='bomb'?4:undefined};
  run.cabin=[passenger,null,null,null,null,null];
  const blocks=passengerCardRules(passenger,run.cabin,3,1,1);
  const brief=passengerBrief(passenger,1,run.cabin,3,1,1);
  return [...blocks.flatMap(block=>[block.heading,...block.lines,block.note??'']),...brief.detailRules];
});
const corpus = [
  ...I18N_CORE_SAMPLES,
  ...dynamicSamples,
  ...runtimeFaceSamples,
  ...compactCardSamples,
  ...detailCardSamples,
  ...PASSENGER_ORDER.flatMap((kind)=>Array.from({length:8},(_,copySeed)=>{
    const run=initialRun();
    const above:Rider={kind,id:'i18n-source',destination:5,boardedAt:1,patience:0,fareBonus:0};
    run.cabin=[above,null,null,null,null,null];
    const mimic:Rider={...above,kind:'mimic',id:'i18n-copy',copySeed};
    const result=planPlacement(run,mimic,3);
    return [result.label,result.next.message];
  }).flat()),
  '危险协作已连接',
  ...[2,3].map(amount=>`成员每层暂存${amount}金币，每条链接+1躁动；送达兑现，请离放弃。`),
  '当前位置没有正上方来源，恢复复制人本体数值。',
  ...Object.values(PASSENGERS).flatMap((rider) => [rider.name, rider.short, rider.detail, rider.risk?.label ?? '', rider.risk?.guide ?? '']),
  ...Object.values(UPGRADES).flatMap((upgrade) => [upgrade.name, upgrade.description, upgrade.strategy]),
  ...Object.values(PASSENGER_RULES).flat(),
  SHARED_SAVING_RULE,
];
const cjk = /[\u3400-\u9fff]/u;
const failures = corpus.filter(Boolean).map((source) => ({ source, translated: translateGameText(source, 'en') })).filter(({ translated }) => cjk.test(translated));

if (failures.length) {
  console.error(`English localization has ${failures.length} untranslated rules:\n${failures.map(({ source, translated }) => `${source} => ${translated}`).join('\n')}`);
  process.exit(1);
}
if (CHANGELOG_EN.some((entry) => cjk.test(JSON.stringify(entry).replaceAll('中文', 'Chinese')))) throw new Error('English changelog contains Chinese text beyond the language-switch label.');
if (!fs.readFileSync('app/layout.tsx', 'utf8').includes('<html lang="en"')) throw new Error('Default document language must be English.');
if (!fs.readFileSync('README.md', 'utf8').includes('The game opens in English.')) throw new Error('README must document the English default.');
console.log(`English localization verified: ${corpus.length} rider, rule, upgrade, and interface samples; ${CHANGELOG_EN.length} releases.`);
