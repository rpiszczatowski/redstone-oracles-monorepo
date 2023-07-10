import {
  BalancerSDK,
  BalancerSdkConfig,
  Network,
  PoolWithMethods,
} from "@balancer-labs/sdk";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import { getLastPrice } from "../../db/local-db";
import { config } from "../../config";

const DEFAULT_NETWORK_CONFIG: BalancerSdkConfig = {
  network: Network.MAINNET,
  rpcUrl: config.ethMainRpcUrls[0],
};

export type BalancerPoolsConfig = {
  pairedToken: string;
  poolsConfigs: Record<
    string,
    {
      poolId: string;
      tokenIn: string;
      tokenOut: string;
      networkConfig?: BalancerSdkConfig;
    }
  >;
};

export interface BalancerResponse {
  pool: PoolWithMethods;
  pairedTokenPrice: number;
}

export class BalancerFetcher extends DexOnChainFetcher<BalancerResponse> {
  constructor(name: string, protected readonly config: BalancerPoolsConfig) {
    super(name);
  }

  override async makeRequest(id: string): Promise<BalancerResponse> {
    const pairedTokenPrice = await this.getPairedTokenPrice();
    const poolId = this.getPoolIdForAssetId(id);
    const pool = await this.fetchPool(poolId, id);
    return { pool, pairedTokenPrice };
  }

  override calculateSpotPrice(
    assetId: string,
    response: BalancerResponse
  ): number {
    const { pool, pairedTokenPrice } = response;
    const { tokenIn, tokenOut } = this.config.poolsConfigs[assetId];
    const spotPrice = Number(pool.calcSpotPrice(tokenIn, tokenOut));
    return spotPrice * pairedTokenPrice;
  }

  override calculateLiquidity(
    _assetId: string,
    response: BalancerResponse
  ): number {
    return Number(response.pool.totalLiquidity);
  }

  private async fetchPool(poolId: string, dataFeedId: string) {
    const poolConfig = this.config.poolsConfigs[dataFeedId];
    const networkConfig = poolConfig?.networkConfig ?? DEFAULT_NETWORK_CONFIG;
    const balancerSdk = new BalancerSDK(networkConfig);
    const pool = await balancerSdk.pools.find(poolId);
    if (!pool) {
      throw new Error(`Pool with ${poolId} not found`);
    }
    return pool;
  }

  protected async getPairedTokenPrice(): Promise<number> {
    const pairedToken = this.config.pairedToken;
    const lastPriceFromCache = getLastPrice(pairedToken);
    if (!lastPriceFromCache) {
      throw new Error(`Cannot get last price from cache for: ${pairedToken}`);
    }
    return lastPriceFromCache.value;
  }

  protected getPoolIdForAssetId(assetId: string) {
    const poolId = this.config.poolsConfigs[assetId].poolId;
    if (!poolId) {
      throw new Error(
        `Missing balancer pair for ${assetId}, check balancer pair config`
      );
    }
    return poolId;
  }
}
