import { RedstonePayload } from "redstone-protocol";
import { DataPackagesResponse } from "redstone-sdk";

export function makePayload(
  cachedDataPackagesResponse: DataPackagesResponse,
  unsignedMetadataMsg?: string
): RedstonePayload {
  const cachedDataPackages = Object.values(cachedDataPackagesResponse).flat();
  return RedstonePayload.preparePayload(cachedDataPackages, unsignedMetadataMsg || "");
}
