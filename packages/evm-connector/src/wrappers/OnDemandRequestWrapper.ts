import axios from "axios";
import { Contract, Signer } from "ethers";
import {
  SignedDataPackage,
  RedstonePayload,
  SignedDataPackagePlainObj,
  ScoreType,
  UniversalSigner,
  prepareMessageToSign,
} from "redstone-protocol";
import { BaseWrapper, ParamsForDryRunVerification } from "./BaseWrapper";
import { version } from "../../package.json";

export interface OnDemandRequestParams {
  signer: Signer;
  scoreType: ScoreType;
}

export class OnDemandRequestWrapper extends BaseWrapper {
  constructor(
    private readonly requestParams: OnDemandRequestParams,
    private readonly nodeUrls: string[]
  ) {
    super();
  }

  getUnsignedMetadata(): string {
    return `${version}#on-demand-request`;
  }

  async dryRunToVerifyPayload(payloads: string[]): Promise<string> {
    return payloads[0];
  }

  async getBytesDataForAppending(params: ParamsForDryRunVerification): Promise<string> {
    const timestamp = await this.requestTimestamp(params.contract);
    const message = prepareMessageToSign(timestamp);
    const { signer, scoreType } = this.requestParams;
    const signature = await UniversalSigner.signWithEthereumHashMessage(
      signer,
      message
    );
    const promises = this.nodeUrls.map((url) =>
      axios.get(url, {
        params: { timestamp, signature, scoreType },
      })
    );
    const responses = await Promise.all(promises);
    const signedDataPackages = responses.map((response) =>
      SignedDataPackage.fromObj(response.data as SignedDataPackagePlainObj)
    );
    const unsignedMetadata = this.getUnsignedMetadata();
    return RedstonePayload.prepare(signedDataPackages, unsignedMetadata);
  }

  async requestTimestamp(contract: Contract): Promise<number> {
    const blockNumber = await contract.provider.getBlockNumber();
    const block = await contract.provider.getBlock(blockNumber);
    return block.timestamp * 1000;
  }
}
