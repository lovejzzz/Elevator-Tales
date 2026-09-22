import type { PassengerKind } from './game-data';

/** Every ten floors is a district. It only changes who is more likely to be waiting
 * (themed riders drawn at 1.5× weight once unlocked); it never changes settlement. */
export type District = { id: string; from: number; name: [string, string]; scene: [string, string]; themed: PassengerKind[] };

export const DISTRICT_WEIGHT = 1.5;
export const DISTRICTS: District[] = [
  { id: 'lobby', from: 1, name: ['大堂', 'The Lobby'], scene: ['旋转门还在转。夜班才刚开始。', 'The revolving door is still turning. The shift has just begun.'], themed: ['commuter', 'courier'] },
  { id: 'residences', from: 11, name: ['住宅层', 'The Residences'], scene: ['走廊里有人在门口等另一个人回家。', 'Someone in the corridor is waiting for someone else to come home.'], themed: ['lover', 'child'] },
  { id: 'hospital', from: 21, name: ['医院层', 'The Hospital'], scene: ['消毒水的味道。值班表上有一个名字划掉了三次。', 'Antiseptic in the air. One name on the rota has been crossed out three times.'], themed: ['nurse', 'ghost'] },
  { id: 'nightclub', from: 31, name: ['夜店层', 'The Nightclub'], scene: ['低音从墙里渗出来，轿厢跟着轻轻发颤。', 'Bass seeps through the walls; the cabin trembles with it.'], themed: ['musician', 'drunk'] },
  { id: 'offices', from: 41, name: ['写字楼', 'The Offices'], scene: ['一整层的灯都还亮着。没有人真的下班。', 'A whole floor of lights still on. Nobody ever really leaves.'], themed: ['inspector', 'lawyer'] },
  { id: 'hotel', from: 51, name: ['酒店层', 'The Hotel'], scene: ['地毯很厚，脚步声都被吞掉了。前台的铃响了一次。', 'The carpet swallows every footstep. The front-desk bell rings once.'], themed: ['tourist', 'celebrity'] },
  { id: 'nameless', from: 61, name: ['无名层', 'The Nameless Floors'], scene: ['楼层按钮上的数字开始对不上了。', 'The numbers on the buttons have stopped matching the floors.'], themed: ['mystery', 'shifter'] },
];
export const districtFor = (floor: number): District => [...DISTRICTS].reverse().find(d => floor >= d.from) ?? DISTRICTS[0];
export const districtWeight = (floor: number, kind: PassengerKind) => (districtFor(floor).themed.includes(kind) ? DISTRICT_WEIGHT : 1);
