import fetchers from "../../src/fetchers";
import { saveJSON } from "../common/fs-utils";
import { sleep } from "../common/sleep";

// USAGE: yarn run-ts tools/ohm/test-ohm-fetching.ts

type PriceFromIteration = any;

const ITERATIONS_COUNT = 7;
const SLEEP_BETWEEN_ITERATIONS_MILLISECONDS = 10000;
const OUTPUT_FILE = "./ohm-fetching-report.json";
const TRADE_SYMBOLS = [
  "OHM_BUY_1K",
  "OHM_SELL_1K",
  "OHM_BUY_10K",
  "OHM_SELL_10K",
  "OHM_BUY_100K",
  "OHM_SELL_100K",
];
const TRADE_FETCHERS = ["zero-ex", "one-inch"];
const STANDARD_FETCHERS = ["coingecko"];

main();

async function main() {
  const resultPrices: PriceFromIteration[] = [];
  for (
    let iterationIndex = 0;
    iterationIndex < ITERATIONS_COUNT;
    iterationIndex++
  ) {
    console.log(`\nRunning iteration: ${iterationIndex + 1}`);
    const pricesFromIteration = await getPricesFromDifferentSources();
    resultPrices.push(pricesFromIteration);
    console.log(`Iteration completed. Waiting...`);
    await sleep(SLEEP_BETWEEN_ITERATIONS_MILLISECONDS);
  }

  saveJSON(resultPrices, OUTPUT_FILE);
}

async function getPricesFromDifferentSources() {
  const pricesFromIteration: PriceFromIteration = {
    timestamp: Date.now(),
  };

  const promises: Promise<void>[] = [];

  // Prepare fetching from standard fetchers
  for (const fetcherName of STANDARD_FETCHERS) {
    const fetcher = fetchers[fetcherName];
    const promise = fetcher.fetchAll(["OHM"]).then((prices) => {
      console.log(`Fetched data from ${fetcherName}`);
      pricesFromIteration[fetcherName] = prices[0].value;
    });
    promises.push(promise);
  }

  // Prepare fetching from trade fetchers
  for (const tradeFetcherName of TRADE_FETCHERS) {
    const fetcher = fetchers[tradeFetcherName];
    for (const tradeSymbol of TRADE_SYMBOLS) {
      const fetcherNameForReport = `${tradeFetcherName}_${tradeSymbol}`
        .toLowerCase()
        .replace(/\_/, "-");
      const promise = fetcher.fetchAll([tradeSymbol]).then((prices) => {
        console.log(`Fetched data for ${fetcherNameForReport}`);
        pricesFromIteration[fetcherNameForReport] = prices[0].value;
      });
      promises.push(promise);
    }
  }

  // Waiting for all promises
  await Promise.all(promises);

  return pricesFromIteration;
}
