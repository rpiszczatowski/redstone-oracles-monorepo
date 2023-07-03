import { providers } from "ethers";
import {
  arbitrumProvider,
  ethereumProvider,
} from "../../utils/blockchain-providers";

export interface PoolsConfig {
  [symbol: string]: {
    address: string;
    tokenIndex: number;
    pairedToken: string;
    pairedTokenIndex: number;
    provider: providers.Provider;
    ratioMultiplier: number;
    functionName: string;
    multiBlockConfig?: { sequenceStep: number; intervalLength: number };
  };
}

// 144 blocks = 30 min
// 72 blocks = 15 min
// 48 blocks = 10 min
// 20 blocks = 4  min
const ETH_MULTI_BLOCK_CONFIG = {
  sequenceStep: 1,
  intervalLength: 20,
};

// 7200 blocks = 30 min
// 3600 blocks = 15 min
// 2400 blocks = 10 min
// 1000 blocks = 4  min
const ARBITRUM_MULTI_BLOCK_CONFIG = {
  sequenceStep: 50,
  intervalLength: 1000,
};

export const curveFetchersConfig: Record<string, PoolsConfig> = {
  "curve-frax": {
    VST: {
      address: "0x59bF0545FCa0E5Ad48E13DA269faCD2E8C886Ba4",
      tokenIndex: 0,
      pairedTokenIndex: 1,
      pairedToken: "FRAX",
      provider: arbitrumProvider,
      ratioMultiplier: 1,
      functionName: "get_dy",
      multiBlockConfig: ARBITRUM_MULTI_BLOCK_CONFIG,
    },
  },
  "curve-usdc": {
    FRAX: {
      address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
      tokenIndex: 0,
      pairedTokenIndex: 1,
      pairedToken: "USDC",
      provider: ethereumProvider,
      ratioMultiplier: 10 ** 12,
      functionName: "get_dy",
      multiBlockConfig: ETH_MULTI_BLOCK_CONFIG,
    },
    DAI: {
      address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
      tokenIndex: 0,
      pairedTokenIndex: 1,
      pairedToken: "USDC",
      provider: ethereumProvider,
      ratioMultiplier: 10 ** 12,
      functionName: "get_dy_underlying",
      multiBlockConfig: ETH_MULTI_BLOCK_CONFIG,
    },
  },
  "curve-usdt": {
    DAI: {
      address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
      tokenIndex: 0,
      pairedTokenIndex: 2,
      pairedToken: "USDT",
      provider: ethereumProvider,
      ratioMultiplier: 10 ** 12,
      functionName: "get_dy_underlying",
      multiBlockConfig: ETH_MULTI_BLOCK_CONFIG,
    },
  },
  "curve-eth": {
    STETH: {
      address: "0xdc24316b9ae028f1497c275eb9192a3ea0f67022",
      tokenIndex: 1,
      pairedTokenIndex: 0,
      pairedToken: "ETH",
      provider: ethereumProvider,
      ratioMultiplier: 1,
      functionName: "get_dy",
      multiBlockConfig: ETH_MULTI_BLOCK_CONFIG,
    },
    FRXETH: {
      address: "0xa1f8a6807c402e4a15ef4eba36528a3fed24e577",
      tokenIndex: 1,
      pairedTokenIndex: 0,
      pairedToken: "ETH",
      provider: ethereumProvider,
      ratioMultiplier: 1,
      functionName: "get_dy",
      multiBlockConfig: ETH_MULTI_BLOCK_CONFIG,
    },
    ALETH: {
      address: "0xc4c319e2d4d66cca4464c0c2b32c9bd23ebe784e",
      tokenIndex: 1,
      pairedTokenIndex: 0,
      pairedToken: "ETH",
      provider: ethereumProvider,
      ratioMultiplier: 1,
      functionName: "get_dy",
      multiBlockConfig: ETH_MULTI_BLOCK_CONFIG,
    },
  },
  "curve-weth": {
    STETH: {
      address: "0x828b154032950C8ff7CF8085D841723Db2696056",
      tokenIndex: 1,
      pairedTokenIndex: 0,
      pairedToken: "ETH",
      provider: ethereumProvider,
      ratioMultiplier: 1,
      functionName: "get_dy",
      multiBlockConfig: ETH_MULTI_BLOCK_CONFIG,
    },
  },
  "curve-frxeth": {
    ALETH: {
      address: "0xB657B895B265C38c53FFF00166cF7F6A3C70587d",
      tokenIndex: 0,
      pairedTokenIndex: 1,
      pairedToken: "FRXETH",
      provider: ethereumProvider,
      ratioMultiplier: 1,
      functionName: "get_dy",
    },
  },
  "curve-crvfrax": {
    ALUSD: {
      address: "0xb30da2376f63de30b42dc055c93fa474f31330a5",
      tokenIndex: 0,
      pairedTokenIndex: 1,
      pairedToken: "crvFRAX",
      provider: ethereumProvider,
      ratioMultiplier: 1,
      functionName: "get_dy_underlying",
      multiBlockConfig: ETH_MULTI_BLOCK_CONFIG,
    },
  },
  "curve-3crv": {
    ALUSD: {
      address: "0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c",
      tokenIndex: 0,
      pairedTokenIndex: 1,
      pairedToken: "3Crv",
      provider: ethereumProvider,
      ratioMultiplier: 1,
      functionName: "get_dy_underlying",
      multiBlockConfig: ETH_MULTI_BLOCK_CONFIG,
    },
    LUSD: {
      address: "0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca",
      tokenIndex: 0,
      pairedTokenIndex: 1,
      pairedToken: "3Crv",
      provider: ethereumProvider,
      ratioMultiplier: 1,
      functionName: "get_dy_underlying",
      multiBlockConfig: ETH_MULTI_BLOCK_CONFIG,
    },
  },
};
