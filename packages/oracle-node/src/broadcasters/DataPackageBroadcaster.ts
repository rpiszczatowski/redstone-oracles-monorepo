import { SignedDataPackage } from "@redstone-finance/protocol";

export interface DataPackageBroadcaster {
  broadcast(signedDataPackages: SignedDataPackage[]): Promise<void>;
}
