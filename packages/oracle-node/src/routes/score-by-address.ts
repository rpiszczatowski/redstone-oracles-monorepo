import express from "express";
import { utils } from "ethers";
import { Consola } from "consola";
import {
  prepareMessageToSign,
  ScoreType,
  signOnDemandDataPackage,
} from "redstone-protocol";
import { NodeConfig } from "../types";
import { stringifyError } from "../utils/error-stringifier";
import {
  recordRequestSentByAddress,
  hasAddressReachedRateLimit,
} from "./services/RateLimitingService";
import { determineAddressLevelByCoinbaseData } from "../on-demand/CoinbaseKyd";
import * as ScoreByAddress from "./score-by-address";

const logger = require("../utils/logger")("score-by-address") as Consola;

interface Payload {
  signature: string;
  timestamp: string;
  scoreType: ScoreType;
}

const TEN_MINUTES_IN_MILLISECONDS = 10 * 60 * 1000;

export const setScoreByAddressRoute = (
  app: express.Application,
  nodeConfig: NodeConfig
) => {
  app.get("/score-by-address", async (req, res) => {
    try {
      logger.info("Requested score by address");
      const params = req.query as unknown as Payload;
      const { timestamp, signature, scoreType } = params;
      verifyPayload(timestamp, signature, scoreType);
      const address = recoverAddressFromSignature(timestamp, signature);
      const currentTimestamp = verifyTimestamp(Number(timestamp));
      verifyAddress(address);
      recordRequestSentByAddress(address, currentTimestamp);

      const signedDataPackage = await getSignedDataPackage(
        address,
        currentTimestamp,
        nodeConfig.privateKeys.ethereumPrivateKey,
        scoreType
      );

      res.json(signedDataPackage.toObj());
    } catch (error: any) {
      const errText = stringifyError(error.message);
      res.status(400).json({
        error: errText,
      });
    }
  });
};

const verifyPayload = (
  timestamp: string,
  signature: string,
  scoreType: ScoreType
) => {
  if (!(timestamp && signature && scoreType)) {
    throw new Error("Invalid request, missing parameter");
  }
};

const recoverAddressFromSignature = (timestamp: string, signature: string) => {
  const message = prepareMessageToSign(Number(timestamp));
  return utils.verifyMessage(message, signature);
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

export const fetchScoreForAddress = async (
  address: string,
  scoreType: ScoreType
): Promise<number> => {
  logger.info(`Fetching score data for address: ${address}`);
  let fetchedData: number | null = null;
  switch (scoreType) {
    case "coinbase-kyd": {
      fetchedData = await determineAddressLevelByCoinbaseData(address);
      break;
    }
    default:
      throw new Error("Invalid score type request");
  }
  logger.info(
    `Fetched score data for address ${address}: ${JSON.stringify(fetchedData)}`
  );
  return fetchedData;
};

const getSignedDataPackage = async (
  address: string,
  timestamp: number,
  privateKey: string,
  scoreType: ScoreType
) => {
  const score = await ScoreByAddress.fetchScoreForAddress(address, scoreType);

  return signOnDemandDataPackage(address, score, timestamp, privateKey);
};
