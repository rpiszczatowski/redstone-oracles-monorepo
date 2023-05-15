import {
  DATA_FEED_ID_BS,
  DATA_PACKAGES_COUNT_BS,
  DATA_POINT_VALUE_BYTE_SIZE_BS,
  DATA_POINTS_COUNT_BS,
  DEFAULT_NUM_VALUE_BS,
  REDSTONE_MARKER_BS,
  SIGNATURE_BS,
  TIMESTAMP_BS,
} from "redstone-protocol/src/common/redstone-constants";
import { BigNumber } from "ethers";
import { equal } from "assert";

const UNSIGNED_METADATA_BYTE_SIZE_BS = 3;

export function splitPayloadHex(payloadHex: string) {
  //TODO: assert value size == 32;

  const DATA_PACKAGE_BS =
    DATA_FEED_ID_BS +
    DEFAULT_NUM_VALUE_BS +
    TIMESTAMP_BS +
    DATA_POINTS_COUNT_BS +
    DATA_POINT_VALUE_BYTE_SIZE_BS +
    SIGNATURE_BS;

  const unsignedMetadataBS = BigNumber.from(
    "0x" +
      payloadHex.substring(
        payloadHex.length -
          2 * (REDSTONE_MARKER_BS + UNSIGNED_METADATA_BYTE_SIZE_BS),
        payloadHex.length - 2 * REDSTONE_MARKER_BS
      )
  ).toNumber();

  const metadataBS =
    REDSTONE_MARKER_BS +
    UNSIGNED_METADATA_BYTE_SIZE_BS +
    unsignedMetadataBS +
    DATA_PACKAGES_COUNT_BS;

  const metadata = payloadHex.substring(
    payloadHex.length - 2 * metadataBS,
    payloadHex.length
  );

  const dataPackageCount = BigNumber.from(
    "0x" + metadata.substring(0, DATA_PACKAGES_COUNT_BS * 2)
  ).toNumber();

  equal(
    payloadHex.length - 2 * metadataBS,
    2 * DATA_PACKAGE_BS * dataPackageCount,
    "Must be implemented for multi-datapoint packages"
  );

  const dataPackageChunks: string[] = [];
  for (let i = 0; i < dataPackageCount; i++) {
    dataPackageChunks.push(
      payloadHex.substring(
        i * 2 * DATA_PACKAGE_BS,
        (i + 1) * 2 * DATA_PACKAGE_BS
      )
    );
  }

  return { dataPackageChunks, metadata };
}
