import type {ChangelogEntry} from './changelog';

export const V831_ZH: ChangelogEntry = {
 version:'8.31',date:'2026-09-05',title:'送达，才算赚到',
 summary:'人物逐步加入，候客成组产生关系；危险协作可以暂存收益。收入、续航、请离和四个安装位一起形成经营取舍。此版为本地大改候选。',
 changes:[
  '人物分为好人（绿）、坏人（红）、特殊（金）。类别不代表安全或强弱；稀有度以纹理、双边框和反光材质区分。特殊人物有短揭晓音型，静音和快速开门均受尊重；音效静音现在跨刷新保留。',
  '开局5种人物；6层加入小偷/警察，11层醉汉/护士/儿童，16层音乐家/律师，21层幽灵/驱魔师，31层教练/检查员，36层神秘人，41层名人/炸弹客，46层百变人/复制人。每批至少一组关系；21层后30%尝试冲突关系，不保证安全。供给不读取金币或危急状态。',
  '17层起可能高危，17–19等维修前3层至少一位高危；每批始终至少一位非高危，但其自身可能有风险。高危加价8→4，改为不参与倍率。机会概率上限55%，不再把后期变成三张全高危。',
  '车费：游客18→10、维修工7→4、恋人6→5、音乐家14→6、警察8→6、律师10→6、醉汉14→10、护士8→5、幽灵8→4、驱魔师9→5、教练20→10、名人18→12、检查员12→8、炸弹26→20。神秘人8–40→8–24，百变人28–48→16–28。其他基价不变。',
  '游客每邻座每层+1改为到站每邻座+2，不参与倍率；恋人保留每邻座基价+100%，取消途中收入。默契基础奖励3→1，契约仍额外+2。未受控小偷每层4→3；受控小偷和被安抚醉汉取消途中收入。名人每层3→2。',
  '小偷、醉汉、炸弹客的未受控相邻关系：每位成员每次上行暂存2币（多邻座不重复），每条链接额外+1躁动，护理不抵消这条额外压力。送达兑现，请离放弃；控制小偷/炸弹或安抚醉汉停止链接，但已存收益保留。醉汉的躁动≥3且2+邻座基价+100%仍保留。',
  '律师在车内时，整车每层红线金币损失最多抵消2币，多位不叠加。受控幽灵每层节能2→1、到站额外6→2；维修工仍抵消2点人物耗电，不能抵消运转。检查员改查人物与红线的净耗电≤3，不含运转；合格每层+1币，否则+1躁动，避免后期自动失效。',
  '前20层运转仍1电，21–30层2电，此后每十层+1；初始50电、容量60和商店补5电不变。规则开局公开，界面显示本段/下段运转，预报包含实际耗电。不是按玩家表现动态加难。',
  '每十层最多请离2位，进店恢复；赔偿仍4+剩余站数×2，拒绝候客不消耗次数。请离不领取车费、暂存收益、到站舒缓或回充。',
  '10项永久能力中本局最多装4项，每店仍最多买1项，不能拆换；已装不重复。礼宾小费3→2；稳压须至少3人；共乘票改为4+人且有人到站时整车+3；长途计价改为坐满5次上行到站+4/人。小费盒50%额外4币、并联50%回4电不变。',
  '所有价格固定，不按楼层涨价：契约/回收/小费盒/并联30、舒缓35、礼宾/共乘40、稳压/快速45、长途25；充电2币/电，舒缓8币/点。紧急维修主按钮在付得起时执行最低抢救，付不起结束需再次确认。修复负收入反馈的“+-”显示。',
 ],
 experiments:[
  '新版19项专项回归覆盖12000批候客、12000次混合结算及1024种升级持有组合；原有4000次资源预报回归保留，旧版固定数值断言按新设计更新。',
  '多轮开发实验发现：单改收入并改善组合供给会放大滚雪球；增加可见区间用电预算后，规划策略能保留少量长跑。开发样本用于调试，不当真人胜率；最终独立种子与界面记录见本地验收报告。',
 ],
 watch:['尚未完成真人难度与25–40分钟时长校准。重点观察能源死亡是否过于单一、四个安装位是否太早锁定、危险协作能否自然兑现，以及新人物出现后是否有真正可用的机会。旧版第四局在277层存活截尾，不记成死亡。'],
};
export const V831_EN: ChangelogEntry = {
 version:'8.31',date:'2026-09-05',title:'Paid on delivery',
 summary:'Gradual introductions, linked encounter packets and banked risk rewards. Income, range, dismissals and four installation slots now compete. Local overhaul candidate.',
 changes:[
  'Good, Bad and Special cards use green, red and gold. Category is not safety or power. Material grain, double edges and foil distinguish grade. Specials get short reveal cues; mute and quick reveal are respected. Sound mute persists across reloads.',
  'Start with 5 roles. Thief/Officer at 6; Drunk/Nurse/Child at 11; Musician/Lawyer at 16; Ghost/Exorcist at 21; Coach/Inspector at 31; Mystery at 36; Celebrity/Bomb at 41; Shifter/Mimic at 46. Packets include a relationship. From 21, 30% try a conflict partner. No resource-based rescue draws.',
  'High risk starts at 17. The final 3 floors before maintenance have at least one high-risk offer; every packet retains an ordinary offer, though its role may be dangerous. High-risk premium 8→4 and is no longer multiplied; random high-risk chance caps at 55%.',
  'Base fares: Tourist 18→10, Mechanic 7→4, Lover 6→5, Musician 14→6, Officer 8→6, Lawyer 10→6, Drunk 14→10, Nurse 8→5, Ghost 8→4, Exorcist 9→5, Coach 20→10, Celebrity 18→12, Inspector 12→8, Bomb 26→20. Mystery range 8–40→8–24; Shifter 28–48→16–28. Others unchanged.',
  'Tourists earn 2 per neighbor on delivery, not 1 per floor; not multiplied. Lovers retain +100% base fare per Lover neighbor but lose travel income. Base bond bonus 3→1; pact still adds 2. Uncontrolled Thief travel income 4→3. Controlled Thieves and calmed Drunks lose travel income. Celebrity income 3→2.',
  'Adjacent uncontrolled Thieves, Drunks and Bomb Carriers each bank 2 coins per ascent, once per member regardless of degree. Each link adds 1 agitation beyond care. Delivery pays; dismissal forfeits. Control or calming the relevant rider stops its links without losing existing savings. Drunk appetite still adds 100% base fare at agitation ≥3 with 2+ neighbors.',
  'A Lawyer prevents up to 2 red-link coin loss per floor cabin-wide; does not stack. Each controlled Ghost saves 1 power instead of 2 and receives 2 extra arrival coins instead of 6. Mechanics still save 2 passenger power; motor costs cannot be offset. Inspector now checks net rider and red-link power ≤3, excluding the motor: +1 coin if compliant, otherwise +1 agitation, so route scaling cannot make compliance impossible.',
  'Motor: 1 power through 20, 2 on 21–30, then +1 per ten floors. Initial 50, capacity 60 and shop recharge 5 are unchanged. Schedule is announced at start and current/next sector costs are visible; no performance-based scaling.',
  'Up to 2 paid dismissals per sector, restored at shops. Compensation remains 4 + 2×remaining floors. Declining an offer uses no allowance. Dismissals never grant fares, banked rewards, relief or recovery.',
  'Choose at most 4 permanent abilities from 10; one per shop, no replacements or repeat installed offers. Concierge tip 3→2. Stabilizer requires 3+ riders. Shared Ticket pays 3 only with 4+ riders and an arrival. Long-Ride Meter pays 4 per rider after 5+ actual ascents on delivery. Tip Jar and Relay remain 50% chances for 4 coins and 4 power respectively.',
  'Fixed prices: Pact/Reclaimer/Tip Jar/Relay 30; Calm 35; Concierge/Shared Ticket 40; Stabilizer/Express 45; Meter 25. Charging 2/power and soothing 8/point. No price scaling. Affordable emergency repair is the primary action; ending when unaffordable needs confirmation. Negative income feedback uses a single correct sign.',
 ],
 experiments:['19 new regression groups cover 12000 packets, 12000 mixed settlements and 1024 upgrade combinations. Existing 4000 forecast cases remain; version-specific expected values are updated deliberately.','Development samples exposed snowballing from easier combinations and the need for sector energy budgeting. Synthetic outcomes are not human win rates. Final holdout and UI records are documented in the local acceptance report.'],
 watch:['Human difficulty and 25–40 minute duration are not yet calibrated. Watch energy-heavy failures, early slot lock-in, natural risk payouts and usable role opportunities. The old fourth game is alive-censored at floor 277, not a death.'],
};
