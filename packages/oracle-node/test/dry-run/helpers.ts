import { ethers } from "ethers";
import { SignedDataPackage } from "redstone-protocol";
import NodeRunner from "../../src/NodeRunner";
import { IterationContext } from "../../src/schedulers/IScheduler";
import { roundTimestamp } from "../../src/utils/timestamps";
import mainManifest from "../../manifests/data-services/main.json";
import {
  Manifest,
  NodeConfig,
  TokenConfig,
  TokensConfig,
} from "../../src/types";
import { config } from "../../src/config";

export interface PricesForDataFeedId {
  [dataFeedId: string]: number;
}

export const HARDHAT_MOCK_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export const HARDHAT_MOCK_ADDRESS = new ethers.Wallet(HARDHAT_MOCK_PRIVATE_KEY)
  .address;

export const getDryRunTestNodeConfig = (manifest: Manifest) => ({
  enableJsonLogs: false,
  enablePerformanceTracking: false,
  printDiagnosticInfo: false,
  manifestRefreshInterval: 120000,
  overrideManifestUsingFile: { ...manifest, sourceTimeout: 40000 },
  privateKeys: {
    ethereumPrivateKey: HARDHAT_MOCK_PRIVATE_KEY,
  },
  enableStreamrBroadcasting: false,
  ethereumAddress: HARDHAT_MOCK_ADDRESS,
  levelDbLocation: "oracle-node-level-db-tests",
  ttlForPricesInLocalDBInMilliseconds: 900000,
  mockPricesUrlOrPath: "",
  minDataFeedsPercentageForBigPackage: 50,
  coingeckoApiUrl: "",
  enableHttpServer: false,
  pricesHardLimitsUrls: [""],
});

export const MockScheduler = {
  startIterations: async (
    runIterationFn: (context: IterationContext) => Promise<void>
  ) => {
    await runIterationFn({
      timestamp: roundTimestamp(Date.now()),
    });
  },
};

export const getTokensFromManifest = (manifest: Manifest) =>
  Object.keys(manifest.tokens);

export const getSourcesForToken = (manifest: Manifest, dataFeedId: string) =>
  manifest.tokens[dataFeedId].source;

export const runTestNode = async (manifest: Manifest) => {
  const sut = await NodeRunner.create({
    ...config,
    ...(getDryRunTestNodeConfig(manifest) as NodeConfig),
  });
  await sut.run();
};

export const getPricesPerDataFeedId = (dataPackages: SignedDataPackage[]) => {
  const pricesForDataFeedId: PricesForDataFeedId = {};
  for (const dataPackage of dataPackages) {
    const dataPackageObject = dataPackage.dataPackage.toObj();
    const { dataFeedId, value } = dataPackageObject.dataPoints[0];
    pricesForDataFeedId[dataFeedId] = Number(value);
  }
  return pricesForDataFeedId;
};

export const getTokensFromMainManifestWithSources = () =>
  Object.entries(mainManifest.tokens).reduce((tokens, [dataFeedId, config]) => {
    if (Object.keys(config).length > 0) {
      tokens[dataFeedId] = config;
    }
    return tokens;
  }, {} as Record<string, TokenConfig>);

export const getMainManifestWithTokensWithSources = () => {
  return {
    ...mainManifest,
    tokens: getTokensFromMainManifestWithSources(),
  };
};

export const removeSkippedItemsFromManifest = (manifest: Manifest) => {
  const skippedSources = JSON.parse(
    process.env.SKIPPED_SOURCES ?? "[]"
  ) as string[];
  let filteredTokens: TokensConfig = {};
  for (const token in manifest.tokens) {
    const filteredSources = manifest.tokens[token].source?.filter(
      (s) => !skippedSources.includes(s)
    );
    if (filteredSources && filteredSources.length > 0) {
      filteredTokens[token] = manifest.tokens[token];
      filteredTokens[token].source = filteredSources;
    }
  }
  manifest.tokens = filteredTokens;
};

export const getTokensWithoutSkipSigning = (manifest: Manifest) => {
  const tokensWithoutSkipSigning: string[] = [];
  for (const [dataFeedId, config] of Object.entries(manifest.tokens)) {
    if (!config.skipSigning) {
      tokensWithoutSkipSigning.push(dataFeedId);
    }
  }
  return tokensWithoutSkipSigning;
};
