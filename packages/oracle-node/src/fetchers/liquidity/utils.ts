import { PricesObj } from "../../types";

export const buildLiquidityDataFeedId = (
  tokenName: string,
  sourceName: string
) => `${tokenName}_${sourceName}_liquidity`;

export const getDataFromLiquidityDataFeedId = (liquidityDataFeedId: string) => {
  const regex = /(.*)_(.*)_(.*)$/;
  const parseResult = regex.exec(liquidityDataFeedId);
  if (!parseResult) {
    throw new Error(`Invalid symbol with liquidity: ${liquidityDataFeedId}`);
  }
  return {
    dataFeedId: parseResult[1],
    source: parseResult[2],
  };
};

export const addLiquidityIfNecessary = (
  assetId: string,
  assetsIds: string[],
  sourceName: string,
  liquidity: number,
  pricesObj: PricesObj
) => {
  const liquidityDataFeedId = buildLiquidityDataFeedId(assetId, sourceName);
  const isLiquidityNecessary = assetsIds.some(
    (assetId) => assetId === liquidityDataFeedId
  );
  if (isLiquidityNecessary) {
    pricesObj[liquidityDataFeedId] = liquidity;
  }
};

export const isLiquidity = (name: string) => name.includes("_liquidity");

export const isLiquidityAndSymbol = (name: string, tokenName: string) =>
  name.includes("_liquidity") && name.includes(tokenName);
