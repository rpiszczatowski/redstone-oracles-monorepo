import { terminateWithManifestConfigError } from "../../../../Terminator";

export const getContractDetailsFromConfig = <T extends string, K>(
  contractDetailsConfig: Record<T, K>,
  id: T
) => {
  const contractDetails = contractDetailsConfig?.[id];
  if (!contractDetails) {
    terminateWithManifestConfigError(
      `Misconfiguration for ${id}, cannot get contract details`
    );
  }
  return contractDetails;
};
