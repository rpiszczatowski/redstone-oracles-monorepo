import { IterationContext } from "../schedulers/IScheduler";
import { PriceDataAfterAggregation } from "../types";
import PricesService from "./../fetchers/PricesService";

export interface AggregatedPriceHandler {
  handle(
    aggregatedPrices: PriceDataAfterAggregation[],
    pricesService: PricesService,
    iterationContext: IterationContext
  ): Promise<void>;
}
