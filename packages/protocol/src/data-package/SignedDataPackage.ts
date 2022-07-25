import { assert } from "console";
import { Signature } from "ethers";
import {
  arrayify,
  base64,
  computeAddress,
  concat,
  hexlify,
  joinSignature,
  recoverPublicKey,
  splitSignature,
} from "ethers/lib/utils";
import { Serializable } from "../common/Serializable";
import { DataPackage } from "./DataPackage";

export class SignedDataPackage extends Serializable {
  public readonly signature: Signature;

  constructor(
    public readonly dataPackage: DataPackage,
    signature: Signature | string
  ) {
    super();
    if (typeof signature === "string") {
      this.signature = splitSignature(signature);
    } else {
      this.signature = signature;
    }
  }

  serializeSignatureToBytes(): Uint8Array {
    return arrayify(this.serializeSignatureToHex());
  }

  serializeSignatureToHex(): string {
    return joinSignature(this.signature);
  }

  recoverSignerPublicKey(): Uint8Array {
    const digest = this.dataPackage.getSignableHash();
    const publicKeyHex = recoverPublicKey(digest, this.signature);
    return arrayify(publicKeyHex);
  }

  recoverSignerAddress(): string {
    const signerPublicKeyBytes = this.recoverSignerPublicKey();
    return computeAddress(signerPublicKeyBytes);
  }

  toBytes(): Uint8Array {
    return concat([
      this.dataPackage.toBytes(),
      this.serializeSignatureToBytes(),
    ]);
  }

  toObj() {
    const signatureHex = this.serializeSignatureToHex();
    return {
      ...this.dataPackage.toObj(),
      signature: base64.encode(signatureHex),
    };
  }

  public static fromObj(plainObject: any): SignedDataPackage {
    const signatureBase64 = plainObject.signature;
    assert(!!signatureBase64, "Signature can not be empty");
    const signatureBytes: Uint8Array = base64.decode(signatureBase64);
    const parsedSignature = splitSignature(signatureBytes);

    const { signature, ...unsignedDataPackagePlainObj } = plainObject;
    const unsignedDataPackage = DataPackage.fromObj(
      unsignedDataPackagePlainObj
    );

    return new SignedDataPackage(unsignedDataPackage, parsedSignature);
  }
}
