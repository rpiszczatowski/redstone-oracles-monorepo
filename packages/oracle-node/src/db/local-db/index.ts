import { AbstractBatchPutOperation } from "abstract-level";
import { Level } from "level";
import { config } from "../../config";
import { PriceDataAfterAggregation } from "../../types";

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

const db = new Level(config.levelDbLocation, DEFAULT_LEVEL_OPTS);
const pricesSublevel = db.sublevel<string, PriceValueInLocalDB[]>(
  PRICES_SUBLEVEL,
  DEFAULT_LEVEL_OPTS
);

export const clearPricesSublevel = async () => {
  await pricesSublevel.clear();
};

export const closeLocalLevelDB = async () => {
  await pricesSublevel.close();
  await db.close();
};

export const getPrices = async (
  symbols: string[]
): Promise<PriceValuesInLocalDB> => {
  const valuesForSymbols = await pricesSublevel.getMany(symbols);

  // Preparing a result object with values
  const resultValues: PriceValuesInLocalDB = {};
  for (let symbolIndex = 0; symbolIndex < symbols.length; symbolIndex++) {
    const symbol = symbols[symbolIndex];
    const valuesForSymbol = valuesForSymbols[symbolIndex];
    resultValues[symbol] = valuesForSymbol || [];
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

  const currentTimestamp = Date.now();

  for (const price of prices) {
    const priceForSymbolToAdd: PriceValueInLocalDB = {
      value: price.value,
      timestamp: price.timestamp,
    };

    const filteredPricesForSymbol = pricesFromDB[price.symbol].filter(
      (p) =>
        p.timestamp >
        currentTimestamp - config.ttlForPricesInLocalDBInMilliseconds
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
  closeLocalLevelDB,
};
