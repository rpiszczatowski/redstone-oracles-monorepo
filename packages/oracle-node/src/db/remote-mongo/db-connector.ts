import { Consola } from "consola";
import { connect } from "mongoose";
import { config } from "../../config";

const logger = require("../../utils/logger")("connect-to-db") as Consola;

export const connectToDb = async () => {
  const mongoDbUrl = config.coinbaseIndexerMongoDbUrl;

  if (!mongoDbUrl) {
    logger.info("MongoDB URL not specified, cannot connect to DB");
  } else {
    logger.info("Connecting to DB");
    await connect(mongoDbUrl);
  }
};
