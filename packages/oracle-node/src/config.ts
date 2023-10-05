import "dotenv/config";
import { Manifest, NodeConfig } from "./types";
import { readJSON } from "./utils/objects";
import { ethers } from "ethers";
import { SafeSignerFromProcessEnv } from "./signers/SafeSigner";

const DEFAULT_ENABLE_PERFORMANCE_TRACKING = "true";
const DEFAULT_ENABLE_JSON_LOGS = "true";
const DEFAULT_PRINT_DIAGNOSTIC_INFO = "true";
const DEFAULT_ENABLE_STREAMR_BROADCASTING = "false";
const DEFAULT_MANIFEST_REFRESH_INTERVAL = "120000";
const DEFAULT_TWELVE_DATA_API_KEY = "";
const DEFAULT_LEVEL_DB_LOCATION = "oracle-node-level-db";
const DEFAULT_TTL_FOR_PRICES_IN_LOCAL_DB_IN_MILLISECONDS = "900000";
const DEFAULT_ETHERSCAN_API_URL = "";
const DEFAULT_ETHERSCAN_API_KEY = "";
const DEFAULT_MOCK_PRICES_URL_OR_PATH =
  "https://raw.githubusercontent.com/redstone-finance/redstone-mock-prices/main/mock-prices.json";
const DEFAULT_COINBASE_INDEXER_MONGODB_URL = "";
const DEFAULT_COINMARKETCAP_API_URL =
  "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest";
const DEFAULT_COINMARKETCAP_API_KEY = "";
const DEFAULT_KAIKO_API_KEY = "";
const DEFAULT_MIN_DATA_FEEDS_PERCENTAGE_FOR_BIG_PACKAGE = "90";
const DEFAULT_PROVIDER_ID_FOR_PRICE_BROADCASTING = "";
const DEFAULT_STLOUISFED_API_KEY = "";
const DEFAULT_COINGECKO_API_URL =
  "https://api.coingecko.com/api/v3/simple/price";
const DEFAULT_COINGECKO_API_KEY = "";
const DEFAULT_ENABLE_HTTP_SERVER = "false";
const DEFAULT_MAX_ALLOWED_SLIPPAGE_PERCENT = "10";
const DEFAULT_SIMULATION_VALUE_IN_USD_FOR_SLIPPAGE_CHECK = "10000";
const DEFAULT_PRICES_HARD_LIMITS_URLS = "[]";
const DEFAULT_NEWYORKFED_RATES_URL =
  "https://markets.newyorkfed.org/api/rates/all/latest.json";
const DEFAULT_AVALANCHE_RPC_URLS = [
  "https://api.avax.network/ext/bc/C/rpc",
  "https://avalanche.blockpi.network/v1/rpc/public",
  "https://avax.meowrpc.com",
  "https://ava-mainnet.public.blastapi.io/ext/bc/C/rpc",
  "https://avalanche-c-chain.publicnode.com",
];
const DEFAULT_ARBITRUM_RPC_URLS = [
  "https://arb1.arbitrum.io/rpc",
  "https://arb1.croswap.com/rpc",
  "https://arbitrum-one.public.blastapi.io",
  "https://arb-mainnet.g.alchemy.com/v2/demo",
  "https://1rpc.io/arb",
];
const DEFAULT_ETH_MAIN_RPC_URLS = [
  "https://rpc.ankr.com/eth",
  "https://eth.llamarpc.com",
  "https://virginia.rpc.blxrbdn.com",
  "https://core.gashawk.io/rpc",
  "https://ethereum.publicnode.com",
];
const DEFAULT_OPTIMISM_RPC_URLS = [
  "https://mainnet.optimism.io",
  "https://optimism.publicnode.com",
  "https://optimism-mainnet.public.blastapi.io",
  "https://rpc.ankr.com/optimism",
  "https://1rpc.io/op",
  "https://optimism.blockpi.network/v1/rpc/public",
];
const DEFAULT_HISTORICAL_DATA_PACKAGES_URL =
  "https://oracle-gateway-1.b.redstone.finance";

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

const getHardLimitsUrls = () => {
  const hardLimitsUrls = JSON.parse(
    getFromEnv("PRICES_HARD_LIMITS_URLS", DEFAULT_PRICES_HARD_LIMITS_URLS)
  ) as string[];

  return hardLimitsUrls;
};

const getOptionallyManifestData = () => {
  const overrideManifestUsingFile = getFromEnv(
    "OVERRIDE_MANIFEST_USING_FILE",
    ""
  );
  if (overrideManifestUsingFile) {
    return readJSON<Manifest>(overrideManifestUsingFile);
  }
  return undefined;
};

