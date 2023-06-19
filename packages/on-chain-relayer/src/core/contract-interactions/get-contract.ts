import { Contract, Wallet } from "ethers";
import { abi as sortedOraclesABI } from "../../../artifacts/contracts/custom-integrations/mento/ISortedOracles.sol/ISortedOracles.json";
import { config } from "../../config";
import { getProvider } from "./get-provider-or-signer";
import { IRedstoneAdapter } from "../../../typechain-types";
import { getAbiForAdapter } from "./get-abi-for-adapter";

export const getAdapterContract = () => {
  const { privateKey, adapterContractAddress, adapterContractType } = config;
  const provider = getProvider();
  const signer = new Wallet(privateKey, provider);
  const abi = getAbiForAdapter(adapterContractType);
  return new Contract(adapterContractAddress, abi, signer) as IRedstoneAdapter;
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
