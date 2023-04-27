import { concat } from "ethers/lib/utils";
import {
  REDSTONE_MARKER_HEX,
  MULTISIGN_REDSTONE_PAYLOAD_VERSION,
} from "../common/redstone-constants";
import { MultiSignDataPackage } from "../data-package/MultiSignDataPackage";
import {
  RedstoneMultiSignPayloadParser,
  RedstoneMultiSignPayloadParsingResult,
} from "./RedstonePayloadParserMultiSign";
import { RedstonePayloadBase } from "./RedstonePayloadBase";

export class RedstonePayloadMultiSign extends RedstonePayloadBase {
  constructor(
    public readonly signedDataPackage: MultiSignDataPackage,
    public readonly unsignedMetadata: string
  ) {
    super(unsignedMetadata);
  }

  public static prepare(
    signedDataPackage: MultiSignDataPackage,
    unsignedMetadata: string
  ): string {
    return new RedstonePayloadMultiSign(
      signedDataPackage,
      unsignedMetadata
    ).toBytesHexWithout0xPrefix();
  }

  toObj() {
    return {
      signedDataPackage: this.signedDataPackage.toObj(),
      unsignedMetadata: this.unsignedMetadata,
    };
  }

  toBytes(): Uint8Array {
    return concat([
      this.serializeSignedDataPackage(),
      this.serializeUnsignedMetadata(MULTISIGN_REDSTONE_PAYLOAD_VERSION),
      REDSTONE_MARKER_HEX,
    ]);
  }

  serializeSignedDataPackage(): Uint8Array {
    return this.signedDataPackage.toBytes();
  }

  public static parse(
    bytesWithRedstonePayloadInTheEnd: Uint8Array
  ): RedstoneMultiSignPayloadParsingResult {
    return new RedstoneMultiSignPayloadParser(
      bytesWithRedstonePayloadInTheEnd
    ).parse();
  }
}
