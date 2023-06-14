import { BalancerSDK, BalancerSdkConfig, Network } from "@balancer-labs/sdk";
import { BigNumber } from "ethers";
import Decimal from "decimal.js";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import { getLastPrice } from "../../db/local-db";
import { config } from "../../config";

const balancerConfig: BalancerSdkConfig = {
  network: Network.MAINNET,
  rpcUrl: config.ethMainRpcUrl as string,
};

interface BalancerPoolsConfig {
  tokenIn: string;
  tokenOut: string;
  gasPrice: BigNumber;
  swapAmount: BigNumber;
  swapAmountForSwaps: BigNumber;
  returnAmount: BigNumber;
  returnAmountFromSwaps: BigNumber;
  returnAmountConsideringFees: BigNumber;
  swaps: SwapConfig[];
  tokenAddresses: string[];
  marketSp: string;
  tokenInForSwaps: string;
  tokenOutFromSwaps: string;
  tokenToFetch: string;
  tokenAddress: string;
}

interface SwapConfig {
  poolId: string;
  assetInIndex: number;
  assetOutIndex: number;
  amount: string;
  userData: string;
  returnAmount: string;
}

interface DeltaResponse {
  [tokenAddress: string]: string;
}

export class BalancerMultiFetcher extends DexOnChainFetcher<DeltaResponse> {
  private balancer: BalancerSDK;

  constructor(name: string, protected readonly config: BalancerPoolsConfig) {
    super(name);
    this.balancer = new BalancerSDK(balancerConfig);
  }

  override async makeRequest(_dataFeedId: string): Promise<DeltaResponse> {
    // Simulates a call to `batchSwap`, returning an array of Vault asset deltas.
    return (this.balancer.swaps as any).queryExactIn(this.config);
  }

  override calculateSpotPrice(
    _dataFeedId: string,
    response: DeltaResponse
  ): number {
    const { tokenAddress, tokenToFetch, swapAmount } = this.config;
    const ratio = new Decimal(response[tokenAddress]);
    const ratioSerialized = ratio.div(swapAmount.toHexString());

    const tokenPrice = getLastPrice(this.config.tokenToFetch);
    if (!tokenPrice) {
      throw new Error(`Cannot get last price from cache for: ${tokenToFetch}`);
    }
    const tokenPriceAsDecimal = new Decimal(tokenPrice.value);

    return tokenPriceAsDecimal.div(ratioSerialized).abs().toNumber();
  }

  override calculateLiquidity(_assetId: string, response: any): number {
    throw new Error();
  }
}
