import uniswapV3FetchersConfig from "./uniswap-v3-fetchers-config.json";
import { UniswapV3FetcherOnChain } from "./UniswapV3FetcherOnChain";
import { ethers } from "ethers";
import { config } from "../../../config";

const uniswapV3Fetchers: Record<string, UniswapV3FetcherOnChain> = {};
const provider = new ethers.providers.StaticJsonRpcProvider(
  config.ethMainRpcUrl
);

for (const [fetcherName, fetcherConfig] of Object.entries(
  uniswapV3FetchersConfig
)) {
  uniswapV3Fetchers[fetcherName] = new UniswapV3FetcherOnChain(
    fetcherName,
    fetcherConfig,
    provider
  );
}

export default uniswapV3Fetchers;
