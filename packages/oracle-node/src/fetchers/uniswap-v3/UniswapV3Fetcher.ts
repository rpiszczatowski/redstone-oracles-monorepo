import _ from "lodash";
import { PricesObj } from "../../types";
import graphProxy from "../../utils/graph-proxy";
import { BaseFetcher } from "../BaseFetcher";
import symbolToPoolIdObj from "./uniswap-v3-symbol-to-pool-id.json";
import { getLastPrice } from "../../db/local-db";

const poolIdToSymbol = _.invert(symbolToPoolIdObj);

interface SymbolToPoolId {
  [symbol: string]: string;
}

export interface UniswapV3Response {
  data: {
    pools: Pool[];
  };
}

export interface Pool {
  id: string;
  token0: Token;
  token1: Token;
  token0Price: string;
  token1Price: string;
  liquidity: string;
}

interface Token {
  id: string;
  symbol: string;
}

const subgraphUrl =
  "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3";

export class UniswapV3Fetcher extends BaseFetcher {
  constructor() {
    super("uniswap-v3");
  }

  async fetchData(ids: string[]) {
    const pairIds = this.convertSymbolsToPoolIds(ids, symbolToPoolIdObj);

    const query = `{
      pools(where: { id_in: ${JSON.stringify(pairIds)} }) {
        id
        token0 {
          symbol
        }
        token1 {
          symbol
        }
        token0Price
        token1Price
        liquidity
      }
    }`;

    return await graphProxy.executeQuery(subgraphUrl, query);
  }

  validateResponse(response: UniswapV3Response): boolean {
    return response !== undefined && response.data !== undefined;
  }

  extractPrices(response: UniswapV3Response): PricesObj {
    const pricesObj: { [symbol: string]: number } = {};

    for (const pool of response.data.pools) {
      const currentDataFeedId = poolIdToSymbol[pool.id];
      const price = this.calculateTokenPrice(pool, currentDataFeedId);
      if (price) {
        pricesObj[currentDataFeedId] = price;
      }
    }
    return pricesObj;
  }

  private calculateTokenPrice(
    pool: Pool,
    currentDataFeedId: string
  ): number | undefined {
    const { tokenPriceInTermsOfOther, otherTokenPrice } =
      this.prepareValuesBasedOnCurrentDataFeed(pool, currentDataFeedId);

    if (tokenPriceInTermsOfOther && otherTokenPrice) {
      return tokenPriceInTermsOfOther * otherTokenPrice.value;
    }
  }

  private prepareValuesBasedOnCurrentDataFeed(
    pool: Pool,
    currentDataFeedId: string
  ) {
    const firstTokenSymbol = pool.token0.symbol;
    let secondTokenSymbol = pool.token1.symbol;
    if (secondTokenSymbol === "WETH") {
      secondTokenSymbol = "ETH";
    }

    let tokenPriceInTermsOfOther, otherTokenPrice;
    if (firstTokenSymbol === currentDataFeedId) {
      tokenPriceInTermsOfOther = parseFloat(pool.token1Price);
      otherTokenPrice = getLastPrice(secondTokenSymbol);
    } else if (secondTokenSymbol === currentDataFeedId) {
      tokenPriceInTermsOfOther = parseFloat(pool.token0Price);
      otherTokenPrice = getLastPrice(firstTokenSymbol);
    }
    return { tokenPriceInTermsOfOther, otherTokenPrice };
  }

  private convertSymbolsToPoolIds(
    symbols: string[],
    symbolToPoolId: SymbolToPoolId
  ): string[] {
    const poolIds = [];

    for (const symbol of symbols) {
      const poolId = symbolToPoolId[symbol];
      if (poolId === undefined) {
        this.logger.warn(
          `Source ${this.name} does not support symbol: ${symbol}`
        );
      } else {
        poolIds.push(poolId);
      }
    }

    return poolIds;
  }
}
