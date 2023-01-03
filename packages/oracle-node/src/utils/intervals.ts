import ManifestConfigError from "../manifest/ManifestConfigError";

const ONE_MINUTE_IN_MILLISECONDS = 1000 * 60;
const ONE_HOUR_IN_MILLISECONDS = 1000 * 60 * 60;

export const intervalMsToCronFormat = (intervalMs: number) => {
  validateInterval(intervalMs);

  if (intervalMs < ONE_MINUTE_IN_MILLISECONDS) {
    return `*/${intervalMs / 1000} * * * * *`;
  }
  if (intervalMs < ONE_HOUR_IN_MILLISECONDS) {
    return `*/${intervalMs / ONE_MINUTE_IN_MILLISECONDS} * * * *`;
  }
  return `*/${intervalMs / ONE_HOUR_IN_MILLISECONDS} * * *`;
};

const validateInterval = (intervalMs: number) => {
  if (intervalMs % 1000 != 0) {
    throw new ManifestConfigError("Interval needs to be divisible by 1000");
  }
  if (
    intervalMs >= ONE_MINUTE_IN_MILLISECONDS &&
    intervalMs % ONE_MINUTE_IN_MILLISECONDS != 0
  ) {
    throw new ManifestConfigError(
      "If interval is greater than 60 seconds it must to be multiple of 1 minute"
    );
  }
  if (intervalMs > ONE_HOUR_IN_MILLISECONDS) {
    throw new ManifestConfigError(
      "Intervals greater than 1 hour are not supported"
    );
  }
};
