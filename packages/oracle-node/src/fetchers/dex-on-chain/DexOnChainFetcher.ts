import { MultiRequestFetcher } from "../MultiRequestFetcher";
import {
  parseLiquidityDataFeedId,
  isLiquidity,
  isSlippage,
  parseSlippageDataFeedId,
} from "../liquidity/utils";

export interface Responses<T> {
  [spotAssetId: string]: T;
}

export abstract class DexOnChainFetcher<T> extends MultiRequestFetcher {
  abstract calculateLiquidity(assetId: string, response: T): number;
  calculateSlippage(assetId: string, response: T): number {
    throw new Error("method not implemented!");
  }
  abstract calculateSpotPrice(assetId: string, response: T): number;

  override prepareRequestIds(requestedDataFeedIds: string[]): string[] {
    const spotAssetIds = requestedDataFeedIds.filter(
      (assetId) => !isLiquidity(assetId) && !isSlippage(assetId)
    );
    return spotAssetIds;
  }

  override extractPrice(
    dataFeedId: string,
    responses: Responses<T>
  ): number | undefined {
    if (isLiquidity(dataFeedId)) {
      const { dataFeedId: spotAssetId } = parseLiquidityDataFeedId(dataFeedId);
      if (responses[spotAssetId]) {
        return this.calculateLiquidity(spotAssetId, responses[spotAssetId]);
      }
    } else if (isSlippage(dataFeedId)) {
      const { dataFeedId: spotAssetId } = parseSlippageDataFeedId(dataFeedId);
      if (responses[spotAssetId]) {
        return this.calculateSlippage(dataFeedId, responses[spotAssetId]);
      }
    } else {
      if (responses[dataFeedId]) {
        return this.calculateSpotPrice(dataFeedId, responses[dataFeedId]);
      }
    }
  }
}
