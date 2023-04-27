import { BigNumber } from "ethers";
import { hexlify, toUtf8String } from "ethers/lib/utils";
import {
  DATA_FEED_ID_BS,
  DATA_POINTS_COUNT_BS,
  DATA_POINT_VALUE_BYTE_SIZE_BS,
  REDSTONE_MARKER_BS,
  REDSTONE_MARKER_HEX,
  TIMESTAMP_BS,
  UNSIGNED_METADATA_BYTE_SIZE_BS,
  REDSTONE_PAYLOAD_VERSION_BS,
} from "../common/redstone-constants";
import { convertBytesToNumber } from "../common/utils";
import { DataPoint } from "../data-point/DataPoint";
import { NumericDataPoint } from "../data-point/NumericDataPoint";

export interface RedstonePayloadParsingResult {
  unsignedMetadata: Uint8Array;
  remainderPrefix: Uint8Array;
}

interface DataPointExtractionResult {
  dataPoints: DataPoint[];
  timestamp: number;
}

type SliceConfig = { negativeOffset: number; length: number };

export abstract class RedstonePayloadParserBase {
  // Last bytes of bytesData must contain valid redstone payload
  constructor(protected bytesData: Uint8Array) {}

  extractUnsignedMetadata(): Uint8Array {
    const unsignedMetadataSize = this.extractNumber({
      negativeOffset: REDSTONE_MARKER_BS,
      length: UNSIGNED_METADATA_BYTE_SIZE_BS,
    });

    if (unsignedMetadataSize < REDSTONE_PAYLOAD_VERSION_BS) {
      throw new Error(
        `Received invalid unsigned metadata size: ${unsignedMetadataSize}`
      );
    }

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

  protected extractNumber(sliceConfig: SliceConfig): number {
    const bytesArr = this.slice(sliceConfig);
    return convertBytesToNumber(bytesArr);
  }

  protected slice(sliceConfig: SliceConfig): Uint8Array {
    const { negativeOffset, length } = sliceConfig;
    const end = this.bytesData.length - negativeOffset;
    const start = end - length;
    return this.bytesData.slice(start, end);
  }
}
