import fs from "fs";
import graphProxy from "../../src/utils/graph-proxy";
import { saveJSON } from "../common/fs-utils";

const pools = [
  "0xd1ec5e215e8148d76f4460e4097fd3d5ae0a35580002000000000000000003d3",
  "0x76fcf0e8c7ff37a47a799fa2cd4c13cde0d981c90002000000000000000003d2",
];
const url = "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2";
const BATCH_SIZE = 100;

interface BalancerPrices {
  token0: number;
  token1: number;
  totalLiquidity: number;
  blockNumber: number;
}

Promise.all = function promiseAllIterative(values: any): any {
  return new Promise((resolve, reject) => {
    let results: any[] = [];
    let completed = 0;

    values.forEach((value: any[], index: number) => {
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
  const filePrices = readPrices("chainlink-prices-with-block.json");
  let balancerPrices: BalancerPrices[] = [];

  let priceIndex = 0;
  while (priceIndex < filePrices.length - BATCH_SIZE) {
    const promises = [...Array(BATCH_SIZE).keys()].map((index: number) => {
      return [
        graphProxy.executeQuery(
          url,
          getGraphQuery(pool, Number(filePrices[index].blockNumber.toString()))
        ),
        filePrices[index].blockNumber.toString(),
      ];
    });
    await Promise.all(promises)
      .then((results) => {
        results.forEach((result) => {
          if (result[0].data.pool == null) {
          } else {
            const tokens = result[0].data.pool.tokens;
            const [token0, token1] = tokens;
            const totalLiquidity = result[0].data.pool.totalLiquidity;
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
    priceIndex += BATCH_SIZE;
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
const readPrices = (file: string) => {
  console.log("Reading price file");
  return JSON.parse(fs.readFileSync(file, "utf-8"));
};

async function main() {
  const prices = await getHistoricalPrices(pools[1]);
  saveJSON(prices, `results-${pools[1]}.json`);
}
main();
