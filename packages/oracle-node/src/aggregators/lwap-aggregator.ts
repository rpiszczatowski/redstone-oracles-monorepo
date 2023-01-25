import fetchers from "../fetchers";
import { DexFetcher } from "../fetchers/DexFetcher";
import {
  Aggregator,
  PriceDataAfterAggregation,
  PriceDataBeforeAggregation,
} from "../types";

interface ValueWithLiquidity {
  value: number;
  liquidity: number;
}

const dexs = [
  "uniswap",
  "sushiswap",
  "trader-joe",
  "pangolin-wavax",
  "pangolin-usdc",
];

export const lwapAggregator: Aggregator = {
  async getAggregatedValue(
    price: PriceDataBeforeAggregation
  ): Promise<PriceDataAfterAggregation> {
    return {
      ...price,
      value: await getLwapValue(price),
    };
  },
};

const getLwapValue = async (
  price: PriceDataBeforeAggregation
): Promise<number> => {
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
  const valuesWithLiquidity = await getDexsSourcesWithLiquidity(
    dexsSources,
    dataFeedId
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

const getDexsSourcesWithLiquidity = async (
  dexsSources: [string, any][],
  dataFeedId: string
) => {
  const valuesWithLiquidity: ValueWithLiquidity[] = [];
  for (const [sourceName, value] of dexsSources) {
    const liquidity = await getLiquidity(sourceName, dataFeedId);
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

const getLiquidity = async (sourceName: string, dataFeedId: string) => {
  const fetcher = fetchers[sourceName] as DexFetcher;
  return await fetcher.getLiquidityForPair(dataFeedId);
};

export default lwapAggregator;
