import { Signature } from "ethers";
import { SigningKey } from "ethers/lib/utils";
import { ECDSASignerBase } from "./ECDSASignerBase";

export default class ECDSASignerKMS extends ECDSASignerBase {
  constructor(private readonly kmsARN: string) {
    super();
  }

  // TODO: implement request to KMS
  async signHash(hash: Uint8Array): Promise<Signature> {
    return new SigningKey("0x1234").signDigest(hash);
  }
}
