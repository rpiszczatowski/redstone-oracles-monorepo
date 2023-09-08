import { balancerEthereumConfigs } from "./balancer-ethereum-configs";
import { balancerArbitrumConfigs } from "./balancer-arbitrum-configs";
import { BalancerFetcher } from "./BalancerFetcher";
import {
  arbitrumProvider,
  ethereumProvider,
} from "../../utils/blockchain-providers";

const balancerFetchers: Record<string, BalancerFetcher> = {};

for (const [underlyingToken, configs] of Object.entries(
  balancerEthereumConfigs
)) {
  const fetcherName = `balancer-ethereum-${underlyingToken.toLowerCase()}`;
  balancerFetchers[fetcherName] = new BalancerFetcher(
    fetcherName,
    configs,
    underlyingToken,
    ethereumProvider
  );
}

for (const [underlyingToken, configs] of Object.entries(
  balancerArbitrumConfigs
)) {
  const fetcherName = `balancer-arbitrum-${underlyingToken.toLowerCase()}`;
  balancerFetchers[fetcherName] = new BalancerFetcher(
    fetcherName,
    configs,
    underlyingToken,
    arbitrumProvider
  );
}

export default balancerFetchers;
