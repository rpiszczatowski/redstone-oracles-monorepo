import {
  CachedDataPackage,
  DataPackage,
} from "../../cache-service/src/data-packages/data-packages.model";
import { calculateDeviationPercent } from "../../utils/src/math/index";
import mongoose from "mongoose";
import axios from "axios";
import "dotenv/config";

const mongoDbUrl = process.env.MONGO_DB_URL || "";

// USAGE: ts-node scripts/analyze-data-packages.ts

const THRESHOLDS = [1, 0.5, 0.2, 0.1]; // in percent
const DATA_SERVICE_ID = "redstone-avalanche-prod";
const API_PROVIDER = "redstone-avalanche"; // redstone-rapid
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

interface DataPackagesGroupedBySigner {
  [signer: string]: CachedDataPackage[];
}

interface DataPoint {
  value: string | number;
}

interface DataPackage {
  dataPoints: DataPoint[];
}

interface DeviationData {
  [signer: string]: number;
}

interface DeviationsPerThreshold {
  [threshold: number]: DeviationData;
}

interface PriceData {
  provider: string;
  value: number;
  timestamp: number;
}

async function main(symbol: string, period: number = 30) {
  const END_TIMESTAMP = Date.now();
  const START_TIMESTAMP = END_TIMESTAMP - period * DAY_IN_MILLISECONDS;
  await analyzeApiData(symbol, period, START_TIMESTAMP, END_TIMESTAMP);
  await analyzeDatabaseData(symbol, period, START_TIMESTAMP, END_TIMESTAMP);
}

function calculateDeviationsCount(
  dataPackages: DataPackage[],
  threshold: number
): number {
  let currentValue: number | string | undefined;
  let deviationsCount = 0;
  for (const dataPackage of dataPackages) {
    for (const dataPoint of dataPackage.dataPoints) {
      const newValue = dataPoint.value;
      if (currentValue !== undefined) {
        if (
          calculateDeviationPercent({ prevValue: currentValue, newValue }) >
          threshold
        ) {
          deviationsCount++;
          currentValue = newValue;
        }
      }
    }
  }
  return deviationsCount;
}

function calculateDeviationsPerThreshold(dataPackagesBySigner: {
  [signer: string]: DataPackage[];
}): DeviationsPerThreshold {
  const deviationsPerThreshold: DeviationsPerThreshold = {};
  for (const threshold of THRESHOLDS) {
    deviationsPerThreshold[threshold] = {};
    for (const [signerAddress, dataPackages] of Object.entries(
      dataPackagesBySigner
    )) {
      const deviationsCount = calculateDeviationsCount(dataPackages, threshold);
      deviationsPerThreshold[threshold][signerAddress] = deviationsCount;
      console.log(
        `Deviations count for threshold ${threshold}% and signer ${signerAddress}: ${deviationsCount}`
      );
    }
  }
  return deviationsPerThreshold;
}

function printAverageDeviationsPerDay(
  deviationsPerThreshold: DeviationsPerThreshold,
  periodInDays: number
) {
  for (const threshold of Object.keys(deviationsPerThreshold).map(Number)) {
    console.log(`\nAverage deviations per day for threshold ${threshold}%:`);
    for (const [signerAddress, deviationsCount] of Object.entries(
      deviationsPerThreshold[threshold]
    )) {
      const averageDeviationsPerDay = deviationsCount / periodInDays;
      console.log(
        `${signerAddress}: ${averageDeviationsPerDay.toFixed(2)} deviations/day`
      );
    }
  }
}

async function analyzeDatabaseData(
  symbol: string,
  periodInDays: number,
  startTimestamp: number,
  endTimestamp: number
) {
  await mongoose.connect(mongoDbUrl);
  console.log("MongoDB connected");
  const dataPackagesBySigner: DataPackagesGroupedBySigner =
    await queryDataPackagesGroupedBySigner(
      symbol,
      startTimestamp,
      endTimestamp
    );
  const deviationsPerThreshold: DeviationsPerThreshold =
    calculateDeviationsPerThreshold(dataPackagesBySigner);
  printAverageDeviationsPerDay(deviationsPerThreshold, periodInDays);
  await mongoose.disconnect();
}

