import { avalancheProvider } from "../../../../../utils/blockchain-providers";
import { TraderJoeV2OnChainFetcher } from "./TraderJoeV2OnChainFetcher";
import traderJoeV2OnChainFetchersConfig from "./trader-joe-v2-on-chain-fetchers-configs.json";

const traderJoeV2OnChainFetchers: Record<string, TraderJoeV2OnChainFetcher> =
  {};

for (const [fetcherName, config] of Object.entries(
  traderJoeV2OnChainFetchersConfig
)) {
  traderJoeV2OnChainFetchers[fetcherName] = new TraderJoeV2OnChainFetcher(
    fetcherName,
    config,
    avalancheProvider
  );
}

export default traderJoeV2OnChainFetchers;
