import { Manifest, TokensConfig } from "../../src/types";

export const generateManifest = (
  customManifestFields: Partial<Manifest>
): Manifest => {
  return {
    interval: 60000,
    priceAggregator: "median",
    sourceTimeout: 50000,
    deviationCheck: {
      deviationWithRecentValues: {
        maxPercent: 25,
        maxDelayMilliseconds: 300000,
      },
    },
    tokens: {},
    ...customManifestFields,
  };
};

export const symbolArrToTokensConfig = (symbols: string[]): TokensConfig => {
  const tokensConfig: TokensConfig = {};
  for (const symbol of symbols) {
    tokensConfig[symbol] = {};
  }
  return tokensConfig;
};
