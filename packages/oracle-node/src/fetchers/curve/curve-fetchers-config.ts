import { providers } from "ethers";
import { config } from "../../config";
import { arbitrumProvider } from "../evm-chain/arbitrum/config";

export const curveFetchersConfig = {
  "curve-frax": {
    VST: {
      address: "0x59bF0545FCa0E5Ad48E13DA269faCD2E8C886Ba4",
      symbol0: "VST",
      symbol1: "FRAX",
      pairedToken: "FRAX",
      provider: arbitrumProvider,
      ratioMultiplier: 1,
    },
  },
  "curve-usdc": {
    FRAX: {
      address: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
      symbol0: "FRAX",
      symbol1: "USDC",
      pairedToken: "USDC",
      provider: new providers.StaticJsonRpcProvider(config.ethMainRpcUrl, {
        name: "Ethereum Mainnet",
        chainId: 1,
      }),
      ratioMultiplier: 10 ** 12,
    },
  },
};
