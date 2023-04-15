import { BytesLike, hexlify, joinSignature } from "ethers/lib/utils";
import { RedstonePayload, SignedDataPackage } from "redstone-protocol";

const starkwareCrypto = require("@starkware-industries/starkware-crypto-utils");

const privateKey = hexlify(12345);

export class StarknetRehasher {
  rehash(payloadOrBytes: Uint8Array | RedstonePayload): RedstonePayload {
    let signedDataPackages: SignedDataPackage[];

    if (payloadOrBytes instanceof RedstonePayload) {
      signedDataPackages = payloadOrBytes.signedDataPackages;
    } else {
      const parsedPayload = RedstonePayload.parse(payloadOrBytes);

      signedDataPackages = parsedPayload.signedDataPackages;
    }

    const rehashedDataPackages = signedDataPackages.map((signedDataPackage) => {
      let dataPackage = signedDataPackage.dataPackage;
      dataPackage.hasher = StarknetRehasher.pedersen;
      dataPackage.signer = StarknetRehasher.sign;

      return dataPackage.sign(privateKey);
    });

    return new RedstonePayload(rehashedDataPackages, "");
  }

  static pedersen(bytes: BytesLike): Uint8Array {
    let state = starkwareCrypto.pedersen([bytes[0]]);

    for (let i = 1; i < bytes.length; i++) {
      state = starkwareCrypto.pedersen([bytes[i], state]);
    }

    return state;
  }

  static sign(msgHash: BytesLike, privateKey: BytesLike): string {
    const keyPair = starkwareCrypto.ec.keyFromPrivate(privateKey, "hex");
    const publicKey = starkwareCrypto.ec.keyFromPublic(
      keyPair.getPublic(true, "hex"),
      "hex"
    );
    const pubX = publicKey.pub.getX().toString("hex");
    const pubY = publicKey.pub.getY().toString("hex");
    const pubKeyDeserialized = starkwareCrypto.ec.keyFromPublic(
      { x: pubX, y: pubY },
      "hex"
    );

    console.log(`HASH: ${msgHash}`);
    console.log(`pubX: ${pubX}`);

    const msgSignature = starkwareCrypto.sign(keyPair, msgHash);
    console.log(
      starkwareCrypto.verify(pubKeyDeserialized, msgHash, msgSignature)
    );
    console.log(starkwareCrypto.verify(publicKey, msgHash, msgSignature));

    const signatureString = joinSignature({
      r: hexlify("0x" + msgSignature.r.toString("hex"), { hexPad: "left" }),
      s: hexlify("0x" + msgSignature.s.toString("hex"), { hexPad: "left" }),
      recoveryParam: msgSignature.recoveryParam,
    });

    console.log("SIG: " + signatureString);

    return signatureString;
  }
}
