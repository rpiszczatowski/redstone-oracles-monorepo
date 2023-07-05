const ONE_MINUTE_IN_MILLISECONDS = 1000 * 60;
const ONE_HOUR_IN_MILLISECONDS = 1000 * 60 * 60;

export const intervalMsToCronFormat = (intervalMs: number) => {
  if (intervalMs < ONE_MINUTE_IN_MILLISECONDS) {
    return `*/${intervalMs / 1000} * * * * *`;
  }
  if (intervalMs < ONE_HOUR_IN_MILLISECONDS) {
    return `*/${intervalMs / ONE_MINUTE_IN_MILLISECONDS} * * * *`;
  }
  return `*/${intervalMs / ONE_HOUR_IN_MILLISECONDS} * * *`;
};
