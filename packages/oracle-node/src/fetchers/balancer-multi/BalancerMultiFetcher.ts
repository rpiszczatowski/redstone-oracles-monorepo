import { BalancerSDK, BalancerSdkConfig, Network } from "@balancer-labs/sdk";
import { BigNumber } from "ethers";
import Decimal from "decimal.js";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import { getLastPrice } from "../../db/local-db";
import { config } from "../../config";

const balancerConfig: BalancerSdkConfig = {
  network: Network.MAINNET,
  rpcUrl: config.ethMainRpcUrls[0],
};

interface BalancerPoolsConfig {
  tokenIn: string;
  tokenOut: string;
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
  tokenFromResponseAddress: string;
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

  constructor(
    name: string,
    protected readonly config: BalancerPoolsConfig,
    private readonly dataFeedId: string
  ) {
    super(name);
    this.balancer = new BalancerSDK(balancerConfig);
  }

  override async makeRequest(dataFeedId: string): Promise<DeltaResponse> {
    if (this.dataFeedId !== dataFeedId) {
      throw new Error("Invalid data feed used in balancer multi fetcher");
    }

    // Simulates a call to `batchSwap`, returning an array of Vault asset deltas.
    return (this.balancer.swaps as any).queryExactIn(this.config);
  }

  override calculateSpotPrice(
    dataFeedId: string,
    response: DeltaResponse
  ): number {
    if (this.dataFeedId !== dataFeedId) {
      throw new Error("Invalid data feed used in balancer multi fetcher");
    }

    const { tokenFromResponseAddress, tokenToFetch, swapAmount } = this.config;
    const ratio = new Decimal(response[tokenFromResponseAddress]);
    const ratioSerialized = ratio.div(swapAmount.toHexString());

    const tokenPrice = getLastPrice(this.config.tokenToFetch);
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
