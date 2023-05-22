import { range } from "../utils";
import fs from "fs";
import redstone from "redstone-api";

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

const getHistoricalPrices = async (symbol: string) => {
  let filePrices = readPrices("chainlink-prices-with-block.json");

  let redstonePrices: any = [];

  let i = Math.floor(filePrices.length * 0.8);

  while (i < filePrices.length - 101) {
    let promises = range(BigInt(i), BigInt(i) + BigInt(100), BigInt(1)).map(
      (index: any) => {
        return [
          redstone.getHistoricalPrice(`${symbol}`, {
            date: new Date(filePrices[index].timestamp * 1000),
          }),
          filePrices[index].timestamp,
        ];
      }
    );
    await Promise.all(promises)
      .then((results) => {
        results.forEach((result) => {
          redstonePrices.push({ price: result[0].value, timestamp: result[1] });
        });
      })
      .catch(function (err) {
        console.error(err);
      });
    i += 100;
    console.log(i / filePrices.length);
  }
  return redstonePrices;
};

const writeResults = (symbol: string, results: any) => {
  console.log("Saving results to file");
  let json = JSON.stringify(results);
  fs.writeFile(`redstone-prices-${symbol}-part1.json`, json, "utf8", () => {});
};
const readPrices = (file: string) => {
  console.log("Reading price file");
  return JSON.parse(fs.readFileSync(file, "utf-8"));
};

async function main() {
  const prices = await getHistoricalPrices("ETH");
  writeResults("ETH", prices);
}
main();
