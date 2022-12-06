import { DataPackage } from "../data-package/DataPackage";
import { NumericDataPoint } from "../data-point/NumericDataPoint";

export const signOnDemandDataPackage = (
  dataFeedId: string,
  score: number,
  timestamp: number,
  privateKey: string
) => {
  const dataPoint = new NumericDataPoint({
    dataFeedId,
    value: score,
    decimals: 0,
  });

  const dataPackage = new DataPackage([dataPoint], timestamp);
  return dataPackage.sign(privateKey);
};

export const prepareMessageToSign = (timestamp: number) => {
  const utcDate = new Date(timestamp).toUTCString();
  return `Allow verification of my account on ${utcDate}`;
};
