import { requestHandlers } from "./sources";
import { EvmFetcher } from "../../shared/EvmFetcher";
import { avalancheProvider } from "../../../../utils/blockchain-providers";

const MUTLICALL_CONTRACT_ADDRESS = "0x8755b94F88D120AB2Cc13b1f6582329b067C760d";

export const avalancheEvmFetcher = new EvmFetcher(
  "avalanche-evm-fetcher",
  {
    mainProvider: avalancheProvider,
  },
  MUTLICALL_CONTRACT_ADDRESS,
  requestHandlers
);
