import { BaseFetcher } from "../BaseFetcher";
import { dexFetchersForSources } from "./fetchers-for-sources";
import { PricesObj } from "../../types";
import { DexFetcherResponse, Pair } from "../DexFetcher";
import {
  buildLiquidityDataFeedId,
  getDataFromLiquidityDataFeedId,
} from "./utils";

type DexFetchersForSourcesKeys = keyof typeof dexFetchersForSources;

interface DataFeedsPerSources {
  [source: string]: string[];
}

interface ResponsePerSources {
  [source: string]: DexFetcherResponse;
}

export class LiquidityFetcher extends BaseFetcher {
  protected retryForInvalidResponse: boolean = true;
  constructor() {
    super("liquidity");
  }

  async fetchData(liquidityDataFeedIds: string[]) {
    const dataFeedsPerSources: DataFeedsPerSources = {};
    for (const liquidityDataFeedId of liquidityDataFeedIds) {
      const { source, dataFeedId } =
        getDataFromLiquidityDataFeedId(liquidityDataFeedId);
      const newDataFeedsArray = [
        ...(dataFeedsPerSources?.[source] ?? []),
        dataFeedId,
      ];
      dataFeedsPerSources[source] = newDataFeedsArray;
    }

    const responsePerSources: ResponsePerSources = {};
    for (const [source, dataFeedsIds] of Object.entries(dataFeedsPerSources)) {
      const fetcher =
        dexFetchersForSources[source as DexFetchersForSourcesKeys];
      const response = await fetcher.fetchData(dataFeedsIds);
      responsePerSources[source] = response;
    }
    return responsePerSources;
  }

  validateResponse(responsePerSources: ResponsePerSources): boolean {
    return responsePerSources !== undefined;
  }

  async extractPrices(
    responsePerSources: ResponsePerSources,
    dataFeedsIds: string[]
  ): Promise<PricesObj> {
    const pricesObj: PricesObj = {};

    for (const [source, response] of Object.entries(responsePerSources)) {
      response.data.pairs.forEach((pair) => {
        this.populatePriceObjBasedOnCurrentDataFeed(
          pair,
          source,
          dataFeedsIds,
          pricesObj
        );
      });
    }

    return pricesObj;
  }

  private populatePriceObjBasedOnCurrentDataFeed = (
    pair: Pair,
    source: string,
    dataFeedsIds: string[],
    pricesObj: PricesObj
  ) => {
    const { token0, token1, reserveUSD } = pair;
    const firstTokenDataFeedId = buildLiquidityDataFeedId(
      token0.symbol,
      source
    );
    const secondTokenDataFeedId = buildLiquidityDataFeedId(
      token1.symbol,
      source
    );
    const isFirstTokenCurrent = dataFeedsIds.includes(firstTokenDataFeedId);
    const isSecondTokenCurrent = dataFeedsIds.includes(secondTokenDataFeedId);
    if (isFirstTokenCurrent) {
      pricesObj[firstTokenDataFeedId] = parseFloat(reserveUSD);
    } else if (isSecondTokenCurrent) {
      pricesObj[secondTokenDataFeedId] = parseFloat(reserveUSD);
    }
  };
}
