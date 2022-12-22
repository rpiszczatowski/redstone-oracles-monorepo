import { Injectable } from "@nestjs/common";

import {
  RedstonePayload,
  UniversalSigner,
  recoverDeserializedSignerAddress,
} from "redstone-protocol";
import {
  DataPackagesRequestParams,
  getDataServiceIdForSigner,
  getOracleRegistryState,
} from "redstone-sdk";
import config from "../config";
import {
  BulkPostRequestBody,
  DataPackagesResponse,
  DataPackagesStatsResponse,
} from "./data-packages.controller";
import { ReceivedDataPackage } from "./data-packages.interface";
import { CachedDataPackage, DataPackage } from "./data-packages.model";
import { makePayload } from "../utils/make-redstone-payload";

export const ALL_FEEDS_KEY = "___ALL_FEEDS___";
const ALLOWED_TIMESTAMP_DELAY = 120 * 1000; // 2 minutes in milliseconds

export interface StatsRequestParams {
  fromTimestamp: number;
  toTimestamp: number;
}

@Injectable()
export class DataPackagesService {
  async saveManyDataPackagesInDB(dataPackages: CachedDataPackage[]) {
    await DataPackage.insertMany(dataPackages);
  }

  async getAllLatestDataPackages(
    dataServiceId: string
  ): Promise<DataPackagesResponse> {
    dataServiceId;
    const fetchedPackagesPerDataFeed: {
      [dataFeedId: string]: CachedDataPackage[];
    } = {};

    // TODO: remove
    console.log(`\n\nSending request to the database\n\n`);

    const groupedDataPackages = await DataPackage.aggregate([
      {
        $match: {
          dataServiceId,
          // isSignatureValid: true,
          timestampMilliseconds: { $gte: Date.now() - ALLOWED_TIMESTAMP_DELAY },
        },
      },
      {
        $group: {
          _id: {
            signerAddress: "$signerAddress",
            dataFeedId: "$dataFeedId",
          },
          timestampMilliseconds: { $first: "$timestampMilliseconds" },
          signature: { $first: "$signature" },
          dataPoints: { $first: "$dataPoints" },
          dataServiceId: { $first: "$dataServiceId" },
          dataFeedId: { $first: "$dataFeedId" },
          sources: { $first: "$sources" },
        },
      },
      {
        $sort: { timestampMilliseconds: -1 },
      },
    ]);

    // Parse DB response
    for (const dataPackage of groupedDataPackages) {
      const { _id, __v, ...rest } = dataPackage;
      __v;
      const dataFeedId = _id.dataFeedId;
      if (!fetchedPackagesPerDataFeed[dataFeedId]) {
        fetchedPackagesPerDataFeed[dataFeedId] = [];
      }

      fetchedPackagesPerDataFeed[dataFeedId].push({
        ...rest,
        dataFeedId,
        signerAddress: _id.signerAddress,
      });
    }

    return fetchedPackagesPerDataFeed;
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
            isSignatureValid: true,
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
          $sort: { timestampMilliseconds: -1 },
        },
        {
          $limit: Number(requestConfig.uniqueSignersCount),
        },
      ]);

      const dataPackages = groupedDataPackages.map((dp) => {
        const { _id, __v, ...rest } = dp;
        _id;
        __v;
        return {
          ...rest,
          signerAddress: _id,
        };
      });

      fetchedPackagesPerDataFeed[dataFeedId] = dataPackages;
    };

    // Fetching data packages for each data feed
    if (!!requestConfig.dataFeeds) {
      const promises = requestConfig.dataFeeds.map(getDataPackagesForDataFeed);
      await Promise.all(promises);
    } else {
      await getDataPackagesForDataFeed(ALL_FEEDS_KEY);
    }

    return fetchedPackagesPerDataFeed;
  }

  async getPayload(
    requestParams: DataPackagesRequestParams
  ): Promise<RedstonePayload> {
    const cachedDataPackagesResponse = await this.getDataPackages(
      requestParams
    );

    return makePayload(cachedDataPackagesResponse);
  }

  async getDataPackagesStats(
    statsRequestParams: StatsRequestParams
  ): Promise<DataPackagesStatsResponse> {
    const { fromTimestamp, toTimestamp } = statsRequestParams;

    // Fetching stats form DB
    const signersStats = await DataPackage.aggregate([
      {
        $match: {
          $and: [
            { timestampMilliseconds: { $gte: fromTimestamp } },
            { timestampMilliseconds: { $lte: toTimestamp } },
          ],
        },
      },
      {
        $group: {
          _id: "$signerAddress",
          dataPackagesCount: { $sum: 1 },
          verifiedDataPackagesCount: {
            $sum: { $cond: ["$isSignatureValid", 1, 0] },
          },
        },
      },
    ]);

    // Prepare stats response
    const state = await getOracleRegistryState();
    const stats: DataPackagesStatsResponse = {};
    for (const {
      dataPackagesCount,
      verifiedDataPackagesCount,
      _id: signerAddress,
    } of signersStats) {
      const nodeDetails = Object.values(state.nodes).find(
        ({ evmAddress }) => evmAddress === signerAddress
      );

      const verifiedDataPackagesPercentage =
        (100 * verifiedDataPackagesCount) / Math.max(dataPackagesCount, 1);

      stats[signerAddress] = {
        dataPackagesCount,
        verifiedDataPackagesCount,
        verifiedDataPackagesPercentage,
        nodeName: nodeDetails?.name || "unknown",
        dataServiceId: nodeDetails?.dataServiceId || "unknown",
      };
    }

    return stats;
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
        const isSignatureValid = this.isSignatureValid(
          receivedDataPackage,
          signerAddress
        );

        const cachedDataPackage: CachedDataPackage = {
          ...receivedDataPackage,
          dataServiceId,
          signerAddress,
          isSignatureValid: isSignatureValid,
        };
        if (receivedDataPackage.dataPoints.length === 1) {
          cachedDataPackage.dataFeedId =
            receivedDataPackage.dataPoints[0].dataFeedId;
        } else {
          cachedDataPackage.dataFeedId = ALL_FEEDS_KEY;
        }
        return cachedDataPackage;
      }
    );

    return dataPackagesForSaving;
  }

  private isSignatureValid(
    receivedDataPackage: ReceivedDataPackage,
    signerAddress: string
  ): boolean {
    try {
      const address = recoverDeserializedSignerAddress(receivedDataPackage);

      return address === signerAddress;
    } catch {
      return false;
    }
  }
}
