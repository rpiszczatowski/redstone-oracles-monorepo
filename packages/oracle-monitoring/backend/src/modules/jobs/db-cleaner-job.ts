import { Model } from "mongoose";
import { Logger } from "@nestjs/common";
import { Issue } from "../issues/issues.model";
import { Metric } from "../metrics/metrics.model";
import { dbTtlInDays } from "../../config";

const ONE_DAY_IN_MILLISECONDS = 3600 * 1000 * 24;

export const execute = async () => {
  Logger.log(`Cleaning records older than ${dbTtlInDays} from db`);
  const currentTimestamp = Date.now();
  const toTimestamp = currentTimestamp - dbTtlInDays * ONE_DAY_IN_MILLISECONDS;
  const removedCount = await removeRecordsOfEachModel(toTimestamp);
  const { metrics, issues, mails } = removedCount;
  Logger.log(`Removed: ${metrics} metrics, ${issues} issues, ${mails} mails`);
};

const removeRecordsOfEachModel = async (toTimestamp: number) => {
  const removedModelsCount = {
    metrics: 0,
    issues: 0,
    mails: 0,
  };
  for (const model of [Metric, Issue]) {
    const removedCount = await removeOldRecordsForModel(model, toTimestamp);
    removedModelsCount[
      model.collection.collectionName as keyof typeof removedModelsCount
    ] = removedCount;
  }
  return removedModelsCount;
};

export const removeOldRecordsForModel = async (
  model: Model<any>,
  toTimestamp: number
) => {
  const deleteResult = await model.deleteMany({
    timestamp: {
      $lte: toTimestamp,
    },
  });
  return deleteResult.deletedCount;
};
