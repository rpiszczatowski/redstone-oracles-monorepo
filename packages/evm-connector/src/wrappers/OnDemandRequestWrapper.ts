import axios from "axios";
import { Signer } from "ethers";
import {
  SignedDataPackage,
  RedstonePayload,
  SignedDataPackagePlainObj,
  UniversalSigner,
  prepareMessageToSign,
} from "redstone-protocol";
import { BaseWrapper } from "./BaseWrapper";
import { version } from "../../package.json";

export type OnDemandRequestParams = Record<string, string>;

export class OnDemandRequestWrapper extends BaseWrapper {
  constructor(
    private readonly signer: Signer,
    private readonly requestParams: OnDemandRequestParams,
    private readonly nodeUrls: string[]
  ) {
    super();
  }

  getUnsignedMetadata(): string {
    return `${version}#on-demand-request`;
  }

  async getBytesDataForAppending(): Promise<string> {
    const timestamp = Date.now();
    const message = prepareMessageToSign(timestamp);


    let signature;
    if (this.signer) {
      signature = await UniversalSigner.signWithEthereumHashMessage(
        this.signer,
        message
      );
    }

    const params = { timestamp, signature, ...this.requestParams };
    const promises = this.nodeUrls.map((url) =>
      axios.get(url, {
        params
      })
    );

    const responses = await Promise.all(promises);
    const signedDataPackages = responses.map((response) =>
      SignedDataPackage.fromObj(response.data as SignedDataPackagePlainObj)
    );
    const unsignedMetadata = this.getUnsignedMetadata();

    return RedstonePayload.prepare(signedDataPackages, unsignedMetadata);
  }
}
