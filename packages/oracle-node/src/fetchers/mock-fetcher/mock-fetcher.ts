import axios from "axios";
import { BaseFetcher } from "../BaseFetcher";
import { config } from "../../config";
import { readJSON } from "../../utils/objects";
import { FetcherOpts, PricesObj, TokensConfig } from "../../types";

export class MockFetcher extends BaseFetcher {
  constructor() {
    super("mock");
  }

  async fetchData(_ids: string[], opts: FetcherOpts) {
    const isMockPricesUrl = config.mockPricesUrlOrPath.startsWith("http");
    if (isMockPricesUrl) {
      return (await axios.get(config.mockPricesUrlOrPath)).data;
    }

    if (this.isAnyTokenWithFixedValue(opts.manifest.tokens)) {
      return this.getFixedTokenValuesFromManifest(opts.manifest.tokens);
    }

    return readJSON(config.mockPricesUrlOrPath);
  }

  extractPrices(response: any, ids: string[]): PricesObj {
    const result: PricesObj = {};

    for (const id of ids) {
      result[id] = response[id] ?? response.__DEFAULT__;
    }
    return result;
  }

  isAnyTokenWithFixedValue(tokens: TokensConfig) {
    return Object.values(tokens).some((token) => !!token.fixedValue);
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
