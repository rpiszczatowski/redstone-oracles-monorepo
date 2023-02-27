import { PricesObj } from "../../types";
import { BaseFetcher } from "../BaseFetcher";
import {
  getDataFromLiquidityDataFeedId,
  isLiquidity,
} from "../liquidity/utils";

export interface Responses<T> {
  [spotAssetId: string]: T;
}

const PROMISE_STATUS_FULFILLED = "fulfilled";

export abstract class DexOnChainFetcher<T> extends BaseFetcher {
  abstract getPoolDetailsWithStatus(
    spotAssetIds: string[]
  ): Promise<PromiseSettledResult<T | null>[]>;
  abstract getAssetId(responseWithStatus: T): string;
  abstract calculateLiquidity(assetId: string, response: T): number;
  abstract calculateSpotPrice(assetId: string, response: T): number;

  async fetchData(assetsIds: string[]) {
    const spotAssetIds = assetsIds.filter((assetId) => !isLiquidity(assetId));
    const responsesWithStatus = await this.getPoolDetailsWithStatus(
      spotAssetIds
    );
    return this.extractPoolDetailsPerAssetId(responsesWithStatus);
  }

  async extractPoolDetailsPerAssetId(
    responsesWithStatus: PromiseSettledResult<T | null>[]
  ): Promise<Responses<T>> {
    const response: Responses<T> = {};
    responsesWithStatus.map((responseWithStatus) => {
      const { status } = responseWithStatus;
      if (status === PROMISE_STATUS_FULFILLED && responseWithStatus.value) {
        const { value } = responseWithStatus;
        const symbol = this.getAssetId(value);
        response[symbol] = value;
      }
    });
    return response;
  }

  extractPrices(responses: Responses<T>, assetsIds: string[]): PricesObj {
    const pricesObj: PricesObj = {};
    for (const assetId of assetsIds) {
      if (isLiquidity(assetId)) {
        const { dataFeedId } = getDataFromLiquidityDataFeedId(assetId);
        pricesObj[assetId] = this.calculateLiquidity(
          dataFeedId,
          responses[dataFeedId]
        );
      } else {
        pricesObj[assetId] = this.calculateSpotPrice(
          assetId,
          responses[assetId]
        );
      }
    }
    return pricesObj;
  }
}
