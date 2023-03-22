import mongoose from "mongoose";
import { ALL_FEEDS_KEY } from "../src/data-packages/data-packages.service";
import config from "../src/config";
import {
  formatTime,
  getDeviationPercentage,
  groupDataPackagesByField,
  queryDataPackages,
} from "./commons";
import { DataPointPlainObj } from "redstone-protocol";
import { CachedDataPackage } from "src/data-packages/data-packages.model";

// USAGE: yarn run-ts scripts/analyze-data-packages.ts

interface TimestampConfig {
  startTimestamp: number;
  endTimestamp: number;
}

/* 
  Because we want to compare big time periods f.g. 14 days
  we need to split it into one day batches. 
  If you want to compare shorter periods than 1 day define DAYS = 1,
  and TIMESTAMPS_DIFFERENCE_IN_MILLISECONDS to expected time period f.g. 1 hour.
*/
const TIMESTAMPS_DIFFERENCE_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const CURRENT_TIMESTAMP = Date.now();
const DAYS = 2;
const FIRST_DATA_SERVICE_ID = "redstone-avalanche-demo";
const SECOND_DATA_SERVICE_ID = "redstone-avalanche-prod";
const MIN_DEVIATION_PERCENTAGE_TO_LOG = 3;

(async () => {
  console.log(`Start time: ${formatTime(Date.now())}`);
  console.log(`Comparing prices from ${DAYS} days`);

  const timestampsConfigs = defineTimestampsConfigs();

  for (const timestampConfig of timestampsConfigs) {
    const { dataPackagesFromFirst, dataPackagesFromSecond } =
      await fetchDataPackagesFromBothMongoDbs(timestampConfig);
    if (
      dataPackagesFromFirst.length === 0 ||
      dataPackagesFromSecond.length === 0
    ) {
      console.log(
        "Data packages from first or second are empty, finishing process"
      );
      process.exit(0);
    }

    const dataPackagesFromFirstByTimestamp = groupDataPackagesByField(
      dataPackagesFromFirst,
      "timestampMilliseconds"
    );

    const dataPackagesFromSecondByTimestamp = groupDataPackagesByField(
      dataPackagesFromSecond,
      "timestampMilliseconds"
    );

    for (const [timestamp, dataPackagesFromFirst] of Object.entries(
      dataPackagesFromFirstByTimestamp
    )) {
      const dataPackagesFromSecond =
        dataPackagesFromSecondByTimestamp[timestamp];
      const timestampAsNumber = Number(timestamp);

      for (const dataPackageFromFirst of dataPackagesFromFirst) {
        const allDataPoints = dataPackageFromFirst.dataPoints;

        const uniqueDataPointsFromFirst = getSetOfDataPoints(allDataPoints);
        const warnings = compareDataPointsFromFirstAndSecond(
          allDataPoints,
          dataPackagesFromSecond,
          timestampAsNumber,
          uniqueDataPointsFromFirst
        );

        if (warnings.length > 0) {
          console.log(`\n==== ${formatTime(timestampAsNumber)} ====`);
          warnings.forEach((warning) => console.log(warning));
        }
      }
    }
  }
  console.log(`End time: ${formatTime(Date.now())}`);
})();

function defineTimestampsConfigs(): TimestampConfig[] {
  return [...Array(DAYS).keys()].map((index) => ({
    startTimestamp:
      CURRENT_TIMESTAMP - TIMESTAMPS_DIFFERENCE_IN_MILLISECONDS * (index + 1),
    endTimestamp:
      CURRENT_TIMESTAMP - TIMESTAMPS_DIFFERENCE_IN_MILLISECONDS * index,
  }));
}

