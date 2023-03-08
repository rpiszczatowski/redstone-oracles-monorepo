import { providers } from "ethers";
import {
  PoolsConfig,
  UniswapV2LikeFetcher,
} from "../uniswapV2Like/UniswapV2LikeFetcher";
import { config } from "../../config";

const provider = new providers.JsonRpcProvider(config.ethMainRpcUrl);

export class SushiswapFetcher extends UniswapV2LikeFetcher {
  constructor(name: string, protected readonly poolsConfig: PoolsConfig) {
    super(name, poolsConfig, provider);
  }
}
