import { v4 as uuidv4 } from "uuid";
import { WebSocketClient, WebSocketMessage } from "../WebSocketClient";
import { config } from "../../config";

export interface BinanceRequest {
  id: string;
  method: string;
  params: {
    symbols: string[];
  };
}

interface BinanceResponse {
  id: string;
  status: number;
  result: unknown;
}

export interface BinanceTickersResponse extends BinanceResponse {
  result: {
    symbol: string;
    price: number;
  }[];
}

type PendingRequests = {
  [key: string]: {
    onSuccess: (response: BinanceResponse) => void;
    onError: (error: Error) => void;
    timeout: NodeJS.Timeout;
  };
};

const REQUEST_TIMEOUT_MS = 5000;

export class BinanceClient {
  private client: WebSocketClient = new WebSocketClient(
    config.binanceWebsocketApiUrl,
    {
      onMessage: this.onMessage.bind(this),
      onClose: this.onClose.bind(this),
      onError: this.onError.bind(this),
    },
    {
      maxConnectionTimeMs: 1000 * 60 * 10,
      canRestartConnection: () => Object.keys(this.requests).length <= 0,
    }
  );
  private requests: PendingRequests = {};

  public fetchTickers(ids: string[]): Promise<BinanceTickersResponse> {
    return this.sendRequest<BinanceTickersResponse>({
      method: "ticker.price",
      params: {
        symbols: ids,
      },
    });
  }

  private onMessage(data: WebSocketMessage) {
    try {
      const response: BinanceResponse = JSON.parse(
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        data.toString()
      ) as BinanceResponse;

      if (!(response.id in this.requests)) {
        console.warn(
          "Received WebSocket message but no matching response listeners were found."
        );
        return;
      }

      this.requests[response.id].onSuccess(response);
      delete this.requests[response.id];
    } catch (e) {
      console.error("Could not process incoming Binance message: ", e);
    }
  }

  private onError(error: Error) {
    for (const requestId in this.requests) {
      const request = this.requests[requestId];
      request.onError(
        new Error(`Binance request ${requestId} failed: ${error.message}`)
      );
      delete this.requests[requestId];
    }
  }

  private onClose(code: number, reason: string) {
    for (const requestId in this.requests) {
      const request = this.requests[requestId];
      request.onError(
        new Error(
          `Binance request ${requestId} failed because WebSocket connection was closed. Code: ${code}. Reason: ${reason}`
        )
      );
      delete this.requests[requestId];
    }
  }

  private sendRequest<T extends BinanceResponse>(
    request: Omit<BinanceRequest, "id">
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const reqId = uuidv4();

      const req: BinanceRequest = {
        id: reqId,
        ...request,
      };

      this.requests[reqId] = {
        onSuccess: (result) => {
          clearTimeout(this.requests[reqId].timeout);
          resolve(result as T);
        },
        onError: (error: Error) => {
          clearTimeout(this.requests[reqId].timeout);
          reject(error);
        },
        timeout: setTimeout(() => {
          if (reqId in this.requests) {
            reject("Request timeout.");
            delete this.requests[reqId];
          }
        }, REQUEST_TIMEOUT_MS),
      };

      void this.client.send(JSON.stringify(req));
    });
  }
}
