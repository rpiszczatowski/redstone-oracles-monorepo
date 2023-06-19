import { timeUpdateCondition } from "./time-condition";
import { valueDeviationCondition } from "./value-deviation-condition";
import { ConditionCheckResponse, Context } from "../../types";

export const shouldUpdate = (context: Context): ConditionCheckResponse => {
  const warningMessages: string[] = [];
  let shouldUpdatePrices = false;
  for (const conditionName of context.config.updateConditions) {
    const conditionCheck = checkConditionByName(context)[conditionName];
    shouldUpdatePrices =
      shouldUpdatePrices || conditionCheck.shouldUpdatePrices;
    if (conditionCheck.warningMessage.length > 0) {
      warningMessages.push(conditionCheck.warningMessage);
    }
  }

  console.log(
    `Update condition ${
      shouldUpdatePrices ? "" : "NOT"
    } satisfied: ${warningMessages.join("; ")}`
  );

  return {
    shouldUpdatePrices,
    warningMessage: JSON.stringify(warningMessages),
  };
};

const checkConditionByName = (context: Context) => ({
  time: timeUpdateCondition(
    context.lastUpdateTimestamp,
    context.config.updatePriceInterval
  ),
  "value-deviation": valueDeviationCondition(
    context.dataPackages,
    context.valuesFromContract,
    context.config.minDeviationPercentage
  ),
});
