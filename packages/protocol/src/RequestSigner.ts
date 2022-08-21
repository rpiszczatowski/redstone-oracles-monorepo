import {
  computeAddress,
  joinSignature,
  keccak256,
  recoverPublicKey,
  SigningKey,
  toUtf8Bytes,
} from "ethers/lib/utils";

export class RequestSigner {
  static getDigestForData(data: any) {
    const message = JSON.stringify(data);
    const digest = keccak256(toUtf8Bytes(message));
    return digest;
  }

  static signStringifiableData(data: any, privateKey: string): string {
    const digest = RequestSigner.getDigestForData(data);
    const signingKey = new SigningKey(privateKey);
    const fullSignature = signingKey.signDigest(digest);
    return joinSignature(fullSignature);
  }

  static recoverSigner(data: any, signature: string) {
    const digest = RequestSigner.getDigestForData(data);
    const publicKey = recoverPublicKey(digest, signature);
    return computeAddress(publicKey);
  }
}
