import { FraxswapOnChainFetcher } from "./FraxswapOnChainFetcher";
import fraxswapFetchersConfig from "./all-fraxswap-on-chain-fetchers-config.json";

const fraxswapOnChainFetchers: Record<string, FraxswapOnChainFetcher> = {};

for (const [fetcherName, config] of Object.entries(fraxswapFetchersConfig)) {
  fraxswapOnChainFetchers[fetcherName] = new FraxswapOnChainFetcher(
    fetcherName,
    config
  );
}

export default fraxswapOnChainFetchers;
