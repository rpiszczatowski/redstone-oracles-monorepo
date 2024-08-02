import WebSocket from "ws";

export type WebSocketMessage = Buffer | ArrayBuffer | Buffer[];

export type OnWebSocketMessage = (data: WebSocketMessage) => void;
export type OnWebSocketError = (error: Error) => void;
export type OnWebSocketClose = (code: number, reason: string) => void;

export interface WebSocketEvents {
  onMessage?: OnWebSocketMessage;
  onError?: OnWebSocketError;
  onClose?: OnWebSocketClose;
}

export interface WebsocketOptions {
  maxConnectionTimeMs?: number;
  canRestartConnection?: () => boolean;
}

const CONNECTION_CLOSE_RETRY_AFTER_MS = 1000;

export class WebSocketClient {
  private readonly url: string;
  private readonly events: WebSocketEvents;
  private ws: WebSocket | null = null;
  private options: WebsocketOptions;
  private restartConnectionTimeout: NodeJS.Timeout | null = null;

  constructor(
    url: string,
    events: WebSocketEvents,
    options: WebsocketOptions = {}
  ) {
    this.url = url;
    this.events = events;
    this.options = options;
  }

  public async send(data: string): Promise<void> {
    const ws = await this.getConnection();
    ws.send(data);
  }

  private connect(): Promise<WebSocket> {
    return new Promise((resolve) => {
      const ws = new WebSocket(this.url);
      ws.on("error", (e) => {
        if (this.events.onError) {
          this.events.onError(e);
        }
      });

      ws.on("open", () => {
        if (this.options.maxConnectionTimeMs) {
          this.restartConnectionTimeout = setTimeout(() => {
            this.safelyCloseConnection();
          }, this.options.maxConnectionTimeMs);
        }

        resolve(ws);
      });

      ws.on("message", (data) => {
        if (this.events.onMessage) {
          this.events.onMessage(data);
        }
      });

      ws.on("close", (code, reason) => {
        this.cleanupConnection();
        if (this.events.onClose) {
          this.events.onClose(code, reason.toString());
        }
      });
    });
  }

  // This function closes connection only if parent agrees to it (e.g. if there are pending requests). Closing is delayed otherwise.
  private safelyCloseConnection() {
    const canClose = this.options.canRestartConnection
      ? this.options.canRestartConnection()
      : false;

    if (canClose) {
      this.ws?.close();
    } else {
      this.restartConnectionTimeout = setTimeout(() => {
        this.safelyCloseConnection();
      }, CONNECTION_CLOSE_RETRY_AFTER_MS);
    }
  }

  private cleanupConnection() {
    this.ws = null;

    if (this.restartConnectionTimeout) {
      clearTimeout(this.restartConnectionTimeout);
    }
  }

  private async getConnection(): Promise<WebSocket> {
    if (this.ws) {
      return this.ws;
    }

    this.ws = await this.connect();

    return this.ws;
  }
}
