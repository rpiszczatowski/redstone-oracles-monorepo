import { BigNumber } from "ethers";

export interface QuoterOutAmount {
  amountOut: BigNumber;
  assetId: string;
  outAssetId: string;
  outAssetDecimals: number;
  inAssetDecimals: number;
  liquidity: BigNumber;
}

export interface PoolsConfig {
  [symbol: string]: {
    poolAddress: string;
    quoterAddress: string;
    token0Symbol: string;
    token1Symbol: string;
    token0Address: string;
    token1Address: string;
    token0Decimals: number;
    token1Decimals: number;
    fee: number;
  };
}

export interface QuoterParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  fee: number;
  sqrtPriceLimitX96: number;
}
