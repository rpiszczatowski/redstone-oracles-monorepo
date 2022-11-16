import { Level } from "level";
import { config } from "../../config";
import { PriceDataAfterAggregation } from "../../types";

export const db = new Level(config.levelDbLocation, {
  keyEncoding: "utf8",
  valueEncoding: "json",
});

// TODO: implement
export const savePrices = async (prices: PriceDataAfterAggregation[]) => {};

export default {
  db,
  savePrices,
};
