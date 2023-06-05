import {
  BalancerSDK,
  BalancerSdkConfig,
  Network,
  PoolWithMethods,
} from "@balancer-labs/sdk";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import { getLastPrice } from "../../db/local-db";
import { config } from "../../config";

const balancerConfig: BalancerSdkConfig = {
  network: Network.MAINNET,
  rpcUrl: config.ethMainRpcUrl as string,
};

export interface BalancerPoolConfig {
  [symbol: string]: {
    poolId: string;
    pairedToken: string;
  };
}

export interface BalancerResponse {
  pool: PoolWithMethods;
  pairedTokenPrice: number;
}

export class BalancerFetcher extends DexOnChainFetcher<BalancerResponse> {
  private balancer: BalancerSDK;

  constructor(name: string, protected readonly config: BalancerPoolConfig) {
    super(name);
    this.balancer = new BalancerSDK(balancerConfig);
  }

  override async makeRequest(id: string): Promise<BalancerResponse> {
    const pairedTokenPrice = await this.getPairedTokenPrice(id);
    const poolId = this.getPoolIdForAssetId(id);
    const pool = await this.fetchPool(poolId);
    return { pool, pairedTokenPrice };
  }

  override calculateSpotPrice(
    _assetId: string,
    response: BalancerResponse
  ): number {
    const { pool, pairedTokenPrice } = response;
    const spotPrice = Number(
      pool.calcSpotPrice(pool.tokens[1].address, pool.tokens[0].address)
    );

    return spotPrice * pairedTokenPrice;
  }

  override calculateLiquidity(
    _assetId: string,
    response: BalancerResponse
  ): number {
    return Number(response.pool.totalLiquidity);
  }

  private async fetchPool(poolId: string) {
    const pool = await this.balancer.pools.find(poolId);
    if (!pool) {
      throw new Error(`Pool with ${poolId} not found`);
    }
    return pool;
  }

  protected async getPairedTokenPrice(assetId: string): Promise<number> {
    const pairedToken = this.config[assetId].pairedToken;
    const lastPriceFromCache = getLastPrice(pairedToken);
    if (!lastPriceFromCache) {
      throw new Error(`Cannot get last price from cache for: ${pairedToken}`);
    }
    return lastPriceFromCache.value;
  }

  protected getPoolIdForAssetId(assetId: string) {
    const poolId = this.config[assetId].poolId;
    if (!poolId) {
      throw new Error(
        `Missing balancer pair for ${assetId}, check balancer pair config`
      );
    }
    return poolId;
  }
}
