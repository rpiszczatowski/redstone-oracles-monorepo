import { SwapType } from "@balancer-labs/sdk";
import { BigNumber, Contract, providers } from "ethers";
import { AddressZero } from "@ethersproject/constants";
import Decimal from "decimal.js";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import { getLastPrice } from "../../db/local-db";
import BalancerVaultAbi from "./BalancerVault.abi.json";

export const BALANCER_VAULT_ADDRESS =
  "0xBA12222222228d8Ba445958a75a0704d566BF2C8";

const FUNDS = {
  sender: AddressZero,
  recipient: AddressZero,
  fromInternalBalance: false,
  toInternalBalance: false,
};

type BalancerPoolsConfigs = Record<
  string,
  {
    tokenIn: string;
    tokenOut: string;
    swapAmount: BigNumber;
    swapAmountForSwaps: BigNumber;
    swaps: SwapConfig[];
    tokenAddresses: string[];
    tokenInForSwaps: string;
    tokenOutFromSwaps: string;
    tokenToFetch?: string;
  }
>;

interface SwapConfig {
  poolId: string;
  assetInIndex: number;
  assetOutIndex: number;
  amount: string;
  userData: string;
}

interface DeltaResponse {
  [tokenAddress: string]: string;
}

export class BalancerMultiFetcher extends DexOnChainFetcher<DeltaResponse> {
  constructor(
    name: string,
    private readonly configs: BalancerPoolsConfigs,
    private readonly underlyingToken: string,
    private readonly provider: providers.Provider
  ) {
    super(name);
  }

  // Implementation based on https://github.com/balancer/balancer-sdk/blob/7b7aac51daee0ff2b3c29887f821e1fef6a102ff/balancer-js/src/modules/swaps/swaps.module.ts#L365C11
  override async makeRequest(dataFeedId: string): Promise<DeltaResponse> {
    const { swaps, tokenAddresses } = this.configs[dataFeedId];

    const vaultContract = new Contract(
      BALANCER_VAULT_ADDRESS,
      BalancerVaultAbi,
      this.provider
    );

    const deltas = await vaultContract.callStatic.queryBatchSwap(
      SwapType.SwapExactIn,
      swaps,
      tokenAddresses,
      FUNDS
    );

    return Object.fromEntries(
      deltas.map((delta: BigNumber[], idx: number) => [
        tokenAddresses[idx],
        String(delta),
      ])
    );
  }

  override calculateSpotPrice(
    dataFeedId: string,
    response: DeltaResponse
  ): number {
    const { tokenOut, swapAmount } = this.configs[dataFeedId];
    const ratio = new Decimal(response[tokenOut]);
    const ratioSerialized = ratio.div(swapAmount.toHexString());
    const tokenToFetch =
      this.configs[dataFeedId].tokenToFetch ?? this.underlyingToken;
    const tokenPrice = getLastPrice(tokenToFetch);
    if (!tokenPrice) {
      throw new Error(`Cannot get last price from cache for: ${tokenToFetch}`);
    }
    const tokenPriceAsDecimal = new Decimal(tokenPrice.value);

    return tokenPriceAsDecimal.mul(ratioSerialized).abs().toNumber();
  }

  override calculateLiquidity(
    _assetId: string,
    _response: DeltaResponse
  ): number {
    throw new Error(
      `calculateLiquidity is not implemented for ${this.getName()}`
    );
  }
}
