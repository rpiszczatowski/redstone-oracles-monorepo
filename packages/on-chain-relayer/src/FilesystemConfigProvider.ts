import "dotenv/config";
import {
  ConfigProvider,
  OnChainRelayerEnv,
  OnChainRelayerManifest,
  OnChainRelayerManifestSchema,
} from "./types";
import fs from "fs";
import { makeConfigProvider } from "./make-config-provider";

type GetFromEnvType = {
  (name: string, optional: true): string | undefined;
  (name: string, optional: boolean): string | undefined;
  (name: string, optional?: false): string;
};

const getFromEnv: GetFromEnvType = (
  name: string,
  optional: boolean = false
) => {
  const envValue = process.env[name];
  if (!envValue && !optional) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return envValue!;
};

// copy of method from oracle-node. Probably should be moved to some common package
const readJSON = <T>(_path: string): T => {
  return {
    chain: {
      name: "Kava EVM",
      id: 2222,
    },
    updateTriggers: {
      deviationPercentage: 0.5,
      timeSinceLastUpdateInMilliseconds: 3600000,
    },
    adapterContract: "0xEcf0d5EEa51658997D7E750d0a449485D8a4079E",
    dataServiceId: "redstone-primary-prod",
    priceFeeds: {
      BTC: "0x099E81C3A9aA6185c083ac579ef60541418dE8d7",
    },
  } as T;
};

type GetJSONFromEnvType = {
  <T>(varName: string, optional: true): T | undefined;
  <T>(varName: string, optional: boolean): T | undefined;
  <T>(varName: string, optional?: false): T;
};
const getJSONFromEnv: GetJSONFromEnvType = <T>(
  varName: string,
  optional = false
): T | undefined => {
  const envVal = getFromEnv(varName, optional);
  if (!envVal) {
    return;
  }
  try {
    return JSON.parse(envVal) as T;
  } catch (e) {
    if (!optional) {
      throw e;
    }
  }
  return undefined;
};

export const fileSystemConfigProvider: ConfigProvider = () => {
  const manifestPath = getFromEnv("MANIFEST_FILE")!;
  const manifest = OnChainRelayerManifestSchema.parse(
    readJSON<OnChainRelayerManifest>(manifestPath)
  );
  const env: OnChainRelayerEnv = {
    relayerIterationInterval: Number(getFromEnv("RELAYER_ITERATION_INTERVAL")),
    rpcUrls: JSON.parse(getFromEnv("RPC_URLS")) as string[],
    privateKey: getFromEnv("PRIVATE_KEY"),
    gasLimit: Number.parseInt(getFromEnv("GAS_LIMIT")!),
    gasMultiplier: Number.parseFloat(
      getFromEnv("GAS_MULTIPLIER", true) || "1.125"
    ),
    healthcheckPingUrl: getFromEnv("HEALTHCHECK_PING_URL", true),
    expectedTxDeliveryTimeInMS: Number(
      getFromEnv("EXPECTED_TX_DELIVERY_TIME_IN_MS")
    ),
    isArbitrumNetwork: getFromEnv("IS_ARBITRUM_NETWORK", true) === "true",
    fallbackOffsetInMinutes: Number.parseInt(
      getFromEnv("FALLBACK_OFFSET_IN_MINUTES", true) ?? "0"
    ),
    cacheServiceUrls: getJSONFromEnv("CACHE_SERVICE_URLS", true),
    historicalPackagesGateways: getJSONFromEnv(
      "HISTORICAL_PACKAGES_GATEWAYS",
      true
    ),
    isAuctionModel: getFromEnv("IS_AUCTION_MODEL", true) === "true",
  };

  return makeConfigProvider(manifest, env);
};
