import React, { useEffect, useRef, useState } from "react";
import { useClientStore } from "../stores/clientStore";
import { useMessageStore } from "../stores/messageStore";
import { useConnectionStore } from "../stores/connectionStore";
import { ClientService } from "../services/clientService";
import { DESKTHING_EVENTS, DEVICE_CLIENT } from "@deskthing/types";
import { Logger } from "../../services/logger";
import { ClientLogger } from "../services/clientLogger";

export const DevWrapper: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Client Store subscriptions
  const isViteServerConnected = useClientStore(
    (state) => state.isViteServerConnected
  );
  const connectionAttempts = useClientStore(
    (state) => state.connectionAttempts
  );
  const appManifest = useClientStore((state) => state.appManifest);
  const clientId = useClientStore((state) => state.clientId);
  const songData = useClientStore((state) => state.songData);
  const clientManifest = useClientStore((state) => state.clientManifest);
  const requestManifest = useClientStore((state) => state.requestManifest);

  // Message Store subscriptions
  const handleIframeMessage = useMessageStore(
    (state) => state.handleIframeMessage
  );
  const sendToIframe = useMessageStore((state) => state.sendToIframe);
  const processQueueItems = useMessageStore(
    (state) => state.processMessageQueue
  );

  // Connection Store subscriptions
  const initialize = useConnectionStore((state) => state.initialize);
  const checkViteServer = useConnectionStore((state) => state.checkViteServer);
  const setupMessageBusSubscription = useConnectionStore(
    (state) => state.setupMessageBusSubscription
  );
  const viteDevUrl = useConnectionStore((state) => state.viteDevUrl);

  useEffect(() => {
    // handle syncing the client manifest with the iframe
    if (clientManifest) {
      ClientLogger.debug("Sending client manifest to iframe", clientManifest);
      sendToIframe({
        type: DEVICE_CLIENT.MANIFEST,
        app: "client",
        payload: clientManifest,
      });
    }
  }, [clientManifest]);

  // Initialize connection on mount
  useEffect(() => {
    ClientLogger.info("🚀 DevWrapper initializing...");
    ClientLogger.info(`Target Vite URL: ${viteDevUrl}`);
    ClientLogger.info(`User Agent: ${navigator.userAgent}`);
    ClientLogger.info(`Location: ${window.location.href}`);

    initialize();
    requestManifest();
    checkViteServer();
  }, []);

  // Setup message bus subscription
  useEffect(() => {
    const unsubscribe = setupMessageBusSubscription();
    return unsubscribe;
  }, []);

  // Send song data when it changes
  useEffect(() => {
    sendToIframe({
      type: DEVICE_CLIENT.MUSIC,
      app: "client",
      payload: songData,
    });
  }, [songData]);

  // Handle iframe messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== viteDevUrl) return;
      handleIframeMessage(event.data.payload, event.origin);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [viteDevUrl, handleIframeMessage]);

  const handleIframeLoad = () => {
    ClientLogger.info(`🎯 Iframe loaded successfully from: ${viteDevUrl}`);

    if (!appManifest) {
      ClientLogger.warn("No app manifest available during iframe load");
      return;
    }

    const clientStatusPayload = {
      clientId,
      connected: true,
      timestamp: Date.now(),
      currentApp: appManifest.id,
    };

    ClientLogger.debug(
      "Sending connection events to app:",
      clientStatusPayload
    );

    // Send connection events
    ClientService.sendToApp({
      type: DESKTHING_EVENTS.CLIENT_STATUS,
      request: "connected",
      payload: clientStatusPayload,
    });

    ClientService.sendToApp({
      type: DESKTHING_EVENTS.CLIENT_STATUS,
      request: "opened",
      payload: clientStatusPayload,
    });

    sendToIframe({
      type: DEVICE_CLIENT.MANIFEST,
      app: "client",
      payload: clientManifest,
    });

    // initialize with the client manifest
    processQueueItems();
  };

  const handleIframeError = (error?: any) => {
    ClientLogger.error(`❌ Iframe failed to load from: ${viteDevUrl}`, error);
    ClientLogger.error(
      "This might be a CORS, network, or content loading issue"
    );

    ClientService.sendToApp({
      type: DESKTHING_EVENTS.CLIENT_STATUS,
      request: "disconnected",
      payload: clientId,
    });
  };

  const renderLoadingState = () => (
    <div className="flex flex-col justify-center items-center h-screen bg-[#2d2d2d] text-white font-sans">
      <p className="text-2xl font-bold">Connecting to Development Server...</p>
      <p className="text-center max-w-[80%]">
        Run the Vite Development of your frontend on {viteDevUrl} to view here!
      </p>
      {connectionAttempts > 0 && (
        <p className="mt-5 text-yellow-300">
          Connection attempts: {connectionAttempts} - Still trying to connect...
        </p>
      )}
    </div>
  );

  return (
    <div className="dev-container p-0 m-0 w-full h-full relative">
      {isViteServerConnected ? (
        <>
          {ClientLogger.info(`📺 Rendering iframe with src: ${viteDevUrl}`)}
          <iframe
            title="DeskThing App"
            ref={iframeRef}
            src={viteDevUrl}
            id="app"
            className="w-full h-full border-none"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            allow="fullscreen"
          />
        </>
      ) : (
        <>
          {ClientLogger.debug(
            `🔄 Showing loading state. Connection attempts: ${connectionAttempts}`
          )}
          {renderLoadingState()}
        </>
      )}
      <div id="debug-panel" />
    </div>
  );
};
