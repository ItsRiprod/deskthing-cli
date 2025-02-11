import React, { useEffect, useRef, useState } from 'react'

import { sampleApps, sampleSongs } from './sampleData'
import { ClientService } from './clientService'
import { ClientMessageBus } from './clientMessageBus'

export const DevWrapper: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [manifest, setManifest] = useState<any>()
  const send = (data: any) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const augmentedData = { ...data, source: 'deskthing' }
      iframeRef.current.contentWindow.postMessage(augmentedData, '*')
    }
  }

  ClientService.initialize()

  useEffect(() => {
    ClientService.requestManifest((manifest) => {
      setManifest(manifest)
    })
  }, [])

  const handleMusic = (data) => {
    if (data.type == 'get') {
      send({ type: 'music', app: 'client', payload: sampleSongs })
    }
  }

  // Handles any settings requests from the iframe to the main app
  const handleSettings = (data) => {
    if (data.type == 'get') {
      ClientService.requestSettings((settings) => {
        send({ type: 'settings', app: 'client', payload: settings })
      })
    }
  }

  // Handles any apps requests from the iframe to the main app
  const handleApps = (data) => {
    if (data.type == 'get') {
      send({ type: 'apps', app: 'client', payload: sampleApps })
    }
  }

  const handleDefault = (data) => {
    if (data.type == 'key') {
      console.log('Key bubbling disabled in dev app')
    } else {
      console.log('Unknown or Unsupported request type: ', data)
    }
  }

  const handleManifest = (data) => {
    if (data.type == 'get') {
      console.log('Unable to get manifest in dev server. Pretend you got the server manifest')
    }
  }

  const handlers = {
    music: handleMusic,
    settings: handleSettings,
    apps: handleApps,
    key: handleDefault,
    action: handleDefault,
    manifest: handleManifest
  }

  useEffect(() => {

    // Handle messages from iframe
    const handleIframeEvent = (event: MessageEvent) => {
      
      if (event.origin !== 'http://localhost:5173') return

      // Forward iframe messages to server handler
      const appDataRequest = event.data.payload

      if (appDataRequest.app == 'client') {
        if (appDataRequest.type === 'get') {
          if (handlers[appDataRequest.request]) {
            handlers[appDataRequest.request](appDataRequest)
          } else {
            console.log('Unknown request type: ', appDataRequest.request)
          }
        } else if (appDataRequest.type === 'button') {
          handleDefault(appDataRequest)
        } else if (appDataRequest.type === 'key') {
          handleDefault(appDataRequest)
        } else if (appDataRequest.type === 'action') {
          handleDefault(appDataRequest)
        }
      } else {
        if (manifest) {
          ClientService.sendToApp({
            ...appDataRequest,
            app: appDataRequest.app || manifest?.id || 'unknownId'
          } as any)
        } else {
          ClientService.requestManifest((manifest) => {
            ClientService.sendToApp({
              ...appDataRequest,
              app: appDataRequest.app || manifest?.id || 'unknownId'
            } as any)
          })
        }
      }
    }

    window.addEventListener('message', handleIframeEvent)
    const unsubscribe = ClientMessageBus.subscribe('client:request', (data) => {
      send(data)
    })

    // Cleanup
    return () => {
      unsubscribe()
      window.removeEventListener('message', handleIframeEvent)
    }
  }, [manifest])

  return (
    <div className="dev-container" style={{ padding: 0, margin: 0, width: '100%', height: '100%' }}>
      <iframe 
        ref={iframeRef}
        src="http://localhost:5173/" 
        id="app"
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
      />
      <div id="debug-panel" />
    </div>
  )
}