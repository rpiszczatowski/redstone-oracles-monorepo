import { exec } from "node:child_process";
import fs from "fs";
import readline from "readline";

/*
  To run this script you need to add to .env file:
  MOCK_PRICES_URL_OR_PATH = ./src/fetchers/mock-fetcher/deviation-test-response.json
  OVERRIDE_MANIFEST_USING_FILE=./manifests/dev/avalanche-mock.json
*/

const pathToDeviationTestResponse =
  "./src/fetchers/mock-fetcher/deviation-test-response.json";

const pathToNodeOutput = "./tmp.out";

const textToFind = "Cannot get median value of an empty array for";

const defaultResponse = {
  BTC: 16800,
  ETH: 1200,
  UNI: 5.3,
  USDT: 1,
  AVAX: 11.82,
  __DEFAULT__: 42,
};

const sleep = (timeInMilliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, timeInMilliseconds));

const searchTextInStream = (
  filePath: string,
  text: string
): Promise<string[]> => {
  return new Promise((resolve) => {
    const inStream = fs.createReadStream(filePath);
    const rl = readline.createInterface(inStream);
    const result: string[] = [];
    const regEx = new RegExp(text, "i");
    rl.on("line", (line) => {
      if (line && line.search(regEx) >= 0) {
        result.push(line);
      }
    });
    rl.on("close", () => {
      resolve(result);
    });
  });
};

const checkForNotDeliveredTokensErrors = async () => {
  const result = await searchTextInStream(pathToNodeOutput, textToFind);
  console.log(
    `Number of not delivered tokens errors found: ${result.length / 2}\n`
  );
};

(async () => {
  console.log("Staring node in background");
  fs.writeFileSync(
    pathToDeviationTestResponse,
    JSON.stringify(defaultResponse)
  );
  exec("yarn start:dev", (error: any) => {
    console.log(error);
  });
  console.log("Waiting 30s for node to start operate");
  await sleep(30 * 1000);
  console.log("Checking for not delivered tokens errors, should be zero");
  await checkForNotDeliveredTokensErrors();

  console.log("Updating mock value of AVAX slightly, should not be new errors");
  fs.writeFileSync(
    pathToDeviationTestResponse,
    JSON.stringify({ ...defaultResponse, AVAX: 12 })
  );
  console.log("Waiting 30s for new mock value to propagate");
  await sleep(30 * 1000);
  console.log("Checking for not delivered tokens errors, should be zero");
  await checkForNotDeliveredTokensErrors();

  console.log(
    "Updating mock value of AVAX significantly, should be new errors"
  );
  fs.writeFileSync(
    pathToDeviationTestResponse,
    JSON.stringify({ ...defaultResponse, AVAX: 1 })
  );
  console.log("Waiting 30s for new mock value to propagate");
  await sleep(30 * 1000);
  console.log(
    "Checking for not delivered tokens errors, should be bigger than zero"
  );
  await checkForNotDeliveredTokensErrors();

  console.log("Waiting 10m for new mock value to become new normal");
  await sleep(10 * 60 * 1000);
  console.log("Cleaning node output");
  fs.writeFileSync(pathToNodeOutput, "");
  console.log("Waiting 30s for new output content");
  await sleep(30 * 1000);
  console.log("Checking for not delivered tokens errors, should be zero");
  await checkForNotDeliveredTokensErrors();

  console.log(
    "Updating mock value of many tokens significantly, should be new errors"
  );
  // We need to leave AVAX = 1 because of creating this value new normal value in previous step
  fs.writeFileSync(
    pathToDeviationTestResponse,
    JSON.stringify({ ...defaultResponse, __DEFAULT__: 5, AVAX: 1 })
  );
  console.log("Waiting 30s for new mock values to propagate");
  await sleep(30 * 1000);
  console.log(
    "Checking for not delivered tokens errors, should be bigger than zero"
  );
  await checkForNotDeliveredTokensErrors();

  console.log(
    "Updating mock value of many tokens to previous ones, should not be errors"
  );
  // We need to leave AVAX = 1 because of creating this value new normal value in previous step
  fs.writeFileSync(
    pathToDeviationTestResponse,
    JSON.stringify({ ...defaultResponse, AVAX: 1 })
  );
  console.log(
    "Waiting 10s to be sure that iteration with changed values ended"
  );
  await sleep(10 * 1000);
  console.log("Cleaning node output");
  fs.writeFileSync(pathToNodeOutput, "");
  console.log("Waiting 30s for new output content");
  await sleep(30 * 1000);
  console.log("Checking for not delivered tokens errors, should be zero");
  await checkForNotDeliveredTokensErrors();

  console.log("Test ended, please kill this process with CTRL + C");
})();
