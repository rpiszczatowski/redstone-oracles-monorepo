import { providers } from "ethers";
import { config } from "../../config";
import { arbitrumProvider } from "../evm-chain/arbitrum/config";

export const curveFetchersConfig = {
  "curve-frax": {
    VST: {
      address: "0x59bF0545FCa0E5Ad48E13DA269faCD2E8C886Ba4",
      tokenIndex: 0,
      pairedTokenIndex: 1,
      pairedToken: "FRAX",
      provider: arbitrumProvider,
      ratioMultiplier: 1,
      functionName: "get_dy",
    },
  },
  "curve-usdc": {
    FRAX: {
      address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
      tokenIndex: 0,
      pairedTokenIndex: 1,
      pairedToken: "USDC",
      provider: new providers.StaticJsonRpcProvider(config.ethMainRpcUrl, {
        name: "Ethereum Mainnet",
        chainId: 1,
      }),
      ratioMultiplier: 10 ** 12,
      functionName: "get_dy",
    },
    DAI: {
      address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
      tokenIndex: 0,
      pairedTokenIndex: 1,
      pairedToken: "USDC",
      provider: new providers.StaticJsonRpcProvider(config.ethMainRpcUrl, {
        name: "Ethereum Mainnet",
        chainId: 1,
      }),
      ratioMultiplier: 10 ** 12,
      functionName: "get_dy_underlying",
    },
  },
  "curve-usdt": {
    DAI: {
      address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
      tokenIndex: 0,
      pairedTokenIndex: 2,
      pairedToken: "USDT",
      provider: new providers.StaticJsonRpcProvider(config.ethMainRpcUrl, {
        name: "Ethereum Mainnet",
        chainId: 1,
      }),
      ratioMultiplier: 10 ** 12,
      functionName: "get_dy_underlying",
    },
  },
};
