import { BlockNumberSigner } from "./BlockNumberSigner";
import { TimestampSigner } from "./TimestampSigner";

export default {
  "timestamp-signer": new TimestampSigner(),
  "block-number-signer": new BlockNumberSigner(),
};
