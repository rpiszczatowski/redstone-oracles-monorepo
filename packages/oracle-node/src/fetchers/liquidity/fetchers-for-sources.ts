import { PangolinFetcher } from "../pangolin/PangolinFetcher";
import { SushiswapFetcher } from "../sushiswap/SushiswapFetcher";
import { TraderJoeFetcher } from "../trader-joe/TraderJoeFetcher";
import { UniswapFetcher } from "../uniswap/UniswapFetcher";

export const dexFetchersForSources = {
  sushiswap: new SushiswapFetcher(),
  uniswap: new UniswapFetcher(),
  "pangolin-wavax": new PangolinFetcher(
    "pangolin-wavax",
    "../pangolin/symbol-to-pair-id/pangolin-wavax-symbol-to-pair-id.json"
  ),
  "pangolin-usdc": new PangolinFetcher(
    "pangolin-usdc",
    "../pangolin/symbol-to-pair-id/pangolin-usdc-symbol-to-pair-id.json"
  ),
  "trader-joe": new TraderJoeFetcher(),
};
