import {
  Aggregator,
  PriceDataAfterAggregation,
  SanitizedPriceDataBeforeAggregation,
} from "../types";

export const emptyAggregator: Aggregator = {
  getAggregatedValue(
    price: SanitizedPriceDataBeforeAggregation
  ): PriceDataAfterAggregation {
    return {
      ...price,
      value: Object.values(price.source)[0],
    };
  },
};
