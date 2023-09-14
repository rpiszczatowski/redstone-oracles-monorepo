import { ethers } from "ethers";
import { performance } from "perf_hooks";
import { Consola } from "consola";
import { config } from "../config";
import axios from "axios";

const logger = require("./logger")("utils/performance-tracker") as Consola;
const tasks: {
  [trackingId: string]: {
    label: string;
    startTime: number;
  };
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
  const executionTime = performance.now() - tasks[trackingId].startTime;
  const label = tasks[trackingId].label;

  // Clear the start value
  delete tasks[trackingId];

  saveMetric(label, executionTime);
}

export function sendNodeTelemetry() {
  console.log("Sending node telemetry");
  const evmPrivateKey = config.privateKeys.ethereumPrivateKey;
  const evmAddress = new ethers.Wallet(evmPrivateKey).address;

  if (isTelemetryEnabled()) {
    const measurementName = "nodeTelemetry";
    const tags = `address=${evmAddress}`;
    const fields = `dockerImageTag="${config.dockerImageTag}"`;
    sendMetric(measurementName, tags, fields);
  }
}

export function printTrackingState() {
  const tasksCount = Object.keys(tasks).length;
  logger.info(`Perf tracker tasks: ${tasksCount}`, JSON.stringify(tasks));
}

async function saveMetric(label: string, executionTime: number): Promise<void> {
  const evmPrivateKey = config.privateKeys.ethereumPrivateKey;
  const evmAddress = new ethers.Wallet(evmPrivateKey).address;
  const labelWithPrefix = `${evmAddress.slice(0, 14)}-${label}`;

  logger.info(`Metric: ${labelWithPrefix}. Value: ${executionTime}`);

  if (isTelemetryEnabled()) {
    const measurementName = "nodePerformance";
    const tags = `label=${label},address=${evmAddress}`;
    const fields = `executionTime=${executionTime}`;
    sendMetric(measurementName, tags, fields);
  }
}

async function sendMetric(
  measurementName: string,
  tags: string,
  fields: string
) {
  const requestData = `${measurementName},${tags} ${fields} ${Date.now()}`;

  const requestConfig = {
    headers: {
      Authorization: `Token ${config.telemetryAuthorizationToken}`,
    },
  };
  axios
    .post(config.telemetryUrl, requestData, requestConfig)
    .catch((e) => console.error(`Failed saving metric: ${measurementName}`, e));
}

function isTelemetryEnabled() {
  const isTelemetryEnabled =
    config.telemetryUrl !== "" && config.telemetryAuthorizationToken;
  if (!isTelemetryEnabled) {
    console.warn("Telemetry is not enabled");
  }
  return isTelemetryEnabled;
}
