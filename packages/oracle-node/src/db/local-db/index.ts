import { open, Database } from "lmdb";
import { config } from "../../config";
import { PriceDataAfterAggregation } from "../../types";

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

interface PricesToPutInDb {
  symbol: string;
  prices: PriceValueInLocalDB[];
}

let db: Database<PriceValueInLocalDB[], string>;

/* 
  In order to use any function from this module you need
  to run function setupLocalDb at least once before
*/
export const setupLocalDb = () => {
  db = open({
    path: config.levelDbLocation,
  });
};

export const clearLocalDb = () => {
  db.clearSync();
};

export const closeLocalDB = async () => {
  await db.close();
};

export const getPrices = async (
  symbols: string[]
): Promise<PriceValuesInLocalDB> => {
  const valuesForSymbols = await db.getMany(symbols);
  console.log({ valuesForSymbols });
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
  const currentTimestamp = Date.now();

  const pricesToPutInDb: PricesToPutInDb[] = [];
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

    pricesToPutInDb.push({
      symbol: price.symbol,
      prices: [priceForSymbolToAdd, ...filteredPricesForSymbol],
    });
  }

  // Executing batch action
  db.transaction(() => {
    // pricesToPutInDb.map((price) => db.put(price.symbol, price.prices));
    db.put(pricesToPutInDb[0].symbol, pricesToPutInDb[0].prices);
  });

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
  clearLocalDb,
  closeLocalDB,
  getLastPrice,
};
