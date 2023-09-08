import { DEFAULT_AMOUNT } from "./commons";

// first element on tokenAddresses is our base token - the one for which we calculate the price
// last element on tokenAddresses is our paired token
// so swaps array should provide us with a path specifying
// how to buy the paired token from base token (i.e. sell base token)

export const balancerArbitrumConfigs = {
  WETH: {
    wstETH: {
      baseTokenDecimals: 18,
      pairedTokenDecimals: 18,
      tokenToFetch: "ETH",
      swapAmount: DEFAULT_AMOUNT,
      swaps: [
        {
          poolId:
            "0x36bf227d6bac96e2ab1ebb5492ecec69c691943f000200000000000000000316",
          assetInIndex: 0,
          assetOutIndex: 1,
          amount: DEFAULT_AMOUNT.toString(),
          userData: "0x",
        },
      ],
      tokenAddresses: [
        "0x5979d7b546e38e414f7e9822514be443a4800529",
        "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
      ],
    },
  },
};
