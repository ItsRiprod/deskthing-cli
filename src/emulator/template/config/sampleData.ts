import {
  App,
  ClientConnectionMethod,
  ClientManifest,
  ClientPlatformIDs,
  PlatformTypes,
  SongData,
  TagTypes,
} from "@deskthing/types";
import { SongAbilities } from "@deskthing/types";

export const sampleSongs: SongData = {
  version: 2,
  track_name: "No One Wants To Die Alone",
  album: "Homesick",
  artist: "Benjamin Steer",
  playlist: "Electronic Essentials",
  playlist_id: "playlist_001",
  shuffle_state: false,
  repeat_state: "off",
  is_playing: true,
  source: "sample-app-2",
  abilities: [
    SongAbilities.LIKE,
    SongAbilities.SHUFFLE,
    SongAbilities.REPEAT,
    SongAbilities.PLAY,
    SongAbilities.PAUSE,
    SongAbilities.STOP,
    SongAbilities.NEXT,
    SongAbilities.FAST_FORWARD,
    SongAbilities.CHANGE_VOLUME,
    SongAbilities.SET_OUTPUT,
  ],
  track_duration: 369000,
  track_progress: 145000,
  volume: 75,
  thumbnail: "https://i.scdn.co/image/ab67616d0000b273da079cd1ffdfe77cf10d2519",
  device: "Desktop Speaker",
  device_id: "device_001",
  id: "track_001",
  liked: true,
  color: {
    value: [41, 128, 185],
    rgb: "rgb(41, 128, 185)",
    rgba: "rgba(41, 128, 185, 1)",
    hex: "#2980b9",
    hexa: "#2980b9ff",
    isDark: true,
    isLight: false,
  },
  // Deprecated fields for backward compatibility
  can_like: true,
  can_change_volume: true,
  can_set_output: true,
  can_fast_forward: true,
  can_skip: true,
};

export const sampleApps: App[] = [
  {
    name: "sample-app-1",
    manifest: {
      id: "sample-app-1",
      requires: [],
      version: "1.0.0",
      description: "Sample App 1",
      author: "Sample Author",
      platforms: [PlatformTypes.WINDOWS, PlatformTypes.ANDROID],
      tags: [TagTypes.UTILITY_ONLY],
      requiredVersions: {
        server: "1.0.0",
        client: "1.0.0",
      },
    },
    enabled: false,
    running: false,
    timeStarted: 0,
    prefIndex: 0,
  },
  {
    name: "sample-app-2",
    manifest: {
      id: "sample-app-2",
      requires: [],
      version: "1.0.0",
      description: "Sample App 2",
      author: "Sample Author",
      platforms: [PlatformTypes.WINDOWS, PlatformTypes.ANDROID],
      tags: [TagTypes.AUDIO_SOURCE],
      requiredVersions: {
        server: "1.0.0",
        client: "1.0.0",
      },
    },
    enabled: false,
    running: false,
    timeStarted: 0,
    prefIndex: 0,
  },
];

// Dynamic client manifest that uses store config
export const getSampleClientManifest = (): ClientManifest => {
  
  return {
    id: "sample-client",
    name: "Sample Client",
    short_name: "SampleClient",
    description: "A sample client manifest",
    reactive: true,
    repository: "https://github.com/sample/client",
    author: "Sample Author",
    version: "1.0.0",
    compatibility: {
      server: "1.0.0",
      app: "1.0.0",
    },
    context: {
      ip: "127.0.0.1",
      port: 3000,
      method: ClientConnectionMethod.LAN,
      id: ClientPlatformIDs.Desktop,
      name: "Desktop",
    },
  }
}
