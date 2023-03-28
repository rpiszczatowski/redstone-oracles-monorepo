import { Signature } from "ethers";
import {
  arrayify,
  base64,
  concat,
  joinSignature,
  splitSignature,
} from "ethers/lib/utils";
import { Serializable } from "../common/Serializable";
import { DataPackage, DataPackagePlainObj } from "./DataPackage";
import {
  deserializeMultiSignPackage,
  recoverSignerAddresses,
  recoverSignerPublicKeys,
  MultiSignDataPackageLike,
} from "./multi-sign-package-deserializing";
import { convertIntegerNumberToBytes } from "../common/utils";
import { SIGNERS_COUNT_BS } from "../common/redstone-constants";

export interface MultiSignDataPackagePlainObj extends DataPackagePlainObj {
  signatures: string[]; // base64-encoded joined signatures
}

export class MultiSignDataPackage extends Serializable
  implements MultiSignDataPackageLike {
  public readonly signatures: Signature[];

  constructor(
    public readonly dataPackage: DataPackage,
    signatures: Signature[] | string[]
  ) {
    super();
    this.signatures = signatures.map((signature) =>
      typeof signature === "string" ? splitSignature(signature) : signature
    );
  }

  serializeSignaturesToBytes(): Uint8Array {
    const signaturesBytes = concat(
      this.serializeSignaturesToHex().map((signature) => arrayify(signature))
    );
    return signaturesBytes;
  }

  protected serializeSignaturesCount(): Uint8Array {
    const signaturesCount = this.signatures.length;
    return convertIntegerNumberToBytes(signaturesCount, SIGNERS_COUNT_BS);
  }

  serializeSignaturesToHex(): string[] {
    const signatures: string[] = this.signatures.map((signature) =>
      joinSignature(signature)
    );
    return signatures;
  }

  recoverSignersPublicKeys(): Uint8Array[] {
    return recoverSignerPublicKeys(this);
  }

  recoverSignersAddresses(): string[] {
    return recoverSignerAddresses(this);
  }

  toBytes(): Uint8Array {
    return concat([
      this.dataPackage.toBytes(),
      this.serializeSignaturesToBytes(),
      this.serializeSignaturesCount(),
    ]);
  }

  toObj(): MultiSignDataPackagePlainObj {
    const signaturesHex = this.serializeSignaturesToHex();

    return {
      ...this.dataPackage.toObj(),
      signatures: signaturesHex.map((signature) => base64.encode(signature)),
    };
  }

  public static fromObj(
    plainObject: MultiSignDataPackagePlainObj
  ): MultiSignDataPackage {
    return MultiSignDataPackage.fromObjLikeThis(
      deserializeMultiSignPackage(plainObject)
    );
  }

  private static fromObjLikeThis(object: MultiSignDataPackageLike) {
    return new MultiSignDataPackage(object.dataPackage, object.signatures);
  }
}
