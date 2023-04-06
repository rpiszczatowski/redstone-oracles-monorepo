import { ethers } from "ethers";
import { NodeConfig } from "../src/types";

const baseManifest = {
  interval: 2000,
  priceAggregator: "median",
  sourceTimeout: 3000,
  deviationCheck: {
    deviationWithRecentValues: {
      maxPercent: 25,
      maxDelayMilliseconds: 300000,
    },
  },
};

export const MOCK_MANIFEST = {
  ...baseManifest,
  tokens: {
    BTC: {
      source: ["bitfinex", "ftx"],
    },
    ETH: {
      source: ["binance", "bitfinex"],
    },
    USDT: {
      source: ["ftx", "binance"],
    },
  },
};

const MOCK_ETH_PRIV_KEY =
  "0x1111111111111111111111111111111111111111111111111111111111111111";

export const MOCK_NODE_CONFIG: NodeConfig = {
  enableJsonLogs: false,
  enablePerformanceTracking: false,
  printDiagnosticInfo: false,
  manifestRefreshInterval: 120000,
  overrideManifestUsingFile: MOCK_MANIFEST,
  privateKeys: {
    ethereumPrivateKey: MOCK_ETH_PRIV_KEY,
  },
  ethereumAddress: new ethers.Wallet(MOCK_ETH_PRIV_KEY).address,
  sqliteDbName: "oracle-node-sqlite-tests.db",
  ttlForPricesInLocalDBInMilliseconds: 900000,
  avalancheRpcUrl: "",
  enableStreamrBroadcasting: false,
  mockPricesUrlOrPath: "",
  minDataFeedsPercentageForBigPackage: 50,
  arbitrumRpcUrl: "",
  coingeckoApiUrl: "",
  enableHttpServer: false,
};
