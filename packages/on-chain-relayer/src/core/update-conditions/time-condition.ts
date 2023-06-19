export const timeUpdateCondition = (
  lastUpdateTimestamp: number,
  updatePriceInterval: number
) => {
  const currentTimestamp = Date.now();
  const timeDiff = currentTimestamp - lastUpdateTimestamp;
  const shouldUpdatePrices = timeDiff >= updatePriceInterval;
  const logTrace = JSON.stringify({
    timeDiff,
    updatePriceInterval,
  });
  return {
    shouldUpdatePrices,
    warningMessage: shouldUpdatePrices
      ? `Enough time passed to updated prices: ${logTrace}`
      : `Not enough time has passed to update prices: ${logTrace}`,
  };
};
