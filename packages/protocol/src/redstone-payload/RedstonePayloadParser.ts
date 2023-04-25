import { BigNumber } from "ethers";
import { hexlify, toUtf8String } from "ethers/lib/utils";
import {
  DATA_FEED_ID_BS,
  DATA_PACKAGES_COUNT_BS,
  DATA_POINTS_COUNT_BS,
  DATA_POINT_VALUE_BYTE_SIZE_BS,
  REDSTONE_MARKER_BS,
  REDSTONE_MARKER_HEX,
  SIGNATURE_BS,
  TIMESTAMP_BS,
  UNSIGNED_METADATA_BYTE_SIZE_BS,
  REDSTONE_PAYLOAD_VERSION_BS,
  SINGLESIGN_REDSTONE_PAYLOAD_VERSION,
  MULTISIGN_REDSTONE_PAYLOAD_VERSION,
  SIGNERS_COUNT_BS,
} from "../common/redstone-constants";
import { convertBytesToNumber } from "../common/utils";
import { DataPackage } from "../data-package/DataPackage";
import { MultiSignDataPackage } from "../data-package/MultiSignDataPackage";
import { SignedDataPackage } from "../data-package/SignedDataPackage";
import { DataPoint } from "../data-point/DataPoint";
import { NumericDataPoint } from "../data-point/NumericDataPoint";

export interface RedstonePayloadParsingResult {
  signedDataPackages: SignedDataPackage[] | MultiSignDataPackage;
  unsignedMetadata: Uint8Array;
  remainderPrefix: Uint8Array;
}

interface DataPointExtractionResult {
  dataPoints: DataPoint[];
  timestamp: number;
}

type SliceConfig = { negativeOffset: number; length: number };

export class RedstonePayloadParser {
  // Last bytes of bytesData must contain valid redstone payload
  constructor(private bytesData: Uint8Array) {}

  parse(): RedstonePayloadParsingResult {
    this.assertValidRedstoneMarker();

    const unsignedMetadataSize = this.extractNumber({
      negativeOffset: REDSTONE_MARKER_BS,
      length: UNSIGNED_METADATA_BYTE_SIZE_BS,
    });

    const version = this.extractPayloadVersion(unsignedMetadataSize);

    let unsignedMetadata = this.extractUnsignedMetadata(unsignedMetadataSize);

    let negativeOffset =
      unsignedMetadataSize +
      UNSIGNED_METADATA_BYTE_SIZE_BS +
      REDSTONE_MARKER_BS;

    let numberOfDataPackages = 0;

    if (version === SINGLESIGN_REDSTONE_PAYLOAD_VERSION) {
      numberOfDataPackages = this.extractNumber({
        negativeOffset,
        length: DATA_PACKAGES_COUNT_BS,
      });
      negativeOffset += DATA_PACKAGES_COUNT_BS;
    } else {
      numberOfDataPackages = 1;
    }

    const signedDataPackages = this.extractDataPackages(
      numberOfDataPackages,
      version,
      negativeOffset
    );

    if (Array.isArray(signedDataPackages)) {
      negativeOffset += signedDataPackages.reduce((acc, dataPackage) => {
        return acc + dataPackage.toBytes().length;
      }, 0);
    } else {
      negativeOffset += (signedDataPackages as MultiSignDataPackage).toBytes().length;
    }

    // Preparing remainder prefix bytes
    const remainderPrefix = this.slice({
      negativeOffset,
      length: this.bytesData.length - negativeOffset,
    });

    return {
      signedDataPackages: signedDataPackages, // reversing, because we read from the end
      unsignedMetadata,
      remainderPrefix,
    };
  }

  extractPayloadVersion(unsignedMetadataSize: number): number {
    // In the first version of the payload (single-sign), the unsigned metadata does not contain
    // a version number. In the second version (multi-sign), the unsigned metadata contains a
    // version_number field. This method checks for the presence of the version_number field and
    // determines the appropriate payload version accordingly.

    // Check if there's enough space for a version number
    if (unsignedMetadataSize < REDSTONE_PAYLOAD_VERSION_BS) {
      return SINGLESIGN_REDSTONE_PAYLOAD_VERSION;
    }

    const potentialVersionOffset =
      REDSTONE_MARKER_BS +
      UNSIGNED_METADATA_BYTE_SIZE_BS +
      unsignedMetadataSize -
      REDSTONE_PAYLOAD_VERSION_BS;

    const potentialVersion = this.extractNumber({
      negativeOffset: potentialVersionOffset,
      length: REDSTONE_PAYLOAD_VERSION_BS,
    });

    // Check if the extracted value matches the known version number
    if (potentialVersion === MULTISIGN_REDSTONE_PAYLOAD_VERSION) {
      return MULTISIGN_REDSTONE_PAYLOAD_VERSION;
    }

    // If the version number is not present or doesn't match a known version, assume the first version
    return SINGLESIGN_REDSTONE_PAYLOAD_VERSION;
  }

