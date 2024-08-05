import { FetcherOpts, PricesObjWithMetadata, PricesObj } from "../../types";
import { BaseFetcher } from "../BaseFetcher";
import * as symbolToId from "./symbol-to-id/binance.json";
import { invert } from "lodash";
import { getRequiredPropValue } from "../../utils/objects";
import { Prices } from "./BinanceWsClient";
import { DI } from "./di";

export class BinanceWsFetcher extends BaseFetcher {
  private client = new DI.BinanceWsClient(this.logger);
  private readonly symbolToId = symbolToId;
  private readonly idToSymbol = invert(symbolToId);
  constructor() {
    super("binance-ws");
  }

  override convertIdToSymbol(id: string) {
    return getRequiredPropValue<string>(this.idToSymbol, id);
  }

  override convertSymbolToId(symbol: string) {
    return getRequiredPropValue<string>(this.symbolToId, symbol);
  }

  override async fetchData(ids: string[], opts?: FetcherOpts): Promise<Prices> {
    const result = await this.client.getPrices(
      ids,
      opts?.manifest.sourceTimeout
    );
    return result;
  }

  override extractPrices(response: Prices): PricesObjWithMetadata | PricesObj {
    const prices: PricesObj = {};
    for (const price of response) {
      prices[price.symbol] = price.price;
    }
    return prices;
  }
}
