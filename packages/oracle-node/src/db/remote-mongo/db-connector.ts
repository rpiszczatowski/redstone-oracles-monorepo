import { connect } from "mongoose";
import { config } from "../../config";
import loggerFactory from "../../utils/logger";

const logger = loggerFactory("connect-to-db");

export const connectToDb = async () => {
  const mongoDbUrl = config.coinbaseIndexerMongoDbUrl;

  if (!mongoDbUrl) {
    logger.info("MongoDB URL not specified, cannot connect to DB");
  } else {
    logger.info("Connecting to DB");
    await connect(mongoDbUrl);
  }
};
