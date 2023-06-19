import { AsyncTask, SimpleIntervalJob, ToadScheduler } from "toad-scheduler";
import { config } from "./config";
import { getIterationArgs } from "./get-iteration-args";
import { sendHealthcheckPing } from "./core/monitoring/send-healthcheck-ping";
import { updatePrices } from "./core/contract-interactions/update-prices";
import { getAdapterContract } from "./core/contract-interactions/get-contract";

const { relayerIterationInterval } = config;

console.log(
  `Starting contract prices updater with interval ${relayerIterationInterval}`
);

const runIteration = async () => {
  const adapterContract = getAdapterContract();
  const iterationArgs = await getIterationArgs(config, adapterContract);

  if (iterationArgs.shouldUpdatePrices) {
    if (!iterationArgs.args) {
      return console.log(iterationArgs.message);
    } else {
      await updatePrices(iterationArgs.args);
    }
  }

  await sendHealthcheckPing();
};

const task = new AsyncTask(
  "Relayer task",
  () => runIteration(),
  (error) => console.log(error.stack)
);

const job = new SimpleIntervalJob(
  { milliseconds: relayerIterationInterval, runImmediately: true },
  task,
  { preventOverrun: true }
);

const scheduler = new ToadScheduler();

scheduler.addSimpleIntervalJob(job);
