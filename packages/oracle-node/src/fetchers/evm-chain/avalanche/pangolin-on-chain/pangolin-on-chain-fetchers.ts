import { PangolinOnChainFetcher } from "./PangolinOnChainFetcher";
import pangolinOnChainFetchersConfig from "./pangolin-on-chain-fetchers-config.json";

const pangolinOnChainFetchers: Record<string, PangolinOnChainFetcher> = {};

for (const [fetcherName, config] of Object.entries(
  pangolinOnChainFetchersConfig
)) {
  pangolinOnChainFetchers[fetcherName] = new PangolinOnChainFetcher(
    fetcherName,
    config
  );
}

export default pangolinOnChainFetchers;
