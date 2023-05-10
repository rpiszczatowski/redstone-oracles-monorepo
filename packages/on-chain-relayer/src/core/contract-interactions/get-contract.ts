import { Provider } from "@ethersproject/providers";
import { Contract, Signer } from "ethers";
import { abi as redstoneAdapterABI } from "../../../artifacts/contracts/core/IRedstoneAdapter.sol/IRedstoneAdapter.json";
import { abi as sortedOraclesABI } from "../../../artifacts/contracts/custom-integrations/mento/ISortedOracles.sol/ISortedOracles.json";
import { abi as mentoAdapterABI } from "../../../artifacts/contracts/custom-integrations/mento/MentoAdapterBase.sol/MentoAdapterBase.json";
import { IRedstoneAdapter } from "../../../typechain-types";
import { config } from "../../config";
import { getProvider, getSigner } from "./get-provider-or-signer";

export const getAdapterContract = (signerOrProvider?: Signer | Provider) => {
  const { adapterContractAddress } = config;
  const abi = getAbiForAdapter();
  return new Contract(
    adapterContractAddress,
    abi,
    signerOrProvider ?? getSigner()
  ) as IRedstoneAdapter;
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
      return redstoneAdapterABI;
    case "mento":
      return mentoAdapterABI;
    default:
      throw new Error(
        `Unsupported adapter contract type: ${config.adapterContractType}`
      );
  }
};
