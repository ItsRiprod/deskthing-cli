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

      ClientLogger.debug(`Attempting to connect to Vite server at: ${viteDevUrl}`)
      ClientLogger.debug(`Connection attempt #${connectionAttempts + 1}`)

      try {
        // Try multiple connection methods for debugging
        ClientLogger.debug('Trying HEAD request with no-cors mode...')
        const headResponse = await fetch(viteDevUrl, { method: "HEAD", mode: "no-cors" })
        ClientLogger.debug(`HEAD request completed. Status: ${headResponse.status}, Type: ${headResponse.type}`)
        
        // Also try a GET request to see if we can actually load content
        try {
          ClientLogger.debug('Trying GET request to verify content loading...')
          const getResponse = await fetch(viteDevUrl, { method: "GET", mode: "no-cors" })
          ClientLogger.debug(`GET request completed. Status: ${getResponse.status}, Type: ${getResponse.type}`)
          
          // Try to check if we can access the actual content
          if (getResponse.type === 'opaque') {
            ClientLogger.warn('Response is opaque - this might indicate CORS restrictions')
          }
        } catch (getError) {
          ClientLogger.warn('GET request failed - might be CORS or network issue:', getError)
          
          // Try with CORS mode to see if we get a more specific error
          try {
            ClientLogger.debug('Trying GET request with CORS mode for better error info...')
            await fetch(viteDevUrl, { method: "GET", mode: "cors" })
          } catch (corsError) {
            ClientLogger.error('CORS request failed:', corsError)
          }
        }

        setViteConnection(true)
        ClientLogger.info(`✅ Successfully connected to Vite server at ${viteDevUrl}`)
      } catch (error) {
        ClientLogger.error(`❌ Failed to connect to Vite server at ${viteDevUrl}:`, error)
        setViteConnection(false)
        incrementConnectionAttempts()

        // Retry with exponential backoff
        const delay = Math.min(connectionAttempts * 1000, 5000)
        ClientLogger.debug(`Retrying connection in ${delay}ms...`)
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