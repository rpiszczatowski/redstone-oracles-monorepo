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
      | MultiSignDataPackage[],
    public readonly unsignedMetadata: string,
    public readonly version: number
  ) {
    super();
  }

  // Bit hacky, improve later
  public static prepare(
    signedDataPackages: SignedDataPackage[] | MultiSignDataPackage[],
    unsignedMetadata: string
  ): string {
    if (Array.isArray(signedDataPackages) && signedDataPackages.length > 0) {
      const firstElement = signedDataPackages[0];
  
      if (firstElement instanceof SignedDataPackage) {
        return this.prepareSingleSign(signedDataPackages as SignedDataPackage[], unsignedMetadata);
      } else if (firstElement instanceof MultiSignDataPackage) {
        return this.prepareMultiSign(signedDataPackages as MultiSignDataPackage[], unsignedMetadata);
      } else {
        throw new Error('Invalid data package type');
      }
    } else {
      throw new Error('Empty data packages array');
    }
  }

  private static prepareMultiSign(
    signedDataPackages: MultiSignDataPackage[],
    unsignedMetadata: string
  ): string {
    return new RedstonePayload(
      signedDataPackages,
      unsignedMetadata,
      MULTISIGN_REDSTONE_PAYLOAD_VERSION
    ).toBytesHexWithout0xPrefix();
  }

  private static prepareSingleSign(
    signedDataPackages: SignedDataPackage[],
    unsignedMetadata: string
  ): string {
    return new RedstonePayload(
      signedDataPackages,
      unsignedMetadata,
      SINGLESIGN_REDSTONE_PAYLOAD_VERSION
    ).toBytesHexWithout0xPrefix();
  }


  toObj() {
    return {
      signedDataPackages: this.signedDataPackages.map((signedDataPackage) =>
        signedDataPackage.toObj()
      ),
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
    if (this.version === SINGLESIGN_REDSTONE_PAYLOAD_VERSION) {
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
    return concat([
      unsignedMetadataBytes,
      unsignedMetadataByteSizeBytes,
    ]);
  }

  serializeUnsignedMetadataWithVersion(): Uint8Array {
    const unsignedMetadataBytes = toUtf8Bytes(this.unsignedMetadata);
    const payloadVersionBytes = convertIntegerNumberToBytes(
      this.version,
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
    return concat([
      ...this.signedDataPackages.map((signedDataPackage) =>
        signedDataPackage.toBytes()
      ),
      convertIntegerNumberToBytes(
        this.signedDataPackages.length,
        DATA_PACKAGES_COUNT_BS
      ),
    ]);
  }

  public static parse(
    bytesWithRedstonePayloadInTheEnd: Uint8Array
  ): RedstonePayloadParsingResult {
    return new RedstonePayloadParser(bytesWithRedstonePayloadInTheEnd).parse();
  }
}
