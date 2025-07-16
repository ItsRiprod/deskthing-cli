import { create } from 'zustand'
import { ClientToDeviceData, DeviceToClientCore, DEVICE_CLIENT, AppManifest } from '@deskthing/types'
import { ClientService } from '../services/clientService'
import { ClientLogger } from '../services/clientLogger'
import { useClientStore } from './clientStore'

interface MessageState {
  // Actions
  handleIframeMessage: (data: ClientToDeviceData, origin: string) => void
  sendToIframe: (data: DeviceToClientCore) => void
}

export const useMessageStore = create<MessageState>()((set, get) => ({
  sendToIframe: (data) => {
    const iframe = document.querySelector('#app') as HTMLIFrameElement
    if (iframe?.contentWindow) {
      const augmentedData = { ...data, source: "deskthing" }
      ClientLogger.debug('Sending data to iframe', augmentedData)
      iframe.contentWindow.postMessage(augmentedData, "*")
    }
  },

  handleIframeMessage: (data, origin) => {
    const { appManifest, setSongData } = useClientStore.getState()

    if (data.app === "client") {
      handleClientMessage(data)
    } else {
      handleAppMessage(data, appManifest)
    }
  }
}))

// Helper functions
const handleClientMessage = (data: ClientToDeviceData) => {
  const { sendToIframe } = useMessageStore.getState()
  const { songData, settings, apps, clientManifest, requestSettings } = useClientStore.getState()

  switch (data.type) {
    case "get":
      switch (data.request) {
        case "song":
        case "music":
          ClientLogger.debug("Get request for music, Sending music", songData)
          sendToIframe({ type: DEVICE_CLIENT.MUSIC, app: "client", payload: songData })
          break

        case "settings":
          ClientLogger.debug("Get request for settings, Sending settings")
          requestSettings().then((settings) => {
            sendToIframe({ type: DEVICE_CLIENT.SETTINGS, app: "client", payload: settings })
          }).catch((error) => {
            ClientLogger.error("Failed to get settings:", error)
          })
          break

        case "apps":
          ClientLogger.debug("Get request for apps, Sending apps", apps)
          sendToIframe({ type: DEVICE_CLIENT.APPS, app: "client", payload: apps })
          break

        case "manifest":
          ClientLogger.debug("Get request for manifest, Sending manifest")
          sendToIframe({ type: DEVICE_CLIENT.MANIFEST, app: "client", payload: clientManifest })
          break
      }
      break

    case "log":
      ClientLogger.clientLog(data.request as any, data.payload.message, ...(data.payload.data || []))
      break

    case "key":
    case "action":
      handleActionMessage(data)
      break
  }
}

const handleAppMessage = (data: ClientToDeviceData, appManifest: AppManifest | null) => {
  ClientLogger.debug('Sending data to server', data)
  const clientId = useClientStore.getState().clientId

  const appId = data.app || appManifest?.id || "unknownId"
  ClientService.sendToApp({
    ...data,
    app: appId,
    clientId: clientId
  })
}

const handleActionMessage = (data: Extract<ClientToDeviceData, { type: 'action' | 'key' }>) => {
  const { appManifest, clientId } = useClientStore.getState()

  ClientLogger.debug('Handling action', data)

  const appId = data.app || appManifest?.id || "unknownId"
  ClientService.sendToApp({
    ...data,
    app: appId,
    clientId: clientId
  })
}