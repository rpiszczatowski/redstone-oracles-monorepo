import { Signature } from "ethers";
import { arrayify, SigningKey } from "ethers/lib/utils";
import { ECDSASignerBase } from "./ECDSASignerBase";

export default class ECDSASignerPrivateKey extends ECDSASignerBase {
  constructor(private readonly privateKey: string) {
    super();
  }

  async signHash(hash: Uint8Array): Promise<Signature> {
    return new SigningKey(this.privateKey).signDigest(hash);
  }
}
