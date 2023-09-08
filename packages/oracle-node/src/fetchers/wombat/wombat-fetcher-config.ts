import { ethereumProvider } from "../../utils/blockchain-providers";

export default {
  provider: ethereumProvider,
  tokens: {
    ETHX: {
      baseToken: {
        address: "0xA35b1B31Ce002FBF2058D22F30f95D405200A15b",
        symbol: "ETHX",
        decimals: 18,
      },
      quoteToken: {
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        symbol: "WETH",
        decimals: 18,
      },
      pairedToken: "ETH",
      poolAddress: "0x647CC8816C2d60A5fF4d1ffeF27a5b3637d5ac81",
    },
  },
};
