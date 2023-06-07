import { DataPoint } from "redstone-protocol";
import { config } from "../config";
import { TokensConfig } from "../types";

export const validateDataPointsForBigPackage = (
  dataPoints: DataPoint[],
  allTokensConfig?: TokensConfig
) => {
  if (!allTokensConfig) {
    throw new Error(`Cannot get token config from manifest.`);
  }

  const dataPointsWithoutSkipSigning = filterDataPointsWithoutSkipSigning(
    dataPoints,
    allTokensConfig
  );
  const tokensWithoutSkipSigningCount =
    countTokensWithoutSkipSigning(allTokensConfig);

  const validDataPointsPercentage =
    (dataPointsWithoutSkipSigning.length / tokensWithoutSkipSigningCount) * 100;

  return (
    validDataPointsPercentage >= config.minDataFeedsPercentageForBigPackage
  );
};

const filterDataPointsWithoutSkipSigning = (
  dataPoints: DataPoint[],
  allTokens: TokensConfig
) =>
  dataPoints.filter(
    (dataPoint) => !allTokens[dataPoint.dataFeedId].skipSigning
  );

const countTokensWithoutSkipSigning = (allTokens: TokensConfig) =>
  Object.values(allTokens).reduce(
    (count, config) => (config.skipSigning ? count : ++count),
    0
  );
