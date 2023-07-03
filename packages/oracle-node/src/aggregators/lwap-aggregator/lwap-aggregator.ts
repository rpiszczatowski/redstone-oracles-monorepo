import { SafeNumber } from "redstone-utils";
import {
  Aggregator,
  PriceDataAfterAggregation,
  PriceDataBeforeAggregation,
  SanitizedPriceDataBeforeAggregation,
} from "../../types";
import { getTickLiquidities } from "./get-liquidities";

export interface PricesWithLiquidity {
  price: SafeNumber.ISafeNumber;
  liquidity: SafeNumber.ISafeNumber;
}

export const lwapAggregator: Aggregator = {
  getAggregatedValue(
    price: SanitizedPriceDataBeforeAggregation,
    allPrices?: PriceDataBeforeAggregation[]
  ): PriceDataAfterAggregation {
    return {
      ...price,
      value: getLwapValue(price, allPrices),
    };
  },
};

const getLwapValue = (
  price: SanitizedPriceDataBeforeAggregation,
  allPrices?: PriceDataBeforeAggregation[]
): SafeNumber.ISafeNumber => {
  if (!allPrices) {
    throw new Error(
      `Cannot calculate LWAP, missing all prices for ${price.symbol}`
    );
  }
  const { symbol, source } = price;
  const valuesWithLiquidity = getTickLiquidities(symbol, source, allPrices);
  return calculateLwap(valuesWithLiquidity);
};

const calculateLwap = (
  valuesWithLiquidity: PricesWithLiquidity[]
): SafeNumber.ISafeNumber => {
  const liquiditySum = calculateLiquiditySum(valuesWithLiquidity);
  let lwapValue = SafeNumber.createSafeNumber(0);
  for (const { price, liquidity } of valuesWithLiquidity) {
    const liquidityNormalized = liquidity.div(liquiditySum);
    const amount = price.mul(liquidityNormalized);
    lwapValue = lwapValue.add(amount);
  }
  return lwapValue;
};

const calculateLiquiditySum = (valuesWithLiquidity: PricesWithLiquidity[]) => {
  return valuesWithLiquidity.reduce(
    (sum, { liquidity }) => sum.add(liquidity),
    SafeNumber.createSafeNumber(0)
  );
};

export default lwapAggregator;
