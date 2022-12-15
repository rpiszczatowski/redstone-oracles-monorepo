import { Consola } from "consola";
import NodeRunnerOld from "./src/NodeRunnerOld";
import { config } from "./src/config";
import NodeRunner from "./src/NodeRunner";
import { closeLocalLevelDB, setupLocalDb } from "./src/db/local-db";

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
  const SelectedNodeRunner = config.useNewSigningAndBroadcasting
    ? NodeRunner
    : NodeRunnerOld;
  const runner = await SelectedNodeRunner.create(config);
  setupLocalDb();
  await runner.run();
}

start();

export = {};

process.on("beforeExit", () => {
  closeLocalLevelDB();
});
