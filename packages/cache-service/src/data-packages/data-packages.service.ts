import { Injectable } from "@nestjs/common";
import { UniversalSigner } from "redstone-protocol";
import {
  DataPackagesRequestParams,
  getDataServiceIdForSigner,
  getOracleRegistryState,
} from "redstone-sdk";
import config from "../config";
import {
  BulkPostRequestBody,
  DataPackagesResponse,
} from "./data-packages.controller";
import { ReceivedDataPackage } from "./data-packages.interface";
import { CachedDataPackage, DataPackage } from "./data-packages.model";

export const ALL_FEEDS_KEY = "___ALL_FEEDS___";

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

    const getDataPackagesForDataFeed = async (dataFeedId?: string) => {
      const groupedDataPackages = await DataPackage.aggregate([
        {
          $sort: { signerAddress: 1, timestampMilliseconds: -1 },
        },
        {
          $match: {
            dataServiceId: requestConfig.dataServiceId,
            dataFeedId: dataFeedId || { $exists: false },
          },
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

      const dataPackages = groupedDataPackages.map((dp) => {
        const { _id, __v, ...rest } = dp;
        return {
          ...rest,
          signerAddress: _id,
        };
      });

      fetchedPackagesPerDataFeed[dataFeedId || ALL_FEEDS_KEY] = dataPackages;
    };

    // Fetching data packages for each data feed
    if (requestConfig.dataFeeds?.length) {
      const promises = requestConfig.dataFeeds.map(getDataPackagesForDataFeed);
      await Promise.all(promises);
    } else {
      await getDataPackagesForDataFeed(ALL_FEEDS_KEY);
    }

    return fetchedPackagesPerDataFeed;
  }

  verifyRequester(body: BulkPostRequestBody) {
    return UniversalSigner.recoverSigner(
      body.dataPackages,
      body.requestSignature
    );
  }

  async prepareReceivedDataPackagesForBulkSaving(
    receivedDataPackages: ReceivedDataPackage[],
    signerAddress: string
  ) {
    const oracleRegistryState = await getOracleRegistryState();

    const dataServiceId = config.mockDataServiceIdForPackages
      ? "mock-data-service-1"
      : getDataServiceIdForSigner(oracleRegistryState, signerAddress);

    const dataPackagesForSaving = receivedDataPackages.map(
      (receivedDataPackage) => {
        const cachedDataPackage: CachedDataPackage = {
          ...receivedDataPackage,
          dataServiceId,
          signerAddress,
        };
        if (receivedDataPackage.dataPoints.length === 1) {
          cachedDataPackage.dataFeedId =
            receivedDataPackage.dataPoints[0].dataFeedId;
        }
        return cachedDataPackage;
      }
    );

    return dataPackagesForSaving;
  }
}
