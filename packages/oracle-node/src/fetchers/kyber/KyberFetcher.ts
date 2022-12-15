import axios from "axios";
import { BaseFetcher } from "../BaseFetcher";
import { getLastPrice } from "../../db/local-db";
import { PricesObj } from "../../types";

const ETH_PAIRS_URL = "https://api.kyber.network/api/tokens/pairs";

export class KyberFetcher extends BaseFetcher {
  constructor() {
    super("kyber");
  }

  async fetchData() {
    return await axios.get(ETH_PAIRS_URL);
  }

  async extractPrices(response: any, ids: string[]): Promise<PricesObj> {
    const lastEthPrice = getLastPrice("ETH")?.value;

    const pricesObj: PricesObj = {};

    const pairs = response.data;
    for (const id of ids) {
      const pair = pairs["ETH_" + id];
      if (pair !== undefined && lastEthPrice) {
        pricesObj[id] = lastEthPrice * pair.currentPrice;
      }
    }

    return pricesObj;
  }
}
