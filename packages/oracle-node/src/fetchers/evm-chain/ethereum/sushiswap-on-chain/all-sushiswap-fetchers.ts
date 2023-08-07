import { SushiswapOnChainFetcher } from "./SushiswapOnChainFetcher";
import sushiswapEthereumFetchersConfig from "./sushiswap-ethereum-on-chain-fetchers-config.json";
import sushiswapArbitrumFetchersConfig from "./sushiswap-arbitrum-on-chain-fetchers-config.json";
import {
  arbitrumProvider,
  ethereumProvider,
} from "../../../../utils/blockchain-providers";

const sushiswapOnChainFetchers: Record<string, SushiswapOnChainFetcher> = {};

for (const [fetcherName, config] of Object.entries(
  sushiswapEthereumFetchersConfig
)) {
  sushiswapOnChainFetchers[fetcherName] = new SushiswapOnChainFetcher(
    fetcherName,
    config,
    ethereumProvider
  );
}

for (const [fetcherName, config] of Object.entries(
  sushiswapArbitrumFetchersConfig
)) {
  sushiswapOnChainFetchers[fetcherName] = new SushiswapOnChainFetcher(
    fetcherName,
    config,
    arbitrumProvider
  );
}

export default sushiswapOnChainFetchers;
