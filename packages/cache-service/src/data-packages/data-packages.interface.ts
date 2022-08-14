import { SignedDataPackagePlainObj } from "redstone-protocol";

export interface ReceivedDataPackage extends SignedDataPackagePlainObj {
  sources?: object;
}

export interface CachedDataPackage extends ReceivedDataPackage {
  dataServiceId: string;
  signerAddress: string;
  dataFeedId?: string; // will be set only for data packages with one data point
}
