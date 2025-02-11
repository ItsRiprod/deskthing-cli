import { getServerData } from './coms'
import { getManifestDetails } from './manifestDetails'
import { Logger } from '../services/logger'
import { ServerMessageBus } from './serverMessageBus'

export class ServerService {
  constructor() {
    ServerMessageBus.subscribe("client:request", (data: any) => {
      this.handleClientRequest(data)
    })
    ServerMessageBus.initialize(8080)
  }

  private handleClientRequest(data: any) {
    Logger.log(`Received request: ${JSON.stringify(data)}`)
    // Handle different types of requests
    switch(data.type) {
      case "getData":
        this.sendServerData()
        break
      case "getManifest":
        this.sendManifestData()
        break
      case "getSettings":
        this.sendSettingsData()
        break
      default:
        // Handle any other custom requests from client
        if (data.type) {
          ServerMessageBus.publish('client:response', {
            type: data.type,
            payload: data.payload
          })
        }
    }
  }

  public sendToClient(data: any) {
    ServerMessageBus.publish('client:request', {
      type: data.type,
      payload: data.payload,
      request: data.request
    })
  }

  private sendServerData() {
    const data = getServerData()
    ServerMessageBus.publish('client:response', {
      type: 'data',
      payload: data.data
    })
  }

  private sendManifestData() {
    const data = getManifestDetails()
    ServerMessageBus.publish('client:response', {
      type: 'manifest',
      payload: data
    })
  }

  private sendSettingsData() {
    const data = getServerData()
    ServerMessageBus.publish('client:response', {
      type: 'settings',
      payload: data.settings
    })
  }
}