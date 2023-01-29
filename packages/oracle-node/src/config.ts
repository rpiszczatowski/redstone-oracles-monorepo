import "dotenv/config";
import { JWKInterface } from "arweave/node/lib/wallet";
import { Manifest, NodeConfig } from "./types";
import { readJSON } from "./utils/objects";
import { ethers } from "ethers";

const DEFAULT_ENABLE_PERFORMANCE_TRACKING = "true";
const DEFAULT_ENABLE_JSON_LOGS = "true";
const DEFAULT_PRINT_DIAGNOSTIC_INFO = "true";
const DEFAULT_ENABLE_STREAMR_BROADCASTING = "false";
const DEFAULT_MANIFEST_REFRESH_INTERVAL = "120000";
const DEFAULT_TWELVE_DATA_RAPID_API_KEY = "";
const DEFAULT_USE_NEW_SIGNING_AND_BROADCASTING = "false";
const DEFAULT_ETH_MAIN_RPC_URL = "https://rpc.ankr.com/eth";
const DEFAULT_LEVEL_DB_LOCATION = "oracle-node-level-db";
const DEFAULT_TTL_FOR_PRICES_IN_LOCAL_DB_IN_MILLISECONDS = "900000";
const DEFAULT_ETHERSCAN_API_URL = "";
const DEFAULT_ETHERSCAN_API_KEY = "";
const DEFAULT_AVALANCHE_RPC_URL = "https://api.avax.network/ext/bc/C/rpc";
const DEFAULT_MOCK_PRICES_URL_OR_PATH =
  "https://raw.githubusercontent.com/redstone-finance/redstone-mock-prices/main/mock-prices.json";
const DEFAULT_COINBASE_INDEXER_MONGODB_URL = "";
const DEFAULT_COINMARKETCAP_API_KEY = "";
const DEFAULT_KAIKO_API_KEY = "";
const DEFAULT_MIN_DATA_FEEDS_PERCENTAGE_FOR_BIG_PACKAGE = "90";

const getFromEnv = (envName: string, defaultValue?: string): string => {
  const valueFromEnv = process.env[envName];
  if (!valueFromEnv) {
    if (defaultValue === undefined) {
      throw new Error(`Env ${envName} must be specified`);
    }
    return defaultValue;
  }
  return valueFromEnv;
};

const parserFromString = {
  number(value: string): number {
    const numberValue = Number(value);
    if (isNaN(numberValue)) {
      throw new Error(`Invalid number value: ${numberValue}`);
    }
    return numberValue;
  },
  boolean(value: string): boolean {
    if (!(value === "true" || value === "false")) {
      throw new Error(`Invalid boolean value: ${value}`);
    }
    return value === "true";
  },
  hex(value: string): string {
    const hexValue = value.startsWith("0x") ? value : `0x${value}`;
    if (!ethers.utils.isHexString(hexValue)) {
      throw new Error(`Invalid hex value: ${hexValue}`);
    }
    return hexValue;
  },
};

const getOptionallyManifestData = () => {
  const overrideManifestUsingFile = getFromEnv(
    "OVERRIDE_MANIFEST_USING_FILE",
    ""
  );
  if (!!overrideManifestUsingFile) {
    return readJSON(overrideManifestUsingFile) as Manifest;
  }
};

const getOptionallyCacheServiceUrls = () => {
  const overrideDirectCacheServiceUrls = getFromEnv(
    "OVERRIDE_DIRECT_CACHE_SERVICE_URLS",
    ""
  );
  if (!!overrideDirectCacheServiceUrls) {
    return JSON.parse(overrideDirectCacheServiceUrls) as string[];
  }
};

export const getArweaveWallet = (): JWKInterface => {
  const arweaveKeysFile = process.env.ARWEAVE_KEYS_FILE_PATH;
  const arweaveKeysJWK = process.env.ARWEAVE_KEYS_JWK;
  if (arweaveKeysFile) {
    return readJSON(arweaveKeysFile);
  } else if (arweaveKeysJWK) {
    return JSON.parse(arweaveKeysJWK);
  } else {
    throw new Error(
      "Env ARWEAVE_KEYS_FILE_PATH or ARWEAVE_KEYS_JWK must be specified"
    );
  }
};

