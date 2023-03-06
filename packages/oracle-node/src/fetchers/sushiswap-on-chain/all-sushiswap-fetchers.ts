import sushiswapFetchersConfig from "./sushiswap-fetchers-config.json";
import { SushiswapFetcher } from "./SushiswapOnChainFetcher";

const sushiswapFetchers: Record<string, SushiswapFetcher> = {};

for (const [fetcherName, config] of Object.entries(sushiswapFetchersConfig)) {
  sushiswapFetchers[fetcherName] = new SushiswapFetcher(fetcherName, config);
}

export default sushiswapFetchers;
