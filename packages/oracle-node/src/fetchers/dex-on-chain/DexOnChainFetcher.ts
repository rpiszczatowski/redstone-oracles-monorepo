import { appendFileSync, writeFileSync } from "fs";
import { RedstoneCommon, RedstoneTypes } from "redstone-utils";
import { PricesObjWithMetadata } from "../../types";
import {
  isLiquidity,
  isSlippage,
  parseLiquidityDataFeedId,
  parseSlippageDataFeedId,
} from "../liquidity/utils";
import { MultiRequestFetcher } from "../MultiRequestFetcher";

export interface Responses<T> {
  [spotAssetId: string]: T;
}

export abstract class DexOnChainFetcher<T> extends MultiRequestFetcher {
  calculateLiquidity(
    _assetId: string,
    _response: T
  ): number | string | undefined {
    throw new Error(
      `liquidity calculation not implemented for ${this.getName()}`
    );
  }
  calculateSlippage(
    _assetId: string,
    _response: T
  ): RedstoneTypes.SlippageData[] {
    throw new Error(
      `slippage calculation not implemented for ${this.getName()}`
    );
  }
  calculateSpotPrice(_assetId: string, _response: T): number | string {
    throw new Error(
      `spot price calculation not implemented for ${this.getName()}`
    );
  }

  protected getLiquidityAndSlippageMetadata(
    dataFeedId: string,
    response: T
  ): RedstoneTypes.MetadataPerSource | undefined {
    const metadata: RedstoneTypes.MetadataPerSource = {};

    // we don't care if we fail here, cause it is only metadata
    try {
      metadata.slippage = this.calculateSlippage(dataFeedId, response);
    } catch (e) {}

    try {
      const liquidity = this.calculateLiquidity(dataFeedId, response);
      if (liquidity) {
        metadata.liquidity = liquidity.toString();
      }
    } catch (e) {}

    // return undefined instead of empty metadata
    if (Object.keys(metadata).length === 0) {
      return undefined;
    }

    return metadata;
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
  ): PricesObjWithMetadata[string] {
    if (isLiquidity(dataFeedId)) {
      return this.getLiquidityFeed(dataFeedId, responses);
    } else if (isSlippage(dataFeedId)) {
      return this.getSlippageFeed(dataFeedId, responses);
    } else {
      return this.getPriceFeed(dataFeedId, responses);
    }
  }

  private getPriceFeed(
    dataFeedId: string,
    responses: Responses<T>
  ): PricesObjWithMetadata[string] {
    const response = getDefinedResponse(responses, dataFeedId);
    const metadata = this.getLiquidityAndSlippageMetadata(dataFeedId, response);
    return {
      value: this.calculateSpotPrice(dataFeedId, responses[dataFeedId]),
      metadata,
    };
  }

  private getLiquidityFeed(
    dataFeedId: string,
    responses: Responses<T>
  ): PricesObjWithMetadata[string] {
    const { dataFeedId: spotAssetId } = parseLiquidityDataFeedId(dataFeedId);
    const response = getDefinedResponse(responses, spotAssetId);
    return {
      value: this.calculateLiquidity(spotAssetId, response),
    };
  }

  private getSlippageFeed(
    dataFeedId: string,
    responses: Responses<T>
  ): PricesObjWithMetadata[string] {
    const {
      dataFeedId: spotAssetId,
      priceAction,
      amount,
    } = parseSlippageDataFeedId(dataFeedId);
    const response = getDefinedResponse(responses, spotAssetId);
    const slippages = this.calculateSlippage(spotAssetId, response);

    const slippage = slippages.find(
      (s) => s.direction === priceAction && s.simulationValueInUsd === amount
    );

    if (!slippage) {
      throw new Error(
        `Failed to find slippage for ${dataFeedId}. Maybe it is not configured in PoolsConfig for ${this.getName()} fetcher`
      );
    }

    return {
      value: slippage.slippageAsPercent,
    };
  }
}

export const getDefinedResponse = <T>(
  responses: Record<string, T>,
  dataFeedId: string
): T => {
  RedstoneCommon.assert(
    !!responses[dataFeedId],
    `responses are defined for ${Object.keys(
      responses
    )} missing response for ${dataFeedId}`
  );

  return responses[dataFeedId];
};
