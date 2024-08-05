import WebSocket from "ws";
import { EventEmitter } from "events";
import { stringifyData } from "../utils/objects";

interface WebSocketMessage {
  id: string;
  method: string;
  params: unknown;
}

export class WebSocketFetcher extends EventEmitter {
  private ws?: WebSocket;
  private pingInterval?: NodeJS.Timeout;
  private reconnectTimeout?: NodeJS.Timeout;
  private readonly reconnectDelay = 5000;

  constructor(
    private url: string,
    private pingIntervalMs: number
  ) {
    super();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.on("open", this.handleOpen.bind(this));
    this.ws.on("message", this.handleMessage.bind(this));
    this.ws.on("error", this.handleError.bind(this));
    this.ws.on("close", this.handleClose.bind(this));
  }

  private handleOpen() {
    console.log("WebSocket connection opened for", this.url);
    this.emit("open");
    this.startPing();
  }

  private handleMessage(data: WebSocket.Data) {
    const message = stringifyData(data);
    console.log("WebSocket message received:", message);
    this.emit("data", message);
  }

  private handleError(error: Error) {
    console.error("WebSocket error:", error);
    this.emit("error", error);
  }

  private handleClose() {
    console.log("WebSocket connection closed");
    this.emit("close");
    this.stopPing();
    this.scheduleReconnect();
  }

  private startPing() {
    this.stopPing(); // Clear any existing intervals
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, this.pingIntervalMs);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }
  }

  private scheduleReconnect() {
    this.stopReconnect(); // Clear any existing timeout
    this.reconnectTimeout = setTimeout(() => {
      console.log("Reconnecting WebSocket...");
      this.connect();
    }, this.reconnectDelay);
  }

  private stopReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
  }

  sendMessage(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("Sending WebSocket message: ", message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not open. Ready state:", this.ws?.readyState);
    }
  }

  close() {
    this.stopPing();
    this.stopReconnect();
    if (this.ws) {
      this.ws.close();
      this.ws.removeAllListeners();
    }
  }
}
