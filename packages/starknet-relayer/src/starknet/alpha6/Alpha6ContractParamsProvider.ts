import {
  ContractParamsProvider,
  DataPackagesRequestParams,
  DEFAULT_CACHE_SERVICE_URLS,
} from "redstone-sdk";
import { processPayload } from "./payload-processor";

export class Alpha6ContractParamsProvider extends ContractParamsProvider {
  constructor(
    private readonly allowedSignerAddresses: string[],
    readonly requestParams: DataPackagesRequestParams,
    readonly urls: string[] = DEFAULT_CACHE_SERVICE_URLS
  ) {
    super(requestParams, urls);
  }

  async getAggregatedPriceValuesAndTimestamp(): Promise<{
    priceValues: number[];
    timestamp: number;
  }> {
    const payloadHex = await this.requestPayload(this.requestParams);

    return processPayload(
      payloadHex,
      this.getDataFeedIds(),
      this.requestParams.uniqueSignersCount,
      this.allowedSignerAddresses
    );
  }
}
