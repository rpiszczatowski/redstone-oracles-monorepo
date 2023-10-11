import { AbstractBatchPutOperation, AbstractSublevel } from "abstract-level";
import { Level } from "level";
import { config } from "../../config";
import { PriceDataAfterAggregation } from "../../types";

const PRICES_SUBLEVEL = "prices";
const DEFAULT_LEVEL_OPTS = {
  keyEncoding: "utf8",
  valueEncoding: "json",
};

// 3 minutes
const MAX_PRICE_IN_DB_TIME_DIFF = 1000 * 60 * 3;

export interface PriceValueInLocalDB {
  timestamp: number;
  value: string;
}

export type PriceValuesInLocalDB = {
  [token in string]?: PriceValueInLocalDB[];
};

type LastPrices = {
  [token in string]?: PriceValueInLocalDB;
};

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
    const valuesForSymbol = valuesForSymbols[symbolIndex] as
      | PriceValueInLocalDB[]
      | undefined;
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
      value: price.value.toString(),
      timestamp: price.timestamp,
    };

    const filteredPricesForSymbol = pricesFromDB[price.symbol]!.filter(
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
    lastPrices[symbol] = { value: value.toString(), timestamp };
  }
};

type PriceValueInLocalDBAsNumber =
  | {
      timestamp: number;
      value: number;
    }
  | undefined;

export const getLastPrice = (
  symbol: string
): PriceValueInLocalDBAsNumber | undefined => {
  const price = getRawPrice(symbol);
  if (!price) {
    return undefined;
  }
  return {
    value: Number(price.value),
    timestamp: price.timestamp,
  };
};

export const getLastPriceOrFail = (symbol: string) => {
  const lastPrice = getLastPrice(symbol);

  if (!lastPrice) {
    throw new Error(`Missing price for ${symbol} in local DB`);
  }

  return lastPrice;
};

export const getRawPriceOrFail = (symbol: string) => {
  const lastPrice = getRawPrice(symbol);

  if (!lastPrice) {
    throw new Error(`Missing price for ${symbol} in local DB`);
  }

  return lastPrice;
};

export const clearLastPricesCache = () => {
  for (const symbol of Object.keys(lastPrices)) {
    delete lastPrices[symbol];
  }
};

export const getRawPriceNotOlderThan = (
  symbol: string,
  acceptablePriceAge: number
): PriceValueInLocalDB | undefined => {
  const currentTimestamp = Date.now();
  const lastPrice = lastPrices[symbol];

  if (lastPrice) {
    const timeDiff = currentTimestamp - lastPrice.timestamp;
    if (timeDiff >= acceptablePriceAge) {
      throw new Error(
        `Last price in local DB for ${symbol} is obsolete, time diff ${timeDiff}, acceptable time diff ${acceptablePriceAge}`
      );
    }
    return lastPrice;
  }
  return undefined;
};

export const getRawPrice = (symbol: string) =>
  getRawPriceNotOlderThan(symbol, MAX_PRICE_IN_DB_TIME_DIFF);
