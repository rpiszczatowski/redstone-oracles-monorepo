import velodromeFetchersConfig from "./velodrome-fetchers-config.json";
import { VelodromeOnChainFetcher } from "./VelodromeOnChainFetcher";
import { optimismProvider } from "../../../../utils/blockchain-providers";

const velodromeFetchers: Record<string, VelodromeOnChainFetcher> = {};

for (const [fetcherName, fetcherConfig] of Object.entries(
  velodromeFetchersConfig
)) {
  velodromeFetchers[fetcherName] = new VelodromeOnChainFetcher(
    fetcherName,
    fetcherConfig,
    optimismProvider
  );
}

export default velodromeFetchers;
