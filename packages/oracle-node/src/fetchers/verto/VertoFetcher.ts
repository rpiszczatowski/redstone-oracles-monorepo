import axios from "axios";
import { getLastPrice } from "../../db/local-db";
import { PricesObj } from "../../types";
import { MultiRequestFetcher } from "../MultiRequestFetcher";

const vertoSymbolToId = require("./verto-symbol-to-id.json");

const BASE_URL = "https://v2.cache.verto.exchange";

// URL or fetching all tokens details: https://v2.cache.verto.exchange/tokens

export class VertoFetcher extends MultiRequestFetcher {
  constructor() {
    super("verto");
  }

  makeRequest(id: string): Promise<any> {
    return axios.get(`${BASE_URL}/token/${vertoSymbolToId[id]}/price`);
  }

  getProcessingContext(): any {
    return getLastPrice("AR")?.value;
  }

  processData(
    quote: any,
    pricesObj: PricesObj,
    lastArPrice?: number
  ): PricesObj {
    if (lastArPrice === undefined) {
      return pricesObj;
    }

    pricesObj[quote.ticker] = quote.price * lastArPrice;

    return pricesObj;
  }
}
