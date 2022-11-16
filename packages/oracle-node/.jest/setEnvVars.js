process.env.ENABLE_JSON_LOGS = false;
process.env.ENABLE_PERFORMANCE_TRACKING = false;
process.env.PRINT_DIAGNOSTIC_INFO = false;
process.env.ARWEAVE_KEYS_JWK = JSON.stringify({ e: "e", kty: "kty", n: "n" });
process.env.ECDSA_PRIVATE_KEY =
  "0x1111111111111111111111111111111111111111111111111111111111111111";
process.env.OVERRIDE_DIRECT_CACHE_SERVICE_URLS = `["http://localhost:9000"]`;
