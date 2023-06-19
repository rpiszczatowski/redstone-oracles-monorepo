import axios from "axios";
import { RedstoneOraclesState } from "redstone-oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/types";
import redstoneOraclesInitialState from "redstone-oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/initial-state.json";
import {
  DataPackage,
  RedstonePayload,
  SignedDataPackage,
  SignedDataPackagePlainObj,
} from "redstone-protocol";
import { resolveDataServiceUrls } from "./data-services-urls";

const ALL_FEEDS_KEY = "___ALL_FEEDS___";

export interface DataPackagesRequestParams {
  dataServiceId: string;
  uniqueSignersCount: number;
  dataFeeds?: string[];
  disablePayloadsDryRun?: boolean;
  urls?: string[];
}

export interface DataPackagesWithBiggestDeviationRequestParams
  extends DataPackagesRequestParams {
  allUniqueSignersCount: number;
  valueToCompare: number;
}

export interface DataPackagesResponse {
  [dataFeedId: string]: SignedDataPackage[];
}

export const getOracleRegistryState =
  async (): Promise<RedstoneOraclesState> => {
    return redstoneOraclesInitialState;
  };

export const getDataServiceIdForSigner = (
  oracleState: RedstoneOraclesState,
  signerAddress: string
) => {
  for (const nodeDetails of Object.values(oracleState.nodes)) {
    if (nodeDetails.evmAddress.toLowerCase() === signerAddress.toLowerCase()) {
      return nodeDetails.dataServiceId;
    }
  }
  throw new Error(`Data service not found for ${signerAddress}`);
};

export const parseDataPackagesResponse = (
  dpResponse: {
    [dataFeedId: string]: SignedDataPackagePlainObj[];
  },
  reqParams: DataPackagesRequestParams
): DataPackagesResponse => {
  const parsedResponse: DataPackagesResponse = {};

  const requestedDataFeedIds = reqParams.dataFeeds ?? [ALL_FEEDS_KEY];

  for (const dataFeedId of requestedDataFeedIds) {
    const dataFeedPackages = dpResponse[dataFeedId];

    if (!dataFeedPackages) {
      throw new Error(
        `Requested data feed id is not included in response: ${dataFeedId}`
      );
    }

    if (dataFeedPackages.length < reqParams.uniqueSignersCount) {
      throw new Error(
        `Too few unique signers for the data feed: ${dataFeedId}. ` +
          `Expected: ${reqParams.uniqueSignersCount}. ` +
          `Received: ${dataFeedPackages.length}`
      );
    }

    parsedResponse[dataFeedId] = dataFeedPackages
      .sort((a, b) => b.timestampMilliseconds - a.timestampMilliseconds) // we prefer newer data packages in the first order
      .slice(0, reqParams.uniqueSignersCount)
      .map((dataPackage: SignedDataPackagePlainObj) =>
        SignedDataPackage.fromObj(dataPackage)
      );
  }

  return parsedResponse;
};

const errToString = (e: any): string => {
  if (e instanceof AggregateError) {
    const stringifiedErrors = e.errors.reduce(
      (prev, oneOfErrors, curIndex) =>
        (prev += `${curIndex}: ${oneOfErrors.message}, `),
      ""
    );
    return `${e.message}: ${stringifiedErrors}`;
  } else {
    return e.message;
  }
};

export const requestDataPackages = async (
  reqParams: DataPackagesRequestParams
): Promise<DataPackagesResponse> => {
  const promises = prepareDataPackagePromises(reqParams);
  try {
    return await Promise.any(promises);
  } catch (e: any) {
    const errMessage = `Request failed ${JSON.stringify({
      reqParams,
    })}, Original error: ${errToString(e)}`;
    throw new Error(errMessage);
  }
};

const prepareDataPackagePromises = (reqParams: DataPackagesRequestParams) => {
  const urls = getUrlsForDataServiceId(reqParams);
  return urls.map((url) =>
    axios
      .get(`${url}/data-packages/latest/${reqParams.dataServiceId}`)
      .then((response) => parseDataPackagesResponse(response.data, reqParams))
  );
};

