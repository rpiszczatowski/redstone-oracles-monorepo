import { ethers } from "ethers";
import { performance } from "perf_hooks";
import { config } from "../config";
import loggerFactory from "./logger";
import { telemetrySendService } from "../telemetry/TelemetrySendService";

const logger = loggerFactory("utils/performance-tracker");

const tasks: {
  [trackingId: string]:
    | {
        label: string;
        startTime: number;
      }
    | undefined;
} = {};

export function trackStart(label: string): string {
  if (label === "") {
    throw new Error("Label cannot be empty");
  }

  const trackingId = `${label}-${String(performance.now())}`;

  if (tasks[trackingId] !== undefined) {
    logger.warn(
      `Tracking id "${trackingId}" is already being used. Label: "${label}"`
    );
  } else {
    tasks[trackingId] = {
      label,
      startTime: performance.now(),
    };
  }

  return trackingId;
}

export function trackEnd(trackingId: string): void {
  if (trackingId === "") {
    throw new Error("Tracking id cannot be empty");
  }

  if (tasks[trackingId] === undefined) {
    logger.warn(
      `Cannot execute trackEnd for ${trackingId} without trackStart calling`
    );
    return;
  }

  // Calculating time elapsed from the task trackStart
  // execution for the same label
  const executionTime = performance.now() - tasks[trackingId]!.startTime;
  const label = tasks[trackingId]!.label;

  // Clear the start value
  delete tasks[trackingId];

  queueNodePerformanceMetric(label, executionTime);
}

export function queueNodeTelemetry() {
  try {
    if (isTelemetryEnabled()) {
      logger.info("Sending node telemetry");
      const evmPrivateKey = config.privateKeys.ethereumPrivateKey;
      const evmAddress = ethers.utils.computeAddress(evmPrivateKey);
      const dockerImageTag = config.dockerImageTag;
      const measurementName = "nodeTelemetry";
      const tags = `address=${evmAddress}`;
      const fields = `dockerImageTag="${dockerImageTag}"`;
      const metric = `${measurementName},${tags} ${fields} ${Date.now()}`;
      telemetrySendService.queueToSendMetric(metric);
    }
  } catch (error) {
    logger.error(`Queue node telemetry failed`, (error as Error).stack);
  }
}

export function isTelemetryEnabled() {
  return (
    config.telemetryUrl !== "" && config.telemetryAuthorizationToken !== ""
  );
}

export function printTrackingState() {
  const tasksCount = Object.keys(tasks).length;
  logger.info(`Perf tracker tasks: ${tasksCount}`, JSON.stringify(tasks));
}

function queueNodePerformanceMetric(label: string, executionTime: number) {
  try {
    const evmPrivateKey = config.privateKeys.ethereumPrivateKey;
    const evmAddress = ethers.utils.computeAddress(evmPrivateKey);
    const labelWithPrefix = `${evmAddress.slice(0, 14)}-${label}`;

    logger.info(`Metric: ${labelWithPrefix}. Value: ${executionTime}`);

    if (isTelemetryEnabled()) {
      const measurementName = "nodePerformance";
      const tags = `label=${label},address=${evmAddress}`;
      const fields = `executionTime=${executionTime}`;
      const metric = `${measurementName},${tags} ${fields} ${Date.now()}`;
      telemetrySendService.queueToSendMetric(metric);
    }
  } catch (error) {
    logger.error(
      `Queue node performance metric failed`,
      (error as Error).stack
    );
  }
}
