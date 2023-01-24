import { DataPoint } from "redstone-protocol";
import ManifestHelper from "../manifest/ManifestHelper";
import { config } from "../config";
import { Manifest } from "../types";

export const validateDataPointsForBigPackage = (
  dataPoints: DataPoint[],
  manifest?: Manifest
) => {
  if (!manifest) {
    throw new Error(
      `Cannot get tokens count from manifest, manifest is ${manifest}`
    );
  }
  const allTokensCount = ManifestHelper.getAllTokensCount(manifest);
  const validDataPointsPercentage = (dataPoints.length / allTokensCount) * 100;
  return (
    validDataPointsPercentage >= config.minDataFeedsPercentageForBigPackage
  );
};
