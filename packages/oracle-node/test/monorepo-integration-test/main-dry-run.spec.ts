import fs from "fs";
import { readJSON } from "../../src/utils/objects";
import { getMedianValue } from "../../src/aggregators/median-aggregator";

const dynamicDescribe =
  process.env.MONOREPO_INTEGRATION_TEST === "true" ? describe : describe.skip;

// This test is used in monorepo integration tests
dynamicDescribe("Main dry run test", () => {
  const tokensToTest = getTokensToTest();
  const testShouldPass = async () => {
    for (const tokenSymbol of tokensToTest) {
      const { aggregatedPrice, singleSourcePrices } =
        getPricesForToken(tokenSymbol);
      const medianValue = getMedianValue(singleSourcePrices);
      expect(aggregatedPrice).toEqual(medianValue);
    }
  };

  test("Most popular tokens should be present", async () => {
    await testShouldPass();
  });
});

function getTokensToTest() {
  const mainManifest = readJSON("manifests/data-services/main.json");
  return Object.keys(mainManifest.tokens).slice(0, 44);
}

// Regex for extracting log with aggregated price and prices from all sources for a single token
function getLogsRegexForToken(symbol: string) {
  return new RegExp(`{(.*(Fetched price : ${symbol} ).*)}`, "g");
}

function getPricesLogForToken(symbol: string) {
  const nodeLogs = fs.readFileSync("tmp.out", "utf-8");
  const tokenRegex = getLogsRegexForToken(symbol);
  const tokenString = nodeLogs.match(tokenRegex);
  if (!tokenString || tokenString.length === 0) {
    throw new Error(`Missing token ${symbol} in node logs`);
  }
  const lastLog = tokenString[tokenString.length - 1];
  const tokenLogsAsObject = JSON.parse(lastLog);
  return tokenLogsAsObject.args[0];
}

function getPricesForToken(tokenSymbol: string): {
  aggregatedPrice: number;
  singleSourcePrices: number[];
} {
  // Regex for extracting all number from log with prices
  const numberRegex = new RegExp("((?<=:)|(?<=:\\s))[0-9]+[.]?[0-9]*", "g");
  const tokenPricesLog = getPricesLogForToken(tokenSymbol);
  const allPrices = tokenPricesLog.match(numberRegex);
  const aggregatedPrice = Number(allPrices[0]);
  const singleSourcePrices = allPrices
    .slice(1)
    .map((price: string) => Number(price));
  return { aggregatedPrice, singleSourcePrices };
}
