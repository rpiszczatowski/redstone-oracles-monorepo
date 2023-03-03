import { BaseFetcher } from "../BaseFetcher";
import { PricesObj } from "../../types";
import { buildLiquidityDataFeedId, parseLiquidityDataFeedId } from "./utils";
import { DexesFetchers, dexesFetchers } from "./dexesFetchers";
import { DexFetcherResponse } from "../DexFetcher";
import { UniswapV3Response } from "../uniswap-v3/UniswapV3Fetcher";
import { BalancerResponse } from "../balancer/BalancerFetcher";

interface DataFeedsPerSources {
  [source: string]: string[];
}

type Response = DexFetcherResponse | UniswapV3Response | BalancerResponse;

interface ResponsePerSources {
  [source: string]: Response;
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
        parseLiquidityDataFeedId(liquidityDataFeedId);
      const newDataFeedsArray = [
        ...(dataFeedsPerSources?.[source] ?? []),
        dataFeedId,
      ];
      dataFeedsPerSources[source] = newDataFeedsArray;
    }

    const responsePerSources: ResponsePerSources = {};
    for (const [source, dataFeedsIds] of Object.entries(dataFeedsPerSources)) {
      const fetcher = dexesFetchers[source as DexesFetchers] as BaseFetcher;
      const response = await fetcher.fetchData(dataFeedsIds);
      responsePerSources[source] = response as Response;
    }
    return responsePerSources;
  }

  validateResponse(responsePerSources: ResponsePerSources): boolean {
    return responsePerSources !== undefined;
  }

  extractPrices(
    responsePerSources: ResponsePerSources,
    dataFeedsIds: string[]
  ): PricesObj {
    const pricesObj: PricesObj = {};
    for (const [source, response] of Object.entries(responsePerSources)) {
      this.populatePriceObj(response, source, dataFeedsIds, pricesObj);
    }

    return pricesObj;
  }

  private populatePriceObj(
    response: Response,
    source: string,
    dataFeedsIds: string[],
    pricesObj: PricesObj
  ) {
    const uniswapV3Response = response as UniswapV3Response;
    const dexResponse = response as DexFetcherResponse;
    const balancerResponse = response as BalancerResponse;
    if (!!uniswapV3Response?.data?.pools) {
      uniswapV3Response.data.pools.forEach((pool) =>
        this.populatePriceObjBasedOnCurrentDataFeed(
          pool.token0.symbol,
          pool.token0.symbol,
          source,
          dataFeedsIds,
          Number(pool.liquidity),
          pricesObj
        )
      );
    } else if (!!dexResponse?.data?.pairs) {
      dexResponse.data.pairs.forEach((pair) =>
        this.populatePriceObjBasedOnCurrentDataFeed(
          pair.token0.symbol,
          pair.token0.symbol,
          source,
          dataFeedsIds,
          Number(pair.reserveUSD),
          pricesObj
        )
      );
    } else if (balancerResponse?.length > 0) {
      balancerResponse.forEach((pool) =>
        this.populatePriceObjBasedOnCurrentDataFeed(
          pool.value.assetId,
          "",
          source,
          dataFeedsIds,
          pool.value.liquidity,
          pricesObj
        )
      );
    }
  }

  private populatePriceObjBasedOnCurrentDataFeed = (
    firstTokenSymbol: string,
    secondTokenSymbol: string,
    source: string,
    dataFeedsIds: string[],
    liquidity: number,
    pricesObj: PricesObj
  ) => {
    const firstTokenDataFeedId = buildLiquidityDataFeedId(
      firstTokenSymbol,
      source
    );
    const secondTokenDataFeedId = buildLiquidityDataFeedId(
      secondTokenSymbol,
      source
    );
    const isFirstTokenCurrent = dataFeedsIds.includes(firstTokenDataFeedId);
    const isSecondTokenCurrent = dataFeedsIds.includes(secondTokenDataFeedId);
    let parsedLiquidity = this.parseLiquidity(liquidity, source);
    if (isFirstTokenCurrent) {
      pricesObj[firstTokenDataFeedId] = parsedLiquidity;
    } else if (isSecondTokenCurrent) {
      pricesObj[secondTokenDataFeedId] = parsedLiquidity;
    }
  };

  private parseLiquidity(liquidity: number, source: string) {
    if (source === "uniswap-v3") {
      return liquidity / 10 ** 9;
    }
    return liquidity;
  }
}
