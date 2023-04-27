import { hexlify } from "ethers/lib/utils";
import {
  REDSTONE_MARKER_BS,
  SIGNATURE_BS,
  UNSIGNED_METADATA_BYTE_SIZE_BS,
  SIGNERS_COUNT_BS,
  REDSTONE_PAYLOAD_VERSION_BS,
} from "../common/redstone-constants";
import { DataPackage } from "../data-package/DataPackage";
import { MultiSignDataPackage } from "../data-package/MultiSignDataPackage";
import {
  RedstonePayloadParserBase,
  RedstonePayloadParsingResult,
} from "./RedstonePayloadParserBase";

export interface RedstoneMultiSignPayloadParsingResult
  extends RedstonePayloadParsingResult {
  signedDataPackage: MultiSignDataPackage;
}

export class RedstoneMultiSignPayloadParser extends RedstonePayloadParserBase {
  constructor(protected bytesData: Uint8Array) {
    super(bytesData);
  }

  parse(): RedstoneMultiSignPayloadParsingResult {
    this.assertValidRedstoneMarker();

    let unsignedMetadata = this.extractUnsignedMetadata();

    let negativeOffset =
      unsignedMetadata.length +
      REDSTONE_PAYLOAD_VERSION_BS +
      UNSIGNED_METADATA_BYTE_SIZE_BS +
      REDSTONE_MARKER_BS;

    const signedDataPackage = this.extractSignedDataPackage(negativeOffset);
    negativeOffset += signedDataPackage.toBytes().length;

    const remainderPrefix = this.slice({
      negativeOffset: negativeOffset,
      length: this.bytesData.length - negativeOffset,
    });

    return {
      signedDataPackage: signedDataPackage,
      unsignedMetadata: unsignedMetadata,
      remainderPrefix: remainderPrefix,
    };
  }

  extractSignedDataPackage(
    initialNegativeOffset: number
  ): MultiSignDataPackage {
    // Extracting signature
    let negativeOffset = initialNegativeOffset;

    const signaturesCount = this.extractNumber({
      negativeOffset,
      length: SIGNERS_COUNT_BS,
    });

    negativeOffset += SIGNERS_COUNT_BS;

    const signatures = [];
    for (let i = 0; i < signaturesCount; i++) {
      const signature = this.slice({
        negativeOffset,
        length: SIGNATURE_BS,
      });
      signatures.push(signature);
      negativeOffset += SIGNATURE_BS;
    }

    // Extracting number of data points
    const { dataPoints, timestamp } = this.extractDataPoints(negativeOffset);

    return new MultiSignDataPackage(
      new DataPackage(dataPoints, timestamp),
      signatures.map((signature) => hexlify(signature)).reverse()
    );
  }
}
