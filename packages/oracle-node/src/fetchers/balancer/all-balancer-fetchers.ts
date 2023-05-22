import balancerFetchersConfig from "./balancer-fetchers-config.json";
import { BalancerFetcher } from "./BalancerFetcher";

const balancerFetchers: Record<string, BalancerFetcher> = {};

for (const [fetcherName, details] of Object.entries(balancerFetchersConfig)) {
  balancerFetchers[fetcherName] = new BalancerFetcher(
    fetcherName,
    details.baseToken
  );
}

export default balancerFetchers;
