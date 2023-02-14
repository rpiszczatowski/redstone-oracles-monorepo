import {
  arrayify,
  base64,
  computeAddress,
  recoverPublicKey,
  splitSignature,
} from "ethers/lib/utils";
import { DataPackage } from "./DataPackage";
import { MultiSignDataPackagePlainObj } from "./MultiSignDataPackage";
import { Signature } from "ethers";

export interface MultiSignDataPackageLike {
  signatures: Signature[];
  dataPackage: DataPackage;
}

export function deserializeMultiSignPackage(
  plainObject: MultiSignDataPackagePlainObj
): MultiSignDataPackageLike {
  const signaturesBase64 = plainObject.signatures;
  if (!signaturesBase64) {
    throw new Error("Signatures can not be empty");
  }
  const signaturesBytes: Uint8Array[] = signaturesBase64.map(
    (signatureBase64) => base64.decode(signatureBase64)
  );
  const parsedSignatures = signaturesBytes.map((signatureBytes) =>
    splitSignature(signatureBytes)
  );

  const { signatures, ...unsignedDataPackagePlainObj } = plainObject;
  const unsignedDataPackage = DataPackage.fromObj(unsignedDataPackagePlainObj);

  return { signatures: parsedSignatures, dataPackage: unsignedDataPackage };
}

export function recoverSignerPublicKeys(
  object: MultiSignDataPackageLike
): Uint8Array[] {
  const digest = object.dataPackage.getSignableHash();
  const publicKeysHex = object.signatures.map((signature) =>
    recoverPublicKey(digest, signature)
  );

  return publicKeysHex.map((publicKeyHex) => arrayify(publicKeyHex));
}

export function recoverSignerAddresses(
  object: MultiSignDataPackageLike
): string[] {
  const signerPublicKeysBytes = recoverSignerPublicKeys(object);

  return signerPublicKeysBytes.map((signerPublicKeyBytes) =>
    computeAddress(signerPublicKeyBytes)
  );
}

export function recoverDeserializedSignerAddresses(
  plainObj: MultiSignDataPackagePlainObj
): string[] {
  return recoverSignerAddresses(deserializeMultiSignPackage(plainObj));
}
