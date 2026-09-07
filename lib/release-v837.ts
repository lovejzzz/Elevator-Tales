import type {ChangelogEntry} from './changelog';
export const V837_ZH:ChangelogEntry={
 version:'8.37',date:'2026-09-07',title:'公开试玩 checkpoint · 组合与周转',
 summary:'按玩家要求公开当前研究版：20项永久能力、人物下车收款反馈与商店整理。平衡验收尚未完成。',
 changes:[
  '永久能力池10→20项，仍为4个安装位、每店最多购买1项、已购能力不再出现。新增滑轨底座24、绝缘衬层24、留座牌20、单站检票器24、延时保险24、惯性飞轮8、隔音门24、改签印章24、第五张票24、谢幕礼24金币。',
  '滑轨：每层旧客换位1→2次。绝缘：每层最多抵1电红线固定扣电，不抵翻倍或运转。留座：每十层保留1位候客到下一批，不能连续保留同一人。改签：每十层让本层新客提前/延后1站，最短1站，不重抽属性或改倒计时。',
  '单站：恰好1人正常到站+2币。第五张票：每第5位正常送达者额外获得其基价100%，同层按1→6号位。谢幕：至少2人到站、车内最多剩1人时+6币。均不放大其他奖励，请离不触发。',
  '延时保险30层起出售，新炸弹客倒计时+1。惯性飞轮：至少2人且无人到站时，运转最多省2电，每十层累计最多4电，到店重置、不累存、不储存回充。隔音门：每层最多抵1普通红线躁动；关门中/高躁动再抵1坏人链接躁动，不抵自身或高危躁动。',
  '舒缓系统改为安全余量：35币，上限+1，赠一次可延后使用的手动−2躁动，不自动降躁动。共乘票改为混乘票：24币，20层起出售，关门三类人物齐全且有人正常到站时+3币。充电仍2币/电；快速电梯仍45币、原定至少5站缩短1站。',
  '到站人物保留短暂淡出肖像、名字和本人实际金币，显示在门前；整车额外奖励与本人车费分开。商店整理商品和充电区域，增加能力使用状态与针对性条件说明；驱魔师明确只抵人物耗电。',
 ],
 experiments:[
  '冻结候选128次模拟、四种策略各32次，逐步回放通过：108次电力死亡、12次躁动死亡、8次100层仍存活；其中4次同时触及两种死亡条件。不是128位真人，也不是胜率认证。',
  '超过60层分别10/32、22/32、4/32、0/32；长期难度门槛仍未通过。充电对照同时保留救回下一商店与更早躁动死亡的反例，不因有钱缺电就认定金币过剩。',
  '快速电梯当前45币的8组付费对照：4组更早结束、4组同终点；另有条件收益与受控幽灵提前离开损失的测试。没有采用实验降价或新的模拟器默认策略。',
  '当前候选静音浏览器连续玩到40层，由玩家要求暂停并公开；不是完整一局或人类时长验证。观察到小偷/炸弹客链接、教练放大、音乐家控场的收益，也有连续两店为充电放弃升级。',
 ],
 watch:['公开的是可试玩研究 checkpoint，不是平衡完成版。继续检查死亡原因、资金兑现时机、教练/快递员/幽灵的条件强度、检查员触发机会、升级投资空间及音乐家结算文案；完整实玩与20项能力、19人物的价值验收仍待完成。'],
};
export const V837_EN:ChangelogEntry={
 version:'8.37',date:'2026-09-07',title:'Public playtest checkpoint · combinations and turnover',
 summary:'Published at the player’s request:20 permanent abilities, individual departure payouts and shop layout improvements. Balance acceptance remains incomplete.',
 changes:[
  'Ability pool10→20; four slots, one purchase per shop, owned items excluded. New prices: Rails24, Insulation24, Reservation20, Single24, Longer Fuse24, Flywheel8, Soundproof24, Rebooking24, Fifth Ticket24, Curtain Call24.',
  'Rails allows two old-rider moves per floor instead of one. Insulation offsets up to1 fixed red-link power per floor, not doubling or motor. Reservation holds one offer per sector for the next batch, never consecutively. Rebooking adjusts one newly boarded trip±1 per sector, minimum1, without rerolling traits or fuse.',
  'Single pays2 for exactly one normal arrival. Fifth Ticket adds100% base fare every fifth delivery, slot1→6 order. Curtain Call pays6 for at least two arrivals leaving at most one rider. Bonuses do not multiply other rewards or trigger on dismissal.',
  'Longer Fuse appears from30 and gives future Bombers+1 countdown. Flywheel saves up to2 motor with at least two riders and no arrivals, capped4 per sector, reset at shops with no carryover or stored charge. Soundproof offsets1 ordinary red pressure plus1 criminal-link pressure when departing at medium/high; not intrinsic or volatile pressure.',
  'Safety Margin35 replaces automatic calming: cap+1 and a saved one-use−2 control. Mixed Ticket24 replaces Shared Ticket, sold from20: all three categories at departure plus a normal arrival pays3. Charging remains2/power; Express remains45 and shortens originally5+ trips by1.',
  'Departing portraits fade with names and actual individual coins above the doors; global bonuses remain separate. Shop layout and item-specific conditions refined; owned tools show status. Warden wording specifies rider-power savings only.',
 ],
 experiments:[
  'Frozen128-run cohort,32 per policy, passed step replay:108 energy deaths,12 agitation deaths,8 alive at100;4 deaths breach both thresholds. Synthetic runs, not human win rates.',
  'Above60 counts10/32,22/32,4/32,0/32:tail gate still fails. Charge comparisons retain both next-shop rescues and earlier agitation failures. Cash at energy death is not automatically surplus.',
  'Eight paid Express45 pairs:four earlier endpoints, four same. Conditional benefits and controlled-Ghost early-exit losses also covered. Experimental discounts and charging policies were not adopted.',
  'Current muted browser run paused at40 at the player’s publication request; not a full game or human duration measurement. Criminal banking, Coach amplification and Musician support worked conditionally; two shops skipped investment to fund power.',
 ],
 watch:['Playable research checkpoint, not completed balance certification. Death causes, liquidity timing, Coach/Courier/Ghost strength, Inspector access, investment room and Musician timing copy remain under review. Full play and all20-item/19-role value gates are unfinished.'],
};
