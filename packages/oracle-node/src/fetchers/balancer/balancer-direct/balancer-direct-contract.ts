import { BigNumber, Contract, providers } from "ethers";
import { SwapInfo } from "@balancer-labs/sor";
import { TokenAmounts, parseFixed } from "@balancer-labs/sdk";
import { AddressZero } from "@ethersproject/constants";
import BalancerVaultAbi from "./BalancerValut.abi.json";

export enum SwapType {
  SwapExactIn,
  SwapExactOut,
}

const DEFAULT_DECIMALS = 15;
const DEFAULT_AMOUNT = parseFixed("1", DEFAULT_DECIMALS);
const swap = {
  tokenIn: "0xf951e335afb289353dc249e82926178eac7ded78", // swETH
  tokenOut: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0", // WETH
  swapAmount: DEFAULT_AMOUNT,
  swapAmountForSwaps: DEFAULT_AMOUNT,
  returnAmount: DEFAULT_AMOUNT,
  returnAmountFromSwaps: DEFAULT_AMOUNT,
  returnAmountConsideringFees: DEFAULT_AMOUNT,
  swaps: [
    {
      poolId:
        "0xe0e8ac08de6708603cfd3d23b613d2f80e3b7afb00020000000000000000058a",
      assetInIndex: 0,
      assetOutIndex: 1,
      amount: DEFAULT_AMOUNT.toString(),
      userData: "0x",
    },
  ],
  tokenAddresses: [
    "0xf951e335afb289353dc249e82926178eac7ded78",
    "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
  ],
  marketSp: "1.019442252013350645857275711595224196226780743325017064",
  tokenInForSwaps: "0xf951e335afb289353dc249e82926178eac7ded78",
  tokenOutFromSwaps: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
};

(async () => {
  const queryExactOut = async (swap: SwapInfo): Promise<TokenAmounts> => {
    const deltas = await query(swap, SwapType.SwapExactIn);
    return assetDeltas(deltas.map(String), swap.tokenAddresses);
  };

  const query = (swap: SwapInfo, kind: SwapType): Promise<BigNumber[]> => {
    const { swaps, tokenAddresses: assets } = swap;

    const funds = {
      sender: AddressZero,
      recipient: AddressZero,
      fromInternalBalance: false,
      toInternalBalance: false,
    };

    const vaultContract = new Contract(
      "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      BalancerVaultAbi,
      new providers.EtherscanProvider(
        "homestead",
        "KMSJE2GCFVD9WQG7XA713QPT1JMDE9RP3D"
      )
    );
    return vaultContract.callStatic.queryBatchSwap(kind, swaps, assets, funds);
  };

  const assetDeltas = (deltas: string[], assets: string[]): TokenAmounts => {
    return Object.fromEntries(deltas.map((delta, idx) => [assets[idx], delta]));
  };

  console.log(await queryExactOut(swap));
})();
