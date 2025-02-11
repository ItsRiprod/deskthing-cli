export const sampleSongs = 
  {
    album: "Random Access Memories",
    artist: "Daft Punk",
    playlist: "Electronic Essentials",
    playlist_id: "playlist_001",
    track_name: "Get Lucky",
    shuffle_state: false,
    repeat_state: "off",
    is_playing: true,
    can_fast_forward: true,
    can_skip: true,
    can_like: true,
    can_change_volume: true,
    can_set_output: true,
    track_duration: 369000,
    track_progress: 145000,
    volume: 75,
    thumbnail: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    device: "Desktop Speaker",
    id: "track_001",
    device_id: "device_001",
    liked: true,
    color: {
      value: [41, 128, 185],
      rgb: "rgb(41, 128, 185)",
      rgba: "rgba(41, 128, 185, 1)",
      hex: "#2980b9",
      hexa: "#2980b9ff",
      isDark: true,
      isLight: false
    }
  }

  export const sampleApps = [
    {
      name: "sample-app-1",
      manifest: {
        id: "sample-app-1",
        requires: [ ],
        version: "1.0.0",
        description: "Sample App 1",
        author: "Sample Author",
        platforms: ["windows", "mac"],
        tags: ["utilityOnly"],
        requiredVersions: {
          server: "1.0.0",
          client: "1.0.0"
        }
      }
    },
    {
      name: "sample-app-2",
      manifest: {
        id: "sample-app-2",
        requires: [ ],
        version: "1.0.0",
        description: "Sample App 2",
        author: "Sample Author",
        platforms: ["windows", "mac"],
        tags: ["webappOnly"],
        requiredVersions: {
          server: "1.0.0",
          client: "1.0.0"
        }
      }
    }
  ];
  