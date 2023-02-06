import redstone from "redstone-api";
import graphProxy from "../../../utils/graph-proxy";
import axios from "axios";
import { BalancerFetcher } from "../BalancerFetcher";

const SECOND_IN_MILLISECONDS = 1000;
const url = "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2";
const timestampToBlockProviderUrl = "https://coins.llama.fi/block/ethereum/";

interface SpotPrice {
  id: string;
  price: number;
}

export class BalancerFetcherHistorical extends BalancerFetcher {
  private timestamp: number;

  constructor(name: string, baseTokenSymbol: string, timestamp: number) {
    super(name, baseTokenSymbol);
    this.timestamp = timestamp;
  }

  protected async calculatePrice(
    pairId: string,
    pairedTokenPrice: number
  ): Promise<SpotPrice> {
    const blockNumber = await this.getBlockNumber(this.timestamp);
    const graphResults = await graphProxy.executeQuery(
      url,
      this.getGraphQuery(pairId, blockNumber)
    );

    if (graphResults.data.pool === null) {
      this.logger.error("Pool is null for specified timestamp");
      return { price: NaN, id: "" };
    }
    const tokens = graphResults.data.pool.tokens;
    const token0 = tokens[0];
    const token1 = tokens[1];

    const price = pairedTokenPrice / Number(token0.balance / token1.balance);

    const id =
      token0.symbol == this.baseTokenSymbol ? token1.symbol! : token0.symbol!;

    return { price, id };
  }

  async getBlockNumber(timestamp: number) {
    return (await axios.get(timestampToBlockProviderUrl + timestamp)).data
      .height;
  }

  protected async getPairedTokenPrice() {
    return (
      await redstone.getHistoricalPrice(`${this.baseTokenSymbol}`, {
        date: new Date(this.timestamp * SECOND_IN_MILLISECONDS),
      })
    ).value;
  }

  getGraphQuery(poolId: string, blockNumber: number) {
    return `{
      pool(
        id: "${poolId}"
        block: {number: ${blockNumber}}
      ) {
        id
        tokens {
          balance
          symbol
        }
        totalLiquidity
      }
    }`;
  }
}
