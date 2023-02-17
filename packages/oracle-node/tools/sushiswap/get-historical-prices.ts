import fs from "fs";
import { SushiswapFetcherHistorical } from "../../src/fetchers/sushiswap/historical/SushiswapFetcherHistorical";
import { saveJSON } from "../common/fs-utils";

const PROMISE_BATCH_SIZE = 100;
const SUSHISWAP_PRICES_FILEPATH = "sushiswap-prices.json";

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

  while (i < pricesToFetch.length - PROMISE_BATCH_SIZE + 1) {
    let promises = [...Array(PROMISE_BATCH_SIZE).keys()].map(
      (index: number) => {
        let fetcher = new SushiswapFetcherHistorical(pricesToFetch[index]);
        return [fetcher.fetchAll(["OHM"]), pricesToFetch[index]];
      }
    );

    const results = await Promise.all(promises);

    results.forEach((result: any) => {
      if (result[0][0].value != null) {
        const price = {
          sushiswapPrice: result[0][0].value,
          blockNumber: result[1],
        };
        prices.push(price);
      }
    });
    i += PROMISE_BATCH_SIZE;
    console.log(i / pricesToFetch.length);
  }
  return prices;
};

const readPrices = (file: string) => {
  console.log("Reading price file");
  return JSON.parse(fs.readFileSync(file, "utf-8"));
};

async function main() {
  const result = await getHistoricalPrices();
  saveJSON(result, SUSHISWAP_PRICES_FILEPATH);
}
main();
