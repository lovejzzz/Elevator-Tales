import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  disposeGameMusic,
  clampMusicVolume,
  floorMusicTrack,
  FLOOR_MUSIC_TRACKS,
  MUSIC_TRACKS,
  musicSceneForView,
  musicSceneKey,
  musicTrackForScene,
  setGameMusic,
  unlockGameMusic,
} from '../lib/game-music';

assert.equal(clampMusicVolume(-0.0000246154), 0, 'floating-point fade undershoot must clamp to zero');
assert.equal(clampMusicVolume(1.0000246154), 1, 'floating-point fade overshoot must clamp to one');
assert.equal(clampMusicVolume(0.16), 0.16);

assert.equal(FLOOR_MUSIC_TRACKS.length, 12);
assert.ok(FLOOR_MUSIC_TRACKS[0].endsWith('/floors-001-010-wistful-static.mp3'),'floors 1–10 use Wistful Static');
assert.equal(floorMusicTrack(1), FLOOR_MUSIC_TRACKS[0]);
assert.equal(floorMusicTrack(10), FLOOR_MUSIC_TRACKS[0]);
assert.equal(floorMusicTrack(11), FLOOR_MUSIC_TRACKS[1]);
assert.equal(floorMusicTrack(51), FLOOR_MUSIC_TRACKS[5]);
assert.equal(floorMusicTrack(120), FLOOR_MUSIC_TRACKS[11]);
assert.equal(
  floorMusicTrack(121, () => 0),
  FLOOR_MUSIC_TRACKS[0],
);
assert.equal(
  floorMusicTrack(999, () => 0.999999),
  FLOOR_MUSIC_TRACKS[11],
);
assert.notEqual(
  floorMusicTrack(121, () => 0, FLOOR_MUSIC_TRACKS[0]),
  FLOOR_MUSIC_TRACKS[0],
  'endless shuffle should not immediately repeat a finished track',
);
assert.equal(musicTrackForScene({ kind: 'theme' }), MUSIC_TRACKS.theme);
assert.equal(musicTrackForScene({ kind: 'shop' }), MUSIC_TRACKS.shop);
assert.equal(musicTrackForScene({ kind: 'death' }), MUSIC_TRACKS.death);
assert.deepEqual(musicSceneForView({intro:true,pressureHelp:false,changelogOpen:false,status:'playing',floor:18}),{kind:'theme'});
assert.deepEqual(musicSceneForView({intro:false,pressureHelp:true,changelogOpen:false,status:'playing',floor:18}),{kind:'theme'});
assert.deepEqual(musicSceneForView({intro:false,pressureHelp:false,changelogOpen:true,status:'playing',floor:18}),{kind:'theme'});
assert.deepEqual(musicSceneForView({intro:false,pressureHelp:false,changelogOpen:false,status:'playing',floor:18}),{kind:'floor',floor:18});
assert.deepEqual(musicSceneForView({intro:false,pressureHelp:false,changelogOpen:false,status:'upgrade',floor:20}),{kind:'shop'});
assert.deepEqual(musicSceneForView({intro:false,pressureHelp:false,changelogOpen:false,status:'lost',floor:18}),{kind:'death'});
assert.equal(musicSceneKey({ kind: 'floor', floor: 120 }), 'floors-11');
assert.equal(musicSceneKey({ kind: 'floor', floor: 121 }), 'endless');
assert.equal(musicSceneKey({ kind: 'floor', floor: 300 }), 'endless');

for (const track of [...FLOOR_MUSIC_TRACKS, ...Object.values(MUSIC_TRACKS)]) {
  const path = fileURLToPath(new URL(`../public${track}`, import.meta.url));
  assert.ok(existsSync(path), `${track} must exist`);
  assert.ok(
    statSync(path).size > 100_000,
    `${track} must contain a real web audio encode`,
  );
}

const previousAudio = Object.getOwnPropertyDescriptor(globalThis, 'Audio');
const players: FakeAudio[] = [];
const pendingPlays: Array<() => void> = [];
let deferPlay = false;
class FakeAudio {
  src: string;
  preload = '';
  loop = false;
  volume = 1;
  muted = false;
  paused = true;
  onended: (() => void) | null = null;
  plays = 0;
  pauses = 0;
  unloaded = false;
  constructor(src: string) {
    this.src = src;
    players.push(this);
  }
  play() {
    this.paused = false;
    this.plays += 1;
    return deferPlay ? new Promise<void>(resolve => pendingPlays.push(resolve)) : Promise.resolve();
  }
  pause() {
    this.paused = true;
    this.pauses += 1;
  }
  removeAttribute(name: string) {
    if (name === 'src') {
      this.src = '';
      this.unloaded = true;
    }
  }
  load() {}
}

