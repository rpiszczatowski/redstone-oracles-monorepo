import { buildLiquidityDataFeedId } from "../../fetchers/liquidity/utils";
import { PricesWithLiquidity } from "./lwap-aggregator";
import { PriceDataBeforeAggregation, PriceSource } from "../../types";
import { SafeNumber } from "redstone-utils";

export const getTickLiquidities = (
  symbol: string,
  sourcesNames: PriceSource<SafeNumber.ISafeNumber>,
  possiblyDeviatedPrices: PriceDataBeforeAggregation[]
) => {
  const pricesWithLiquidity: PricesWithLiquidity[] = [];
  for (const [sourceName, price] of Object.entries(sourcesNames)) {
    const dataFeedId = buildLiquidityDataFeedId(symbol, sourceName);
    const liquidity = possiblyDeviatedPrices.find(
      (price) => price.symbol === dataFeedId
    );
    if (!liquidity) {
      throw new Error(
        `Cannot calculate LWAP, missing liquidity for ${dataFeedId}`
      );
    }
    const theOnlySourceValue = Object.values(liquidity.source)[0];
    pricesWithLiquidity.push({
      price,
      liquidity: SafeNumber.createSafeNumber(theOnlySourceValue),
    });
  }
  return pricesWithLiquidity;
};
