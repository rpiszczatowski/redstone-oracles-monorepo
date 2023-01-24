import pangolinFetchersConfig from "./pangolin-fetchers-config.json";
import { PangolinFetcher } from "./PangolinFetcher";

const pangolinFetchers: Record<string, PangolinFetcher> = {};

for (const [fetcherName, details] of Object.entries(pangolinFetchersConfig)) {
  pangolinFetchers[fetcherName] = new PangolinFetcher(
    fetcherName,
    details.symbolToPairIdFile
  );
}

export default pangolinFetchers;
