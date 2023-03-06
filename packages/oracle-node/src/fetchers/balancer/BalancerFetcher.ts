import {
  BalancerSDK,
  BalancerSdkConfig,
  Network,
  PoolWithMethods,
} from "@balancer-labs/sdk";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import { getLastPrice } from "../../db/local-db";
import balancerPairs from "./balancer-pairs.json";
import { config } from "../../config";

const balancerConfig: BalancerSdkConfig = {
  network: Network.MAINNET,
  rpcUrl: config.ethMainRpcUrl as string,
};

export interface BalancerResponse {
  pool: PoolWithMethods;
  assetId: string;
  pairedTokenPrice: number;
}

export class BalancerFetcher extends DexOnChainFetcher<BalancerResponse> {
  private balancer: BalancerSDK;

  constructor(name: string, protected readonly baseTokenSymbol: string) {
    super(name);
    this.balancer = new BalancerSDK(balancerConfig);
  }

  async makeRequest(id: string): Promise<BalancerResponse> {
    const pairedTokenPrice = await this.getPairedTokenPrice();
    const pool = await this.fetchPool(id);
    return { pool, assetId: id, pairedTokenPrice };
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

  protected async getPairedTokenPrice() {
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

  calculateSpotPrice(_assetId: string, response: BalancerResponse): number {
    const { pool, pairedTokenPrice } = response;
    const spotPrice = Number(
      pool.calcSpotPrice(pool.tokens[0].address, pool.tokens[1].address)
    );
    return pairedTokenPrice / spotPrice;
  }

  calculateLiquidity(_assetId: string, response: BalancerResponse): number {
    return Number(response.pool.totalLiquidity);
  }

  protected getPairIdsForAssetIds(assetIds: string[]): string[] {
    const pairIds = [];

    for (const pair of balancerPairs) {
      const symbol0 = pair.tokens[0].symbol;
      const symbol1 = pair.tokens[1].symbol;
      const pairIdShouldBeIncluded =
        (symbol0 == this.baseTokenSymbol && assetIds.includes(symbol1)) ||
        (symbol1 == this.baseTokenSymbol && assetIds.includes(symbol0));
      if (pairIdShouldBeIncluded) {
        pairIds.push(pair.id);
      }
    }
    return pairIds;
  }
}
