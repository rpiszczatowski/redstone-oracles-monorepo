import yahooFinance from "yahoo-finance2";
import { QuoteSummaryResult } from "yahoo-finance2/dist/esm/src/modules/quoteSummary-iface";
import { MultiRequestFetcher } from "../MultiRequestFetcher";
import { getRequiredPropValue } from "../../utils/objects";
import symbolToId from "./yf-symbol-to-id.json";

export class YfUnofficialFetcher extends MultiRequestFetcher {
  protected retryForInvalidResponse: boolean = true;

  constructor() {
    super("yf-unofficial");
  }

  override makeRequest(dataFeedId: string): Promise<QuoteSummaryResult> {
    const symbol = getRequiredPropValue(symbolToId, dataFeedId);
    return yahooFinance.quoteSummary(symbol, {
      modules: ["price"],
    });
  }

  override extractPrice(
    dataFeedId: string,
    responses: { [datafeedId: string]: QuoteSummaryResult }
  ): number | undefined {
    const details = responses[dataFeedId];
    return details?.price?.regularMarketPrice;
  }
}
