import { ethereumProvider } from "../../utils/blockchain-providers";
import { balancerMultiConfigs } from "./balancer-multi-configs";
import { BalancerMultiFetcher } from "./BalancerMultiFetcher";

const balancerMultiFetchers: Record<string, BalancerMultiFetcher> = {};

for (const [underlyingToken, config] of Object.entries(balancerMultiConfigs)) {
  balancerMultiFetchers[`balancer-multi-${underlyingToken.toLowerCase()}`] =
    new BalancerMultiFetcher(
      `balancer-multi-${underlyingToken.toLowerCase()}`,
      config,
      underlyingToken,
      ethereumProvider
    );
}

export default balancerMultiFetchers;
