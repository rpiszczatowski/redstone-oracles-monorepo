import { range } from "../utils";
import fs from "fs";
import cliProgress from "cli-progress";
import { BalancerFetcher } from "../../src/fetchers/balancer/BalancerFetcher";

interface PriceWithBlockNumber {
  price: string;
  blockNumber: number;
}
const pools = [
  "0xd1ec5e215e8148d76f4460e4097fd3d5ae0a35580002000000000000000003d3",
  "0x76fcf0e8c7ff37a47a799fa2cd4c13cde0d981c90002000000000000000003d2",
];

const getHistoricalPrices = async (pool: string) => {
  let fetcher = new BalancerFetcher(pool);
  let prices: PriceWithBlockNumber[] = [];

  let filePrices = readPrices("chainlink-prices-3.json");

  let i = 0;

  while (i < filePrices.length) {
    let promises = range(BigInt(i), BigInt(i) + BigInt(100), BigInt(1)).map(
      (timestamp: any) => {
        return fetcher.fetchAll(
          ["OHM"],
          undefined,
          Number(timestamp.toString())
        );
      }
    );
    await Promise.all(promises)
      .then((results) => {
        results.forEach(({ result }: any) => {});
      })
      .catch(function (err) {
        console.error(err);
      });
    i += 100;
  }
  return prices;
};

const writeResults = (pool: string, results: any) => {
  console.log("Saving results to file");
  let json = JSON.stringify(results);
  fs.writeFile(`results-${pool}.json`, json, "utf8", () => {});
};
const readPrices = (file: string) => {
  console.log("Reading price file");
  return JSON.parse(fs.readFileSync(file, "utf-8"));
};

async function main() {
  for (const pool of pools) {
    const prices = await getHistoricalPrices(pool);
    writeResults(pool, prices);
  }
}
main();
