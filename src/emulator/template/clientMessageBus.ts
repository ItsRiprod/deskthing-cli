
export class ClientMessageBus {
    private static subscribers = new Map<string, Function[]>();
    private static ws: WebSocket | null;
  
    static initialize(url: string = "ws://localhost:8080") {
      if (this.ws) {
          this.ws.close();
          this.ws = null;
      }
      this.ws = new WebSocket(url);
  
      this.ws.onmessage = (event) => {
        const { event: eventName, data } = JSON.parse(event.data.toString());
        this.notify(eventName, data);
      };
    }
  
    static subscribe(event: string, callback: Function) {
      if (!this.subscribers.has(event)) {
        this.subscribers.set(event, []);
      }
      this.subscribers.get(event)?.push(callback);
      return () => this.unsubscribe(event, callback);
    }
  
    static notify(event: string, data: any) {
      if (this.subscribers.has(event)) {
        this.subscribers.get(event)?.forEach((callback) => callback(data));
      }
    }
  
    static publish(event: string, data: any) {
      if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ event, data }));
      }
    }
  
    private static unsubscribe(event: string, callback: Function) {
      const callbacks = this.subscribers.get(event);
      const index = callbacks?.indexOf(callback);
      if (callbacks && index !== undefined && index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  