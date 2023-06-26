import { BaseFetcher } from "../BaseFetcher";
import { FetcherOpts, PricesObj, TokensConfig } from "../../types";

export class FixedValueFetcher extends BaseFetcher {
  constructor() {
    super("fixed-value");
  }

  async fetchData(_ids: string[], opts: FetcherOpts) {
    return this.getFixedTokenValuesFromManifest(opts.manifest.tokens);
  }

  extractPrices(response: any, ids: string[]): PricesObj {
    const result: PricesObj = {};

    for (const id of ids) {
      result[id] = response[id] ?? response.__DEFAULT__;
    }
    return result;
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
