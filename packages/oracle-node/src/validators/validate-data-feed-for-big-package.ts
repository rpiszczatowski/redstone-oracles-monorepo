import { DataPoint } from "redstone-protocol";
import { config } from "../config";
import { TokensConfig } from "../types";
import { terminateWithManifestConfigError } from "../Terminator";

export const validateDataPointsForBigPackage = (
  dataPoints: DataPoint[],
  allTokensConfig?: TokensConfig
) => {
  if (!allTokensConfig) {
    terminateWithManifestConfigError(`Cannot get token config from manifest.`);
  }

  const dataPointsWithoutSkipSigning = filterDataPointsWithoutSkipSigning(
    dataPoints,
    allTokensConfig
  );
  const tokensWithoutSkipSigningCount =
    countTokensWithoutSkipSigning(allTokensConfig);

  if (tokensWithoutSkipSigningCount === 0) {
    return false;
  }

  const validDataPointsPercentage =
    (dataPointsWithoutSkipSigning.length / tokensWithoutSkipSigningCount) * 100;

  return (
    validDataPointsPercentage >= config.minDataFeedsPercentageForBigPackage
  );
};

const filterDataPointsWithoutSkipSigning = (
  dataPoints: DataPoint[],
  allTokensConfig: TokensConfig
) =>
  dataPoints.filter(
    (dataPoint) => !allTokensConfig[dataPoint.dataFeedId].skipSigning
  );

const countTokensWithoutSkipSigning = (allTokensConfig: TokensConfig) =>
  Object.values(allTokensConfig).reduce(
    (count, tokenConfig) => (tokenConfig.skipSigning ? count : count + 1),
    0
  );
