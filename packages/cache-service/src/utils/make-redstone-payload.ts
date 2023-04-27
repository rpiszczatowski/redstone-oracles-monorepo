import { RedstonePayloadSingleSign } from "redstone-protocol";
import { DataPackagesResponse } from "redstone-sdk";

export function makePayload(
  cachedDataPackagesResponse: DataPackagesResponse,
  unsignedMetadataMsg?: string
): RedstonePayloadSingleSign {
  const cachedDataPackages = Object.values(cachedDataPackagesResponse).flat();
  return new RedstonePayloadSingleSign(cachedDataPackages, unsignedMetadataMsg || "");
}
