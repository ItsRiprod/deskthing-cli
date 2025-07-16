import { create } from 'zustand'
import { ClientService } from '../services/clientService'
import { ClientMessageBus } from '../services/clientMessageBus'
import { ClientLogger } from '../services/clientLogger'
import { useClientStore } from './clientStore'
import { useMessageStore } from './messageStore'
import { DEVICE_CLIENT, DeviceToClientCore } from '@deskthing/types'

interface ConnectionState {
  isInitialized: boolean
  viteDevUrl: string

  // Actions
  initialize: () => void
  checkViteServer: () => Promise<void>
  setupMessageBusSubscription: () => () => void
}

export const useConnectionStore = create<ConnectionState>()((set, get) => {

  const clientConfig = useClientStore.getState().config

  return {
    isInitialized: false,
    viteDevUrl: `${clientConfig.viteLocation}:${clientConfig.vitePort}`,

    initialize: () => {
      if (get().isInitialized) return

      ClientService.initialize()
      set({ isInitialized: true })
      ClientLogger.debug('Connection store initialized')

      useClientStore.subscribe(
        (state) => state.config,
        (config) => {
          set({ viteDevUrl: `${config.viteLocation}:${config.vitePort}` })
        }
      )
    },

    checkViteServer: async () => {
      const { viteDevUrl } = get()
      const { setViteConnection, incrementConnectionAttempts, connectionAttempts } = useClientStore.getState()

      try {
        await fetch(viteDevUrl, { method: "HEAD", mode: "no-cors" })
        setViteConnection(true)
      } catch {
        setViteConnection(false)
        incrementConnectionAttempts()

        // Retry with exponential backoff
        const delay = Math.min(connectionAttempts * 1000, 5000)
        setTimeout(() => get().checkViteServer(), delay)
      }
    },

    setupMessageBusSubscription: () => {
      return ClientMessageBus.subscribe("client:request", (data: DeviceToClientCore) => {

        const { sendToIframe } = useMessageStore.getState()
        const { setSettings, setSongData } = useClientStore.getState()

        if (data.app === 'client' && data.type === DEVICE_CLIENT.MUSIC) {
          setSongData(data.payload)
        }

        if (data.type === DEVICE_CLIENT.SETTINGS) {
          ClientLogger.debug('Received settings request:', data)
          setSettings(data.payload)
        }

        sendToIframe(data)
      })
    }
  }
})