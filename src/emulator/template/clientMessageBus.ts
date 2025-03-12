import { clientConfig } from "./clientConfig"
import { ClientLogger } from "./clientLogger"

export class ClientMessageBus {
    private static subscribers = new Map<string, Function[]>();
    private static ws: WebSocket | null;
    private static queue: {event: string, data: any}[] = []
    private static closeTimeoutId: NodeJS.Timeout | null = null
  
    static initialize(url: string = `ws://${window.location.hostname}:${clientConfig.linkPort}`) {
      if (this.ws) {
          ClientLogger.debug('Closing the old websocket')
          this.ws.close();
          this.ws = null;
      }
      this.ws = new WebSocket(url);
      this.ws.onopen = () => {
        ClientLogger.debug('WebSocket connection established on port ', clientConfig.linkPort);
        if (this.queue.length > 0) {
          this.queue.map((req) => this.publish(req.event, req.data))
          this.queue = []
        }
      };

      this.ws.onclose = () => {
        ClientLogger.debug('WebSocket connection closed');
        if (this.closeTimeoutId) {
          clearTimeout(this.closeTimeoutId)
        }
        this.closeTimeoutId = setTimeout(() => {
          this.initialize()
        }, 5000)
      };

      this.ws.onerror = (error) => {
        ClientLogger.error('WebSocket error:', error);
      };

      this.ws.onmessage = (event) => {
        const { event: eventName, data } = JSON.parse(event.data.toString());
        ClientLogger.debug('Received message', eventName, data);
        this.notify(eventName, data);
      };
    }
  
    static subscribe(event: string, callback: Function) {
      if (!this.subscribers.has(event)) {
        this.subscribers.set(event, []);
      }
      this.subscribers.get(event)?.push(callback);
      ClientLogger.debug('Subscribed to', event);
      return () => this.unsubscribe(event, callback);
    }
  
    static notify(event: string, data: any) {
      if (this.subscribers.has(event)) {
        this.subscribers.get(event)?.forEach((callback) => callback(data));
      }
    }
  
    static publish(event: string, data: any) {
      if (this.ws?.readyState === WebSocket.OPEN) {
          ClientLogger.debug('Publishing message', event, data);
          this.ws.send(JSON.stringify({ event, data }));
      } else {
        this.queue.push({ event, data })
      }
    }
  
    private static unsubscribe(event: string, callback: Function) {
      const callbacks = this.subscribers.get(event);
      const index = callbacks?.indexOf(callback);
      if (callbacks && index !== undefined && index > -1) {
        callbacks.splice(index, 1);
        ClientLogger.debug('Unsubscribed from', event);
      }
    }
  }
  