import { Consola } from "consola";

const logger = require("../../utils/logger")("score-by-address") as Consola;

export interface RecordedAddresses {
  [address: string]: { timestamps: number[] };
}

const RATE_LIMIT_INTERVAL_MILLISECONDS = 60 * 60 * 1000;
const MAX_NUMBER_OF_REQUESTS = 5;

let recordedAddresses: RecordedAddresses = {};

export const getRecordedAddresses = () => recordedAddresses;

export const recordRequestSentByAddress = (
  address: string,
  timestamp: number
) => {
  logger.info(`Recorded request from ${address}`);
  if (!recordedAddresses[address]?.timestamps) {
    recordedAddresses[address] = { timestamps: [] };
  }
  recordedAddresses[address].timestamps.push(timestamp);
  clearOutdatedTimestampsByAddress(address);
};

const clearOutdatedTimestampsByAddress = (address: string) => {
  logger.info(`Clearing outdated timestamps for ${address}`);
  const addressTimestamps = recordedAddresses[address]?.timestamps ?? [];
  const currentTimestamp = Date.now();
  recordedAddresses[address] = {
    timestamps: addressTimestamps.filter(
      (timestamp) =>
        currentTimestamp - timestamp < RATE_LIMIT_INTERVAL_MILLISECONDS
    ),
  };
};

export const hasAddressReachedRateLimit = (addressFromMessage: string) => {
  const addressDetails = recordedAddresses[addressFromMessage];
  return Boolean(addressDetails?.timestamps.length >= MAX_NUMBER_OF_REQUESTS);
};

export const clearRecordedAddresses = () => {
  recordedAddresses = {};
};
