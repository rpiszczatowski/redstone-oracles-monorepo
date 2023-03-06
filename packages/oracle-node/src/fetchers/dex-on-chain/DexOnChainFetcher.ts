import { PricesObj } from "../../types";
import { MultiRequestFetcher } from "../MultiRequestFetcher";
import { parseLiquidityDataFeedId, isLiquidity } from "../liquidity/utils";

export interface Responses<T extends { assetId: string }> {
  [spotAssetId: string]: T;
}

export abstract class DexOnChainFetcher<
  T extends { assetId: string }
> extends MultiRequestFetcher {
  abstract calculateLiquidity(assetId: string, response: T): number;
  abstract calculateSpotPrice(assetId: string, response: T): number;

  getRequestContext(assetsIds: string[]) {
    const spotAssetIds = assetsIds.filter((assetId) => !isLiquidity(assetId));
    return spotAssetIds;
  }

  processData(data: T, pricesObj: PricesObj) {
    const assetId = data.assetId;
    if (isLiquidity(assetId)) {
      const { dataFeedId } = parseLiquidityDataFeedId(assetId);
      pricesObj[assetId] = this.calculateLiquidity(dataFeedId, data);
    } else {
      pricesObj[assetId] = this.calculateSpotPrice(assetId, data);
    }
    return pricesObj;
  }
}
