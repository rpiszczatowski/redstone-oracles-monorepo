import { Consola } from "consola";
import {
  Aggregator,
  PriceDataAfterAggregation,
  PriceDataBeforeAggregation,
} from "../types";

const medianAggregator: Aggregator = {
  getAggregatedValue(
    price: PriceDataBeforeAggregation
  ): PriceDataAfterAggregation {
    return {
      ...price,
      value: getMedianValue(Object.values(price.source)),
    };
  },
};

export function getMedianValue(arr: number[]): number {
  if (arr.length === 0) {
    throw new Error("Cannot get median value of an empty array");
  }
  if (arr.some(isNaN)) {
    throw new Error(
      "Cannot get median value of an array that contains NaN value"
    );
  }

  arr = arr.sort((a, b) => a - b);

  const middle = Math.floor(arr.length / 2);

  if (arr.length % 2 === 0) {
    return (arr[middle] + arr[middle - 1]) / 2;
  } else {
    return arr[middle];
  }
}

export default medianAggregator;
