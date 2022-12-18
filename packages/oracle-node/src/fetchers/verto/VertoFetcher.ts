import axios from "axios";
import { BaseFetcher } from "../BaseFetcher";
import { getLastPrice } from "../../db/local-db";
import { PricesObj } from "../../types";

const vertoSymbolToId = require("./verto-symbol-to-id.json");

const BASE_URL = "https://v2.cache.verto.exchange";

// URL or fetching all tokens details: https://v2.cache.verto.exchange/tokens

export class VertoFetcher extends BaseFetcher {
  constructor() {
    super("verto");
  }

  async fetchData(ids: string[]): Promise<any> {
    const tokenPromises = ids.map((s) =>
      axios.get(`${BASE_URL}/token/${vertoSymbolToId[s]}/price`)
    );

    return await Promise.all(tokenPromises);
  }

  async extractPrices(responses: any): Promise<PricesObj> {
    const lastArPrice = getLastPrice("AR")?.value;

    const pricesObj: PricesObj = {};

    for (const response of responses) {
      if (response && response.data && lastArPrice) {
        const quote = response.data;
        pricesObj[quote.ticker] = quote.price * lastArPrice;
      }
    }

    return pricesObj;
  }
}
