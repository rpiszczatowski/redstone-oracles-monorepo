import { BaseFetcher } from "../BaseFetcher";
import { getLastPrice } from "../../db/local-db";
import { PricesObj } from "../../types";

interface PricesById {
  [id: string]: {
    mainTokenPrice: number;
    pairedTokenPrice: number;
  };
}

export class NonUsdBasedFetcher extends BaseFetcher {
  constructor() {
    super("non-usd-based");
  }

  fetchData(ids: string[]): Promise<PricesById> {
    const prices: PricesById = {};
    for (const id of ids) {
      const { mainToken, pairedToken } = this.extractTokensFromId(id);

      const mainTokenPrice = getLastPrice(mainToken)?.value;
      const pairedTokenPrice = getLastPrice(pairedToken)?.value;
      if (!mainTokenPrice || !pairedTokenPrice) {
        throw new Error(
          `Cannot get last price from cache for: ${mainToken} or ${pairedToken}`
        );
      }
      prices[id] = { mainTokenPrice, pairedTokenPrice };
    }
    return Promise.resolve(prices);
  }

  extractTokensFromId(id: string) {
    const tokensRegex = /([a-zA-Z0-9_]+)\/([a-zA-Z0-9_]+)/;
    const tokens = id.match(tokensRegex);
    if (!tokens) {
      throw new Error(
        `Cannot extract tokens from id ${id} in non-usd-based fetcher`
      );
    }
    return {
      mainToken: tokens[1],
      pairedToken: tokens[2],
    };
  }

  extractPrices(response: PricesById): PricesObj {
    return this.extractPricesSafely(Object.keys(response), (id) => {
      const { mainTokenPrice, pairedTokenPrice } = response[id];
      return { id, value: mainTokenPrice / pairedTokenPrice };
    });
  }
}
