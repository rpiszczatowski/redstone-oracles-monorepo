import {
  DataPackagesRequestParams,
  requestRedstonePayload,
} from "redstone-sdk";
import { BaseWrapper, ParamsForDryRunVerification } from "./BaseWrapper";
import { parseAggregatedErrors } from "../helpers/parse-aggregated-errors";
import { runDryRun } from "../helpers/run-dry-run";
import { version } from "../../package.json";
import { resolveDataServiceUrls } from "redstone-protocol";

type Optional<T, K extends keyof T> = Omit<T, K> & {
  [P in K]?: T[P];
};

const DEFAULT_UNIQUE_SIGNERS_COUNT = 2;

export interface DryRunParamsWithUnsignedMetadata
  extends ParamsForDryRunVerification {
  unsignedMetadataMsg: string;
}

export type DataPackagesRequestInput = Optional<
  DataPackagesRequestParams,
  "dataServiceId" | "uniqueSignersCount"
>;

export class DataServiceWrapper extends BaseWrapper {
  private _urls?: string[];
  private readonly dataPackagesRequestParams: Optional<
    DataPackagesRequestParams,
    "dataServiceId"
  >;

  constructor(
    dataPackagesRequestParams: Optional<
      DataPackagesRequestParams,
      "dataServiceId" | "uniqueSignersCount"
    >,
    urls?: string[]
  ) {
    super();
    this._urls = urls;
    this.dataPackagesRequestParams = {
      uniqueSignersCount: DEFAULT_UNIQUE_SIGNERS_COUNT,
      ...dataPackagesRequestParams,
    };
  }

  private get urls(): string[] {
    if (this._urls) {
      return this._urls;
    }
    this._urls = resolveDataServiceUrls(
      this.dataPackagesRequestParams.dataServiceId as string
    );
    return this._urls;
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

    if (!this.dataPackagesRequestParams.dataServiceId) {
      this.dataPackagesRequestParams.dataServiceId =
        await this.getDataServiceIdFromContract();
    }

    if (disablePayloadsDryRun) {
      return this.requestPayloadWithoutDryRun(this.urls, unsignedMetadataMsg);
    }
    return this.requestPayloadWithDryRun({ ...params, unsignedMetadataMsg });
  }

  /* 
    Call function on provider always returns some result and doesn't throw an error.
    Later we need to decode the result from the call (decodeFunctionResult) and
    this function will throw an error if the call was reverted.
  */
  async requestPayloadWithDryRun({
    unsignedMetadataMsg,
    ...params
  }: DryRunParamsWithUnsignedMetadata) {
    const promises = this.urls.map(async (url) => {
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
      return await this.contract.getDataServiceId();
    } catch (e: any) {
      throw new Error(
        `DataServiceId not provided and failed to get service id from underlying contract.` +
          e?.message
      );
    }
  }
}
