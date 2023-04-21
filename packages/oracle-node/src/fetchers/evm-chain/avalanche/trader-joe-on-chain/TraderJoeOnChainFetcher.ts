import {
  PoolsConfig,
  UniswapV2LikeFetcher,
} from "../../../uniswap-v2-like/UniswapV2LikeFetcher";
import { avalancheProvider } from "../../../../utils/blockchain-providers";

export class TraderJoeOnChainFetcher extends UniswapV2LikeFetcher {
  constructor(name: string, protected readonly poolsConfig: PoolsConfig) {
    super(name, poolsConfig, avalancheProvider);
  }
}
