import {
  isTelemetryEnabled,
  queueNodeTelemetry,
  trackStart,
  trackEnd,
} from "../../src/utils/performance-tracker";
import { config as nodeConfig } from "../../src/config";

describe("performance-tracker", () => {
  test("should queue telemetry when valid config", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (nodeConfig as any) = {
      ...nodeConfig,
      telemetryUrl: "testUrl",
      telemetryAuthorizationToken: "testToken",
    };
    await expect(queueNodeTelemetry()).resolves.not.toThrowError();
    expect(isTelemetryEnabled()).toBe(true);
  });

  test("should end track with queue telemetry when valid config", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (nodeConfig as any) = {
      ...nodeConfig,
      telemetryUrl: "testUrl",
      telemetryAuthorizationToken: "testToken",
    };
    const trackingId = trackStart("testLabel");
    trackEnd(trackingId);
    expect(isTelemetryEnabled()).toBe(true);
  });

  test("should do nothing when no telemetry config", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (nodeConfig as any) = {
      ...nodeConfig,
      telemetryUrl: "",
      telemetryAuthorizationToken: "",
    };
    await expect(queueNodeTelemetry()).resolves.not.toThrowError();
    expect(isTelemetryEnabled()).toBe(false);
  });

  test("should end track without queue telemetry when no telemetry config", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (nodeConfig as any) = {
      ...nodeConfig,
      telemetryUrl: "",
      telemetryAuthorizationToken: "",
    };
    const trackingId = trackStart("testLabel");
    trackEnd(trackingId);
    expect(isTelemetryEnabled()).toBe(false);
  });
});
