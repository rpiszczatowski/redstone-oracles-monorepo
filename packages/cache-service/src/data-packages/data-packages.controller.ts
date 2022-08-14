import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { DataPackagesRequestParams } from "redstone-sdk";
import {
  CachedDataPackage,
  ReceivedDataPackage,
} from "./data-packages.interface";
import { DataPackagesService } from "./data-packages.service";

export interface BulkPostRequestBody {
  requestSignature: string;
  dataPackages: ReceivedDataPackage[];
}

export interface GetLatestDataPackagesQuery {
  "data-service-id": string;
  "unique-signers-count": number;
  "data-feeds": string;
}

export interface DataPackagesResponse {
  [dataFeedId: string]: CachedDataPackage[];
}

@Controller("data-packages")
export class DataPackagesController {
  constructor(private dataPackagesService: DataPackagesService) {}

  @Get("latest")
  async getLatest(
    @Query() query: GetLatestDataPackagesQuery
  ): Promise<DataPackagesResponse> {
    // TODO: implement request validation
    const requestParams: DataPackagesRequestParams = {
      dataServiceId: query["data-service-id"],
      uniqueSignersCount: query["unique-signers-count"],
      dataFeeds: (query["data-feeds"] ?? "").split(","),
    };

    return await this.dataPackagesService.getDataPackages(requestParams);
  }

  @Post("bulk")
  async addBulk(@Body() body: BulkPostRequestBody) {
    // TODO: implement request validation

    const { dataServiceId, signerAddress } =
      await this.dataPackagesService.verifyRequester(body);

    const dataPackagesToSave = body.dataPackages.map((receivedDataPackage) => ({
      ...receivedDataPackage,
      dataServiceId,
      signerAddress,
      dataFeedId:
        receivedDataPackage.dataPoints.length === 1
          ? receivedDataPackage.dataPoints[0].dataFeedId
          : undefined,
    }));

    await this.dataPackagesService.saveManyDataPackagesInDB(dataPackagesToSave);
  }
}
