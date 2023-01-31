import { range } from "../utils";
import fs from "fs";
import { UniswapV3FetcherHistorical } from "../../src/fetchers/uniswap-v3/historical/UniswapV3FetcherHistorical";

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
  let allPrices = readPrices("final_prices_array.json");
  let fetchedPrices = readPrices("uniswap-prices.json");

  let allTimestamps = new Set();

  for (const price of allPrices) {
    allTimestamps.add(price.timestamp);
  }

  let fetchedTimestamps = new Set();
  for (const price of fetchedPrices) {
    fetchedTimestamps.add(price.timestamp);
  }

  const pricesToFetch: number[] = [...allTimestamps].filter(
    (x) => !fetchedTimestamps.has(x)
  ) as any;

  let i = Math.floor(0.9 * pricesToFetch.length);

  let prices: PriceWithTimestamp[] = [];

  for (const price of fetchedPrices) {
    prices.push({
      timestamp: price.timestamp,
      uniswapPrice: price.uniswapPrice,
    });
  }

  console.log(pricesToFetch.length);

  while (i / pricesToFetch.length < 0.98) {
    let promises = range(BigInt(i), BigInt(i) + BigInt(100), BigInt(1)).map(
      (index: any) => {
        let fetcher = new UniswapV3FetcherHistorical(pricesToFetch[index]);
        return [fetcher.fetchAll(["OHM"]), pricesToFetch[index]];
      }
    );
    await Promise.all(promises)
      .then((results) => {
        results.forEach((result) => {
          if (result[0][0].value != null) {
            const price = {
              uniswapPrice: result[0][0].value,
              timestamp: result[1],
            };
            prices.push(price);
          }
        });
      })
      .catch(function (err) {
        console.error(err);
      });
    i += 100;
    console.log(i / pricesToFetch.length);
  }
  return prices;
};

const writeResults = (results: any) => {
  console.log("Saving results to file");
  let json = JSON.stringify(results);
  fs.writeFile(`uniswap-prices.json`, json, "utf8", () => {});
};
const readPrices = (file: string) => {
  console.log("Reading price file");
  return JSON.parse(fs.readFileSync(file, "utf-8"));
};

async function main() {
  const result = await getHistoricalPrices();
  writeResults(result);
}
main();
