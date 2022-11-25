import process from "node:process";
import { Consola } from "consola";

const logger = require("./logger")("index") as Consola;

export const handleExceptions = async (
  promise: () => Promise<any>
): Promise<void> => {
  try {
    await promise();
  } catch (error: any) {
    logger.warn(
      `Caught unhandled promise in try/catch, stack: ${error.stack}. Running promise once again.`
    );
    await handleExceptions(promise);
  }

  // Any error not connected with promises
  process.on("uncaughtException", async (reason) => {
    logger.warn(
      `Uncaught exception in process, reason: ${reason}. Running promise once again.`
    );
    await handleExceptions(promise);
  });

  // Empty event loop
  process.on("beforeExit", async () => {
    logger.warn("Caught before exit event. Running promise once again.");
    await handleExceptions(promise);
  });

  // Every rejected promise should be caught in try/catch
  process.on("unhandledRejection", async (reason) => {
    logger.warn(
      `Unhandled promise in process, reason: ${reason}. Running promise once again.`
    );
    await handleExceptions(promise);
  });
};
