import { exec } from "node:child_process";
import fs from "fs";
import readline from "readline";

/*
  To run this script you need to add to .env file:
  MOCK_PRICES_URL_OR_PATH = ./src/fetchers/mock-fetcher/deviation-test-response.json
  OVERRIDE_MANIFEST_USING_FILE=./manifests/single-source/mock.json
*/

const pathToNodeOutput = "./tmp.out";

const textToFind = "Cannot get median value of an empty array for";

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
  exec("yarn start:dev", (error: any) => {
    console.log(error);
  });

  setInterval(async () => {
    await checkForNotDeliveredTokensErrors();
  }, 10000);
})();
