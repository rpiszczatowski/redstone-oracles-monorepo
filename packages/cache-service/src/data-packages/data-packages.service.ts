import { Injectable } from "@nestjs/common";
import {
  computeAddress,
  keccak256,
  recoverPublicKey,
  toUtf8Bytes,
} from "ethers/lib/utils";
import { RedstoneOraclesState } from "redstone-oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/types";
import {
  DataPackagesRequestParams,
  // getDataServiceIdForSigner,
  getOracleRegistryState,
} from "redstone-sdk";
import {
  BulkPostRequestBody,
  DataPackagesResponse,
} from "./data-packages.controller";
import { CachedDataPackage } from "./data-packages.interface";
import { DataPackage } from "./data-packages.model";

// TODO: switch to the version from redstone-sdk
// And remove the implementation below
const getDataServiceIdForSigner = (
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

@Injectable()
export class DataPackagesService {
  async saveManyDataPackagesInDB(dataPackages: CachedDataPackage[]) {
    await DataPackage.insertMany(dataPackages);
  }

  // TODO: try to replace current implementation using only one aggregation call
  async getDataPackages(
    requestConfig: DataPackagesRequestParams
  ): Promise<DataPackagesResponse> {
    const fetchedPackagesPerDataFeed: {
      [dataFeedId: string]: CachedDataPackage[];
    } = {};

    const getDataPackagesForDataFeed = async (dataFeedId: string) => {
      const groupedDataPackages = await DataPackage.aggregate([
        {
          $match: {
            dataServiceId: requestConfig.dataServiceId,
            dataFeedId,
          },
        },
        {
          $sort: { signerAddress: 1, timestampMilliseconds: -1 },
        },
        {
          $group: {
            _id: "$signerAddress",
            timestampMilliseconds: { $first: "$timestampMilliseconds" },
            signature: { $first: "$signature" },
            dataPoints: { $first: "$dataPoints" },
            dataServiceId: { $first: "$dataServiceId" },
            dataFeedId: { $first: "$dataFeedId" },
            sources: { $first: "$sources" },
          },
        },
        {
          $limit: Number(requestConfig.uniqueSignersCount),
        },
      ]);

      fetchedPackagesPerDataFeed[dataFeedId] = groupedDataPackages.map((dp) => {
        const { _id, __v, ...rest } = dp;
        return {
          ...rest,
          signerAddress: _id,
        };
      });
    };

    // Fetching data packages for each data feed
    const promises = requestConfig.dataFeeds.map(getDataPackagesForDataFeed);
    await Promise.all(promises);

    return fetchedPackagesPerDataFeed;
  }

  // TODO: implement it using DB
  async loadDataServicesRegistry(): Promise<RedstoneOraclesState> {
    return await getOracleRegistryState();
  }

  async verifyRequester(body: BulkPostRequestBody) {
    const signerAddress = this.recoverSigner(
      JSON.stringify(body.dataPackages),
      body.requestSignature
    );
    const dataServicesRegistry = await this.loadDataServicesRegistry();
    const dataServiceId = getDataServiceIdForSigner(
      dataServicesRegistry,
      signerAddress
    );
    return {
      dataServiceId,
      signerAddress,
    };
  }

  // TODO: maybe move this logic to a shared module (e.g. redstone-sdk)
  recoverSigner(message: string, signature: string): string {
    const digest = keccak256(toUtf8Bytes(message));
    const publicKey = recoverPublicKey(digest, signature);
    return computeAddress(publicKey);
  }
}
