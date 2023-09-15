import { BaseFetcher } from "../BaseFetcher";
import { FetcherOpts, PricesObj, TokensConfig } from "../../types";

export class FixedValueFetcher extends BaseFetcher {
  constructor() {
    super("fixed-value");
  }

  override async fetchData(_ids: string[], opts: FetcherOpts) {
    return await Promise.resolve(
      FixedValueFetcher.getFixedTokenValuesFromManifest(opts.manifest.tokens)
    );
  }

  override extractPrices(response: Record<string, number>): PricesObj {
    return response;
  }

  static getFixedTokenValuesFromManifest(tokens: TokensConfig) {
    const fixedTokenValues: Record<string, number> = {};
    for (const [dataFeedId, config] of Object.entries(tokens)) {
      if (config!.fixedValue) {
        fixedTokenValues[dataFeedId] = config!.fixedValue;
      }
    }
    return fixedTokenValues;
  }
}
