import { providers } from "ethers";
import { UniswapV3LikeFetcher } from "../../../uniswap-v3-like/UniswapV3LikeFetcher";
import CamelotPoolAbi from "./CamelotPool.abi.json";
import CamelotRouterAbi from "./CamelotRouter.abi.json";
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
        buyFunctionName: "exactInputSingle",
        sellFunctionName: "exactOutputSingle",
        slot0FunctionName: "globalState",
      }
    );
  }
}
