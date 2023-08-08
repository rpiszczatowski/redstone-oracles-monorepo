import { Consola } from "consola";
import { config } from "./src/config";
import NodeRunner from "./src/NodeRunner";
import { closeLocalLevelDB, setupLocalDb } from "./src/db/local-db";
import Decimal from "decimal.js";

Decimal.set({ toExpPos: 9e15 });
const logger = require("./src/utils/logger")("index") as Consola;

async function start() {
  try {
    await main();
  } catch (e: any) {
    logger.error(e.stack);
    logger.info(
      "Please find details about the correct node launching at https://github.com/redstone-finance/redstone-node/blob/main/docs/PREPARE_ENV_VARIABLES.md"
    );
  }
}

async function main(): Promise<void> {
  const runner = await NodeRunner.create(config);
  setupLocalDb();
  await runner.run();
}

start();

export = {};

process.on("beforeExit", () => {
  closeLocalLevelDB();
});
