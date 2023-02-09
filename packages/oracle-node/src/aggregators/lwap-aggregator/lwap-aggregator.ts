import {
  Aggregator,
  PriceDataAfterAggregation,
  PriceDataBeforeAggregation,
} from "../../types";
import { getTickLiquidities } from "./get-liquidities";

export interface PricesWithLiquidity {
  price: number;
  liquidity: number;
}

export const lwapAggregator: Aggregator = {
  getAggregatedValue(
    price: PriceDataBeforeAggregation
  ): PriceDataAfterAggregation {
    return {
      ...price,
      value: getLwapValue(price),
    };
  },
};

const getLwapValue = (price: PriceDataBeforeAggregation): number => {
  const { symbol, source } = price;
  const valuesWithLiquidity = getTickLiquidities(symbol, source);
  return calculateLwap(valuesWithLiquidity);
};

const calculateLwap = (valuesWithLiquidity: PricesWithLiquidity[]) => {
  const liquiditySum = calculateLiquiditySum(valuesWithLiquidity);
  let lwapValue = 0;
  for (const { price, liquidity } of valuesWithLiquidity) {
    validatePricesAndLiquidities(price, liquidity);
    const liquidityNormalized = liquidity / liquiditySum;
    lwapValue += price * liquidityNormalized;
  }
  return lwapValue;
};

const validatePricesAndLiquidities = (price: number, liquidity: number) => {
  if (isNaN(price)) {
    throw new Error("Cannot get LWAP value if price is NaN value");
  }
  if (isNaN(liquidity)) {
    throw new Error("Cannot get LWAP value if liquidity is NaN value");
  }
};

const calculateLiquiditySum = (valuesWithLiquidity: PricesWithLiquidity[]) => {
  return valuesWithLiquidity.reduce(
    (sum, { liquidity }) => (sum += liquidity),
    0
  );
};

export default lwapAggregator;
