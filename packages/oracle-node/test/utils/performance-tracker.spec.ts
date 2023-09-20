import {
  isTelemetryEnabled,
  queueNodeTelemetry,
  trackStart,
  trackEnd,
} from "../../src/utils/performance-tracker";
import { config as nodeConfig } from "../../src/config";

describe("performance-tracker", () => {
  test("should queue telemetry when valid config", async () => {
    await expect(queueNodeTelemetry()).resolves.not.toThrowError();
    expect(isTelemetryEnabled()).toBe(true);
  });

  test("should end track with queue telemetry when valid config", () => {
    const trackingId = trackStart("testLabel");
    trackEnd(trackingId);
    expect(isTelemetryEnabled()).toBe(true);
  });

  test("should not throw error when fail to send telemetry", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (nodeConfig as any) = {
      ...nodeConfig,
      telemetryUrl: "testUrl",
      telemetryAuthorizationToken: "testToken",
    };
    await expect(queueNodeTelemetry()).resolves.not.toThrowError();
    expect(isTelemetryEnabled()).toBe(true);
  });

  test("should end track without queue telemetry when invalid config", () => {
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

  test("should return false when no telemetry config", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (nodeConfig as any) = {
      ...nodeConfig,
      telemetryUrl: "",
      telemetryAuthorizationToken: "",
    };
    expect(isTelemetryEnabled()).toBe(false);
  });
});
