import redstone from "redstone-api";
import graphProxy from "../../../utils/graph-proxy";
import axios from "axios";
import { BalancerFetcher } from "../BalancerFetcher";

const SECOND_IN_MILLISECONDS = 1000;
const url = "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2";
const timestampToBlockProviderUrl = "https://coins.llama.fi/block/ethereum/";

export class BalancerFetcherHistorical extends BalancerFetcher {
  private timestamp: number;

  constructor(poolId: string, timestamp: number) {
    super(`balancer-${poolId}`);
    this.timestamp = timestamp;
  }

  protected async calculatePrice(pairedTokenPrice: number): Promise<number> {
    const blockNumber = await this.getBlockNumber(this.timestamp);
    const graphResults = await graphProxy.executeQuery(
      url,
      this.getGraphQuery(blockNumber)
    );

    if (graphResults.data.pool === null) {
      this.logger.error("Pool is null for specified timestamp");
      return NaN;
    }
    const token0 = graphResults.data.pool.tokens[0];
    const token1 = graphResults.data.pool.tokens[1];

    return pairedTokenPrice / Number(token0.balance / token1.balance);
  }

  protected async getPairedTokenPrice() {
    return (
      await redstone.getHistoricalPrice(`${this.pool!.tokens[1].symbol}`, {
        date: new Date(this.timestamp * SECOND_IN_MILLISECONDS),
      })
    ).value;
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
}
