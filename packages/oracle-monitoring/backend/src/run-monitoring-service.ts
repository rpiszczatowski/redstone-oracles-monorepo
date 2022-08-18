import schedule from "node-schedule";
import redstone from "redstone-api-extended";
import { DataFeedId } from "redstone-api-extended/lib/oracle/redstone-data-feed";
import { Logger } from "@nestjs/common";
import { execute as executeDataFeedCheckerJob } from "./modules/jobs/data-feed-checker-job";
import { execute as executeSingleSourceCheckerJob } from "./modules/jobs/single-source-checker-job";
import { connectToRemoteMongo } from "./shared/db-connector";
import { dataFeedsToCheck } from "./config";

export function runMonitoringService() {
  // Connect to mongoDB
  Logger.log("Connecting to MongoDB");
  connectToRemoteMongo();

  // Starting data feed checker jobs
  for (const dataFeed of dataFeedsToCheck) {
    // Starting job for checking whole data package fetching
    // (without specified symbol)
    if (dataFeed.checkWithoutSymbol) {
      Logger.log(`Starting data feed checker job for: ${dataFeed.id}`);
      schedule.scheduleJob(dataFeed.schedule, () =>
        executeDataFeedCheckerJob({
          dataFeedId: dataFeed.id as DataFeedId,
        })
      );
    }

    // Starting jobs for each symbol checking
    if (dataFeed.symbolsToCheck && dataFeed.symbolsToCheck.length > 0) {
      for (const symbol of dataFeed.symbolsToCheck) {
        Logger.log(
          `Starting data feed checker job for: ${dataFeed.id} with symbol: ${symbol}`
        );
        schedule.scheduleJob(dataFeed.schedule, () =>
          executeDataFeedCheckerJob({
            dataFeedId: dataFeed.id as DataFeedId,
            symbol,
          })
        );
      }
    }

    // Starting jobs for each single source
    if (dataFeed.checkEachSingleSource) {
      const dataFeedSourcesConfig = redstone.oracle.getDefaultDataSourcesConfig(
        dataFeed.id as DataFeedId
      );
      for (const source of dataFeedSourcesConfig.sources) {
        Logger.log(`Starting single source checker job for: ${dataFeed.id}`);
        schedule.scheduleJob(dataFeed.schedule, () =>
          executeSingleSourceCheckerJob({
            dataFeedId: dataFeed.id as DataFeedId,
            minTimestampDiffForWarning: dataFeed.minTimestampDiffForWarning,
            sourcesConfig: {
              ...dataFeedSourcesConfig,
              sources: [source],
            },
          })
        );
      }
    }
  }
}
