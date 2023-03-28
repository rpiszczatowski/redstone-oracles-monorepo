import {
  BalancerSDK,
  BalancerSdkConfig,
  Network,
  PoolWithMethods,
} from "@balancer-labs/sdk";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import { getLastPrice } from "../../db/local-db";
import balancerPools from "./balancer-pools.json";
import { config } from "../../config";

const balancerConfig: BalancerSdkConfig = {
  network: Network.MAINNET,
  rpcUrl: config.ethMainRpcUrl as string,
};

export interface BalancerResponse {
  pool: PoolWithMethods;
  pairedTokenPrice: number;
}

export class BalancerFetcher extends DexOnChainFetcher<BalancerResponse> {
  private balancer: BalancerSDK;

  constructor(name: string, protected readonly baseTokenSymbol: string) {
    super(name);
    this.balancer = new BalancerSDK(balancerConfig);
  }

  override async makeRequest(id: string): Promise<BalancerResponse> {
    const pairedTokenPrice = await this.getPairedTokenPrice();
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

  protected getSymbolFromPool(pool: PoolWithMethods): string {
    return pool.tokens[0].symbol === this.baseTokenSymbol
      ? pool.tokens[1].symbol!
      : pool.tokens[0].symbol!;
  }

  protected async getPairedTokenPrice(): Promise<number> {
    let tokenToGet = this.baseTokenSymbol;
    if (tokenToGet === "WETH") {
      tokenToGet = "ETH";
    }
    const lastPriceFromCache = getLastPrice(tokenToGet);
    if (!lastPriceFromCache) {
      throw new Error(`Cannot get last price from cache for: ${tokenToGet}`);
    }
    return lastPriceFromCache.value;
  }

  protected getPoolIdForAssetId(assetId: string) {
    const poolFound = balancerPools.find((pool) => {
      const symbol0 = pool.tokens[0].symbol;
      const symbol1 = pool.tokens[1].symbol;
      return (
        (symbol0 == this.baseTokenSymbol && assetId === symbol1) ||
        (symbol1 == this.baseTokenSymbol && assetId === symbol0)
      );
    });
    if (!poolFound) {
      throw new Error(
        `Missing balancer pair for ${assetId}, check balancer pair config`
      );
    }
    return poolFound.id;
  }
}
