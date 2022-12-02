import {
  DataPackagesRequestParams,
  requestRedstonePayload,
} from "redstone-sdk";
import { BaseWrapper, ParamsForDryRunVerification } from "./BaseWrapper";
import { version } from "../../package.json";

export const SHOULD_RUN_DRY_RUN = false;

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
    if (SHOULD_RUN_DRY_RUN) {
      return this.requestPayloadWithDryRun({ ...params, unsignedMetadataMsg });
    }
    return this.requestPayloadWithoutDryRun(unsignedMetadataMsg);
  }

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
    return Promise.any(promises).catch(() => {
      throw new Error("All redstone payloads don't pass dry run verification");
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
