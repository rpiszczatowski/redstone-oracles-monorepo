import Database, { Database as DatabaseType } from "better-sqlite3";
import { config } from "../../config";
import { PriceDataAfterAggregation } from "../../types";

const PRICES_TABLE = "prices";

const CREATE_TABLE_STATEMENT = `CREATE TABLE IF NOT EXISTS ${PRICES_TABLE} (symbol TEXT, prices TEXT)`;

const CREATE_INDEX_STATEMENT = `CREATE UNIQUE INDEX IF NOT EXISTS idx_prices_symbol ON ${PRICES_TABLE} (symbol)`;

const getSelectBySymbolStatement = (symbols: string[]) =>
  `SELECT * FROM ${PRICES_TABLE} WHERE symbol in (${symbols
    .map(() => "?")
    .join(",")})`;

// This statement will update by symbol thanks to index created in CREATE_INDEX_STATEMENT
const UPDATE_PRICES_BY_SYMBOL = `REPLACE INTO ${PRICES_TABLE} VALUES ($symbol, $prices)`;

const DELETE_TABLE_STATEMENT = `DELETE FROM ${PRICES_TABLE}`;

interface RawPriceValueInLocalDB {
  symbol: string;
  prices: string;
}

type ReturnPricesFromDb = RawPriceValueInLocalDB[] | undefined;

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

let db: DatabaseType;

/* 
  In order to use any function from this module you need
  to run function setupLocalDb at least once before
*/
export const setupLocalDb = () => {
  db = new Database(config.sqliteDbName);
  const createTableStatement = db.prepare(CREATE_TABLE_STATEMENT);
  createTableStatement.run();
  const createIndexStatement = db.prepare(CREATE_INDEX_STATEMENT);
  createIndexStatement.run();
};

export const clearPricesTable = async () => {
  const clearTableStatement = db.prepare(DELETE_TABLE_STATEMENT);
  clearTableStatement.run();
};

export const closeLocalDB = () => {
  db.close();
};

export const getPrices = async (
  symbols: string[]
): Promise<PriceValuesInLocalDB> => {
  const statement = db.prepare(getSelectBySymbolStatement(symbols));

  const valuesForSymbols: ReturnPricesFromDb = statement.all(symbols);
  // Preparing a result object with values
  const resultValues: PriceValuesInLocalDB = {};
  for (let symbolIndex = 0; symbolIndex < symbols.length; symbolIndex++) {
    const symbol = symbols[symbolIndex];
    const valuesForSymbol = findValuesBySymbol(valuesForSymbols, symbol);
    const valuesForSymbolParsed = JSON.parse(valuesForSymbol);
    resultValues[symbol] = valuesForSymbolParsed;
  }
  return resultValues;
};

const findValuesBySymbol = (
  valuesForSymbols: ReturnPricesFromDb,
  symbol: string
) =>
  valuesForSymbols?.find((values) => values.symbol === symbol)?.prices ?? "[]";

export const savePrices = async (prices: PriceDataAfterAggregation[]) => {
  const pricesFromDB = await getPrices(prices.map((price) => price.symbol));
  const currentTimestamp = Date.now();

  const newPrices: { symbol: string; prices: string }[] = [];
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
    newPrices.push({
      symbol: price.symbol,
      prices: JSON.stringify([priceForSymbolToAdd, ...filteredPricesForSymbol]),
    });
  }

  // Executing batch insert
  const insert = db.prepare(UPDATE_PRICES_BY_SYMBOL);
  const insertMany = db.transaction(
    (prices: { symbol: string; prices: string }[]) => {
      for (const price of prices) {
        insert.run(price);
      }
    }
  );
  insertMany(newPrices);

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
  clearPricesTable,
  closeLocalDB,
  getLastPrice,
};
