import { concat } from "ethers/lib/utils";
import {
  DATA_PACKAGES_COUNT_BS,
  REDSTONE_MARKER_HEX,
  SINGLESIGN_REDSTONE_PAYLOAD_VERSION,
} from "../common/redstone-constants";
import { convertIntegerNumberToBytes } from "../common/utils";
import { SignedDataPackage } from "../data-package/SignedDataPackage";
import {
  RedstoneSingleSignPayloadParser,
  RedstoneSingleSignPayloadParsingResult,
} from "./RedstonePayloadParserSingleSign";
import { RedstonePayloadBase } from "./RedstonePayloadBase";

export class RedstonePayloadSingleSign extends RedstonePayloadBase {
  constructor(
    public readonly signedDataPackages: SignedDataPackage[],
    public readonly unsignedMetadata: string
  ) {
    super(unsignedMetadata);
  }

  public static prepare(
    signedDataPackages: SignedDataPackage[],
    unsignedMetadata: string
  ): string {
    return new RedstonePayloadSingleSign(
      signedDataPackages,
      unsignedMetadata
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
      this.serializeUnsignedMetadata(SINGLESIGN_REDSTONE_PAYLOAD_VERSION),
      REDSTONE_MARKER_HEX,
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
  ): RedstoneSingleSignPayloadParsingResult {
    return new RedstoneSingleSignPayloadParser(
      bytesWithRedstonePayloadInTheEnd
    ).parse();
  }
}