  extractUnsignedMetadata(unsignedMetadataSize: number): Uint8Array {
    return this.slice({
      negativeOffset: REDSTONE_MARKER_BS + UNSIGNED_METADATA_BYTE_SIZE_BS,
      length: unsignedMetadataSize - REDSTONE_PAYLOAD_VERSION_BS,
    });
  }

  assertValidRedstoneMarker() {
    const redstoneMarker = this.slice({
      negativeOffset: 0,
      length: REDSTONE_MARKER_BS,
    });
    const redstoneMarkerHex = hexlify(redstoneMarker);

    if (redstoneMarkerHex !== REDSTONE_MARKER_HEX) {
      throw new Error(`Received invalid redstone marker: ${redstoneMarkerHex}`);
    }
  }

  extractDataPackages(
    numberOfDataPackages: number,
    version: number,
    negativeOffset: number
  ): SignedDataPackage[] | MultiSignDataPackage {
    const signedDataPackages: SignedDataPackage[] = [];

    if (version === SINGLESIGN_REDSTONE_PAYLOAD_VERSION) {
      for (let i = 0; i < numberOfDataPackages; i++) {
        const signedDataPackage = this.extractSignedDataPackage(negativeOffset);
        signedDataPackages.push(signedDataPackage);
        negativeOffset += signedDataPackage.toBytes().length;
      }
      return signedDataPackages.reverse();
    } else if (version === MULTISIGN_REDSTONE_PAYLOAD_VERSION) {
      return this.extractMultiSignDataPackage(negativeOffset);
    } else {
      throw new Error(`Unsupported redstone payload version: ${version}`);
    }
  }

  extractMultiSignDataPackage(
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

  extractDataPoints(negativeOffset: number): DataPointExtractionResult {
    const dataPointsCount = this.extractNumber({
      negativeOffset,
      length: DATA_POINTS_COUNT_BS,
    });

    // Extracting data points value byte size
    negativeOffset += DATA_POINTS_COUNT_BS;
    const dataPointsValueSize = this.extractNumber({
      negativeOffset,
      length: DATA_POINT_VALUE_BYTE_SIZE_BS,
    });

    // Extracting timestamp
    negativeOffset += DATA_POINT_VALUE_BYTE_SIZE_BS;
    const timestamp = this.extractNumber({
      negativeOffset,
      length: TIMESTAMP_BS,
    });

    // Extracting all data points
    negativeOffset += TIMESTAMP_BS;
    const dataPoints: DataPoint[] = [];
    for (let i = 0; i < dataPointsCount; i++) {
      // Extracting data point value
      const dataPointValue = this.slice({
        negativeOffset,
        length: dataPointsValueSize,
      });

      // Extracting data feed id for data point
      negativeOffset += dataPointsValueSize;
      const dataFeedId = this.slice({
        negativeOffset,
        length: DATA_FEED_ID_BS,
      });

      // Shifting negative offset
      negativeOffset += DATA_FEED_ID_BS;

      // Building a data point
      const dataPoint = this.createDataPoint(dataFeedId, dataPointValue);

      // Collecting data point
      // Using `unshift` instead of `push` because we read from the end
      dataPoints.unshift(dataPoint);
    }

    return {
      dataPoints,
      timestamp,
    };
  }

  // This is a bit hacky, but should be enough for us at this point
  private createDataPoint(
    dataFeedId: Uint8Array,
    dataPointValue: Uint8Array
  ): DataPoint {
    return new NumericDataPoint({
      dataFeedId: toUtf8String(dataFeedId).replaceAll("\x00", ""),
      value: BigNumber.from(dataPointValue).toNumber() / 10 ** 8,
    });
  }

  private extractNumber(sliceConfig: SliceConfig): number {
    const bytesArr = this.slice(sliceConfig);
    return convertBytesToNumber(bytesArr);
  }

  private slice(sliceConfig: SliceConfig): Uint8Array {
    const { negativeOffset, length } = sliceConfig;
    const end = this.bytesData.length - negativeOffset;
    const start = end - length;
    return this.bytesData.slice(start, end);
  }
}
