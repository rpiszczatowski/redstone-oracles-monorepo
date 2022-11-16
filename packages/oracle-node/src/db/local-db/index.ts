import { Level } from "level";
import { config } from "../../config";
import { PriceDataAfterAggregation } from "../../types";

export interface PriceValueInLocalDB {
  timestamp: number;
  value: number;
}

export interface AllPriceValuesInLocalDB {
  [symbol: string]: PriceValueInLocalDB[];
}

export const db = new Level(config.levelDbLocation, {
  keyEncoding: "utf8",
  valueEncoding: "json",
});

// TODO: implement
// It should also remove old data
export const savePrices = async (prices: PriceDataAfterAggregation[]) => {};

// TODO: implement
export const getAllPrices = async (): Promise<AllPriceValuesInLocalDB> => {
  return {};
};

export default {
  db,
  savePrices,
  getAllPrices,
};
