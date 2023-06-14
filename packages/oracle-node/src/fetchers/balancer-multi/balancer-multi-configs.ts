import { parseFixed } from "@balancer-labs/sdk";

const DEFAULT_AMOUNT = parseFixed("1", 18);

export const balancerMultiConfigs = {
  SWETH: {
    tokenIn: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
    tokenOut: "0xf951E335afb289353dc249e82926178EaC7DEd78", // swETH
    tokenAddress: "0xf951e335afb289353dc249e82926178eac7ded78",
    tokenToFetch: "ETH",
    gasPrice: parseFixed("0", 18),
    swapAmount: DEFAULT_AMOUNT,
    swapAmountForSwaps: DEFAULT_AMOUNT,
    returnAmount: DEFAULT_AMOUNT,
    returnAmountFromSwaps: DEFAULT_AMOUNT,
    returnAmountConsideringFees: DEFAULT_AMOUNT,
    swaps: [
      {
        poolId:
          "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080",
        assetInIndex: 0,
        assetOutIndex: 1,
        amount: "1000000000000000000",
        userData: "0x",
        returnAmount: "886158647881269494",
      },
      {
        poolId:
          "0xe0fcbf4d98f0ad982db260f86cf28b49845403c5000000000000000000000504",
        assetInIndex: 1,
        assetOutIndex: 2,
        amount: "0",
        userData: "0x",
        returnAmount: "997316090699442722",
      },
      {
        poolId:
          "0x02d928e68d8f10c0358566152677db51e1e2dc8c00000000000000000000051e",
        assetInIndex: 2,
        assetOutIndex: 3,
        amount: "0",
        userData: "0x",
        returnAmount: "975429501025989269",
      },
    ],
    tokenAddresses: [
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
      "0x60d604890feaa0b5460b28a424407c24fe89374a",
      "0xf951e335afb289353dc249e82926178eac7ded78",
    ],
    marketSp:
      "1.02518203160612570379625541003059241475245310656507462434437884668042346746708605751360445391027705068007936",
    tokenInForSwaps: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    tokenOutFromSwaps: "0xf951e335afb289353dc249e82926178eac7ded78",
  },
};
