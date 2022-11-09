import { Signature } from "ethers";
import { hexlify, splitSignature } from "ethers/lib/utils";
import { ECDSASignerBase } from "./ECDSASignerBase";
import KMS from "aws-sdk/clients/kms";

export default class ECDSASignerKMS extends ECDSASignerBase {
  constructor(private readonly kmsARN: string) {
    super();
  }

  async signHash(hash: Uint8Array): Promise<Signature> {
    const kms = new KMS({});
    const signingResult = await kms
      .sign({
        // TOOD: move it to config.ts
        KeyId: process.env.AWS_KMS_KEY_ID || "",
        Message: hexlify(hash),
        SigningAlgorithm: "ECDSA_SHA_512",
      })
      .promise();
    const signatureHex = signingResult.Signature!.toString("hex");
    return splitSignature(signatureHex);
  }
}
