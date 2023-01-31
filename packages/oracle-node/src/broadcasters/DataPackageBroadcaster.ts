import { SignedDataPackage } from "redstone-protocol";

export interface DataPackageBroadcaster {
  broadcast(signedDataPackages: SignedDataPackage[]): Promise<void>;
}
