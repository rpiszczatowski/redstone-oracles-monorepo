import axios from "axios";
import { BaseFetcher } from "../BaseFetcher";
import { getLastPrice } from "../../db/local-db";
import { PricesObj } from "../../types";
import { stringifyError } from "../../utils/error-stringifier";

const ETH_PAIRS_URL = "https://api.kyber.network/api/tokens/pairs";

export class KyberFetcher extends BaseFetcher {
  constructor() {
    super("kyber");
  }

  async fetchData() {
    return await axios.get(ETH_PAIRS_URL);
  }

  extractPrices(response: any, ids: string[]): PricesObj {
    const lastEthPrice = getLastPrice("ETH")?.value;

    const pricesObj: PricesObj = {};

    const pairs = response.data;
    for (const id of ids) {
      try {
        const pair = pairs["ETH_" + id];
        if (pair !== undefined && lastEthPrice) {
          pricesObj[id] = lastEthPrice * pair.currentPrice;
        }
      } catch (e: any) {
        this.logger.error(
          `Extracting price failed for: ${id}. ${stringifyError(e)}`
        );
      }
    }

    return pricesObj;
  }
}
