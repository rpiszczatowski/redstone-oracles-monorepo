import axios from "axios";
import { BaseFetcher } from "../BaseFetcher";
import { getLastPrice } from "../../db/local-db";
import { PricesObj } from "../../types";

const ETH_PAIRS_URL = "https://api.kyber.network/api/tokens/pairs";

type Pair = Record<string, undefined | { currentPrice: number }>;

export class KyberFetcher extends BaseFetcher {
  constructor() {
    super("kyber");
  }

  async fetchData() {
    return await axios.get(ETH_PAIRS_URL);
  }

  extractPrices(response: any, ids: string[]): PricesObj {
    const lastEthPrice = getLastPrice("ETH")?.value;

    const pairs = response.data as Pair;

    return this.extractPricesSafely(ids, (id) =>
      this.extractPricePair(pairs, id, lastEthPrice)
    );
  }

  private extractPricePair(
    pairs: Pair,
    id: string,
    lastEthPrice: number | undefined
  ) {
    const pair = pairs["ETH_" + id];
    if (pair !== undefined && lastEthPrice) {
      return { value: lastEthPrice * pair.currentPrice, id };
    } else {
      throw new Error(`Pair not found ${id}`);
    }
  }
}