async function fetchDataPackagesFromBothMongoDbs(
  timestampConfig: TimestampConfig
) {
  const dataPackagesFromFirst = await fetchDataPackages(
    config.mongoDbUrl,
    timestampConfig,
    FIRST_DATA_SERVICE_ID
  );
  console.log(
    `Fetched from first Mongo ${dataPackagesFromFirst.length} data packages`
  );

  const secondMongoDbUrl = process.env.SECOND_MONGO_DB_URL;
  if (!secondMongoDbUrl) {
    throw new Error("Missing second Mongodb URL");
  }
  const dataPackagesFromSecond = await fetchDataPackages(
    secondMongoDbUrl,
    timestampConfig,
    SECOND_DATA_SERVICE_ID
  );
  console.log(
    `Fetched from second Mongo ${dataPackagesFromSecond.length} data packages`
  );
  return { dataPackagesFromFirst, dataPackagesFromSecond };
}

async function fetchDataPackages(
  mongoDbUrl: string,
  timestampConfig: TimestampConfig,
  dataServiceId: string
) {
  const mongoConnection = await mongoose.connect(mongoDbUrl);
  console.log("MongoDB connected");
  const dataPackages = await queryDataPackages({
    startTimestamp: timestampConfig.startTimestamp,
    endTimestamp: timestampConfig.endTimestamp,
    dataFeedId: ALL_FEEDS_KEY,
    dataServiceId: dataServiceId,
  });
  await mongoConnection.disconnect();
  console.log("MongoDB disconnected");
  return dataPackages;
}

function compareDataPointsFromFirstAndSecond(
  allDataPoints: DataPointPlainObj[],
  dataPackagesFromSecond: CachedDataPackage[],
  timestamp: number,
  uniqueDataPointsFromFirst: Set<string>
) {
  const warnings = [];
  for (const dataPoint of allDataPoints) {
    const dataPointsFromSecond = getDataPointsFromSecond(
      dataPackagesFromSecond,
      dataPoint.dataFeedId,
      timestamp,
      uniqueDataPointsFromFirst
    );
    const deviations = dataPointsFromSecond.map(({ value }) =>
      getDeviationPercentage(Number(value), Number(dataPoint.value))
    );
    const maxDeviation = Math.max(...deviations);
    if (maxDeviation > MIN_DEVIATION_PERCENTAGE_TO_LOG) {
      warnings.push(
        `Max deviation for ${
          dataPoint.dataFeedId
        }: ${maxDeviation}, timestamp: ${formatTime(timestamp)}`
      );
    }
  }
  return warnings;
}

function getDataPointsFromSecond(
  dataPackagesFromSecond: CachedDataPackage[],
  dataFeedId: string,
  timestamp: number,
  uniqueDataPointsFromFirst: Set<string>
) {
  const dataPointsFromSecond = [];
  for (const dataPackageFromSecond of dataPackagesFromSecond) {
    const uniqueDataPointsFromSecond = getSetOfDataPoints(
      dataPackageFromSecond.dataPoints
    );

    compareDataPointsSets(
      uniqueDataPointsFromFirst,
      uniqueDataPointsFromSecond,
      timestamp
    );

    dataPointsFromSecond.push(
      ...findDataPointsFromSecondByDataFeedId(dataPackageFromSecond, dataFeedId)
    );
  }
  return dataPointsFromSecond;
}

function findDataPointsFromSecondByDataFeedId(
  dataPackageFromSecond: CachedDataPackage,
  dataFeedId: string
) {
  const dataPointsToAdd = [];
  for (const dataPointFromSecond of dataPackageFromSecond.dataPoints) {
    if (dataPointFromSecond.dataFeedId === dataFeedId) {
      dataPointsToAdd.push(dataPointFromSecond);
    }
  }
  return dataPointsToAdd;
}

function getSetOfDataPoints(dataPoints: DataPointPlainObj[]) {
  return new Set(dataPoints.map(({ dataFeedId }) => dataFeedId));
}

function compareDataPointsSets(
  leftSet: Set<string>,
  rightSet: Set<string>,
  timestamp: number
) {
  const diff = new Set(
    [...leftSet].filter((dataFeedId) => !rightSet.has(dataFeedId))
  );
  const firstSetValue = diff.values().next().value;
  if (diff.size > 1 || firstSetValue !== "DAI") {
    console.log(
      `Data points mismatch, timestamp: ${formatTime(
        timestamp
      )}, difference: ${[...diff]}`
    );
  }
}
