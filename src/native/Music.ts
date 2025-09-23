
import { Platform, PermissionsAndroid } from 'react-native';
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
  IOSCategory,
  IOSCategoryMode,
  IOSCategoryOptions,
  State,
} from 'react-native-track-player';

export type CatKey = 'calm' | 'energy' | 'break';

const localUrls: Record<CatKey, any> = {
  calm:   require('../assets/audio/calm_soul.mp3'),
  energy: require('../assets/audio/focus_energy.mp3'),
  break:  require('../assets/audio/break_routine.mp3'),
};

export async function askNotifPermissionIfNeeded(): Promise<void> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    try {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    } catch {}
  }
}

let ready = false;
let currentCat: CatKey | null = null;

let op: Promise<void> = Promise.resolve();
const withLock = (fn: () => Promise<void>): Promise<void> => {
  op = op.catch(() => {}).then(fn);
  return op;
};

async function ensure(): Promise<void> {
  if (ready) return;

  await TrackPlayer.setupPlayer({
    minBuffer: 10,
    maxBuffer: 60,
    backBuffer: 10,
    playBuffer: 5,
    autoUpdateMetadata: true,
    autoHandleInterruptions: true,

    iosCategory: IOSCategory.Playback,
    iosCategoryMode: IOSCategoryMode.Default,
    iosCategoryOptions: [IOSCategoryOptions.MixWithOthers],
  });

  await TrackPlayer.updateOptions({
    android: {
      appKilledPlaybackBehavior:
        AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      stopForegroundGracePeriod: 5,
    },
    capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
    compactCapabilities: [Capability.Play, Capability.Pause],
  });

  await TrackPlayer.setRepeatMode(RepeatMode.Track);
  await TrackPlayer.setVolume(0.9);

  ready = true;
}

export async function playCategory(cat: CatKey): Promise<void> {
  return withLock(async () => {
    await askNotifPermissionIfNeeded();
    await ensure();

    const url = localUrls[cat];

    const queue = await TrackPlayer.getQueue();
    if (queue.length === 1 && queue[0]?.id === cat) {
      await TrackPlayer.play();
      currentCat = cat;
      return;
    }

    await TrackPlayer.reset();
    await TrackPlayer.add({
      id: cat,
      url,
      title: cat,
      artist: 'Silence Dragon',
    });

    await TrackPlayer.setRepeatMode(RepeatMode.Track);
    await TrackPlayer.play();
    currentCat = cat;
  });
}

export async function stopMusic(): Promise<void> {
  return withLock(async () => {
    if (!ready) return;
    try {
      const state = (await TrackPlayer.getState().catch(() => undefined)) as State | undefined;
      if (state !== undefined) {
        await TrackPlayer.stop();
      }
    } finally {
      try { await TrackPlayer.reset(); } catch {}

      currentCat = null;
    }
  });
}

export async function pauseMusic(): Promise<void> {
  return withLock(async () => {
    if (!ready) return;
    try { await TrackPlayer.pause(); } catch {}
  });
}

export async function resumeMusic(): Promise<void> {
  return withLock(async () => {
    await ensure();
    try { await TrackPlayer.play(); } catch {}
  });
}
