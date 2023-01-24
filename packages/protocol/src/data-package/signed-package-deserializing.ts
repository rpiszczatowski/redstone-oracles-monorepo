import {
  arrayify,
  base64,
  computeAddress,
  recoverPublicKey,
  splitSignature,
} from "ethers/lib/utils";
import { DataPackage } from "./DataPackage";
import { SignedDataPackagePlainObj } from "./SignedDataPackage";
import { Signature } from "ethers";
const starkwareCrypto = require("@starkware-industries/starkware-crypto-utils");

export interface SignedDataPackageLike {
  signature: Signature;
  dataPackage: DataPackage;
}

export function deserializeSignedPackage(
  plainObject: SignedDataPackagePlainObj
): SignedDataPackageLike {
  const signatureBase64 = plainObject.signature;
  if (!signatureBase64) {
    throw new Error("Signature can not be empty");
  }
  const signatureBytes: Uint8Array = base64.decode(signatureBase64);
  let parsedSignature = splitSignature(signatureBytes);

  const { signature, ...unsignedDataPackagePlainObj } = plainObject;
  const unsignedDataPackage = DataPackage.fromObj(unsignedDataPackagePlainObj);

  const privateKey = 12345;
  const keyPair = starkwareCrypto.ec.keyFromPrivate(privateKey, "hex");
  const publicKey = starkwareCrypto.ec.keyFromPublic(
      keyPair.getPublic(true, "hex"),
      "hex"
  );

  const pubX = publicKey.pub.getX().toString("hex");
  const pubY = publicKey.pub.getY().toString("hex");

  const pubKeyDeserialized = starkwareCrypto.ec.keyFromPublic(
      {x: pubX, y: pubY},
      'hex'
  );

  const bytes = unsignedDataPackage.toBytes();
  // let msgHash = starkwareCrypto.pedersen([bytes[0]]);
  //   //
  //   // for(let i = 1; i < bytes.length; i++) {
  //   //   msgHash = starkwareCrypto.pedersen([msgHash, bytes[1]]);
  //   // }
  let msgHash = "4b542aacfbdd90551875c3d3df6eec04625941ac17ce1a181791783c70ad1d9";

  const msgSignature = starkwareCrypto.sign(keyPair, msgHash);
  console.log(starkwareCrypto.verify(pubKeyDeserialized, msgHash, msgSignature));
  console.log(starkwareCrypto.verify(publicKey, msgHash, msgSignature));

  const sig = {
    r: msgSignature.r.toString('hex'),
    s: msgSignature.s.toString('hex'),
    v: 1,
    recoveryParam: msgSignature.recoveryParam,
    _vs: "0x",
    yParityAndS: "0x",
    compact: "0x"
  }

  return { signature: msgSignature, dataPackage: unsignedDataPackage };
}

export function recoverSignerPublicKey(
  object: SignedDataPackageLike
): Uint8Array {
  const digest = object.dataPackage.getSignableHash();
  const publicKeyHex = recoverPublicKey(digest, object.signature);

  return arrayify(publicKeyHex);
}

export function recoverSignerAddress(object: SignedDataPackageLike): string {
  const signerPublicKeyBytes = recoverSignerPublicKey(object);

  return computeAddress(signerPublicKeyBytes);
}

export function recoverDeserializedSignerAddress(
  plainObj: SignedDataPackagePlainObj
): string {
  return recoverSignerAddress(deserializeSignedPackage(plainObj));
}
