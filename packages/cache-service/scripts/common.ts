import mongoose from "mongoose";
import {
  CachedDataPackage,
  DataPackage,
} from "../src/data-packages/data-packages.model";

interface QueryDataPackagesParams {
  startTimestamp: number;
  endTimestamp: number;
  dataFeedId: string;
  dataServiceId: string;
}

interface DataPackagesGroupedByField {
  [signer: string]: CachedDataPackage[];
}

export interface TimestampIntervals {
  startTimestamp: number;
  endTimestamp: number;
}

export async function queryDataPackages({
  startTimestamp,
  endTimestamp,
  dataFeedId,
  dataServiceId,
}: QueryDataPackagesParams): Promise<CachedDataPackage[]> {
  return await DataPackage.find(
    {
      timestampMilliseconds: {
        $gte: startTimestamp,
        $lte: endTimestamp,
      },
      dataFeedId,
      dataServiceId,
    },
    { timestampMilliseconds: 1, signerAddress: 1, dataPoints: 1 }
  ).sort({timestampMilliseconds: 1});
}

export function groupDataPackagesByField(
  dataPackages: CachedDataPackage[],
  field: "signerAddress" | "timestampMilliseconds"
): DataPackagesGroupedByField {
  const groupedBySigner: DataPackagesGroupedByField = {};

  for (const dataPackage of dataPackages) {
    if (!groupedBySigner[dataPackage[field]]) {
      groupedBySigner[dataPackage[field]] = [];
    }
    groupedBySigner[dataPackage[field]].push(dataPackage);
  }

  return groupedBySigner;
}

export function getDeviationPercentage(
  baseValue: number,
  valueToCompare: number,
) {
  const pricesDiff = Math.abs(baseValue - valueToCompare);

  if (baseValue === 0) {
    return Number.MAX_SAFE_INTEGER;
  }

  return (pricesDiff * 100) / baseValue;
};

export function formatTime(timestamp: number) {
  return new Date(timestamp).toISOString();
}

export async function fetchDataPackages(
  mongoDbUrl: string,
  queryParams: QueryDataPackagesParams
) {
  const mongoConnection = await mongoose.connect(mongoDbUrl);
  //console.log("MongoDB connected");
  const dataPackages = await queryDataPackages(queryParams);
  //console.log(`Fetched ${dataPackages.length} data packages`);
  await mongoConnection.disconnect();
  //console.log("MongoDB disconnected");
  return dataPackages;
}
