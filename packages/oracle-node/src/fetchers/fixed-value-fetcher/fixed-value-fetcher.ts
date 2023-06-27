import { BaseFetcher } from "../BaseFetcher";
import { FetcherOpts, PricesObj, TokensConfig } from "../../types";

export class FixedValueFetcher extends BaseFetcher {
  constructor() {
    super("fixed-value");
  }

  async fetchData(_ids: string[], opts: FetcherOpts) {
    return this.getFixedTokenValuesFromManifest(opts.manifest.tokens);
  }

  extractPrices(response: Record<string, number>): PricesObj {
    return response;
  }

  getFixedTokenValuesFromManifest(tokens: TokensConfig) {
    const fixedTokenValues: Record<string, number> = {};
    for (const [dataFeedId, config] of Object.entries(tokens)) {
      if (config.fixedValue) {
        fixedTokenValues[dataFeedId] = config.fixedValue;
      }
    }
    return fixedTokenValues;
  }
}
