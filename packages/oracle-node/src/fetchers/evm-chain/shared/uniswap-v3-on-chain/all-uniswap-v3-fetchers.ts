import uniswapEthereumV3FetchersConfig from "../../../evm-chain/ethereum/uniswap-v3-on-chain/uniswap-v3-ethereum-fetchers-config.json";
import uniswapV3OptimismFetchersConfig from "../../../evm-chain/optimism/uniswap-v3-on-chain/uniswap-v3-optimism-fetchers-config.json";
import uniswapV3ArbitrumFetchersConfig from "../../../evm-chain/arbitrum/uniswap-v3-on-chain/uniswap-v3-arbitrum-fetchers-config.json";
import { UniswapV3OnChainFetcher } from "./UniswapV3OnChainFetcher";
import {
  arbitrumProvider,
  ethereumProvider,
  optimismProvider,
} from "../../../../utils/blockchain-providers";
import { PoolsConfig } from "../../../uniswap-v3-like/types";

const uniswapV3Fetchers: Record<string, UniswapV3OnChainFetcher> = {};

for (const [fetcherName, fetcherConfig] of Object.entries(
  uniswapEthereumV3FetchersConfig
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

for (const [fetcherName, fetcherConfig] of Object.entries(
  uniswapV3ArbitrumFetchersConfig
)) {
  uniswapV3Fetchers[fetcherName] = new UniswapV3OnChainFetcher(
    fetcherName,
    fetcherConfig,
    arbitrumProvider
  );
}

export default uniswapV3Fetchers;
