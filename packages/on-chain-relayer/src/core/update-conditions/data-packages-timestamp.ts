import { DataPackagesResponse } from "redstone-sdk";
import { AntiConditionCheckFn, Context } from "../../types";

export const checkIfDataPackageTimestampIsNewer: AntiConditionCheckFn = async (
  context: Context
): ReturnType<AntiConditionCheckFn> => {
  const { dataPackages, lastUpdateTimestamp } = context;

  const dataPackageTimestamp = await chooseDataPackagesTimestamp(dataPackages);

  if (lastUpdateTimestamp >= dataPackageTimestamp) {
    const message = `Cannot update prices, proposed prices are not newer ${JSON.stringify(
      {
        lastUpdateTimestamp,
        dataPackageTimestamp: dataPackageTimestamp,
      }
    )}`;
    return { shouldNotUpdatePrice: true, message };
  }

  return { shouldNotUpdatePrice: false };
};

export const chooseDataPackagesTimestamp = (
  dataPackages: DataPackagesResponse
) => {
  const dataPackagesTimestamps = Object.values(dataPackages).flatMap(
    (dataPackages) =>
      dataPackages.map(
        (dataPackage) => dataPackage.dataPackage.timestampMilliseconds
      )
  );
  return Math.min(...dataPackagesTimestamps);
};
