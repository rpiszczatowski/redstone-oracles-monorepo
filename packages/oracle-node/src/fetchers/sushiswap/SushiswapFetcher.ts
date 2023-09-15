import { DexFetcher } from "../DexFetcher";

import symbolToPairIdObj from "./sushiswap-symbol-to-pair-id.json";

const subgraphUrl =
  "https://api.thegraph.com/subgraphs/name/sushiswap/exchange";

export class SushiswapFetcher extends DexFetcher {
  constructor() {
    super("sushiswap", subgraphUrl, symbolToPairIdObj);
  }
}
