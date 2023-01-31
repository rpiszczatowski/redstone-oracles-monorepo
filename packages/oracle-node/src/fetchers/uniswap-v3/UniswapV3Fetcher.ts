import { utils } from "ethers";
import { PricesObj } from "../../types";
import graphProxy from "../../utils/graph-proxy";
import { BaseFetcher } from "../BaseFetcher";
import symbolToPoolIdObj from "./uniswap-v3-symbol-to-pool-id.json";

const BIG_NUMBER_MULTIPLIER = 36;

type SymbolToPoolIdKeys = keyof typeof symbolToPoolIdObj;

interface SymbolToPoolId {
  [symbol: string]: string;
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

  validateResponse(response: any): boolean {
    return response !== undefined && response.data !== undefined;
  }

  async extractPrices(
    response: any,
    dataFeedsIds: string[]
  ): Promise<PricesObj> {
    const pricesObj: { [symbol: string]: number } = {};

    for (const currentDataFeedId of dataFeedsIds) {
      const poolId = symbolToPoolIdObj[currentDataFeedId as SymbolToPoolIdKeys];
      const pool: Pool = response.data.pools.find(
        (pool: Pool) => pool.id === poolId
      );

      if (!pool) {
        this.logger.warn(
          `Pool is not in response. Id: ${poolId}. Symbol: ${currentDataFeedId}. Source: ${this.name}`
        );
      } else {
        const price = this.calculateTokenPrice(pool, currentDataFeedId);
        if (price) {
          pricesObj[currentDataFeedId] = price;
        }
      }
    }
    return pricesObj;
  }

  protected calculateTokenPrice(pool: Pool, currentDataFeedId: string) {
    const {
      totalValueLockedTokenToCalculate,
      oppositeTokenTotalValueLocked,
      tokenPriceInTermsOfOther,
    } = this.defineValuesForPriceCalculation(pool, currentDataFeedId);

    const { totalValueLockedInUSD } = this.getValuesFromResponse(pool);

    const tokenTotalValueLockedNormalized =
      totalValueLockedTokenToCalculate.mul(
        utils.parseUnits("1.0", BIG_NUMBER_MULTIPLIER)
      );

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
    const firstTokenPriceInTermsOfSecondToken = utils.parseUnits(
      pool.token0Price,
      BIG_NUMBER_MULTIPLIER
    );
    const secondTokenPriceInTermsOfFirstToken = utils.parseUnits(
      pool.token1Price,
      BIG_NUMBER_MULTIPLIER
    );
    const firstTokenTotalValueLocked = utils.parseUnits(
      pool.totalValueLockedToken0,
      BIG_NUMBER_MULTIPLIER
    );
    const secondTokenTotalValueLocked = utils.parseUnits(
      pool.totalValueLockedToken1,
      BIG_NUMBER_MULTIPLIER
    );
    const totalValueLockedInUSD = utils.parseUnits(
      pool.totalValueLockedUSD,
      BIG_NUMBER_MULTIPLIER
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

  protected convertSymbolsToPoolIds(
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
