import {
  DataPackagesRequestParams,
  requestRedstonePayload,
} from "redstone-sdk";
import { BaseWrapper, ParamsForDryRunVerification } from "./BaseWrapper";
import { parseAggregatedErrors } from "../helpers/parse-aggregated-errors";
import { runDryRun } from "../helpers/run-dry-run";
import { version } from "../../package.json";
import { resolveDataServiceUrls } from "redstone-protocol";

export interface DryRunParamsWithUnsignedMetadata
  extends ParamsForDryRunVerification {
  unsignedMetadataMsg: string;
  urls: string[];
}

export type DataPackagesRequestInput = Partial<DataPackagesRequestParams>;

export class DataServiceWrapper extends BaseWrapper {
  constructor(
    private readonly dataPackagesRequestParams: DataPackagesRequestInput,
    private urls?: string[]
  ) {
    super();
  }

  getUnsignedMetadata(): string {
    const currentTimestamp = Date.now();
    return `${currentTimestamp}#${version}#${this.dataPackagesRequestParams.dataServiceId}`;
  }

  async getBytesDataForAppending(
    params: ParamsForDryRunVerification
  ): Promise<string> {
    const unsignedMetadataMsg = this.getUnsignedMetadata();
    const disablePayloadsDryRun = Boolean(
      this.dataPackagesRequestParams.disablePayloadsDryRun
    );

    const { urls } = await this.loadDefaultParams();

    if (disablePayloadsDryRun) {
      return this.requestPayloadWithoutDryRun(urls, unsignedMetadataMsg);
    }

    return this.requestPayloadWithDryRun({
      ...params,
      unsignedMetadataMsg,
      urls,
    });
  }

  private async loadDefaultParams() {
    if (!this.dataPackagesRequestParams.uniqueSignersCount) {
      this.dataPackagesRequestParams.uniqueSignersCount =
        await this.getUniqueSignersThresholdFromContract();
    }

    if (!this.dataPackagesRequestParams.dataServiceId) {
      this.dataPackagesRequestParams.dataServiceId =
        await this.getDataServiceIdFromContract();
    }

    if (!this.urls) {
      this.urls = resolveDataServiceUrls(
        this.dataPackagesRequestParams.dataServiceId
      );
    }

    return { ...this.dataPackagesRequestParams, urls: this.urls };
  }

  /* 
    Call function on provider always returns some result and doesn't throw an error.
    Later we need to decode the result from the call (decodeFunctionResult) and
    this function will throw an error if the call was reverted.
  */
  async requestPayloadWithDryRun({
    unsignedMetadataMsg,
    urls,
    ...params
  }: DryRunParamsWithUnsignedMetadata) {
    const promises = urls.map(async (url) => {
      const redstonePayload = await this.requestPayloadWithoutDryRun(
        [url],
        unsignedMetadataMsg
      );
      await runDryRun({ ...params, redstonePayload });
      return redstonePayload;
    });
    return Promise.any(promises).catch((error: any) => {
      const parsedErrors = parseAggregatedErrors(error);
      throw new Error(
        `All redstone payloads do not pass dry run verification, aggregated errors: ${parsedErrors}`
      );
    });
  }

  async requestPayloadWithoutDryRun(
    urls: string[],
    unsignedMetadataMsg: string
  ) {
    return requestRedstonePayload(
      this.dataPackagesRequestParams as DataPackagesRequestParams,
      urls,
      unsignedMetadataMsg
    );
  }

  private async getDataServiceIdFromContract(): Promise<string> {
    try {
      const dataServiceId = await this.contract.getDataServiceId();
      // throw on default implementation
      if (dataServiceId === "") {
        throw new Error(`getDataServiceId was not overridden.`);
      }
      return dataServiceId;
    } catch (e: any) {
      throw new Error(
        `DataServiceId not provided and failed to get it from underlying contract. Error: ` +
          e?.message
      );
    }
  }

  private async getUniqueSignersThresholdFromContract(): Promise<number> {
    try {
      return await this.contract.getUniqueSignersThreshold();
    } catch (e: any) {
      throw new Error(
        `UniqueSignersCount not provided and failed to get it from underlying contract.` +
          e?.message
      );
    }
  }
}
