import _ from "lodash";
import { utils } from "ethers";
import { PricesObj } from "../../types";
import graphProxy from "../../utils/graph-proxy";
import { BaseFetcher } from "../BaseFetcher";
import symbolToPoolIdObj from "./uniswap-v3-symbol-to-pool-id.json";

const poolIdToSymbol = _.invert(symbolToPoolIdObj);

const BIG_NUMBER_MULTIPLIER = 36;

interface SymbolToPoolId {
  [symbol: string]: string;
}

interface UniswapV3Response {
  data: {
    pools: Pool[];
  };
}

interface Pool {
  id: string;
  token0: Token;
  token1: Token;
  token0Price: string;
  token1Price: string;
  totalValueLockedToken0: string;
  totalValueLockedToken1: string;
  totalValueLockedUSD: string;
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

  validateResponse(response: UniswapV3Response): boolean {
    return response !== undefined && response.data !== undefined;
  }

  async extractPrices(response: UniswapV3Response): Promise<PricesObj> {
    const pricesObj: { [symbol: string]: number } = {};

    for (const pool of response.data.pools) {
      const currentDataFeedId = poolIdToSymbol[pool.id];
      const price = this.calculateTokenPrice(pool, currentDataFeedId);
      pricesObj[currentDataFeedId] = price;
    }
    return pricesObj;
  }

  /* 
    Token price is calculated using prices of token in terms of the other one,
    TVL of the tokens in the native currency and TVL of the pool in USD.

    TVL of the pool can be presented as:
    token0TVL * token0Price + token1TVL * token1Price
    Additionally, we know what is the price of both tokens in the terms of the other one, which is:
    token1Price = token0Price * token0PriceAgainstToken1Price
    This leads us to the equation:
    TVL = token0TVL * token0Price + token0Price * token0PriceAgainstToken1Price * token1TVL
    and equation for token price:
    token0Price = TVL / (token0TVL + token0PriceAgainstToken1Price * token1TVL)
  */
  private calculateTokenPrice(pool: Pool, currentDataFeedId: string) {
    const {
      totalValueLockedTokenToCalculate,
      oppositeTokenTotalValueLocked,
      tokenPriceInTermsOfOther,
    } = this.defineValuesForPriceCalculation(pool, currentDataFeedId);

    const { totalValueLockedInUSD } = this.getValuesFromResponse(pool);

    const tokenTotalValueLockedNormalized =
      totalValueLockedTokenToCalculate.mul(this.parseToBigNumber("1.0"));

    const totalValueLockedNormalizedForToken = oppositeTokenTotalValueLocked
      .mul(tokenPriceInTermsOfOther)
      .add(tokenTotalValueLockedNormalized);

    const tokenPriceAsBigNumber = totalValueLockedInUSD
      .mul(utils.parseUnits("1.0", BIG_NUMBER_MULTIPLIER * 2))
      .div(totalValueLockedNormalizedForToken);

    return Number(
      utils.formatUnits(tokenPriceAsBigNumber, BIG_NUMBER_MULTIPLIER)
    );
  }

  getValuesFromResponse(pool: Pool) {
    const firstTokenSymbol = pool.token0.symbol;
    const firstTokenPriceInTermsOfSecondToken = this.parseToBigNumber(
      pool.token0Price
    );
    const secondTokenPriceInTermsOfFirstToken = this.parseToBigNumber(
      pool.token1Price
    );
    const firstTokenTotalValueLocked = this.parseToBigNumber(
      pool.totalValueLockedToken0
    );
    const secondTokenTotalValueLocked = this.parseToBigNumber(
      pool.totalValueLockedToken1
    );
    const totalValueLockedInUSD = this.parseToBigNumber(
      pool.totalValueLockedUSD
    );

    return {
      firstTokenSymbol,
      firstTokenPriceInTermsOfSecondToken,
      secondTokenPriceInTermsOfFirstToken,
      firstTokenTotalValueLocked,
      secondTokenTotalValueLocked,
      totalValueLockedInUSD,
    };
  }

  defineValuesForPriceCalculation(pool: Pool, currentDataFeedId: string) {
    const {
      firstTokenSymbol,
      firstTokenPriceInTermsOfSecondToken,
      secondTokenPriceInTermsOfFirstToken,
      firstTokenTotalValueLocked,
      secondTokenTotalValueLocked,
    } = this.getValuesFromResponse(pool);

    let totalValueLockedTokenToCalculate,
      oppositeTokenTotalValueLocked,
      tokenPriceInTermsOfOther;

    if (firstTokenSymbol === currentDataFeedId) {
      totalValueLockedTokenToCalculate = firstTokenTotalValueLocked;
      oppositeTokenTotalValueLocked = secondTokenTotalValueLocked;
      tokenPriceInTermsOfOther = firstTokenPriceInTermsOfSecondToken;
    } else {
      totalValueLockedTokenToCalculate = secondTokenTotalValueLocked;
      oppositeTokenTotalValueLocked = firstTokenTotalValueLocked;
      tokenPriceInTermsOfOther = secondTokenPriceInTermsOfFirstToken;
    }

    return {
      totalValueLockedTokenToCalculate,
      oppositeTokenTotalValueLocked,
      tokenPriceInTermsOfOther,
    };
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

  private parseToBigNumber(numberAsString: string) {
    return utils.parseUnits(numberAsString, BIG_NUMBER_MULTIPLIER);
  }
}
