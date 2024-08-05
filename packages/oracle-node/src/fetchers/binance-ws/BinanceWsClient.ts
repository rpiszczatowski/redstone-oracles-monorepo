import { Consola } from "consola";
import { config } from "../../config";
import { z } from "zod";
import { WebsocketClientAdapter } from "./WebsocketClientAdapter";
import { DI } from "./di";

export const PriceSchema = z.array(
  z.object({
    symbol: z.string(),
    price: z.string(),
  })
);

export type Prices = z.infer<typeof PriceSchema>;

export class BinanceWsClient {
  private connecting = false;
  private connectingPromise: Promise<void> | null = null;
  private client: WebsocketClientAdapter | null = null;
  private requests = new WsRequests();
  private timeout = 5000;

  public constructor(private readonly logger: Consola) {}

  public async getPrices(symbols: string[], timeout?: number): Promise<Prices> {
    if (timeout) {
      this.timeout = timeout;
    }
    const client = await this.lazyConnect();

    const { id, promise } = this.requests.newRequest(this.timeout);

    client.tryWsSend(
      `api`,
      JSON.stringify({
        id,
        method: "ticker.price",
        params: {
          symbols,
        },
      })
    );

    const result = await promise;

    const parsedResult = PriceSchema.parse(result);

    return parsedResult;
  }

  private async lazyConnect(): Promise<WebsocketClientAdapter> {
    if (this.connecting) {
      await this.connectingPromise;
    }
    let client = this.client;
    if (!client) {
      client = await this.connect();
    }
    return client;
  }

  private async connect(): Promise<WebsocketClientAdapter> {
    this.connecting = true;
    let connectingResolve: () => void = () => {};
    let connectingReject: (error: Error) => void = () => {};
    this.connectingPromise = new Promise((resolve, reject) => {
      connectingResolve = resolve;
      connectingReject = reject;
    });

    this.client = new DI.WebsocketClientAdapter(
      {
        wsUrl: config.binanceWsApiUrl,
      },
      {
        silly: this.logger.trace.bind(this.logger),
        debug: this.logger.debug.bind(this.logger),
        notice: this.logger.debug.bind(this.logger),
        info: this.logger.info.bind(this.logger),
        warning: this.logger.warn.bind(this.logger),
        error: this.logger.error.bind(this.logger),
      }
    );

    this.client.on("open", () => {
      this.connecting = false;
      connectingResolve();
    });

    this.client.on("reply", (message) => {
      const requestId = message.data.id.toString();
      this.requests.resolve(requestId, message.data.result);
    });

    this.client.onReplyError((message) => {
      this.logger.error(message);
      const requestId = message.data.id.toString();
      this.requests.reject(requestId, new Error(`request failed`));
    });

    this.client.on("error", (message) => {
      this.logger.error(message);
    });

    this.client.connectToWsUrl(config.binanceWsApiUrl, "api");

    setTimeout(() => {
      if (this.connecting) {
        this.connecting = false;
        this.client?.closeAll(false);
        this.client?.removeAllListeners();
        this.client = null;
        connectingReject(new Error("Connecting timed out"));
      }
    }, this.timeout);

    await this.connectingPromise;
    return this.client;
  }
}

export class WsRequests {
  private requestPromises: Record<
    string,
    | {
        resolve: (data: unknown) => void;
        reject: (error: Error) => void;
      }
    | undefined
  > = {};

  public newRequest(timeout: number) {
    const id = crypto.randomUUID();
    const promise = new Promise((resolve, reject) => {
      this.requestPromises[id] = {
        resolve,
        reject,
      };
    });

    setTimeout(() => {
      const request = this.requestPromises[id];
      if (request) {
        request.reject(new Error("Request timeout"));
        delete this.requestPromises[id];
      }
    }, timeout);

    return {
      promise,
      id,
    };
  }

  public reject(requestId: string, error: Error) {
    const request = this.requestPromises[requestId];
    if (request) {
      request.reject(error);
      delete this.requestPromises[requestId];
    }
  }

  public resolve(requestId: string, data: unknown) {
    const request = this.requestPromises[requestId];
    if (request) {
      request.resolve(data);
      delete this.requestPromises[requestId];
    }
  }
}
