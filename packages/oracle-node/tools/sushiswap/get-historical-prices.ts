import { range } from "../utils";
import fs from "fs";
import { SushiswapFetcherHistorical } from "../../src/fetchers/sushiswap/historical/SushiswapFetcherHistorical";

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

interface PriceWithBlockNumber {
  blockNumber: number;
  sushiswapPrice: number;
}

const getHistoricalPrices = async () => {
  let allPrices = readPrices("final_prices_array.json");
  let fetchedPrices = readPrices("sushiswap-prices-weth.json");

  let allBlockNumbers = new Set();

  for (const price of allPrices) {
    allBlockNumbers.add(parseInt(price.blockNumber));
  }

  let fetchedBlockNumbers = new Set();
  for (const price of fetchedPrices) {
    fetchedBlockNumbers.add(parseInt(price.blockNumber));
  }

  const pricesToFetch: number[] = [...allBlockNumbers].filter(
    (x) => !fetchedBlockNumbers.has(x)
  ) as any;

  let i = Math.floor(0 * pricesToFetch.length);

  let prices: PriceWithBlockNumber[] = [];

  for (const price of fetchedPrices) {
    prices.push({
      blockNumber: price.blockNumber,
      sushiswapPrice: price.sushiswapPrice,
    });
  }

  console.log(pricesToFetch.length);

  while (i < pricesToFetch.length - 101) {
    let promises = range(BigInt(i), BigInt(i) + BigInt(100), BigInt(1)).map(
      (index: any) => {
        let fetcher = new SushiswapFetcherHistorical(pricesToFetch[index]);
        return [fetcher.fetchAll(["OHM"]), pricesToFetch[index]];
      }
    );
    await Promise.all(promises)
      .then((results) => {
        results.forEach((result) => {
          if (result[0][0].value != null) {
            const price = {
              sushiswapPrice: result[0][0].value,
              blockNumber: result[1],
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
  fs.writeFile(`sushiswap-prices-weth.json`, json, "utf8", () => {});
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
