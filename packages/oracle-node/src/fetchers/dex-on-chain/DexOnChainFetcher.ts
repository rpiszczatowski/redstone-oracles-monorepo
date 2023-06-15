import { MultiRequestFetcher } from "../MultiRequestFetcher";
import {
  parseLiquidityDataFeedId,
  isLiquidity,
  isSlippage,
  parseSlippageDataFeedId,
} from "../liquidity/utils";
import { terminateWithManifestConfigError } from "../../Terminator";

export interface Responses<T> {
  [spotAssetId: string]: T;
}

export abstract class DexOnChainFetcher<T> extends MultiRequestFetcher {
  calculateLiquidity(_assetId: string, _response: T): number {
    terminateWithManifestConfigError(`liquidity calculation not implemented for ${this.getName()}`);
  }
  calculateSlippage(_assetId: string, _response: T): number {
    terminateWithManifestConfigError(`slippage calculation not implemented for ${this.getName()}`);
  }
  calculateSpotPrice(_assetId: string, _response: T): number {
    terminateWithManifestConfigError(`spot price calculation not implemented for ${this.getName()}`);
  }

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
