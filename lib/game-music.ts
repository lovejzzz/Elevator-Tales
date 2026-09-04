export type MusicScene =
  | { kind: 'theme' }
  | { kind: 'floor'; floor: number }
  | { kind: 'shop' }
  | { kind: 'death' };

export function musicSceneForView({
  intro,
  pressureHelp,
  changelogOpen,
  status,
  floor,
}: {
  intro: boolean;
  pressureHelp: boolean;
  changelogOpen: boolean;
  status: 'playing' | 'upgrade' | 'lost';
  floor: number;
}): MusicScene {
  if (intro || pressureHelp || changelogOpen) return { kind: 'theme' };
  if (status === 'lost') return { kind: 'death' };
  if (status === 'upgrade') return { kind: 'shop' };
  return { kind: 'floor', floor };
}

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const publicAudio = (path: string) => `${publicBasePath}${path}`;

export const FLOOR_MUSIC_TRACKS = [
  publicAudio('/audio/music/floors-001-010-wistful-static.mp3'),
  publicAudio('/audio/music/floors-011-020.mp3'),
  publicAudio('/audio/music/floors-021-030.mp3'),
  publicAudio('/audio/music/floors-031-040.mp3'),
  publicAudio('/audio/music/floors-041-050.mp3'),
  publicAudio('/audio/music/floors-051-060.mp3'),
  publicAudio('/audio/music/floors-061-070.mp3'),
  publicAudio('/audio/music/floors-071-080.mp3'),
  publicAudio('/audio/music/floors-081-090.mp3'),
  publicAudio('/audio/music/floors-091-100.mp3'),
  publicAudio('/audio/music/floors-101-110.mp3'),
  publicAudio('/audio/music/floors-111-120.mp3'),
] as const;

export const MUSIC_TRACKS = {
  theme: publicAudio('/audio/music/theme.mp3'),
  shop: publicAudio('/audio/music/shop.mp3'),
  death: publicAudio('/audio/music/death.mp3'),
} as const;

const MUSIC_VOLUME = 0.16;
const FADE_MS = 650;

export const clampMusicVolume = (volume: number) =>
  Math.min(1, Math.max(0, volume));

export function floorMusicTrack(
  floor: number,
  random: () => number = Math.random,
  exclude?: string,
): string {
  if (floor <= 120) {
    const index = Math.max(
      0,
      Math.min(FLOOR_MUSIC_TRACKS.length - 1, Math.floor((floor - 1) / 10)),
    );
    return FLOOR_MUSIC_TRACKS[index];
  }
  const choices =
    exclude && FLOOR_MUSIC_TRACKS.length > 1
      ? FLOOR_MUSIC_TRACKS.filter((track) => track !== exclude)
      : [...FLOOR_MUSIC_TRACKS];
  return choices[
    Math.min(
      choices.length - 1,
      Math.floor(Math.max(0, random()) * choices.length),
    )
  ];
}

export function musicTrackForScene(
  scene: MusicScene,
  random: () => number = Math.random,
): string {
  if (scene.kind === 'floor') return floorMusicTrack(scene.floor, random);
  return MUSIC_TRACKS[scene.kind];
}

export function musicSceneKey(scene: MusicScene): string {
  if (scene.kind !== 'floor') return scene.kind;
  if (scene.floor > 120) return 'endless';
  return `floors-${Math.max(0, Math.floor((scene.floor - 1) / 10))}`;
}

let active: HTMLAudioElement | null = null;
let activeTrack = '';
let activeSceneKey = '';
let desiredScene: MusicScene = { kind: 'theme' };
let enabled = true;
let fadeFrame: number | null = null;

function cancelFade() {
  if (fadeFrame !== null && typeof cancelAnimationFrame !== 'undefined')
    cancelAnimationFrame(fadeFrame);
  fadeFrame = null;
}

function fade(
  player: HTMLAudioElement,
  from: number,
  to: number,
  done?: () => void,
) {
  cancelFade();
  if (typeof requestAnimationFrame === 'undefined') {
    player.volume = clampMusicVolume(to);
    done?.();
    return;
  }
  const started = performance.now();
  const tick = (now: number) => {
    const progress = Math.min(1, (now - started) / FADE_MS);
    player.volume = clampMusicVolume(from + (to - from) * progress);
    if (progress < 1) fadeFrame = requestAnimationFrame(tick);
    else {
      fadeFrame = null;
      done?.();
    }
  };
  fadeFrame = requestAnimationFrame(tick);
}

function startTrack(track: string, endless: boolean, sceneKey: string) {
  if (typeof Audio === 'undefined') return;
  if (activeTrack === track && active) {
    cancelFade();
    activeSceneKey = sceneKey;
    active.loop = !endless;
    if (enabled)
      void active
        .play()
        .then(() => fade(active!, active!.volume, MUSIC_VOLUME))
        .catch(() => undefined);
    return;
  }

  const previous = active;
  const next = new Audio(track);
  next.preload = 'auto';
  next.loop = !endless;
  next.volume = 0;
  if (endless) {
    next.onended = () => {
      if (
        !enabled ||
        desiredScene.kind !== 'floor' ||
        desiredScene.floor <= 120
      )
        return;
      startTrack(
        floorMusicTrack(121, Math.random, activeTrack),
        true,
        'endless',
      );
    };
  }
  active = next;
  activeTrack = track;
  activeSceneKey = sceneKey;
  if (previous) {
    previous.onended = null;
    previous.pause();
    previous.removeAttribute('src');
    previous.load();
  }
  if (!enabled) return;
  void next
    .play()
    .then(() => fade(next, 0, MUSIC_VOLUME))
    .catch(() => undefined);
}

export function setGameMusic(nextEnabled: boolean, scene: MusicScene) {
  const nextKey = musicSceneKey(scene);
  enabled = nextEnabled;
  desiredScene = scene;
  if (!enabled) {
    if (active) fade(active, active.volume, 0, () => active?.pause());
    return;
  }
  const endless = scene.kind === 'floor' && scene.floor > 120;
  const track =
    activeSceneKey === nextKey && activeTrack
      ? activeTrack
      : musicTrackForScene(scene);
  startTrack(track, endless, nextKey);
}

export function unlockGameMusic() {
  if (!enabled || !active || !active.paused) return;
  void active
    .play()
    .then(() => fade(active!, active!.volume, MUSIC_VOLUME))
    .catch(() => undefined);
}

export function disposeGameMusic() {
  cancelFade();
  if (active) {
    active.onended = null;
    active.pause();
    active.removeAttribute('src');
    active.load();
  }
  active = null;
  activeTrack = '';
  activeSceneKey = '';
}
