import { timeUpdateCondition } from "./time-condition";
import {
  AntiConditionCheckFn,
  ConditionCheckNames,
  ConditionCheckResponse,
  Context,
  RelayerConfig,
} from "../../types";
import { valueDeviationCondition } from "./value-deviation-condition";
import { checkIfDataPackageTimestampIsNewer } from "./data-packages-timestamp";

const ANTI_CONDITIONS: Record<string, AntiConditionCheckFn> = {
  "data-package-timestamp": checkIfDataPackageTimestampIsNewer,
} as const;

export const shouldUpdate = async (
  context: Context,
  config: RelayerConfig
): Promise<ConditionCheckResponse> => {
  const warningMessages: string[] = [];
  let shouldUpdatePrices = false;
  for (const conditionName of config.updateConditions) {
    const conditionCheck = await checkConditionByName(
      conditionName,
      context,
      config
    );
    shouldUpdatePrices ||= conditionCheck.shouldUpdatePrices;
    if (conditionCheck.warningMessage.length > 0) {
      warningMessages.push(conditionCheck.warningMessage);
    }
  }

  for (const antiConditionCheck of Object.values(ANTI_CONDITIONS)) {
    const { shouldNotUpdatePrice, message } = await antiConditionCheck(
      context,
      config
    );
    if (shouldNotUpdatePrice) {
      shouldUpdatePrices = false;
    }
    if (message) {
      warningMessages.push(message);
    }
  }

  console.log(
    `Update condition ${
      shouldUpdatePrices ? "" : "NOT "
    }satisfied: ${warningMessages.join("; ")}`
  );

  return {
    shouldUpdatePrices,
    warningMessage: JSON.stringify(warningMessages),
  };
};

const checkConditionByName = async (
  name: ConditionCheckNames,
  context: Context,
  config: RelayerConfig
): Promise<{ shouldUpdatePrices: boolean; warningMessage: string }> => {
  switch (name) {
    case "time":
      return timeUpdateCondition(context.lastUpdateTimestamp, config);

    case "value-deviation":
      return await valueDeviationCondition(
        context.dataPackages,
        context.uniqueSignersThreshold,
        context.valuesFromContract,
        config
      );
  }
};
