import axios from "axios";
import { RedstoneTypes } from "@redstone-finance/utils";
import loggerFactory from "../utils/logger";
import { HardLimitsSchema } from "./hard-limit-schema";

const logger = loggerFactory("HardLimitsFetcher");

const ONE_HOUR_IN_MILLISECONDS = 1000 * 60 * 60;
const HARD_LIMITS_MAX_ALLOWED_DELAY_HOURS = 3;
const HARD_LIMITS_MAX_ALLOWED_DELAY_MILLISECONDS =
  ONE_HOUR_IN_MILLISECONDS * HARD_LIMITS_MAX_ALLOWED_DELAY_HOURS;

export const fetchHardLimitsForDataFeeds = async (
  hardLimitsUrls: string[]
): Promise<RedstoneTypes.HardLimitsWithTimestamp> => {
  if (hardLimitsUrls.length === 0) {
    return {};
  }

  for (let urlIndex = 0; urlIndex < hardLimitsUrls.length; urlIndex++) {
    const url = hardLimitsUrls[urlIndex];
    try {
      const response =
        await axios.get<RedstoneTypes.HardLimitsWithTimestamp>(url);
      const responseData = response.data;
      HardLimitsSchema.parse(responseData);
      const isRecentEnough = validateLastUpdatedTimestamp(responseData);
      if (!isRecentEnough) {
        logStaleHardLimits(responseData, url, urlIndex, hardLimitsUrls.length);
        continue;
      }
      logSuccessfulFetching(responseData, url);
      return responseData;
    } catch (e) {
      logFailedFetching(url, urlIndex, hardLimitsUrls.length);
    }
  }

  logFailedFetchingFromAllUrls(hardLimitsUrls);
  // Despite not fetching hard limits we still want to deliver prices
  return {};
};

const validateLastUpdatedTimestamp = (
  data: RedstoneTypes.HardLimitsWithTimestamp
) => {
  const currentTimestamp = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const lastUpdateTimestamp = data[RedstoneTypes.LAST_UPDATED_TIMESTAMP_SYMBOL];
  if (!lastUpdateTimestamp) {
    return false;
  }
  const timestampsDiff = currentTimestamp - lastUpdateTimestamp;
  return timestampsDiff < HARD_LIMITS_MAX_ALLOWED_DELAY_MILLISECONDS;
};

const logStaleHardLimits = (
  data: RedstoneTypes.HardLimitsWithTimestamp,
  url: string,
  urlIndex: number,
  urlsCount: number
) => {
  const olderThanMessage = `(older than ${HARD_LIMITS_MAX_ALLOWED_DELAY_HOURS})`;
  const stringifiedData = JSON.stringify(data, null, 2);
  const attemptMessage = `(${urlIndex + 1}/${urlsCount} attempt)`;
  const message = `Fetched outdated ${olderThanMessage} hard limits ${stringifiedData} from ${url} ${attemptMessage}`;
  logger.warn(message);
};

const logSuccessfulFetching = (
  data: RedstoneTypes.HardLimitsWithTimestamp,
  url: string
) => {
  const stringifiedData = JSON.stringify(data, null, 2);
  const message = `Fetched hard limits ${stringifiedData} from ${url}`;
  logger.info(message);
};

const logFailedFetching = (
  url: string,
  urlIndex: number,
  urlsCount: number
) => {
  const attemptMessage = `(${urlIndex + 1}/${urlsCount} attempt)`;
  const message = `Failed to fetch hard limits from ${url} ${attemptMessage}`;
  logger.warn(message);
};

const logFailedFetchingFromAllUrls = (hardLimitsUrls: string[]) => {
  const urlsJoined = hardLimitsUrls.join(", ");
  const message = `Failed to fetch hard limits from all URLs: ${urlsJoined}, proceeding without hard limits validation`;
  logger.warn(message);
};
