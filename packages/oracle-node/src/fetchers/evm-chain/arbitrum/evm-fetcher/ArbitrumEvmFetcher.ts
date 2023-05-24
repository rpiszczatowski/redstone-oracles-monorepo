import { requestHandlers } from "./sources";
import { EvmFetcher } from "../../shared/EvmFetcher";
import { arbitrumProvider } from "../../../../utils/blockchain-providers";

const MUTLICALL_CONTRACT_ADDRESS = "0x842eC2c7D803033Edf55E478F461FC547Bc54EB2";

export const arbitrumEvmFetcher = new EvmFetcher(
  "arbitrum-evm-fetcher",
  {
    mainProvider: arbitrumProvider,
  },
  MUTLICALL_CONTRACT_ADDRESS,
  requestHandlers
);
