import mongoose from "mongoose";
import { ALL_FEEDS_KEY } from "../src/data-packages/data-packages.service";
import config from "../src/config";
import {
  formatTime,
  getDeviationPercentage,
  groupDataPackagesByField,
  queryDataPackages,
} from "./commons";

// USAGE: yarn run-ts scripts/analyze-data-packages.ts

/* 
  Because we want to compare big time periods f.g. 14 days
  we need to split it into one day batches. 
  If you want to compare shorter periods defined DAYS = 1,
  and TIMESTAMPS_DIFFERENCE_IN_MILLISECONDS to expected time difference.
*/
const TIMESTAMPS_DIFFERENCE_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const CURRENT_TIMESTAMP = Date.now();
const DAYS = 5;
const FIRST_DATA_SERVICE_ID = "redstone-avalanche-demo";
const SECOND_DATA_SERVICE_ID = "redstone-avalanche-prod";
const MIN_DEVIATION_PERCENTAGE_TO_LOG = 3;

(async () => {
  console.log(`Start time: ${formatTime(Date.now())}`);
  console.log(`Comparing prices from ${DAYS} days`);

  const timestampsConfigs = [...Array(DAYS).keys()].map((index) => ({
    startTimestamp:
      CURRENT_TIMESTAMP - TIMESTAMPS_DIFFERENCE_IN_MILLISECONDS * (index + 1),
    endTimestamp:
      CURRENT_TIMESTAMP - TIMESTAMPS_DIFFERENCE_IN_MILLISECONDS * index,
  }));
  for (const timestampConfig of timestampsConfigs) {
    const firstMongoConnection = await mongoose.connect(config.mongoDbUrl);
    console.log("First MongoDB connected");
    const dataPackagesFromFirst = await queryDataPackages({
      startTimestamp: timestampConfig.startTimestamp,
      endTimestamp: timestampConfig.endTimestamp,
      dataFeedId: ALL_FEEDS_KEY,
      dataServiceId: FIRST_DATA_SERVICE_ID,
    });
    await firstMongoConnection.disconnect();
    console.log(
      `Fetched from first Mongo ${dataPackagesFromFirst.length} data packages`
    );

    const { secondMongoDbUrl } = config;
    if (!secondMongoDbUrl) {
      throw new Error("Missing second Mongodb URL");
    }
    const secondMongoConnection = await mongoose.connect(secondMongoDbUrl);
    console.log("Second MongoDB connected");
    const dataPackagesFromSecond = await queryDataPackages({
      startTimestamp: timestampConfig.startTimestamp,
      endTimestamp: timestampConfig.endTimestamp,
      dataFeedId: ALL_FEEDS_KEY,
      dataServiceId: SECOND_DATA_SERVICE_ID,
    });
    await secondMongoConnection.disconnect();
    console.log(
      `Fetched from second Mongo ${dataPackagesFromSecond.length} data packages`
    );

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

      for (const dataPackageFromFirst of dataPackagesFromFirst) {
        const allDataPoints = dataPackageFromFirst.dataPoints;
        const warnings = [];
        for (const dataPoint of allDataPoints) {
          const dataPointsFromSecond = [];
          for (const dataPackageFromSecond of dataPackagesFromSecond) {
            for (const dataPointFromSecond of dataPackageFromSecond.dataPoints) {
              if (dataPointFromSecond.dataFeedId === dataPoint.dataFeedId) {
                dataPointsFromSecond.push(dataPointFromSecond);
              }
            }
          }

          const deviations = dataPointsFromSecond.map(({ value }) =>
            getDeviationPercentage(Number(value), Number(dataPoint.value))
          );
          const maxDeviation = Math.max(...deviations);
          if (maxDeviation > MIN_DEVIATION_PERCENTAGE_TO_LOG) {
            warnings.push(
              `Max deviation for ${
                dataPoint.dataFeedId
              }: ${maxDeviation}, timestamp: ${formatTime(Number(timestamp))}`
            );
          }
        }
        if (warnings.length > 0) {
          console.log(`\n==== ${formatTime(Number(timestamp))} ====`);
          warnings.forEach((warning) => console.log(warning));
        }
      }
    }
  }
  console.log(`End time: ${formatTime(Date.now())}`);
})();
