import {
  DataPackagesRequestParams,
  requestRedstonePayloadsToVerify,
} from "redstone-sdk";
import { BaseWrapper } from "./BaseWrapper";
import { version } from "../../package.json";
import { Contract, PopulatedTransaction } from "ethers";

export class DataServiceWrapper extends BaseWrapper {
  constructor(
    private dataPackagesRequestParams: DataPackagesRequestParams,
    private urls?: string[]
  ) {
    super();
  }

  getUnsignedMetadata(): string {
    return `${version}#${this.dataPackagesRequestParams.dataServiceId}`;
  }

  async getBytesDataForAppending(): Promise<string[]> {
    const unsignedMetadataMsg = this.getUnsignedMetadata();
    const redstonePayloads = await requestRedstonePayloadsToVerify(
      this.dataPackagesRequestParams,
      this.urls,
      unsignedMetadataMsg
    );
    return redstonePayloads;
  }

  override async dryRunToVerifyPayload(
    payloads: string[],
    functionName: string,
    contract: Contract,
    transaction: PopulatedTransaction
  ): Promise<string> {
    for (const payload of payloads) {
      try {
        transaction.data = transaction.data + payload;
        const result = await contract.signer.call(transaction);
        contract.interface.decodeFunctionResult(functionName, result);
        return payload;
      } catch {}
    }
    throw new Error("All redstone payloads don't pass dry run verification");
  }
}
