import uniswapV3FetchersConfig from "./uniswap-v3-fetchers-config.json";
import { UniswapV3OnChainFetcher } from "./UniswapV3OnChainFetcher";
import { ethers } from "ethers";
import { config } from "../../../config";
import { ethereumProvider } from "../../../utils/blockchain-providers";

const uniswapV3Fetchers: Record<string, UniswapV3OnChainFetcher> = {};

for (const [fetcherName, fetcherConfig] of Object.entries(
  uniswapV3FetchersConfig
)) {
  uniswapV3Fetchers[fetcherName] = new UniswapV3OnChainFetcher(
    fetcherName,
    fetcherConfig,
    ethereumProvider
  );
}

export default uniswapV3Fetchers;
