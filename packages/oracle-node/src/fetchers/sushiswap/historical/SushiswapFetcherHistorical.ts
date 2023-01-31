import { SushiswapFetcher } from "../SushiswapFetcher";
import graphProxy from "../../../utils/graph-proxy";

export class SushiswapFetcherHistorical extends SushiswapFetcher {
  private blockNumber: number;

  constructor(blockNumber: number) {
    super();
    this.blockNumber = blockNumber;
  }

  async fetchData(ids: string[]) {
    const pairIds = this.convertSymbolsToPairIds(ids, this.symbolToPairIdObj);

    const query = `{
      pairs(block: {number: ${
        this.blockNumber
      }} where: { id_in: ${JSON.stringify(pairIds)} }) {
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
