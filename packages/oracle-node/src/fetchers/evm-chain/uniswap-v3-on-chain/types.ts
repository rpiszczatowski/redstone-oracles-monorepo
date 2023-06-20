export interface PoolConfig {
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
  slippage?: number[]
}

export interface PoolsConfig {
  [symbol: string]: PoolConfig;
}

export interface TokenConfig {
  symbol: string;
  address: string;
  decimals: number;
}

export interface QuoterInSingleParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  fee: number;
  sqrtPriceLimitX96: number;
}

export interface QuoterOutSingleParams {
  tokenIn: string;
  tokenOut: string;
  amountOut: string;
  fee: number;
  sqrtPriceLimitX96: number;
}

export type SlippageParams = { [key: string] : (QuoterInSingleParams | QuoterOutSingleParams) };
export interface MulticallParams {
  slippageParams: SlippageParams;
}

export interface MulticallResult {
  priceRatio: number;
  slippage: Record<string, number>;
  pairedToken: string;
}
