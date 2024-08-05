import { BaseFetcher } from "../BaseFetcher";
import { PricesObjWithMetadata } from "../../types";
import { v4 } from "uuid";

const BINANCE_WS_URL = "wss://ws-api.binance.com:443/ws-api/v3";
const BINANCE_PING_INTERVAL_MS = 3 * 60 * 1000;
const symbols = ["btcusdt", "ethusdt", "bnbusdt"];

type BinanceWebSocketMessage = {
  id: string;
  method: string;
  params: { symbols: string[] };
};

type Result = {
  symbol: string;
  price: string;
};

type Response = {
  result: Result[];
};

export class BinanceFetcher extends BaseFetcher {
  constructor() {
    super("binance-websocket", BINANCE_WS_URL, BINANCE_PING_INTERVAL_MS);
    if (this.webSocketFetcher) {
      this.webSocketFetcher.connect();
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  override async fetchData(): Promise<void> {
    if (this.webSocketFetcher) {
      this.webSocketFetcher.on("open", () => {
        const message: BinanceWebSocketMessage = {
          id: v4(),
          method: "ticker.price",
          params: { symbols: symbols.map((symbol) => symbol.toUpperCase()) },
        };
        this.webSocketFetcher?.sendMessage(message);
      });
    }
  }

  override extractPrices(data: Response): PricesObjWithMetadata {
    const pricesObj: PricesObjWithMetadata = {};

    data.result.forEach((result) => {
      const price = parseFloat(result.price);
      const symbol = result.symbol;

      pricesObj[symbol] = {
        value: price,
        metadata: undefined,
      };
    });

    return pricesObj;
  }

  override getSymbols(): string[] {
    return symbols;
  }
}
