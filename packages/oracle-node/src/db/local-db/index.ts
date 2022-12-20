import { AbstractBatchPutOperation, AbstractSublevel } from "abstract-level";
import { Level } from "level";
import { config } from "../../config";
import { PriceDataAfterAggregation } from "../../types";
import { roundTimestamp } from "../../utils/timestamps";

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

interface LastPrices {
  [symbol: string]: PriceValueInLocalDB;
}

let db: Level<string, string>;
let pricesSublevel: AbstractSublevel<
  Level<string, string>,
  string | Buffer | Uint8Array,
  string,
  PriceValueInLocalDB[]
>;

/* 
  In order to use any function from this module you need
  to run function setupLocalDb at least once before
*/
export const setupLocalDb = () => {
  db = new Level(config.levelDbLocation, DEFAULT_LEVEL_OPTS);
  pricesSublevel = db.sublevel<string, PriceValueInLocalDB[]>(
    PRICES_SUBLEVEL,
    DEFAULT_LEVEL_OPTS
  );
};

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

  const currentTimestamp = roundTimestamp(Date.now());

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

  // Saving last prices to local cache
  setLastPrices(prices);
};

/*
  These could be not the last prices but the one which was cached last.
  If two iterations will evaluate close to each other,
  these prices could be older than expected by one iteration.
*/
const lastPrices: LastPrices = {};

const setLastPrices = (prices: PriceDataAfterAggregation[]) => {
  for (const price of prices) {
    const { symbol, value, timestamp } = price;
    lastPrices[symbol] = { value, timestamp };
  }
};

export const getLastPrice = (symbol: string): PriceValueInLocalDB | undefined =>
  lastPrices[symbol];

export default {
  savePrices,
  getPrices,
  clearPricesSublevel,
  closeLocalLevelDB,
  getLastPrice,
};
