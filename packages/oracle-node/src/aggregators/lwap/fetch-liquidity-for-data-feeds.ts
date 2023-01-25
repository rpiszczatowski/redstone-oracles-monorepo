import fetchers from "../../fetchers";
import { DexFetcher } from "../../fetchers/DexFetcher";
import { dexs } from "./lwap-aggregator";
import { PriceDataBeforeAggregation } from "../../types";

interface PairsPerSource {
  [sourceName: string]: string[];
}

export interface LiquiditiesPerSourceAndToken {
  [sourceName: string]: { [dataFeedId: string]: number };
}

export const fetchLiquidityForDataFeeds = async (
  prices: PriceDataBeforeAggregation[]
) => {
  const dataFeedsPerDexSource: PairsPerSource = {};
  for (const price of prices) {
    populateDataFeedsPerDexSource(
      Object.keys(price.source),
      price.symbol,
      dataFeedsPerDexSource
    );
  }
  const liquidityPerSourceAndToken: LiquiditiesPerSourceAndToken = {};
  for (const [sourceName, dataFeedsIds] of Object.entries(
    dataFeedsPerDexSource
  )) {
    const liquidityPerDataFeedsIds = await getLiquidityForDataFeedsIds(
      sourceName,
      dataFeedsIds
    );
    for (const dataFeedId of dataFeedsIds) {
      const objectToAdd = {
        [dataFeedId]: liquidityPerDataFeedsIds[dataFeedId],
      };
      liquidityPerSourceAndToken[sourceName] = {
        ...liquidityPerSourceAndToken[sourceName],
        ...objectToAdd,
      };
    }
  }
  return liquidityPerSourceAndToken;
};

const populateDataFeedsPerDexSource = (
  sources: string[],
  symbol: string,
  dataFeedsPerDexSource: PairsPerSource
) => {
  const dexesSources = sources.filter((sourceName) =>
    dexs.includes(sourceName)
  );
  if (dexesSources.length > 0) {
    for (const source of dexesSources) {
      const newDataFeedsIdsArray = [
        ...(dataFeedsPerDexSource?.[source] ?? []),
        symbol,
      ];
      dataFeedsPerDexSource[source] = newDataFeedsIdsArray;
    }
  }
};

const getLiquidityForDataFeedsIds = async (
  sourceName: string,
  dataFeedsIds: string[]
) => {
  const fetcher = fetchers[sourceName] as DexFetcher;
  return fetcher.getLiquidityForDataFeedsIds(dataFeedsIds);
};
