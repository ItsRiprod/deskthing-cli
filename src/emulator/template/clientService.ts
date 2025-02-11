import { ClientMessageBus } from './clientMessageBus'

export class ClientService {
  private static responseHandlers = new Map<string, (data: any) => void>()

  static initialize() {
    console.log('Initializing the wrapper...')
    ClientMessageBus.initialize('ws://localhost:8080')
    ClientMessageBus.subscribe("client:response", (data: any) => {
      const handler = ClientService.responseHandlers.get(data.type)
      if (handler) {
        handler(data.payload)
      }
    })
  }

  static requestServerData(callback: (data: any) => void) {
    ClientService.responseHandlers.set('data', callback)
    ClientMessageBus.publish("client:request", { type: "getData" })
  }

  static requestManifest(callback: (data: any) => void) {
    ClientService.responseHandlers.set('manifest', callback)
    ClientMessageBus.publish("client:request", { type: "getManifest" })
  }

  static requestSettings(callback: (data: any) => void) {
    ClientService.responseHandlers.set('settings', callback)
    ClientMessageBus.publish("client:request", { type: "getSettings" })
  }

  static sendToServer(data: any) {
    ClientMessageBus.publish("client:request", data)
  }

  static sendToApp(data: any) {
    ClientMessageBus.publish("app:data", data)
  }
}