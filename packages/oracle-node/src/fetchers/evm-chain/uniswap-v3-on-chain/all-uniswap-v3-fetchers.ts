import uniswapV3FetchersConfig from "./uniswap-v3-fetchers-config.json";
import uniswapV3OptimismFetchersConfig from "./uniswap-v3-optimism-fetchers-config.json";
import { UniswapV3OnChainFetcher } from "./UniswapV3OnChainFetcher";
import {
  ethereumProvider,
  optimismProvider,
} from "../../../utils/blockchain-providers";
import { PoolsConfig, SlippageInfo } from "./types";

const uniswapV3Fetchers: Record<string, UniswapV3OnChainFetcher> = {};

for (const [fetcherName, fetcherConfig] of Object.entries(
  uniswapV3FetchersConfig
)) {
  uniswapV3Fetchers[fetcherName] = new UniswapV3OnChainFetcher(
    fetcherName,
    fetcherConfig as PoolsConfig,
    ethereumProvider
  );
}

for (const [fetcherName, fetcherConfig] of Object.entries(
  uniswapV3OptimismFetchersConfig
)) {
  uniswapV3Fetchers[fetcherName] = new UniswapV3OnChainFetcher(
    fetcherName,
    fetcherConfig,
    optimismProvider
  );
}

export default uniswapV3Fetchers;
