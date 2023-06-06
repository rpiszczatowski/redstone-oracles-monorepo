import { BigNumber } from "ethers";

export interface PoolsConfig {
  [symbol: string]: {
    quoterAddress: string;
    poolAddress: string;
    token0Symbol: string;
    token1Symbol: string;
    token0Address: string;
    token1Address: string;
    token0Decimals: number;
    token1Decimals: number;
    fee: number;
    pairedToken?: string;
  };
}

export interface ObserveParams {
  secondsAgoStart: number;
  secondsAgoEnd: number;
}

export interface ObserveResult {
  priceRatio: number;
  liquidity: BigNumber;
  pairedToken: string;
}
