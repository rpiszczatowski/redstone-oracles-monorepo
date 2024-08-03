import { v4 as uuidv4 } from "uuid";

import WebSocket from "ws";
import { WebSocketFetcher } from "../base-websocket-fetcher/WebSocketFetcher";
import { WebSocketClientOptions } from "../base-websocket-fetcher/WebSocketClient";
import _ from "lodash";
import symbolToPair from "./symbol-to-pair.json";
import { getRequiredPropValue } from "../../utils/objects";
const pairToSymbol = _.invert(symbolToPair);

type TickerPriceMethod = "ticker.price";

type TickerPriceRequest = {
  id: string;
  method: TickerPriceMethod;
  params: {
    symbol: string;
  };
};

type RateLimit = {
  rateLimitType: string;
  interval: string;
  intervalNum: number;
  limit: number;
  count: number;
};

type TickerPriceResponse = {
  id: string;
  status: number;
  result?: {
    symbol: string;
    price: string;
  };
  error?: {
    code: number;
    msg: string;
  };
  rateLimits: RateLimit[];
};

// TODO: handle rate limits
export class BinancePriceWebSocketFetcher extends WebSocketFetcher<
  TickerPriceRequest,
  TickerPriceResponse
> {
  constructor(
    wsClientOptions: WebSocketClientOptions,
    pendingResponseTimoutMs: number
  ) {
    super(
      "BinanceCurrentPriceWebSocketFetcher",
      wsClientOptions,
      pendingResponseTimoutMs
    );
  }

  override convertIdToSymbol(id: string) {
    return getRequiredPropValue<string>(pairToSymbol, id);
  }

  override convertSymbolToId(symbol: string) {
    return getRequiredPropValue<string>(symbolToPair, symbol);
  }

  override prepareWsRequest(ticker: string): TickerPriceRequest {
    const requestId = uuidv4();

    return {
      id: requestId,
      method: "ticker.price",
      params: {
        symbol: ticker,
      },
    };
  }

  override getPriceFromResponse(response: TickerPriceResponse): number {
    return Number(response.result?.price);
  }

  override extractRequestIdFromRequest(wsRequest: TickerPriceRequest): string {
    return wsRequest.id;
  }

  override extractRequestIdFromResponse(
    wsResponse: TickerPriceResponse
  ): string {
    return wsResponse.id;
  }

  override serializeRequest(wsRequest: TickerPriceRequest): string {
    return JSON.stringify(wsRequest);
  }

  override parseResponse(data: WebSocket.Data): TickerPriceResponse {
    return JSON.parse(data.toString());
  }

  override checkResponseOkUnlessThrow(response: TickerPriceResponse) {
    if (response.error) {
      throw new Error(
        `Error in response: ${response.error.msg} (code: ${response.error.code})`
      );
    }

    if (response.status !== 200) {
      throw new Error(`Non-200 status code in response: ${response.status}`);
    }
  }
}
