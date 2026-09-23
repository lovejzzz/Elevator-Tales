import type { PassengerKind } from './game-data';

type Line = [string, string];
/** Short in-character lines: said on boarding (sometimes) and on getting off. Flavour only. */
export const QUIPS: Record<PassengerKind, { board: Line[]; arrive: Line[] }> = {
  parcel: { board: [['……', '…']], arrive: [['（纸箱被打开了）', '(The parcel is opened)']] },
  commuter: { board: [['又是这一班。', 'Same lift again.'], ['别叫醒我。', 'Don’t wake me.']], arrive: [['明天见。', 'See you tomorrow.'], ['准点，谢了。', 'On time. Thanks.']] },
  tourist: { board: [['这层的地毯好看！', 'Lovely carpet here!'], ['可以拍一张吗？', 'Mind if I take a photo?']], arrive: [['下一层还会更漂亮吗？', 'Is the next floor prettier?'], ['拍到了！', 'Got the shot!']] },
  courier: { board: [['加急件，快点。', 'Rush parcel, hurry.'], ['签收在上面。', 'Signature’s upstairs.']], arrive: [['送达！', 'Delivered!'], ['电给你留了点。', 'Left you some charge.']] },
  mechanic: { board: [['听，电机在咳嗽。', 'Hear that cough?'], ['别晃，我在听。', 'Keep it steady, I’m listening.']], arrive: [['修好了，别谢。', 'Fixed. Don’t mention it.'], ['老家伙还能撑。', 'The old thing will hold.']] },
  lover: { board: [['你见过一个人吗？', 'Have you seen someone?'], ['是这一层吗？', 'Is it this floor?']], arrive: [['找到了……', 'Found them…'], ['谢谢你等我。', 'Thanks for waiting.']] },
  musician: { board: [['这嗡鸣是降 B 调。', 'That hum is a B-flat.'], ['给我四拍。', 'Give me four beats.']], arrive: [['下一场见。', 'Catch the next set.'], ['谢幕。', 'Curtain.']] },
  thief: { board: [['我什么都没拿。', 'I didn’t take anything.'], ['好表。', 'Nice watch.']], arrive: [['后会有期。', 'Until next time.'], ['口袋检查一下？', 'Check your pockets?']] },
  cop: { board: [['都站好。', 'Everyone stand still.'], ['我盯着呢。', 'I’m watching.']], arrive: [['治安良好。', 'All in order.'], ['收工。', 'Shift over.']] },
  lawyer: { board: [['按规定，请靠边。', 'Per regulation, step aside.'], ['我记下了。', 'Noted.']], arrive: [['合同已履行。', 'Contract fulfilled.'], ['账单稍后寄到。', 'Invoice to follow.']] },
  drunk: { board: [['就是这里……吧？', 'This is it… right?'], ['嗝。', '*hic*']], arrive: [['到家啦！', 'Home at last!'], ['不是这里。算了。', 'Wrong floor. Whatever.']] },
  nurse: { board: [['谁不舒服？', 'Who’s not feeling well?'], ['深呼吸。', 'Deep breaths.']], arrive: [['保重。', 'Take care.'], ['下一床。', 'Next patient.']] },
  child: { board: [['按钮可以我来按吗？', 'Can I press the button?'], ['兔子也要坐。', 'Bunny rides too.']], arrive: [['再坐一次！', 'Again!'], ['谢谢叔叔！', 'Thank you, mister!']] },
  ghost: { board: [['……', '…'], ['好冷啊。', 'So cold.']], arrive: [['我想起来了。', 'I remember now.'], ['晚安。', 'Goodnight.']] },
  exorcist: { board: [['有东西跟着我们。', 'Something follows us.'], ['别怕。', 'Don’t be afraid.']], arrive: [['它该下车了。', 'Its stop, too.'], ['愿你安宁。', 'Rest easy.']] },
  coach: { board: [['打起精神！', 'Look alive!'], ['你可以的！', 'You’ve got this!']], arrive: [['干得漂亮！', 'Nice work!'], ['下一组！', 'Next set!']] },
  celebrity: { board: [['别拍照。', 'No photos.'], ['只要一个人陪我。', 'Just one of you, please.']], arrive: [['亲一个。', 'Kisses.'], ['别告诉别人。', 'Don’t tell anyone.']] },
  inspector: { board: [['保持安静。', 'Keep it quiet.'], ['我在记录。', 'I’m taking notes.']], arrive: [['合格。', 'Passed.'], ['盖章。', 'Stamped.']] },
  bomb: { board: [['别碰这个箱子！', 'Don’t touch the case!'], ['快，快，快。', 'Faster, faster.']], arrive: [['赶上了……', 'Made it…'], ['呼——', 'Phew—']] },
  mystery: { board: [['你没见过我。', 'You never saw me.'], ['信封别拆。', 'Don’t open the envelope.']], arrive: [['车费在这。', 'Here’s your fare.'], ['我们两清了。', 'We’re square.']] },
  shifter: { board: [['今晚我是谁？', 'Who am I tonight?'], ['换张脸。', 'New face.']], arrive: [['下次认不出我。', 'You won’t know me next time.'], ['再会。', 'Adieu.']] },
  mimic: { board: [['你说什么，我说什么。', 'I say what you say.'], ['学得像吗？', 'Good likeness?']], arrive: [['谢谢——谢谢。', 'Thanks—thanks.'], ['我也到了。', 'My stop too.']] },
  operator: { board: [['我来暖暖电机。', 'Let me warm the motor.'], ['四十年了。', 'Forty years.']], arrive: [['交给你了，孩子。', 'She’s yours now, kid.'], ['扳手留给你。', 'Keep the wrench.']] },
  matchmaker: { board: [['红线牵好了吗？', 'Threads tied?'], ['有缘人在车上。', 'Someone here is meant for someone.']], arrive: [['成了。', 'A match.'], ['红绳收好。', 'Keep the red string.']] },
  don: { board: [['别紧张。', 'Relax.'], ['记我账上。', 'Put it on my tab.']], arrive: [['我欠你一次。', 'I owe you one.'], ['怀表是你的了。', 'The watch is yours.']] },
  matron: { board: [['都安静。', 'Quiet, all of you.'], ['查房。', 'Rounds.']], arrive: [['记录交给你。', 'Here’s the log.'], ['今晚平安。', 'A calm night.']] },
  nightingale: { board: [['还有人醒着吗？', 'Anyone still awake?'], ['来一首？', 'A song?']], arrive: [['晚安，亲爱的。', 'Goodnight, darling.'], ['唱片送你。', 'The record’s yours.']] },
  medium: { board: [['他们都在这里。', 'They’re all here.'], ['请给他们让座。', 'Make room for them.']], arrive: [['铃给你。', 'Take the bell.'], ['他们安心了。', 'They’re at peace.']] },
  tycoon: { board: [['慢一点，好思考。', 'Slowly. I’m thinking.'], ['这台老电梯不错。', 'Good old lift.']], arrive: [['尾款。', 'The balance.'], ['股票拿好。', 'Hold the shares.']] },
  stranger: { board: [['十三号房。', 'Room thirteen.'], ['这不是我的东西。', 'This isn’t mine.']], arrive: [['给你的。', 'For you.'], ['别找我。', 'Don’t look for me.']] },
};

export function quip(kind: PassengerKind, moment: 'board' | 'arrive', zh: boolean, rng: () => number = Math.random) {
  const lines = QUIPS[kind]?.[moment]; if (!lines?.length) return '';
  const line = lines[Math.floor(rng() * lines.length)];
  return zh ? line[0] : line[1];
}
