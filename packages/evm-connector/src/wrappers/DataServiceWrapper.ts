import {
  DataPackagesRequestParams,
  requestRedstonePayload,
} from "redstone-sdk";
import { BaseWrapper, ParamsForDryRunVerification } from "./BaseWrapper";
import { version } from "../../package.json";

interface RequestPayloadWithDryRunParams extends ParamsForDryRunVerification {
  unsignedMetadataMsg: string;
}

export class DataServiceWrapper extends BaseWrapper {
  constructor(
    private dataPackagesRequestParams: DataPackagesRequestParams,
    private urls: string[]
  ) {
    super();
  }

  getUnsignedMetadata(): string {
    return `${version}#${this.dataPackagesRequestParams.dataServiceId}`;
  }

  async getBytesDataForAppending(
    params: ParamsForDryRunVerification
  ): Promise<string> {
    const unsignedMetadataMsg = this.getUnsignedMetadata();
    const shouldDryRunPayloads = Boolean(
      this.dataPackagesRequestParams.shouldDryRunPayloads
    );
    if (shouldDryRunPayloads) {
      return this.requestPayloadWithDryRun({ ...params, unsignedMetadataMsg });
    }
    return this.requestPayloadWithoutDryRun(unsignedMetadataMsg);
  }

  /* 
    Call function on provider always returns some result and doesn't throw an error.
    Later we nee to decode result from the call (decodeFunctionResult) and
    this function will throw error if call was reverted.
  */
  async requestPayloadWithDryRun({
    functionName,
    contract,
    transaction,
    unsignedMetadataMsg,
  }: RequestPayloadWithDryRunParams) {
    const promises = this.urls.map(async (url) => {
      const transactionToTest = Object.assign({}, transaction);
      const redstonePayload = await requestRedstonePayload(
        this.dataPackagesRequestParams,
        [url],
        unsignedMetadataMsg
      );
      transactionToTest.data = transactionToTest.data + redstonePayload;
      const result = await contract.provider.call(transactionToTest);
      contract.interface.decodeFunctionResult(functionName, result);
      return redstonePayload;
    });
    return Promise.any(promises).catch((error: any) => {
      throw new Error(
        `All redstone payloads don't pass dry run verification, aggregated errors: ${JSON.stringify(
          error.errors,
          null,
          2
        )}`
      );
    });
  }

  async requestPayloadWithoutDryRun(unsignedMetadataMsg: string) {
    return requestRedstonePayload(
      this.dataPackagesRequestParams,
      this.urls,
      unsignedMetadataMsg
    );
  }
}
