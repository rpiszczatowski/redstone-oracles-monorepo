import { PriceDataAfterAggregation } from "../types";
import PricesService from "./../fetchers/PricesService";

export interface AggregatedPriceHandler {
  handle(
    aggregatedPrices: PriceDataAfterAggregation[],
    pricesService: PricesService
  ): Promise<void>;
}
