import { SushiswapOnChainFetcher } from "./SushiswapOnChainFetcher";
import sushiswapFetchersConfig from "./all-sushiswap-on-chain-fetchers-config.json";

const sushiswapOnChainFetchers: Record<string, SushiswapOnChainFetcher> = {};

for (const [fetcherName, config] of Object.entries(sushiswapFetchersConfig)) {
  sushiswapOnChainFetchers[fetcherName] = new SushiswapOnChainFetcher(
    fetcherName,
    config
  );
}

export default sushiswapOnChainFetchers;
