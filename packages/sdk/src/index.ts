import axios from "axios";
import { BigNumber, utils } from "ethers";
import { RedstoneOraclesState } from "redstone-oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/types";
import redstoneOraclesInitialState from "redstone-oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/initial-state.json";
import {
  INumericDataPoint,
  RedstonePayload,
  SignedDataPackage,
  SignedDataPackagePlainObj,
} from "redstone-protocol";
import { resolveDataServiceUrls } from "./data-services-urls";

const ALL_FEEDS_KEY = "___ALL_FEEDS___";
const DEFAULT_DECIMALS = 8;

export interface DataPackagesRequestParams {
  dataServiceId: string;
  uniqueSignersCount: number;
  dataFeeds?: string[];
  disablePayloadsDryRun?: boolean;
  urls?: string[];
  valuesToCompare?: { [dataFeedId: string]: BigNumber };
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

    let dataFeedPackagesSorted = dataFeedPackages;
    if (
      reqParams.valuesToCompare &&
      Object.keys(reqParams.valuesToCompare).length > 0
    ) {
      const decimals =
        (dataFeedPackages[0].dataPoints[0] as INumericDataPoint).decimals ??
        DEFAULT_DECIMALS;
      const valueToCompare = Number(
        utils.formatUnits(reqParams.valuesToCompare[dataFeedId], decimals)
      );

      dataFeedPackagesSorted = sortDataPackagesByDeviationDesc(
        dataFeedPackages,
        valueToCompare,
        requestedDataFeedIds
      );
    }

    parsedResponse[dataFeedId] = dataFeedPackagesSorted
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

const sortDataPackagesByDeviationDesc = (
  dataPackages: SignedDataPackagePlainObj[],
  valueToCompare: number,
  dataFeedsIds: string[]
) => {
  if (dataFeedsIds[0] === ALL_FEEDS_KEY) {
    throw new Error(
      `Cannot get data packages with biggest deviation for ${ALL_FEEDS_KEY}`
    );
  }

  return dataPackages.sort((leftDataPackage, rightDataPackage) => {
    const leftValue = Number(leftDataPackage.dataPoints[0].value);
    const leftValueDeviation = calculateDeviation(leftValue, valueToCompare);
    const rightValue = Number(rightDataPackage.dataPoints[0].value);
    const rightValueDeviation = calculateDeviation(rightValue, valueToCompare);
    return rightValueDeviation - leftValueDeviation;
  });
};

const calculateDeviation = (value: number, valueToCompare: number) => {
  if (valueToCompare === 0) {
    return Number.MAX_SAFE_INTEGER;
  }
  const pricesDiff = Math.abs(valueToCompare - value);
  return (pricesDiff * 100) / valueToCompare;
};

export default {
  getOracleRegistryState,
  requestDataPackages,
  getDataServiceIdForSigner,
  requestRedstonePayload,
  resolveDataServiceUrls,
};
export * from "./data-services-urls";
export * from "./contracts/ContractParamsProvider";
export * from "./contracts/IContractConnector";
export * from "./contracts/prices/IPricesContractAdapter";
