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

const balancerConfig: BalancerSdkConfig = {
  network: Network.MAINNET,
  rpcUrl: config.ethMainRpcUrl as string,
};

export class BalancerFetcher extends BaseFetcher {
  protected poolId: string;
  protected supportedToken?: string;
  protected pool?: PoolWithMethods;
  protected balancer: BalancerSDK;

  constructor(poolId: string) {
    super(`balancer-${poolId}`);
    this.poolId = poolId;
    this.balancer = new BalancerSDK(balancerConfig);
  }

  async fetchData(ids: string[]): Promise<any> {
    await this.tryInit();

    if (this.hasUnsupportedPairs(ids)) {
      return {};
    }

    const pairedTokenPrice = await this.getPairedTokenPrice();

    if (pairedTokenPrice === undefined) {
      this.logger.error(
        `In order to use source: ${this.name} with poolId ${
          this.poolId
        } you need to add ${this.pool!.tokens[1]!.symbol} to manifest`
      );
      return {};
    }
    return await this.calculatePrice(pairedTokenPrice);
  }

  protected async calculatePrice(pairedTokenPrice: number): Promise<number> {
    const spotPrice = this.pool?.calcSpotPrice(
      this.pool.tokens[0].address,
      this.pool.tokens[1].address
    );
    return pairedTokenPrice / Number(spotPrice);
  }

  protected async getPairedTokenPrice() {
    return getLastPrice(this.pool!.tokens[1]!.symbol as string)!.value;
  }

  protected hasUnsupportedPairs(ids: string[]) {
    const unsupportedPairs = this.findUnsupportedTokens(ids);

    if (unsupportedPairs.length === ids.length) {
      this.logger.error("Requested tokens are not supported for this pool");
      return true;
    }
    if (unsupportedPairs.length > 0) {
      this.logger.warn(
        `Symbols: ${unsupportedPairs} not supported in Source: ${this.name} with poolId: ${this.poolId}`
      );
    }
    return false;
  }

  findUnsupportedTokens(ids: string[]) {
    return ids.filter((id: string) => id !== this.supportedToken);
  }

  protected async tryInit() {
    if (this.pool === null || this.pool === undefined) {
      this.pool = await this.balancer.pools.find(this.poolId);
      this.supportedToken = this.pool?.tokens[0].symbol;
    }
  }

  async extractPrices(response: any): Promise<PricesObj> {
    const pricesObj: { [symbol: string]: number } = {};
    pricesObj[this.supportedToken as string] = response;
    return pricesObj;
  }
}
