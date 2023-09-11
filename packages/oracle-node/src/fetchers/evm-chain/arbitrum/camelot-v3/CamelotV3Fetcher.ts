import { providers } from "ethers";
import { UniswapV3LikeFetcher } from "../../../uniswap-v3-like/UniswapV3LikeFetcher";
import CamelotPoolAbi from "./CamelotPool.abi.json";
import CamelotRouterAbi from "./CamelotQuoter.abi.json";
import { PoolsConfig } from "../../../uniswap-v3-like/types";

export class CamelotV3Fetcher extends UniswapV3LikeFetcher {
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
        poolAbi: CamelotPoolAbi,
        quoterAbi: CamelotRouterAbi,
      },
      {
        quoteFunctionName: "quoteExactInputSingle",
        slot0FunctionName: "globalState",
      }
    );
  }

  protected override createQuoterParams(
    tokenIn: string,
    tokenOut: string,
    _fee: number,
    amountIn: string
  ): unknown[] {
    return [tokenIn, tokenOut, amountIn, 0];
  }
}
