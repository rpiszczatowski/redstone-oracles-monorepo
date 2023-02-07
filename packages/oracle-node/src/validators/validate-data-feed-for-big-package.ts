import { DataPoint } from "redstone-protocol";
import { config } from "../config";

export const validateDataPointsForBigPackage = (
  dataPoints: DataPoint[],
  allTokenCount?: number
) => {
  if (!allTokenCount) {
    throw new Error(
      `Cannot get token count from manifest.`
    );
  }
  const validDataPointsPercentage = (dataPoints.length / allTokenCount) * 100;
  return (
    validDataPointsPercentage >= config.minDataFeedsPercentageForBigPackage
  );
};