const ethereumPrivateKey = parserFromString.hex(
  getFromEnv("ECDSA_PRIVATE_KEY")
);

export const config: NodeConfig = Object.freeze({
  enableJsonLogs: parserFromString.boolean(
    getFromEnv("ENABLE_JSON_LOGS", DEFAULT_ENABLE_JSON_LOGS)
  ),
  enablePerformanceTracking: parserFromString.boolean(
    getFromEnv(
      "ENABLE_PERFORMANCE_TRACKING",
      DEFAULT_ENABLE_PERFORMANCE_TRACKING
    )
  ),
  printDiagnosticInfo: parserFromString.boolean(
    getFromEnv("PRINT_DIAGNOSTIC_INFO", DEFAULT_PRINT_DIAGNOSTIC_INFO)
  ),
  manifestRefreshInterval: parserFromString.number(
    getFromEnv("MANIFEST_REFRESH_INTERVAL", DEFAULT_MANIFEST_REFRESH_INTERVAL)
  ),
  overrideManifestUsingFile: getOptionallyManifestData(),
  overrideDirectCacheServiceUrls: getOptionallyCacheServiceUrls(),
  twelveDataRapidApiKey: getFromEnv(
    "TWELVE_DATA_RAPID_API_KEY",
    DEFAULT_TWELVE_DATA_RAPID_API_KEY
  ),
  coinmarketcapApiKey: getFromEnv(
    "COINMARKETCAP_API_KEY",
    DEFAULT_COINMARKETCAP_API_KEY
  ),
  kaikoApiKey: getFromEnv("KAIKO_API_KEY", DEFAULT_KAIKO_API_KEY),
  privateKeys: {
    arweaveJwk: getArweaveWallet(),
    ethereumPrivateKey,
  },
  useNewSigningAndBroadcasting: parserFromString.boolean(
    getFromEnv(
      "USE_NEW_SIGNING_AND_BROADCASTING",
      DEFAULT_USE_NEW_SIGNING_AND_BROADCASTING
    )
  ),
  ethereumAddress: new ethers.Wallet(ethereumPrivateKey).address,
  coinbaseIndexerMongoDbUrl: getFromEnv(
    "COINBASE_INDEXER_MONGODB_URL",
    DEFAULT_COINBASE_INDEXER_MONGODB_URL
  ),
  ethMainRpcUrl: getFromEnv("ETH_MAIN_RPC_URL", DEFAULT_ETH_MAIN_RPC_URL),
  levelDbLocation: getFromEnv("LEVEL_DB_LOCATION", DEFAULT_LEVEL_DB_LOCATION),
  etherscanApiUrl: getFromEnv("ETHERSCAN_API_URL", DEFAULT_ETHERSCAN_API_URL),
  etherscanApiKey: getFromEnv("ETHERSCAN_API_KEY", DEFAULT_ETHERSCAN_API_KEY),
  ttlForPricesInLocalDBInMilliseconds: parserFromString.number(
    getFromEnv(
      "TTL_FOR_PRICES_IN_LOCAL_DB_IN_MILLISECONDS",
      DEFAULT_TTL_FOR_PRICES_IN_LOCAL_DB_IN_MILLISECONDS
    )
  ),
  avalancheRpcUrl: getFromEnv("AVALANCHE_RPC_URL", DEFAULT_AVALANCHE_RPC_URL),
  enableStreamrBroadcasting: parserFromString.boolean(
    getFromEnv(
      "ENABLE_STREAMR_BROADCASTING",
      DEFAULT_ENABLE_STREAMR_BROADCASTING
    )
  ),
  mockPricesUrlOrPath: getFromEnv(
    "MOCK_PRICES_URL_OR_PATH",
    DEFAULT_MOCK_PRICES_URL_OR_PATH
  ),
  minDataFeedsPercentageForBigPackage: parserFromString.number(
    getFromEnv(
      "MIN_DATA_FEEDS_PERCENTAGE_FOR_BIG_PACKAGE",
      DEFAULT_MIN_DATA_FEEDS_PERCENTAGE_FOR_BIG_PACKAGE
    )
  ),
});
