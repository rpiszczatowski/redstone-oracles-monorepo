import avalancheManifest from "../../manifests/data-services/avalanche.json";
import primaryManifest from "../../manifests/data-services/primary.json";
import arbitrumManifest from "../../manifests/data-services/arbitrum.json";
import rapidManifest from "../../manifests/data-services/rapid.json";
import stocksManifest from "../../manifests/data-services/stocks.json";
import { getTokensFromMainManifestWithSources } from "../dry-run/helpers";
import { TokenConfig } from "../../src/types";

interface TokensConfig {
  [tokenName: string]: TokenConfig | undefined;
}

const SOURCES_ACCEPTABLE_TO_DIFF = [
  "coinmarketcap",
  "band",
  "dia",
  "twap-cache-service-minute-redstone-main-demo",
  "twap-cache-service-minute-redstone-primary-prod",
];

const DATA_FEEDS_ACCEPTABLE_TO_DIFF = ["GLP"];

const tokensFromManifests = [
  { name: "avalanche", tokens: avalancheManifest.tokens },
  { name: "primary", tokens: primaryManifest.tokens },
  { name: "arbitrum", tokens: arbitrumManifest.tokens },
  { name: "rapid", tokens: rapidManifest.tokens },
  { name: "stocks", tokens: stocksManifest.tokens },
];

describe("Check sources consistency", () => {
  for (const { name, tokens } of tokensFromManifests) {
    test(`Check sources consistency - ${name}`, () => {
      const inconsistencyCount = checkSourcesConsistency(name, tokens);
      expect(inconsistencyCount).toEqual(0);
    });
  }
});

function checkSourcesConsistency(
  manifestName: string,
  tokensConfig: TokensConfig
) {
  let inconsistencyCount = 0;
  const mainManifestTokens = getTokensFromMainManifestWithSources();
  for (const [tokenFromMainName, tokenFromMainConfig] of Object.entries(
    mainManifestTokens
  )) {
    const tokenNotFromMain = tokensConfig[tokenFromMainName];
    if (tokenNotFromMain?.source && tokenFromMainConfig.source) {
      inconsistencyCount += doCheckConsistency(
        tokenFromMainConfig.source,
        tokenNotFromMain.source,
        tokenFromMainName,
        manifestName
      );
    }
  }
  return inconsistencyCount;
}

function doCheckConsistency(
  mainSources: string[],
  notMainSources: string[],
  tokenName: string,
  otherManifestName: string
) {
  let inconsistencyCount = 0;
  if (DATA_FEEDS_ACCEPTABLE_TO_DIFF.includes(tokenName)) {
    return inconsistencyCount;
  }

  const missingSourcesDiff = getFilteredDiff(mainSources, notMainSources);
  const additionalSourcesDiff = getFilteredDiff(notMainSources, mainSources);
  if (missingSourcesDiff.length > 0) {
    console.log(
      `Found missing sources ${JSON.stringify(
        missingSourcesDiff
      )} for ${tokenName} in ${otherManifestName} comparing to main manifest`
    );
    inconsistencyCount += missingSourcesDiff.length;
  }
  if (additionalSourcesDiff.length > 0) {
    console.log(
      `Found additional sources ${JSON.stringify(
        additionalSourcesDiff
      )} for ${tokenName} in ${otherManifestName} comparing to main manifest`
    );
    inconsistencyCount += additionalSourcesDiff.length;
  }
  return inconsistencyCount;
}

function getFilteredDiff(
  firstArray: string[],
  secondArray: string[]
): string[] {
  const diff = getArraysDiff(firstArray, secondArray);
  return filterSourcesDiff(diff);
}

function getArraysDiff<T>(firstArray: T[], secondArray: T[]): T[] {
  const secondSet = new Set(secondArray);
  return firstArray.filter((item) => !secondSet.has(item));
}

function filterSourcesDiff(sourcesDiff: string[]) {
  return sourcesDiff.filter(
    (source) => !SOURCES_ACCEPTABLE_TO_DIFF.includes(source)
  );
}
