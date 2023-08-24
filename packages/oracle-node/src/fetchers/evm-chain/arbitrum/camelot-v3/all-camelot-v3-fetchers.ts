import { arbitrumProvider } from "../../../../utils/blockchain-providers";
import { CamelotV3Fetcher } from "./CamelotV3Fetcher";
import camelotFetchersConfig from "./camelot-v3-fetchers-config.json";

export const camelotV3Fetchers: Record<string, CamelotV3Fetcher> = {};

for (const [fetcherName, fetcherConfig] of Object.entries(
  camelotFetchersConfig
)) {
  camelotV3Fetchers[fetcherName] = new CamelotV3Fetcher(
    fetcherName,
    fetcherConfig,
    arbitrumProvider
  );
}
