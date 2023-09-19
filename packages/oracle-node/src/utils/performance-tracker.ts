import { ethers } from "ethers";
import { performance } from "perf_hooks";
import { config } from "../config";
import axios from "axios";
import loggerFactory from "./logger";
import git from "git-last-commit";
import { RedstoneCommon } from "@redstone-finance/utils";
import TelemetrySendService from "../telemetry/TelemetrySendService";

const logger = loggerFactory("utils/performance-tracker");
const telemetrySendService = new TelemetrySendService();

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

  saveMetric(label, executionTime);
}

export async function sendNodeTelemetry() {
  if (isTelemetryEnabled()) {
    logger.info("Sending node telemetry");
    const evmPrivateKey = config.privateKeys.ethereumPrivateKey;
    const evmAddress = new ethers.Wallet(evmPrivateKey).address;
    const dockerImageTag = await getCommitShortHash();
    const measurementName = "nodeTelemetry";
    const tags = `address=${evmAddress}`;
    const fields = `dockerImageTag="${dockerImageTag}"`;
    const metric = `${measurementName},${tags} ${fields} ${Date.now()}`;
    sendMetric(metric);
    telemetrySendService.sendMetricsBatch();
  }
}

export function isTelemetryEnabled() {
  return config.telemetryUrl !== "" && config.telemetryAuthorizationToken;
}

export function printTrackingState() {
  const tasksCount = Object.keys(tasks).length;
  logger.info(`Perf tracker tasks: ${tasksCount}`, JSON.stringify(tasks));
}

function saveMetric(label: string, executionTime: number) {
  const evmPrivateKey = config.privateKeys.ethereumPrivateKey;
  const evmAddress = new ethers.Wallet(evmPrivateKey).address;
  const labelWithPrefix = `${evmAddress.slice(0, 14)}-${label}`;

  logger.info(`Metric: ${labelWithPrefix}. Value: ${executionTime}`);

  if (isTelemetryEnabled()) {
    const measurementName = "nodePerformance";
    const tags = `label=${label},address=${evmAddress}`;
    const fields = `executionTime=${executionTime}`;
    const metric = `${measurementName},${tags} ${fields} ${Date.now()}`;
    sendMetric(metric);
  }
}

async function sendMetric(metric: string) {
  telemetrySendService.queueToSendMetric(metric);
  const requestConfig = {
    headers: {
      Authorization: `Token ${config.telemetryAuthorizationToken}`,
    },
  };
  try {
    await axios.post(config.telemetryUrl, metric, requestConfig);
  } catch (error) {
    logger.error(
      `Failed saving metric: ${RedstoneCommon.stringifyError(error)}`
    );
  }
}

function getCommitShortHash(): Promise<string> {
  return new Promise((resolve) =>
    git.getLastCommit((err: Error | null, commit) => {
      if (err) {
        logger.error(err);
        throw err;
      } else {
        return resolve(commit.hash.slice(0, 8));
      }
    })
  );
}
