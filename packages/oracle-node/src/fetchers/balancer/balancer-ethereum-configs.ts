import { DEFAULT_AMOUNT, SMALLER_AMOUNT, BIGGER_AMOUNT } from "./commons";

// first element on tokenAddresses is our base token - the one for which we calculate the price
// last element on tokenAddresses is our paired token
// so swaps array should provide us with a path specifying
// how to buy the paired token from base token (i.e. sell base token)

export const balancerEthereumConfigs = {
  WETH: {
    SWETH: {
      baseTokenDecimals: 18,
      pairedTokenDecimals: 18,
      tokenToFetch: "ETH",
      swaps: [
        {
          poolId:
            "0xe7e2c68d3b13d905bbb636709cf4dfd21076b9d20000000000000000000005ca",
          assetInIndex: 0,
          assetOutIndex: 1,
          amount: DEFAULT_AMOUNT.toString(),
          userData: "0x",
        },
      ],
      tokenAddresses: [
        "0xf951e335afb289353dc249e82926178eac7ded78",
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      ],
    },
    OHM: {
      baseTokenDecimals: 9,
      pairedTokenDecimals: 18,
      tokenToFetch: "ETH",
      swapAmount: SMALLER_AMOUNT,
      swaps: [
        {
          poolId:
            "0xd1ec5e215e8148d76f4460e4097fd3d5ae0a35580002000000000000000003d3",
          assetInIndex: 0,
          assetOutIndex: 1,
          amount: SMALLER_AMOUNT.toString(),
          userData: "0x",
        },
      ],
      tokenAddresses: [
        "0x64aa3364f17a4d01c6f1751fd97c2bd3d7e7f1d5",
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      ],
    },
    BAL: {
      baseTokenDecimals: 18,
      pairedTokenDecimals: 18,
      tokenToFetch: "ETH",
      swapAmount: DEFAULT_AMOUNT,
      swaps: [
        {
          poolId:
            "0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014",
          assetInIndex: 0,
          assetOutIndex: 1,
          amount: DEFAULT_AMOUNT.toString(),
          userData: "0x",
        },
      ],
      tokenAddresses: [
        "0xba100000625a3754423978a60c9317c58a424e3D",
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      ],
    },
    ETHx: {
      baseTokenDecimals: 18,
      pairedTokenDecimals: 18,
      tokenToFetch: "ETH",
      swapAmount: DEFAULT_AMOUNT,
      swaps: [
        {
          poolId:
            "0x37b18b10ce5635a84834b26095a0ae5639dcb7520000000000000000000005cb",
          assetInIndex: 0,
          assetOutIndex: 1,
          amount: DEFAULT_AMOUNT.toString(),
          userData: "0x",
        },
      ],
      tokenAddresses: [
        "0xA35b1B31Ce002FBF2058D22F30f95D405200A15b",
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      ],
    },
    AURA: {
      baseTokenDecimals: 18,
      pairedTokenDecimals: 18,
      tokenToFetch: "ETH",
      swapAmount: DEFAULT_AMOUNT,
      swaps: [
        {
          poolId:
            "0xcfca23ca9ca720b6e98e3eb9b6aa0ffc4a5c08b9000200000000000000000274",
          assetInIndex: 0,
          assetOutIndex: 1,
          amount: DEFAULT_AMOUNT.toString(),
          userData: "0x",
        },
      ],
      tokenAddresses: [
        "0xc0c293ce456ff0ed870add98a0828dd4d2903dbf",
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      ],
    },
    wstETH: {
      baseTokenDecimals: 18,
      pairedTokenDecimals: 18,
      tokenToFetch: "ETH",
      swapAmount: DEFAULT_AMOUNT,
      swaps: [
        {
          poolId:
            "0x93d199263632a4ef4bb438f1feb99e57b4b5f0bd0000000000000000000005c2",
          assetInIndex: 0,
          assetOutIndex: 1,
          amount: DEFAULT_AMOUNT.toString(),
          userData: "0x",
        },
      ],
      tokenAddresses: [
        "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      ],
    },
  },
  DAI: {
    GHO: {
      baseTokenDecimals: 18,
      pairedTokenDecimals: 18,
      swaps: [
        {
          poolId:
            "0xbe19d87ea6cd5b05bbc34b564291c371dae967470000000000000000000005c4",
          assetInIndex: 0,
          assetOutIndex: 1,
          amount: BIGGER_AMOUNT.toString(),
          userData: "0x",
        },
        {
          poolId:
            "0x79c58f70905f734641735bc61e45c19dd9ad60bc0000000000000000000004e7",
          assetInIndex: 1,
          assetOutIndex: 2,
          amount: "0",
          userData: "0x",
        },
      ],
      tokenAddresses: [
        "0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f",
        "0x79c58f70905f734641735bc61e45c19dd9ad60bc",
        "0x6b175474e89094c44da98b954eedeac495271d0f",
      ],
    },
    OHM: {
      baseTokenDecimals: 9,
      pairedTokenDecimals: 18,
      swapAmount: SMALLER_AMOUNT,
      swaps: [
        {
          poolId:
            "0x76fcf0e8c7ff37a47a799fa2cd4c13cde0d981c90002000000000000000003d2",
          assetInIndex: 0,
          assetOutIndex: 1,
          amount: SMALLER_AMOUNT.toString(),
          userData: "0x",
        },
      ],
      tokenAddresses: [
        "0x64aa3364f17a4d01c6f1751fd97c2bd3d7e7f1d5",
        "0x6b175474e89094c44da98b954eedeac495271d0f",
      ],
    },
  },
  USDC: {
    GHO: {
      baseTokenDecimals: 18,
      pairedTokenDecimals: 6,
      swaps: [
        {
          poolId:
            "0xbe19d87ea6cd5b05bbc34b564291c371dae967470000000000000000000005c4",
          assetInIndex: 0,
          assetOutIndex: 1,
          amount: BIGGER_AMOUNT.toString(),
          userData: "0x",
        },
        {
          poolId:
            "0x79c58f70905f734641735bc61e45c19dd9ad60bc0000000000000000000004e7",
          assetInIndex: 1,
          assetOutIndex: 2,
          amount: "0",
          userData: "0x",
        },
      ],
      tokenAddresses: [
        "0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f",
        "0x79c58f70905f734641735bc61e45c19dd9ad60bc",
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      ],
    },
  },
  USDT: {
    GHO: {
      baseTokenDecimals: 18,
      pairedTokenDecimals: 6,
      swaps: [
        {
          poolId:
            "0xbe19d87ea6cd5b05bbc34b564291c371dae967470000000000000000000005c4",
          assetInIndex: 0,
          assetOutIndex: 1,
          amount: BIGGER_AMOUNT.toString(),
          userData: "0x",
        },
        {
          poolId:
            "0x79c58f70905f734641735bc61e45c19dd9ad60bc0000000000000000000004e7",
          assetInIndex: 1,
          assetOutIndex: 2,
          amount: "0",
          userData: "0x",
        },
      ],
      tokenAddresses: [
        "0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f",
        "0x79c58f70905f734641735bc61e45c19dd9ad60bc",
        "0xdac17f958d2ee523a2206206994597c13d831ec7",
      ],
    },
  },
  LUSD: {
    GHO: {
      baseTokenDecimals: 18,
      pairedTokenDecimals: 18,
      swapAmount: DEFAULT_AMOUNT,
      swaps: [
        {
          poolId:
            "0x3fa8c89704e5d07565444009e5d9e624b40be813000000000000000000000599",
          assetInIndex: 0,
          assetOutIndex: 1,
          amount: DEFAULT_AMOUNT.toString(),
          userData: "0x",
        },
      ],
      tokenAddresses: [
        "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f",
        "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
      ],
    },
  },
};
