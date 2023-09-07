import { providers } from "ethers";
import { UniswapV3LikeFetcher } from "../../../uniswap-v3-like/UniswapV3LikeFetcher";
import PancakeSwapPoolAbi from "./PancakeSwapPool.abi.json";
import PancakeSwapQuoterAbi from "./PancakeSwapQuoter.abi.json";
import { PoolsConfig } from "../../../uniswap-v3-like/types";

export class PancakeSwapOnChainFetcher extends UniswapV3LikeFetcher {
  constructor(
    name: string,
    poolsConfig: PoolsConfig,
    provider: providers.Provider
  ) {
    super(
      name,
      poolsConfig,
      provider,
      {
        poolAbi: PancakeSwapPoolAbi,
        quoterAbi: PancakeSwapQuoterAbi,
      },
      {
        quoteFunctionName: "quoteExactInputSingle",
        slot0FunctionName: "slot0",
      }
    );
  }
}
