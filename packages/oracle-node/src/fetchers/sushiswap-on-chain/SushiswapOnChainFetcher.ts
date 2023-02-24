import {
  PoolsConfig,
  UniswapV2LikeFetcher,
} from "../uniswapV2Like/UniswapV2LikeFetcher";

export class SushiswapFetcher extends UniswapV2LikeFetcher {
  constructor(name: string, private readonly poolConfig: PoolsConfig) {
    super(name, poolConfig);
  }
}
