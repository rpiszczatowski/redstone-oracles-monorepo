import axios from "axios";
import { RedstoneCommon } from "@redstone-finance/utils";

export default class TelemetrySendService {
  private metrics: string[] = [];

  private url: string;
  private auth: string;
  constructor(url: string, auth: string) {
    this.url = url;
    this.auth = auth;
  }

  queueToSendMetric(metric: string) {
    this.metrics.push(metric);
  }

  async sendMetricsBatch() {
    console.log(`Sending metrics batch: ${this.metrics.length}`);
    const requestData = this.metrics.join("\n");
    this.metrics = [];

    const requestConfig = {
      headers: {
        Authorization: `Token ${this.auth}`,
      },
    };
    try {
      await axios.post(this.url, requestData, requestConfig);
    } catch (error) {
      console.error(
        `Failed saving metric: ${RedstoneCommon.stringifyError(error)}`
      );
    }
  }
}
