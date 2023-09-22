import {
  MultiRequestFetcher,
  RequestIdToResponse,
} from "../MultiRequestFetcher";
import { getLastPriceOrFail } from "../../db/local-db";

interface TokenPrices {
  mainTokenPrice: number;
  pairedTokenPrice: number;
}

export class NonUsdBasedFetcher extends MultiRequestFetcher {
  constructor() {
    super("non-usd-based");
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  override async makeRequest(id: string): Promise<TokenPrices> {
    const { mainToken, pairedToken } =
      NonUsdBasedFetcher.extractTokensFromId(id);

    const mainTokenPrice = getLastPriceOrFail(mainToken).value;
    const pairedTokenPrice = getLastPriceOrFail(pairedToken).value;
    return { mainTokenPrice, pairedTokenPrice };
  }

  static extractTokensFromId(id: string) {
    const tokensRegex = /([a-zA-Z0-9_]+)(?:\/|\.)([a-zA-Z0-9_]+)/;
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

  override extractPrice(
    dataFeedId: string,
    responses: RequestIdToResponse
  ): number {
    const response = responses[dataFeedId] as TokenPrices;
    const { mainTokenPrice, pairedTokenPrice } = response;
    return mainTokenPrice / pairedTokenPrice;
  }
}
