import ManifestConfigError from "../manifest/ManifestConfigError";

export const intervalMsToCronFormat = (intervalMs: number) => {
  validateInterval(intervalMs);

  if (intervalMs < 1000 * 60) {
    return `*/${intervalMs / 1000} * * * * *`;
  }
  if (intervalMs < 1000 * 60 * 60) {
    return `*/${intervalMs / (1000 * 60)} * * * *`;
  }
  return `*/${intervalMs / (1000 * 60 * 60)} * * *`;
};

const validateInterval = (intervalMs: number) => {
  if (intervalMs % 1000 != 0) {
    throw new ManifestConfigError("Interval needs to be divisible by 1000");
  }
  if (intervalMs >= 1000 * 60 && intervalMs % (1000 * 60) != 0) {
    throw new ManifestConfigError(
      "If interval is greater than 60 seconds it must to be multiple of 1 minute"
    );
  }
  if (intervalMs > 1000 * 60 * 60) {
    throw new ManifestConfigError(
      "Intervals greater than 1 hour are not supported"
    );
  }
};
