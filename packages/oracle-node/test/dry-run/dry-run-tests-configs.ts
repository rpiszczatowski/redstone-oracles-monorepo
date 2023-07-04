import { getTokensFromManifest } from "./helpers";
import mainManifest from "../../manifests/data-services/main.json";
import wideSupportTokensManifest from "../../manifests/dev/main-wide-support.json";
import stocksManifest from "../../manifests/data-services/stocks.json";
import avalancheManifest from "../../manifests/data-services/avalanche.json";
import rapidManifest from "../../manifests/data-services/rapid.json";
import { Manifest } from "../../src/types";

interface DryRunTestConfig {
  manifest: Manifest;
  nodeIterations: number;
  additionalCheck?: (...args: any) => void;
}

enum DryRunTestType {
  "main" = "main",
  "stocks" = "stocks",
  "avalanche" = "avalanche",
  "rapid" = "rapid",
}

const config: Record<DryRunTestType, DryRunTestConfig> = {
  [DryRunTestType.main]: {
    manifest: mainManifest,
    nodeIterations: 4,
    additionalCheck: assertAllRequiredTokensAreProperlyFetched(
      wideSupportTokensManifest
    ),
  },
  [DryRunTestType.stocks]: {
    manifest: stocksManifest,
    nodeIterations: 1,
  },
  [DryRunTestType.avalanche]: {
    manifest: avalancheManifest,
    nodeIterations: 4,
    additionalCheck:
      assertAllRequiredTokensAreProperlyFetched(avalancheManifest),
  },
  [DryRunTestType.rapid]: {
    manifest: rapidManifest,
    nodeIterations: 3,
  },
};

export const getDryRunTestConfig = (): DryRunTestConfig => {
  const dryRunTestType = process.env.DRY_RUN_TEST_TYPE;
  if (!dryRunTestType) {
    throw new Error("Missing dry run test type in env variables");
  }
  return config[dryRunTestType as DryRunTestType];
};

function assertAllRequiredTokensAreProperlyFetched(manifest: Manifest) {
  return function (token: string, currentDataFeedPrice: number) {
    const avalancheTokens = getTokensFromManifest(manifest);
    if (avalancheTokens.includes(token)) {
      expect(Number(currentDataFeedPrice)).toBeGreaterThan(0);
    }
  };
}
