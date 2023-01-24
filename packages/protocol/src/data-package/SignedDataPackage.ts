import { Signature } from "ethers";
import {
  arrayify,
  base64,
  concat,
  splitSignature,
} from "ethers/lib/utils";
import { Serializable } from "../common/Serializable";
import { DataPackage, DataPackagePlainObj } from "./DataPackage";
import {
  deserializeSignedPackage,
  recoverSignerAddress,
  recoverSignerPublicKey,
  SignedDataPackageLike,
} from "./signed-package-deserializing";
const BN = require('bn.js');

export interface SignedDataPackagePlainObj extends DataPackagePlainObj {
  signature: string; // base64-encoded joined signature
}

export class SignedDataPackage
  extends Serializable
  implements SignedDataPackageLike
{
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
    const f = BN.prototype.toString;

    const x=
        `0x0${f.call(this.signature.r, 'hex')}0${f.call(this.signature.s, 'hex')}${this.signature.recoveryParam ? "1c": "1b"}`;
    console.log(`==> ${x}`);
    console.log(arrayify(x).length);

    return x;
  }

  recoverSignerPublicKey(): Uint8Array {
    return recoverSignerPublicKey(this);
  }

  recoverSignerAddress(): string {
    return recoverSignerAddress(this);
  }

  toBytes(): Uint8Array {
    return concat([
      this.dataPackage.toBytes(),
      this.serializeSignatureToBytes(),
    ]);
  }

  toObj(): SignedDataPackagePlainObj {
    const signatureHex = this.serializeSignatureToHex();

    return {
      ...this.dataPackage.toObj(),
      signature: base64.encode(signatureHex),
    };
  }

  public static fromObj(
    plainObject: SignedDataPackagePlainObj
  ): SignedDataPackage {
    return SignedDataPackage.fromObjLikeThis(
      deserializeSignedPackage(plainObject)
    );
  }

  private static fromObjLikeThis(object: SignedDataPackageLike) {
    return new SignedDataPackage(object.dataPackage, object.signature);
  }
}
