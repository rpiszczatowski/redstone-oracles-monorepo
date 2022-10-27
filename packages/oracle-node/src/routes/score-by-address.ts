import express from "express";
import axios from "axios";
import { utils } from "ethers";
import { Consola } from "consola";
import { DataPackage, NumericDataPoint } from "redstone-protocol";
import { NodeConfig } from "../types";
import { stringifyError } from "../utils/error-stringifier";
import {
  recordRequestSentByAddress,
  hasAddressReachedRateLimit,
} from "./services/RateLimitingService";

const logger = require("../utils/logger")("score-by-address") as Consola;

interface Payload {
  signature: string;
  timestamp: string;
}

const URL = "";
const DEFAULT_TIMEOUT_MILLISECONDS = 10000;
const TEN_MINUTES_IN_MILLISECONDS = 10 * 60 * 1000;

export const setScoreByAddressRoute = (
  app: express.Application,
  nodeConfig: NodeConfig
) => {
  app.get("/score-by-address", async (req, res) => {
    try {
      logger.info("Requested score by address");
      const params = req.query as unknown as Payload;
      const { timestamp, signature } = params;
      verifyPayload(timestamp, signature);
      const address = recoverAddressFromSignature(timestamp, signature);
      const currentTimestamp = verifyTimestamp(Number(timestamp));
      verifyAddress(address);
      recordRequestSentByAddress(address, currentTimestamp);

      const signedDataPackage = await getSignedDataPackage(
        address,
        currentTimestamp,
        nodeConfig.privateKeys.ethereumPrivateKey
      );

      return res.json(signedDataPackage.toObj());
    } catch (error: any) {
      const errText = stringifyError(error.message);
      res.status(400).json({
        error: errText,
      });
    }
  });
};

const verifyPayload = (timestamp: string, signature: string) => {
  if (!(timestamp && signature)) {
    throw new Error("Invalid request, missing parameter");
  }
};

const recoverAddressFromSignature = (timestamp: string, signature: string) => {
  return utils.verifyMessage(timestamp, signature);
};

const verifyTimestamp = (timestamp: number) => {
  const currentTimestamp = Date.now();
  const timestampDifference = currentTimestamp - timestamp;
  const isTimestampValid =
    timestampDifference > 0 &&
    timestampDifference <= TEN_MINUTES_IN_MILLISECONDS;
  if (!isTimestampValid) {
    throw new Error("Invalid timestamp, it should be less than 10 minutes ago");
  }

  return currentTimestamp;
};

const verifyAddress = (address: string) => {
  const isAddressWithoutAccess = hasAddressReachedRateLimit(address);
  if (isAddressWithoutAccess) {
    throw new Error(
      `Address ${address} reached rate limit. Please try in an hour`
    );
  }
};

const fetchScoreForAddress = async (address: string): Promise<number> => {
  logger.info(`Fetching score data for address: ${address}`);
  const response = await axios.get(URL, {
    timeout: DEFAULT_TIMEOUT_MILLISECONDS,
  });
  const fetchedData = response.data;
  logger.info(
    `Fetched score data for address: ${address}: ${JSON.stringify(fetchedData)}`
  );
  return fetchedData as number;
};

const getSignedDataPackage = async (
  address: string,
  timestamp: number,
  privateKey: string
) => {
  const score = await fetchScoreForAddress(address);

  const dataPoint = new NumericDataPoint({
    dataFeedId: address,
    value: score,
  });

  const dataPackage = new DataPackage([dataPoint], timestamp);
  return dataPackage.sign(privateKey);
};
