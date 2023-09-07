import { parseFixed } from "@balancer-labs/sdk";

const DEFAULT_DECIMALS = 15;
const BIGGER_DECIMALS = 21;
const DEFAULT_AMOUNT = parseFixed("1", DEFAULT_DECIMALS);
const BIGGER_AMOUNT = parseFixed("1", BIGGER_DECIMALS);

// first element on tokenAddresses is our base token - the one for which we calculate the price
// last element on tokenAddresses is our paired token
// so swaps array should provide us with a path specifying
// how to buy the paired token from base token (i.e. sell base token)
export const balancerMultiConfigs = {
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
  },
  DAI: {
    GHO: {
      baseTokenDecimals: 18,
      pairedTokenDecimals: 18,
      swaps: [
        {
          poolId:
            "0xc2b021133d1b0cf07dba696fd5dd89338428225b000000000000000000000598",
          assetInIndex: 0,
          assetOutIndex: 1,
          amount: BIGGER_AMOUNT.toString(),
          userData: "0x",
        },
        {
          poolId:
            "0xc443c15033fcb6cf72cc24f1bda0db070ddd9786000000000000000000000593",
          assetInIndex: 1,
          assetOutIndex: 2,
          amount: "0",
          userData: "0x",
        },
        {
          poolId:
            "0xfa24a90a3f2bbe5feea92b95cd0d14ce709649f900000000000000000000058f",
          assetInIndex: 2,
          assetOutIndex: 3,
          amount: "0",
          userData: "0x",
        },
      ],
      tokenAddresses: [
        "0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f",
        "0xc443c15033fcb6cf72cc24f1bda0db070ddd9786",
        "0xfa24a90a3f2bbe5feea92b95cd0d14ce709649f9",
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
            "0xc2b021133d1b0cf07dba696fd5dd89338428225b000000000000000000000598",
          assetInIndex: 0,
          assetOutIndex: 1,
          amount: BIGGER_AMOUNT.toString(),
          userData: "0x",
        },
        {
          poolId:
            "0xc443c15033fcb6cf72cc24f1bda0db070ddd9786000000000000000000000593",
          assetInIndex: 1,
          assetOutIndex: 2,
          amount: "0",
          userData: "0x",
        },
        {
          poolId:
            "0xc50d4347209f285247bda8a09fc1c12ce42031c3000000000000000000000590",
          assetInIndex: 2,
          assetOutIndex: 3,
          amount: "0",
          userData: "0x",
        },
      ],
      tokenAddresses: [
        "0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f",
        "0xc443c15033fcb6cf72cc24f1bda0db070ddd9786",
        "0xc50d4347209f285247bda8a09fc1c12ce42031c3",
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
            "0xc2b021133d1b0cf07dba696fd5dd89338428225b000000000000000000000598",
          assetInIndex: 0,
          assetOutIndex: 1,
          amount: BIGGER_AMOUNT.toString(),
          userData: "0x",
        },
        {
          poolId:
            "0xc443c15033fcb6cf72cc24f1bda0db070ddd9786000000000000000000000593",
          assetInIndex: 1,
          assetOutIndex: 2,
          amount: "0",
          userData: "0x",
        },
        {
          poolId:
            "0xcfae6e251369467f465f13836ac8135bd42f8a56000000000000000000000591",
          assetInIndex: 2,
          assetOutIndex: 3,
          amount: "0",
          userData: "0x",
        },
      ],
      tokenAddresses: [
        "0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f",
        "0xc443c15033fcb6cf72cc24f1bda0db070ddd9786",
        "0xcfae6e251369467f465f13836ac8135bd42f8a56",
        "0xdac17f958d2ee523a2206206994597c13d831ec7",
      ],
    },
  },
};
