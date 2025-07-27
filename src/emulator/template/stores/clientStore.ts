import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { SongData, App, AppManifest, ClientManifest, AppSettings, SettingsType } from '@deskthing/types'
import { sampleSongs, sampleApps, getSampleClientManifest } from '../config/sampleData'
import { ClientService } from '../services/clientService'
import { ClientLogger } from '../services/clientLogger'
import { DeskThingClientConfig } from '../../../config/deskthing.config.types'

const defaultClientConfig: DeskThingClientConfig = {
  clientPort: 3000,
  linkPort: 8080,
  logging: {
    level: undefined,
    prefix: '[DeskThing Client]',
    enableRemoteLogging: true
  },
  vitePort: 5173,
  viteLocation: 'http://localhost'
}

interface ClientState {
  // Configuration
  config: DeskThingClientConfig
  
  // Client data
  clientId: string

  // Connection state
  isViteServerConnected: boolean
  connectionAttempts: number

  // App data
  appManifest: AppManifest | null
  clientManifest: ClientManifest
  apps: App[]

  // Music data
  songData: SongData

  // Settings
  settings: AppSettings

  // Config actions
  updateConfig: (newConfig: Partial<DeskThingClientConfig>) => void
  resetConfig: () => void

  // Client actions
  setClientId: (id: string) => void

  // Actions
  setViteConnection: (connected: boolean) => void
  incrementConnectionAttempts: () => void
  resetConnectionAttempts: () => void
  setAppManifest: (manifest: AppManifest) => void
  setSongData: (song: Partial<SongData>) => void
  setSettings: (settings: AppSettings) => void
  updateSetting: (settingId: string, value: SettingsType['value']) => void
  saveSettings: () => Promise<void>
  setApps: (apps: App[]) => void

  // Async actions
  requestManifest: () => Promise<void>
  requestSettings: () => Promise<AppSettings>
  requestApps: () => Promise<void>
}

export const useClientStore = create<ClientState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    config: defaultClientConfig,
    clientId: '1234567890',
    isViteServerConnected: false,
    connectionAttempts: 0,
    appManifest: null,
    clientManifest: getSampleClientManifest(),
    apps: sampleApps,
    songData: sampleSongs,
    settings: {},

    // Config actions
    updateConfig: (newConfig) =>
      set((state) => ({
        config: {
          ...state.config,
          ...newConfig,
          logging: {
            ...state.config?.logging,
            ...(newConfig?.logging || {})
          }
        },
        clientManifest: { // also update the port in case it was changed
          ...state.clientManifest,
          context: {
            ...state.clientManifest.context,
            port: newConfig.clientPort || state.clientManifest.context.port
          }
        }
      })),

    resetConfig: () => set({ config: defaultClientConfig }),

    // Client actions
    setClientId: (id) => set({ clientId: id }),

    // Sync actions
    setViteConnection: (connected) => set({ isViteServerConnected: connected }),

    incrementConnectionAttempts: () =>
      set((state) => ({ connectionAttempts: state.connectionAttempts + 1 })),

    resetConnectionAttempts: () => set({ connectionAttempts: 0 }),

    setAppManifest: (manifest) => set({ appManifest: manifest }),

    setSongData: (song) =>
      set((state) => {
        if (state.songData.version == 2 && song.version == 2) {

          return { songData: { ...state.songData, ...song, version: 2 } }
        } else {
          return state
        }
      }),

    setSettings: (settings) => set({ settings }),

    updateSetting: (settingId, value) => {
      set((state) => ({
        settings: {
          ...state.settings,
          [settingId]: {
            ...state.settings[settingId],
            id: settingId,
            value
          } as SettingsType & { id: string }
        }
      }))
    },

    saveSettings: async () => {
      try {
        const { settings } = get()
        ClientService.saveSettings(settings)
        ClientLogger.debug('Settings saved successfully:', settings)
      } catch (error) {
        ClientLogger.error('Failed to save settings:', error)
      }
    },

    setApps: (apps) => set({ apps }),

    // Async actions
    requestManifest: async () => {
      try {
        const manifest = await new Promise<AppManifest>((resolve) => {
          ClientService.requestManifest(resolve)
        })
        set({ appManifest: manifest })
      } catch (error) {
        ClientLogger.error('Failed to request manifest:', error)
      }
    },

    requestSettings: async () => {
      try {
        const settings = await new Promise<AppSettings>((resolve) => {
          ClientService.requestSettings(resolve)
        })
        ClientLogger.debug('Received settings:', settings)
        set({ settings })
        return settings
      } catch (error) {
        ClientLogger.error('Failed to request settings:', error)
      }
    },

    requestApps: async () => {
      try {
        // For now using sample data, but could be async in future
        set({ apps: sampleApps })
      } catch (error) {
        ClientLogger.error('Failed to request apps:', error)
      }
    }
  }))
)