import { RedstonePayload } from "redstone-protocol";
import { DataPackagesResponse } from "redstone-sdk";
import { StarknetRehasher } from "@redstone-finance/starknet-connector";

export function makePayload(
  cachedDataPackagesResponse: DataPackagesResponse,
  unsignedMetadataMsg?: string
): RedstonePayload {
  const cachedDataPackages = Object.values(cachedDataPackagesResponse).flat();
  const payload = new RedstonePayload(
    cachedDataPackages,
    unsignedMetadataMsg || ""
  );

  return new StarknetRehasher().rehash(payload);
}
