import { Injectable, Logger } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { HttpService } from "@nestjs/axios";
import { CronJob } from "cron";
import { DataPackagesResponse, requestDataPackages } from "redstone-sdk";
import { dataServicesToCheck } from "../../config";
import { stringifyError } from "../../shared/error-stringifier";
import { Issue, IssueDocument } from "../issues/issues.schema";
import { Metric, MetricDocument } from "../metrics/metrics.schema";

interface DataServiceConfig {
  id: string;
  checkWithoutSymbol: boolean;
  dataFeedsToCheck: string[];
  checkEachSingleUrl: boolean;
  minTimestampDiffForWarning: number;
  schedule: string;
  urls: string[];
  uniqueSignersCount: number;
}

interface CheckDataServiceInput {
  dataServiceId: string;
  dataFeedId: string;
  urls?: string[];
  uniqueSignersCount: number;
}

interface CheckSingleSourceInput {
  dataServiceId: string;
  minTimestampDiffForWarning: number;
  url: string;
  dataFeeds: string[];
  uniqueSignersCount: number;
}

interface CheckIfValidNumberOfSignaturesInput {
  dataFeedId: string;
  dataServiceId: string;
  dataPackageResponse: DataPackagesResponse;
  uniqueSignersCount: number;
  timestamp: number;
  url: string;
}

interface SaveMetricInput {
  metricName: string;
  timestampDiff: number;
  timestamp: number;
  dataServiceId: string;
  url: string;
}

