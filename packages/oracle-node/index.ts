import { config } from "./src/config";
import NodeRunner from "./src/NodeRunner";
import { closeLocalLevelDB, setupLocalDb } from "./src/db/local-db";
import Decimal from "decimal.js";
import loggerFactory from "./src/utils/logger";

Decimal.set({ toExpPos: 9e15 });

const logger = loggerFactory("index");

async function start() {
  try {
    await main();
  } catch (e) {
    logger.error((e as Error).stack);
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

// eslint-disable-next-line @typescript-eslint/no-floating-promises
start();

export = {};

process.on("beforeExit", () => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  closeLocalLevelDB();
});
