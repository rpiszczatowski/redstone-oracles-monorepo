import { SlippageInfo } from "../../uniswap-v3-on-chain/types";

export interface PoolConfig {
  poolAddress: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Address: string;
  token1Address: string;
  token0Decimals: number;
  token1Decimals: number;
  stable: boolean;
  pairedToken?: string;
  slippage?: SlippageInfo[];
}

export interface PoolsConfig {
  [symbol: string]: PoolConfig;
}

export interface TokenConfig {
  symbol: string;
  address: string;
  decimals: number;
}

export interface QuoterParams {
  tokenIn: string;
  amountIn: string;
}

export type SlippageParams = { [key: string]: QuoterParams };
export interface MulticallParams {
  slippageParams: SlippageParams;
}

export interface MulticallResult {
  priceRatio: number;
  slippage: Record<string, number>;
  pairedToken: string;
}
