import velodromeFetchersConfig from "./velodrome-fetchers-config.json";
import { VelodromeOnChainFetcher } from "./VelodromeOnChainFetcher";
import { optimismProvider } from "../../../../utils/blockchain-providers";
import { PoolsConfig } from "./types";

const velodromeFetchers: Record<string, VelodromeOnChainFetcher> = {};

for (const [fetcherName, fetcherConfig] of Object.entries(
  velodromeFetchersConfig
)) {
  velodromeFetchers[fetcherName] = new VelodromeOnChainFetcher(
    fetcherName,
    fetcherConfig as PoolsConfig,
    optimismProvider
  );
}

export default velodromeFetchers;
