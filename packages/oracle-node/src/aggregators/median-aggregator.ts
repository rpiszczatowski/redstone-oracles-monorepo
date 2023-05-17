import { ISafeNumber } from "../numbers/ISafeNumber";
import { createSafeNumber } from "../numbers/SafeNumberFactory";
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
      value: getMedianValue(Object.values(price.source)),
    };
  },
};

export function getMedianValue(arr: ISafeNumber[]): ISafeNumber {
  if (arr.length === 0) {
    throw new Error("Cannot get median value of an empty array");
  }

  arr = arr.sort((a, b) => createSafeNumber(a).sub(b).unsafeToNumber());

  const middle = Math.floor(arr.length / 2);

  if (arr.length % 2 === 0) {
    return arr[middle].add(arr[middle - 1]).div(2);
  } else {
    return arr[middle];
  }
}

export default medianAggregator;
