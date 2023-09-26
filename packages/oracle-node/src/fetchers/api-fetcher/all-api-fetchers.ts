import apiFetcherConfigs from "./api-fetcher-configs.json";
import { ApiFetcher } from "./ApiFetcher";

export const apiFetchers: Record<string, ApiFetcher> = {};

for (const [apiName, fetcherConfig] of Object.entries(apiFetcherConfigs)) {
  apiFetchers[`${apiName}-api`] = new ApiFetcher(apiName, fetcherConfig);
}
