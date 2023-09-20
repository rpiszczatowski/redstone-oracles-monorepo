import {
  isTelemetryEnabled,
  sendNodeTelemetry,
  trackStart,
  trackEnd,
} from "../../src/utils/performance-tracker";
import { config as nodeConfig } from "../../src/config";

describe("performance-tracker", () => {
  test("should send telemetry when valid config", async () => {
    await expect(sendNodeTelemetry()).resolves.not.toThrowError();
    expect(isTelemetryEnabled()).toBe(true);
  });

  test("should end track with sending telemetry when valid config", async () => {
    const trackingId = trackStart("testLabel");
    trackEnd(trackingId);
    expect(isTelemetryEnabled()).toBe(true);
  });

  test("should not throw error when fail to send telemetry", async () => {
    (nodeConfig as any) = {
      ...nodeConfig,
      telemetryUrl: "testUrl",
      telemetryAuthorizationToken: "testToken",
    };
    await expect(sendNodeTelemetry()).resolves.not.toThrowError();
    expect(isTelemetryEnabled()).toBe(true);
  });

  test("should end track without sending telemetry when invalid config", async () => {
    (nodeConfig as any) = {
      ...nodeConfig,
      telemetryUrl: "testUrl",
      telemetryAuthorizationToken: "testToken",
    };
    const trackingId = trackStart("testLabel");
    trackEnd(trackingId);
    expect(isTelemetryEnabled()).toBe(true);
  });

  test("should return false when no telemetry config", async () => {
    (nodeConfig as any) = {
      ...nodeConfig,
      telemetryUrl: "",
      telemetryAuthorizationToken: "",
    };
    expect(isTelemetryEnabled()).toBe(false);
  });
});
