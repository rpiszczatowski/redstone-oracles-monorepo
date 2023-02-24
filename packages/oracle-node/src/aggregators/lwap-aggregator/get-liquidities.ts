import { buildLiquidityDataFeedId } from "../../fetchers/liquidity/utils";
import { PricesWithLiquidity } from "./lwap-aggregator";
import { PriceDataBeforeAggregation, Source } from "../../types";

export const getTickLiquidities = (
  symbol: string,
  sourcesNames: Source,
  liquidities: PriceDataBeforeAggregation[]
) => {
  const pricesWithLiquidity: PricesWithLiquidity[] = [];
  for (const [sourceName, price] of Object.entries(sourcesNames)) {
    const dataFeedId = buildLiquidityDataFeedId(symbol, sourceName);
    const liquidity = liquidities.find(
      (liquidity) => liquidity.symbol === dataFeedId
    );
    if (!liquidity) {
      throw new Error(
        `Cannot calculate LWAP, missing liquidity for ${dataFeedId}`
      );
    }
    const theOnlySource = Object.keys(liquidity.source)[0];
    pricesWithLiquidity.push({
      price,
      liquidity: liquidity.source[theOnlySource],
    });
  }
  return pricesWithLiquidity;
};
