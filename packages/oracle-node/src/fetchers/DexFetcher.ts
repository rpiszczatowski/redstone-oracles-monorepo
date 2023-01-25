import graphProxy from "../utils/graph-proxy";
import { PricesObj } from "../types";
import { BaseFetcher } from "./BaseFetcher";

interface SymbolToPairId {
  [symbol: string]: string;
}

interface LiquiditiesPerDataFeedId {
  [dataFeedId: string]: number;
}

export class DexFetcher extends BaseFetcher {
  protected retryForInvalidResponse: boolean = true;

  constructor(
    name: string,
    private readonly subgraphUrl: string,
    private readonly symbolToPairIdObj: SymbolToPairId
  ) {
    super(name);
  }

  async fetchData(ids: string[]) {
    const pairIds = this.convertSymbolsToPairIds(ids, this.symbolToPairIdObj);

    const query = `{
      pairs(where: { id_in: ${JSON.stringify(pairIds)} }) {
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

  validateResponse(response: any): boolean {
    return response !== undefined && response.data !== undefined;
  }

  async extractPrices(response: any, assetIds: string[]): Promise<PricesObj> {
    const pricesObj: { [symbol: string]: number } = {};

    for (const currentAssetId of assetIds) {
      const pairId = this.symbolToPairIdObj[currentAssetId];
      const pair = response.data.pairs.find((p: any) => p.id === pairId);

      if (!pair) {
        this.logger.warn(
          `Pair is not in response. Id: ${pairId}. Symbol: ${currentAssetId}. Source: ${this.name}`
        );
      } else {
        const symbol0 = pair.token0.symbol;
        const symbol1 = pair.token1.symbol;
        const reserve0 = parseFloat(pair.reserve0);
        const reserve1 = parseFloat(pair.reserve1);
        const reserveUSD = parseFloat(pair.reserveUSD);

        if (symbol0 === currentAssetId) {
          pricesObj[currentAssetId] = reserveUSD / (2 * reserve0);
        } else if (symbol1 === currentAssetId) {
          pricesObj[currentAssetId] = reserveUSD / (2 * reserve1);
        }
      }
    }

    return pricesObj;
  }

  private convertSymbolsToPairIds(
    symbols: string[],
    symbolToPairId: SymbolToPairId
  ): string[] {
    const pairIds = [];

    for (const symbol of symbols) {
      const pairId = symbolToPairId[symbol];
      if (pairId === undefined) {
        this.logger.warn(
          `Source "${this.name}" does not support symbol: "${symbol}"`
        );
      } else {
        pairIds.push(pairId);
      }
    }

    return pairIds;
  }

  public async getLiquidityForDataFeedsIds(
    dataFeedsIds: string[]
  ): Promise<LiquiditiesPerDataFeedId> {
    const pairIds = this.convertSymbolsToPairIds(
      dataFeedsIds,
      this.symbolToPairIdObj
    );

    const query = `{
      pairs(where: { id_in: ${JSON.stringify(pairIds)} }) {
        id
        reserveUSD
      }
    }`;

    const liquidityResult = await graphProxy.executeQuery(
      this.subgraphUrl,
      query
    );

    const pairs = liquidityResult.data?.pairs;
    if (!pairs || pairs.length === 0) {
      throw new Error(
        "Cannot get LWAP value from an liquidity array that is empty"
      );
    }
    const liquidityPerDataFeedId: LiquiditiesPerDataFeedId = {};
    for (const dataFeedId of dataFeedsIds) {
      const pairId = this.symbolToPairIdObj[dataFeedId];
      const pair = pairs.find((p: any) => p.id === pairId);
      const liquidity = pair.reserveUSD;
      if (isNaN(liquidity)) {
        throw new Error(
          "Cannot get LWAP value form an liquidity array that contains NaN value"
        );
      }
      liquidityPerDataFeedId[dataFeedId] = Number(liquidity);
    }

    return liquidityPerDataFeedId;
  }
}