try {
  Object.defineProperty(globalThis, 'Audio', {
    configurable: true,
    value: FakeAudio,
  });
  setGameMusic(true, { kind: 'theme' });
  assert.equal(players.length, 1);
  assert.equal(players[0].src, MUSIC_TRACKS.theme);
  setGameMusic(true, { kind: 'floor', floor: 1 });
  assert.equal(players.length, 2);
  assert.equal(players[1].src, FLOOR_MUSIC_TRACKS[0]);
  assert.ok(players[0].unloaded);
  setGameMusic(true, { kind: 'floor', floor: 8 });
  assert.equal(
    players.length,
    2,
    'floors in the same ten-floor band must not restart music',
  );
  setGameMusic(true, { kind: 'floor', floor: 11 });
  assert.equal(players.length, 3);
  assert.equal(players[2].src, FLOOR_MUSIC_TRACKS[1]);
  setGameMusic(false, { kind: 'floor', floor: 11 });
  assert.equal(players.at(-1)?.paused, true);
  setGameMusic(false, { kind: 'shop' });
  assert.equal(
    players.length,
    3,
    'a muted scene change should not download or start audio',
  );
  setGameMusic(true, { kind: 'shop' });
  assert.equal(
    players.at(-1)?.src,
    MUSIC_TRACKS.shop,
    'reenabling after a muted scene change must start the current scene',
  );
  setGameMusic(true, { kind: 'death' });
  assert.equal(players.at(-1)?.src, MUSIC_TRACKS.death);
  await Promise.resolve();
  disposeGameMusic();
  const oldRAF = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
  const oldCancel = Object.getOwnPropertyDescriptor(globalThis, 'cancelAnimationFrame');
  const frames = new Map<number, FrameRequestCallback>();
  let frameId = 0;
  try {
    Object.defineProperty(globalThis,'requestAnimationFrame',{configurable:true,value:(callback:FrameRequestCallback)=>{frames.set(++frameId,callback);return frameId;}});
    Object.defineProperty(globalThis,'cancelAnimationFrame',{configurable:true,value:(id:number)=>frames.delete(id)});
    deferPlay = true;
    setGameMusic(true,{kind:'theme'});
    const delayed = players.at(-1)!;
    setGameMusic(false,{kind:'theme'});
    assert.equal(delayed.paused,true,'Mute must pause immediately without any animation frames');
    assert.equal(delayed.muted,true);
    assert.equal(delayed.volume,0);
    pendingPlays.splice(0).forEach(resolve=>resolve()); await Promise.resolve();
    assert.equal(frames.size,0,'A pending play promise must not revive a muted fade');
    unlockGameMusic();
    assert.equal(delayed.plays,1,'User input cannot unlock muted music');
    setGameMusic(true,{kind:'theme'});
    setGameMusic(true,{kind:'shop'});
    pendingPlays.splice(0).forEach(resolve=>resolve()); await Promise.resolve();
    assert.equal(frames.size,1,'Only the current scene may schedule a fade');
    assert.equal(delayed.muted,true,'Replaced tracks remain muted');
    setGameMusic(false,{kind:'shop'});
    assert.equal(frames.size,0,'Mute cancels even a stalled background fade');
    setGameMusic(true,{kind:'shop'});
    disposeGameMusic();
    pendingPlays.splice(0).forEach(resolve=>resolve()); await Promise.resolve();
    assert.equal(frames.size,0,'Disposal blocks late callbacks');
  } finally {
    if(oldRAF)Object.defineProperty(globalThis,'requestAnimationFrame',oldRAF);else Reflect.deleteProperty(globalThis,'requestAnimationFrame');
    if(oldCancel)Object.defineProperty(globalThis,'cancelAnimationFrame',oldCancel);else Reflect.deleteProperty(globalThis,'cancelAnimationFrame');
  }
} finally {
  disposeGameMusic();
  if (previousAudio) Object.defineProperty(globalThis, 'Audio', previousAudio);
  else Reflect.deleteProperty(globalThis, 'Audio');
}

console.log(
  'Music verified with fake audio only: 15 assets, floor bands, scene switching, immediate background mute, pending-play races, disposal and muted unlock.',
);
