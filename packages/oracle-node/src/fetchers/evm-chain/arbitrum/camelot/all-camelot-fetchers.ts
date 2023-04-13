import { CamelotFetcher } from "./CamelotFetcher";
import camelotFetchersConfig from "./all-camelot-fetchers-config.json";

const camelotFetchers: Record<string, CamelotFetcher> = {};

for (const [fetcherName, config] of Object.entries(camelotFetchersConfig)) {
  camelotFetchers[fetcherName] = new CamelotFetcher(fetcherName, config);
}

export default camelotFetchers;
