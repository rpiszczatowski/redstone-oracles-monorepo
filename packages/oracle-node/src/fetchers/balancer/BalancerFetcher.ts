import { PricesObj } from "../../types";
import {
  BalancerSDK,
  BalancerSdkConfig,
  Network,
  PoolWithMethods,
} from "@balancer-labs/sdk";
import { config } from "../../config";
import { BaseFetcher } from "../BaseFetcher";
import { getLastPrice } from "../../db/local-db";
import balancerPairs from "./balancer-pairs.json";
import { PriceWithPromiseStatus, SpotPrice } from "./types";

const balancerConfig: BalancerSdkConfig = {
  network: Network.MAINNET,
  rpcUrl: config.ethMainRpcUrl as string,
};

export type BalancerResponse = PriceWithPromiseStatus[];

const PROMISE_STATUS_FULFILLED = "fulfilled";

export class BalancerFetcher extends BaseFetcher {
  private balancer: BalancerSDK;

  constructor(name: string, protected readonly baseTokenSymbol: string) {
    super(name);
    this.balancer = new BalancerSDK(balancerConfig);
  }

  async fetchData(ids: string[]): Promise<any> {
    const spotPricesPromises: Promise<SpotPrice | null>[] = [];

    const pairIds = this.getPairIdsForAssetIds(ids);
    const pairedTokenPrice = await this.getPairedTokenPrice();
    for (const pairId of pairIds) {
      const priceResult = this.calculatePrice(pairId, pairedTokenPrice);
      spotPricesPromises.push(priceResult);
    }
    const spotPrices = await Promise.allSettled(spotPricesPromises);
    return spotPrices;
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
      const liquidity = pool.totalLiquidity;
      return {
        symbol: this.getSymbol(pool),
        pairedTokenPrice,
        spotPrice,
        liquidity,
      };
    }
    throw new Error(`Pool with ${pairId} not found`);
  }

  protected getSymbol(pool: PoolWithMethods): string {
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

  extractPrices(response: PriceWithPromiseStatus[]): PricesObj {
    const pricesObj: PricesObj = {};

    for (const spotPriceWithStatus of response) {
      if (spotPriceWithStatus.status === PROMISE_STATUS_FULFILLED) {
        const { symbol, pairedTokenPrice, spotPrice } =
          spotPriceWithStatus.value;
        pricesObj[symbol] = pairedTokenPrice / spotPrice;
      }
    }
    return pricesObj;
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
