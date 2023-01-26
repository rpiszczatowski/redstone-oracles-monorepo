import { FetcherOpts, PricesObj } from "../../types";
import {
  BalancerSDK,
  BalancerSdkConfig,
  Network,
  Pool,
} from "@balancer-labs/sdk";
import { config } from "../../config";
import { BaseFetcher } from "../BaseFetcher";
import { ethers } from "ethers";
import redstone from "redstone-api";
import graphProxy from "../../utils/graph-proxy";
import axios from "axios";
import { getLastPrice } from "../../db/local-db";

interface PoolPair {
  address: string;
  pairedTokenAddress: string;
}
interface Token {
  [name: string]: PoolPair;
}
interface SymbolToPairId {
  [pool: string]: Token;
}

const poolTokens: SymbolToPairId = require("./pool-tokens");
const provider = new ethers.providers.JsonRpcProvider(config.ethMainRpcUrl);
const SECOND_IN_MILLISECONDS = 1000;
const url = "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2";
const timestampToBlockProviderUrl = "https://coins.llama.fi/block/ethereum/";

const balancerConfig: BalancerSdkConfig = {
  network: Network.MAINNET,
  rpcUrl: config.ethMainRpcUrl as string,
};

const balancer = new BalancerSDK(balancerConfig);

export class BalancerFetcher extends BaseFetcher {
  private poolId: string;
  private supportedToken?: string;
  private pool?: Pool;

  constructor(poolId: string) {
    super(`balancer-${poolId}`);
    this.poolId = poolId;
  }

  async fetchData(
    ids: string[],
    opts: FetcherOpts,
    timestamp: number
  ): Promise<any> {
    await this.tryInit();
    const unsupportedPairs = await this.findUnsupportedTokens(ids);

    if (unsupportedPairs.length === ids.length) {
      this.logger.error("Requested tokens are not supported for this pool");
      return;
    }
    if (unsupportedPairs.length > 0) {
      this.logger.warn(
        `Symbols: ${unsupportedPairs} not supported in Source: ${this.name} with poolId: ${this.poolId}`
      );
    }

    if (timestamp != undefined) {
      return this.getHistoricalPrice(ids, opts, timestamp);
    }

    let pool = await balancer.pools.find(this.poolId);
    const pairedTokenPrice = getLastPrice(pool!.tokens[1]!.symbol as string);

    if (pairedTokenPrice === undefined) {
      this.logger.error(
        `In order to use source: ${this.name} with poolId ${
          this.poolId
        } you need to add ${pool!.tokens[1]!.symbol} to manifest`
      );
      return;
    }

    if (pairedTokenPrice) {
      let results = pool?.calcSpotPrice(
        pool.tokens[0].address,
        pool.tokens[1].address
      );
      return pairedTokenPrice.value / Number(results);
    }
  }

  async findUnsupportedTokens(ids: string[]) {
    return ids.filter((id: any) => id !== this.supportedToken);
  }

  async tryInit() {
    if (this.pool === null || this.pool === undefined) {
      this.pool = await balancer.pools.find(this.poolId);
      this.supportedToken = this.pool?.tokens[0].symbol;
    }
  }

  async getHistoricalPrice(
    ids: string[],
    opts: FetcherOpts,
    timestamp: number
  ) {
    let pool = await balancer.pools.find(this.poolId);
    const pairedTokenPrice = await redstone.getHistoricalPrice(
      `${pool!.tokens[1].symbol}`,
      {
        date: new Date(timestamp * SECOND_IN_MILLISECONDS),
      }
    );
    const blockNumber = await this.getBlockNumber(timestamp);

    const graphResults = await graphProxy.executeQuery(
      url,
      this.getGraphQuery(blockNumber)
    );

    if (graphResults.data.pool === null) {
      this.logger.error("Pool is null for specified timestamp");
      return {};
    }
    console.log(graphResults);
    let token0 = graphResults.data.pool.tokens[0];
    let token1 = graphResults.data.pool.tokens[1];

    const pricesObj: { [symbol: string]: number } = {};
    pricesObj[this.supportedToken as string] =
      pairedTokenPrice.value / Number(token0.balance / token1.balance);
    return pricesObj;
  }
  async getBlockNumber(timestamp: number) {
    return (await axios.get(timestampToBlockProviderUrl + timestamp)).data
      .height;
  }

  getGraphQuery(blockNumber: number) {
    return `{
      pool(
        id: "${this.poolId}"
        block: {number: ${blockNumber}}
      ) {
        id
        tokens {
          balance
        }
        totalLiquidity
      }
    }`;
  }

  async extractPrices(response: any): Promise<PricesObj> {
    const pricesObj: { [symbol: string]: number } = {};
    pricesObj[this.supportedToken as string] = response;
    return pricesObj;
  }
}
