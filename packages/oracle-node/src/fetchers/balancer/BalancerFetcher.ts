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
import { PriceWithPromiseStatus, SpotPrice } from "./types";

const balancerConfig: BalancerSdkConfig = {
  network: Network.MAINNET,
  rpcUrl: config.ethMainRpcUrl as string,
};

export type BalancerResponse = PriceWithPromiseStatus[];

export class BalancerFetcher extends DexOnChainFetcher<SpotPrice> {
  private balancer: BalancerSDK;

  constructor(name: string, protected readonly baseTokenSymbol: string) {
    super(name);
    this.balancer = new BalancerSDK(balancerConfig);
  }

  async makeRequest(id: string): Promise<any> {
    const pairedTokenPrice = await this.getPairedTokenPrice();
    const priceResult = this.calculatePrice(id, pairedTokenPrice);
    return priceResult;
  }

  protected async calculatePrice(
    pairId: string,
    pairedTokenPrice: number
  ): Promise<SpotPrice> {
    const pool = await this.balancer.pools.find(pairId);
    if (pool) {
      const spotPrice = Number(
        pool.calcSpotPrice(pool.tokens[0].address, pool.tokens[1].address)
      );
      const liquidity = Number(pool.totalLiquidity);
      return {
        assetId: this.getSymbolFromPool(pool),
        pairedTokenPrice,
        spotPrice,
        liquidity,
      };
    }
    throw new Error(`Pool with ${pairId} not found`);
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

  calculateSpotPrice(_assetId: string, response: SpotPrice): number {
    const { pairedTokenPrice, spotPrice } = response;
    return pairedTokenPrice / spotPrice;
  }

  calculateLiquidity(_assetId: string, response: any): number {
    return response.liquidity;
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
