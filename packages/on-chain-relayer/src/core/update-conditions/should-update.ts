import { timeUpdateCondition } from "./time-condition";
import { valueDeviationCondition } from "./value-deviation-condition";
import { config } from "../../config";
import { ConditionCheckResponse, Context } from "../../types";
import { changeInNewyorkfedResponseCondition } from "./change-in-newyorkfed-repsonse-condition";

export const shouldUpdate = async (
  context: Context
): Promise<ConditionCheckResponse> => {
  const { updateConditions } = config;
  const warningMessages: string[] = [];
  let shouldUpdatePrices = false;
  for (const conditionName of updateConditions) {
    const conditionCheck = (await checkConditionByName(context))[conditionName];
    shouldUpdatePrices =
      shouldUpdatePrices || conditionCheck.shouldUpdatePrices;
    if (conditionCheck.warningMessage.length > 0) {
      warningMessages.push(conditionCheck.warningMessage);
    }
  }
  return {
    shouldUpdatePrices,
    warningMessage: JSON.stringify(warningMessages),
  };
};

const checkConditionByName = async (context: Context) => ({
  time: timeUpdateCondition(context.lastUpdateTimestamp),
  "value-deviation": valueDeviationCondition(
    context.dataPackages,
    context.valuesFromContract
  ),
  "change-in-newyorkfed-response": await changeInNewyorkfedResponseCondition(),
});
