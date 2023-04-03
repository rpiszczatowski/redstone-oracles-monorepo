import { Contract, Wallet } from "ethers";
import { abi as priceFeedsAdapterABI } from "../../../artifacts/contracts/price-feeds/PriceFeedsAdapter.sol/PriceFeedsAdapter.json";
import { abi as mentoAdapterABI } from "../../../artifacts/contracts/custom-integrations/mento/MentoAdapter.sol/MentoAdapter.json";
import { abi as sortedOraclesABI } from "../../../artifacts/contracts/custom-integrations/mento/ISortedOracles.sol/ISortedOracles.json";
import { config } from "../../config";
import { getProvider, getSigner } from "./get-provider-or-signer";
import { FallbackContractDecorator } from "../../fallback-contract";
import { ErrorCode } from "@ethersproject/logger";

export const contractDecorator = new FallbackContractDecorator({
  propagatedErrors: [ErrorCode.NONCE_EXPIRED],
});

export const getAdapterContract = () => {
  const { adapterContractAddress } = config;
  const abi = getAbiForAdapter();
  const contract = new Contract(adapterContractAddress, abi);
  const signers = config.rpcUrls.map((_rpcUrl: string, index: number) =>
    getSigner(getProvider(index))
  );

  return contractDecorator.decorate(contract, signers);
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
