import { SushiswapFetcher } from "../SushiswapFetcher";
import graphProxy from "../../../utils/graph-proxy";
import axios from "axios";

const timestampToBlockProviderUrl = "https://coins.llama.fi/block/ethereum/";

export class SushiswapFetcherHistorical extends SushiswapFetcher {
  private timestamp: number;

  constructor(timestamp: number) {
    super();
    this.timestamp = timestamp;
  }

  async fetchData(ids: string[]) {
    const pairIds = this.convertSymbolsToPairIds(ids, this.symbolToPairIdObj);

    const blockNumber = (
      await axios.get(timestampToBlockProviderUrl + this.timestamp)
    ).data.height;

    const query = `{
      pairs(block: {number: ${blockNumber}} where: { id_in: ${JSON.stringify(
      pairIds
    )} }) {
        id
        token0 {
          symbol
        }
        token1 {
          symbol
        }
        reserve0
        reserve1
        reserveUSD
      }
    }`;

    return await graphProxy.executeQuery(this.subgraphUrl, query);
  }
}
