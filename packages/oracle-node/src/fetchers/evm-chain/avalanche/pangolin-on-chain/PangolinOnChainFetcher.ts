import {
  PoolsConfig,
  UniswapV2LikeFetcher,
} from "../../../uniswap-v2-like/UniswapV2LikeFetcher";
import { avalancheProvider } from "../../../../utils/blockchain-providers";

export class PangolinOnChainFetcher extends UniswapV2LikeFetcher {
  constructor(
    name: string,
    protected override readonly poolsConfig: PoolsConfig
  ) {
    super(name, poolsConfig, avalancheProvider);
  }
}
