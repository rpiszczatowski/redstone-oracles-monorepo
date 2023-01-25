import { LiquiditiesPerSourceAndToken } from "./fetch-liquidity-for-data-feeds";
import {
  Aggregator,
  PriceDataAfterAggregation,
  PriceDataBeforeAggregation,
} from "../../types";

export const dexs = [
  "uniswap",
  "sushiswap",
  "trader-joe",
  "pangolin-wavax",
  "pangolin-usdc",
];

interface ValueWithLiquidity {
  value: number;
  liquidity: number;
}

export const lwapAggregator: Aggregator = {
  getAggregatedValue(
    price: PriceDataBeforeAggregation,
    liquidityPerSourceAndToken?: LiquiditiesPerSourceAndToken
  ): PriceDataAfterAggregation {
    return {
      ...price,
      value: getLwapValue(price, liquidityPerSourceAndToken),
    };
  },
};

const getLwapValue = (
  price: PriceDataBeforeAggregation,
  liquidityPerSourceAndToken?: LiquiditiesPerSourceAndToken
): number => {
  const sources = Object.entries(price.source);
  const dexsSources = sources.filter(([sourceName]) =>
    dexs.includes(sourceName)
  );
  validateDexsSources(dexsSources);
  if (dexsSources.length === 1) {
    const valueFromTheOnlySource = dexsSources[0][1];
    return valueFromTheOnlySource;
  }
  const dataFeedId = price.symbol;
  const valuesWithLiquidity = getDexsSourcesWithLiquidity(
    dexsSources,
    dataFeedId,
    liquidityPerSourceAndToken
  );
  return calculateLwap(valuesWithLiquidity);
};

const validateDexsSources = (dexsSources: [string, any][]) => {
  if (dexsSources.length === 0) {
    throw new Error("Cannot get LWAP value from empty array of values");
  }
  const dexsSourcesAsObject = Object.fromEntries(dexsSources);
  const isAnyValueNaN = Object.values(dexsSourcesAsObject).some(isNaN);
  if (isAnyValueNaN) {
    throw new Error(
      "Cannot get LWAP value of an array that contains NaN value"
    );
  }
};

const getDexsSourcesWithLiquidity = (
  dexsSources: [string, any][],
  dataFeedId: string,
  liquidityPerSourceAndToken?: LiquiditiesPerSourceAndToken
) => {
  const valuesWithLiquidity: ValueWithLiquidity[] = [];
  for (const [sourceName, value] of dexsSources) {
    const liquidity = getLiquidity(
      sourceName,
      dataFeedId,
      liquidityPerSourceAndToken
    );
    valuesWithLiquidity.push({
      value,
      liquidity,
    });
  }
  return valuesWithLiquidity;
};

const calculateLwap = (valuesWithLiquidity: ValueWithLiquidity[]) => {
  const liquiditySum = calculateLiquiditySum(valuesWithLiquidity);
  let lwapValue = 0;
  for (const { value, liquidity } of valuesWithLiquidity) {
    const liquidityNormalized = liquidity / liquiditySum;
    lwapValue += value * liquidityNormalized;
  }
  return lwapValue;
};

const calculateLiquiditySum = (valuesWithLiquidity: ValueWithLiquidity[]) => {
  return valuesWithLiquidity.reduce(
    (sum, { liquidity }) => (sum += liquidity),
    0
  );
};

const getLiquidity = (
  sourceName: string,
  dataFeedId: string,
  liquidityPerSourceAndToken?: LiquiditiesPerSourceAndToken
) => {
  if (!liquidityPerSourceAndToken) {
    throw new Error("Missing liquidation per source and token");
  }
  return liquidityPerSourceAndToken[sourceName][dataFeedId];
};

export default lwapAggregator;
