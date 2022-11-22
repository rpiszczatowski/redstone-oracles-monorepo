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

interface CheckDataServiceInput {
  dataServiceId: string;
  symbol: string;
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

interface SaveMetricInput {
  metricName: string;
  timestampDiff: number;
  timestamp: number;
  dataServiceId: string;
  url: string;
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
    // Starting data service checker jobs
    for (const dataService of dataServicesToCheck) {
      // Starting job for checking whole data package fetching
      // (without specified symbol)
      if (dataService.checkWithoutSymbol) {
        Logger.log(`Starting data service checker job for: ${dataService.id}`);
        const job = new CronJob(dataService.schedule, () => {
          this.checkDataService({
            dataServiceId: dataService.id,
            urls: dataService.urls,
            symbol: "___ALL_FEEDS___",
            uniqueSignersCount: dataService.uniqueSignersCount,
          });
        });
        this.schedulerRegistry.addCronJob(
          `date-service-checker-${dataService.id}`,
          job
        );
        job.start();
      }

      // Starting jobs for each symbol checking
      if (dataService.symbolsToCheck && dataService.symbolsToCheck.length > 0) {
        for (const symbol of dataService.symbolsToCheck) {
          Logger.log(
            `Starting data service checker job for: ${dataService.id} with symbol: ${symbol}`
          );
          const job = new CronJob(dataService.schedule, () => {
            this.checkDataService({
              dataServiceId: dataService.id,
              symbol,
              urls: dataService.urls,
              uniqueSignersCount: dataService.uniqueSignersCount,
            });
          });
          this.schedulerRegistry.addCronJob(
            `date-service-checker-${dataService.id}-symbol-${symbol}`,
            job
          );
          job.start();
        }
      }

      // Starting jobs for each single url
      if (dataService.checkEachSingleUrl) {
        for (const url of dataService.urls) {
          Logger.log(`Starting single url checker job for: ${dataService.id}`);
          const job = new CronJob(dataService.schedule, () => {
            this.checkSingleUrl({
              dataServiceId: dataService.id,
              minTimestampDiffForWarning:
                dataService.minTimestampDiffForWarning,
              url,
              dataFeeds: dataService.symbolsToCheck,
              uniqueSignersCount: dataService.uniqueSignersCount,
            });
          });
          this.schedulerRegistry.addCronJob(
            `url-checker-${dataService.id}-${JSON.stringify(url)}`,
            job
          );
          job.start();
        }
      }
    }
  }

  checkDataService = async ({
    dataServiceId,
    symbol,
    urls,
    uniqueSignersCount,
  }: CheckDataServiceInput) => {
    Logger.log(
      `Checking data service: ${dataServiceId}${
        symbol ? " with symbol " + symbol : ""
      }`
    );
    const currentTimestamp = Date.now();

    try {
      const dataPackageResponse = await requestDataPackages(
        {
          dataServiceId,
          uniqueSignersCount,
          dataFeeds: [symbol],
        },
        urls
      );
      await this.checkIfValidNumberOfSignatures(
        symbol,
        dataServiceId,
        dataPackageResponse,
        uniqueSignersCount,
        currentTimestamp,
        urls
      );
    } catch (e) {
      const errStr = stringifyError(e);
      Logger.error(
        `Error occured in data service checker-job ` +
          `(${dataServiceId}-${symbol}). ` +
          `Saving issue in DB: ${errStr}`
      );
      await this.safeErrorInDbAndSend(
        currentTimestamp,
        dataServiceId,
        "data-service-failed",
        JSON.stringify(urls),
        errStr,
        symbol
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
      const response = await requestDataPackages(
        {
          dataServiceId,
          uniqueSignersCount: uniqueSignersCount,
          dataFeeds,
        },
        [url]
      );

      for (const dataFeedId of Object.keys(response)) {
        await this.checkIfValidNumberOfSignatures(
          dataFeedId,
          dataServiceId,
          response,
          uniqueSignersCount,
          currentTimestamp,
          url
        );
        const dataPackage = response[dataFeedId][0]?.dataPackage;
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
          await this.safeErrorInDbAndSend(
            currentTimestamp,
            dataServiceId,
            "no-data-package",
            url,
            `No data package for ${dataFeedId}`,
            dataFeedId
          );
        }
      }
    } catch (e) {
      const errStr = stringifyError(e);
      Logger.error(`Error occurred: ${errStr}. Saving issue in DB`);
      await this.safeErrorInDbAndSend(
        currentTimestamp,
        dataServiceId,
        "one-url-failed",
        url,
        errStr,
        JSON.stringify(dataFeeds)
      );
    }
  };

  checkIfValidNumberOfSignatures = async (
    dataFeedId: string,
    dataServiceId: string,
    dataPackageResponse: DataPackagesResponse,
    uniqueSignersCount: number,
    timestamp: number,
    urls?: string | string[]
  ) => {
    const uniqueDataPointsCount = dataPackageResponse[dataFeedId].length;
    if (uniqueDataPointsCount !== uniqueSignersCount) {
      Logger.error(
        `Invalid number of signatures for ${dataFeedId} from ${JSON.stringify(
          urls
        )}. Saving issue in DB`
      );
      await this.safeErrorInDbAndSend(
        timestamp,
        dataServiceId,
        "invalid-signers-number",
        JSON.stringify(urls),
        `Invalid number of signatures for ${dataFeedId}`,
        dataFeedId
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

  safeErrorInDbAndSend = async (
    timestamp: number,
    dataServiceId: string,
    url: string,
    type: string,
    comment: string,
    dataFeedId: string
  ) => {
    await new this.issueModel({
      timestamp,
      type,
      level: "ERROR",
      dataServiceId,
      url,
      comment,
    }).save();
    await this.sendErrorMessageToUptimeKuma(dataServiceId, dataFeedId, type);
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
