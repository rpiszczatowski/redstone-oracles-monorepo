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
}

export interface PoolsConfig {
  [symbol: string]: PoolConfig;
}

export interface TokenConfig {
  symbol: string;
  pairedSymbol?: string;
  address: string;
  decimals: number;
}

export interface MulticallResult {
  spotPrice: string;
  buySlippage?: string;
  sellSlippage?: string;
}
