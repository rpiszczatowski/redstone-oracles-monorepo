import mongoose from "mongoose";
import { Logger } from "@nestjs/common";
import { mongoDbUrl } from "../config";

export const connectToRemoteMongo = async () => {
  await mongoose.connect(mongoDbUrl);
  subscribeMonitoringExit();
  Logger.log("Connected to MongoDB");
};

const subscribeMonitoringExit = () => {
  process.on("beforeExit", async () => {
    await disconnectFromRemoteMongo();
  });

  process.on("SIGINT", async () => {
    await disconnectFromRemoteMongo();
    process.exit(0);
  });

  process.on("uncaughtException", async (error) => {
    await disconnectFromRemoteMongo();
    Logger.error("Uncaught Exception:");
    Logger.error(error.stack);
    process.exit(1);
  });
};

export const disconnectFromRemoteMongo = async () => {
  await mongoose.disconnect();
  Logger.log("Disconnected from MongoDB");
};
