import { UniversalSigner } from "@redstone-finance/protocol";
import { Signature, Wallet, ethers } from "ethers";
import { SigningKey } from "ethers/lib/utils";
import { SerializedPriceData } from "../types";
import EvmPriceSigner from "./EvmPriceSigner";

export interface ISafeSigner {
  signStringifiableData: (data: unknown) => string;
  calculateLiteEvmSignature: (priceData: SerializedPriceData) => string;
  signDigest: (hash: Uint8Array) => Signature;
  veryUnsafeGetPrivateKey: () => string;
  address: string;
}

const signDigest = (hash: Uint8Array, privateKey: string) => {
  const signingKey = new SigningKey(privateKey);

  return signingKey.signDigest(hash);
};

/** Use for tests */
export function TestSafeSignerFromPrivateKey(privateKey: string): ISafeSigner {
  return Object.freeze({
    signStringifiableData: (data: unknown) =>
      UniversalSigner.signStringifiableData(data, privateKey),
    calculateLiteEvmSignature: (priceData: SerializedPriceData) =>
      EvmPriceSigner.calculateLiteEvmSignature(priceData, privateKey),
    signDigest: (hash: Uint8Array) => signDigest(hash, privateKey),
    veryUnsafeGetPrivateKey: () => privateKey,
    address: new Wallet(privateKey).address,
  });
}

/**
 * As side effect removes {envName} from process.env
 */
export function SafeSignerFromProcessEnv(envName: string): ISafeSigner {
  if (!process.env[envName]) {
    throw new Error(
      `Failed to create ${SafeSignerFromProcessEnv.name} missing env: ${envName}`
    );
  }

  const suffix = process.env[envName]!.startsWith("0x") ? "" : "0x";
  const privateKey = suffix + process.env[envName];
  const address = new ethers.Wallet(privateKey).address;
  process.env[envName] = "[PRIVATE KEY WAS REMOVED]";

  return Object.freeze({
    signStringifiableData: (data: unknown) =>
      UniversalSigner.signStringifiableData(data, privateKey),
    calculateLiteEvmSignature: (priceData: SerializedPriceData) =>
      EvmPriceSigner.calculateLiteEvmSignature(priceData, privateKey),
    signDigest: (hash: Uint8Array) => signDigest(hash, privateKey),
    veryUnsafeGetPrivateKey: () => privateKey,
    address,
  });
}
