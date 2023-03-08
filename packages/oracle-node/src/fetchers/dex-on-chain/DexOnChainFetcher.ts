import {
  MultiRequestFetcher,
  RequestIdToResponse,
} from "../MultiRequestFetcher";
import { parseLiquidityDataFeedId, isLiquidity } from "../liquidity/utils";

export interface Responses<T extends { assetId: string }> {
  [spotAssetId: string]: T;
}

export abstract class DexOnChainFetcher<
  T extends { assetId: string }
> extends MultiRequestFetcher {
  abstract calculateLiquidity(assetId: string, response: T): number;
  abstract calculateSpotPrice(assetId: string, response: T): number;

  override prepareRequestIds(requestedDataFeedIds: string[]): string[] {
    const spotAssetIds = requestedDataFeedIds.filter(
      (assetId) => !isLiquidity(assetId)
    );
    return spotAssetIds;
  }

  override extractPrice(
    dataFeedId: string,
    responses: RequestIdToResponse
  ): number | undefined {
    if (isLiquidity(dataFeedId)) {
      const { dataFeedId: spotAssetId } = parseLiquidityDataFeedId(dataFeedId);
      if (responses[spotAssetId]) {
        return this.calculateLiquidity(dataFeedId, responses[spotAssetId]);
      }
    } else {
      if (responses[dataFeedId]) {
        return this.calculateSpotPrice(dataFeedId, responses[dataFeedId]);
      }
    }
  }
}
