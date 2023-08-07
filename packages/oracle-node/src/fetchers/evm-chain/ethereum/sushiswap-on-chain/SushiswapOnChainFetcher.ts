import { providers } from "ethers";
import {
  PoolsConfig,
  UniswapV2LikeFetcher,
} from "../../../uniswap-v2-like/UniswapV2LikeFetcher";

export class SushiswapOnChainFetcher extends UniswapV2LikeFetcher {
  constructor(
    name: string,
    protected readonly poolsConfig: PoolsConfig,
    protected readonly provider: providers.Provider
  ) {
    super(name, poolsConfig, provider);
  }
}
