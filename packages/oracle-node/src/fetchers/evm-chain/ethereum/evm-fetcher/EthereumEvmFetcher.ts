import { requestHandlers } from "./sources";
import { EvmFetcher } from "../../shared/EvmFetcher";
import { ethereumProvider } from "../../../../utils/blockchain-providers";

const MUTLICALL_CONTRACT_ADDRESS = "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696";

export const ethereumEvmFetcher = new EvmFetcher(
  "ethereum-evm-fetcher",
  {
    mainProvider: ethereumProvider,
  },
  MUTLICALL_CONTRACT_ADDRESS,
  requestHandlers
);
