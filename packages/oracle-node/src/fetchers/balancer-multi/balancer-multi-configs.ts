import { parseFixed } from "@balancer-labs/sdk";

const DEFAULT_DECIMALS = 15;
const DEFAULT_BASE = Math.pow(10, DEFAULT_DECIMALS);
const DEFAULT_AMOUNT = parseFixed("1", DEFAULT_DECIMALS);

export const balancerMultiConfigs = {
  SWETH: {
    tokenIn: "0xf951e335afb289353dc249e82926178eac7ded78", // swETH
    tokenOut: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
    tokenFromResponseAddress: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    tokenToFetch: "ETH",
    swapAmount: DEFAULT_AMOUNT,
    swapAmountForSwaps: DEFAULT_AMOUNT,
    returnAmount: DEFAULT_AMOUNT,
    returnAmountFromSwaps: DEFAULT_AMOUNT,
    returnAmountConsideringFees: DEFAULT_AMOUNT,
    swaps: [
      {
        poolId:
          "0x02d928e68d8f10c0358566152677db51e1e2dc8c00000000000000000000051e",
        assetInIndex: 0,
        assetOutIndex: 1,
        amount: DEFAULT_BASE.toString(),
        userData: "0x",
        returnAmount: "0",
      },
      {
        poolId:
          "0x60d604890feaa0b5460b28a424407c24fe89374a0000000000000000000004fc",
        assetInIndex: 1,
        assetOutIndex: 2,
        amount: "0",
        userData: "0x",
        returnAmount: "0",
      },
    ],
    tokenAddresses: [
      "0xf951e335afb289353dc249e82926178eac7ded78",
      "0x60d604890feaa0b5460b28a424407c24fe89374a",
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    ],

    marketSp: "0.975579771147855490581674395757499488628449256697793016",
    tokenInForSwaps: "0xf951e335afb289353dc249e82926178eac7ded78",
    tokenOutFromSwaps: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  },
};
