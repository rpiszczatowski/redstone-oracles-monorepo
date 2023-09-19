import Decimal from "decimal.js";
import {
  getMainManifestWithTokensWithSources,
  getTokensFromManifest,
} from "./helpers";
import stocksManifest from "../../manifests/data-services/stocks.json";
import avalancheManifest from "../../manifests/data-services/avalanche.json";
import rapidManifest from "../../manifests/data-services/rapid.json";
import primaryManifest from "../../manifests/data-services/primary.json";
import arbitrumManifest from "../../manifests/data-services/arbitrum.json";
import { Manifest } from "../../src/types";

Decimal.set({ toExpPos: 9e15 });

const DEV_MAIN_NODE_ADDRESS = "0x0C39486f770B26F5527BBBf942726537986Cd7eb";
const PROD_PRIMARY_NODE_1_ADDRESS =
  "0x8BB8F32Df04c8b654987DAaeD53D6B6091e3B774";

interface DryRunTestConfig {
  manifest: Manifest;
  nodeIterations: number;
  ethereumAddress?: string;
  additionalCheck?: (token: string, currentDataFeedPrice?: number) => void;
}

enum DryRunTestType {
  "main" = "main",
  "stocks" = "stocks",
  "avalanche" = "avalanche",
  "rapid" = "rapid",
  "primary" = "primary",
  "arbitrum" = "arbitrum",
}

const config: Record<DryRunTestType, DryRunTestConfig> = {
  [DryRunTestType.main]: {
    manifest: getMainManifestWithTokensWithSources(),
    nodeIterations: 4,
    // Required to test TWAP, node's fetcher accepts data packages only from itself and mocking address is required
    ethereumAddress: DEV_MAIN_NODE_ADDRESS,
    additionalCheck: assertAllRequiredTokensAreProperlyFetched(
      getMainManifestWithTokensWithSources()
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
  [DryRunTestType.primary]: {
    manifest: primaryManifest,
    nodeIterations: 4,
    // Required to test TWAP, node's fetcher accepts data packages only from itself and mocking address is required
    ethereumAddress: PROD_PRIMARY_NODE_1_ADDRESS,
    additionalCheck: assertAllRequiredTokensAreProperlyFetched(primaryManifest),
  },
  [DryRunTestType.arbitrum]: {
    manifest: arbitrumManifest,
    nodeIterations: 4,
    additionalCheck:
      assertAllRequiredTokensAreProperlyFetched(arbitrumManifest),
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
  const manifestTokens = getTokensFromManifest(manifest);
  return (token: string, currentDataFeedPrice?: number) => {
    if (manifestTokens.includes(token)) {
      expect(currentDataFeedPrice).toBeTruthy();
      expect(currentDataFeedPrice).toBeGreaterThan(0);
    }
  };
}
