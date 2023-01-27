import {
  Aggregator,
  PriceDataAfterAggregation,
  PriceDataBeforeAggregation,
  Source,
} from "../types";

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
    liquidities?: PriceDataBeforeAggregation[]
  ): PriceDataAfterAggregation {
    return {
      ...price,
      value: getLwapValue(price, liquidities),
    };
  },
};

const getLwapValue = (
  price: PriceDataBeforeAggregation,
  liquidities?: PriceDataBeforeAggregation[]
): number => {
  const sources = Object.entries(price.source);
  const dexsSources = sources.filter(([sourceName]) =>
    dexs.includes(sourceName)
  );
  validateInputs(dexsSources, liquidities);
  if (dexsSources.length === 1) {
    const valueFromTheOnlySource = dexsSources[0][1];
    return valueFromTheOnlySource;
  }
  const valuesWithLiquidity = getDexsSourcesWithLiquidity(
    dexsSources,
    liquidities!,
    price.symbol
  );
  return calculateLwap(valuesWithLiquidity);
};

const validateInputs = (dexsSources: [string, any][], liquidities?: Source) => {
  if (!liquidities) {
    throw new Error("Cannot get LWAP value liquidities are missing");
  }
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
  liquidities: PriceDataBeforeAggregation[],
  dataFeedId: string
) => {
  const valuesWithLiquidity: ValueWithLiquidity[] = [];
  for (const [sourceName, value] of dexsSources) {
    const liquidityForSource = liquidities.find(
      (liquidity) => Object.keys(liquidity.source)[0] === sourceName
    );
    if (!liquidityForSource) {
      throw new Error(
        `Cannot get LWAP value, liquidity for ${dataFeedId} from ${sourceName} is missing`
      );
    }
    const liquidity = Object.values(liquidityForSource.source)[0];
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

export default lwapAggregator;
