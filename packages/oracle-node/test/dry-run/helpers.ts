import { ethers } from "ethers";
import { SignedDataPackage } from "redstone-protocol";
import { convertAndSerializeBytesToNumber } from "redstone-protocol/src/common/utils";
import { base64 } from "ethers/lib/utils";
import { IterationContext } from "../../src/schedulers/IScheduler";
import { roundTimestamp } from "../../src/utils/timestamps";
import { Manifest, NodeConfig } from "../../src/types";
import NodeRunner from "../../src/NodeRunner";

interface PricesForDataFeedId {
  [dataFeedId: string]: number;
}

export const HARDHAT_MOCK_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export const getDryRunTestNodeConfig = (manifest: Manifest): NodeConfig => ({
  enableJsonLogs: false,
  enablePerformanceTracking: false,
  printDiagnosticInfo: false,
  manifestRefreshInterval: 120000,
  overrideManifestUsingFile: { ...manifest, sourceTimeout: 10000 },
  privateKeys: {
    ethereumPrivateKey: HARDHAT_MOCK_PRIVATE_KEY,
  },
  enableStreamrBroadcasting: false,
  ethereumAddress: new ethers.Wallet(HARDHAT_MOCK_PRIVATE_KEY).address,
  levelDbLocation: "oracle-node-level-db-tests",
  ttlForPricesInLocalDBInMilliseconds: 900000,
  mockPricesUrlOrPath: "",
  minDataFeedsPercentageForBigPackage: 50,
  coingeckoApiUrl: "",
  enableHttpServer: false,
  pricesHardLimitsUrls: [""],
  newyorkfedRatesUrl: "",
  avalancheRpcUrls: ["https://mock-rpc.url"],
  ethMainRpcUrls: ["https://mock-rpc.url"],
  arbitrumRpcUrls: ["https://mock-rpc.url"],
  optimismRpcUrls: ["https://mock-rpc.url"],
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

export const runTestNode = async (manifest: Manifest) => {
  const sut = await NodeRunner.create(getDryRunTestNodeConfig(manifest));
  await sut.run();
};

export const runNodeMultipleTimes = async (
  manifest: Manifest,
  iterationsCount: number
) => {
  for (let i = 0; i < iterationsCount; i++) {
    await runTestNode(manifest);
  }
};

export const getPricesForDataFeedId = (dataPackages: SignedDataPackage[]) => {
  const pricesForDataFeedId: PricesForDataFeedId = {};
  for (const dataPackage of dataPackages) {
    const dataPackageObject = dataPackage.dataPackage.toObj();
    const { dataFeedId, value } = dataPackageObject.dataPoints[0];
    pricesForDataFeedId[dataFeedId] = convertAndSerializeBytesToNumber(
      base64.decode(value.toString())
    );
  }
  return pricesForDataFeedId;
};
