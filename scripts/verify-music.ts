import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  disposeGameMusic,
  floorMusicTrack,
  FLOOR_MUSIC_TRACKS,
  MUSIC_TRACKS,
  musicSceneKey,
  musicTrackForScene,
  setGameMusic,
} from '../lib/game-music';

assert.equal(FLOOR_MUSIC_TRACKS.length, 12);
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
class FakeAudio {
  src: string;
  preload = '';
  loop = false;
  volume = 1;
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
    return Promise.resolve();
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
} finally {
  disposeGameMusic();
  if (previousAudio) Object.defineProperty(globalThis, 'Audio', previousAudio);
  else Reflect.deleteProperty(globalThis, 'Audio');
}

console.log(
  'Music verified: 15 assets, floor bands 1–120, endless shuffle, scene switching, no same-band restart, and independent mute.',
);
