import { getTokensFromManifest } from "./helpers";
import mainManifest from "../../manifests/data-services/main.json";
import wideSupportTokensManifest from "../../manifests/dev/main-wide-support.json";
import stocksManifest from "../../manifests/data-services/stocks.json";
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
  "rapid" = "rapid",
}

const config: Record<DryRunTestType, DryRunTestConfig> = {
  [DryRunTestType.main]: {
    manifest: mainManifest,
    nodeIterations: 4,
    additionalCheck: assertMainRequiredTokensAreProperlyFetched,
  },
  [DryRunTestType.stocks]: {
    manifest: stocksManifest,
    nodeIterations: 1,
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

function assertMainRequiredTokensAreProperlyFetched(
  token: string,
  currentDataFeedPrice: number
) {
  const wideSupportTokens = getTokensFromManifest(wideSupportTokensManifest);
  if (wideSupportTokens.includes(token)) {
    expect(currentDataFeedPrice).toBeGreaterThan(0);
  }
}
