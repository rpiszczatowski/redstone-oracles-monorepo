import { ISafeNumber } from "../../numbers/ISafeNumber";
import { createSafeNumber } from "../../numbers/SafeNumberFactory";
import {
  Aggregator,
  PriceDataAfterAggregation,
  PriceDataBeforeAggregation,
  SanitizedPriceDataBeforeAggregation,
} from "../../types";
import { getTickLiquidities } from "./get-liquidities";

export interface PricesWithLiquidity {
  price: ISafeNumber;
  liquidity: ISafeNumber;
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
): ISafeNumber => {
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
): ISafeNumber => {
  const liquiditySum = calculateLiquiditySum(valuesWithLiquidity);
  let lwapValue = createSafeNumber(0);
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
    createSafeNumber(0)
  );
};

export default lwapAggregator;