const getOptionallyCacheServiceUrls = () => {
  const overrideDirectCacheServiceUrls = getFromEnv(
    "OVERRIDE_DIRECT_CACHE_SERVICE_URLS",
    ""
  );
  if (overrideDirectCacheServiceUrls) {
    return JSON.parse(overrideDirectCacheServiceUrls) as string[];
  }
  return undefined;
};

const getOptionallyPriceDataServiceUrls = () => {
  const overridePriceCacheServiceUrls = getFromEnv(
    "OVERRIDE_PRICE_CACHE_SERVICE_URLS",
    ""
  );
  if (overridePriceCacheServiceUrls) {
    return JSON.parse(overridePriceCacheServiceUrls) as string[];
  }
  return undefined;
};

console.log("Config file was ran");
const safeSigner = SafeSignerFromProcessEnv("ECDSA_PRIVATE_KEY");

const getRpcUrls = (name: string, defaultValue: string[]): string[] => {
  const rpcUrls = JSON.parse(
    getFromEnv(name, JSON.stringify(defaultValue))
  ) as string[];

  if (rpcUrls.length < 1) {
    throw new Error(`At least one RPC URL ${name} required`);
  }

  return rpcUrls;
};

export const config: NodeConfig = Object.freeze({
  safeSigner: safeSigner,
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
  coinmarketcapApiUrl: getFromEnv(
    "COINMARKETCAP_API_URL",
    DEFAULT_COINMARKETCAP_API_URL
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
  ethereumAddress: safeSigner.address,
  coinbaseIndexerMongoDbUrl: getFromEnv(
    "COINBASE_INDEXER_MONGODB_URL",
    DEFAULT_COINBASE_INDEXER_MONGODB_URL
  ),
  levelDbLocation: getFromEnv("LEVEL_DB_LOCATION", DEFAULT_LEVEL_DB_LOCATION),
  etherscanApiUrl: getFromEnv("ETHERSCAN_API_URL", DEFAULT_ETHERSCAN_API_URL),
  etherscanApiKey: getFromEnv("ETHERSCAN_API_KEY", DEFAULT_ETHERSCAN_API_KEY),
  ttlForPricesInLocalDBInMilliseconds: parserFromString.number(
    getFromEnv(
      "TTL_FOR_PRICES_IN_LOCAL_DB_IN_MILLISECONDS",
      DEFAULT_TTL_FOR_PRICES_IN_LOCAL_DB_IN_MILLISECONDS
    )
  ),
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
  maxAllowedSlippagePercent: parserFromString.number(
    getFromEnv(
      "MAX_ALLOWED_SLIPPAGE_PERCENT",
      DEFAULT_MAX_ALLOWED_SLIPPAGE_PERCENT
    )
  ),
  simulationValueInUsdForSlippageCheck: getFromEnv(
    "SIMULATION_VALUE_IN_USD_FOR_SLIPPAGE_CHECK",
    DEFAULT_SIMULATION_VALUE_IN_USD_FOR_SLIPPAGE_CHECK
  ),
  pricesHardLimitsUrls: getHardLimitsUrls(),
  newyorkfedRatesUrl: getFromEnv(
    "NEWYORKFED_RATES_URL",
    DEFAULT_NEWYORKFED_RATES_URL
  ),
  avalancheRpcUrls: getRpcUrls(
    "AVALANCHE_RPC_URLS",
    DEFAULT_AVALANCHE_RPC_URLS
  ),
  arbitrumRpcUrls: getRpcUrls("ARBITRUM_RPC_URLS", DEFAULT_ARBITRUM_RPC_URLS),
  ethMainRpcUrls: getRpcUrls("ETH_MAIN_RPC_URLS", DEFAULT_ETH_MAIN_RPC_URLS),
  optimismRpcUrls: getRpcUrls("OPTIMISM_RPC_URLS", DEFAULT_OPTIMISM_RPC_URLS),
  historicalDataPackagesUrl: getFromEnv(
    "HISTORICAL_DATA_PACKAGES_URL",
    DEFAULT_HISTORICAL_DATA_PACKAGES_URL
  ),
  telemetryUrl: getFromEnv("TELEMETRY_URL", ""),
  telemetryAuthorizationToken: getFromEnv("TELEMETRY_AUTHORIZATION_TOKEN", ""),
  dockerImageTag: getFromEnv("DOCKER_IMAGE_TAG", "no_tag"),
});
