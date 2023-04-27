import { concat, toUtf8Bytes } from "ethers/lib/utils";
import {
  UNSIGNED_METADATA_BYTE_SIZE_BS,
  REDSTONE_PAYLOAD_VERSION_BS,
} from "../common/redstone-constants";
import { Serializable } from "../common/Serializable";
import { convertIntegerNumberToBytes } from "../common/utils";

export abstract class RedstonePayloadBase extends Serializable {
  constructor(public readonly unsignedMetadata: string) {
    super();
  }

  serializeUnsignedMetadata(version: number): Uint8Array {
    const payloadVersionBytes = convertIntegerNumberToBytes(
      version,
      REDSTONE_PAYLOAD_VERSION_BS
    );

    const unsignedMetadataBytes = toUtf8Bytes(this.unsignedMetadata);

    const unsignedMetadataByteSizeBytes = convertIntegerNumberToBytes(
      unsignedMetadataBytes.length + REDSTONE_PAYLOAD_VERSION_BS,
      UNSIGNED_METADATA_BYTE_SIZE_BS
    );

    return concat([
      payloadVersionBytes,
      unsignedMetadataBytes,
      unsignedMetadataByteSizeBytes,
    ]);
  }
}
