import React, { useEffect, useMemo, useRef, useState } from "react"

import { sampleApps, sampleSongs } from "./sampleData"
import { ClientService } from "./clientService"
import { ClientMessageBus } from "./clientMessageBus"
import { ClientLogger } from "./clientLogger"
import { clientConfig } from "./clientConfig"
import { Client, FromDeviceData, DEVICE_CLIENT, DESKTHING_EVENTS, SongData, ClientToDeviceData } from '@deskthing/types'

export const DevWrapper: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [manifest, setManifest] = useState<any>()
  const [isViteServerConnected, setIsViteServerConnected] = useState(false)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const [songData, setSongData] = useState<SongData>(sampleSongs)

  const viteDevUrl = useMemo(() => {
    return clientConfig.viteLocation + ":" + clientConfig.vitePort
  }, [clientConfig])

  const send = (data: FromDeviceData) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const augmentedData = { ...data, source: "deskthing" }
      iframeRef.current.contentWindow.postMessage(augmentedData, "*")
    }
  }

  ClientService.initialize()

  useEffect(() => {
    ClientService.requestManifest((manifest) => {
      setManifest(manifest)
    })
  }, [])

  useEffect(() => {
    const checkViteServer = async () => {
      fetch(viteDevUrl, { method: "HEAD", mode: "no-cors" })
        .then(() => {
          setIsViteServerConnected(true)
        })
        .catch(() => {
          setIsViteServerConnected(false)
          setConnectionAttempts((prev) => prev + 1)
          // Retry with increasing delay (max 5 seconds)
          setTimeout(
            checkViteServer,
            Math.min(connectionAttempts * 1000, 5000)
          )
        })
    }

    checkViteServer()

    return () => {
      // Cleanup if needed
    }
  }, [connectionAttempts])

  useEffect(() => {
    send({ type: DEVICE_CLIENT.MUSIC, app: 'client', payload: songData })
  }, [songData])

  const handleMusic = (data) => {
    if (data.type == "get") {
      ClientLogger.debug("Get request for music, Sending music", songData)
      ClientService.sendToApp({
        type: 'get',
        request: 'song',
        app: data.app || manifest?.id || "unknownId",
      })
      send({ type: DEVICE_CLIENT.MUSIC, app: "client", payload: songData })
    }
  }

  // Handles any settings requests from the iframe to the main app
  const handleSettings = (data) => {
    if (data.type == "get") {
      ClientLogger.debug("Get request for settings, Sending settings")
      ClientService.requestSettings((settings) => {
        send({ type: DEVICE_CLIENT.SETTINGS, app: "client", payload: settings })
      })
    }
  }

  // Handles any apps requests from the iframe to the main app
  const handleApps = (data: { type: string }) => {
    if (data.type == "get") {
      ClientLogger.debug("Get request for apps, Sending apps", sampleApps)
      send({ type: DEVICE_CLIENT.APPS, app: "client", payload: sampleApps })
    }
  }

  const handleDefault = (data) => {
    if (data.type == "key") {
      ClientLogger.debug("Key bubbling disabled in dev app")
    } else {
      ClientLogger.debug("Unknown or Unsupported request type: ", data)
    }
  }

  const handleLog = (data) => {
    if (data.type == "log") {
      ClientLogger.clientLog(data.request, data.payload.message, ...(data.payload.data || []))
    }
  }

  const handleManifest = (data) => {
    if (data.type == "get") {
      ClientLogger.debug("Get request for manifest, Sending manifest")
      ClientService.requestManifest((manifest) => {
        ClientLogger.debug('Sending manifest', manifest)
        send({
          type: DEVICE_CLIENT.MANIFEST,
          app: "client",
          payload: manifest,
        })
      })
    }
  }

  const handleAction = (data: Extract<ClientToDeviceData, { type: 'action' | 'key'}>) => {
    ClientLogger.debug('Handling action', data)
    if (data.type == 'action') {
      if (manifest) {
        ClientService.sendToApp({
          ...data,
          app: data.app || manifest?.id || "unknownId",
        } as any)
      } else {
        ClientService.requestManifest((manifest) => {
          setManifest(manifest)
          ClientService.sendToApp({
            ...data,
            app: data.app || manifest?.id || "unknownId",
          } as any)
        })
      }
    } else {
      ClientService.sendToApp({
        ...data,
        app: data.app || manifest?.id || "unknownId",
      } as any)
    }
  }

  const handlers = {
    music: handleMusic,
    settings: handleSettings,
    apps: handleApps,
    key: handleDefault,
    action: handleDefault,
    manifest: handleManifest,
    log: handleLog
  }

  useEffect(() => {
    // Handle messages from iframe
    const handleIframeEvent = (event: MessageEvent) => {
      if (event.origin !== viteDevUrl) return

      // Forward iframe messages to server handler
      const appDataRequest = event.data.payload as ClientToDeviceData

      if (appDataRequest.app == "client") {
        if (appDataRequest.type === "get") {
          if (handlers[appDataRequest.request]) {
            handlers[appDataRequest.request](appDataRequest)
          } else {
            ClientLogger.debug("Unknown request type: ", appDataRequest.request)
          }
        } else if (appDataRequest.type as string === "button") {
          handleDefault(appDataRequest)
        } else if (appDataRequest.type === "key") {
          handleAction(appDataRequest)
        } else if (appDataRequest.type === "action") {
          handleAction(appDataRequest)
        } else if (appDataRequest.type === "log") {
          handleLog(appDataRequest)
        }
      } else {
        ClientLogger.debug('Sending data to server', appDataRequest)
        if (manifest) {
          ClientService.sendToApp({
            ...appDataRequest,
            app: appDataRequest.app || manifest?.id || "unknownId",
          })
        } else {
          ClientService.requestManifest((manifest) => {
            setManifest(manifest)
            ClientService.sendToApp({
              ...appDataRequest,
              app: appDataRequest.app || manifest?.id || "unknownId",
            })
          })
        }
      }
    }

    window.addEventListener("message", handleIframeEvent)
    const unsubscribe = ClientMessageBus.subscribe("client:request", (data) => {
      ClientLogger.debug("Received message from server", data)
      if (data.app == 'client') {
        if (data.type == 'song') {
          setSongData(prev => ({...prev, ...data.payload}))
        }
      }
      send(data)
    })

    // Cleanup
    return () => {
      unsubscribe()
      window.removeEventListener("message", handleIframeEvent)
    }
  }, [manifest])

  // Update when iframe loads successfully
  const handleIframeLoad = () => {
    ClientService.sendToApp({
      type: DESKTHING_EVENTS.CLIENT_STATUS,
      request: 'connected',
      payload: {
        id: 'deskthing-client',
        connectionId: '1234567890',
        connected: true,
        timestamp: Date.now(),
        currentApp: manifest.id
      } as Client
    } as any)
    ClientService.sendToApp({
      type: DESKTHING_EVENTS.CLIENT_STATUS,
      request: 'opened',
      payload: {
        id: 'deskthing-client',
        connectionId: '1234567890',
        connected: true,
        timestamp: Date.now(),
        currentApp: manifest.id
      } as Client
    } as any)
    setIsViteServerConnected(true)
  }

  const handleIframeError = () => {
    ClientService.sendToApp({
      type: DESKTHING_EVENTS.CLIENT_STATUS,
      request: 'disconnected',
      payload: {
        id: 'deskthing-client',
        connectionId: '1234567890',
        connected: false,
        timestamp: Date.now(),
        currentApp: undefined
      } as Client
    } as any)
    ClientService.sendToApp({
      type: DESKTHING_EVENTS.CLIENT_STATUS,
      request: 'closed',
      payload: {
        id: 'deskthing-client',
        connectionId: '1234567890',
        connected: true,
        timestamp: Date.now(),
        currentApp: undefined
      } as Client
    } as any)
    setIsViteServerConnected(false)
    setConnectionAttempts((prev) => prev + 1)
  }

  const renderLoadingState = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#2d2d2d",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <p style={{ fontSize: "1.5em", fontWeight: "bold" }}>
        Connecting to Development Server...
      </p>
      <p style={{ textAlign: "center", maxWidth: "80%" }}>
        Run the Vite Development of your frontend on port 5173 to view here!
      </p>
      {connectionAttempts > 0 && (
        <p style={{ marginTop: "20px", color: "#ffcc00" }}>
          Connection attempts: {connectionAttempts} - Still trying to connect...
        </p>
      )}
    </div>
  )

  return (
    <div
      className="dev-container"
      style={{ padding: 0, margin: 0, width: "100%", height: "100%" }}
    >
      {isViteServerConnected ? (
        <iframe
          title="DeskThing App"
          ref={iframeRef}
          src={viteDevUrl}
          id="app"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      ) : (
        renderLoadingState()
      )}
      <div id="debug-panel" />
    </div>
  )
}
