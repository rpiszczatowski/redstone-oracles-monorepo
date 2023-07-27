import { PriceAction } from "../evm-chain/uniswap-v3-on-chain/UniswapV3OnChainFetcher";

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

export const buildSlippageDataFeedId = (
  tokenName: string,
  sourceName: string,
  direction: string,
  amount: string
) => `${tokenName}_${sourceName}_${direction}_${amount}_slippage`;

const runSlippageRegex = (assetId: string) => {
  const regex = /^([^_]+)_([^_]+)_(BUY|SELL)_([^_]+)_slippage$/;
  return regex.exec(assetId);
};

export const parseSlippageDataFeedId = (assetId: string) => {
  const regexResult = runSlippageRegex(assetId);
  if (!regexResult) {
    throw new Error(`Invalid symbol with slippage: ${assetId}`);
  }
  return {
    dataFeedId: regexResult[1],
    source: regexResult[2],
    priceAction: regexResult[3].toLowerCase() as PriceAction,
    amount: regexResult[4],
  };
};

export const isSlippage = (assetId: string) => !!runSlippageRegex(assetId);
