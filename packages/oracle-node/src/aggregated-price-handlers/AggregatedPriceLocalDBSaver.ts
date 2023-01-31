import { AggregatedPriceHandler } from "./AggregatedPriceHandler";
import { Consola } from "consola";
import { PriceDataAfterAggregation } from "../types";
import localDB from "../db/local-db";
const logger = require("../utils/logger")("runner") as Consola;

// Saving prices in local db
// (they can be used for building TWAPs and checking recent deviations)
export class AggregatedPriceLocalDBSaver implements AggregatedPriceHandler {
  async handle(aggregatedPrices: PriceDataAfterAggregation[]) {
    await this.savePricesInLocalDB(aggregatedPrices);
  }

  private async savePricesInLocalDB(prices: PriceDataAfterAggregation[]) {
    logger.info(`Saving ${prices.length} prices in local db`);
    await localDB.savePrices(prices);
    logger.info("Prices saved in local db");
  }
}
