import balancerFetchers from "../balancer/all-balancer-fetchers";
import pangolinFetchers from "../pangolin/all-pangolin-fetchers";
import { SushiswapFetcher } from "../sushiswap/SushiswapFetcher";
import { TraderJoeFetcher } from "../trader-joe/TraderJoeFetcher";
import { UniswapV3Fetcher } from "../uniswap-v3/UniswapV3Fetcher";
import { UniswapFetcher } from "../uniswap/UniswapFetcher";

export const dexesFetchers = {
  "trader-joe": new TraderJoeFetcher(),
  sushiswap: new SushiswapFetcher(),
  uniswap: new UniswapFetcher(),
  "uniswap-v3": new UniswapV3Fetcher(),
  ...pangolinFetchers,
  ...balancerFetchers,
};

export type DexesFetchers = keyof typeof dexesFetchers;
