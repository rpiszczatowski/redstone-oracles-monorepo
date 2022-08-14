import { Injectable } from "@nestjs/common";
import { keccak256, recoverAddress, toUtf8Bytes } from "ethers/lib/utils";
import { RedstoneOraclesState } from "redstone-oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/types";
import {
  DataPackagesRequestParams,
  getDataServiceIdForSignerAddress,
  getOracleRegistryState,
} from "redstone-sdk";
import {
  BulkPostRequestBody,
  DataPackagesResponse,
} from "./data-packages.controller";
import { CachedDataPackage } from "./data-packages.interface";
import { DataPackage } from "./data-packages.model";

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
            _id: { signerAddress: "$signerAddress" },
            timestampMilliseconds: { $first: "$timestampMilliseconds" },
            signature: { $first: "$signature" },
            dataPoints: { $first: "$dataPoints" },
            dataServiceId: { $first: "$dataServiceId" },
            dataFeedId: { $first: "$dataFeedId" },
            sources: { $first: "$sources" },
          },
        },
        {
          $limit: requestConfig.uniqueSignersCount,
        },
      ]);

      // TODO: remove this console.log
      console.log(`Grouped data packages for ${dataFeedId}`);
      console.log(groupedDataPackages);

      fetchedPackagesPerDataFeed[dataFeedId] = groupedDataPackages;
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
    const dataServiceId = getDataServiceIdForSignerAddress(
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
    return recoverAddress(digest, signature);
  }
}
