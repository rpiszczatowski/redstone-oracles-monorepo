import axios from "axios";
import _ from "lodash";
import { BaseFetcher } from "../BaseFetcher";
import { getRequiredPropValue } from "../../utils/objects";
import symbolToId from "./coingecko-symbol-to-id.json";
import { config } from "../../config";
import { PricesObj } from "../../types";

const idToSymbol = _.invert(symbolToId);

const COINGECKO_TOKENS_LIMIT = 500;

interface SimplePrices {
  [id: string]: { usd: number };
}

export class CoingeckoFetcher extends BaseFetcher {
  constructor() {
    super("coingecko");
  }

  override convertIdToSymbol(id: string) {
    return getRequiredPropValue<string>(idToSymbol, id);
  }

  override convertSymbolToId(symbol: string) {
    return getRequiredPropValue<string>(symbolToId, symbol);
  }

  override async fetchData(ids: string[]): Promise<SimplePrices> {
    const { coingeckoApiUrl, coingeckoApiKey } = config;
    const idsChunks = _.chunk(ids, COINGECKO_TOKENS_LIMIT);

    let mergedPrices: SimplePrices = {};
    for (const idsChunk of idsChunks) {
      const response = await axios.get<SimplePrices>(coingeckoApiUrl, {
        params: {
          ids: idsChunk.join(","),
          vs_currencies: "usd",
          ...(coingeckoApiKey && { x_cg_pro_api_key: coingeckoApiKey }),
        },
      });
      mergedPrices = { ...mergedPrices, ...response.data };
    }

    return mergedPrices;
  }

  override extractPrices(prices: SimplePrices): PricesObj {
    return this.extractPricesSafely(Object.keys(prices), (id) => ({
      value: prices[id].usd,
      id,
    }));
  }
}
