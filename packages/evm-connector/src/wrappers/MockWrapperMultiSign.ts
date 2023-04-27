import {
  DataPackage,
  RedstonePayloadMultiSign,
} from "redstone-protocol";
import {
  MockSignerAddress,
  getMockSignerPrivateKey,
} from "../helpers/test-utils";
import { BaseWrapper } from "./BaseWrapper";
import { version } from "../../package.json";

export interface MockMultiSignDataPackageConfig {
  signers: MockSignerAddress[];
  dataPackage: DataPackage;
}

export class MockWrapperMultiSign extends BaseWrapper {
  constructor(private mockDataPackage: MockMultiSignDataPackageConfig) {
    super();
  }

  getUnsignedMetadata(): string {
    return `${version}#mock`;
  }

  async dryRunToVerifyPayload(payloads: string[]): Promise<string> {
    return payloads[0];
  }

  async getBytesDataForAppending(): Promise<string> {
    const privateKeys = [];

    for (const mockDataPackage of this.mockDataPackage.signers) {
      const privateKey = getMockSignerPrivateKey(mockDataPackage);
      privateKeys.push(privateKey);
    }

    const signedDataPackage =
      this.mockDataPackage.dataPackage.multiSign(privateKeys);
    const unsignedMetadata = this.getUnsignedMetadata();

    return RedstonePayloadMultiSign.prepare(signedDataPackage, unsignedMetadata);
  }
}
