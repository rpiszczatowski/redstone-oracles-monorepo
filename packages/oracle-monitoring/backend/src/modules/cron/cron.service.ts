import { Injectable, Logger } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { HttpService } from "@nestjs/axios";
import { CronJob } from "cron";
import * as redstone from "redstone-api-extended";
import {
  DataFeedId,
  DataSourcesConfig,
} from "redstone-api-extended/lib/oracle/redstone-data-feed";
import { dataFeedsToCheck } from "../../config";
import { stringifyError } from "../../shared/error-stringifier";
import { Issue, IssueDocument } from "../issues/issues.schema";
import { Metric, MetricDocument } from "../metrics/metrics.schema";
import { SourceConfig } from "redstone-api-extended/lib/oracle/fetchers/Fetcher";

interface CheckDataFeedInput {
  dataFeedId: DataFeedId;
  symbol?: string;
}

interface Input {
  dataFeedId: DataFeedId;
  minTimestampDiffForWarning: number;
  sourcesConfig: DataSourcesConfig;
}

interface SaveMetricInput {
  metricName: string;
  timestampDiff: number;
  timestamp: number;
  dataFeedId: DataFeedId;
  singleSourceConfig: SourceConfig;
}

@Injectable()
export class CronService {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    @InjectModel(Issue.name) private issueModel: Model<IssueDocument>,
    @InjectModel(Metric.name) private metricModel: Model<MetricDocument>,
    private readonly httpService: HttpService,
    private configService: ConfigService
  ) {}

  addCronJobs() {
    // Starting data feed checker jobs
    for (const dataFeed of dataFeedsToCheck) {
      // Starting job for checking whole data package fetching
      // (without specified symbol)
      if (dataFeed.checkWithoutSymbol) {
        Logger.log(`Starting data feed checker job for: ${dataFeed.id}`);
        const job = new CronJob(dataFeed.schedule, () => {
          this.checkDataFeed({
            dataFeedId: dataFeed.id as DataFeedId,
          });
        });
        this.schedulerRegistry.addCronJob(
          `date-feed-checker-${dataFeed.id}`,
          job
        );
        job.start();
      }

      // Starting jobs for each symbol checking
      if (dataFeed.symbolsToCheck && dataFeed.symbolsToCheck.length > 0) {
        for (const symbol of dataFeed.symbolsToCheck) {
          Logger.log(
            `Starting data feed checker job for: ${dataFeed.id} with symbol: ${symbol}`
          );
          const job = new CronJob(dataFeed.schedule, () => {
            this.checkDataFeed({
              dataFeedId: dataFeed.id as DataFeedId,
              symbol,
            });
          });
          this.schedulerRegistry.addCronJob(
            `date-feed-checker-${dataFeed.id}-symbol-${symbol}`,
            job
          );
          job.start();
        }
      }

      // Starting jobs for each single source
      if (dataFeed.checkEachSingleSource) {
        const dataFeedSourcesConfig =
          redstone.oracle.getDefaultDataSourcesConfig(
            dataFeed.id as DataFeedId
          );
        for (const source of dataFeedSourcesConfig.sources) {
          Logger.log(`Starting single source checker job for: ${dataFeed.id}`);
          const job = new CronJob(dataFeed.schedule, () => {
            this.checkSingleSource({
              dataFeedId: dataFeed.id as DataFeedId,
              minTimestampDiffForWarning: dataFeed.minTimestampDiffForWarning,
              sourcesConfig: {
                ...dataFeedSourcesConfig,
                sources: [source],
              },
            });
          });
          this.schedulerRegistry.addCronJob(
            `source-checker-${dataFeed.id}-${JSON.stringify(source)}`,
            job
          );
          job.start();
        }
      }
    }
  }

  checkDataFeed = async ({ dataFeedId, symbol }: CheckDataFeedInput) => {
    Logger.log(
      `Checking data feed: ${dataFeedId}${
        symbol ? " with symbol " + symbol : ""
      }`
    );
    const currentTimestamp = Date.now();

    try {
      await redstone.oracle.getFromDataFeed(dataFeedId, symbol);
    } catch (e) {
      const errStr = stringifyError(e);
      Logger.error(
        `Error occured in data feed checker-job ` +
          `(${dataFeedId}-${symbol}). ` +
          `Saving issue in DB: ${errStr}`
      );
      await new this.issueModel({
        timestamp: currentTimestamp,
        type: "data-feed-failed",
        symbol,
        level: "ERROR",
        dataFeedId,
        comment: errStr,
      }).save();
      const uptimeKumaUrl = this.configService.get("UPTIME_KUMA_URL");
      const uptimeKumaUrlWithMessage = `${uptimeKumaUrl}&msg=(${dataFeedId}-${symbol}): ${errStr}`;
      await this.httpService.axiosRef.get(uptimeKumaUrlWithMessage);
    }
  };

  checkSingleSource = async ({
    dataFeedId,
    minTimestampDiffForWarning,
    sourcesConfig,
  }: Input) => {
    const currentTimestamp = Date.now();
    const singleSourceConfig = sourcesConfig.sources[0];
    const { type, url, evmSignerAddress } = singleSourceConfig;
    const dataSourceName = `${dataFeedId}-${type}-${url}-${evmSignerAddress}`;
    Logger.log(
      `Checking a single source in data feed: ${dataFeedId}. ` +
        `Source config: ${JSON.stringify(singleSourceConfig)}`
    );

    try {
      // Trying to fetch from redstone
      const response = await redstone.oracle.get({
        ...sourcesConfig,
        maxTimestampDiffMilliseconds: 28 * 24 * 3600 * 1000, // 28 days - we don't want to raise error if data is too old
      });

      const timestampDiff = currentTimestamp - response.priceData.timestamp;

      // Saving metric to DB
      this.safelySaveMetricInDB({
        metricName: `timestamp-diff-${dataSourceName}`,
        timestampDiff,
        timestamp: response.priceData.timestamp,
        dataFeedId,
        singleSourceConfig,
      });

      if (timestampDiff > minTimestampDiffForWarning) {
        Logger.warn(
          `Timestamp diff is quite big: ${timestampDiff}. Saving issue in DB`
        );
        await new this.issueModel({
          timestamp: currentTimestamp,
          type: "timestamp-diff",
          level: "WARNING",
          dataFeedId,
          evmSignerAddress: singleSourceConfig.evmSignerAddress,
          url: singleSourceConfig.url,
          timestampDiffMilliseconds: timestampDiff,
        }).save();
      }
    } catch (e) {
      const errStr = stringifyError(e);
      Logger.error(`Error occurred: ${errStr}. Saving issue in DB`);
      await new this.issueModel({
        timestamp: currentTimestamp,
        type: "one-source-failed",
        level: "WARNING",
        dataFeedId,
        evmSignerAddress: singleSourceConfig.evmSignerAddress,
        url: singleSourceConfig.url,
        comment: errStr,
      }).save();
    }
  };

  safelySaveMetricInDB = async ({
    metricName,
    timestampDiff,
    timestamp,
    dataFeedId,
    singleSourceConfig,
  }: SaveMetricInput) => {
    try {
      Logger.log(
        `Saving metric to DB. Name: ${metricName}, Value: ${timestampDiff}`
      );
      await new this.metricModel({
        name: metricName,
        value: timestampDiff,
        timestamp,
        tags: {
          dataFeedId,
          evmSignerAddress: singleSourceConfig.evmSignerAddress,
        },
      }).save();
    } catch (e) {
      Logger.error(`Metric saving failed: ${stringifyError(e)}`);
    }
  };
}