function groupAndSortDataPackages(
  dataPackages: CachedDataPackage[]
): DataPackagesGroupedBySigner {
  const groupedBySigner: DataPackagesGroupedBySigner = {};
  for (const dataPackage of dataPackages) {
    if (!groupedBySigner[dataPackage.signerAddress]) {
      groupedBySigner[dataPackage.signerAddress] = [];
    }
    groupedBySigner[dataPackage.signerAddress].push(dataPackage);
  }

  for (const [signerAddress, dataPackages] of Object.entries(groupedBySigner)) {
    groupedBySigner[signerAddress] = dataPackages.sort(
      (a, b) => b.timestampMilliseconds - a.timestampMilliseconds
    );
  }
  return groupedBySigner;
}

// TODO: Limited query for example 3000 data packages OR only [timestamp, value] returned.
async function queryDataPackagesGroupedBySigner(
  symbol: string,
  START_TIMESTAMP: number,
  END_TIMESTAMP: number
): Promise<DataPackagesGroupedBySigner> {
  const dataPackages = await DataPackage.find(
    {
      timestampMilliseconds: {
        $gte: START_TIMESTAMP,
        $lte: END_TIMESTAMP,
      },
      dataFeedId: symbol,
      dataServiceId: DATA_SERVICE_ID,
    },
    { timestampMilliseconds: 1, signerAddress: 1, dataPoints: 1 }
  );
  const groupedBySigner: DataPackagesGroupedBySigner =
    groupAndSortDataPackages(dataPackages);
  return groupedBySigner;
}

async function analyzeApiData(
  symbol: string,
  periodInDays: number,
  startTimestamp: number,
  endTimestamp: number
) {
  const prices = await queryRedstoneDataPackagesGroupedBySigner(
    symbol,
    periodInDays,
    startTimestamp,
    endTimestamp
  );
  handleDeviationsCalculationsFromApi(prices, periodInDays);
}

async function queryRedstoneDataPackagesGroupedBySigner(
  symbol: string,
  periodInDays: number,
  startTimestamp: number,
  endTimestamp: number
): Promise<PriceData[]> {
  const TIMESTAMPS_INTERVAL = periodInDays * DAY_IN_MILLISECONDS;
  const DATA_SERVICE_INTERVAL = 60 * 1000;
  const pricesExpectedCount = TIMESTAMPS_INTERVAL / DATA_SERVICE_INTERVAL;
  const apiLimit = 3000;
  const chunksCount = Math.floor(pricesExpectedCount / apiLimit);
  const fetchFromApi = async (index: number) => {
    return await axios.get("https://api.redstone.finance/prices", {
      params: {
        symbol: symbol,
        provider: API_PROVIDER,
        startTimestamp,
        endTimestamp,
        limit: TIMESTAMPS_INTERVAL / DATA_SERVICE_INTERVAL,
        offset: index * apiLimit,
      },
    });
  };

  const allPrices: any[] = [];
  for (const index of [...Array(chunksCount).keys()]) {
    try {
      const response = await fetchFromApi(index);
      allPrices.push(...response.data);
    } catch (error) {
      console.log("Error fetching from API, retrying...");
      const response = await fetchFromApi(index);
      allPrices.push(...response.data);
    }
  }
  console.log(`Fetched ${allPrices.length} prices from API`);
  allPrices.sort((a, b) => a.timestamp - b.timestamp);
  return allPrices;
}

interface DeviationsCount {
  [threshold: number]: number;
}

function calculateDeviationsCountForThresholds(
  prices: PriceData[]
): DeviationsCount {
  const deviationsCount: DeviationsCount = {};
  for (const threshold of THRESHOLDS) {
    deviationsCount[threshold] = 0;
    let currentValue: number | string = prices[0].value;
    for (const price of prices) {
      if (
        calculateDeviationPercent({
          prevValue: currentValue,
          newValue: price.value,
        }) > threshold
      ) {
        deviationsCount[threshold]++;
        currentValue = price.value;
      }
    }
  }
  return deviationsCount;
}

function handleDeviationsCalculationsFromApi(
  prices: PriceData[],
  periodInDays: number
) {
  if (prices.length === 0) {
    console.log("No prices found from API");
    return;
  }
  const deviationsCount: DeviationsCount =
    calculateDeviationsCountForThresholds(prices);

  for (const threshold of THRESHOLDS) {
    const deviationsPerDay = deviationsCount[threshold] / periodInDays;
    console.log(
      `Average deviations per day for threshold ${threshold}%: ${deviationsPerDay.toFixed(
        2
      )}`
    );
  }
}

const symbol: string = process.argv[2];
const periodInDaysArg = process.argv[3];
const periodInDays: number = periodInDaysArg ? parseInt(periodInDaysArg) : 30;

main(symbol, periodInDays);
