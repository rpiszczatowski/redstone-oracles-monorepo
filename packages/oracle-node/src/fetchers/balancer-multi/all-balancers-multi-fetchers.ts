import { balancerMultiConfigs } from "./balancer-multi-configs";
import { BalancerMultiFetcher } from "./BalancerMultiFetcher";

const balancerMultiFetchers: Record<string, BalancerMultiFetcher> = {};

for (const [dataFeedId, config] of Object.entries(balancerMultiConfigs)) {
  balancerMultiFetchers[`balancer-multi-${dataFeedId.toLowerCase()}`] =
    new BalancerMultiFetcher(
      `balancer-multi-${dataFeedId.toLowerCase()}`,
      config,
      dataFeedId
    );
}

export default balancerMultiFetchers;
