import { hexlify } from "ethers/lib/utils";
import {
  DATA_PACKAGES_COUNT_BS,
  REDSTONE_MARKER_BS,
  REDSTONE_PAYLOAD_VERSION_BS,
  SIGNATURE_BS,
  UNSIGNED_METADATA_BYTE_SIZE_BS,
} from "../common/redstone-constants";
import { DataPackage } from "../data-package/DataPackage";
import { SignedDataPackage } from "../data-package/SignedDataPackage";
import {
  RedstonePayloadParserBase,
  RedstonePayloadParsingResult,
} from "./RedstonePayloadParserBase";

export interface RedstoneSingleSignPayloadParsingResult
  extends RedstonePayloadParsingResult {
  signedDataPackages: SignedDataPackage[];
}

export class RedstoneSingleSignPayloadParser extends RedstonePayloadParserBase {
  constructor(protected bytesData: Uint8Array) {
    super(bytesData);
  }

  parse(): RedstoneSingleSignPayloadParsingResult {
    this.assertValidRedstoneMarker();

    let unsignedMetadata = this.extractUnsignedMetadata();

    let negativeOffset =
      unsignedMetadata.length +
      REDSTONE_PAYLOAD_VERSION_BS +
      UNSIGNED_METADATA_BYTE_SIZE_BS +
      REDSTONE_MARKER_BS;

    const numberOfDataPackages = this.extractNumber({
      negativeOffset,
      length: DATA_PACKAGES_COUNT_BS,
    });

    negativeOffset += DATA_PACKAGES_COUNT_BS;

    const signedDataPackages: SignedDataPackage[] = [];
    for (let i = 0; i < numberOfDataPackages; i++) {
      const signedDataPackage = this.extractSignedDataPackage(negativeOffset);
      signedDataPackages.push(signedDataPackage);
      negativeOffset += signedDataPackage.toBytes().length;
    }

    const remainderPrefix = this.slice({
      negativeOffset,
      length: this.bytesData.length - negativeOffset,
    });

    return {
      signedDataPackages: signedDataPackages.reverse(), // reversing, because we read from the end
      unsignedMetadata,
      remainderPrefix,
    };
  }

  extractSignedDataPackage(initialNegativeOffset: number): SignedDataPackage {
    // Extracting signature
    let negativeOffset = initialNegativeOffset;

    const signature = this.slice({
      negativeOffset,
      length: SIGNATURE_BS,
    });

    negativeOffset += SIGNATURE_BS;

    // Extracting number of data points
    const { dataPoints, timestamp } = this.extractDataPoints(negativeOffset);

    return new SignedDataPackage(
      new DataPackage(dataPoints, timestamp),
      hexlify(signature)
    );
  }
}
