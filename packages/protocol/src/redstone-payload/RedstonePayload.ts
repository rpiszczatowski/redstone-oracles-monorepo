import { concat, toUtf8Bytes } from "ethers/lib/utils";
import {
  DATA_PACKAGES_COUNT_BS,
  REDSTONE_MARKER_HEX,
  UNSIGNED_METADATA_BYTE_SIZE_BS,
  REDSTONE_PAYLOAD_VERSION_BS,
  SINGLESIGN_REDSTONE_PAYLOAD_VERSION,
  MULTISIGN_REDSTONE_PAYLOAD_VERSION,
} from "../common/redstone-constants";
import { Serializable } from "../common/Serializable";
import { convertIntegerNumberToBytes } from "../common/utils";
import { MultiSignDataPackage } from "../data-package/MultiSignDataPackage";
import { SignedDataPackage } from "../data-package/SignedDataPackage";
import {
  RedstonePayloadParser,
  RedstonePayloadParsingResult,
} from "./RedstonePayloadParser";

export class RedstonePayload extends Serializable {
  constructor(
    public readonly signedDataPackages:
      | SignedDataPackage[]
      | MultiSignDataPackage,
    public readonly unsignedMetadata: string
  ) {
    super();
  }

  public static preparePayload(
    signedDataPackages: SignedDataPackage[] | MultiSignDataPackage,
    unsignedMetadata: string
  ): RedstonePayload {
    return new RedstonePayload(signedDataPackages, unsignedMetadata);
  }

  // Bit hacky, improve later
  public static prepare(
    signedDataPackages: SignedDataPackage[] | MultiSignDataPackage,
    unsignedMetadata: string
  ): string {
    if (Array.isArray(signedDataPackages)) {
      return this.prepareSingleSign(
        signedDataPackages as SignedDataPackage[],
        unsignedMetadata
      );
    }
    return this.prepareMultiSign(
      signedDataPackages as MultiSignDataPackage,
      unsignedMetadata
    );
  }

  private static prepareMultiSign(
    signedDataPackage: MultiSignDataPackage,
    unsignedMetadata: string
  ): string {
    return new RedstonePayload(
      signedDataPackage,
      unsignedMetadata
    ).toBytesHexWithout0xPrefix();
  }

  private static prepareSingleSign(
    signedDataPackages: SignedDataPackage[],
    unsignedMetadata: string
  ): string {
    return new RedstonePayload(
      signedDataPackages,
      unsignedMetadata
    ).toBytesHexWithout0xPrefix();
  }

  toObj() {
    let signedDataPackages: any;
    if (Array.isArray(this.signedDataPackages)) {
      signedDataPackages = this.signedDataPackages.map((signedDataPackage) =>
        signedDataPackage.toObj()
      );
    } else {
      signedDataPackages = this.signedDataPackages.toObj();
    }

    return {
      signedDataPackages: signedDataPackages,
      unsignedMetadata: this.unsignedMetadata,
    };
  }

  toBytes(): Uint8Array {
    return concat([
      this.serializeSignedDataPackages(),
      this.serializeUnsignedMetadata(),
      REDSTONE_MARKER_HEX,
    ]);
  }

  serializeUnsignedMetadata(): Uint8Array {
    if (Array.isArray(this.signedDataPackages)) {
      return this.serializeUnsignedMetadataWithoutVersion();
    }
    return this.serializeUnsignedMetadataWithVersion();
  }

  serializeUnsignedMetadataWithoutVersion(): Uint8Array {
    const unsignedMetadataBytes = toUtf8Bytes(this.unsignedMetadata);
    const unsignedMetadataByteSizeBytes = convertIntegerNumberToBytes(
      unsignedMetadataBytes.length,
      UNSIGNED_METADATA_BYTE_SIZE_BS
    );
    return concat([unsignedMetadataBytes, unsignedMetadataByteSizeBytes]);
  }

  serializeUnsignedMetadataWithVersion(): Uint8Array {
    const unsignedMetadataBytes = toUtf8Bytes(this.unsignedMetadata);
    const payloadVersionBytes = convertIntegerNumberToBytes(
      Array.isArray(this.signedDataPackages)
        ? SINGLESIGN_REDSTONE_PAYLOAD_VERSION
        : MULTISIGN_REDSTONE_PAYLOAD_VERSION,
      REDSTONE_PAYLOAD_VERSION_BS
    );
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

  serializeSignedDataPackages(): Uint8Array {
    let signedDataPackages: any;
    if (Array.isArray(this.signedDataPackages)) {
      signedDataPackages = this.signedDataPackages.map((signedDataPackage) =>
        signedDataPackage.toBytes()
      );

      return concat([
        ...signedDataPackages,
        convertIntegerNumberToBytes(
          this.signedDataPackages.length,
          DATA_PACKAGES_COUNT_BS
        ),
      ]);
    } else {
      signedDataPackages = this.signedDataPackages.toBytes();
      return signedDataPackages;
    }
  }

  public static parse(
    bytesWithRedstonePayloadInTheEnd: Uint8Array
  ): RedstonePayloadParsingResult {
    return new RedstonePayloadParser(bytesWithRedstonePayloadInTheEnd).parse();
  }
}
