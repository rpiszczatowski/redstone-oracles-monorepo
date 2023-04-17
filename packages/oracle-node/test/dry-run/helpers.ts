import { ethers } from "ethers";
import mainManifest from "../../manifests/data-services/main.json";
import { IterationContext } from "../../src/schedulers/IScheduler";
import { roundTimestamp } from "../../src/utils/timestamps";

export const HARDHAT_MOCK_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export const dryRunTestNodeConfig = {
  enableJsonLogs: false,
  enablePerformanceTracking: false,
  printDiagnosticInfo: false,
  manifestRefreshInterval: 120000,
  overrideManifestUsingFile: mainManifest,
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
  stlouisfedApiKey: process.env.STLOUISFED_API_KEY,
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
