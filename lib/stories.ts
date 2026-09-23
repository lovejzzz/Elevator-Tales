import type { PassengerKind } from './game-data';

/** One short vignette per rider, unlocked the first time they are delivered. */
export const STORIES: Record<PassengerKind, [string, string]> = {
  commuter: ['他每天坐同一班电梯，站在同一个角落。今晚他第一次发现，这栋楼没有他要去的那一层——但他还是按了按钮。', 'He takes the same lift every night and stands in the same corner. Tonight he noticed the building has no floor for where he is going—and pressed the button anyway.'],
  tourist: ['相机里全是走廊。她说每一层的地毯花纹都不一样，要全部拍下来，回去给朋友看“真正的夜晚”。', 'Her camera is full of corridors. Every floor has a different carpet, she says; she will photograph them all and show her friends “the real night”.'],
  courier: ['包裹上的收件人写着“顶层”。他跑了很多年，从没找到顶层，但包裹一直准时送到了。', 'The label says “Top Floor”. He has run this route for years and never found it, yet every parcel arrives on time.'],
  mechanic: ['她听得出电机的每一种咳嗽。“这台老家伙还能撑，”她拍拍墙壁，“只要有人肯听它说话。”', 'She can tell every cough of the motor. “The old thing will hold,” she says, patting the wall, “as long as someone listens to it.”'],
  lover: ['两个人约好在某一层见面，却谁都记不清是哪一层。所以他们一直坐着电梯，一层一层地找。', 'They agreed to meet on a floor neither can remember. So they keep riding, floor by floor, looking.'],
  musician: ['他把电梯的嗡鸣当作定音。据说在他演奏过的楼层，灯会亮得久一点。', 'He tunes to the hum of the cables. On the floors where he has played, they say, the lights stay on a little longer.'],
  thief: ['他从不偷钱，只偷别人落下的时间。“反正你们也用不完，”他说，然后把怀表塞进袖子。', 'He never takes money—only the time people leave lying around. “You would not have used it,” he says, sliding a watch up his sleeve.'],
  cop: ['巡逻了二十年，她最擅长的是站在正确的位置。小偷一看见她，就会自己把手放回口袋。', 'Twenty years on patrol taught her one thing: where to stand. Thieves see her and put their hands back in their own pockets.'],
  lawyer: ['他的公文包里有这栋楼每一条规定的副本，包括那些没人写下来的。', 'His briefcase holds a copy of every rule in the building—including the ones nobody wrote down.'],
  drunk: ['他说自己只是在找回家的路。每次门开，他都笑着说“就是这里”，然后又不下去。', 'He says he is only looking for the way home. Each time the doors open he laughs, “This is it,” and stays put.'],
  nurse: ['夜班做久了，她能从脚步声里听出谁快撑不住。她会先站到那个人旁边，什么都不说。', 'After years of nights she can hear, from footsteps alone, who is about to break. She stands beside them first, and says nothing.'],
  child: ['他数电梯按钮数到一百就不会了。“那后面的楼层，”他认真地问，“是不是还没有人住？”', 'He can count the buttons up to a hundred, then stops. “The floors after that,” he asks very seriously, “does nobody live there yet?”'],
  ghost: ['她在这栋楼里等了很久，久到忘了在等谁。有人陪着的时候，她会安静一点。', 'She has waited in this building so long she has forgotten who for. When someone keeps her company, she is quieter.'],
  exorcist: ['他不驱赶鬼魂，只是提醒它们：该下车了。大多数都会点点头，在正确的楼层离开。', 'He does not banish ghosts; he reminds them it is their stop. Most nod, and leave on the right floor.'],
  coach: ['她对每个人都说“你可以的”，连对电梯也说。奇怪的是，它好像真的跑得更稳了。', 'She tells everyone “you have got this”—the lift included. Strangely, it does seem to run steadier.'],
  celebrity: ['他习惯了被围住，却从没习惯被认出来之后的沉默。所以他只想要一个人陪着说话。', 'He is used to crowds, never to the silence after being recognised. So he only wants one person to talk to.'],
  inspector: ['她的笔记本上有一栏叫“安静”。只有连续两层都安静的电梯，才能得到她的印章。', 'Her notebook has a column headed “Quiet”. Only a lift that stays calm two floors running earns her stamp.'],
  bomb: ['箱子里的滴答声不是炸弹，他坚持说，是一颗心。只是这颗心，很怕迟到。', 'The ticking in the case is not a bomb, he insists—it is a heart. A heart that is very afraid of being late.'],
  mystery: ['没人记得他在哪一层上车。到站时他留下的车费每次都不一样，像是按心情付的。', 'Nobody remembers where he got on. The fare he leaves is different every time, as if he pays by mood.'],
  shifter: ['每到一层，她就换一副样子。“我只是还没决定，”她说，“今晚要当谁。”', 'At every floor she wears a different face. “I just have not decided,” she says, “who to be tonight.”'],
  mimic: ['他总是学站在他上方的人。有一次学得太像，连对方都以为自己已经下了车。', 'He always copies whoever stands above him. Once he did it so well the original thought they had already got off.'],
  parcel: ['没人知道箱子里装的是什么。快递员说，只要它准时到，里面是什么都不重要。', 'Nobody knows what is in the box. The courier says that as long as it arrives on time, what is inside does not matter.'],
  operator: ['老周开了四十年电梯，退休那天没人来送他。于是他每晚回来坐第一班，从一楼坐到十楼，替新人把电机捂热。', 'Zhou ran this lift for forty years; nobody came to see him off when he retired. So he rides the first car every night, one to ten, warming the motor for whoever is new.'],
  matchmaker: ['她口袋里总有一团红线，说是在这栋楼里捡到的。她把线头交给谁，谁就会在某一层遇见另一个人。', 'She always carries a tangle of red thread, found somewhere in the building. Whoever she hands an end to meets someone, on some floor.'],
  don: ['他从不大声说话。整栋楼的坏人见了他都会摘下帽子，然后乖乖把钱存进他的账上。', 'He never raises his voice. Every crook in the building takes off his hat when he boards—and quietly pays into his account.'],
  matron: ['她值了三十年夜班，记得这栋楼每一个呼叫铃的声音。她走过的车厢，总会安静下来。', 'Thirty years of night shifts; she knows the sound of every call bell in the building. Any car she walks through goes quiet.'],
  nightingale: ['夜店层最后一场演出结束后，她还在电梯里唱。她说，歌要唱给还没睡的人听。', 'After the last set in the nightclub she keeps singing in the lift. Songs, she says, are for the people still awake.'],
  medium: ['她能看见这栋楼里所有没下车的人。她不怕他们，只是替他们找一个能坐下的位置。', 'She can see everyone in this building who never got off. She is not afraid of them—she just finds them somewhere to sit.'],
  tycoon: ['这栋楼一半的楼层写着他的名字，他却只肯坐这台旧电梯。“新的太快了，”他说，“来不及想事情。”', 'Half the floors in this building bear his name, yet he will only ride this old lift. “The new ones are too fast,” he says. “No time to think.”'],
  stranger: ['登记簿上，十三号房一直空着。可每天夜里，总有人从那里走进电梯，带着一件别人的东西。', 'In the register, room thirteen has always been empty. Yet every night someone steps into the lift from there, carrying something that belongs to someone else.'],
};

export const STORIES_KEY = 'elevator-tales-stories-v1';
