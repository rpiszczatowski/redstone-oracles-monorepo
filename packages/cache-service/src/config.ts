import { JWKInterface } from "arweave/node/lib/wallet";
import "dotenv/config";

interface CacheServiceConfigRequiredFields {
  appPort: number;
  mongoDbUrl: string;
  enableStreamrListening: boolean;
  enableDirectPostingRoutes: boolean;
  mockDataServiceIdForPackages: boolean;
  apiKeyForAccessToAdminRoutes: string;
  allowedStreamrDataServiceIds: string[];
}

type CacheServiceConfig =
  | (CacheServiceConfigRequiredFields & {
      enableArchivingOnArweave: true;
      arweaveJwkKey: JWKInterface;
      bundlrNodeUrl: string;
    })
  | (CacheServiceConfigRequiredFields & { enableArchivingOnArweave: false });

const DEFAULT_BUNDLR_NODE_URL = "https://node2.bundlr.network";
const DEFAULT_APP_PORT = 3000;

const getEnv = (envName: string, required = true): string => {
  if (!process.env[envName] && required) {
    throw new Error(`Required env variable not found: ${envName}`);
  }
  return process.env[envName] || ("" as string);
};

const arweaveJwkKeyForArchiving = getEnv(
  "JWK_KEY_FOR_ARCHIVING_ON_ARWEAVE",
  false
);

const config = {
  mongoDbUrl: getEnv("MONGO_DB_URL", false),
} as CacheServiceConfig;

if (config.enableArchivingOnArweave) {
  config.arweaveJwkKey = JSON.parse(arweaveJwkKeyForArchiving);
}

export default config;
