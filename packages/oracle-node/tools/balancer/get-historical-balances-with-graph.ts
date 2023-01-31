import { range } from "../utils";
import fs from "fs";
import graphProxy from "../../src/utils/graph-proxy";

interface PriceWithBlockNumber {
  price: string;
  blockNumber: number;
}
const pools = [
  "0xd1ec5e215e8148d76f4460e4097fd3d5ae0a35580002000000000000000003d3",
  "0x76fcf0e8c7ff37a47a799fa2cd4c13cde0d981c90002000000000000000003d2",
];
const url = "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2";

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

const getHistoricalPrices = async (pool: string) => {
  let prices: PriceWithBlockNumber[] = [];

  let filePrices = readPrices("chainlink-prices-with-block.json");

  let balancerPrices: any = [];

  let i = 0;
  while (i < filePrices.length - 100) {
    let promises = range(BigInt(i), BigInt(i) + BigInt(100), BigInt(1)).map(
      (index: any) => {
        return [
          graphProxy.executeQuery(
            url,
            getGraphQuery(
              pool,
              Number(filePrices[index].blockNumber.toString())
            )
          ),
          filePrices[index].blockNumber.toString(),
        ];
      }
    );
    await Promise.all(promises)
      .then((results) => {
        results.forEach((result) => {
          if (result[0].data.pool == null) {
          } else {
            let tokens = result[0].data.pool.tokens;
            let [token0, token1] = tokens;
            let totalLiquidity = result[0].data.pool.totalLiquidity;
            balancerPrices.push({
              token0: token0.balance,
              token1: token1.balance,
              totalLiquidity,
              blockNumber: result[1],
            });
          }
        });
      })
      .catch(function (err) {
        console.error(err);
      });
    i += 100;
    console.log(i / filePrices.length);
  }
  return balancerPrices;
};
const getGraphQuery = (poolId: string, blockNumber: number) => {
  return `{
    pool(
      id: "${poolId}"
      block: {number: ${blockNumber}}
    ) {
      id
      tokens {
        balance
      }
      totalLiquidity
    }
  }`;
};
const writeResults = (pool: string, results: any) => {
  console.log("Saving results to file");
  let json = JSON.stringify(results);
  fs.writeFile(`results-combined-${pool}.json`, json, "utf8", () => {});
};
const readPrices = (file: string) => {
  console.log("Reading price file");
  return JSON.parse(fs.readFileSync(file, "utf-8"));
};

async function main() {
  const prices = await getHistoricalPrices(pools[1]);
  writeResults(pools[1], prices);
  return;
  for (const pool of pools) {
    const prices = await getHistoricalPrices(pool);
    writeResults(pool, prices);
  }
}
main();
