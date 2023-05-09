import { TwelveDataFetcher } from "./TwelveDataFetcher";
import twelveDataFetchersConfig from "./twelve-data-fetchers-config.json";

const twelveDataFetchers: Record<string, TwelveDataFetcher> = {};

for (const [fetcherName, config] of Object.entries(twelveDataFetchersConfig)) {
  twelveDataFetchers[fetcherName] = new TwelveDataFetcher(
    fetcherName,
    config.symbolToId,
    config.requestParams
  );
}

export default twelveDataFetchers;
