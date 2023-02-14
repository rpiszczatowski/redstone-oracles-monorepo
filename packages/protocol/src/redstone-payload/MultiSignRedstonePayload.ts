import { concat, toUtf8Bytes } from "ethers/lib/utils";
import {
  REDSTONE_MARKER_HEX,
  UNSIGNED_METADATA_BYTE_SIZE_BS,
} from "../common/redstone-constants";
import { Serializable } from "../common/Serializable";
import { convertIntegerNumberToBytes } from "../common/utils";
import {
  RedstonePayloadParser,
  RedstonePayloadParsingResult,
} from "./RedstonePayloadParser";
import { MultiSignDataPackage } from "../data-package/MultiSignDataPackage";

export class MultiSignRedstonePayload extends Serializable {
  constructor(
    public readonly signedDataPackage: MultiSignDataPackage,
    public readonly unsignedMetadata: string
  ) {
    super();
  }

  public static prepare(
    signedDataPackage: MultiSignDataPackage,
    unsignedMetadata: string
  ): string {
    return new MultiSignRedstonePayload(
      signedDataPackage,
      unsignedMetadata
    ).toBytesHexWithout0xPrefix();
  }

  toObj() {
    return {
      signedDataPackages: this.signedDataPackage.toObj(),
      unsignedMetadata: this.unsignedMetadata,
    };
  }

  toBytes(): Uint8Array {
    return concat([
      this.signedDataPackage.toBytes(),
      this.serializeUnsignedMetadata(),
      REDSTONE_MARKER_HEX,
    ]);
  }

  serializeUnsignedMetadata(): Uint8Array {
    const unsignedMetadataBytes = toUtf8Bytes(this.unsignedMetadata);
    const unsignedMetadataByteSizeBytes = convertIntegerNumberToBytes(
      unsignedMetadataBytes.length,
      UNSIGNED_METADATA_BYTE_SIZE_BS
    );
    return concat([unsignedMetadataBytes, unsignedMetadataByteSizeBytes]);
  }

  public static parse(
    bytesWithRedstonePayloadInTheEnd: Uint8Array
  ): RedstonePayloadParsingResult {
    return new RedstonePayloadParser(bytesWithRedstonePayloadInTheEnd).parse();
  }
}
