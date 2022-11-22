import { AbstractBatchPutOperation } from "abstract-level";
import { Level } from "level";
import { config } from "../../config";
import { PriceDataAfterAggregation } from "../../types";

const PRICES_TTL_MILLISECONDS = 15 * 60 * 1000; // 15 minutes
const PRICES_SUBLEVEL = "prices";
const DEFAULT_LEVEL_OPTS = {
  keyEncoding: "utf8",
  valueEncoding: "json",
};

export interface PriceValueInLocalDB {
  timestamp: number;
  value: number;
}

export interface PriceValuesInLocalDB {
  [symbol: string]: PriceValueInLocalDB[];
}

const db = new Level<string, PriceValueInLocalDB[]>(
  config.levelDbLocation,
  DEFAULT_LEVEL_OPTS
);
const pricesSublevel = db;

// const pricesSublevel = db.sublevel<string, PriceValueInLocalDB[]>(
//   PRICES_SUBLEVEL,
//   DEFAULT_LEVEL_OPTS
// );

export const clearPricesSublevel = async () => {
  await pricesSublevel.clear();
};

export const closePricesSublevel = async () => {
  await pricesSublevel.close();
};

export const getPrices = async (
  symbols: string[]
): Promise<PriceValuesInLocalDB> => {
  const valuesArr = await pricesSublevel.getMany(symbols);

  // Preparing a result object with values
  const resultValues: PriceValuesInLocalDB = {};
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    const value = valuesArr[i];
    resultValues[symbol] = value || [];
  }

  return resultValues;
};

export const savePrices = async (prices: PriceDataAfterAggregation[]) => {
  const pricesFromDB = await getPrices(prices.map((p) => p.symbol));

  // Building opeartions array
  const operations: AbstractBatchPutOperation<
    typeof pricesSublevel,
    string,
    PriceValueInLocalDB[]
  >[] = [];

  for (const price of prices) {
    const priceForSymbolToAdd: PriceValueInLocalDB = {
      value: price.value,
      timestamp: price.timestamp,
    };

    const currentTimestamp = Date.now();
    const filteredPricesForSymbol = pricesFromDB[price.symbol].filter(
      (p) => p.timestamp > currentTimestamp - PRICES_TTL_MILLISECONDS
    );

    operations.push({
      type: "put",
      key: price.symbol,
      value: [priceForSymbolToAdd, ...filteredPricesForSymbol],
    });
  }

  // Executing batch action
  await pricesSublevel.batch(operations);
};

export default {
  savePrices,
  getPrices,
  clearPricesSublevel,
  closePricesSublevel,
};
