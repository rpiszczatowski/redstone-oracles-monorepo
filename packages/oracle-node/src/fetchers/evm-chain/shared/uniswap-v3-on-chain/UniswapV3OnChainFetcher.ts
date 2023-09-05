import { providers } from "ethers";
import { UniswapV3LikeFetcher } from "../../../uniswap-v3-like/UniswapV3LikeFetcher";
import UniswapV3Pool from "./UniswapV3Pool.abi.json";
import UniswapV3Quoter from "./UniswapV3Quoter.abi.json";
import { PoolsConfig } from "../../../uniswap-v3-like/types";

export class UniswapV3OnChainFetcher extends UniswapV3LikeFetcher {
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
        poolAbi: UniswapV3Pool.abi,
        quoterAbi: UniswapV3Quoter.abi,
      },
      {
        quoteFunctionName: "quoteExactInputSingle",
        slot0FunctionName: "slot0",
      }
    );
  }
}
