import { config } from "../config";
import axios from "axios";
import loggerFactory from "../utils/logger";
import { RedstoneCommon } from "@redstone-finance/utils";

const logger = loggerFactory("telemetry/TelemetrySendService");

export default class TelemetrySendService {
  private static instance: TelemetrySendService | undefined;
  private metrics: string[] = [];

  private constructor() {}

  static getInstance(): TelemetrySendService {
    if (!TelemetrySendService.instance) {
      TelemetrySendService.instance = new TelemetrySendService();
    }
    return TelemetrySendService.instance;
  }

  queueToSendMetric(metric: string) {
    this.metrics.push(metric);
  }

  async sendMetricsBatch() {
    logger.info(`Sending batch with ${this.metrics.length} metrics`);
    const requestData = this.metrics.join("\n");
    this.metrics = [];

    const requestConfig = {
      headers: {
        Authorization: `Token ${config.telemetryAuthorizationToken}`,
      },
    };
    try {
      await axios.post(config.telemetryUrl, requestData, requestConfig);
    } catch (error) {
      logger.error(
        `Failed saving metric: ${RedstoneCommon.stringifyError(error)}`
      );
    }
  }
}
