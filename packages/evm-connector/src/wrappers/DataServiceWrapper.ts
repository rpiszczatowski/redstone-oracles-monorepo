import {
  DataPackagesRequestParams,
  requestRedstonePayload,
} from "redstone-sdk";
import { BaseWrapper, ParamsForDryRunVerification } from "./BaseWrapper";
import { version } from "../../package.json";

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

  async getBytesDataForAppending({
    functionName,
    contract,
    transaction,
  }: ParamsForDryRunVerification): Promise<string> {
    const unsignedMetadataMsg = this.getUnsignedMetadata();
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
}
