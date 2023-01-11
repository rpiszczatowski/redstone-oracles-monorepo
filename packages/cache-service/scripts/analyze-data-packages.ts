import {
  CachedDataPackage,
  DataPackage,
} from "../src/data-packages/data-packages.model";
import { ALL_FEEDS_KEY } from "../src/data-packages/data-packages.service";
import mongoose from "mongoose";
import config from "../src/config";

// USAGE: yarn run-ts scripts/analyze-data-packages.ts

const START_TIMESTAMP = Date.now() - 3 * 60 * 1000;
const END_TIMESTAMP = Date.now();
const DATA_SERVICE_ID = "redstone-avalanche-prod";
const MIN_DEVIATION_PERCENTAGE_TO_LOG = 0.1;

interface DataPackagesGroupedBySigner {
  [signer: string]: CachedDataPackage[];
}

main();

async function main() {
  await mongoose.connect(config.mongoDbUrl);
  console.log("MongoDB connected");
  const dataPackagesBySigner = await queryDataPackagesGroupedBySigner();
  for (const [signerAddress, dataPackages] of Object.entries(
    dataPackagesBySigner
  )) {
    console.log(`\n\n\n==== ${signerAddress} ====`);
    const sortedDataPackages = dataPackages.sort(
      (a, b) => b.timestampMilliseconds - a.timestampMilliseconds
    );

    let lastTimestamp = 0;
    const prevValues: { [id: string]: string | number } = {};
    for (const dataPackage of sortedDataPackages) {
      const timestamp = dataPackage.timestampMilliseconds;
      const diff = lastTimestamp ? lastTimestamp - timestamp : undefined;
      lastTimestamp = timestamp;

      const timestampFromId = new Date(
        (dataPackage as any)._id.getTimestamp()
      ).getTime();

      const timestampFromIdDiff = timestampFromId - timestamp;

      console.log(`\nTime: ${formatTime(timestamp)}. Diff: ${diff}`);

      console.log(`Data points count: ${dataPackage.dataPoints.length}`);

      if (dataPackage.dataPoints.length < 32) {
        console.log(dataPackage.dataPoints);
      }

      if (timestampFromIdDiff > 10000) {
        console.log(`Timestamp from id diff: ${timestampFromIdDiff}`);
      }

      for (const dataPoint of dataPackage.dataPoints) {
        if (prevValues[dataPoint.dataFeedId]) {
          const deviation = getDeviationPercentage(
            Number(dataPoint.value),
            Number(prevValues[dataPoint.dataFeedId])
          );
          if (deviation > MIN_DEVIATION_PERCENTAGE_TO_LOG) {
            console.log(`Deviation for ${dataPoint.dataFeedId}: ${deviation}`);
          }
        }
        prevValues[dataPoint.dataFeedId] = dataPoint.value;
      }
    }
  }
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toISOString();
}

async function queryDataPackagesGroupedBySigner(): Promise<DataPackagesGroupedBySigner> {
  const dataPackages = await DataPackage.find(
    {
      timestampMilliseconds: {
        $gte: START_TIMESTAMP,
        $lte: END_TIMESTAMP,
      },
      dataFeedId: ALL_FEEDS_KEY,
      dataServiceId: DATA_SERVICE_ID,
    },
    { timestampMilliseconds: 1, signerAddress: 1, dataPoints: 1 }
  );

  const groupedBySigner: DataPackagesGroupedBySigner = {};

  for (const dataPackage of dataPackages) {
    if (!groupedBySigner[dataPackage.signerAddress]) {
      groupedBySigner[dataPackage.signerAddress] = [];
    }
    groupedBySigner[dataPackage.signerAddress].push(dataPackage);
  }

  return groupedBySigner;
}

function getDeviationPercentage(a: number, b: number) {
  return Math.abs((a - b) / Math.min(a, b)) * 100;
}
