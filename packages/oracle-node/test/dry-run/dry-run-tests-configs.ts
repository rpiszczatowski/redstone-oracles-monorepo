import Decimal from "decimal.js";
import { getTokensFromManifest } from "./helpers";
import mainManifest from "../../manifests/data-services/main.json";
import stocksManifest from "../../manifests/data-services/stocks.json";
import avalancheManifest from "../../manifests/data-services/avalanche.json";
import rapidManifest from "../../manifests/data-services/rapid.json";
import primaryManifest from "../../manifests/data-services/primary.json";
import arbitrumManifest from "../../manifests/data-services/arbitrum.json";
import { Manifest, TokenConfig } from "../../src/types";

Decimal.set({ toExpPos: 9e15 });

interface DryRunTestConfig {
  manifest: Manifest;
  nodeIterations: number;
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
    manifest: mainManifest,
    nodeIterations: 4,
    additionalCheck: assertAllRequiredTokensAreProperlyFetched({
      ...mainManifest,
      tokens: Object.entries(mainManifest.tokens).reduce(
        (tokens, [dataFeedId, config]) => {
          if (Object.keys(config).length > 0) {
            tokens[dataFeedId] = config;
          }
          return tokens;
        },
        {} as Record<string, TokenConfig>
      ),
    }),
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
    nodeIterations: 3,
    additionalCheck:
      assertAllRequiredTokensAreProperlyFetched(avalancheManifest),
  },
  [DryRunTestType.arbitrum]: {
    manifest: arbitrumManifest,
    nodeIterations: 3,
    additionalCheck:
      assertAllRequiredTokensAreProperlyFetched(avalancheManifest),
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
      expect(currentDataFeedPrice).toBeGreaterThan(0);
    }
  };
}
