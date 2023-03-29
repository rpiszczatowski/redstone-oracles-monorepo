import { CachedDataPackage } from "src/data-packages/data-packages.model";
import config from "../src/config";
import { fetchDataPackages, getDeviationPercentage } from "./common";

const END_TIMESTAMP = Date.now();
const START_TIMESTAMP = END_TIMESTAMP - 28 * 24 * 60 * 60 * 1000;
const TIMESTAMP_GRANULATION = 10 * 60 * 1000;
const DATA_SERVICE_INTERVAL = 10 * 1000;
const DATA_SERVICE_TIMESTAMP_GRANULATION =
  TIMESTAMP_GRANULATION / DATA_SERVICE_INTERVAL;
const DEVIATION_LIMIT = 0.1;

(async () => {
  const dataPackages = await fetchDataPackages(config.mongoDbUrl, {
    startTimestamp: START_TIMESTAMP,
    endTimestamp: END_TIMESTAMP,
    dataServiceId: "redstone-rapid-demo",
    dataFeedId: "VST",
  });

  const { deviationsWithGranulation, deviationsWithoutGranulation } =
    countDeviationsBiggerThanLimitAndFindMax(dataPackages);
  console.log(
    `Found ${deviationsWithGranulation} deviations with granulation ${TIMESTAMP_GRANULATION} milliseconds bigger than limit`
  );
  console.log(
    `Found ${deviationsWithoutGranulation} deviations without granulation bigger than limit`
  );
})();

function countDeviationsBiggerThanLimitAndFindMax(
  dataPackages: CachedDataPackage[]
) {
  console.log(`Counting deviations bigger than ${DEVIATION_LIMIT}`);
  const deviationsWithGranulation = handleDeviationsCalculations(
    dataPackages,
    DATA_SERVICE_TIMESTAMP_GRANULATION
  );
  const deviationsWithoutGranulation = handleDeviationsCalculations(
    dataPackages,
    1
  );
  return { deviationsWithGranulation, deviationsWithoutGranulation };
}

function handleDeviationsCalculations(
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
