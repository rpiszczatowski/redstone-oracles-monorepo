import axios from "axios";

export default class TelemetrySendService {
  private metrics: string[] = [];

  private url: string;
  private auth: string;
  constructor(url: string, auth: string) {
    this.url = url;
    this.auth = auth;
  }

  queueToSendMetric(metric: string) {
    console.log("QUQUQUQU");
    this.metrics.push(metric);
  }

  async sendMetricsBatch() {
    console.log("LENGTHHHHH");
    console.log(this.metrics.length);
    const requestData = this.metrics.join("\n");
    console.log(requestData);
    this.metrics = [];

    const requestConfig = {
      headers: {
        Authorization: `Token ${this.auth}`,
      },
    };
    try {
      await axios.post(this.url, requestData, requestConfig);
    } catch (error) {
      console.log("AXIOS ERROR");
      console.log(error);
      console.log(this.url);
      console.log(this.auth);
    }
  }
}
