import { abi as redstoneAdapterABI } from "../../../artifacts/contracts/core/IRedstoneAdapter.sol/IRedstoneAdapter.json";
import { abi as mentoAdapterABI } from "../../../artifacts/contracts/custom-integrations/mento/MentoAdapterBase.sol/MentoAdapterBase.json";

export const getAbiForAdapter = (adapterContractType: string) => {
  switch (adapterContractType) {
    case "price-feeds":
      return redstoneAdapterABI;
    case "mento":
      return mentoAdapterABI;
    default:
      throw new Error(
        `Unsupported adapter contract type: ${adapterContractType}`
      );
  }
};