export const requestRedstonePayload = async (
  reqParams: DataPackagesRequestParams,
  unsignedMetadataMsg?: string
): Promise<string> => {
  const signedDataPackagesResponse = await requestDataPackages(reqParams);
  const signedDataPackages = Object.values(signedDataPackagesResponse).flat();

  return RedstonePayload.prepare(signedDataPackages, unsignedMetadataMsg || "");
};

export const getUrlsForDataServiceId = (
  reqParams: DataPackagesRequestParams
): string[] => {
  if (reqParams.urls) {
    return reqParams.urls;
  }
  return resolveDataServiceUrls(reqParams.dataServiceId);
};

export const requestDataPackagesWithBiggestDeviation = async ({
  allUniqueSignersCount,
  valueToCompare,
  ...reqParams
}: DataPackagesWithBiggestDeviationRequestParams) => {
  if (allUniqueSignersCount < reqParams.uniqueSignersCount) {
    throw new Error(
      "All unique signers cannot be smaller than required unique signers"
    );
  }

  const allDataPackages = await requestDataPackages({
    ...reqParams,
    uniqueSignersCount: allUniqueSignersCount,
  });

  return getDataPackagesWithBiggestDeviation(
    allDataPackages,
    valueToCompare,
    reqParams.uniqueSignersCount,
    reqParams.dataFeeds
  );
};

const getDataPackagesWithBiggestDeviation = (
  dataPackages: DataPackagesResponse,
  valueToCompare: number,
  requiredDataPackagesCount: number,
  dataFeedsIds?: string[]
) => {
  if (!dataFeedsIds) {
    throw new Error(
      `Cannot get data packages with biggest deviation for ${ALL_FEEDS_KEY}`
    );
  }
  const dataPackagesWithBiggestDeviation: DataPackagesResponse = {};
  for (const dataFeedId of dataFeedsIds) {
    const dataPackagesForDataFeed = dataPackages[dataFeedId];
    const sortedDataPackages = sortDataPackagesByDeviation(
      dataPackagesForDataFeed,
      valueToCompare,
      dataFeedId
    );

    dataPackagesWithBiggestDeviation[dataFeedId] = sortedDataPackages.slice(
      0,
      requiredDataPackagesCount
    );
  }
  return dataPackagesWithBiggestDeviation;
};

const sortDataPackagesByDeviation = (
  dataPackagesForDataFeed: SignedDataPackage[],
  valueToCompare: number,
  dataFeedId: string
) =>
  dataPackagesForDataFeed.sort((leftDataPackage, rightDataPackage) => {
    const leftValue = Number(
      findDataPointValueForDataFeed(leftDataPackage.dataPackage, dataFeedId)
    );
    const leftValueDeviation = calculateDeviation(leftValue, valueToCompare);
    const rightValue = Number(
      findDataPointValueForDataFeed(rightDataPackage.dataPackage, dataFeedId)
    );
    const rightValueDeviation = calculateDeviation(rightValue, valueToCompare);
    return rightValueDeviation - leftValueDeviation;
  });

const calculateDeviation = (value: number, valueToCompare: number) => {
  if (valueToCompare === 0) {
    return Number.MAX_SAFE_INTEGER;
  }
  const pricesDiff = Math.abs(valueToCompare - value);
  return (pricesDiff * 100) / valueToCompare;
};

const findDataPointValueForDataFeed = (
  dataPackage: DataPackage,
  dataFeedToFind: string
) => {
  const dataPoint = dataPackage.dataPoints.find(
    (dataPoint) => dataPoint.dataFeedId === dataFeedToFind
  );
  if (!dataPoint) {
    throw new Error(
      `Cannot find data point for ${dataFeedToFind} in data package`
    );
  }
  return dataPoint.toObj().value;
};

export default {
  getOracleRegistryState,
  requestDataPackages,
  getDataServiceIdForSigner,
  requestRedstonePayload,
  resolveDataServiceUrls,
  requestDataPackagesWithBiggestDeviation,
};
export * from "./data-services-urls";
export * from "./contracts/ContractParamsProvider";
export * from "./contracts/IContractConnector";
export * from "./contracts/prices/IPricesContractAdapter";
