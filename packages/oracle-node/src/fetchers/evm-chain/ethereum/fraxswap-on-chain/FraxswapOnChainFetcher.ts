import {
  PoolsConfig,
  UniswapV2LikeFetcher,
} from "../../../uniswap-v2-like/UniswapV2LikeFetcher";
import { ethereumProvider } from "../../../../utils/blockchain-providers";

export class FraxswapOnChainFetcher extends UniswapV2LikeFetcher {
  constructor(name: string, protected readonly poolsConfig: PoolsConfig) {
    super(name, poolsConfig, ethereumProvider);
  }
}
