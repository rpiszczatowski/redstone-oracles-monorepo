import { SafeNumber } from "redstone-utils";
import {
  Aggregator,
  PriceDataAfterAggregation,
  SanitizedPriceDataBeforeAggregation,
} from "../types";

const medianAggregator: Aggregator = {
  getAggregatedValue(
    price: SanitizedPriceDataBeforeAggregation
  ): PriceDataAfterAggregation {
    return {
      ...price,
      value: SafeNumber.getMedian(Object.values(price.source)),
    };
  },
};

export default medianAggregator;
