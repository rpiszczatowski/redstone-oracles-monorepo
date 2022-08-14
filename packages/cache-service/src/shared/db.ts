import mongoose from "mongoose";
import config from "../config";

export const connectToMongo = async () => {
  await mongoose.connect(config.mongoDbUrl);
  setupExitHandlers();
  console.log("Connected to MongoDB");
};

export const disconnectFromMongo = async () => {
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
};

const setupExitHandlers = () => {
  process.on("beforeExit", async () => {
    await disconnectFromMongo();
  });

  process.on("SIGINT", async () => {
    await disconnectFromMongo();
    process.exit(0);
  });

  process.on("uncaughtException", async (error) => {
    await disconnectFromMongo();
    console.error("Uncaught Exception:");
    console.error(error.stack);
    process.exit(1);
  });
};
