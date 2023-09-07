import pancakeSwapFetchersConfig from "./pancake-swap-fetchers-configs.json";
import { PancakeSwapOnChainFetcher } from "./PancakeSwapOnChainFetcher";
import { ethereumProvider } from "../../../../utils/blockchain-providers";
import { PoolsConfig } from "../../../uniswap-v3-like/types";

const pancakeSwapFetchers: Record<string, PancakeSwapOnChainFetcher> = {};

for (const [fetcherName, fetcherConfig] of Object.entries(
  pancakeSwapFetchersConfig
)) {
  pancakeSwapFetchers[fetcherName] = new PancakeSwapOnChainFetcher(
    fetcherName,
    fetcherConfig as PoolsConfig,
    ethereumProvider
  );
}

export default pancakeSwapFetchers;
