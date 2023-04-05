import { Contract } from "ethers";
import { abi as sortedOraclesABI } from "../../../artifacts/contracts/custom-integrations/mento/ISortedOracles.sol/ISortedOracles.json";
import { abi as mentoAdapterABI } from "../../../artifacts/contracts/custom-integrations/mento/MentoAdapter.sol/MentoAdapter.json";
import { abi as priceFeedsAdapterABI } from "../../../artifacts/contracts/price-feeds/PriceFeedsAdapter.sol/PriceFeedsAdapter.json";
import { config } from "../../config";
import { getProvider, getSigner } from "./get-provider-or-signer";

export const getAdapterContract = () => {
  const { adapterContractAddress } = config;
  const abi = getAbiForAdapter();
  return new Contract(adapterContractAddress, abi, getSigner());
};

export const getSortedOraclesContractAtAddress = (
  sortedOraclesMentoContractAddress: string
) => {
  return new Contract(
    sortedOraclesMentoContractAddress,
    sortedOraclesABI,
    getProvider()
  );
};

const getAbiForAdapter = () => {
  switch (config.adapterContractType) {
    case "price-feeds":
      return priceFeedsAdapterABI;
    case "mento":
      return mentoAdapterABI;
    default:
      throw new Error(
        `Unsupported adapter contract type: ${config.adapterContractType}`
      );
  }
};
