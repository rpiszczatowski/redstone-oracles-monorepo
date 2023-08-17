import axios from "axios";
import { RedstoneTypes } from "redstone-utils";

const HISTORICAL_GATEWAY_URL =
  "https://oracle-gateway-1.b.redstone.finance/data-packages/historical/redstone-primary-demo";
const NODE_INTERVAL = 10000;
const TIME_RANGE_TO_COMPARE = 1000 * 60 * 60 * 24 * 5;
const DATA_FEED_ID = "PREMIA";
const TWAP_DATA_FEED_ID = "PREMIA-TWAP-60";
const VALUES_USED_IN_TWAP = (1000 * 60 * 60) / NODE_INTERVAL;

const roundTimestamp = (timestamp: number): number => {
  return Math.floor(timestamp / NODE_INTERVAL) * NODE_INTERVAL;
};

const fetchDataPackage = async (timestamp: number) => {
  const url = `${HISTORICAL_GATEWAY_URL}/${timestamp}`;
  const dataPackageResponse =
    await axios.get<RedstoneTypes.DataPackageFromCacheResponse>(url);
  return dataPackageResponse.data;
};

(async () => {
  const timestamp = Date.now();
  const offsetCount = Math.floor(TIME_RANGE_TO_COMPARE / NODE_INTERVAL);
  const dataFeedValues: number[] = [];
  const twapValues: number[] = [];
  const dataFeedPoints: { value: number; timestamp: number }[] = [];

  for (let offset = 0; offset < offsetCount; offset++) {
    const newTimestamp = timestamp - offset * NODE_INTERVAL;
    const roundedTimestamp = roundTimestamp(newTimestamp);
    const dataPackage = await fetchDataPackage(roundedTimestamp);

    const dataFeedValue =
      dataPackage[DATA_FEED_ID]?.[0]?.dataPoints?.[0]?.value;
    const dataFeedTimestamp =
      dataPackage[DATA_FEED_ID]?.[0]?.timestampMilliseconds;
    const twapValue =
      dataPackage[TWAP_DATA_FEED_ID]?.[0]?.dataPoints?.[0]?.value;
    dataFeedValues.push(dataFeedValue);
    dataFeedPoints.push({ value: dataFeedValue, timestamp: dataFeedTimestamp });
    twapValues.push(twapValue);

    if (dataFeedValues.length > VALUES_USED_IN_TWAP) {
      const dataFeedsValuesToCompare = dataFeedValues.slice(
        offset - VALUES_USED_IN_TWAP
      );
      const validDataFeedsValuesToCompare = dataFeedsValuesToCompare.filter(
        (value) => !!value
      );

      const twapValue = twapValues[offset - VALUES_USED_IN_TWAP];

      const maxValueInDataFeedValues = Math.max(
        ...validDataFeedsValuesToCompare
      );
      const minValueInDataFeedValues = Math.min(
        ...validDataFeedsValuesToCompare
      );
      if (twapValue > maxValueInDataFeedValues) {
        console.log(
          `TWAP value bigger than max data feed for ${roundedTimestamp} - twap: ${twapValue}, max data feed: ${maxValueInDataFeedValues}`
        );
      } else if (twapValue < minValueInDataFeedValues) {
        console.log(
          `TWAP value smaller than min data feed for ${roundedTimestamp} - twap: ${twapValue}, min data feed: ${minValueInDataFeedValues}`
        );
      } else {
        console.log(
          `Twap value: ${twapValue}, max data feed: ${maxValueInDataFeedValues}, min data feed: ${minValueInDataFeedValues}`
        );
      }
    }
  }
})();
