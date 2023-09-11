import { arbitrumProvider } from "../../../../utils/blockchain-providers";
import { CamelotV3Fetcher } from "./CamelotV3Fetcher";
import { camelotV3FetchersConfig } from "./camelot-v3-fetchers-config";

export const camelotV3Fetchers: Record<string, CamelotV3Fetcher> = {};

for (const [fetcherName, fetcherConfig] of Object.entries(
  camelotV3FetchersConfig
)) {
  camelotV3Fetchers[fetcherName] = new CamelotV3Fetcher(
    fetcherName,
    fetcherConfig,
    arbitrumProvider
  );
}
