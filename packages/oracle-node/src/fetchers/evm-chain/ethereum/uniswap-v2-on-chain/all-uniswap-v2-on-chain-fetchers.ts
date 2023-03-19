import { UniswapV2OnChainFetcher } from "./UniswapV2OnChainFetcher";
import uniswapV2OnChainFetchersConfig from "./uniswap-v2-on-chain-fetchers-config.json";

const uniswapV2OnChainFetchers: Record<string, UniswapV2OnChainFetcher> = {};

for (const [fetcherName, config] of Object.entries(
  uniswapV2OnChainFetchersConfig
)) {
  uniswapV2OnChainFetchers[fetcherName] = new UniswapV2OnChainFetcher(
    fetcherName,
    config
  );
}

export default uniswapV2OnChainFetchers;
