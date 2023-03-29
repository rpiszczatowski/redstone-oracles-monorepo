import axios from "axios";
import _ from "lodash";
import { BaseFetcher } from "../BaseFetcher";
import { getRequiredPropValue } from "../../utils/objects";
import { PricesObj } from "../../types";
import symbolToId from "./symbol-to-id.json";
import { config } from "../../config";
import { stringifyError } from "../../utils/error-stringifier";
const idToSymbol = _.invert(symbolToId);

const url = "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest";

export class CoinMarketCapFetcher extends BaseFetcher {
  constructor() {
    super("coinmarketcap");
  }

  override convertIdToSymbol(id: string) {
    return getRequiredPropValue(idToSymbol, id);
  }

  override convertSymbolToId(symbol: string) {
    return getRequiredPropValue(symbolToId, symbol);
  }

  async fetchData(ids: string[]): Promise<any> {
    const apiKey = config.coinmarketcapApiKey;
    if (!apiKey) {
      throw new Error("Missing Coinmarketcap API Key");
    }
    const response = await axios.get(url, {
      params: {
        id: ids.join(","),
      },
      headers: {
        "X-CMC_PRO_API_KEY": apiKey,
      },
    });
    return response.data;
  }

  extractPrices(response: any, ids: string[]): PricesObj {
    const tokenData = response.data;

    return this.extractPricesSafely(ids, (id) => ({
      value: tokenData?.[id]?.quote?.USD?.price,
      id,
    }));
  }
}
