import { getLastPrice } from "../../db/local-db";
import {
  MultiRequestFetcher,
  RequestIdToResponse,
} from "../MultiRequestFetcher";

interface TokenPrices {
  mainTokenPrice: number;
  pairedTokenPrice: number;
}

export class NonUsdBasedFetcher extends MultiRequestFetcher {
  constructor() {
    super("non-usd-based");
  }

  async makeRequest(id: string): Promise<TokenPrices> {
    const { mainToken, pairedToken } = this.extractTokensFromId(id);

    const mainTokenPrice = getLastPrice(mainToken)?.value;
    const pairedTokenPrice = getLastPrice(pairedToken)?.value;
    if (!mainTokenPrice || !pairedTokenPrice) {
      throw new Error(
        `Cannot get last price from cache for: ${mainToken} or ${pairedToken}`
      );
    }
    return { mainTokenPrice, pairedTokenPrice };
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

  extractPrice(dataFeedId: string, responses: RequestIdToResponse): number {
    const response = responses[dataFeedId] as TokenPrices;
    const { mainTokenPrice, pairedTokenPrice } = response;
    return mainTokenPrice / pairedTokenPrice;
  }
}
