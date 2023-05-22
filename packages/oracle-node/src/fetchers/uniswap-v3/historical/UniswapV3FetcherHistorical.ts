import graphProxy from "../../../utils/graph-proxy";
import symbolToPoolIdObj from "../uniswap-v3-symbol-to-pool-id.json";
import { UniswapV3Fetcher } from "../UniswapV3Fetcher";
import axios from "axios";

const subgraphUrl =
  "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3";
const timestampToBlockProviderUrl = "https://coins.llama.fi/block/ethereum/";

export class UniswapV3FetcherHistorical extends UniswapV3Fetcher {
  private timestamp: number;

  constructor(timestamp: number) {
    super();
    this.timestamp = timestamp;
  }

  async fetchData(ids: string[]) {
    const pairIds = this.convertSymbolsToPoolIds(ids, symbolToPoolIdObj);
    const blockNumber = (
      await axios.get(timestampToBlockProviderUrl + this.timestamp)
    ).data.height;

    const query = `{
      pools(block: {number: ${blockNumber}}, where: { id_in: ${JSON.stringify(
      pairIds
    )} }) {
        id
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
        token0Price
        token1Price
        totalValueLockedToken0
        totalValueLockedToken1
        totalValueLockedUSD
      }
    }`;
    return await graphProxy.executeQuery(subgraphUrl, query);
  }
}
