import { AggregatedPriceHandler } from "./AggregatedPriceHandler";
import { PriceDataAfterAggregation } from "../types";
import localDB from "../db/local-db";
import loggerFactory from "../utils/logger";

const logger = loggerFactory("runner");

// Saving prices in local db
// (they can be used for building TWAPs and checking recent deviations)
export class AggregatedPriceLocalDBSaver implements AggregatedPriceHandler {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  async handle(aggregatedPrices: PriceDataAfterAggregation[]) {
    await AggregatedPriceLocalDBSaver.savePricesInLocalDB(aggregatedPrices);
  }

  private static async savePricesInLocalDB(
    prices: PriceDataAfterAggregation[]
  ) {
    logger.info(`Saving ${prices.length} prices in local db`);
    await localDB.savePrices(prices);
    logger.info("Prices saved in local db");
  }
}
