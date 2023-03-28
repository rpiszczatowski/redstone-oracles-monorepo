import { DataPackage } from "../src/data-packages/data-packages.model";
import { ALL_FEEDS_KEY } from "../src/data-packages/data-packages.service";
import mongoose from "mongoose";
import config from "../src/config";

// USAGE: yarn run-ts scripts/wait-for-data-packages.ts <expected-count> <data-feed-id>

// Note! This script is used only in monorepo integration tests

const INTERVAL_MILLISECONDS = 5000; // 5 seconds
const DATA_FEED_ID = process.argv[3] || ALL_FEEDS_KEY;
const EXPECTED_COUNT = parseInt(process.argv[2]);

let timer: NodeJS.Timer;

main();

async function main() {
  await mongoose.connect(config.mongoDbUrl);
  console.log("MongoDB connected");

  await checkDataPackagesCount();
  timer = setInterval(checkDataPackagesCount, INTERVAL_MILLISECONDS);
}

async function checkDataPackagesCount() {
  const dataPackagesCount = await queryDataPackages(DATA_FEED_ID);
  console.log(`Fetched data packages count: ${dataPackagesCount}`);
  if (dataPackagesCount >= EXPECTED_COUNT) {
    console.log(`Expected data packages count reached: ${EXPECTED_COUNT}`);
    await mongoose.connection.close();
    console.log(`MongoDB connection closed`);
    if (timer) {
      clearInterval(timer);
    }
  }
}

async function queryDataPackages(dataFeedId: string) {
  const dataPackages = await DataPackage.find({ dataFeedId });
  return dataPackages.length;
}
