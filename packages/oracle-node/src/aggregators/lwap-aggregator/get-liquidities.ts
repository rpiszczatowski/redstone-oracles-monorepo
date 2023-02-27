import localDb from "../../db/local-db";
import { buildLiquidityDataFeedId } from "../../fetchers/liquidity/utils";
import { Source } from "../../types";
import { PricesWithLiquidity } from "./lwap-aggregator";

export const getTickLiquidities = (symbol: string, sourcesNames: Source) => {
  const pricesWithLiquidity: PricesWithLiquidity[] = [];
  for (const [sourceName, price] of Object.entries(sourcesNames)) {
    const dataFeedId = buildLiquidityDataFeedId(symbol, sourceName);
    const liquidity = localDb.getLastPrice(dataFeedId);
    if (!liquidity) {
      throw new Error(
        `Cannot calculate LWAP, missing liquidity for ${dataFeedId}`
      );
    }
    pricesWithLiquidity.push({
      price,
      liquidity: liquidity.value,
    });
  }
  return pricesWithLiquidity;
};
