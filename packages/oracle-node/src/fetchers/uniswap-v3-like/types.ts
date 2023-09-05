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
}

export interface PoolsConfig {
  [symbol: string]: PoolConfig;
}

export interface TokenConfig {
  symbol: string;
  address: string;
  decimals: number;
}

export interface MulticallResult {
  spotPrice: string;
  buySlippage?: string;
  sellSlippage?: string;
}

export interface Abis {
  poolAbi: any[];
  quoterAbi: any[];
}

export interface FunctionNames {
  quoteFunctionName: string;
  slot0FunctionName: string;
}
