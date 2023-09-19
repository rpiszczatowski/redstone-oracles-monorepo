export default class TelemetrySendService {
  private metrics: string[] = [];

  queueToSendMetric(metric: string) {
    console.log("Sending metric");
    this.metrics.push(metric);
  }

  sendMetricsBatch() {
    console.log("Sending batch");
    console.log(this.metrics);
    this.metrics = [];
  }
}
