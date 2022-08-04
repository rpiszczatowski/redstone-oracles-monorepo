import { ExtendedSignedDataPackagePlainObj } from "../types";

export interface Broadcaster {
  broadcast(prices: ExtendedSignedDataPackagePlainObj[]): Promise<void>;

  broadcastPricePackage(
    signedData: ExtendedSignedDataPackagePlainObj
  ): Promise<void>;
}
