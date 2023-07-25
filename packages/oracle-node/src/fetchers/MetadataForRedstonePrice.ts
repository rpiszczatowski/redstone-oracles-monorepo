import { PriceDataAfterAggregation, PriceDataFetched } from "../types";
import { VALUE_FOR_FAILED_FETCHER } from "./PricesService";
import { RedstoneTypes } from "redstone-utils";

export const createMetadataPerSource = (
  fetchedPrice: PriceDataFetched
): RedstoneTypes.MetadataPerSource => {
  const value = fetchedPrice.value?.toString() ?? VALUE_FOR_FAILED_FETCHER;

  if (fetchedPrice.metadata) {
    return {
      ...fetchedPrice.metadata,
      value,
    };
  }

  return {
    value,
  };
};

export const createMetadataForRedstonePrice = (
  price: PriceDataAfterAggregation
): RedstoneTypes.MetadataForRedstonePrice => {
  return {
    value: price.value.toString(),
    sourceMetadata: price.sourceMetadata,
  };
};
