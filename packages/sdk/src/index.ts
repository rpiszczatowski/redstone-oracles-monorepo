import axios from "axios";
import bluebird from "bluebird";
import { RedstoneOraclesState } from "redstone-oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/types";
import redstoneOraclesInitialState from "redstone-oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/initial-state.json";
import {
  SignedDataPackage,
  SignedDataPackagePlainObj,
} from "redstone-protocol";

export const DEFAULT_CACHE_SERVICE_URLS = [
  "https://cache-1.redstone.finance",
  "https://cache-2.redstone.finance",
  "https://cache-3.redstone.finance",
  "https://cache-1-streamr.redstone.finance",
  "https://cache-2-streamr.redstone.finance",
];

export interface DataPackagesRequestParams {
  dataServiceId: string;
  uniqueSignersCount: number;
  dataFeeds: string[];
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

export const requestDataPackages = async (
  reqParams: DataPackagesRequestParams,
  urls: string[] = DEFAULT_CACHE_SERVICE_URLS
): Promise<SignedDataPackage[]> => {
  const promises = urls.map((url) =>
    (async () => {
      const response = await axios.get(url, {
        params: {
          ...reqParams,
          "data-feeds": reqParams.dataFeeds.join(","),
        },
      });
      const serializedDataPackages: SignedDataPackagePlainObj[] = response.data;
      return serializedDataPackages.map((dp) => SignedDataPackage.fromObj(dp));
    })()
  );
  return await bluebird.Promise.any(promises);
};

export default {
  getOracleRegistryState,
  requestDataPackages,
  getDataServiceIdForSigner,
};
