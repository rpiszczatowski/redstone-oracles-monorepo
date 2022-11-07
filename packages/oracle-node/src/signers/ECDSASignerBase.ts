import { Signature } from "ethers";
import { DataPackage, SignedDataPackage } from "redstone-protocol";

export abstract class ECDSASignerBase {
  async sign(dataPackage: DataPackage): Promise<SignedDataPackage> {
    const signableHash = dataPackage.getSignableHash();
    const signature = await this.signHash(signableHash);
    return new SignedDataPackage(dataPackage, signature);
  }

  abstract signHash(hash: Uint8Array): Promise<Signature>;
}
