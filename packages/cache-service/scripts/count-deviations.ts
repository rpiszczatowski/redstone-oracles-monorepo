import axios from "axios";
import _ from "lodash";
import { CachedDataPackage } from "src/data-packages/data-packages.model";
import config from "../src/config";
import { fetchDataPackages, getDeviationPercentage } from "./common";

const END_TIMESTAMP = Date.now();
const TIMESTAMPS_INTERVAL = 20 * 24 * 60 * 60 * 1000;
const START_TIMESTAMP = END_TIMESTAMP - TIMESTAMPS_INTERVAL;
const TIMESTAMP_GRANULATION = 1000;
const DATA_SERVICE_INTERVAL = 60 * 1000;
const DATA_SERVICE_TIMESTAMP_GRANULATION =
  TIMESTAMP_GRANULATION / DATA_SERVICE_INTERVAL;
const DEVIATION_LIMIT = 0.01;

(async () => {
  const dataPackages = await fetchDataPackages(config.mongoDbUrl, {
    startTimestamp: START_TIMESTAMP,
    endTimestamp: END_TIMESTAMP,
    dataServiceId: "redstone-main-demo",
    dataFeedId: "IB01.L",
  });

  // const pricesFromApi = await fetchPricesFromApi(
  //   START_TIMESTAMP,
  //   END_TIMESTAMP
  // );

  const { deviationsWithGranulation, deviationsWithoutGranulation } =
    await countDeviationsBiggerThanLimitAndFindMax(dataPackages);
  console.log(
    `Found ${deviationsWithGranulation} deviations with granulation ${TIMESTAMP_GRANULATION} milliseconds bigger than limit`
  );
  console.log(
    `Found ${deviationsWithoutGranulation} deviations without granulation bigger than limit`
  );
})();

async function countDeviationsBiggerThanLimitAndFindMax(prices: any[]) {
  console.log(`Counting deviations bigger than ${DEVIATION_LIMIT}`);
  const deviationsWithGranulation = handleDeviationsCalculationsFromDb(
    prices,
    DATA_SERVICE_TIMESTAMP_GRANULATION
  );
  const deviationsWithoutGranulation = handleDeviationsCalculationsFromDb(
    prices,
    1
  );
  return { deviationsWithGranulation, deviationsWithoutGranulation };
}

async function fetchPricesFromApi(fromTimestamp: number, toTimestamp: number) {
  console.log("Fetching prices from API");
  const pricesExpectedCount = TIMESTAMPS_INTERVAL / DATA_SERVICE_INTERVAL;
  const apiLimit = 3000;
  const chunksCount = Math.floor(pricesExpectedCount / apiLimit);

  const fetchFromApi = async (index: number) => {
    return await axios.get("https://api.redstone.finance/prices", {
      params: {
        symbol: "VST",
        provider: "redstone-rapid",
        fromTimestamp,
        toTimestamp,
        limit: TIMESTAMPS_INTERVAL / DATA_SERVICE_INTERVAL,
        offset: index * apiLimit,
      },
    });
  };

  const allPrices = [];
  for (const index of [...Array(chunksCount).keys()]) {
    try {
      const response = await fetchFromApi(index);
      allPrices.push(...response.data);
    } catch (error) {
      console.log("Error");
      const response = await fetchFromApi(index);
      allPrices.push(...response.data);
    }
  }
  console.log(`Fetched ${allPrices.length} prices from API`);
  return allPrices;
}

function handleDeviationsCalculationsFromApi(
  prices: any[],
  granulation: number
) {
  let index = 0;
  let deviationsBiggerThanLimitCount = 0;
  let lastValue = prices[index * granulation].source["curve-frax"];
  while (!!prices[index * granulation] && !!prices[(index + 1) * granulation]) {
    const currentValue = prices[index * granulation].source["curve-frax"];
    if (!currentValue) {
      index += 1;
      continue;
    }
    const deviation = getDeviationPercentage(
      Number(currentValue),
      Number(lastValue)
    );
    if (deviation >= DEVIATION_LIMIT) {
      lastValue = Number(currentValue);
      deviationsBiggerThanLimitCount += 1;
    }
    index += 1;
  }
  return deviationsBiggerThanLimitCount;
}

function handleDeviationsCalculationsFromDb(
  dataPackages: CachedDataPackage[],
  granulation: number
) {
  let index = 0;
  let deviationsBiggerThanLimitCount = 0;
  let lastValue = dataPackages[index * granulation].dataPoints[0].value;
  while (
    !!dataPackages[index * granulation] &&
    !!dataPackages[(index + 1) * granulation]
  ) {
    const currentValue = dataPackages[index * granulation].dataPoints[0].value;
    const deviation = getDeviationPercentage(
      Number(currentValue),
      Number(lastValue)
    );
    if (deviation >= DEVIATION_LIMIT) {
      lastValue = Number(currentValue);
      deviationsBiggerThanLimitCount += 1;
    }
    index += 1;
  }
  return deviationsBiggerThanLimitCount;
}
