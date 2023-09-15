import { BaseFetcher } from "../BaseFetcher";
import { PricesObj } from "../../types";
import platypusTokens from "./platypus-tokens.json";
import graphProxy from "../../utils/graph-proxy";

const PLATYPUS_SUBGRAPH_FETCHER =
  "https://api.thegraph.com/subgraphs/name/messari/platypus-finance-avalanche";

type Token = { symbol: string; lastPriceUSD: string };
export interface PlatypusResponse {
  data?: {
    tokens: Token[];
  };
}
export class PlatypusFetcher extends BaseFetcher {
  constructor() {
    super("platypus-finance");
  }

  override async fetchData(ids: string[]) {
    const tokensIds = PlatypusFetcher.getTokenIdsForAssetIds(ids);
    const query = `{
      tokens(where: { id_in: ${JSON.stringify(tokensIds)} }) {
        id
        name
        symbol
        decimals
        lastPriceUSD
      }
    }`;

    return await graphProxy.executeQuery<PlatypusResponse>(
      PLATYPUS_SUBGRAPH_FETCHER,
      query
    );
  }

  override validateResponse(response: PlatypusResponse | undefined): boolean {
    return response !== undefined && response.data !== undefined;
  }

  override extractPrices(response: PlatypusResponse): PricesObj {
    return this.extractPricesSafely(
      response.data!.tokens,
      ({ lastPriceUSD, symbol }) => ({
        value: Number(lastPriceUSD),
        id: symbol,
      })
    );
  }

  private static getTokenIdsForAssetIds(assetIds: string[]): string[] {
    const tokenIds = [];

    for (const { id, name } of platypusTokens) {
      if (assetIds.includes(name)) {
        tokenIds.push(id);
      }
    }

    return tokenIds;
  }
}
