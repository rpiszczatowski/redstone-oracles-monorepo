import axios from "axios";
import _ from "lodash";
import { BaseFetcher } from "../BaseFetcher";
import { getRequiredPropValue } from "../../utils/objects";
import symbolToId from "./coingecko-symbol-to-id.json";
import { config } from "../../config";
import { PricesObj } from "../../types";
import { stringifyError } from "../../utils/error-stringifier";

const idToSymbol = _.invert(symbolToId);

interface SimplePrices {
  [id: string]: { usd: number };
}

export class CoingeckoFetcher extends BaseFetcher {
  constructor() {
    super("coingecko");
  }

  override convertIdToSymbol(id: string) {
    return getRequiredPropValue(idToSymbol, id);
  }

  override convertSymbolToId(symbol: string) {
    return getRequiredPropValue(symbolToId, symbol);
  }

  async fetchData(ids: string[]): Promise<SimplePrices> {
    const { coingeckoApiUrl, coingeckoApiKey } = config;
    const response = await axios.get<SimplePrices>(coingeckoApiUrl, {
      params: {
        ids: ids.join(","),
        vs_currencies: "usd",
        ...(coingeckoApiKey && { x_cg_pro_api_key: coingeckoApiKey }),
      },
    });
    return response.data;
  }

  extractPrices(prices: SimplePrices): PricesObj {
    return this.extractPricesSafely(
      Object.keys(prices),
      (id) => {
        return prices[id].usd;
      },
      (id) => id
    );
  }
}
