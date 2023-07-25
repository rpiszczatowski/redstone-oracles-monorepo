process.env.ENABLE_JSON_LOGS = false;
process.env.ENABLE_PERFORMANCE_TRACKING = false;
process.env.PRINT_DIAGNOSTIC_INFO = false;
process.env.ECDSA_PRIVATE_KEY =
  "0x1111111111111111111111111111111111111111111111111111111111111111";
process.env.OVERRIDE_DIRECT_CACHE_SERVICE_URLS = `["http://mock-direct-cache-service-url"]`;
process.env.OVERRIDE_PRICE_CACHE_SERVICE_URLS = `["http://mock-price-cache-service-url"]`;
process.env.ETHERSCAN_API_URL = "http://mock-etherscan-api-url";
process.env.ETHERSCAN_API_KEY = "test-api-key";
process.env.LEVEL_DB_LOCATION = "level-db-for-tests";
process.env.COINMARKETCAP_API_KEY = "coinmarketcap-api-key";
process.env.MOCK_PRICES_URL_OR_PATH = "http://mock-fetcher";
process.env.MIN_DATA_FEEDS_PERCENTAGE_FOR_BIG_PACKAGE = "50";
if (!process.env.DRY_RUN_TEST_TYPE) {
  process.env.AVALANCHE_RPC_URL = "http://mock-avalanche-rpc-url";
}
