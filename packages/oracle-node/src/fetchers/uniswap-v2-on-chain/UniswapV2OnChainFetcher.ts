import { providers } from "ethers";
import {
  PoolsConfig,
  UniswapV2LikeFetcher,
} from "../uniswapV2Like/UniswapV2LikeFetcher";
import { config } from "../../config";

const provider = new providers.JsonRpcProvider(config.ethMainRpcUrl);

export class UniswapV2OnChainFetcher extends UniswapV2LikeFetcher {
  constructor(name: string, private readonly poolConfig: PoolsConfig) {
    super(name, poolConfig, provider);
  }
}
