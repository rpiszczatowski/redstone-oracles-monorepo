import { BaseFetcher } from "../BaseFetcher";
import { PricesObj } from "../../types";
import { BinanceClient, BinanceTickersResponse } from "./BinanceClient";

const SYMBOL_SUFFIX = "USDT";

export class BinanceFetcher extends BaseFetcher {
  private client = new BinanceClient();

  constructor() {
    super("binance-ws");
  }

  override convertIdToSymbol(id: string) {
    return id.substring(0, id.length - SYMBOL_SUFFIX.length);
  }

  override convertSymbolToId(symbol: string) {
    return `${symbol}${SYMBOL_SUFFIX}`;
  }

  override validateResponse(
    response: BinanceTickersResponse | undefined
  ): boolean {
    return !(response === undefined || response.status != 200);
  }

  override async fetchData(ids: string[]): Promise<BinanceTickersResponse> {
    return await this.client.fetchTickers(ids);
  }

  override extractPrices(res: BinanceTickersResponse): PricesObj {
    return this.extractPricesSafely(res.result, (item) => ({
      value: item.price,
      id: item.symbol,
    }));
  }
}
