import WebSocket from "ws";
import { Consola } from "consola";
import createLogger from "../../utils/logger";

export interface WebSocketClientOptions {
  url: string;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
  reconnectionDelay?: number;
}

export class WsInstanceIsNotExistsError extends Error {
  constructor() {
    super("WebSocket instance does not exist.");
    this.name = "WsInstanceIsNotExistsError";
  }
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private heartbeatIntervalId: NodeJS.Timeout | null = null;
  private lastHeartbeatTimestamp: number = Date.now();
  private readonly url: string;
  private readonly heartbeatIntervalMs: number;
  private readonly heartbeatTimeoutMs: number;
  private readonly reconnectionDelayMs: number;
  protected logger: Consola;

  constructor(options: WebSocketClientOptions) {
    this.url = options.url;
    this.heartbeatIntervalMs = options.heartbeatInterval ?? 3 * 60 * 1000;
    // Add 1 second to the timeout to allow for some latency
    this.heartbeatTimeoutMs = options.heartbeatTimeout ?? 3 * 60 * 1000 + 2000;
    this.reconnectionDelayMs = options.reconnectionDelay ?? 5000;
    this.logger = createLogger("fetchers/WebSocketClient");

    this.connect();
  }

  private connect() {
    if (this.ws) {
      this.cleanup();
    }

    this.ws = new WebSocket(this.url);
    this.logger.info("Connecting to WebSocket:", this.url);

    this.ws.on("open", () => this.handleOpen());
    this.ws.on("message", (data) => this.handleMessage(data));
    this.ws.on("close", (code, reason) => this.handleClose(code, reason));
    this.ws.on("error", (error) => this.handleError(error));
    this.ws.on("ping", () => this.handlePing());
  }

  private handleOpen() {
    this.logger.info("WebSocket connection opened");
    this.startHeartbeat();
  }

  private handleMessage(data: WebSocket.RawData) {
    // Update heartbeat timestamp on any message received
    this.setLastHeartbeatTimestamp();
  }

  private handleClose(code: number, reason: Buffer) {
    this.logger.info("WebSocket connection closed:", code, reason.toString());
    this.cleanup();
    this.reconnect();
  }

  private handleError(error: Error) {
    this.logger.error("WebSocket error:", error);
    this.cleanup();
    this.reconnect();
  }

  private handlePing() {
    this.setLastHeartbeatTimestamp();
    this.ws?.pong();
  }

  private setLastHeartbeatTimestamp() {
    this.lastHeartbeatTimestamp = Date.now();
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.logger.info("Starting heartbeat");
    this.heartbeatIntervalId = setInterval(() => {
      const now = Date.now();
      if (now - this.lastHeartbeatTimestamp > this.heartbeatTimeoutMs) {
        this.logger.error("Heartbeat timeout. Reconnecting...");
        this.ws?.terminate();
      }
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat() {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  private reconnect() {
    this.logger.info(
      `Reconnecting to WebSocket in ${this.reconnectionDelayMs} ms`
    );
    setTimeout(() => this.connect(), this.reconnectionDelayMs);
  }

  private cleanup() {
    this.stopHeartbeat();
    this.ws?.removeAllListeners();
  }

  public sendMessage(message: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.error("WebSocket is not open. Cannot send message.");
      throw new WsInstanceIsNotExistsError();
    }

    this.ws.send(message);
  }

  public onResponse(callback: (data: WebSocket.RawData) => void) {
    if (!this.ws) {
      throw new WsInstanceIsNotExistsError();
    }

    this.ws.on("message", (data: WebSocket.RawData) => callback(data));
  }

  public close() {
    if (!this.ws) {
      throw new WsInstanceIsNotExistsError();
    }

    this.cleanup();
    this.ws.close();
  }
}
