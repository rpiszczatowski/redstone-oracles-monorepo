import fs from "fs";
import { UniswapV3FetcherHistorical } from "../../src/fetchers/uniswap-v3/historical/UniswapV3FetcherHistorical";
import { saveJSON } from "../common/fs-utils";

const UNISWAP_PRICES_FILEPATH = "uniswap-prices.json";
const TIMESTAMPS_TO_FETCH_FILEPATH = "timestamps-to-fetch.json";
const PROMISE_BATCH_SIZE = 100;

Promise.all = function promiseAllIterative(values: any): any {
  return new Promise((resolve, reject) => {
    let results: any[] = [];
    let completed = 0;

    values.forEach((value: any, index: any) => {
      Promise.resolve(value[0])
        .then((result) => {
          results[index] = [result, value[1]];
          completed += 1;
          if (completed == values.length) {
            resolve(results);
          }
        })
        .catch((err) => reject(err));
    });
  });
};

interface PriceWithTimestamp {
  timestamp: number;
  uniswapPrice: number;
}

const getHistoricalPrices = async () => {
  const timestampsToFetch = readPrices(TIMESTAMPS_TO_FETCH_FILEPATH);
  const fetchedPrices = readPrices(UNISWAP_PRICES_FILEPATH);

  const allTimestamps = new Set();

  for (const price of timestampsToFetch) {
    allTimestamps.add(price.timestamp);
  }

  const fetchedTimestamps = new Set();
  for (const price of fetchedPrices) {
    fetchedTimestamps.add(price.timestamp);
  }

  const pricesToFetch: number[] = [...allTimestamps].filter(
    (x) => !fetchedTimestamps.has(x)
  ) as any;

  let priceIterator;

  let prices: PriceWithTimestamp[] = [];

  for (const price of fetchedPrices) {
    prices.push({
      timestamp: price.timestamp,
      uniswapPrice: price.uniswapPrice,
    });
  }

  while (priceIterator < pricesToFetch.length - PROMISE_BATCH_SIZE + 1) {
    let promises = [...Array(PROMISE_BATCH_SIZE).keys()].map((index: any) => {
      let fetcher = new UniswapV3FetcherHistorical(pricesToFetch[index]);
      return [fetcher.fetchAll(["OHM"]), pricesToFetch[index]];
    });
    await Promise.all(promises)
      .then((results) => {
        results.forEach((result) => {
          if (result[0][0].value != null) {
            const price = {
              uniswapPrice: result[0][0].value,
              timestamp: Number(result[1].toString()),
            };
            prices.push(price);
          }
        });
      })
      .catch(function (err) {
        console.error(err);
      });
    priceIterator += 100;
    console.log(priceIterator / pricesToFetch.length);
  }
  return prices;
};

const readPrices = (file: string) => {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
};

async function main() {
  const prices = await getHistoricalPrices();
  saveJSON(prices, UNISWAP_PRICES_FILEPATH);
}

main();
