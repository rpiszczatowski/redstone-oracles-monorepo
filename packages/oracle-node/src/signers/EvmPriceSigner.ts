import { personalSign, recoverPersonalSignature } from "@metamask/eth-sig-util";
import { bufferToHex, keccak256, toBuffer } from "ethereumjs-util";
import { ethers } from "ethers";
import sortDeepObjectArrays from "sort-deep-object-arrays";
import {
  PricePackage,
  SerializedPriceData,
  ShortSinglePrice,
  SignedPricePackage,
} from "../types";
import _ from "lodash";
import { ISafeSigner } from "./SafeSigner";

/** IMPORTANT: This function as side effect convert Class instances to pure objects */
const sortDeepObjects = <T>(arr: T[]): T[] => sortDeepObjectArrays<T>(arr);

const serializePriceValue = (value: number): number => {
  if (typeof value === "number") {
    return Math.round(value * 10 ** 8);
  } else {
    throw new Error(
      `Don't know how to serialize ${String(value)} to price value`
    );
  }
};

export default class EvmPriceSigner {
  static getLiteDataBytesString(priceData: SerializedPriceData): string {
    // Calculating lite price data bytes array
    let data = "";
    for (let i = 0; i < priceData.symbols.length; i++) {
      const symbol = priceData.symbols[i];
      const value = priceData.values[i];
      data += symbol.substr(2) + value.toString(16).padStart(64, "0");
    }
    data += Math.ceil(priceData.timestamp / 1000)
      .toString(16)
      .padStart(64, "0");

    return data;
  }

  private static getLiteDataToSign(priceData: SerializedPriceData): string {
    const data = EvmPriceSigner.getLiteDataBytesString(priceData);
    return bufferToHex(keccak256(toBuffer("0x" + data)));
  }

  static calculateLiteEvmSignature(
    priceData: SerializedPriceData,
    privateKey: string
  ): string {
    const data = EvmPriceSigner.getLiteDataToSign(priceData);
    return personalSign({ privateKey: toBuffer(privateKey), data });
  }

  public static convertStringToBytes32String(str: string) {
    if (str.length > 31) {
      // TODO: improve checking if str is a valid bytes32 string later
      const bytes32StringLength = 32 * 2 + 2; // 32 bytes (each byte uses 2 symbols) + 0x
      if (str.length === bytes32StringLength && str.startsWith("0x")) {
        return str;
      } else {
        // Calculate keccak hash if string is bigger than 32 bytes
        return ethers.utils.id(str);
      }
    } else {
      return ethers.utils.formatBytes32String(str);
    }
  }

  static serializeToMessage(pricePackage: PricePackage): SerializedPriceData {
    // We clean and sort prices to be sure that prices
    // always have the same format
    const cleanPricesData = pricePackage.prices.map((p) => ({
      symbol: EvmPriceSigner.convertStringToBytes32String(p.symbol),
      value: serializePriceValue(p.value),
    }));
    const sortedPrices = sortDeepObjects(cleanPricesData);

    const symbols: string[] = [];
    const values: number[] = [];
    sortedPrices.forEach((p: ShortSinglePrice) => {
      symbols.push(p.symbol);
      values.push(p.value);
    });
    return {
      symbols,
      values,
      timestamp: pricePackage.timestamp,
    };
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  signPricePackage(
    pricePackage: PricePackage,
    safeSigner: ISafeSigner
  ): SignedPricePackage {
    const serializedPriceData = EvmPriceSigner.serializeToMessage(pricePackage);

    return {
      pricePackage,
      signerAddress: safeSigner.address,
      liteSignature: safeSigner.calculateLiteEvmSignature(serializedPriceData),
    };
  }

  static verifyLiteSignature(signedPricePackage: SignedPricePackage): boolean {
    const serializedPriceData = EvmPriceSigner.serializeToMessage(
      signedPricePackage.pricePackage
    );
    const data = EvmPriceSigner.getLiteDataToSign(serializedPriceData);

    const signer = recoverPersonalSignature({
      data,
      signature: signedPricePackage.liteSignature,
    });

    const signerAddressUC = signer.toUpperCase();
    const expectedSignerAddress = signedPricePackage.signerAddress;
    const expectedSignerAddressUC = expectedSignerAddress.toUpperCase();

    return signerAddressUC === expectedSignerAddressUC;
  }
}
