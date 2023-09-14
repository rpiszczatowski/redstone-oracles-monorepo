import { RedstoneTypes } from "@redstone-finance/utils";

const ONE_DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

let localCache: {
  [timestampWithDataFeedId: string]: RedstoneTypes.DataPackageFromGateway;
} = {};

export const storeDataPackagesInLocalCache = (
  dataPackages: RedstoneTypes.DataPackageFromGateway[]
) => {
  for (const dataPackage of dataPackages) {
    const timestamp = dataPackage.timestampMilliseconds;
    const dataFeedId = dataPackage.dataFeedId;
    const localCacheKey = buildLocalCacheKey(timestamp, dataFeedId);
    localCache[localCacheKey] = dataPackage;
  }
};

const buildLocalCacheKey = (timestamp: number, dataFeedId: string) =>
  `${timestamp}-${dataFeedId}`;

export const getDataPackageFromLocalCache = (
  timestamp: number,
  dataFeedId: string
): RedstoneTypes.DataPackageFromGateway => {
  const localCacheKey = buildLocalCacheKey(timestamp, dataFeedId);
  return localCache[localCacheKey];
};

export const getDataPackageFromLocalCacheAsResponse = (
  timestamp: number,
  dataFeedId: string
): RedstoneTypes.DataPackageFromGatewayResponse | undefined => {
  const dataPackageFromLocalCache = getDataPackageFromLocalCache(
    timestamp,
    dataFeedId
  );
  if (dataPackageFromLocalCache) {
    return { [dataFeedId]: [dataPackageFromLocalCache] };
  }
  return undefined;
};

export const clearDataPackageFromLocalCache = () => {
  localCache = {};
};

export const clearDataPackageFromLocalCacheOlderThan = (
  timeIntervalInMilliseconds: number = ONE_DAY_IN_MILLISECONDS
) => {
  const currentTimestamp = Date.now();
  for (const timestampWithDataFeedId of Object.keys(localCache)) {
    const timestamp = Number(timestampWithDataFeedId.split("-")[0]);
    const timestampsDiff = currentTimestamp - timestamp;
    if (timestampsDiff > timeIntervalInMilliseconds) {
      delete localCache[timestampWithDataFeedId];
    }
  }
};
