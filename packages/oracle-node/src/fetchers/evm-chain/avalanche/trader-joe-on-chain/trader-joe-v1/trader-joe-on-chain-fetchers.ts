import { TraderJoeOnChainFetcher } from "./TraderJoeOnChainFetcher";
import traderJoeOnChainFetchersConfig from "./trader-joe-on-chain-fetchers-config.json";

const traderJoeOnChainFetchers: Record<string, TraderJoeOnChainFetcher> = {};

for (const [fetcherName, config] of Object.entries(
  traderJoeOnChainFetchersConfig
)) {
  traderJoeOnChainFetchers[fetcherName] = new TraderJoeOnChainFetcher(
    fetcherName,
    config
  );
}

export default traderJoeOnChainFetchers;
