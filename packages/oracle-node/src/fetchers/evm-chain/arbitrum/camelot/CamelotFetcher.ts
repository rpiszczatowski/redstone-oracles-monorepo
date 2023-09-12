import {
  PoolsConfig,
  UniswapV2LikeFetcher,
} from "../../../uniswap-v2-like/UniswapV2LikeFetcher";
import { arbitrumProvider } from "../../../../utils/blockchain-providers";

export class CamelotFetcher extends UniswapV2LikeFetcher {
  constructor(
    name: string,
    protected override readonly poolsConfig: PoolsConfig
  ) {
    super(name, poolsConfig, arbitrumProvider);
  }
}
