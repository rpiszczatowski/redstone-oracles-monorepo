import { config } from "../../config";

export const timeUpdateCondition = (lastUpdateTimestamp: number) => {
  const updatePriceInterval = config.updatePriceInterval;
  const currentTimestamp = Date.now();
  const timeDiff = currentTimestamp - lastUpdateTimestamp;
  const shouldUpdatePrices = timeDiff >= updatePriceInterval;

  console.log(
    `Checking time update condition current: ${currentTimestamp} lastUpdateTimestamp: ${lastUpdateTimestamp}`
  );

  return {
    shouldUpdatePrices,
    warningMessage: shouldUpdatePrices
      ? ""
      : "Not enough time has passed to update prices",
  };
};