interface SaveErrorInput {
  timestamp: number;
  dataServiceId: string;
  url: string;
  type: string;
  comment: string;
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
    for (const dataService of dataServicesToCheck) {
      if (dataService.checkWithoutSymbol) {
        this.startCheckingDataServiceForAllDataFeeds(dataService);
      }

      if (dataService.symbolsToCheck && dataService.symbolsToCheck.length > 0) {
        this.startCheckingDataServiceForEachDataFeed(dataService);
      }

      if (dataService.checkEachSingleUrl) {
        this.startCheckingDataServiceForEachUrl(dataService);
      }
    }
  }

  startCheckingDataServiceForAllDataFeeds = (
    dataService: DataServiceConfig
  ) => {
    Logger.log(`Starting data service checker job for: ${dataService.id}`);
    const job = new CronJob(dataService.schedule, () => {
      this.checkDataService({
        dataServiceId: dataService.id,
        urls: dataService.urls,
        dataFeedId: "___ALL_FEEDS___",
        uniqueSignersCount: dataService.uniqueSignersCount,
      });
    });
    this.schedulerRegistry.addCronJob(
      `date-service-checker-${dataService.id}`,
      job
    );
    job.start();
  };

  startCheckingDataServiceForEachDataFeed = (
    dataService: DataServiceConfig
  ) => {
    for (const dataFeedId of dataService.dataFeedsToCheck) {
      Logger.log(
        `Starting data service checker job for: ${dataService.id} with data feed: ${dataFeedId}`
      );
      const job = new CronJob(dataService.schedule, () => {
        this.checkDataService({
          dataServiceId: dataService.id,
          dataFeedId,
          urls: dataService.urls,
          uniqueSignersCount: dataService.uniqueSignersCount,
        });
      });
      this.schedulerRegistry.addCronJob(
        `date-service-checker-${dataService.id}-data-feed-${dataFeedId}`,
        job
      );
      job.start();
    }
  };

  startCheckingDataServiceForEachUrl = (dataService: DataServiceConfig) => {
    for (const url of dataService.urls) {
      Logger.log(`Starting single url checker job for: ${dataService.id}`);
      const job = new CronJob(dataService.schedule, () => {
        this.checkSingleUrl({
          dataServiceId: dataService.id,
          minTimestampDiffForWarning: dataService.minTimestampDiffForWarning,
          url,
          dataFeeds: dataService.dataFeedsToCheck,
          uniqueSignersCount: dataService.uniqueSignersCount,
        });
      });
      this.schedulerRegistry.addCronJob(
        `url-checker-${dataService.id}-${JSON.stringify(url)}`,
        job
      );
      job.start();
    }
  };

  checkDataService = async ({
    dataServiceId,
    dataFeedId,
    urls,
    uniqueSignersCount,
  }: CheckDataServiceInput) => {
    Logger.log(
      `Checking data service: ${dataServiceId}${
        dataFeedId ? " with data feed " + dataFeedId : ""
      }`
    );
    const currentTimestamp = Date.now();

    try {
      const dataPackageResponse = await requestDataPackages(
        {
          dataServiceId,
          uniqueSignersCount,
          dataFeeds: [dataFeedId],
        },
        urls
      );
      await this.checkIfValidNumberOfSignatures({
        dataFeedId,
        dataServiceId,
        dataPackageResponse,
        uniqueSignersCount,
        timestamp: currentTimestamp,
        url: JSON.stringify(urls ?? ""),
      });
    } catch (e) {
      const errStr = stringifyError(e);
      Logger.error(
        `Error occured in data service checker-job ` +
          `(${dataServiceId}-${dataFeedId}). ` +
          `Saving issue in DB: ${errStr}`
      );
      await this.saveErrorInDb({
        timestamp: currentTimestamp,
        dataServiceId,
        type: "data-service-failed",
        url: JSON.stringify(urls),
        comment: errStr,
      });
      await this.sendErrorMessageToUptimeKuma(
        dataServiceId,
        dataFeedId,
        "data-service-failed"
      );
    }
  };

  checkSingleUrl = async ({
    dataServiceId,
    minTimestampDiffForWarning,
    url,
    dataFeeds,
    uniqueSignersCount,
  }: CheckSingleSourceInput) => {
    const currentTimestamp = Date.now();
    Logger.log(
      `Checking a single url in data service: ${dataServiceId}. ` +
        `Url: ${JSON.stringify(url)}`
    );

    try {
      // Trying to fetch from redstone
      const dataPackageResponse = await requestDataPackages(
        {
          dataServiceId,
          uniqueSignersCount: uniqueSignersCount,
          dataFeeds,
        },
        [url]
      );

      for (const dataFeedId of Object.keys(dataPackageResponse)) {
        await this.checkIfValidNumberOfSignatures({
          dataFeedId,
          dataServiceId,
          dataPackageResponse,
          uniqueSignersCount,
          timestamp: currentTimestamp,
          url,
        });
        const dataPackage = dataPackageResponse[dataFeedId][0]?.dataPackage;
        if (dataPackage) {
          const { timestampMilliseconds } = dataPackage;
          const timestampDiff = currentTimestamp - timestampMilliseconds;

          // Saving metric to DB
          this.safelySaveMetricInDB({
            metricName: `timestamp-diff-${dataServiceId}-${dataFeedId}`,
            timestampDiff,
            timestamp: timestampMilliseconds,
            dataServiceId,
            url,
          });
          if (timestampDiff > minTimestampDiffForWarning) {
            Logger.warn(
              `Timestamp diff is quite big: ${timestampDiff}. Saving issue in DB`
            );
            await new this.issueModel({
              timestamp: currentTimestamp,
              type: "timestamp-diff",
              level: "WARNING",
              dataServiceId,
              url,
              timestampDiffMilliseconds: timestampDiff,
            }).save();
          }
        } else {
          Logger.error(
            `Error occurred: no data package for ${dataFeedId}. Saving issue in DB`
          );
          await this.saveErrorInDb({
            timestamp: currentTimestamp,
            dataServiceId,
            type: "no-data-package",
            url,
            comment: `No data package for ${dataFeedId}`,
          });
          await this.sendErrorMessageToUptimeKuma(
            dataServiceId,
            dataFeedId,
            "no-data-package"
          );
        }
      }
    } catch (e) {
      const errStr = stringifyError(e);
      Logger.error(`Error occurred: ${errStr}. Saving issue in DB`);
      await this.saveErrorInDb({
        timestamp: currentTimestamp,
        dataServiceId,
        type: "one-url-failed",
        url,
        comment: errStr,
      });
      await this.sendErrorMessageToUptimeKuma(
        dataServiceId,
        JSON.stringify(dataFeeds),
        "one-url-failed"
      );
    }
  };

  checkIfValidNumberOfSignatures = async ({
    dataPackageResponse,
    dataFeedId,
    dataServiceId,
    uniqueSignersCount,
    timestamp,
    url,
  }: CheckIfValidNumberOfSignaturesInput) => {
    const uniqueDataPointsCount = dataPackageResponse[dataFeedId].length;
    if (uniqueDataPointsCount !== uniqueSignersCount) {
      Logger.error(
        `Invalid number of signatures for ${dataFeedId} from ${url}. Saving issue in DB`
      );
      await this.saveErrorInDb({
        timestamp,
        dataServiceId,
        url,
        type: "invalid-signers-number",
        comment: `Invalid number of signatures for ${dataFeedId}`,
      });
      await this.sendErrorMessageToUptimeKuma(
        dataServiceId,
        dataFeedId,
        "invalid-signers-number"
      );
    }
  };

  safelySaveMetricInDB = async ({
    metricName,
    timestampDiff,
    timestamp,
    dataServiceId,
    url,
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
          dataServiceId,
          url,
        },
      }).save();
    } catch (e) {
      Logger.error(`Metric saving failed: ${stringifyError(e)}`);
    }
  };

  saveErrorInDb = async ({
    timestamp,
    dataServiceId,
    url,
    type,
    comment,
  }: SaveErrorInput) => {
    await new this.issueModel({
      timestamp,
      type,
      level: "ERROR",
      dataServiceId,
      url,
      comment,
    }).save();
  };

  sendErrorMessageToUptimeKuma = async (
    dataServiceId: string,
    symbol: string,
    type: string
  ) => {
    const uptimeKumaUrl = this.configService.get("UPTIME_KUMA_URL");
    const uptimeKumaUrlWithMessage = `${uptimeKumaUrl}&msg=${dataServiceId}-${symbol}-${type}`;
    if (uptimeKumaUrl) {
      await this.httpService.axiosRef.get(uptimeKumaUrlWithMessage);
    }
  };
}
