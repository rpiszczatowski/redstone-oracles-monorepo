import { PricesObj } from "../../types";

export const buildLiquidityDataFeedId = (
  tokenName: string,
  sourceName: string
) => `${tokenName}_${sourceName}_liquidity`;

const runLiquidityRegex = (assetId: string) => {
  const regex = /(.*)_(.*)_liquidity$/;
  return regex.exec(assetId);
};

export const parseLiquidityDataFeedId = (assetId: string) => {
  const regexResult = runLiquidityRegex(assetId);
  if (!regexResult) {
    throw new Error(`Invalid symbol with liquidity: ${assetId}`);
  }
  return {
    dataFeedId: regexResult[1],
    source: regexResult[2],
  };
};

export const isLiquidity = (assetId: string) => !!runLiquidityRegex(assetId);
