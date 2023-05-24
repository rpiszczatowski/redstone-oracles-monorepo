import "dotenv/config";
import { Manifest, NodeConfig } from "./types";
import { readJSON } from "./utils/objects";
import { ethers } from "ethers";

const DEFAULT_ENABLE_PERFORMANCE_TRACKING = "true";
const DEFAULT_ENABLE_JSON_LOGS = "true";
const DEFAULT_PRINT_DIAGNOSTIC_INFO = "true";
const DEFAULT_ENABLE_STREAMR_BROADCASTING = "false";
const DEFAULT_MANIFEST_REFRESH_INTERVAL = "120000";
const DEFAULT_TWELVE_DATA_API_KEY = "";
const DEFAULT_ETH_MAIN_RPC_URLS = ["https://rpc.ankr.com/eth"];
const DEFAULT_LEVEL_DB_LOCATION = "oracle-node-level-db";
const DEFAULT_TTL_FOR_PRICES_IN_LOCAL_DB_IN_MILLISECONDS = "900000";
const DEFAULT_ETHERSCAN_API_URL = "";
const DEFAULT_ETHERSCAN_API_KEY = "";
const DEFAULT_AVALANCHE_RPC_URLS = ["https://api.avax.network/ext/bc/C/rpc"];
const DEFAULT_MOCK_PRICES_URL_OR_PATH =
  "https://raw.githubusercontent.com/redstone-finance/redstone-mock-prices/main/mock-prices.json";
const DEFAULT_COINBASE_INDEXER_MONGODB_URL = "";
const DEFAULT_COINMARKETCAP_API_KEY = "";
const DEFAULT_KAIKO_API_KEY = "";
const DEFAULT_MIN_DATA_FEEDS_PERCENTAGE_FOR_BIG_PACKAGE = "90";
const DEFAULT_ARBITRUM_RPC_URLS = ["https://arb1.arbitrum.io/rpc"];
const DEFAULT_PROVIDER_ID_FOR_PRICE_BROADCASTING = "";
const DEFAULT_STLOUISFED_API_KEY = "";
const DEFAULT_COINGECKO_API_URL =
  "https://api.coingecko.com/api/v3/simple/price";
const DEFAULT_COINGECKO_API_KEY = "";
const DEFAULT_ENABLE_HTTP_SERVER = "false";
const DEFAULT_PRICES_HARD_LIMITS_URL = "";
const DEFAULT_NEWYORKFED_RATES_URL =
  "https://markets.newyorkfed.org/api/rates/all/latest.json";

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

const getRpcUrls = (name: string, defaultValue: string[]): string[] => {
  const rpcUrls = JSON.parse(getFromEnv(name, JSON.stringify(defaultValue)));

  if (rpcUrls.length < 1) {
    throw new Error(`At least one RPC URL ${name} required`);
  }

  return rpcUrls;
};

const getOptionallyPriceDataServiceUrls = () => {
  const overridePriceCacheServiceUrls = getFromEnv(
    "OVERRIDE_PRICE_CACHE_SERVICE_URLS",
    ""
  );
  if (!!overridePriceCacheServiceUrls) {
    return JSON.parse(overridePriceCacheServiceUrls) as string[];
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
  overridePriceCacheServiceUrls: getOptionallyPriceDataServiceUrls(),
  twelveDataApiKey: getFromEnv(
    "TWELVE_DATA_API_KEY",
    DEFAULT_TWELVE_DATA_API_KEY
  ),
  coinmarketcapApiKey: getFromEnv(
    "COINMARKETCAP_API_KEY",
    DEFAULT_COINMARKETCAP_API_KEY
  ),
  kaikoApiKey: getFromEnv("KAIKO_API_KEY", DEFAULT_KAIKO_API_KEY),
  stlouisfedApiKey: getFromEnv(
    "STLOUISFED_API_KEY",
    DEFAULT_STLOUISFED_API_KEY
  ),
  privateKeys: {
    ethereumPrivateKey,
  },
  ethereumAddress: new ethers.Wallet(ethereumPrivateKey).address,
  coinbaseIndexerMongoDbUrl: getFromEnv(
    "COINBASE_INDEXER_MONGODB_URL",
    DEFAULT_COINBASE_INDEXER_MONGODB_URL
  ),
  ethMainRpcUrls: getRpcUrls("ETH_MAIN_RPC_URLS", DEFAULT_ETH_MAIN_RPC_URLS),
  levelDbLocation: getFromEnv("LEVEL_DB_LOCATION", DEFAULT_LEVEL_DB_LOCATION),
  etherscanApiUrl: getFromEnv("ETHERSCAN_API_URL", DEFAULT_ETHERSCAN_API_URL),
  etherscanApiKey: getFromEnv("ETHERSCAN_API_KEY", DEFAULT_ETHERSCAN_API_KEY),
  ttlForPricesInLocalDBInMilliseconds: parserFromString.number(
    getFromEnv(
      "TTL_FOR_PRICES_IN_LOCAL_DB_IN_MILLISECONDS",
      DEFAULT_TTL_FOR_PRICES_IN_LOCAL_DB_IN_MILLISECONDS
    )
  ),
  avalancheRpcUrls: getRpcUrls(
    "AVALANCHE_RPC_URLS",
    DEFAULT_AVALANCHE_RPC_URLS
  ),
  arbitrumRpcUrls: getRpcUrls("ARBITRUM_RPC_URLS", DEFAULT_ARBITRUM_RPC_URLS),
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
  providerIdForPriceBroadcasting: getFromEnv(
    "PROVIDER_ID_FOR_PRICE_BROADCASTING",
    DEFAULT_PROVIDER_ID_FOR_PRICE_BROADCASTING
  ),
  coingeckoApiUrl: getFromEnv("COINGECKO_API_URL", DEFAULT_COINGECKO_API_URL),
  coingeckoApiKey: getFromEnv("COINGECKO_API_KEY", DEFAULT_COINGECKO_API_KEY),
  enableHttpServer: parserFromString.boolean(
    getFromEnv("ENABLE_HTTP_SERVER", DEFAULT_ENABLE_HTTP_SERVER)
  ),
  pricesHardLimitsUrl: getFromEnv(
    "PRICES_HARD_LIMITS_URL",
    DEFAULT_PRICES_HARD_LIMITS_URL
  ),
  newyorkfedRatesUrl: getFromEnv(
    "NEWYORKFED_RATES_URL",
    DEFAULT_NEWYORKFED_RATES_URL
  ),
});
