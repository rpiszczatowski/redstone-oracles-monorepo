import uniswapV3FetchersConfig from "./uniswap-v3-fetchers-config.json";
import { UniswapV3OnChainFetcher } from "./UniswapV3OnChainFetcher";
import { ethers } from "ethers";
import { config } from "../../../config";

const uniswapV3Fetchers: Record<string, UniswapV3OnChainFetcher> = {};
const provider = new ethers.providers.StaticJsonRpcProvider(
  config.ethMainRpcUrl
);

for (const [fetcherName, fetcherConfig] of Object.entries(
  uniswapV3FetchersConfig
)) {
  uniswapV3Fetchers[fetcherName] = new UniswapV3OnChainFetcher(
    fetcherName,
    fetcherConfig,
    provider
  );
}

export default uniswapV3Fetchers;
