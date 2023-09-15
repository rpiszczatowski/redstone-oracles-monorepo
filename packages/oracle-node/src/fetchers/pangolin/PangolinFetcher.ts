import { DexFetcher } from "../DexFetcher";

const subgraphUrl =
  "https://api.thegraph.com/subgraphs/name/pangolindex/exchange";

export class PangolinFetcher extends DexFetcher {
  protected override retryForInvalidResponse: boolean = true;

  constructor(
    name: string,
    private readonly symbolToPairIdFile: string
  ) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const symbolToPairIdObj = require(symbolToPairIdFile) as {
      [symbol: string]: string;
    };
    super(name, subgraphUrl, symbolToPairIdObj);
  }
}
