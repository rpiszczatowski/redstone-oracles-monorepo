import { PriceDataBeforeSigning, PriceDataSigned } from "../types";
import { BaseSigner } from "./BaseSigner";

export class TimestampSigner extends BaseSigner {
  async signPrice(price: PriceDataBeforeSigning): Promise<PriceDataSigned> {
    return {
      ...price,
      evmSignature: "hehe",
    };
  }
}
