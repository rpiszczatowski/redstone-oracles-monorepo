import { getLastRoundParamsFromContract } from "./core/contract-interactions/get-last-round-params";
import { requestDataPackages, ValuesForDataFeeds } from "redstone-sdk";
import { getValuesForDataFeeds } from "./core/contract-interactions/get-values-for-data-feeds";
import { shouldUpdate } from "./core/update-conditions/should-update";
import {
  getUpdatePricesArgs,
  UpdatePricesArgs,
} from "./core/contract-interactions/get-update-prices-args";
import { IRedstoneAdapter } from "../typechain-types";
import { ConditionChecksNames } from "./types";

export type IterationConfig = {
  dataServiceId: string;
  uniqueSignersCount: number;
  dataFeeds: string[];
  updateConditions: ConditionChecksNames[];
  adapterContractType: string;
  minDeviationPercentage: number;
  updatePriceInterval: number;
};

export const getIterationArgs = async (
  config: IterationConfig,
  adapterContract: IRedstoneAdapter
): Promise<{
  shouldUpdatePrices: boolean;
  args?: UpdatePricesArgs;
  message?: string;
}> => {
  const {
    dataServiceId,
    uniqueSignersCount,
    dataFeeds,
    updateConditions,
    adapterContractType,
  } = config;

  const { lastUpdateTimestamp } = await getLastRoundParamsFromContract(
    adapterContract
  );

  // We fetch latest values from contract only if we want to check value deviation
  let valuesFromContract: ValuesForDataFeeds = {};
  if (updateConditions.includes("value-deviation")) {
    valuesFromContract = await getValuesForDataFeeds(
      adapterContract,
      dataFeeds,
      adapterContractType
    );
  }

  const dataPackages = await requestDataPackages({
    dataServiceId,
    uniqueSignersCount,
    dataFeeds,
    valuesToCompare: valuesFromContract,
  });

  const { shouldUpdatePrices, warningMessage } = shouldUpdate({
    dataPackages,
    valuesFromContract,
    lastUpdateTimestamp,
    config,
  });

  if (!shouldUpdatePrices) {
    return { shouldUpdatePrices, message: warningMessage };
  } else {
    const updatePricesArgs = await getUpdatePricesArgs(
      dataPackages,
      adapterContract,
      lastUpdateTimestamp
    );

    return {
      shouldUpdatePrices,
      ...updatePricesArgs,
      message: `${warningMessage}; ${updatePricesArgs.message || ""}`,
    };
  }
};
