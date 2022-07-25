import { SignedDataPackageToBroadcast } from "redstone-protocol";

export interface Broadcaster {
  broadcast(prices: SignedDataPackageToBroadcast[]): Promise<void>;

  broadcastPricePackage(
    signedData: SignedDataPackageToBroadcast
  ): Promise<void>;
}
