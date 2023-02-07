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

const balancerConfig: BalancerSdkConfig = {
  network: Network.MAINNET,
  rpcUrl: config.ethMainRpcUrl as string,
};

interface SpotPrice {
  id: string;
  price: number;
}

export class BalancerFetcher extends BaseFetcher {
  private balancer: BalancerSDK;

  constructor(name: string, protected readonly baseTokenSymbol: string) {
    super(name);
    this.balancer = new BalancerSDK(balancerConfig);
  }

  async fetchData(ids: string[]): Promise<any> {
    const spotPrices: SpotPrice[] = [];

    const pairIds = this.getPairIdsForAssetIds(ids);

    const pairedTokenPrice = await this.getPairedTokenPrice();
    for (const pairId of pairIds) {
      const priceResult = await this.calculatePrice(pairId, pairedTokenPrice);
      if (!priceResult) {
        throw new Error(`Could not get pool with id ${pairId}`);
      }
      const { id, price } = priceResult;
      spotPrices.push({ id, price });
    }
    return spotPrices;
  }

  protected async calculatePrice(
    pairId: string,
    pairedTokenPrice: number
  ): Promise<SpotPrice | null> {
    const pool = await this.balancer.pools.find(pairId);
    if (pool) {
      const spotPrice = pool.calcSpotPrice(
        pool.tokens[0].address,
        pool.tokens[1].address
      );
      const price = pairedTokenPrice / Number(spotPrice);
      return { id: this.getSymbol(pool), price };
    }
    return null;
  }

  protected getSymbol(pool: PoolWithMethods): string {
    return pool.tokens[0].symbol === this.baseTokenSymbol
      ? pool.tokens[1].symbol!
      : pool.tokens[0].symbol!;
  }

  protected async getPairedTokenPrice() {
    return getLastPrice(this.baseTokenSymbol)!.value;
  }

  async extractPrices(response: SpotPrice[]): Promise<PricesObj> {
    const pricesObj: PricesObj = {};

    for (const spotPrice of response) {
      pricesObj[spotPrice.id] = spotPrice.price;
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
