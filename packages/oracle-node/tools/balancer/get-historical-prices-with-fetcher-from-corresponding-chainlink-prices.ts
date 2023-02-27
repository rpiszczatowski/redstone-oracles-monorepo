import fs from "fs";
import { BalancerFetcherHistorical } from "../../src/fetchers/balancer/historical/BalancerFetcherHistorical";
import { saveJSON } from "../common/fs-utils";

const CHAINLINK_PRICES_FILE_PATH = "chainlink-prices.json";
const BATCH_SIZE = 100;

interface PriceWithBlockNumber {
  price: string;
  blockNumber: number;
}
const pools = [
  "0xd1ec5e215e8148d76f4460e4097fd3d5ae0a35580002000000000000000003d3",
  "0x76fcf0e8c7ff37a47a799fa2cd4c13cde0d981c90002000000000000000003d2",
];

const getHistoricalPrices = async (pool: string) => {
  let prices: PriceWithBlockNumber[] = [];

  let filePrices = readPrices(CHAINLINK_PRICES_FILE_PATH);

  let filePriceIterator = 0;

  while (filePriceIterator < filePrices.length) {
    let promises = [...Array(BATCH_SIZE).keys()].map((timestamp: number) => {
      let fetcher = new BalancerFetcherHistorical(pool, timestamp);

      return fetcher.fetchAll(["OHM"]);
    });
    await Promise.all(promises)
      .then((results) => {
        results.forEach(({ result }: any) => {});
      })
      .catch(function (err) {
        console.error(err);
      });
    filePriceIterator += 100;
  }
  return prices;
};

const readPrices = (file: string) => {
  console.log("Reading price file");
  return JSON.parse(fs.readFileSync(file, "utf-8"));
};

async function main() {
  for (const pool of pools) {
    const prices = await getHistoricalPrices(pool);
    saveJSON(prices, `prices-${pool}.json`);
  }
}
main();
