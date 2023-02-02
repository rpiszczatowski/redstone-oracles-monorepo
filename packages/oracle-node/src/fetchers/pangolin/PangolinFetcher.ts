import { DexFetcher } from "../DexFetcher";

const subgraphUrl =
  "https://api.thegraph.com/subgraphs/name/pangolindex/exchange";

export class PangolinFetcher extends DexFetcher {
  protected retryForInvalidResponse: boolean = true;

  constructor(name: string, private readonly symbolToPairIdFile: string) {
    const symbolToPairIdObj: {
      [symbol: string]: string;
    } = require(symbolToPairIdFile);
    super(name, subgraphUrl, symbolToPairIdObj);
  }
}
