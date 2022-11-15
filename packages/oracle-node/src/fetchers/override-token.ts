import { Manifest, PriceDataAfterAggregation } from "../types";

const tokensToOverrideMap = {
  "WETH.e": "ETH",
  "BTC.b": "BTC",
  "LINK.e": "LINK",
  USDt: "USDT",
  WAVAX: "AVAX",
};

export const filterTokenToOverride = (symbols: string[]) => {
  const tokensToOverrideName = Object.keys(tokensToOverrideMap);
  return symbols.filter((symbol) => !tokensToOverrideName.includes(symbol));
};

export const addToAggregatedPricesTokensToOverride = (
  manifest: Manifest,
  aggregatedPrices: PriceDataAfterAggregation[]
) => {
  const tokensInManifest = Object.keys(manifest.tokens);
  for (const [tokenToOverride, tokenOverwriting] of Object.entries(
    tokensToOverrideMap
  )) {
    if (tokensInManifest.includes(tokenToOverride)) {
      const aggregatedTokenToOverwrite = aggregatedPrices.find(
        (price) => price.symbol === tokenOverwriting
      );
      if (aggregatedTokenToOverwrite) {
        aggregatedPrices.push({
          ...aggregatedTokenToOverwrite,
          symbol: tokenToOverride,
        });
      }
    }
  }
};
