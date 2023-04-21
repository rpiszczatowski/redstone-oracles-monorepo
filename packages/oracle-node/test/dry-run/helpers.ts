import { ethers } from "ethers";
import { IterationContext } from "../../src/schedulers/IScheduler";
import { roundTimestamp } from "../../src/utils/timestamps";
import mainManifest from "../../manifests/data-services/main.json";
import wideSupportTokensManifest from "../../manifests/dev/main-wide-support.json";
import { NodeConfig } from "../../src/types";

export const HARDHAT_MOCK_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export const dryRunTestNodeConfig: NodeConfig = {
  enableJsonLogs: false,
  enablePerformanceTracking: false,
  printDiagnosticInfo: false,
  manifestRefreshInterval: 120000,
  overrideManifestUsingFile: { ...mainManifest, sourceTimeout: 10000 },
  privateKeys: {
    ethereumPrivateKey: HARDHAT_MOCK_PRIVATE_KEY,
  },
  enableStreamrBroadcasting: false,
  ethereumAddress: new ethers.Wallet(HARDHAT_MOCK_PRIVATE_KEY).address,
  levelDbLocation: "oracle-node-level-db-tests",
  ttlForPricesInLocalDBInMilliseconds: 900000,
  avalancheRpcUrl: "",
  mockPricesUrlOrPath: "",
  minDataFeedsPercentageForBigPackage: 50,
  arbitrumRpcUrl: "",
  coingeckoApiUrl: "",
  enableHttpServer: false,
  pricesHardLimitsUrl: "",
};

export const MockScheduler = {
  startIterations: async (
    runIterationFn: (context: IterationContext) => Promise<void>
  ) => {
    await runIterationFn({
      timestamp: roundTimestamp(Date.now()),
    });
  },
};

export const getMainManifestTokens = () => Object.keys(mainManifest.tokens);

export const getWideSupportTokens = () =>
  Object.keys(wideSupportTokensManifest.tokens);
